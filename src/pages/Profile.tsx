import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, Edit, Save, X, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePerfil } from '@/hooks/use-perfil';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { status, papel, dados, dependentes, erro } = usePerfil();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    nascimento: ''
  });

  const handleSave = async () => {
    if (!dados || !papel) return;

    setLoading(true);

    try {
      const tableName = papel === 'cuidador' ? 'cuidadores' : 
                        papel === 'paciente_autonomo' ? 'pacientes_autonomos' : 
                        'pacientes_dependentes';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          nome: formData.nome,
          nascimento: formData.nascimento || null
        })
        .eq('user_id', dados.userId);

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
        window.location.reload(); // Recarrega para atualizar dados
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
    setEditing(false);
    setFormData({
      nome: dados?.nome || '',
      nascimento: 'nascimento' in (dados || {}) ? (dados as any).nascimento || '' : ''
    });
  };

  const handleEdit = () => {
    setEditing(true);
    setFormData({
      nome: dados?.nome || '',
      nascimento: 'nascimento' in (dados || {}) ? (dados as any).nascimento || '' : ''
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
        <Card className="card-health max-w-md">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-destructive">Erro ao carregar perfil</h2>
            <p className="text-muted-foreground">{erro}</p>
            <Button onClick={() => navigate('/home')} className="btn-health">
              Voltar para Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Empty state
  if (status === "empty") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
        <Card className="card-health max-w-md">
          <div className="text-center space-y-4">
            <Heart className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Complete seu cadastro</h2>
            <p className="text-muted-foreground">Não encontramos seus dados de perfil. Por favor, conclua o onboarding.</p>
            <Button onClick={() => navigate('/auth-choice')} className="btn-health">
              Completar Cadastro
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Ready - render based on role
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
          {papel && (
            <p className="text-sm text-muted-foreground">
              {papel === 'cuidador' ? 'Cuidador' : 
               papel === 'paciente_autonomo' ? 'Paciente Autônomo' : 
               'Paciente Dependente'}
            </p>
          )}
        </div>

        {/* Profile Form */}
        <Card className="card-health">
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
                  {dados?.nome}
                </p>
              )}
            </div>

            {papel === 'paciente_dependente' && 'nome_usuario' in (dados || {}) && (
              <div className="space-y-2">
                <Label>Nome de usuário</Label>
                <p className="px-3 py-2 bg-muted/30 rounded-md min-h-[44px] flex items-center text-muted-foreground">
                  {(dados as any).nome_usuario}
                </p>
              </div>
            )}

            {papel !== 'paciente_dependente' && (
              <div className="space-y-2">
                <Label>E-mail</Label>
                <p className="px-3 py-2 bg-muted/30 rounded-md min-h-[44px] flex items-center text-muted-foreground">
                  {dados?.email || '—'}
                </p>
              </div>
            )}

            {'nascimento' in (dados || {}) && (
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
                    {(dados as any).nascimento 
                      ? new Date((dados as any).nascimento).toLocaleDateString('pt-BR') 
                      : 'Não informado'}
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
                  onClick={handleEdit}
                  className="btn-health w-full"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Dependentes section - only for caregivers */}
        {papel === 'cuidador' && dependentes.length > 0 && (
          <Card className="card-health">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Meus Dependentes
              </h3>
              <div className="space-y-3">
                {dependentes.map((dep) => (
                  <div key={dep.id} className="p-3 bg-muted/30 rounded-md space-y-1">
                    <p className="font-medium">{dep.nome}</p>
                    <p className="text-sm text-muted-foreground">@{dep.nome_usuario}</p>
                    {dep.nascimento && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(dep.nascimento).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Caregiver info - only for dependents */}
        {papel === 'paciente_dependente' && 'cuidador' in (dados || {}) && (dados as any).cuidador && (
          <Card className="card-health">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Seu Cuidador
              </h3>
              <div className="space-y-2">
                {(dados as any).cuidador.nome && (
                  <p className="text-sm">
                    <span className="font-medium">Nome:</span> {(dados as any).cuidador.nome}
                  </p>
                )}
                {(dados as any).cuidador.email && (
                  <p className="text-sm">
                    <span className="font-medium">E-mail:</span> {(dados as any).cuidador.email}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;