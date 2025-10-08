import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useChecklist } from "@/hooks/use-checklist";
import { formatDateDisplay } from "@/lib/checklist-utils";
import { RefreshCw, History } from "lucide-react";
import { Link } from "react-router-dom";

export function ChecklistToday() {
  const { tasks, loading, todayKey, completedCount, totalCount, toggle, resetToday } = useChecklist();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">
              Checklist de hoje ({todayKey ? formatDateDisplay(todayKey) : ''})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount} de {totalCount} concluídas
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/checklist/historico">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Resetar checklist de hoje?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá desmarcar todas as tarefas de hoje. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={resetToday}>Resetar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.filter(t => !t.checked).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {tasks.length === 0 ? 'Nenhuma tarefa cadastrada' : '✅ Todas as tarefas concluídas hoje!'}
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.filter(t => !t.checked).map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.checked}
                  onCheckedChange={() => toggle(task.id)}
                  className="h-5 w-5"
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className="flex-1 text-base cursor-pointer"
                >
                  {task.title}
                </label>
              </div>
            ))}
          </div>
        )}
        
        {totalCount > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {Math.round((completedCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
