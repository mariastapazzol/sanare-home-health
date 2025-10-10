import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useCareContext } from '@/hooks/use-care-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ValidacaoSinal {
  status: 'normal' | 'atencao' | 'critico';
  mensagem: string;
}

const NovoSinalVital = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentContext } = useCareContext();
  const [loading, setLoading] = useState(false);
  const [pressaoSistolica, setPressaoSistolica] = useState('');
  const [pressaoDiastolica, setPressaoDiastolica] = useState('');
  const [frequenciaCardiaca, setFrequenciaCardiaca] = useState('');
  const [saturacaoOxigenio, setSaturacaoOxigenio] = useState('');
  const [temperatura, setTemperatura] = useState('');

  const validarPressaoSistolica = (valor: string): ValidacaoSinal | null => {
    if (!valor) return null;
    const num = parseFloat(valor);
    if (num < 120) return { status: 'normal', mensagem: 'Normal' };
    if (num < 140) return { status: 'atencao', mensagem: 'Atenção - Pré-hipertensão' };
    return { status: 'critico', mensagem: 'Crítico - Hipertensão' };
  };

  const validarPressaoDiastolica = (valor: string): ValidacaoSinal | null => {
    if (!valor) return null;
    const num = parseFloat(valor);
    if (num < 80) return { status: 'normal', mensagem: 'Normal' };
    if (num < 90) return { status: 'atencao', mensagem: 'Atenção - Pré-hipertensão' };
    return { status: 'critico', mensagem: 'Crítico - Hipertensão' };
  };

  const validarFrequenciaCardiaca = (valor: string): ValidacaoSinal | null => {
    if (!valor) return null;
    const num = parseFloat(valor);
    if (num >= 60 && num <= 100) return { status: 'normal', mensagem: 'Normal' };
    if (num >= 50 && num <= 110) return { status: 'atencao', mensagem: 'Atenção' };
    return { status: 'critico', mensagem: 'Crítico' };
  };

  const validarSaturacao = (valor: string): ValidacaoSinal | null => {
    if (!valor) return null;
    const num = parseFloat(valor);
    if (num >= 95) return { status: 'normal', mensagem: 'Normal' };
    if (num >= 90) return { status: 'atencao', mensagem: 'Atenção - Baixa saturação' };
    return { status: 'critico', mensagem: 'Crítico - Procure ajuda médica' };
  };

  const validarTemperatura = (valor: string): ValidacaoSinal | null => {
    if (!valor) return null;
    const num = parseFloat(valor);
    if (num >= 36 && num <= 37.5) return { status: 'normal', mensagem: 'Normal' };
    if (num >= 37.6 && num <= 38) return { status: 'atencao', mensagem: 'Atenção - Febre leve' };
    return { status: 'critico', mensagem: 'Crítico - Febre alta' };
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'normal':
        return 'text-success';
      case 'atencao':
        return 'text-warning';
      case 'critico':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBgColor = (status: string | undefined) => {
    switch (status) {
      case 'normal':
        return 'bg-success/10 border-success';
      case 'atencao':
        return 'bg-warning/10 border-warning';
      case 'critico':
        return 'bg-destructive/10 border-destructive';
      default:
        return 'bg-muted/10 border-muted';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !currentContext) {
      toast.error('Contexto não disponível. Por favor, faça login novamente.');
      return;
    }
    
    if (!pressaoSistolica && !pressaoDiastolica && !frequenciaCardiaca && !saturacaoOxigenio && !temperatura) {
      toast.error('Por favor, preencha pelo menos um sinal vital');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('sinais_vitais')
        .insert({
          context_id: currentContext.id,
          user_id: user.id,
          pressao_sistolica: pressaoSistolica ? parseFloat(pressaoSistolica) : null,
          pressao_diastolica: pressaoDiastolica ? parseFloat(pressaoDiastolica) : null,
          frequencia_cardiaca: frequenciaCardiaca ? parseFloat(frequenciaCardiaca) : null,
          saturacao_oxigenio: saturacaoOxigenio ? parseFloat(saturacaoOxigenio) : null,
          temperatura: temperatura ? parseFloat(temperatura) : null,
        });

      if (error) throw error;

      toast.success('Sinais vitais registrados com sucesso!');
      navigate('/sintomas');
    } catch (error) {
      console.error('Erro ao registrar sinais vitais:', error);
      toast.error('Erro ao registrar sinais vitais');
    } finally {
      setLoading(false);
    }
  };

  const validacaoPA = validarPressaoSistolica(pressaoSistolica);
  const validacaoPAD = validarPressaoDiastolica(pressaoDiastolica);
  const validacaoFC = validarFrequenciaCardiaca(frequenciaCardiaca);
  const validacaoSat = validarSaturacao(saturacaoOxigenio);
  const validacaoTemp = validarTemperatura(temperatura);

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
          Registrar Sinais Vitais
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Pressão Arterial */}
        <Card className={`card-health border-2 ${getStatusBgColor(validacaoPA?.status || validacaoPAD?.status)}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Pressão Arterial</Label>
              {(validacaoPA || validacaoPAD) && (
                <span className={`text-sm font-medium ${getStatusColor(validacaoPA?.status || validacaoPAD?.status)}`}>
                  {validacaoPA?.mensagem || validacaoPAD?.mensagem}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sistolica">Sistólica (mmHg)</Label>
                <Input
                  id="sistolica"
                  type="number"
                  placeholder="120"
                  value={pressaoSistolica}
                  onChange={(e) => setPressaoSistolica(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diastolica">Diastólica (mmHg)</Label>
                <Input
                  id="diastolica"
                  type="number"
                  placeholder="80"
                  value={pressaoDiastolica}
                  onChange={(e) => setPressaoDiastolica(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Frequência Cardíaca */}
        <Card className={`card-health border-2 ${getStatusBgColor(validacaoFC?.status)}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="fc" className="text-base font-semibold">Frequência Cardíaca (bpm)</Label>
              {validacaoFC && (
                <span className={`text-sm font-medium ${getStatusColor(validacaoFC.status)}`}>
                  {validacaoFC.mensagem}
                </span>
              )}
            </div>
            <Input
              id="fc"
              type="number"
              placeholder="75"
              value={frequenciaCardiaca}
              onChange={(e) => setFrequenciaCardiaca(e.target.value)}
            />
          </div>
        </Card>

        {/* Saturação de Oxigênio */}
        <Card className={`card-health border-2 ${getStatusBgColor(validacaoSat?.status)}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="saturacao" className="text-base font-semibold">Saturação de O₂ (%)</Label>
              {validacaoSat && (
                <span className={`text-sm font-medium ${getStatusColor(validacaoSat.status)}`}>
                  {validacaoSat.mensagem}
                </span>
              )}
            </div>
            <Input
              id="saturacao"
              type="number"
              placeholder="98"
              max="100"
              value={saturacaoOxigenio}
              onChange={(e) => setSaturacaoOxigenio(e.target.value)}
            />
          </div>
        </Card>

        {/* Temperatura */}
        <Card className={`card-health border-2 ${getStatusBgColor(validacaoTemp?.status)}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperatura" className="text-base font-semibold">Temperatura (°C)</Label>
              {validacaoTemp && (
                <span className={`text-sm font-medium ${getStatusColor(validacaoTemp.status)}`}>
                  {validacaoTemp.mensagem}
                </span>
              )}
            </div>
            <Input
              id="temperatura"
              type="number"
              step="0.1"
              placeholder="36.5"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
            />
          </div>
        </Card>

        {/* Alerta de Valores Críticos */}
        {(validacaoPA?.status === 'critico' || 
          validacaoPAD?.status === 'critico' || 
          validacaoFC?.status === 'critico' || 
          validacaoSat?.status === 'critico' || 
          validacaoTemp?.status === 'critico') && (
          <Card className="bg-destructive/10 border-destructive border-2">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Atenção!</p>
                <p className="text-sm text-destructive/90">
                  Valores críticos detectados. Considere procurar atendimento médico.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Botão Salvar */}
        <Button
          type="submit"
          className="btn-health w-full"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Registrar Sinais Vitais'}
        </Button>
      </form>
    </div>
  );
};

export default NovoSinalVital;
