import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Activity, Heart, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sintoma {
  id: string;
  tipo_sintoma: string;
  intensidade: number;
  duracao: string;
  fatores_relacionados: string[];
  observacoes: string | null;
  created_at: string;
}

interface SinalVital {
  id: string;
  pressao_sistolica: number | null;
  pressao_diastolica: number | null;
  frequencia_cardiaca: number | null;
  saturacao_oxigenio: number | null;
  temperatura: number | null;
  created_at: string;
}

const Sintomas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sintomas, setSintomas] = useState<Sintoma[]>([]);
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar sintomas
      const { data: sintomasData } = await supabase
        .from('sintomas' as any)
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Buscar sinais vitais
      const { data: sinaisData } = await supabase
        .from('sinais_vitais' as any)
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (sintomasData) setSintomas(sintomasData as any);
      if (sinaisData) setSinaisVitais(sinaisData as any);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensidadeColor = (intensidade: number) => {
    if (intensidade <= 3) return 'text-success';
    if (intensidade <= 6) return 'text-warning';
    return 'text-destructive';
  };

  const getSinalVitalStatus = (tipo: string, valor: number | null) => {
    if (!valor) return 'text-muted-foreground';
    
    switch (tipo) {
      case 'pressao_sistolica':
        if (valor < 120) return 'text-success';
        if (valor < 140) return 'text-warning';
        return 'text-destructive';
      case 'pressao_diastolica':
        if (valor < 80) return 'text-success';
        if (valor < 90) return 'text-warning';
        return 'text-destructive';
      case 'saturacao':
        if (valor >= 95) return 'text-success';
        if (valor >= 90) return 'text-warning';
        return 'text-destructive';
      case 'temperatura':
        if (valor >= 36 && valor <= 37.5) return 'text-success';
        if (valor >= 37.6 && valor <= 38) return 'text-warning';
        return 'text-destructive';
      case 'fc':
        if (valor >= 60 && valor <= 100) return 'text-success';
        if (valor >= 50 && valor <= 110) return 'text-warning';
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/home')}
          className="absolute left-4 text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-mobile-xl font-semibold text-center">
          Sintomas e Sinais Vitais
        </h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => navigate('/sintomas/novo')}
            className="btn-health h-20 flex-col space-y-2"
          >
            <AlertCircle className="h-6 w-6" />
            <span>Registrar Sintoma</span>
          </Button>
          
          <Button
            onClick={() => navigate('/sinais-vitais/novo')}
            className="btn-health h-20 flex-col space-y-2"
          >
            <Heart className="h-6 w-6" />
            <span>Registrar Sinal Vital</span>
          </Button>
        </div>

        {/* Últimos Sintomas */}
        <Card className="card-health">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Últimos Sintomas</h3>
            </div>
            
            {loading ? (
              <p className="text-muted-foreground text-center py-4">Carregando...</p>
            ) : sintomas.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum sintoma registrado
              </p>
            ) : (
              <div className="space-y-3">
                {sintomas.map((sintoma) => (
                  <div 
                    key={sintoma.id}
                    className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{sintoma.tipo_sintoma}</p>
                      <p className="text-sm text-muted-foreground">
                        Duração: {sintoma.duracao}
                      </p>
                      {sintoma.fatores_relacionados.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Fatores: {sintoma.fatores_relacionados.join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(sintoma.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-lg font-bold ${getIntensidadeColor(sintoma.intensidade)}`}>
                        {sintoma.intensidade}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Últimos Sinais Vitais */}
        <Card className="card-health">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Últimos Sinais Vitais</h3>
            </div>
            
            {loading ? (
              <p className="text-muted-foreground text-center py-4">Carregando...</p>
            ) : sinaisVitais.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum sinal vital registrado
              </p>
            ) : (
              <div className="space-y-3">
                {sinaisVitais.map((sinal) => (
                  <div 
                    key={sinal.id}
                    className="p-3 bg-muted/50 rounded-lg space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {sinal.pressao_sistolica && sinal.pressao_diastolica && (
                        <div>
                          <span className="text-muted-foreground">PA: </span>
                          <span className={getSinalVitalStatus('pressao_sistolica', sinal.pressao_sistolica)}>
                            {sinal.pressao_sistolica}/{sinal.pressao_diastolica}
                          </span>
                        </div>
                      )}
                      {sinal.frequencia_cardiaca && (
                        <div>
                          <span className="text-muted-foreground">FC: </span>
                          <span className={getSinalVitalStatus('fc', sinal.frequencia_cardiaca)}>
                            {sinal.frequencia_cardiaca} bpm
                          </span>
                        </div>
                      )}
                      {sinal.saturacao_oxigenio && (
                        <div>
                          <span className="text-muted-foreground">SpO₂: </span>
                          <span className={getSinalVitalStatus('saturacao', sinal.saturacao_oxigenio)}>
                            {sinal.saturacao_oxigenio}%
                          </span>
                        </div>
                      )}
                      {sinal.temperatura && (
                        <div>
                          <span className="text-muted-foreground">Temp: </span>
                          <span className={getSinalVitalStatus('temperatura', sinal.temperatura)}>
                            {sinal.temperatura}°C
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sinal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Sintomas;
