import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SignupDependenteStep = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    birthDate: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const toISODate = (d: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      const [a, b, c] = d.split("/");
      const dd = parseInt(a, 10);
      const mm = parseInt(b, 10);
      const yyyy = c;
      const [month, day] = dd > 12 ? [mm, dd] : [dd, mm];
      return `${yyyy}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    const dt = new Date(d);
    if (!isNaN(+dt)) return dt.toISOString().slice(0, 10);
    throw new Error("DATA_INVALIDA");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres",
        variant: "destructive"
      });
      return;
    }

    // Validate username
    const usernameRegex = /^[A-Za-z0-9._]{3,}$/;
    if (!usernameRegex.test(formData.username)) {
      toast({
        title: "Erro",
        description: "Nome de usuário inválido. Use apenas letras, números, pontos e underscores (mínimo 3 caracteres)",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Normalize date
      let isoDate: string;
      try {
        isoDate = toISODate(formData.birthDate);
      } catch {
        toast({
          title: "Erro",
          description: "Data de nascimento inválida",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Get current session (caregiver)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Call edge function directly with fetch for better error handling
      const supabaseUrl = "https://qcglxiuygxzxmbmajyxs.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/create-dependent-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          birth_date: isoDate,
          password: formData.password,
          observacoes: null,
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: "Erro",
          description: result?.error || `Falha ao criar dependente (${response.status})`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Sucesso!",
        description: "Dependente criado com sucesso!",
      });

      // Navigate to home
      navigate('/');
      
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar dependente",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-4">
              <Heart className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-mobile-2xl font-bold">Etapa 2: Dependente</h1>
          <p className="text-mobile-base text-muted-foreground">
            Agora, crie a conta para a pessoa que você vai cuidar
          </p>
        </div>

        <Card className="card-health">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo do dependente</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome completo"
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário do dependente</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
                placeholder="usuario123"
                required
                className="min-h-[44px]"
              />
              <p className="text-xs text-muted-foreground">
                O usuário será usado para login. Não pode ser alterado depois.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha do dependente</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Confirme a senha"
                required
                className="min-h-[44px]"
              />
              {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                <p className="text-sm text-destructive">As senhas não coincidem</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="btn-health w-full"
              disabled={loading || formData.password !== formData.confirmPassword}
            >
              {loading ? 'Criando conta...' : 'Concluir cadastro'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignupDependenteStep;
