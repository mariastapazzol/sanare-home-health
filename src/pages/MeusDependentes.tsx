import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Users, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Dependent {
  id: string;
  name: string;
  username: string;
  email: string;
  birth_date: string;
}

const MeusDependentes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDependents();
    }
  }, [user]);

  const loadDependents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, email, birth_date')
        .eq('caregiver_user_id', user.id)
        .eq('role', 'dependente');

      if (error) {
        console.error('Error loading dependents:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dependentes",
          variant: "destructive"
        });
      } else {
        setDependents(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDependent = async (dependentId: string) => {
    try {
      // This will cascade delete the profile, care_contexts, and all related data
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', dependentId);

      if (error) {
        console.error('Error removing dependent:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover dependente",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Dependente removido com sucesso",
        });
        loadDependents();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-health-light to-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Meus Dependentes
          </h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {/* Dependents List */}
        {loading ? (
          <Card className="card-health p-6">
            <p className="text-center text-muted-foreground">Carregando...</p>
          </Card>
        ) : dependents.length === 0 ? (
          <Card className="card-health p-6">
            <p className="text-center text-muted-foreground">
              Você ainda não tem dependentes cadastrados.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {dependents.map((dependent) => (
              <Card key={dependent.id} className="card-health p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{dependent.name}</h3>
                    <p className="text-sm text-muted-foreground">@{dependent.username}</p>
                    <p className="text-sm text-muted-foreground">{dependent.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Nascimento: {formatDate(dependent.birth_date)}
                    </p>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover dependente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Todos os dados relacionados a este dependente serão removidos permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveDependent(dependent.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add New Dependent Button */}
        <Button
          onClick={() => navigate('/auth/signup-dependente')}
          className="btn-health w-full"
        >
          Adicionar Novo Dependente
        </Button>
      </div>
    </div>
  );
};

export default MeusDependentes;
