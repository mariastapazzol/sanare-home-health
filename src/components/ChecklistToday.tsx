import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useChecklistDaily } from "@/hooks/use-checklist-daily";
import { useCareContext } from "@/hooks/use-care-context";
import { formatDateDisplay } from "@/lib/checklist-utils";
import { RefreshCw, History, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export function ChecklistToday() {
  const { currentContext, isContextReady } = useCareContext();
  const { items, loading, todayKey, toggleChecked, toggleInactive, reload } = useChecklistDaily({ 
    contextId: currentContext?.id 
  });

  const incompleteTasks = items.filter(item => !item.checked && !item.inactive);
  const completedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;

  const handleReset = async () => {
    if (!currentContext?.id) {
      toast({
        title: "Erro",
        description: "Contexto não disponível.",
        variant: "destructive",
      });
      return;
    }
    await reload();
    toast({
      title: "Checklist recarregado",
      description: "O checklist foi atualizado com sucesso.",
    });
  };

  if (!isContextReady || loading) {
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
                  <AlertDialogAction onClick={handleReset}>Resetar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {incompleteTasks.length === 0 ? (
          <div className="text-center py-8">
            {totalCount === 0 ? (
              <p className="text-muted-foreground">Nenhum medicamento ou lembrete cadastrado</p>
            ) : (
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-primary">🎉 Dia concluído!</p>
                <p className="text-muted-foreground">Todos os medicamentos e lembretes foram realizados hoje!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {incompleteTasks.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border"
              >
                <Checkbox
                  id={`item-${item.id}`}
                  checked={item.checked}
                  onCheckedChange={() => toggleChecked(item.id)}
                  className="h-5 w-5"
                />
                <label
                  htmlFor={`item-${item.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.nome}</span>
                    <span className="text-sm text-muted-foreground">às {item.horario}</span>
                  </div>
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => toggleInactive(item.id)}
                  title="Marcar como não realizado hoje"
                >
                  <X className="h-4 w-4" />
                </Button>
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
