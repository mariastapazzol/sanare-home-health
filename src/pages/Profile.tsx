import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, Edit, Save, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  nome: string;
  telefone?: string;
  email?: string;
  nome_usuario?: string;
  tipo: 'cuidador' | 'paciente_autonomo' | 'paciente_dependente';
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    nome_usuario: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    // Primeiro tenta buscar em cuidadores
    let { data: caregiverData } = await supabase
      .from('cuidadores')
      .select('nome, telefone, nome_usuario')
      .eq('user_id', user.id)
      .single();

    if (caregiverData) {
      setProfile({
        ...caregiverData,
        email: user.email,
        tipo: 'cuidador'
      });
      setFormData({
        nome: caregiverData.nome,
        telefone: caregiverData.telefone || '',
        nome_usuario: caregiverData.nome_usuario
      });
      return;
    }

    // Depois tenta buscar em pacientes autônomos
    let { data: autonomousData } = await supabase
      .from('pacientes_autonomos')
      .select('nome, nome_usuario')
      .eq('user_id', user.id)
      .single();

    if (autonomousData) {
      setProfile({
        ...autonomousData,
        email: user.email,
        tipo: 'paciente_autonomo'
      });
      setFormData({
        nome: autonomousData.nome,
        telefone: '',
        nome_usuario: autonomousData.nome_usuario
      });
      return;
    }

    // Por último tenta buscar em pacientes dependentes
    let { data: dependentData } = await supabase
      .from('pacientes_dependentes')
      .select('nome, nome_usuario')
      .eq('user_id', user.id)
      .single();

    if (dependentData) {
      setProfile({
        ...dependentData,
        email: user.email,
        tipo: 'paciente_dependente'
      });
      setFormData({
        nome: dependentData.nome,
        telefone: '',
        nome_usuario: dependentData.nome_usuario
      });
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setLoading(true);

    try {
      let error;

      if (profile.tipo === 'cuidador') {
        const { error: updateError } = await supabase
          .from('cuidadores')
          .update({
            nome: formData.nome,
            telefone: formData.telefone,
            nome_usuario: formData.nome_usuario
          })
          .eq('user_id', user.id);
        error = updateError;
      } else if (profile.tipo === 'paciente_autonomo') {
        const { error: updateError } = await supabase
          .from('pacientes_autonomos')
          .update({
            nome: formData.nome,
            nome_usuario: formData.nome_usuario
          })
          .eq('user_id', user.id);
        error = updateError;
      } else if (profile.tipo === 'paciente_dependente') {
        const { error: updateError } = await supabase
          .from('pacientes_dependentes')
          .update({
            nome: formData.nome,
            nome_usuario: formData.nome_usuario
          })
          .eq('user_id', user.id);
        error = updateError;
      }

      if (error) {
        toast({
          title: "Erro ao salvar",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso."
        });
        setEditing(false);
        fetchProfile(); // Recarrega os dados
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        nome: profile.nome,
        telefone: profile.telefone || '',
        nome_usuario: profile.nome_usuario || ''
      });
    }
    setEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'cuidador':
        return 'Cuidador';
      case 'paciente_autonomo':
        return 'Paciente Autônomo';
      case 'paciente_dependente':
        return 'Paciente Dependente';
      default:
        return 'Usuário';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <button 
            onClick={() => navigate('/home')}
            className="back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-4">
              <Heart className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-mobile-2xl font-bold">Meu Perfil</h1>
          {profile && (
            <p className="text-mobile-base text-muted-foreground">
              {getTipoLabel(profile.tipo)}
            </p>
          )}
        </div>

        {/* Profile Form */}
        <Card className="card-health">
          {profile ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                {editing ? (
                  <Input
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder="Seu nome completo"
                    className="min-h-[44px]"
                  />
                ) : (
                  <p className="px-3 py-2 bg-muted/50 rounded-md min-h-[44px] flex items-center">
                    {profile.nome}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <p className="px-3 py-2 bg-muted/30 rounded-md min-h-[44px] flex items-center text-muted-foreground">
                  {profile.email}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Nome de usuário</Label>
                {editing ? (
                  <Input
                    value={formData.nome_usuario}
                    onChange={(e) => handleChange('nome_usuario', e.target.value)}
                    placeholder="Seu nome de usuário"
                    className="min-h-[44px]"
                  />
                ) : (
                  <p className="px-3 py-2 bg-muted/50 rounded-md min-h-[44px] flex items-center">
                    {profile.nome_usuario}
                  </p>
                )}
              </div>

              {profile.tipo === 'cuidador' && (
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  {editing ? (
                    <Input
                      value={formData.telefone}
                      onChange={(e) => handleChange('telefone', e.target.value)}
                      placeholder="Seu telefone"
                      className="min-h-[44px]"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-muted/50 rounded-md min-h-[44px] flex items-center">
                      {profile.telefone || 'Não informado'}
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-4">
                {editing ? (
                  <>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    
                    <Button 
                      onClick={handleSave}
                      className="btn-health flex-1"
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setEditing(true)}
                    className="btn-health w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando perfil...</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Profile;