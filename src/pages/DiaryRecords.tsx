import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomMood {
  emoji: string;
  name: string;
}

interface DiaryEntry {
  id: string;
  mood: string;
  content: string;
  created_at: string;
}

const DiaryRecords = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [customMoods, setCustomMoods] = useState<Record<string, CustomMood>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Buscar entradas
      const { data: entriesData, error: entriesError } = await supabase
        .from('diary_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;
      
      // Buscar emoções personalizadas
      const { data: customMoodsData } = await supabase
        .from('custom_moods')
        .select('id, emoji, name');

      // Criar um mapa de emoções personalizadas
      const moodsMap: Record<string, CustomMood> = {};
      if (customMoodsData) {
        customMoodsData.forEach(mood => {
          moodsMap[mood.id] = { emoji: mood.emoji, name: mood.name };
        });
      }

      setEntries(entriesData || []);
      setCustomMoods(moodsMap);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodDisplay = (mood: string) => {
    // Verificar se é uma emoção personalizada
    if (customMoods[mood]) {
      return {
        label: customMoods[mood].name,
        icon: customMoods[mood].emoji,
        color: 'text-primary'
      };
    }

    // Emoções padrão
    const defaultMoods = {
      'very_happy': { label: 'Muito Feliz', icon: '😄', color: 'text-green-500' },
      'happy': { label: 'Feliz', icon: '😊', color: 'text-green-400' },
      'neutral': { label: 'Neutro', icon: '😐', color: 'text-yellow-500' },
      'sad': { label: 'Triste', icon: '😢', color: 'text-orange-500' },
      'very_sad': { label: 'Muito Triste', icon: '😭', color: 'text-red-500' }
    };
    return defaultMoods[mood as keyof typeof defaultMoods] || defaultMoods.neutral;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="text-primary-foreground"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-mobile-xl font-semibold">Registros do Diário</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/diario/select-mood')}
            className="text-primary-foreground"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando registros...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Nenhum registro encontrado</p>
            <Button onClick={() => navigate('/diario/select-mood')}>
              Criar primeira entrada
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const moodDisplay = getMoodDisplay(entry.mood);
              return (
                <Card key={entry.id} className="card-health">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{moodDisplay.icon}</span>
                          <span className={`font-medium ${moodDisplay.color}`}>
                            {moodDisplay.label}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm leading-relaxed">
                          {entry.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryRecords;