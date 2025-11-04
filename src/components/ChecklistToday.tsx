import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useChecklistDaily } from "@/hooks/use-checklist-daily";
import { useCareContext } from "@/hooks/use-care-context";
import { formatDateDisplay } from "@/lib/checklist-utils";
import { RefreshCw, History, X, Lock, AlertTriangle, Package } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export function ChecklistToday() {
  const { currentContext, isContextReady } = useCareContext();
  const { items, loading, todayKey, toggleChecked, toggleInactive, checkStock, reload } = useChecklistDaily({ 
    contextId: currentContext?.id 
  });
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);
  const [stockWarningItem, setStockWarningItem] = useState<string | null>(null);
  const navigate = useNavigate();

  const isTimePassed = (horario: string): boolean => {
    const now = new Date();
    const [hours, minutes] = horario.split(':').map(Number);
    const itemTime = new Date();
    itemTime.setHours(hours, minutes, 0, 0);
    return now > itemTime;
  };

  const handleToggleChecked = async (itemId: string) => {
    const result = await toggleChecked(itemId);
    if (result && !result.success && result.stockInsufficient) {
      setStockWarningItem(itemId);
    }
  };

  // Filtrar: ocultar items checked, mostrar apenas não-checked
  const visibleTasks = items.filter(item => !item.checked);
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
        {visibleTasks.length === 0 ? (
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
          <TooltipProvider>
            <div className="space-y-3">
              {visibleTasks.map((item) => {
                const timePassed = isTimePassed(item.horario);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors border ${
                      item.inactive 
                        ? 'opacity-40 bg-muted/20 pointer-events-none' 
                        : timePassed 
                        ? 'opacity-60 bg-muted/30' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {timePassed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-5 w-5 flex items-center justify-center cursor-not-allowed">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Prazo expirado</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={item.checked}
                          onCheckedChange={() => handleToggleChecked(item.id)}
                          className="h-5 w-5"
                        />
                      )}
                    </div>
                    <label
                      htmlFor={timePassed ? undefined : `item-${item.id}`}
                      className={`flex-1 ${timePassed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.nome}</span>
                        <span className="text-sm text-muted-foreground">às {item.horario}</span>
                        {item.tipo === 'medicamento' && item.quantidade_atual !== undefined && item.alerta_minimo !== undefined && item.quantidade_atual <= item.alerta_minimo && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Estoque baixo
                          </Badge>
                        )}
                        {item.tipo === 'medicamento' && item.quantidade_atual !== undefined && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {item.quantidade_atual} disponível
                          </span>
                        )}
                      </div>
                      {timePassed && (
                        <AlertDialog open={confirmingItemId === item.id} onOpenChange={(open) => !open && setConfirmingItemId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-primary mt-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setConfirmingItemId(item.id);
                              }}
                            >
                              Marcar como feito mesmo após o horário?
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar conclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                O horário limite para "{item.nome}" já passou. Deseja marcar como concluído mesmo assim?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {
                                handleToggleChecked(item.id);
                                setConfirmingItemId(null);
                              }}>
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </label>
                    {!item.inactive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => toggleInactive(item.id)}
                        title="Marcar como não realizado hoje"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {item.inactive && (
                      <Badge variant="outline" className="text-xs">
                        Não feito
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </TooltipProvider>
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

      {/* Dialog de estoque insuficiente */}
      <AlertDialog open={stockWarningItem !== null} onOpenChange={(open) => !open && setStockWarningItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Estoque insuficiente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Não há estoque suficiente para marcar este medicamento como tomado. Deseja ajustar o estoque agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setStockWarningItem(null);
              navigate('/estoque');
            }}>
              Ajustar estoque
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
