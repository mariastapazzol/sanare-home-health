import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, AlertTriangle, Calendar, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface MedicamentoEstoque {
  id: string;
  nome: string;
  dosagem: string;
  unidade_dose: string;
  quantidade_atual: number;
  quantidade_por_dose: number;
  horarios: any[];
  precisa_receita: boolean;
  diasRestantes: number;
  imagem_url?: string;
}

const Estoque = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [medicamentos, setMedicamentos] = useState<MedicamentoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMedicamento, setSelectedMedicamento] = useState<MedicamentoEstoque | null>(null);
  const [novaQuantidade, setNovaQuantidade] = useState("");

  useEffect(() => {
    if (user) {
      fetchMedicamentosEstoque();
    }
  }, [user]);

  const fetchMedicamentosEstoque = async () => {
    try {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('id, nome, dosagem, unidade_dose, quantidade_atual, quantidade_por_dose, horarios, precisa_receita, imagem_url')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Calcular dias restantes para cada medicamento
      const medicamentosComDias = data?.map(med => {
        // Parse horarios JSON safely
        const horarios = Array.isArray(med.horarios) ? med.horarios : [];
        const dosesPerDay = horarios.length > 0 ? horarios.length : 1;
        const totalDosesDiarias = med.quantidade_por_dose * dosesPerDay;
        const diasRestantes = totalDosesDiarias > 0 ? Math.floor(med.quantidade_atual / totalDosesDiarias) : 0;
        
        return {
          ...med,
          horarios,
          diasRestantes
        };
      }) || [];

      // Ordenar por dias restantes (menor para maior)
      medicamentosComDias.sort((a, b) => a.diasRestantes - b.diasRestantes);

      setMedicamentos(medicamentosComDias);
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o estoque de medicamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (dias: number) => {
    if (dias <= 3) return 'text-destructive';
    if (dias <= 7) return 'text-warning';
    return 'text-success';
  };

  const getStatusBadge = (dias: number) => {
    if (dias <= 3) return { text: 'Crítico', variant: 'destructive' as const };
    if (dias <= 7) return { text: 'Atenção', variant: 'default' as const };
    return { text: 'Normal', variant: 'secondary' as const };
  };

  const handleRenovarEstoque = (medicamento: MedicamentoEstoque) => {
    setSelectedMedicamento(medicamento);
    setNovaQuantidade("");
    setDialogOpen(true);
  };

  const handleConfirmarRenovacao = async () => {
    if (!selectedMedicamento || !novaQuantidade || Number(novaQuantidade) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma quantidade válida.",
        variant: "destructive",
      });
      return;
    }

    try {
      const quantidadeAtualizada = selectedMedicamento.quantidade_atual + Number(novaQuantidade);
      
      const { error } = await supabase
        .from('medicamentos')
        .update({ quantidade_atual: quantidadeAtualizada })
        .eq('id', selectedMedicamento.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Estoque renovado!",
        description: `${novaQuantidade} comprimidos adicionados ao estoque.`,
      });

      setDialogOpen(false);
      fetchMedicamentosEstoque();
    } catch (error) {
      console.error('Erro ao renovar estoque:', error);
      toast({
        title: "Erro",
        description: "Não foi possível renovar o estoque.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando estoque...</p>
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
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
          
          <h1 className="text-mobile-2xl font-bold text-foreground mb-3">
            Nenhum medicamento encontrado
          </h1>
          
          <p className="text-muted-foreground mb-8 max-w-sm">
            Adicione medicamentos para monitorar seu estoque.
          </p>

          <Button
            onClick={() => navigate('/medicamentos/novo')}
            className="btn-health"
          >
            <Package className="w-5 h-5 mr-2" />
            Adicionar Medicamento
          </Button>
        </div>
      </div>
    );
  }

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
              Monitore seu estoque
            </h1>
            <p className="text-muted-foreground">
              Veja quais medicamentos estão próximos de acabar
            </p>
          </div>

          {/* Lista de medicamentos */}
          <div className="space-y-4">
            {medicamentos.map((medicamento) => {
              const status = getStatusBadge(medicamento.diasRestantes);
              
              return (
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
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1 truncate">
                            {medicamento.nome}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {medicamento.dosagem} {medicamento.unidade_dose}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant={status.variant} className="text-xs">
                          {status.text}
                        </Badge>
                        {medicamento.precisa_receita && (
                          <Badge variant="outline" className="text-xs">
                            Receita
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Estoque atual: </span>
                          <span className="font-medium text-foreground">
                            {medicamento.quantidade_atual}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className={`font-bold ${getStatusColor(medicamento.diasRestantes)}`}>
                          {medicamento.diasRestantes} dia{medicamento.diasRestantes !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    {medicamento.diasRestantes <= 7 && (
                      <div className="mt-3 p-2 rounded-lg bg-warning/10 border border-warning/20">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          <p className="text-xs text-warning">
                            {medicamento.diasRestantes <= 3 
                              ? "Medicamento acabando! Compre mais urgentemente."
                              : "Medicamento com estoque baixo. Considere comprar mais."
                            }
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <Button 
                        onClick={() => handleRenovarEstoque(medicamento)}
                        className="w-full btn-health"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Renovar meu estoque
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de renovação de estoque */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Estoque</DialogTitle>
            <DialogDescription>
              {selectedMedicamento && (
                <span className="block mt-2">
                  <strong>{selectedMedicamento.nome}</strong> - {selectedMedicamento.dosagem} {selectedMedicamento.unidade_dose}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Quantos comprimidos você deseja adicionar ao seu estoque?
              </label>
              <Input
                type="number"
                placeholder="Digite a quantidade de comprimidos"
                value={novaQuantidade}
                onChange={(e) => setNovaQuantidade(e.target.value)}
                min="1"
              />
            </div>

            {selectedMedicamento && novaQuantidade && Number(novaQuantidade) > 0 && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Resumo:</p>
                <p className="text-sm">
                  <span className="font-medium">Dosagem:</span> {selectedMedicamento.dosagem} {selectedMedicamento.unidade_dose}
                </p>
                <div className="border-t border-border mt-2 pt-2">
                  <p className="text-sm">
                    <span className="font-medium">Comprimidos existentes:</span> {selectedMedicamento.quantidade_atual}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Nova remessa:</span> {novaQuantidade} comprimidos
                  </p>
                  <div className="border-t border-border mt-2 pt-2">
                    <p className="text-sm font-semibold">
                      <span className="font-medium">Total de comprimidos:</span> {selectedMedicamento.quantidade_atual + Number(novaQuantidade)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarRenovacao}
              className="flex-1 btn-health"
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;