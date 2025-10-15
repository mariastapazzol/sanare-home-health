import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCareContext } from "@/hooks/use-care-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, X, Plus, Upload, Trash2 } from "lucide-react";
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
  imagem_url: string;
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nomeMedicamento, setNomeMedicamento] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        .from("receitas")
        .select("id, nome, imagem_url")
        .eq("context_id", selectedContextId)
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


  const handleExcluirReceita = async () => {
    if (!selectedReceita) return;

    try {
      // Excluir imagem do storage
      const urlParts = selectedReceita.imagem_url.split('/');
      const filePath = urlParts.slice(-2).join('/'); // context_id/filename
      
      await supabase.storage
        .from('prescricoes')
        .remove([filePath]);

      // Excluir receita do banco
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    handleUploadReceita(file);
  };

  const handleUploadReceita = async (file: File) => {
    if (!nomeMedicamento.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome da receita.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedContextId}/${crypto.randomUUID()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prescricoes')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Erro no upload",
          description: uploadError.message,
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('prescricoes')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("receitas")
        .insert({
          nome: nomeMedicamento,
          imagem_url: publicUrl,
          context_id: selectedContextId,
          user_id: user?.id,
        });

      if (insertError) {
        console.error('Receita insert error:', insertError);
        toast({
          title: "Erro ao adicionar receita",
          description: insertError.message,
          variant: "destructive",
        });
        return;
      }

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
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Receita
            </Button>
          </div>
        </main>
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
            <Card
              key={receita.id}
              className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              onClick={() => handleReceitaClick(receita)}
            >
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={receita.imagem_url}
                    alt={`Receita de ${receita.nome}`}
                    className="w-full h-full object-cover"
                  />
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
                src={selectedReceita?.imagem_url}
                alt={`Receita de ${selectedReceita?.nome}`}
                className="max-h-[60vh] object-contain"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="destructive" 
                onClick={handleExcluirReceita}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Receita
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Receita</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Nome da Receita
              </label>
              <Input
                type="text"
                placeholder="Ex: Receita Dipirona"
                value={nomeMedicamento}
                onChange={(e) => setNomeMedicamento(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !nomeMedicamento.trim()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Enviando..." : "Selecionar Foto da Receita"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
