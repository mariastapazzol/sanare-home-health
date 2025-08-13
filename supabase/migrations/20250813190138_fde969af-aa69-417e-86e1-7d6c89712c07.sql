-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dependentes table
CREATE TABLE public.dependentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nascimento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicamentos table
CREATE TABLE public.medicamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dependente_id UUID REFERENCES public.dependentes(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  dosagem TEXT NOT NULL,
  unidade_dose TEXT NOT NULL,
  quantidade_por_dose DECIMAL NOT NULL,
  quantidade_por_embalagem DECIMAL NOT NULL,
  precisa_receita BOOLEAN NOT NULL DEFAULT false,
  frequencia TEXT NOT NULL,
  horarios JSONB NOT NULL DEFAULT '[]',
  imagem_url TEXT,
  quantidade_atual DECIMAL NOT NULL DEFAULT 0,
  alerta_minimo DECIMAL NOT NULL DEFAULT 0,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movimentacoes_estoque table
CREATE TABLE public.movimentacoes_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicamento_id UUID NOT NULL REFERENCES public.medicamentos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'baixa_por_dose', 'ajuste')),
  quantidade DECIMAL NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nota TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lembretes table
CREATE TABLE public.lembretes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dependente_id UUID REFERENCES public.dependentes(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  icone TEXT NOT NULL,
  descricao TEXT,
  horarios JSONB NOT NULL DEFAULT '[]',
  datas JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posologias table
CREATE TABLE public.posologias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicamento_id UUID NOT NULL REFERENCES public.medicamentos(id) ON DELETE CASCADE,
  frequencia TEXT NOT NULL,
  horarios JSONB NOT NULL DEFAULT '[]',
  duracao_tipo TEXT NOT NULL,
  duracao_valor INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posologias ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" 
ON public.profiles FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for dependentes
CREATE POLICY "Users can view their own dependentes" 
ON public.dependentes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dependentes" 
ON public.dependentes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dependentes" 
ON public.dependentes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dependentes" 
ON public.dependentes FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for medicamentos
CREATE POLICY "Users can view their own medicamentos" 
ON public.medicamentos FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medicamentos" 
ON public.medicamentos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medicamentos" 
ON public.medicamentos FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medicamentos" 
ON public.medicamentos FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for movimentacoes_estoque
CREATE POLICY "Users can view their own movimentacoes_estoque" 
ON public.movimentacoes_estoque FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own movimentacoes_estoque" 
ON public.movimentacoes_estoque FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movimentacoes_estoque" 
ON public.movimentacoes_estoque FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movimentacoes_estoque" 
ON public.movimentacoes_estoque FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for lembretes
CREATE POLICY "Users can view their own lembretes" 
ON public.lembretes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lembretes" 
ON public.lembretes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lembretes" 
ON public.lembretes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lembretes" 
ON public.lembretes FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for posologias
CREATE POLICY "Users can view their own posologias" 
ON public.posologias FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posologias" 
ON public.posologias FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posologias" 
ON public.posologias FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posologias" 
ON public.posologias FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dependentes_updated_at
  BEFORE UPDATE ON public.dependentes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicamentos_updated_at
  BEFORE UPDATE ON public.medicamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lembretes_updated_at
  BEFORE UPDATE ON public.lembretes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posologias_updated_at
  BEFORE UPDATE ON public.posologias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();