import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useCareContext } from '@/hooks/use-care-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SINTOMAS_SUGESTOES = [
  'Dor de cabeça',
  'Febre',
  'Tontura',
  'Náusea',
  'Vômito',
  'Dor no peito',
  'Falta de ar',
  'Dor abdominal',
  'Dor nas costas',
  'Fadiga',
  'Fraqueza',
  'Tosse',
  'Dor de garganta',
];

const FATORES_RELACIONADOS = [
  'Esforço físico',
  'Alimentação',
  'Estresse',
  'Sono ruim',
  'Medicação',
  'Clima',
  'Outros',
];

const DURACOES = [
  'Menos de 1 hora',
  '1-3 horas',
  '3-6 horas',
  '6-12 horas',
  'Mais de 12 horas',
  'Contínuo',
];

const NovoSintoma = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentContext, isContextReady } = useCareContext();
  const [loading, setLoading] = useState(false);
  const [sintoma, setSintoma] = useState('');
  const [sintomaCustom, setSintomaCustom] = useState('');
  const [intensidade, setIntensidade] = useState([5]);
  const [duracao, setDuracao] = useState('');
  const [fatores, setFatores] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');

  const handleFatorToggle = (fator: string) => {
    setFatores(prev => 
      prev.includes(fator) 
        ? prev.filter(f => f !== fator)
        : [...prev, fator]
    );
  };

  const getIntensidadeColor = (value: number) => {
    if (value <= 3) return 'bg-success';
    if (value <= 6) return 'bg-warning';
    return 'bg-destructive';
  };

  const getIntensidadeLabel = (value: number) => {
    if (value <= 3) return 'Leve';
    if (value <= 6) return 'Moderado';
    return 'Intenso';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isContextReady || !currentContext?.id) {
      toast.error('Contexto não disponível. Tente novamente.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('sintomas')
        .insert({
          context_id: currentContext.id,
          user_id: user.id,
          tipo_sintoma: sintomaCustom || sintoma,
          intensidade: intensidade[0],
          duracao,
          fatores_relacionados: fatores,
          observacoes: observacoes || null,
        });

      if (error) throw error;

      toast.success('Sintoma registrado com sucesso!');
      navigate('/sintomas');
    } catch (error) {
      console.error('Erro ao registrar sintoma:', error);
      toast.error('Erro ao registrar sintoma');
    } finally {
      setLoading(false);
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

  const isFormValid = (sintoma || sintomaCustom) && duracao && currentContext?.id;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/sintomas')}
          className="absolute left-4 text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-mobile-xl font-semibold text-center">
          Registrar Sintoma
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* O que você sentiu? */}
        <div className="space-y-3">
          <Label>O que você sentiu?</Label>
          <div className="grid grid-cols-2 gap-2">
            {SINTOMAS_SUGESTOES.map((sug) => (
              <Button
                key={sug}
                type="button"
                variant={sintoma === sug ? "default" : "outline"}
                onClick={() => {
                  setSintoma(sug);
                  setSintomaCustom('');
                }}
                className="h-auto py-3"
              >
                {sug}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Ou digite outro sintoma</Label>
            <Input
              placeholder="Digite o sintoma..."
              value={sintomaCustom}
              onChange={(e) => {
                setSintomaCustom(e.target.value);
                setSintoma('');
              }}
            />
          </div>
        </div>

        {/* Intensidade */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Intensidade</Label>
            <span className={`text-lg font-bold px-3 py-1 rounded ${getIntensidadeColor(intensidade[0])} text-white`}>
              {intensidade[0]}/10 - {getIntensidadeLabel(intensidade[0])}
            </span>
          </div>
          <Slider
            value={intensidade}
            onValueChange={setIntensidade}
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sem dor</span>
            <span>Dor máxima</span>
          </div>
        </div>

        {/* Duração */}
        <div className="space-y-3">
          <Label>Duração</Label>
          <div className="grid grid-cols-2 gap-2">
            {DURACOES.map((dur) => (
              <Button
                key={dur}
                type="button"
                variant={duracao === dur ? "default" : "outline"}
                onClick={() => setDuracao(dur)}
                className="h-auto py-3"
              >
                {dur}
              </Button>
            ))}
          </div>
        </div>

        {/* Fatores relacionados */}
        <div className="space-y-3">
          <Label>Fatores relacionados</Label>
          <div className="space-y-2">
            {FATORES_RELACIONADOS.map((fator) => (
              <div key={fator} className="flex items-center space-x-2">
                <Checkbox
                  id={fator}
                  checked={fatores.includes(fator)}
                  onCheckedChange={() => handleFatorToggle(fator)}
                />
                <label
                  htmlFor={fator}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {fator}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label>Observações adicionais (opcional)</Label>
          <Textarea
            placeholder="Digite observações relevantes..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={4}
          />
        </div>

        {/* Botão Salvar */}
        <Button
          type="submit"
          className="btn-health w-full"
          disabled={loading || !isFormValid}
        >
          {loading ? 'Salvando...' : 'Registrar Sintoma'}
        </Button>
      </form>
    </div>
  );
};

export default NovoSintoma;
