import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useCareContext } from './use-care-context';
import { toast } from '@/components/ui/use-toast';
import { getTodayKeyFromServer, millisToNextMidnight, checklistCache } from '@/lib/checklist-utils';

export interface Task {
  id: number;
  title: string;
  order: number;
  active: boolean;
}

export interface TaskStatus {
  id: number;
  user_id: string;
  task_id: number;
  day: string;
  checked: boolean;
  updated_at: string;
}

export interface TaskWithStatus extends Task {
  checked: boolean;
  status_id?: number;
}

export function useChecklist() {
  const { user } = useAuth();
  const { currentContext } = useCareContext();
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayKey, setTodayKey] = useState<string>('');
  const midnightTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const activeContextId = currentContext?.id;

  /**
   * Carrega as tasks e seus estados para hoje
   */
  const loadToday = useCallback(async () => {
    if (!user || !activeContextId) return;

    setLoading(true);
    try {
      // Buscar data do servidor
      const today = await getTodayKeyFromServer();
      setTodayKey(today);

      // Buscar tasks ativas da tabela tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('active', true)
        .order('order');

      if (tasksError) throw tasksError;

      let allTasks: Task[] = tasksData || [];

      // Buscar medicamentos do cuidador para o dependente
      // Funciona tanto quando o cuidador visualiza o contexto do dependente
      // quanto quando o próprio dependente está logado
      const shouldFetchCaregiverMeds = 
        (currentContext?.type === 'dependent' && currentContext.caregiver_user_id) ||
        (currentContext?.type === 'self' && currentContext.caregiver_user_id);

      if (shouldFetchCaregiverMeds && currentContext?.caregiver_user_id) {
        const dependentUserId = currentContext.type === 'dependent' 
          ? currentContext.owner_user_id 
          : user.id;

        const { data: medicamentos, error: medError } = await supabase
          .from('medicamentos')
          .select('id, nome, horarios')
          .eq('user_id', currentContext.caregiver_user_id)
          .eq('dependente_id', dependentUserId);

        if (medError) {
          console.error('Erro ao buscar medicamentos do cuidador:', medError);
        } else if (medicamentos) {
          // Converter medicamentos em tasks
          const medicamentoTasks: Task[] = medicamentos.flatMap(med => {
            const horarios = Array.isArray(med.horarios) ? med.horarios : [];
            return horarios.map((horario: string, index: number) => ({
              id: parseInt(`999${med.id}${index}`), // ID único para medicamentos
              title: `💊 ${med.nome} - ${horario}`,
              order: 1000 + index, // Ordem após as tasks normais
              active: true
            }));
          });
          allTasks = [...allTasks, ...medicamentoTasks];
        }
      }

      // Buscar status de hoje para o contexto ativo
      const { data: statusData, error: statusError } = await supabase
        .from('task_status')
        .select('*')
        .eq('context_id', activeContextId)
        .eq('day', today);

      if (statusError) throw statusError;

      // Criar mapa de status
      const statusMap = new Map(
        statusData?.map(s => [s.task_id, { checked: s.checked, id: s.id }]) || []
      );

      // Combinar tasks com status
      const tasksWithStatus: TaskWithStatus[] = allTasks.map(task => ({
        ...task,
        checked: statusMap.get(task.id)?.checked || false,
        status_id: statusMap.get(task.id)?.id,
      }));

      // Se não existem registros de status para hoje, criar
      if (!statusData || statusData.length === 0) {
        const initialStatuses = allTasks.map(task => ({
          user_id: user.id,
          task_id: task.id,
          day: today,
          checked: false,
          context_id: activeContextId,
        }));

        if (initialStatuses.length > 0) {
          const { error: insertError } = await supabase
            .from('task_status')
            .insert(initialStatuses);

          if (insertError) {
            console.error('Erro ao criar status inicial:', insertError);
          }
        }
      }

      setTasks(tasksWithStatus);
      
      // Salvar no cache local
      checklistCache.save(today, tasksWithStatus);

    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
      
      // Tentar carregar do cache em caso de erro
      const cached = checklistCache.load();
      if (cached && cached.todayKey === todayKey) {
        setTasks(cached.data);
        toast({
          title: "Modo offline",
          description: "Carregando dados do cache local.",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar o checklist.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, activeContextId, todayKey]);

  /**
   * Marca/desmarca uma task
   */
  const toggle = useCallback(async (taskId: number) => {
    if (!user || !todayKey || !activeContextId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newChecked = !task.checked;

    // Atualização otimista
    setTasks(prev => 
      prev.map(t => t.id === taskId ? { ...t, checked: newChecked } : t)
    );

    try {
      // Upsert no banco
      const { error } = await supabase
        .from('task_status')
        .upsert({
          user_id: user.id,
          task_id: taskId,
          day: todayKey,
          checked: newChecked,
          context_id: activeContextId,
        }, {
          onConflict: 'user_id,task_id,day,context_id'
        });

      if (error) throw error;

      // Atualizar cache
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, checked: newChecked } : t
      );
      checklistCache.save(todayKey, updatedTasks);

    } catch (error) {
      console.error('Erro ao atualizar task:', error);
      
      // Reverter em caso de erro
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, checked: !newChecked } : t)
      );
      
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar a alteração.",
        variant: "destructive",
      });
    }
  }, [user, activeContextId, todayKey, tasks]);

  /**
   * Reseta todas as tasks de hoje (desmarca todas)
   */
  const resetToday = useCallback(async () => {
    if (!user || !todayKey || !activeContextId) return;

    try {
      // Atualizar todas as tasks de hoje para unchecked
      const { error } = await supabase
        .from('task_status')
        .update({ checked: false })
        .eq('context_id', activeContextId)
        .eq('day', todayKey);

      if (error) throw error;

      // Atualizar estado local
      setTasks(prev => prev.map(t => ({ ...t, checked: false })));
      
      // Atualizar cache
      const resetTasks = tasks.map(t => ({ ...t, checked: false }));
      checklistCache.save(todayKey, resetTasks);

      toast({
        title: "Checklist resetado",
        description: "Todas as tarefas foram desmarcadas.",
      });

    } catch (error) {
      console.error('Erro ao resetar checklist:', error);
      toast({
        title: "Erro ao resetar",
        description: "Não foi possível resetar o checklist.",
        variant: "destructive",
      });
    }
  }, [user, activeContextId, todayKey, tasks]);

  /**
   * Configura timer para reset automático à meia-noite
   */
  const setupMidnightTimer = useCallback(() => {
    // Limpar timer existente
    if (midnightTimerRef.current) {
      clearTimeout(midnightTimerRef.current);
    }

    const msUntilMidnight = millisToNextMidnight();
    
    console.log(`Próximo reset em ${Math.round(msUntilMidnight / 1000 / 60)} minutos`);

    midnightTimerRef.current = setTimeout(() => {
      console.log('Resetando checklist - nova meia-noite');
      loadToday();
      setupMidnightTimer(); // Reagendar para próxima meia-noite
    }, msUntilMidnight);

  }, [loadToday]);

  /**
   * Verifica se mudou o dia quando o app volta ao foco
   */
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        const currentDay = await getTodayKeyFromServer();
        if (currentDay !== todayKey) {
          console.log('Dia mudou - recarregando checklist');
          loadToday();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [todayKey, user, loadToday]);

  /**
   * Carrega checklist inicial e configura timer
   */
  useEffect(() => {
    if (user) {
      loadToday();
      setupMidnightTimer();
    }

    return () => {
      if (midnightTimerRef.current) {
        clearTimeout(midnightTimerRef.current);
      }
    };
  }, [user, loadToday, setupMidnightTimer]);

  const completedCount = tasks.filter(t => t.checked).length;
  const totalCount = tasks.length;

  return {
    tasks,
    loading,
    todayKey,
    completedCount,
    totalCount,
    toggle,
    resetToday,
    loadToday,
  };
}
