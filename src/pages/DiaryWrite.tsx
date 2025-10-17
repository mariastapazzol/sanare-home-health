import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useCareContext } from '@/hooks/use-care-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DiaryWrite = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentContext } = useCareContext();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mood = location.state?.mood || 'neutral';

  const getMoodDisplay = (mood: string) => {
    const moods = {
      'very_happy': { label: 'Muito Feliz', icon: '😄' },
      'happy': { label: 'Feliz', icon: '😊' },
      'neutral': { label: 'Neutro', icon: '😐' },
      'sad': { label: 'Triste', icon: '😢' },
      'very_sad': { label: 'Muito Triste', icon: '😭' }
    };
    return moods[mood as keyof typeof moods] || moods.neutral;
  };

  const handleSave = async () => {
    if (!user || !currentContext) {
      toast({
        title: "Erro",
        description: "Selecione um paciente dependente vinculado antes de salvar.",
        variant: "destructive"
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, escreva algo antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('diary_entries')
        .insert({
          context_id: currentContext.id,
          mood,
          content: content.trim()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Entrada do diário salva com sucesso!"
      });

      navigate('/diario/records');
    } catch (error: any) {
      console.error('Erro ao salvar entrada:', error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao salvar entrada do diário.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const moodDisplay = getMoodDisplay(mood);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/diario')}
            className="text-primary-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-mobile-xl font-semibold">Escrever no Diário</h1>
        </div>
      </div>

      <div className="p-4">
        <Card className="card-health mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">{moodDisplay.icon}</span>
              <span className="font-medium">Sentindo-se: {moodDisplay.label}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-health">
          <CardHeader>
            <CardTitle>O que você gostaria de compartilhar?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Escreva seus pensamentos, sentimentos ou reflexões..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => navigate('/diario')}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiaryWrite;