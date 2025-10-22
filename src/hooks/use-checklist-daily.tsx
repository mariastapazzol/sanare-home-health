import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTodayKeyFromServer, millisToNextMidnight } from '@/lib/checklist-utils';
import { useAuth } from '@/hooks/use-auth';

export interface ChecklistItem {
  id: string;
  item_id: string;
  nome: string;
  horario: string;
  checked: boolean;
  inactive: boolean;
  tipo: 'medicamento' | 'lembrete';
}

export function useChecklistDaily() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayKey, setTodayKey] = useState<string>('');

  const loadChecklist = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const serverDate = await getTodayKeyFromServer();
      setTodayKey(serverDate);

      // Buscar medicamentos do usuário
      const { data: medicamentos } = await supabase
        .from('medicamentos')
        .select('id, nome, horarios')
        .eq('user_id', user.id);

      // Buscar lembretes do usuário
      const { data: lembretes } = await supabase
        .from('lembretes')
        .select('id, nome, horarios, datas')
        .eq('user_id', user.id);

      // Criar lista de itens expandidos
      const medItems: ChecklistItem[] = [];
      (medicamentos || []).forEach((med: any) => {
        const horarios = Array.isArray(med.horarios) ? med.horarios : [];
        horarios.forEach((h: string) => {
          medItems.push({
            id: `med-${med.id}-${h}`,
            item_id: med.id,
            nome: med.nome,
            horario: h,
            checked: false,
            inactive: false,
            tipo: 'medicamento'
          });
        });
      });

      const lemItems: ChecklistItem[] = [];
      (lembretes || []).forEach((lem: any) => {
        const horarios = Array.isArray(lem.horarios) ? lem.horarios : [];
        const datas = Array.isArray(lem.datas) ? lem.datas : [];
        
        if (datas.length === 0 || datas.includes(serverDate)) {
          horarios.forEach((h: string) => {
            lemItems.push({
              id: `lem-${lem.id}-${h}`,
              item_id: lem.id,
              nome: lem.nome,
              horario: h,
              checked: false,
              inactive: false,
              tipo: 'lembrete'
            });
          });
        }
      });

      const allItems = [...medItems, ...lemItems];

      // Buscar status do dia atual
      const { data: statusData } = await supabase
        .from('checklist_daily_status')
        .select('*')
        .eq('user_id', user.id)
        .eq('day', serverDate);

      // Mesclar com status existente
      const finalItems = allItems.map(item => {
        const status = (statusData || []).find((s: any) => 
          s.item_id === item.item_id && 
          s.horario === item.horario && 
          s.item_type === item.tipo
        );
        return {
          ...item,
          checked: status?.checked ?? false,
          inactive: status?.inactive ?? false
        };
      });

      // Ordenar por horário
      finalItems.sort((a, b) => {
        const [ha, ma] = a.horario.split(':').map(Number);
        const [hb, mb] = b.horario.split(':').map(Number);
        return (ha * 60 + ma) - (hb * 60 + mb);
      });

      setItems(finalItems);
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateItemStatus = useCallback(async (itemId: string, field: 'checked' | 'inactive', value: boolean) => {
    if (!user) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Atualização otimista na UI
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, [field]: value } : i
    ));

    try {
      // Upsert no banco
      const { error } = await supabase
        .from('checklist_daily_status')
        .upsert({
          user_id: user.id,
          item_id: item.item_id,
          item_type: item.tipo,
          day: todayKey,
          horario: item.horario,
          checked: field === 'checked' ? value : item.checked,
          inactive: field === 'inactive' ? value : item.inactive,
        }, {
          onConflict: 'user_id,day,item_id,item_type,horario'
        });

      if (error) throw error;

      // Se marcou como tomado um medicamento, reduzir estoque
      if (field === 'checked' && value && item.tipo === 'medicamento') {
        const { data: med } = await supabase
          .from('medicamentos')
          .select('quantidade_atual, quantidade_por_dose')
          .eq('id', item.item_id)
          .single();

        if (med && med.quantidade_atual > 0) {
          const novaQtd = Math.max(0, med.quantidade_atual - (med.quantidade_por_dose || 1));
          
          await supabase
            .from('medicamentos')
            .update({ quantidade_atual: novaQtd })
            .eq('id', item.item_id);

          await supabase.from('movimentacoes_estoque').insert({
            medicamento_id: item.item_id,
            user_id: user.id,
            tipo: 'saida',
            quantidade: med.quantidade_por_dose || 1,
            nota: `Tomado via checklist: ${item.horario}`
          });
        }
      }

      // Se desmarcou, reverter estoque
      if (field === 'checked' && !value && item.tipo === 'medicamento') {
        const { data: med } = await supabase
          .from('medicamentos')
          .select('quantidade_atual, quantidade_por_dose')
          .eq('id', item.item_id)
          .single();

        if (med) {
          const novaQtd = med.quantidade_atual + (med.quantidade_por_dose || 1);
          
          await supabase
            .from('medicamentos')
            .update({ quantidade_atual: novaQtd })
            .eq('id', item.item_id);

          await supabase.from('movimentacoes_estoque').insert({
            medicamento_id: item.item_id,
            user_id: user.id,
            tipo: 'entrada',
            quantidade: med.quantidade_por_dose || 1,
            nota: `Revertido checklist: ${item.horario}`
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      // Reverter UI em caso de erro
      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, [field]: !value } : i
      ));
    }
  }, [user, items, todayKey]);

  const toggleChecked = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) updateItemStatus(itemId, 'checked', !item.checked);
  }, [items, updateItemStatus]);

  const toggleInactive = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) updateItemStatus(itemId, 'inactive', !item.inactive);
  }, [items, updateItemStatus]);

  // Recarregar à meia-noite
  useEffect(() => {
    const msToMidnight = millisToNextMidnight();
    const timer = setTimeout(() => {
      loadChecklist();
    }, msToMidnight);
    return () => clearTimeout(timer);
  }, [loadChecklist]);

  // Recarregar quando app volta ao foreground
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        getTodayKeyFromServer().then(newKey => {
          if (newKey !== todayKey) loadChecklist();
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [todayKey, loadChecklist]);

  // Carregar inicial
  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  return {
    items,
    loading,
    todayKey,
    toggleChecked,
    toggleInactive,
    reload: loadChecklist
  };
}
