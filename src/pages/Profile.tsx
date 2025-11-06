import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, Edit, Save, X, User, Lock, Eye, EyeOff } from 'lucide-react';
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
  
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const calcularIdade = (nascimento: string | null | undefined): number | null => {
    if (!nascimento) return null;
    const hoje = new Date();
    const dataNasc = new Date(nascimento);
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    const mes = hoje.getMonth() - dataNasc.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < dataNasc.getDate())) {
      idade--;
    }
    return idade;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'A senha deve conter pelo menos 1 letra';
    }
    if (!/[0-9]/.test(password)) {
      return 'A senha deve conter pelo menos 1 número';
    }
    return null;
  };

  const handleChangePassword = async () => {
    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      toast({
        title: "Senha inválida",
        description: passwordError,
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não conferem.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        toast({
          title: "Erro ao alterar senha",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Senha atualizada",
          description: "Sua senha foi alterada com sucesso."
        });
        setChangingPassword(false);
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setShowNewPassword(false);
        setShowConfirmPassword(false);
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

  const handleCancelPasswordChange = () => {
    setChangingPassword(false);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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
          {papel && papel !== 'paciente_autonomo' && (
            <p className="text-sm text-muted-foreground">
              {papel === 'cuidador' ? 'Cuidador' : 'Paciente Dependente'}
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
              <>
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

                {(dados as any).nascimento && calcularIdade((dados as any).nascimento) !== null && (
                  <div className="space-y-2">
                    <Label>Idade</Label>
                    <p className="px-3 py-2 bg-muted/30 rounded-md min-h-[44px] flex items-center text-muted-foreground">
                      {calcularIdade((dados as any).nascimento)} anos
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Botão de editar - para cuidadores e autônomos */}
            {(papel === 'cuidador' || papel === 'paciente_autonomo') && (
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
                      className="flex-1"
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={handleEdit}
                    className="btn-health"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Alterar senha - apenas para cuidadores e autônomos */}
        {(papel === 'cuidador' || papel === 'paciente_autonomo') && (
          <Card className="card-health">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Segurança</h3>
              </div>

              {!changingPassword ? (
                <Button 
                  onClick={() => setChangingPassword(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Alterar senha
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Digite sua nova senha"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Digite novamente a senha"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
                    <p className="font-medium">A senha deve conter:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Mínimo 8 caracteres</li>
                      <li>Pelo menos 1 letra</li>
                      <li>Pelo menos 1 número</li>
                    </ul>
                  </div>

                  <div className="flex space-x-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleCancelPasswordChange}
                      className="flex-1"
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    
                    <Button 
                      onClick={handleChangePassword}
                      className="flex-1"
                      disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

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