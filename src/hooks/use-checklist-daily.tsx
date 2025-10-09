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
    if (!user || !contextId) return;

    setLoading(true);
    try {
      // Obter data do servidor
      const serverDate = await getTodayKeyFromServer();
      setTodayKey(serverDate);

      // Buscar care_context para determinar tipo e owner
      const { data: contextData } = await supabase
        .from('care_contexts')
        .select('*')
        .eq('id', contextId)
        .maybeSingle();

      if (!contextData) {
        console.error('Context não encontrado');
        setLoading(false);
        return;
      }

      let medicamentos: any[] | null = null;
      let lembretes: any[] | null = null;

      // Para contexto 'self', buscar itens do próprio usuário
      if (contextData.type === 'self') {
        const [{ data: medData }, { data: lemData }] = await Promise.all([
          supabase
            .from('medicamentos')
            .select('id, nome, horarios')
            .eq('user_id', contextData.owner_user_id)
            .is('dependente_id', null),
          supabase
            .from('lembretes')
            .select('id, nome, horarios')
            .eq('user_id', contextData.owner_user_id)
            .is('dependente_id', null)
        ]);

        medicamentos = medData;
        lembretes = lemData;
      } else if (contextData.type === 'dependent') {
        // Para contexto de dependente, buscar itens vinculados ao dependente
        const { data: dependenteData } = await supabase
          .from('pacientes_dependentes')
          .select('id')
          .eq('user_id', contextData.owner_user_id)
          .maybeSingle();

        if (dependenteData) {
          const [{ data: medData }, { data: lemData }] = await Promise.all([
            supabase
              .from('medicamentos')
              .select('id, nome, horarios')
              .eq('dependente_id', dependenteData.id),
            supabase
              .from('lembretes')
              .select('id, nome, horarios')
              .eq('dependente_id', dependenteData.id)
          ]);

          medicamentos = medData;
          lembretes = lemData;
        }
      }

      // Construir lista de itens
      const checklistItems: ChecklistItem[] = [];

      if (medicamentos) {
        medicamentos.forEach(med => {
          const horarios = Array.isArray(med.horarios) ? med.horarios : [];
          horarios.forEach(horario => {
            checklistItems.push({
              id: `med-${med.id}-${horario}`,
              item_id: med.id,
              nome: med.nome,
              horario,
              checked: false,
              inactive: false,
              tipo: 'medicamento'
            });
          });
        });
      }

      if (lembretes) {
        lembretes.forEach(lem => {
          const horarios = Array.isArray(lem.horarios) ? lem.horarios : [];
          horarios.forEach(horario => {
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
      }
    } catch (error) {
      console.error('Erro ao salvar estado:', error);
      // Reverter otimização em caso de erro
      setItems(prev => prev.map(i => 
        i.id === itemId ? item : i
      ));
    }
  }, [user, todayKey, contextId, items]);

  // Marcar item como concluído (checked)
  const toggleChecked = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    updateItemStatus(itemId, { checked: !item.checked });
  }, [items, updateItemStatus]);

  // Marcar item como inativo
  const toggleInactive = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    updateItemStatus(itemId, { inactive: !item.inactive });
  }, [items, updateItemStatus]);

  // Configurar timer para reset à meia-noite
  const setupMidnightTimer = useCallback(() => {
    const msUntilMidnight = millisToNextMidnight();
    
    const timerId = setTimeout(() => {
      console.log('[Checklist] Meia-noite detectada, recarregando checklist');
      loadChecklist();
      setupMidnightTimer(); // Reagendar para a próxima meia-noite
    }, msUntilMidnight);

    return () => clearTimeout(timerId);
  }, [loadChecklist]);

  // Detectar mudança de data quando app volta do segundo plano
  useEffect(() => {
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
  }, [todayKey, loadChecklist]);

  // Carregar checklist inicial e configurar timer
  useEffect(() => {
    if (user && contextId) {
      loadChecklist();
      const cleanup = setupMidnightTimer();
      return cleanup;
    }
  }, [user, contextId, loadChecklist, setupMidnightTimer]);

  return {
    items,
    loading,
    todayKey,
    toggleChecked,
    toggleInactive,
    reload: loadChecklist
  };
}
