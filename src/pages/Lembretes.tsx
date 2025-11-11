import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Plus,
  Clock,
  Edit,
  Trash2,
  Calendar,
  Bell,
  Heart,
  Zap,
  Star,
  Coffee,
  Apple,
  Sun,
  Activity,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cancelNotifications, isNativePlatform } from '@/lib/notifications';
import { NotificationPermissionDeniedAlert } from '@/components/NotificationPermissionPrompt';

interface Lembrete {
  id: string;
  nome: string;
  descricao?: string;
  datas: any;
  horarios: any;
  icone: string;
  created_at: string;
}

const iconeMap: Record<string, any> = {
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

const Lembretes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lembreteToDelete, setLembreteToDelete] = useState<string | null>(null);

  const getIconComponent = (iconeName: string) => {
    const IconComponent = iconeMap[iconeName] || Clock;
    return IconComponent;
  };

  useEffect(() => {
    if (user) {
      fetchLembretes();
    }
  }, [user]);

  const fetchLembretes = async () => {
    if (!user) return;

    try {
      // RLS já filtra por contexto, não precisa filtrar por context_id explicitamente
      const { data, error } = await supabase
        .from('lembretes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Converter JSON para arrays se necessário
      const processedData = (data || []).map(lembrete => ({
        ...lembrete,
        datas: Array.isArray(lembrete.datas) ? lembrete.datas : [],
        horarios: Array.isArray(lembrete.horarios) ? lembrete.horarios : []
      }));
      setLembretes(processedData);
    } catch (error) {
      console.error('Erro ao buscar lembretes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os lembretes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lembreteToDelete) return;

    try {
      // Cancel notifications before deleting
      if (isNativePlatform()) {
        const { data: lembrete } = await supabase
          .from('lembretes')
          .select('notification_ids')
          .eq('id', lembreteToDelete)
          .single();
        
        if (lembrete?.notification_ids) {
          const notificationIds = lembrete.notification_ids as number[];
          await cancelNotifications(notificationIds);
        }
      }
      
      const { error } = await supabase
        .from('lembretes')
        .delete()
        .eq('id', lembreteToDelete);

      if (error) throw error;

      setLembretes(prev => prev.filter(l => l.id !== lembreteToDelete));
      toast({
        title: "Sucesso",
        description: "Lembrete excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir lembrete:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o lembrete.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setLembreteToDelete(null);
    }
  };

  const formatFrequencia = (datas: string[]) => {
    if (!datas || datas.length === 0) return 'Sem agendamento';
    
    if (datas.includes('todos_os_dias')) return 'Todos os dias';
    if (datas.includes('dias_alternados')) return 'Dias alternados';
    if (datas.includes('semanal')) return 'Semanal';
    
    return `${datas.length} dia(s) específico(s)`;
  };

  const formatHorarios = (horarios: string[]) => {
    if (!horarios || horarios.length === 0) return 'Sem horário';
    return horarios.slice(0, 2).join(', ') + (horarios.length > 2 ? ` +${horarios.length - 2}` : '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando lembretes...</p>
        </div>
      </div>
    );
  }

  // Tela de boas-vindas quando não há lembretes
  if (lembretes.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="text-primary-foreground"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-mobile-xl font-semibold">Lembretes</h1>
          </div>
        </div>

        {/* Welcome content */}
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <div className="text-center space-y-6 max-w-sm">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-12 w-12 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Ops...</h2>
              <p className="text-muted-foreground">
                Você não tem nenhum lembrete personalizado
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/lembretes/novo')}
              className="w-full"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Agora
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de listagem
  return (
    <div className="min-h-screen bg-background">
      <NotificationPermissionDeniedAlert />
      <div className="relative">
        <button
          onClick={() => navigate('/home')}
          className="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="pt-16 pb-20 px-4">
          <div className="mb-6">
            <h1 className="text-mobile-2xl font-bold text-foreground mb-2">
              Lembretes
            </h1>
            <p className="text-muted-foreground">
              {lembretes.length} lembrete{lembretes.length !== 1 ? 's' : ''} cadastrado{lembretes.length !== 1 ? 's' : ''}
            </p>
          </div>

        {/* Lembretes List */}
        {lembretes.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum lembrete cadastrado
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lembretes.map((lembrete) => {
              const IconComponent = getIconComponent(lembrete.icone);
              return (
                <Card key={lembrete.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">{lembrete.nome}</h3>
                          {lembrete.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {lembrete.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`/lembretes/editar/${lembrete.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setLembreteToDelete(lembrete.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatFrequencia(lembrete.datas)}</span>
                    </Badge>
                    
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatHorarios(lembrete.horarios)}</span>
                    </Badge>
                  </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => navigate('/lembretes/novo')}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Lembrete</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir este lembrete? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lembretes;