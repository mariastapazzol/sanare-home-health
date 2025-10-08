import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Menu, 
  Pill, 
  Package, 
  AlertTriangle,
  Clock,
  Check,
  X,
  BookOpen,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  nome: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [medicamentosComEstoqueBaixo, setMedicamentosComEstoqueBaixo] = useState([]);
  const [checklistDiario, setChecklistDiario] = useState([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchEstoqueBaixo();
      fetchChecklistDiario();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchEstoqueBaixo = async () => {
    if (!user) return;
    
    // Simular medicamentos com estoque baixo (substituir pela lógica real)
    const { data } = await supabase
      .from('medicamentos')
      .select('*')
      .eq('user_id', user.id)
      .lte('quantidade_atual', 5);
    
    if (data) {
      setMedicamentosComEstoqueBaixo(data);
    }
  };

  const fetchChecklistDiario = async () => {
    if (!user) return;
    
    // Buscar medicamentos
    const { data: medicamentos } = await supabase
      .from('medicamentos')
      .select('id, nome, horarios')
      .eq('user_id', user.id);
    
    // Buscar lembretes personalizados
    const { data: lembretes } = await supabase
      .from('lembretes')
      .select('id, nome, horarios')
      .eq('user_id', user.id);
    
    const checklist: any[] = [];
    
    // Processar medicamentos
    if (medicamentos) {
      const medicamentosChecklist = medicamentos.flatMap(medicamento => {
        const horarios = Array.isArray(medicamento.horarios) ? medicamento.horarios : [];
        return horarios.map((horario: string) => ({
          id: `med-${medicamento.id}-${horario}`,
          item_id: medicamento.id,
          nome: medicamento.nome,
          horario,
          tomado: false,
          inativo: false,
          tipo: 'medicamento'
        }));
      });
      checklist.push(...medicamentosChecklist);
    }
    
    // Processar lembretes
    if (lembretes) {
      const lembretesChecklist = lembretes.flatMap(lembrete => {
        const horarios = Array.isArray(lembrete.horarios) ? lembrete.horarios : [];
        return horarios.map((horario: string) => ({
          id: `lem-${lembrete.id}-${horario}`,
          item_id: lembrete.id,
          nome: lembrete.nome,
          horario,
          tomado: false,
          inativo: false,
          tipo: 'lembrete'
        }));
      });
      checklist.push(...lembretesChecklist);
    }
    
    // Ordenar por horário
    checklist.sort((a, b) => a.horario.localeCompare(b.horario));
    
    setChecklistDiario(checklist);
  };

  const toggleMedicamento = (id: string) => {
    setChecklistDiario(prev => 
      prev.filter(item => item.id !== id)
    );
  };

  const marcarInativo = (id: string) => {
    setChecklistDiario(prev => 
      prev.map(item => 
        item.id === id ? { ...item, inativo: true } : item
      )
    );
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-mobile-xl font-semibold">
            Olá, {profile?.nome || 'Usuário'}!
          </h1>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <Menu className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/lembretes')}>
                Lembretes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button
            onClick={() => navigate('/medicamentos')}
            className="btn-health h-20 flex-col space-y-2"
          >
            <Pill className="h-6 w-6" />
            <span>Medicamentos</span>
          </Button>
          
          <Button
            onClick={() => navigate('/stock')}
            className="btn-health h-20 flex-col space-y-2"
          >
            <Package className="h-6 w-6" />
            <span>Estoque</span>
          </Button>
        </div>

        {/* Diary Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button
            onClick={() => navigate('/diary')}
            className="btn-health h-20 flex-col space-y-2"
          >
            <BookOpen className="h-6 w-6" />
            <span>Diário Emocional</span>
          </Button>
          
          <Button
            onClick={() => navigate('/sintomas')}
            className="btn-health h-20 flex-col space-y-2"
          >
            <Activity className="h-6 w-6" />
            <span>Sintomas e Sinais</span>
          </Button>
        </div>

        {/* Alerta de Estoque Baixo */}
        {medicamentosComEstoqueBaixo.length > 0 && (
          <Card className="card-health border-warning bg-warning/5">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-warning">Estoque Baixo</h3>
                <p className="text-sm text-muted-foreground">
                  {medicamentosComEstoqueBaixo.length} medicamento(s) acabando
                </p>
                <Button 
                  variant="link" 
                  className="text-warning hover:text-warning p-0 h-auto mt-1"
                  onClick={() => navigate('/stock')}
                >
                  Ver detalhes
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Checklist Diário */}
        <Card className="card-health">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">CheckList Diário</h3>
            </div>
            
            {checklistDiario.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum item para hoje
            </p>
            ) : (
              <div className="space-y-3">
                {checklistDiario.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg ${
                      item.inativo ? 'opacity-30' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {item.tipo === 'medicamento' ? (
                          <Pill className="h-4 w-4 text-primary" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-secondary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.horario} • {item.tipo === 'medicamento' ? 'Medicamento' : 'Lembrete'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMedicamento(item.id)}
                        className="w-10 h-10 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-10 h-10 p-0 text-muted-foreground"
                        onClick={() => marcarInativo(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
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

export default Home;