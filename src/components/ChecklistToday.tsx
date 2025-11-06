import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useChecklistDaily } from "@/hooks/use-checklist-daily";
import { useCareContext } from "@/hooks/use-care-context";
import { formatDateDisplay, getTodayKey } from "@/lib/checklist-utils";
import { RefreshCw, History, CheckCircle, XCircle, Clock, AlertTriangle, Package, Pill, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function ChecklistToday() {
  const { currentContext, isContextReady } = useCareContext();
  const { items, loading, todayKey, toggleChecked, toggleInactive, checkStock, reload } = useChecklistDaily({ 
    contextId: currentContext?.id 
  });
  const [stockWarningItem, setStockWarningItem] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
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
    } else if (result && result.success) {
      // Atualizar count de concluídos imediatamente
      setCompletedCount(prev => prev + 1);
      
      toast({
        title: "✓ Marcado como tomado",
        description: "Item concluído com sucesso.",
      });
    }
  };

  const handleToggleInactive = async (itemId: string) => {
    await toggleInactive(itemId);
    toast({
      title: "Marcado como não tomado",
      description: "Este item ficará desabilitado até o próximo dia.",
      variant: "destructive",
    });
  };

  const visibleTasks = items;
  const [completedCount, setCompletedCount] = useState(0);
  const totalCount = visibleTasks.length + completedCount;

  // Atualizar count de items concluídos
  useEffect(() => {
    const fetchCompletedCount = async () => {
      if (!currentContext?.id) return;
      
      const dayKey = getTodayKey();
      const { count } = await supabase
        .from('checklist_daily_status')
        .select('*', { count: 'exact', head: true })
        .eq('context_id', currentContext.id)
        .eq('day', dayKey)
        .eq('checked', true);
      
      setCompletedCount(count || 0);
    };
    
    fetchCompletedCount();
  }, [currentContext?.id, items.length]);

  const handleReset = async () => {
    if (!currentContext?.id) {
      toast({
        title: "Erro",
        description: "Contexto não disponível.",
        variant: "destructive",
      });
      return;
    }
    
    const dayKey = getTodayKey();
    await supabase
      .from('checklist_daily_status')
      .delete()
      .eq('context_id', currentContext.id)
      .eq('day', dayKey);
    
    await reload();
    setShowResetDialog(false);
    toast({
      title: "Checklist resetado",
      description: "Todos os itens foram restaurados.",
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
              <Skeleton className="h-16 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl">
              Checklist de hoje
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {todayKey && formatDateDisplay(todayKey)} • {completedCount} de {totalCount} concluídas
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/checklist/historico">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {visibleTasks.length === 0 ? (
          <div className="text-center py-12">
            {totalCount === 0 ? (
              <div className="space-y-2">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-lg font-medium">Nenhum item cadastrado</p>
                <p className="text-sm text-muted-foreground">
                  Cadastre medicamentos e lembretes para começar
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">Parabéns!</p>
                <p className="text-muted-foreground">Todos os itens foram concluídos hoje!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map((item) => {
              const timePassed = isTimePassed(item.horario);
              const borderColor = item.inactive 
                ? 'border-red-300 dark:border-red-700' 
                : timePassed 
                ? 'border-gray-300 dark:border-gray-700' 
                : 'border-yellow-300 dark:border-yellow-700';
              
              const bgColor = item.inactive
                ? 'bg-red-50 dark:bg-red-950/20'
                : timePassed
                ? 'bg-gray-50 dark:bg-gray-900/20'
                : 'bg-yellow-50 dark:bg-yellow-950/20';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border-2 ${borderColor} ${bgColor} transition-all ${
                    item.inactive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Cabeçalho com imagem/ícone, nome e horário */}
                      <div className="flex items-center gap-3">
                        {item.tipo === 'medicamento' && item.imagem_url ? (
                          <img 
                            src={item.imagem_url} 
                            alt={item.nome}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className={`p-2 rounded-full ${
                            item.tipo === 'medicamento' 
                              ? 'bg-blue-100 dark:bg-blue-900/30' 
                              : 'bg-purple-100 dark:bg-purple-900/30'
                          }`}>
                            {item.tipo === 'medicamento' ? (
                              <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.nome}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{item.horario}</span>
                            {item.tipo === 'medicamento' && item.dosagem && (
                              <>
                                <span>•</span>
                                <span>{item.quantidade_por_dose} {item.unidade_dose}</span>
                                <span className="text-xs">({item.dosagem})</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Informações adicionais */}
                      {item.tipo === 'medicamento' && (
                        <div className="flex items-center gap-3 ml-14">
                          {item.quantidade_atual !== undefined && (
                            <Badge variant="secondary" className="gap-1">
                              <Package className="h-3 w-3" />
                              {item.quantidade_atual} {item.unidade_dose} disponível
                            </Badge>
                          )}
                          {item.quantidade_atual !== undefined && 
                           item.alerta_minimo !== undefined && 
                           item.quantidade_atual <= item.alerta_minimo && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Estoque baixo
                            </Badge>
                          )}
                        </div>
                      )}

                      {item.tipo === 'lembrete' && item.descricao && (
                        <p className="text-sm text-muted-foreground ml-14">
                          {item.descricao}
                        </p>
                      )}

                      {/* Status */}
                      {item.inactive && (
                        <Badge variant="destructive" className="ml-14">
                          Não tomado
                        </Badge>
                      )}
                      {timePassed && !item.inactive && (
                        <Badge variant="secondary" className="ml-14 gap-1">
                          <Clock className="h-3 w-3" />
                          Horário passou
                        </Badge>
                      )}
                    </div>

                    {/* Botões de ação */}
                    {!item.inactive && (
                      <div className="flex flex-col gap-2 min-w-[100px]">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-2"
                          onClick={() => handleToggleChecked(item.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Tomado
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-2"
                          onClick={() => handleToggleInactive(item.id)}
                        >
                          <XCircle className="h-4 w-4" />
                          Não
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {totalCount > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso do dia</span>
              <span className="font-medium">
                {Math.round((completedCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 dark:bg-green-500 transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>

      {/* Dialog de reset */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar checklist de hoje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá desmarcar todas as tarefas de hoje e restaurar o checklist. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Resetar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de estoque insuficiente */}
      <AlertDialog open={stockWarningItem !== null} onOpenChange={(open) => !open && setStockWarningItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Estoque insuficiente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Não há estoque suficiente para marcar este medicamento como tomado. 
              Deseja ajustar o estoque agora?
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
