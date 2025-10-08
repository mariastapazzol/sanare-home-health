import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, X, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  dosagem: z.string().min(1, "Dosagem é obrigatória"),
  unidade_dose: z.string().min(1, "Unidade é obrigatória"),
  quantidade_por_embalagem: z.number().min(1, "Quantidade deve ser maior que 0"),
  precisa_receita: z.boolean(),
  frequencia: z.string().min(1, "Frequência é obrigatória"),
});

type FormData = z.infer<typeof formSchema>;

const NovoMedicamento = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [horarios, setHorarios] = useState<string[]>(['']);
  const [imagemUrl, setImagemUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      dosagem: '',
      unidade_dose: 'mg',
      quantidade_por_embalagem: 0,
      precisa_receita: false,
      frequencia: '',
    },
  });

  useEffect(() => {
    if (id && user) {
      loadMedicamento();
    }
  }, [id, user]);

  const loadMedicamento = async () => {
    if (!id || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          nome: data.nome,
          dosagem: data.dosagem,
          unidade_dose: data.unidade_dose,
          quantidade_por_embalagem: data.quantidade_por_embalagem,
          precisa_receita: data.precisa_receita,
          frequencia: data.frequencia,
        });
        setHorarios(Array.isArray(data.horarios) ? data.horarios.map(String) : ['']);
        setImagemUrl(data.imagem_url || '');
      }
    } catch (error) {
      console.error('Erro ao carregar medicamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o medicamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarHorario = () => {
    setHorarios([...horarios, '']);
  };

  const removerHorario = (index: number) => {
    if (horarios.length > 1) {
      setHorarios(horarios.filter((_, i) => i !== index));
    }
  };

  const updateHorario = (index: number, value: string) => {
    const novosHorarios = [...horarios];
    novosHorarios[index] = value;
    setHorarios(novosHorarios);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('medicamentos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('medicamentos')
        .getPublicUrl(fileName);

      setImagemUrl(publicUrl);
      toast({
        title: "Sucesso!",
        description: "Imagem enviada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setLoading(true);
    try {
      // Filtrar horários válidos (não vazios)
      const horariosValidos = horarios.filter(h => h.trim() !== '');
      
      const medicamentoData = {
        user_id: user.id,
        nome: data.nome,
        dosagem: data.dosagem,
        unidade_dose: data.unidade_dose,
        quantidade_por_embalagem: data.quantidade_por_embalagem,
        precisa_receita: data.precisa_receita,
        frequencia: data.frequencia,
        horarios: horariosValidos,
        imagem_url: imagemUrl || null,
        quantidade_por_dose: 1, // Valor padrão
        alerta_minimo: Math.floor(data.quantidade_por_embalagem * 0.2), // 20% da embalagem
      };

      if (id) {
        // Editar medicamento existente
        const { error } = await supabase
          .from('medicamentos')
          .update(medicamentoData)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Medicamento atualizado com sucesso.",
        });
      } else {
        // Criar novo medicamento
        const medicamentoDataComEstoque = {
          ...medicamentoData,
          quantidade_atual: data.quantidade_por_embalagem, // Inicia com estoque completo
        };

        const { error } = await supabase
          .from('medicamentos')
          .insert(medicamentoDataComEstoque);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Medicamento cadastrado com sucesso.",
        });
      }

      navigate('/medicamentos');
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o medicamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        <button
          onClick={() => navigate('/medicamentos')}
          className="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="pt-16 pb-8 px-4">
          <div className="mb-6">
            <h1 className="text-mobile-2xl font-bold text-foreground mb-2">
              {id ? 'Editar Medicamento' : 'Novo Medicamento'}
            </h1>
            <p className="text-muted-foreground">
              Preencha as informações do medicamento
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações básicas */}
              <Card className="card-health">
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Medicamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Paracetamol" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="dosagem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dosagem</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unidade_dose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mg">mg</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="mcg">mcg</SelectItem>
                              <SelectItem value="UI">UI</SelectItem>
                              <SelectItem value="gotas">gotas</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="quantidade_por_embalagem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Total (comprimidos/doses)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 20"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="precisa_receita"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Precisa de receita médica?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Frequência de uso */}
              <Card className="card-health">
                <CardHeader>
                  <CardTitle>Frequência de Uso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="frequencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="todos_os_dias">Todos os dias</SelectItem>
                            <SelectItem value="dias_alternados">Dias alternados</SelectItem>
                            <SelectItem value="conforme_necessidade">Conforme necessidade</SelectItem>
                            <SelectItem value="3_vezes_semana">3 vezes por semana</SelectItem>
                            <SelectItem value="2_vezes_semana">2 vezes por semana</SelectItem>
                            <SelectItem value="1_vez_semana">1 vez por semana</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <Label className="text-sm font-medium">Horários</Label>
                    <div className="mt-2 space-y-2">
                      {horarios.map((horario, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={horario}
                            onChange={(e) => updateHorario(index, e.target.value)}
                            className="flex-1"
                          />
                          {horarios.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removerHorario(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={adicionarHorario}
                      className="mt-2 w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Horário
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Imagem opcional */}
              <Card className="card-health">
                <CardHeader>
                  <CardTitle>Imagem (Opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                  {imagemUrl ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img
                          src={imagemUrl}
                          alt="Preview"
                          className="w-32 h-32 rounded-lg object-cover"
                          onError={() => setImagemUrl('')}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setImagemUrl('')}
                        className="w-full"
                      >
                        Remover Imagem
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-6">
                      <div className="text-center w-full">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">
                          Adicione uma foto do medicamento
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="cursor-pointer"
                        />
                        {uploading && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Enviando imagem...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={loading}
                className="w-full btn-health"
              >
                {loading ? 'Salvando...' : 'Salvar Medicamento'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default NovoMedicamento;