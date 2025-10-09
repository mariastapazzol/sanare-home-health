import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, ArrowLeft, Pill, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

interface Medicamento {
  id: string;
  nome: string;
  dosagem: string;
  unidade_dose: string;
  quantidade_atual: number;
  precisa_receita: boolean;
  imagem_url?: string;
}

const Medicamentos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      fetchMedicamentos();
    }
  }, [user]);

  const fetchMedicamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('id, nome, dosagem, unidade_dose, quantidade_atual, precisa_receita, imagem_url');

      if (error) throw error;
      setMedicamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os medicamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMedicamento = async (id: string, nome: string) => {
    try {
      const { error } = await supabase
        .from('medicamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMedicamentos(prev => prev.filter(med => med.id !== id));
      toast({
        title: "Sucesso",
        description: `${nome} foi removido com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao excluir medicamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o medicamento.",
        variant: "destructive",
      });
    }
  };

  const editMedicamento = (id: string) => {
    navigate(`/medicamentos/editar/${id}`);
  };

  const filteredMedicamentos = medicamentos.filter(med =>
    med.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando medicamentos...</p>
        </div>
      </div>
    );
  }

  // Tela para quando não há medicamentos
  if (medicamentos.length === 0) {
    return (
      <div className="min-h-screen bg-background relative">
        <button
          onClick={() => navigate('/home')}
          className="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
            <Pill className="w-12 h-12 text-muted-foreground" />
          </div>
          
          <h1 className="text-mobile-2xl font-bold text-foreground mb-3">
            Ops... Você não tem nenhum medicamento cadastrado
          </h1>
          
          <p className="text-muted-foreground mb-8 max-w-sm">
            Comece adicionando seus medicamentos para manter controle da sua saúde.
          </p>

          <Button
            onClick={() => navigate('/medicamentos/novo')}
            className="btn-health"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Agora
          </Button>
        </div>
      </div>
    );
  }

  // Tela de listagem
  return (
    <div className="min-h-screen bg-background">
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
              Meus Medicamentos
            </h1>
            <p className="text-muted-foreground">
              {medicamentos.length} medicamento{medicamentos.length !== 1 ? 's' : ''} cadastrado{medicamentos.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Barra de pesquisa */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar medicamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Lista de medicamentos */}
          <div className="space-y-4">
            {filteredMedicamentos.map((medicamento) => (
              <Card key={medicamento.id} className="card-health">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {medicamento.imagem_url ? (
                        <img 
                          src={medicamento.imagem_url} 
                          alt={medicamento.nome}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Pill className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {medicamento.nome}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {medicamento.dosagem} {medicamento.unidade_dose}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Estoque: </span>
                        <span className="font-medium text-foreground">
                          {medicamento.quantidade_atual}
                        </span>
                      </div>
                      {medicamento.precisa_receita && (
                        <Badge variant="secondary" className="text-xs">
                          Precisa receita
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editMedicamento(medicamento.id)}
                        className="w-8 h-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir medicamento</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir "{medicamento.nome}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMedicamento(medicamento.id, medicamento.nome)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMedicamentos.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum medicamento encontrado para "{searchTerm}"
              </p>
            </div>
          )}
        </div>

        {/* Botão flutuante para adicionar */}
        <button
          onClick={() => navigate('/medicamentos/novo')}
          className="floating-action-btn"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Medicamentos;