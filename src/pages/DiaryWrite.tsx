import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useCareContext } from '@/hooks/use-care-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
 
const DiaryWrite = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentContext, isContextReady } = useCareContext();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mood = location.state?.mood || 'neutral';
  const isCustom = location.state?.isCustom || false;
  const [moodDisplay, setMoodDisplay] = useState<{ label: string; icon: string }>({ label: '', icon: '😐' });

  useEffect(() => {
    const loadMoodDisplay = async () => {
      if (isCustom) {
        // Buscar emoção personalizada
        const { data } = await supabase
          .from('custom_moods')
          .select('emoji, name')
          .eq('id', mood)
          .maybeSingle();
        
        if (data) {
          setMoodDisplay({ label: data.name, icon: data.emoji });
        }
      } else {
        // Usar emoções padrão
        const defaultMoods = {
          'very_happy': { label: 'Muito Feliz', icon: '😄' },
          'happy': { label: 'Feliz', icon: '😊' },
          'neutral': { label: 'Neutro', icon: '😐' },
          'sad': { label: 'Triste', icon: '😢' },
          'very_sad': { label: 'Muito Triste', icon: '😭' }
        };
        setMoodDisplay(defaultMoods[mood as keyof typeof defaultMoods] || defaultMoods.neutral);
      }
    };

    loadMoodDisplay();
  }, [mood, isCustom]);

  const handleSave = async () => {
    if (!isContextReady || !currentContext?.id) {
      toast({
        title: "Erro",
        description: "Contexto não disponível. Tente novamente.",
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

  if (!isContextReady) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isFormValid = content.trim().length > 0 && currentContext?.id && moodDisplay.label;

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
                  disabled={isLoading || !isFormValid}
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