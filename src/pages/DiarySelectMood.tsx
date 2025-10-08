import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const DiarySelectMood = () => {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<string>('');

  const moods = [
    { value: 'very_happy', label: 'Muito Feliz', icon: '😄', color: 'text-green-500' },
    { value: 'happy', label: 'Feliz', icon: '😊', color: 'text-green-400' },
    { value: 'neutral', label: 'Neutro', icon: '😐', color: 'text-yellow-500' },
    { value: 'sad', label: 'Triste', icon: '😢', color: 'text-orange-500' },
    { value: 'very_sad', label: 'Muito Triste', icon: '😭', color: 'text-red-500' }
  ];

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    navigate('/diary/write', { state: { mood } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/diary')}
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
            <div className="grid gap-4">
              {moods.map((mood) => (
                <Button
                  key={mood.value}
                  variant="outline"
                  className="h-16 flex items-center justify-start space-x-4 text-left hover:bg-muted/50"
                  onClick={() => handleMoodSelect(mood.value)}
                >
                  <span className="text-2xl">{mood.icon}</span>
                  <span className={`font-medium ${mood.color}`}>{mood.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiarySelectMood;
