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
  quantidade_atual?: number;
  quantidade_por_dose?: number;
  alerta_minimo?: number;
}

interface UseChecklistDailyProps {
  contextId?: string;
}

export function useChecklistDaily({ contextId }: UseChecklistDailyProps = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayKey, setTodayKey] = useState<string>('');

  // Carregar checklist do dia
  const loadChecklist = useCallback(async () => {
    if (!user || !contextId) {
      setLoading(false);
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      // Obter data do servidor
      const serverDate = await getTodayKeyFromServer();
      setTodayKey(serverDate);

      // Buscar medicamentos pelo context_id
      // @ts-ignore - Evita erro de inferência de tipo profunda do Supabase
      const { data: medicamentos } = await supabase
        .from('medicamentos')
        .select('id, nome, horarios, quantidade_atual, quantidade_por_dose, alerta_minimo')
        .eq('context_id', contextId);

      // Buscar lembretes pelo context_id
      // @ts-ignore - Evita erro de inferência de tipo profunda do Supabase
      const { data: lembretes } = await supabase
        .from('lembretes')
        .select('id, nome, horarios')
        .eq('context_id', contextId);

      // Construir lista de itens
      const checklistItems: ChecklistItem[] = [];

      if (medicamentos) {
        medicamentos.forEach((med: any) => {
          const horarios = Array.isArray(med.horarios) ? med.horarios : [];
          horarios.forEach((horario: string) => {
            checklistItems.push({
              id: `med-${med.id}-${horario}`,
              item_id: med.id,
              nome: med.nome,
              horario,
              checked: false,
              inactive: false,
              tipo: 'medicamento',
              quantidade_atual: med.quantidade_atual,
              quantidade_por_dose: med.quantidade_por_dose,
              alerta_minimo: med.alerta_minimo
            });
          });
        });
      }

      if (lembretes) {
        lembretes.forEach((lem: any) => {
          const horarios = Array.isArray(lem.horarios) ? lem.horarios : [];
          horarios.forEach((horario: string) => {
            checklistItems.push({
              id: `lem-${lem.id}-${horario}`,
              item_id: lem.id,
              nome: lem.nome,
              horario,
              checked: false,
              inactive: false,
              tipo: 'lembrete'
            });
          });
        });
      }

      // Carregar estado persistido do dia usando context_id
      const { data: statusData } = await supabase
        .from('checklist_daily_status')
        .select('*')
        .eq('context_id', contextId)
        .eq('day', serverDate);

      // Aplicar estado persistido
      if (statusData && statusData.length > 0) {
        checklistItems.forEach(item => {
          const status = statusData.find(
            s => s.item_type === item.tipo && 
                 s.item_id === item.item_id && 
                 s.horario === item.horario
          );
          if (status) {
            item.checked = status.checked;
            item.inactive = status.inactive;
          }
        });
      }

      // Ordenar por horário
      checklistItems.sort((a, b) => a.horario.localeCompare(b.horario));

      setItems(checklistItems);
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
    } finally {
      setLoading(false);
    }
  }, [user, contextId]);

  // Atualizar estado de um item
  const updateItemStatus = useCallback(async (itemId: string, updates: Partial<Pick<ChecklistItem, 'checked' | 'inactive'>>) => {
    if (!user || !todayKey || !contextId) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Atualização otimista
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, ...updates } : i
    ));

    // Persistir no banco usando context_id
    try {
      const { error } = await supabase
        .from('checklist_daily_status')
        .upsert({
          user_id: user.id,
          context_id: contextId,
          day: todayKey,
          item_type: item.tipo,
          item_id: item.item_id,
          horario: item.horario,
          checked: updates.checked !== undefined ? updates.checked : item.checked,
          inactive: updates.inactive !== undefined ? updates.inactive : item.inactive
        }, {
          onConflict: 'context_id,day,item_type,item_id,horario'
        });

      if (error) {
        console.error('Erro ao salvar estado:', error);
        // Reverter otimização em caso de erro
        setItems(prev => prev.map(i => 
          i.id === itemId ? item : i
        ));
        return;
      }

      // Se é um medicamento e está sendo marcado como tomado, reduzir estoque
      if (item.tipo === 'medicamento' && updates.checked === true && !item.checked) {
        // Buscar informações do medicamento
        const { data: medicamento, error: medError } = await supabase
          .from('medicamentos')
          .select('quantidade_atual, quantidade_por_dose')
          .eq('id', item.item_id)
          .single();

        if (medError) {
          console.error('Erro ao buscar medicamento:', medError);
          return;
        }

        if (medicamento) {
          const novaQuantidade = medicamento.quantidade_atual - medicamento.quantidade_por_dose;

          // Atualizar quantidade em estoque
          await supabase
            .from('medicamentos')
            .update({ quantidade_atual: novaQuantidade })
            .eq('id', item.item_id);

          // Registrar movimentação no estoque
          await supabase
            .from('movimentacoes_estoque')
            .insert({
              user_id: user.id,
              medicamento_id: item.item_id,
              tipo: 'saida',
              quantidade: medicamento.quantidade_por_dose,
              nota: `Medicamento tomado às ${item.horario}`
            });
        }
      }

      // Se está sendo desmarcado, reverter a saída do estoque
      if (item.tipo === 'medicamento' && updates.checked === false && item.checked) {
        // Buscar informações do medicamento
        const { data: medicamento, error: medError } = await supabase
          .from('medicamentos')
          .select('quantidade_atual, quantidade_por_dose')
          .eq('id', item.item_id)
          .single();

        if (medError) {
          console.error('Erro ao buscar medicamento:', medError);
          return;
        }

        if (medicamento) {
          const novaQuantidade = medicamento.quantidade_atual + medicamento.quantidade_por_dose;

          // Atualizar quantidade em estoque
          await supabase
            .from('medicamentos')
            .update({ quantidade_atual: novaQuantidade })
            .eq('id', item.item_id);

          // Registrar movimentação no estoque
          await supabase
            .from('movimentacoes_estoque')
            .insert({
              user_id: user.id,
              medicamento_id: item.item_id,
              tipo: 'entrada',
              quantidade: medicamento.quantidade_por_dose,
              nota: `Reversão de medicamento às ${item.horario}`
            });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar estado:', error);
      // Reverter otimização em caso de erro
      setItems(prev => prev.map(i => 
        i.id === itemId ? item : i
      ));
    }
  }, [user, todayKey, contextId, items]);

  // Verificar se há estoque suficiente
  const checkStock = useCallback((itemId: string): { sufficient: boolean; current: number; needed: number } => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.tipo !== 'medicamento') {
      return { sufficient: true, current: 0, needed: 0 };
    }
    
    const current = item.quantidade_atual || 0;
    const needed = item.quantidade_por_dose || 0;
    
    return {
      sufficient: current >= needed,
      current,
      needed
    };
  }, [items]);

  // Marcar item como concluído (checked)
  const toggleChecked = useCallback(async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    // Se está marcando como feito e é medicamento, verificar estoque
    if (!item.checked && item.tipo === 'medicamento') {
      const stock = checkStock(itemId);
      if (!stock.sufficient) {
        return { success: false, stockInsufficient: true };
      }
    }
    
    await updateItemStatus(itemId, { checked: !item.checked });
    return { success: true, stockInsufficient: false };
  }, [items, updateItemStatus, checkStock]);

  // Marcar item como inativo
  const toggleInactive = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    updateItemStatus(itemId, { inactive: !item.inactive });
  }, [items, updateItemStatus]);

  // Configurar timer para reset à meia-noite
  useEffect(() => {
    if (!user || !contextId) return;
    
    const msUntilMidnight = millisToNextMidnight();
    
    const timerId = setTimeout(() => {
      console.log('[Checklist] Meia-noite detectada, recarregando checklist');
      loadChecklist();
    }, msUntilMidnight);

    return () => clearTimeout(timerId);
  }, [user, contextId, loadChecklist]);

  // Detectar mudança de data quando app volta do segundo plano
  useEffect(() => {
    if (!user || !contextId) return;
    
    let lastDate = todayKey;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const currentDate = await getTodayKeyFromServer();
        if (lastDate && currentDate !== lastDate) {
          console.log('[Checklist] Mudança de data detectada, recarregando');
          loadChecklist();
        }
        lastDate = currentDate;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, contextId, todayKey, loadChecklist]);

  // Carregar checklist inicial
  useEffect(() => {
    if (user && contextId) {
      loadChecklist();
    }
  }, [user, contextId, loadChecklist]);

  return {
    items,
    loading,
    todayKey,
    toggleChecked,
    toggleInactive,
    checkStock,
    reload: loadChecklist
  };
}
