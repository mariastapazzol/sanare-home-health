import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCareContext } from "@/hooks/use-care-context";
import { getTodayKey, formatDateDisplay } from "@/lib/checklist-utils";

interface ItemRelatorio {
  id: string;
  nome: string;
  horario: string;
  tipo: 'medicamento' | 'lembrete';
  status: 'tomado' | 'ignorado' | 'atrasado' | 'nao_registrado';
}

interface HorarioGroup {
  horario: string;
  items: ItemRelatorio[];
}

export default function RelatorioDia() {
  const navigate = useNavigate();
  const { currentContext } = useCareContext();
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<HorarioGroup[]>([]);
  const [stats, setStats] = useState({
    tomados: 0,
    ignorados: 0,
    atrasados: 0,
    naoRegistrados: 0,
    total: 0
  });

  const isTimePassed = (horario: string): boolean => {
    const now = new Date();
    const [hours, minutes] = horario.split(':').map(Number);
    const itemTime = new Date();
    itemTime.setHours(hours, minutes, 0, 0);
    return now > itemTime;
  };

  const determineStatus = (item: any, statusMap: Map<string, any>): 'tomado' | 'ignorado' | 'atrasado' | 'nao_registrado' => {
    const key = `${item.tipo}-${item.id}-${item.horario}`;
    const statusRecord = statusMap.get(key);

    if (statusRecord) {
      if (statusRecord.checked) return 'tomado';
      if (statusRecord.inactive) return 'ignorado';
    }

    if (isTimePassed(item.horario)) {
      return 'atrasado';
    }

    return 'nao_registrado';
  };

  useEffect(() => {
    const loadRelatorio = async () => {
      if (!currentContext?.id) return;

      setLoading(true);
      const dayKey = getTodayKey();

      try {
        // Buscar medicamentos
        const { data: medicamentos } = await supabase
          .from('medicamentos')
          .select('id, nome, horarios')
          .eq('context_id', currentContext.id);

        // Buscar lembretes
        const { data: lembretes } = await supabase
          .from('lembretes')
          .select('id, nome, horarios, datas')
          .eq('context_id', currentContext.id);

        // Buscar status do dia
        const { data: statusRecords } = await supabase
          .from('checklist_daily_status')
          .select('*')
          .eq('context_id', currentContext.id)
          .eq('day', dayKey);

        // Criar mapa de status
        const statusMap = new Map();
        statusRecords?.forEach(record => {
          const key = `${record.item_type}-${record.item_id}-${record.horario}`;
          statusMap.set(key, record);
        });

        // Processar todos os itens
        const allItems: ItemRelatorio[] = [];

        // Adicionar medicamentos
        medicamentos?.forEach(med => {
          const horarios = Array.isArray(med.horarios) ? med.horarios : [];
          horarios.forEach((horario: string) => {
            const status = determineStatus(
              { tipo: 'medicamento', id: med.id, horario },
              statusMap
            );
            allItems.push({
              id: `med-${med.id}-${horario}`,
              nome: med.nome,
              horario,
              tipo: 'medicamento',
              status
            });
          });
        });

        // Adicionar lembretes
        lembretes?.forEach(lem => {
          const horarios = Array.isArray(lem.horarios) ? lem.horarios : [];
          const datas = Array.isArray(lem.datas) ? lem.datas : [];
          
          // Verificar se o lembrete deve aparecer hoje
          const hoje = new Date();
          const diaSemana = hoje.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
          const shouldShowToday = datas.length === 0 || datas.includes(diaSemana);

          if (shouldShowToday) {
            horarios.forEach((horario: string) => {
              const status = determineStatus(
                { tipo: 'lembrete', id: lem.id, horario },
                statusMap
              );
              allItems.push({
                id: `lem-${lem.id}-${horario}`,
                nome: lem.nome,
                horario,
                tipo: 'lembrete',
                status
              });
            });
          }
        });

        // Ordenar por horário
        allItems.sort((a, b) => a.horario.localeCompare(b.horario));

        // Agrupar por horário
        const gruposMap = new Map<string, ItemRelatorio[]>();
        allItems.forEach(item => {
          const existing = gruposMap.get(item.horario) || [];
          gruposMap.set(item.horario, [...existing, item]);
        });

        const gruposArray: HorarioGroup[] = Array.from(gruposMap.entries()).map(([horario, items]) => ({
          horario,
          items
        }));

        setGrupos(gruposArray);

        // Calcular estatísticas
        const tomados = allItems.filter(i => i.status === 'tomado').length;
        const ignorados = allItems.filter(i => i.status === 'ignorado').length;
        const atrasados = allItems.filter(i => i.status === 'atrasado').length;
        const naoRegistrados = allItems.filter(i => i.status === 'nao_registrado').length;

        setStats({
          tomados,
          ignorados,
          atrasados,
          naoRegistrados,
          total: allItems.length
        });

      } catch (error) {
        console.error('Erro ao carregar relatório:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRelatorio();
  }, [currentContext?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'tomado':
        return (
          <span className="text-green-600 dark:text-green-400 text-sm font-medium">
            tomado
          </span>
        );
      case 'ignorado':
        return (
          <span className="text-muted-foreground text-sm font-medium">
            ignorado
          </span>
        );
      case 'atrasado':
        return (
          <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">
            atrasado
          </span>
        );
      case 'nao_registrado':
        return (
          <span className="text-muted-foreground text-sm">
            não registrado
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'tomado':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'ignorado':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      case 'atrasado':
        return <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case 'nao_registrado':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const generateSummary = () => {
    if (stats.total === 0) return "Nenhum item cadastrado para hoje.";
    
    const percentual = Math.round((stats.tomados / stats.total) * 100);
    
    let summary = `Hoje você concluiu ${percentual}% da rotina`;
    
    if (stats.ignorados > 0) {
      summary += ` e teve ${stats.ignorados} ${stats.ignorados === 1 ? 'dose ignorada' : 'doses ignoradas'}`;
    }
    
    if (stats.atrasados > 0) {
      summary += stats.ignorados > 0 ? ' e' : ',';
      summary += ` ${stats.atrasados} ${stats.atrasados === 1 ? 'item atrasado' : 'itens atrasados'}`;
    }
    
    summary += '.';
    return summary;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-32 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/checklist')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Checklist
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Relatório do Dia</h1>
          <p className="text-muted-foreground">
            {formatDateDisplay(getTodayKey())}
          </p>
        </div>

        {/* Resumo */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.tomados}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ignoradas</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {stats.ignorados}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Atrasadas</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.atrasados}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Não registradas</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {stats.naoRegistrados}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de itens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Itens do dia</CardTitle>
          </CardHeader>
          <CardContent>
            {grupos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum item cadastrado para hoje
              </div>
            ) : (
              <div className="space-y-4">
                {grupos.map((grupo) => (
                  <div key={grupo.horario} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-medium text-muted-foreground min-w-[50px]">
                        {grupo.horario}
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {grupo.items.map((item, idx) => (
                            <span key={item.id} className="inline-flex items-center gap-1.5">
                              {getStatusIcon(item.status)}
                              <span className="text-sm">
                                {item.nome}
                              </span>
                              <span className="text-xs">
                                ({getStatusBadge(item.status)})
                              </span>
                              {idx < grupo.items.length - 1 && (
                                <span className="text-muted-foreground">,</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo textual */}
        {stats.total > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              {generateSummary()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
