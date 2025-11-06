import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCareContext } from '@/hooks/use-care-context';
import { supabase } from '@/integrations/supabase/client';

interface AddCustomMoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoodAdded: () => void;
}

// Lista de emojis comuns para seleção rápida
const commonEmojis = [
  '😊', '😢', '😡', '😰', '😴', '🤔', '😌', '🥳', 
  '😔', '😖', '😤', '😭', '😓', '🤗', '😇', '🙃',
  '😎', '🤒', '🤕', '🥴', '🤐', '😪', '😵', '🤯'
];

const AddCustomMoodDialog = ({ open, onOpenChange, onMoodAdded }: AddCustomMoodDialogProps) => {
  const { toast } = useToast();
  const { currentContext, isContextReady } = useCareContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emoji: '',
    name: ''
  });

  const handleSubmit = async () => {
    if (!formData.emoji || !formData.name.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um emoji e digite um nome.",
        variant: "destructive"
      });
      return;
    }

    if (!isContextReady || !currentContext?.id) {
      toast({
        title: "Erro",
        description: "Contexto não disponível.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('custom_moods')
        .insert({
          user_id: user.id,
          context_id: currentContext.id,
          emoji: formData.emoji,
          name: formData.name.trim()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Emoção personalizada criada!"
      });

      setFormData({ emoji: '', name: '' });
      onOpenChange(false);
      onMoodAdded();
    } catch (error: any) {
      console.error('Erro ao criar emoção:', error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao criar emoção.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Nova Emoção</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Emoji Selecionado</Label>
            {formData.emoji ? (
              <div className="flex items-center gap-3">
                <div className="text-4xl">{formData.emoji}</div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, emoji: '' }))}
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-2">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-2xl hover:scale-110 transition-transform active:scale-95 p-2 rounded-lg hover:bg-muted"
                    onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Emoção</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Ansioso, Empolgado, Cansado..."
              maxLength={30}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.emoji || !formData.name.trim()}
          >
            {loading ? 'Criando...' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomMoodDialog;