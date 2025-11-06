import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, X, Upload, Clock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCareContext } from "@/hooks/use-care-context";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { scheduleMedicationNotifications, isNativePlatform } from "@/lib/notifications";
import { NotificationPermissionDeniedAlert } from "@/components/NotificationPermissionPrompt";

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
  const { currentContext, isContextReady } = useCareContext();
  const [horarios, setHorarios] = useState<string[]>([]);
  const [novoHorario, setNovoHorario] = useState('');
  const [imagemUrl, setImagemUrl] = useState<string>("");
  const [receitaUrl, setReceitaUrl] = useState<string>("");
  const [semReceita, setSemReceita] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingReceita, setUploadingReceita] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      nome: "",
      dosagem: "",
      unidade_dose: "mg",
      quantidade_por_embalagem: 0,
      precisa_receita: false,
      frequencia: "",
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
      const { data, error } = await supabase.from("medicamentos").select("*").eq("id", id).maybeSingle();

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
        setHorarios(Array.isArray(data.horarios) ? data.horarios.map(String) : []);
        setImagemUrl(data.imagem_url || "");
        setReceitaUrl(data.receita_url || "");
        setSemReceita(!data.receita_url && data.precisa_receita);
      }
    } catch (error) {
      console.error("Erro ao carregar medicamento:", error);
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
    if (novoHorario && !horarios.includes(novoHorario)) {
      setHorarios([...horarios, novoHorario].sort());
      setNovoHorario('');
    }
  };

  const removerHorario = (horario: string) => {
    setHorarios(horarios.filter(h => h !== horario));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
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
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage.from("medicamentos").upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("medicamentos").getPublicUrl(fileName);

      setImagemUrl(publicUrl);
      toast({
        title: "Sucesso!",
        description: "Imagem enviada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReceitaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo (jpeg, png, pdf)
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo JPEG, PNG ou PDF.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingReceita(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/receita/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("medicamentos").upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("medicamentos").getPublicUrl(fileName);

      setReceitaUrl(publicUrl);
      setSemReceita(false);
      toast({
        title: "Sucesso!",
        description: "Receita enviada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a receita.",
        variant: "destructive",
      });
    } finally {
      setUploadingReceita(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({ title: "Erro", description: "Você não está logado.", variant: "destructive" });
      return;
    }
    if (!isContextReady) return;
    if (!currentContext?.id) {
      toast({
        title: "Erro",
        description: "Contexto não disponível. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // normaliza horários (array de string HH:mm)
      const horariosValidos = (horarios || []).map((h) => (h || "").trim()).filter(Boolean);

      // mapear campos do schema novo
      const requires_prescription = !!data.precisa_receita;
      const prescription_image_url = requires_prescription ? receitaUrl || null : null;
      const prescription_status: "valid" | "missing" | "used" = requires_prescription
        ? prescription_image_url
          ? "valid"
          : semReceita
            ? "missing"
            : "missing"
        : "missing";

      const medicamentoPayload: any = {
        context_id: currentContext.id,
        nome: data.nome,
        dosagem: data.dosagem,
        unidade_dose: data.unidade_dose,
        quantidade_por_dose: 1, // padrão
        quantidade_por_embalagem: data.quantidade_por_embalagem,
        imagem_url: imagemUrl || null,

        requires_prescription,
        prescription_status,
        prescription_image_url,

        quantidade_atual: id ? undefined : data.quantidade_por_embalagem, // no create inicia com estoque cheio
        alerta_minimo: Math.max(0, Math.floor(data.quantidade_por_embalagem * 0.2)),
        data_inicio: new Date().toISOString().slice(0, 10),
        frequencia: data.frequencia,
        horarios: horariosValidos,
      };

      // Se o contexto é do tipo dependent, adicionar dependente_id
      if (currentContext.tipo === 'dependent') {
        medicamentoPayload.dependente_id = currentContext.dependente_id;
      }

      if (id) {
        // EDITAR medicamento (não envia undefined)
        // === EDITAR MEDICAMENTO ===
        const { error: upErr } = await supabase
          .from("medicamentos")
          .update(medicamentoPayload)
          .eq("id", id);
        if (upErr) throw upErr;

        // UP SERT POSOLOGIA (se houver frequência/horários)
        if (data.frequencia && horariosValidos.length > 0) {
          const { error: posoErr } = await supabase.from("posologias").insert([
            {
              medicamento_id: id,
              frequencia: data.frequencia,
              horarios: horariosValidos,
              duracao_tipo: "indefinido",
              duracao_valor: 0,
            },
          ] as any);
          if (posoErr) throw posoErr;
        }

        // Salvar receita na tabela receitas se tiver receita
        if (requires_prescription && prescription_image_url) {
          await supabase.from("receitas").insert({
            nome: data.nome,
            imagem_url: prescription_image_url,
            context_id: currentContext.id,
            medicamento_id: id,
            usada: false,
          });
        }

        toast({ title: "Sucesso!", description: "Medicamento atualizado com sucesso." });
        
        // Schedule notifications if on native platform
        if (isNativePlatform() && horariosValidos.length > 0) {
          try {
            // Get existing notification IDs
            const { data: existingMed } = await supabase
              .from('medicamentos')
              .select('notification_ids')
              .eq('id', id)
              .single();
            
            const existingIds = (existingMed?.notification_ids as number[]) || [];
            
            const notificationIds = await scheduleMedicationNotifications(
              id,
              data.nome,
              horariosValidos,
              existingIds
            );
            
            // Update notification_ids in database
            await supabase
              .from('medicamentos')
              .update({ notification_ids: notificationIds })
              .eq('id', id);
          } catch (error) {
            console.error('Error scheduling notifications:', error);
          }
        }
      } else {
        // CRIAR medicamento e depois criar 1 posologia (se houver)
        const { data: created, error: insErr } = await supabase
          .from("medicamentos")
          .insert([medicamentoPayload])
          .select("id")
          .single();

        if (insErr) throw insErr;

        if (created?.id && data.frequencia && horariosValidos.length > 0) {
          const { error: posoErr } = await supabase.from("posologias").insert([
            {
              medicamento_id: created.id,
              frequencia: data.frequencia,
              horarios: horariosValidos,
              duracao_tipo: "indefinido",
              duracao_valor: 0,
            },
          ]);
          if (posoErr) throw posoErr;
        }

        // Salvar receita na tabela receitas se tiver receita
        if (created?.id && requires_prescription && prescription_image_url) {
          await supabase.from("receitas").insert({
            nome: data.nome,
            imagem_url: prescription_image_url,
            context_id: currentContext.id,
            medicamento_id: created.id,
            usada: false,
          });
        }

        toast({ title: "Sucesso!", description: "Medicamento cadastrado com sucesso." });
        
        // Schedule notifications if on native platform
        if (isNativePlatform() && created?.id && horariosValidos.length > 0) {
          try {
            const notificationIds = await scheduleMedicationNotifications(
              created.id,
              data.nome,
              horariosValidos,
              []
            );
            
            // Update notification_ids in database
            await supabase
              .from('medicamentos')
              .update({ notification_ids: notificationIds })
              .eq('id', created.id);
          } catch (error) {
            console.error('Error scheduling notifications:', error);
          }
        }
      }

      navigate("/medicamentos");
    } catch (error: any) {
      console.error("Erro ao salvar medicamento:", error);
      // mostra a mensagem real do supabase se vier
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível salvar o medicamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isContextReady) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        <button onClick={() => navigate("/medicamentos")} className="back-btn">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="pt-16 pb-8 px-4">
          <div className="mb-6">
            <h1 className="text-mobile-2xl font-bold text-foreground mb-2">
              {id ? "Editar Medicamento" : "Novo Medicamento"}
            </h1>
            <p className="text-muted-foreground">Preencha as informações do medicamento</p>
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
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) {
                                setReceitaUrl("");
                                setSemReceita(false);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("precisa_receita") && (
                    <Card className="border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Foto da Receita Médica</Label>
                        </div>

                        {receitaUrl ? (
                          <div className="space-y-4">
                            <div className="flex justify-center">
                              <img
                                src={receitaUrl}
                                alt="Receita médica"
                                className="max-w-full h-auto rounded-lg border-2 border-border"
                                onError={() => setReceitaUrl("")}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setReceitaUrl("")}
                              className="w-full"
                            >
                              Remover Receita
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-6">
                              <div className="text-center w-full">
                                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground mb-3">
                                  Adicione uma foto da receita médica (JPEG, PNG ou PDF)
                                </p>
                                <Input
                                  type="file"
                                  accept="image/jpeg,image/png,application/pdf"
                                  onChange={handleReceitaUpload}
                                  disabled={uploadingReceita || semReceita}
                                  className="cursor-pointer"
                                />
                                {uploadingReceita && (
                                  <p className="text-xs text-muted-foreground mt-2">Enviando receita...</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch id="sem-receita" checked={semReceita} onCheckedChange={setSemReceita} />
                              <Label htmlFor="sem-receita" className="text-sm cursor-pointer">
                                Ainda não possuo a receita
                              </Label>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
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
                    <Label className="text-sm font-medium flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Horários</span>
                    </Label>

                    {/* Adicionar horário */}
                    <div className="flex space-x-2 mt-2">
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
                    {horarios.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <Label className="text-sm text-muted-foreground">
                          Horários adicionados:
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {horarios.map((horario) => (
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
                          onError={() => setImagemUrl("")}
                        />
                      </div>
                      <Button type="button" variant="outline" onClick={() => setImagemUrl("")} className="w-full">
                        Remover Imagem
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-6">
                      <div className="text-center w-full">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">Adicione uma foto do medicamento</p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="cursor-pointer"
                        />
                        {uploading && <p className="text-xs text-muted-foreground mt-2">Enviando imagem...</p>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                disabled={loading || !form.formState.isValid || !currentContext?.id} 
                className="w-full btn-health"
              >
                {loading ? "Salvando..." : "Salvar Medicamento"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default NovoMedicamento;
