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
  nascimento?: string;
  email?: string;
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
    nascimento: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    // Busca dados do paciente autônomo
    let { data: patientData } = await supabase
      .from('pacientes_autonomos')
      .select('nome, nascimento')
      .eq('user_id', user.id)
      .maybeSingle();

    if (patientData) {
      setProfile({
        nome: patientData.nome,
        nascimento: patientData.nascimento,
        email: user.email
      });
      setFormData({
        nome: patientData.nome,
        nascimento: patientData.nascimento || ''
      });
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('pacientes_autonomos')
        .update({
          nome: formData.nome,
          nascimento: formData.nascimento || null
        })
        .eq('user_id', user.id);

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
        nascimento: profile.nascimento || ''
      });
    }
    setEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                <Label>Data de nascimento</Label>
                {editing ? (
                  <Input
                    type="date"
                    value={formData.nascimento}
                    onChange={(e) => handleChange('nascimento', e.target.value)}
                    className="min-h-[44px]"
                  />
                ) : (
                  <p className="px-3 py-2 bg-muted/50 rounded-md min-h-[44px] flex items-center">
                    {profile.nascimento ? new Date(profile.nascimento).toLocaleDateString('pt-BR') : 'Não informado'}
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
                <Label>Senha</Label>
                <p className="px-3 py-2 bg-muted/30 rounded-md min-h-[44px] flex items-center text-muted-foreground">
                  ••••••••••
                </p>
              </div>

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