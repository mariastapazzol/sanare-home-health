import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCareContext } from "@/hooks/use-care-context";
import { formatDateDisplay, getLastNDays } from "@/lib/checklist-utils";
import { CheckCircle2, XCircle, Calendar, Pill, Bell, TrendingUp, Filter, Clock, Heart, Zap, Star, Coffee, Apple, Activity, AlertCircle, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HistoryItem {
  id: string;
  nome: string;
  horario: string;
  tipo: 'medicamento' | 'lembrete';
  checked: boolean;
  inactive: boolean;
  icone?: string;
}

interface DayHistory {
  date: string;
  items: HistoryItem[];
  completedCount: number;
  inactiveCount: number;
  totalCount: number;
}

export function ChecklistHistory() {
  const { currentContext } = useCareContext();
  const navigate = useNavigate();
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysToShow, setDaysToShow] = useState(7);
  const [filterType, setFilterType] = useState<'all' | 'medicamento' | 'lembrete'>('all');

  // Mapa de ícones disponíveis
  const iconMap: Record<string, any> = {
    bell: Bell,
    clock: Clock,
    heart: Heart,
    star: Star,
    zap: Zap,
    coffee: Coffee,
    apple: Apple,
    sun: Sun,
    activity: Activity,
    alert: AlertCircle
  };

  const getLembreteIcon = (iconeName?: string) => {
    const Icon = iconMap[iconeName || 'bell'] || Bell;
    return Icon;
  };

  useEffect(() => {
    if (!currentContext?.id) return;

    async function loadHistory() {
      setLoading(true);
      try {
        const dates = getLastNDays(daysToShow);

        // Buscar medicamentos
        const { data: medicamentos } = await supabase
          .from('medicamentos')
          .select('id, nome, horarios')
          .eq('context_id', currentContext.id);

        // Buscar lembretes
        const { data: lembretes } = await supabase
          .from('lembretes')
          .select('id, nome, horarios, icone')
          .eq('context_id', currentContext.id);

        // Buscar status histórico
        const { data: statusData } = await supabase
          .from('checklist_daily_status')
          .select('*')
          .eq('context_id', currentContext.id)
          .in('day', dates)
          .order('day', { ascending: false });

        // Construir histórico por dia
        const historyByDay: DayHistory[] = dates.map(date => {
          const dayStatuses = statusData?.filter(s => s.day === date) || [];
          const items: HistoryItem[] = [];

          // Adicionar medicamentos
          medicamentos?.forEach(med => {
            const horarios = Array.isArray(med.horarios) ? med.horarios : [];
            horarios.forEach(horario => {
              const horarioStr = String(horario);
              const status = dayStatuses.find(
                s => s.item_type === 'medicamento' && 
                     s.item_id === med.id && 
                     s.horario === horarioStr
              );
              items.push({
                id: `med-${med.id}-${horarioStr}`,
                nome: med.nome,
                horario: horarioStr,
                tipo: 'medicamento',
                checked: status?.checked || false,
                inactive: status?.inactive || false
              });
            });
          });

          // Adicionar lembretes
          lembretes?.forEach(lem => {
            const horarios = Array.isArray(lem.horarios) ? lem.horarios : [];
            horarios.forEach(horario => {
              const horarioStr = String(horario);
              const status = dayStatuses.find(
                s => s.item_type === 'lembrete' && 
                     s.item_id === lem.id && 
                     s.horario === horarioStr
              );
              items.push({
                id: `lem-${lem.id}-${horarioStr}`,
                nome: lem.nome,
                horario: horarioStr,
                tipo: 'lembrete',
                checked: status?.checked || false,
                inactive: status?.inactive || false,
                icone: lem.icone
              });
            });
          });

          // Ordenar por horário
          items.sort((a, b) => a.horario.localeCompare(b.horario));

          const completedCount = items.filter(i => i.checked).length;
          const inactiveCount = items.filter(i => i.inactive).length;

          return {
            date,
            items,
            completedCount,
            inactiveCount,
            totalCount: items.length
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
  }, [currentContext?.id, daysToShow]);

  // Calcular estatísticas gerais
  const totalDays = history.filter(d => d.totalCount > 0).length;
  const avgCompletion = totalDays > 0
    ? Math.round(
        history
          .filter(d => d.totalCount > 0)
          .reduce((acc, d) => acc + (d.completedCount / d.totalCount) * 100, 0) / totalDays
      )
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Histórico do Checklist</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe seu progresso e adesão ao tratamento
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/home')}>
          Voltar para hoje
        </Button>
      </div>

      {/* Estatísticas gerais */}
      {totalDays > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-3xl font-bold text-primary">{avgCompletion}%</div>
                <div className="text-sm text-muted-foreground">Taxa de adesão média</div>
              </div>
              <div className="text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-3xl font-bold text-green-600">
                  {history.reduce((acc, d) => acc + d.completedCount, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Itens concluídos</div>
              </div>
              <div className="text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-3xl font-bold text-blue-600">{totalDays}</div>
                <div className="text-sm text-muted-foreground">Dias registrados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={daysToShow.toString()} onValueChange={(v) => setDaysToShow(Number(v))}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="14">Últimos 14 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os itens</SelectItem>
            <SelectItem value="medicamento">Medicamentos</SelectItem>
            <SelectItem value="lembrete">Lembretes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de dias */}
      {history.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum histórico disponível</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((day) => {
            const filteredItems = filterType === 'all' 
              ? day.items 
              : day.items.filter(i => i.tipo === filterType);

            if (filteredItems.length === 0) return null;

            const dayCompletedCount = filteredItems.filter(i => i.checked).length;
            const dayInactiveCount = filteredItems.filter(i => i.inactive).length;
            const adherenceRate = filteredItems.length > 0
              ? Math.round((dayCompletedCount / filteredItems.length) * 100)
              : 0;

            return (
              <Card key={day.date}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatDateDisplay(day.date)}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge variant={adherenceRate >= 80 ? "default" : adherenceRate >= 50 ? "secondary" : "destructive"}>
                        {adherenceRate}% adesão
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {dayCompletedCount}/{filteredItems.length}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          item.checked
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                            : item.inactive
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                            : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {item.tipo === 'medicamento' ? (
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                              <Pill className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          ) : (() => {
                            const LembreteIcon = getLembreteIcon(item.icone);
                            return (
                              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                <LembreteIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                            );
                          })()}
                          <div className="flex-1">
                            <span className="font-medium">{item.nome}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              às {item.horario}
                            </span>
                          </div>
                        </div>
                        <div>
                          {item.checked ? (
                            <Badge className="bg-green-600 hover:bg-green-700 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Tomado
                            </Badge>
                          ) : item.inactive ? (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Não tomado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Pendente
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Barra de progresso */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso do dia</span>
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-600">{dayCompletedCount} ✓</span>
                        <span className="text-red-600">{dayInactiveCount} ✗</span>
                        <span className="text-gray-500">
                          {filteredItems.length - dayCompletedCount - dayInactiveCount} ○
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div
                          className="bg-green-600"
                          style={{ width: `${(dayCompletedCount / filteredItems.length) * 100}%` }}
                        />
                        <div
                          className="bg-red-600"
                          style={{ width: `${(dayInactiveCount / filteredItems.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
