import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCareContext } from '@/hooks/use-care-context';
import AddCustomMoodDialog from '@/components/diary/AddCustomMoodDialog';

interface CustomMood {
  id: string;
  emoji: string;
  name: string;
}

const Diary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentContext, isContextReady } = useCareContext();
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [hasEntries, setHasEntries] = useState<boolean | null>(null);
  const [customMoods, setCustomMoods] = useState<CustomMood[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkExistingEntries();
    }
  }, [user]);

  useEffect(() => {
    if (isContextReady) {
      fetchCustomMoods();
    }
  }, [isContextReady, currentContext?.id]);

  const fetchCustomMoods = async () => {
    if (!currentContext?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_moods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomMoods(data || []);
    } catch (error) {
      console.error('Erro ao buscar emoções:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingEntries = async () => {
    if (!user) return;

    try {
      // RLS filtra automaticamente por contexto
      const { data, error } = await supabase
        .from('diary_entries')
        .select('id')
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        navigate('/diario/records');
      } else {
        setHasEntries(false);
      }
    } catch (error) {
      console.error('Erro ao verificar entradas:', error);
      setHasEntries(false);
    }
  };

  if (hasEntries === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const moods = [
    { value: 'very_happy', label: 'Muito Feliz', icon: '😄', color: 'text-green-500' },
    { value: 'happy', label: 'Feliz', icon: '😊', color: 'text-green-400' },
    { value: 'neutral', label: 'Neutro', icon: '😐', color: 'text-yellow-500' },
    { value: 'sad', label: 'Triste', icon: '😢', color: 'text-orange-500' },
    { value: 'very_sad', label: 'Muito Triste', icon: '😭', color: 'text-red-500' }
  ];

  const handleMoodSelect = (mood: string, isCustom = false) => {
    setSelectedMood(mood);
    navigate('/diario/write', { state: { mood, isCustom } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="text-primary-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-mobile-xl font-semibold">Diário Emocional</h1>
        </div>
      </div>

      <div className="p-4">
        <Card className="card-health">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Como você está se sentindo hoje?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {/* Emoções padrão */}
              {moods.map((mood) => (
                <Button
                  key={mood.value}
                  variant="outline"
                  className="h-14 flex items-center justify-start space-x-4 text-left hover:bg-muted/50"
                  onClick={() => handleMoodSelect(mood.value)}
                >
                  <span className="text-2xl">{mood.icon}</span>
                  <span className={`font-medium ${mood.color}`}>{mood.label}</span>
                </Button>
              ))}

              {/* Emoções personalizadas */}
              {customMoods.map((mood) => (
                <Button
                  key={mood.id}
                  variant="outline"
                  className="h-14 flex items-center justify-start space-x-4 text-left hover:bg-muted/50"
                  onClick={() => handleMoodSelect(mood.id, true)}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="font-medium text-primary">{mood.name}</span>
                </Button>
              ))}

              {/* Botão "Outro" para criar nova emoção */}
              <Button
                onClick={() => setShowAddDialog(true)}
                variant="outline"
                className="h-14 flex items-center justify-start space-x-4 text-left hover:bg-muted/50 border-dashed border-2"
                disabled={loading}
              >
                <span className="text-2xl">➕</span>
                <span className="font-medium text-muted-foreground">Outro</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <AddCustomMoodDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onMoodAdded={fetchCustomMoods}
        />
      </div>
    </div>
  );
};

export default Diary;