import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReceitaModalProps {
  open: boolean;
  onClose: () => void;
  medicamentoId: string;
  medicamentoNome: string;
  prescriptionImageUrl: string | null;
  prescriptionStatus: 'valid' | 'missing' | 'used';
  userId: string;
  onUpdate: () => void;
}

export const ReceitaModal = ({
  open,
  onClose,
  medicamentoId,
  medicamentoNome,
  prescriptionImageUrl,
  prescriptionStatus,
  userId,
  onUpdate,
}: ReceitaModalProps) => {
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleMarcarUsada = () => {
    setShowReplaceDialog(true);
  };

  const handleNaoCadastrarNova = async () => {
    try {
      const { error } = await supabase
        .from('medicamentos')
        .update({ 
          prescription_status: 'used',
          updated_at: new Date().toISOString()
        })
        .eq('id', medicamentoId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Receita marcada como usada",
        description: "A receita foi marcada como usada.",
      });

      setShowReplaceDialog(false);
      onClose();
      onUpdate();
    } catch (error) {
      console.error('Erro ao marcar receita como usada:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a receita como usada.",
        variant: "destructive",
      });
    }
  };

  const handleSimCadastrarNova = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem não pode ser maior que 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Validar tipo
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast({
          title: "Erro",
          description: "Apenas imagens JPG e PNG são aceitas.",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      try {
        // Delete old prescription if exists
        if (prescriptionImageUrl) {
          const oldPath = prescriptionImageUrl.split('/').slice(-2).join('/');
          await supabase.storage
            .from('prescricoes')
            .remove([oldPath]);
        }

        // Upload new prescription
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${timestamp}.${fileExt}`;
        const filePath = `medicamentos/${userId}/${medicamentoId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('prescricoes')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('prescricoes')
          .getPublicUrl(filePath);

        // Update medicamento
        const { error: updateError } = await supabase
          .from('medicamentos')
          .update({ 
            prescription_image_url: publicUrl,
            prescription_status: 'valid',
            updated_at: new Date().toISOString()
          })
          .eq('id', medicamentoId)
          .eq('user_id', userId);

        if (updateError) throw updateError;

        toast({
          title: "Receita atualizada",
          description: "A nova receita foi cadastrada com sucesso.",
        });

        setShowReplaceDialog(false);
        onClose();
        onUpdate();
      } catch (error) {
        console.error('Erro ao fazer upload da receita:', error);
        toast({
          title: "Erro",
          description: "Falha no upload da receita. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  if (showReplaceDialog) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar nova receita?</DialogTitle>
            <DialogDescription>
              Você marcou a receita de <strong>{medicamentoNome}</strong> como usada.
              Deseja cadastrar uma nova receita agora?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleNaoCadastrarNova}
              disabled={uploading}
              className="flex-1"
            >
              Não
            </Button>
            <Button
              onClick={handleSimCadastrarNova}
              disabled={uploading}
              className="flex-1 btn-health"
            >
              {uploading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Sim
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receita - {medicamentoNome}</DialogTitle>
          <DialogDescription>
            Visualize a receita do medicamento
          </DialogDescription>
        </DialogHeader>

        {prescriptionImageUrl && (
          <div className="relative w-full max-h-[60vh] overflow-auto rounded-lg border">
            <img
              src={prescriptionImageUrl}
              alt={`Receita de ${medicamentoNome}`}
              className="w-full h-auto object-contain"
              onClick={() => window.open(prescriptionImageUrl, '_blank')}
              style={{ cursor: 'zoom-in' }}
            />
          </div>
        )}

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
          <Button
            onClick={handleMarcarUsada}
            className="flex-1 btn-health"
          >
            Receita usada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
