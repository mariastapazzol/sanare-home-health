import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCareContext } from "@/hooks/use-care-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface Receita {
  id: string;
  nome: string;
  prescription_image_url: string | null;
  receita_url: string | null;
  prescription_status: string;
}

export default function Receitas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedContextId } = useCareContext();
  const { toast } = useToast();
  
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [filteredReceitas, setFilteredReceitas] = useState<Receita[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReceita, setSelectedReceita] = useState<Receita | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user && selectedContextId) {
      fetchReceitas();
    }
  }, [user, selectedContextId]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredReceitas(receitas);
    } else {
      const filtered = receitas.filter((receita) =>
        receita.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReceitas(filtered);
    }
  }, [searchTerm, receitas]);

  const fetchReceitas = async () => {
    try {
      const { data, error } = await supabase
        .from("medicamentos")
        .select("id, nome, prescription_image_url, receita_url, prescription_status")
        .eq("context_id", selectedContextId)
        .not("prescription_image_url", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReceitas(data || []);
      setFilteredReceitas(data || []);
    } catch (error) {
      console.error("Erro ao buscar receitas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as receitas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReceitaClick = (receita: Receita) => {
    setSelectedReceita(receita);
    setDialogOpen(true);
  };

  const handleMarcarComoUsada = async () => {
    if (!selectedReceita) return;

    try {
      const { error } = await supabase
        .from("medicamentos")
        .update({ prescription_status: "used" })
        .eq("id", selectedReceita.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Receita marcada como usada.",
      });

      fetchReceitas();
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro ao marcar receita como usada:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a receita como usada.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Carregando receitas...</div>
      </div>
    );
  }

  if (receitas.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Receitas</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground mb-6">
              Nenhuma receita cadastrada ainda.
            </p>
            <Button onClick={() => navigate("/medicamentos")}>
              Cadastrar Medicamento com Receita
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Receitas</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar receita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredReceitas.map((receita) => (
            <Card
              key={receita.id}
              className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              onClick={() => handleReceitaClick(receita)}
            >
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={receita.prescription_image_url || receita.receita_url || ""}
                    alt={`Receita de ${receita.nome}`}
                    className="w-full h-full object-cover"
                  />
                  {receita.prescription_status === "used" && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Usada
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate">
                    {receita.nome}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedReceita?.nome}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="w-full flex justify-center">
              <img
                src={selectedReceita?.prescription_image_url || selectedReceita?.receita_url || ""}
                alt={`Receita de ${selectedReceita?.nome}`}
                className="max-h-[60vh] object-contain"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Minimizar
              </Button>
              {selectedReceita?.prescription_status !== "used" && (
                <Button onClick={handleMarcarComoUsada}>
                  Marcar como Usada
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
