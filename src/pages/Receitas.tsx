import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCareContext } from "@/hooks/use-care-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ReceitaCard } from "@/components/receitas/ReceitaCard";
import { ReceitaDialog } from "@/components/receitas/ReceitaDialog";
import { UploadReceitaDialog } from "@/components/receitas/UploadReceitaDialog";
import { ReceitasEmpty } from "@/components/receitas/ReceitasEmpty";

interface Receita {
  id: string;
  nome: string;
  imagem_url: string;
  medicamento_id?: string;
  usada: boolean;
}

export default function Receitas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentContext, isContextReady } = useCareContext();
  const { toast } = useToast();
  
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [filteredReceitas, setFilteredReceitas] = useState<Receita[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReceita, setSelectedReceita] = useState<Receita | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nomeMedicamento, setNomeMedicamento] = useState("");

  useEffect(() => {
    if (user && isContextReady && currentContext?.id) {
      fetchReceitas();
    }
  }, [user, isContextReady, currentContext?.id]);

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
    if (!currentContext?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("receitas")
        .select("id, nome, imagem_url, medicamento_id, usada")
        .eq("context_id", currentContext.id)
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

  const handleToggleUsada = async () => {
    if (!selectedReceita) return;

    try {
      const { error } = await supabase
        .from("receitas")
        .update({ usada: !selectedReceita.usada })
        .eq("id", selectedReceita.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: selectedReceita.usada
          ? "Receita desmarcada como usada."
          : "Receita marcada como usada.",
      });

      fetchReceitas();
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar receita:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a receita.",
        variant: "destructive",
      });
    }
  };

  const handleExcluirReceita = async () => {
    if (!selectedReceita) return;

    try {
      const urlParts = selectedReceita.imagem_url.split('/');
      const filePath = urlParts.slice(-2).join('/');
      
      await supabase.storage
        .from('prescricoes')
        .remove([filePath]);

      const { error } = await supabase
        .from("receitas")
        .delete()
        .eq("id", selectedReceita.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Receita excluída com sucesso.",
      });

      fetchReceitas();
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir receita:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a receita.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Formato não suportado. Use JPG, PNG, WEBP ou PDF.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!nomeMedicamento.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome da receita.",
        variant: "destructive",
      });
      return;
    }

    if (!currentContext?.id) {
      toast({
        title: "Erro",
        description: "Contexto não está disponível.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentContext.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('prescricoes')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prescricoes')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("receitas")
        .insert({
          nome: nomeMedicamento,
          imagem_url: publicUrl,
          context_id: currentContext.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Sucesso",
        description: "Receita adicionada com sucesso.",
      });

      setNomeMedicamento("");
      setUploadDialogOpen(false);
      fetchReceitas();
    } catch (error: any) {
      console.error("Erro ao fazer upload da receita:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar a receita.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!isContextReady || loading) {
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
        <main className="container mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!currentContext) {
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
              Selecione um paciente dependente vinculado para visualizar receitas.
            </p>
          </div>
        </main>
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
          <ReceitasEmpty 
            onAddReceita={() => setUploadDialogOpen(true)}
            onAddMedicamento={() => navigate("/medicamentos/novo")}
          />
        </main>

        <UploadReceitaDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          nomeMedicamento={nomeMedicamento}
          onNomeChange={setNomeMedicamento}
          uploading={uploading}
          onFileSelect={handleFileSelect}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Receitas</h1>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Receita
          </Button>
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
            <ReceitaCard
              key={receita.id}
              receita={receita}
              onClick={() => handleReceitaClick(receita)}
            />
          ))}
        </div>
      </main>

      <ReceitaDialog
        receita={selectedReceita}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onToggleUsada={handleToggleUsada}
        onExcluir={handleExcluirReceita}
      />

      <UploadReceitaDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        nomeMedicamento={nomeMedicamento}
        onNomeChange={setNomeMedicamento}
        uploading={uploading}
        onFileSelect={handleFileSelect}
      />
    </div>
  );
}
