import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useCareContext } from '@/hooks/use-care-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Plus,
  X,
  Clock,
  Calendar,
  Save
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const frequenciaOptions = [
  { id: 'todos_os_dias', label: 'Todos os dias' },
  { id: 'dias_alternados', label: 'Dias alternados' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'personalizado', label: 'Dias específicos' }
];

const diasSemana = [
  { id: 'segunda', label: 'Segunda' },
  { id: 'terca', label: 'Terça' },
  { id: 'quarta', label: 'Quarta' },
  { id: 'quinta', label: 'Quinta' },
  { id: 'sexta', label: 'Sexta' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' }
];

const NovoLembrete = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { currentContext } = useCareContext();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    datas: [] as string[],
    horarios: [] as string[],
    icone: 'clock'
  });

  const [novoHorario, setNovoHorario] = useState('');
  const [frequenciaSelecionada, setFrequenciaSelecionada] = useState<string[]>([]);
  const [diasPersonalizados, setDiasPersonalizados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      fetchLembrete(id);
    }
  }, [isEditing, id]);

  const fetchLembrete = async (lembreteId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lembretes')
        .select('*')
        .eq('id', lembreteId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Converter JSON para arrays se necessário
        const datasArray = Array.isArray(data.datas) 
          ? (data.datas as string[]).filter(item => typeof item === 'string')
          : [];
        const horariosArray = Array.isArray(data.horarios) 
          ? (data.horarios as string[]).filter(item => typeof item === 'string')
          : [];

        setFormData({
          nome: data.nome,
          descricao: data.descricao || '',
          datas: datasArray,
          horarios: horariosArray,
          icone: data.icone || 'clock'
        });

        // Determinar frequência selecionada
        if (datasArray.includes('todos_os_dias')) {
          setFrequenciaSelecionada(['todos_os_dias']);
        } else if (datasArray.includes('dias_alternados')) {
          setFrequenciaSelecionada(['dias_alternados']);
        } else if (datasArray.includes('semanal')) {
          setFrequenciaSelecionada(['semanal']);
        } else {
          setFrequenciaSelecionada(['personalizado']);
          setDiasPersonalizados(datasArray);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar lembrete:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o lembrete.",
        variant: "destructive",
      });
      navigate('/lembretes');
    }
  };

  const adicionarHorario = () => {
    if (novoHorario && !formData.horarios.includes(novoHorario)) {
      setFormData(prev => ({
        ...prev,
        horarios: [...prev.horarios, novoHorario].sort()
      }));
      setNovoHorario('');
    }
  };

  const removerHorario = (horario: string) => {
    setFormData(prev => ({
      ...prev,
      horarios: prev.horarios.filter(h => h !== horario)
    }));
  };

  const handleFrequenciaChange = (opcao: string, checked: boolean) => {
    if (checked) {
      setFrequenciaSelecionada([opcao]);
      
      // Atualizar datas baseado na frequência
      let novasDatas: string[] = [];
      
      if (opcao === 'todos_os_dias') {
        novasDatas = ['todos_os_dias'];
      } else if (opcao === 'dias_alternados') {
        novasDatas = ['dias_alternados'];
      } else if (opcao === 'semanal') {
        novasDatas = ['semanal'];
      } else if (opcao === 'personalizado') {
        novasDatas = diasPersonalizados;
      }
      
      setFormData(prev => ({ ...prev, datas: novasDatas }));
    } else {
      setFrequenciaSelecionada([]);
      setFormData(prev => ({ ...prev, datas: [] }));
    }
  };

  const handleDiaPersonalizadoChange = (dia: string, checked: boolean) => {
    let novosDias: string[];
    
    if (checked) {
      novosDias = [...diasPersonalizados, dia];
    } else {
      novosDias = diasPersonalizados.filter(d => d !== dia);
    }
    
    setDiasPersonalizados(novosDias);
    
    if (frequenciaSelecionada.includes('personalizado')) {
      setFormData(prev => ({ ...prev, datas: novosDias }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !currentContext) {
      toast({
        title: "Erro",
        description: "Contexto não disponível. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do lembrete é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (formData.horarios.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um horário.",
        variant: "destructive",
      });
      return;
    }

    if (formData.datas.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione quando você quer ser lembrado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const lembreteData = {
        context_id: currentContext.id,
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        datas: formData.datas,
        horarios: formData.horarios,
        icone: formData.icone,
        user_id: user.id
      };

      if (isEditing && id) {
        const { error } = await supabase
          .from('lembretes')
          .update(lembreteData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lembrete atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('lembretes')
          .insert([lembreteData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lembrete criado com sucesso!",
        });
      }

      navigate('/lembretes');
    } catch (error) {
      console.error('Erro ao salvar lembrete:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o lembrete.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/lembretes')}
            className="text-primary-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-mobile-xl font-semibold">
            {isEditing ? 'Editar Lembrete' : 'Novo Lembrete'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Nome */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Lembrete *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Tomar vitamina D"
              required
            />
          </div>
        </Card>

        {/* Descrição */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição adicional sobre o lembrete"
              rows={3}
            />
          </div>
        </Card>

        {/* Frequência */}
        <Card className="p-4">
          <div className="space-y-4">
            <Label className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Quando você quer ser lembrado? *</span>
            </Label>
            
            <div className="space-y-3">
              {frequenciaOptions.map((opcao) => (
                <div key={opcao.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={opcao.id}
                    checked={frequenciaSelecionada.includes(opcao.id)}
                    onCheckedChange={(checked) => 
                      handleFrequenciaChange(opcao.id, !!checked)
                    }
                  />
                  <Label htmlFor={opcao.id}>{opcao.label}</Label>
                </div>
              ))}
            </div>

            {/* Dias personalizados */}
            {frequenciaSelecionada.includes('personalizado') && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">
                  Selecione os dias da semana:
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {diasSemana.map((dia) => (
                    <div key={dia.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dia-${dia.id}`}
                        checked={diasPersonalizados.includes(dia.id)}
                        onCheckedChange={(checked) => 
                          handleDiaPersonalizadoChange(dia.id, !!checked)
                        }
                      />
                      <Label htmlFor={`dia-${dia.id}`} className="text-sm">
                        {dia.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Horários */}
        <Card className="p-4">
          <div className="space-y-4">
            <Label className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Horários *</span>
            </Label>

            {/* Adicionar horário */}
            <div className="flex space-x-2">
              <Input
                type="time"
                value={novoHorario}
                onChange={(e) => setNovoHorario(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={adicionarHorario}
                disabled={!novoHorario}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista de horários */}
            {formData.horarios.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Horários adicionados:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {formData.horarios.map((horario) => (
                    <Badge
                      key={horario}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{horario}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removerHorario(horario)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              <span>Salvando...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Atualizar Lembrete' : 'Criar Lembrete'}</span>
            </div>
          )}
        </Button>
      </form>
    </div>
  );
};

export default NovoLembrete;