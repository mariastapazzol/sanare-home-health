import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDateDisplay, getLastNDays } from "@/lib/checklist-utils";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DayHistory {
  date: string;
  tasks: Array<{
    id: number;
    title: string;
    checked: boolean;
  }>;
  completedCount: number;
  totalCount: number;
}

export function HistoryList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadHistory() {
      setLoading(true);
      try {
        const last7Days = getLastNDays(7);

        // Buscar tasks ativas
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('active', true)
          .order('order');

        if (tasksError) throw tasksError;

        // Buscar status dos últimos 7 dias
        const { data: statusData, error: statusError } = await supabase
          .from('task_status')
          .select('*')
          .eq('user_id', user.id)
          .in('day', last7Days)
          .order('day', { ascending: false });

        if (statusError) throw statusError;

        // Agrupar por dia
        const historyByDay: DayHistory[] = last7Days.map(date => {
          const dayStatuses = statusData?.filter(s => s.day === date) || [];
          const statusMap = new Map(dayStatuses.map(s => [s.task_id, s.checked]));

          const dayTasks = tasksData?.map(task => ({
            id: task.id,
            title: task.title,
            checked: statusMap.get(task.id) || false,
          })) || [];

          const completedCount = dayTasks.filter(t => t.checked).length;

          return {
            date,
            tasks: dayTasks,
            completedCount,
            totalCount: dayTasks.length,
          };
        });

        setHistory(historyByDay);

      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Histórico - Últimos 7 dias</h2>
        <Button variant="outline" onClick={() => navigate('/checklist')}>
          Voltar para hoje
        </Button>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            Nenhum histórico disponível
          </CardContent>
        </Card>
      ) : (
        history.map((day) => (
          <Card key={day.date}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {formatDateDisplay(day.date)}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {day.completedCount} de {day.totalCount} concluídas
                  {day.totalCount > 0 && (
                    <span className="ml-2 font-medium">
                      ({Math.round((day.completedCount / day.totalCount) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {day.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa neste dia</p>
              ) : (
                <div className="space-y-2">
                  {day.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center space-x-3 text-sm"
                    >
                      {task.checked ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={task.checked ? 'text-muted-foreground' : ''}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {day.totalCount > 0 && (
                <div className="mt-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60"
                      style={{ width: `${(day.completedCount / day.totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
