import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Papel = "cuidador" | "paciente_autonomo" | "paciente_dependente";
type PerfilBase = { userId: string; email: string | null };
type PerfilCuidador = PerfilBase & { nome: string; nascimento?: string | null };
type PerfilAutonomo = PerfilBase & { nome: string; nascimento: string | null };
type PerfilDependente = PerfilBase & { 
  nome: string; 
  nome_usuario: string; 
  nascimento: string | null; 
  cuidador?: { nome?: string | null; email?: string | null } 
};

export function usePerfil() {
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [papel, setPapel] = useState<Papel | null>(null);
  const [dados, setDados] = useState<PerfilCuidador | PerfilAutonomo | PerfilDependente | null>(null);
  const [dependentes, setDependentes] = useState<Array<{ id: string; nome: string; nome_usuario: string; nascimento: string | null }>>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setStatus("loading");
      setErro(null);
      try {
        const { data: s } = await supabase.auth.getSession();
        const user = s?.session?.user;
        if (!user) { 
          if (!cancel) setStatus("empty"); 
          return; 
        }

        const email = user.email ?? null;

        // Tenta identificar papel por prioridade: cuidador > autônomo > dependente
        const [{ data: cg }, { data: au }, { data: dp }] = await Promise.all([
          supabase.from("cuidadores").select("id, nome").eq("user_id", user.id).maybeSingle(),
          supabase.from("pacientes_autonomos").select("id, nome, nascimento").eq("user_id", user.id).maybeSingle(),
          supabase.from("pacientes_dependentes").select("id, nome, nome_usuario, nascimento, cuidador_id").eq("user_id", user.id).maybeSingle(),
        ]);

        if (cancel) return;

        // Cuidador
        if (cg) {
          setPapel("cuidador");
          // Carrega lista de dependentes
          const { data: deps } = await supabase
            .from("pacientes_dependentes")
            .select("id, nome, nome_usuario, nascimento")
            .eq("cuidador_id", user.id)
            .order("nome", { ascending: true });
          if (!cancel) {
            setDependentes(deps ?? []);
            setDados({ userId: user.id, email, nome: cg.nome });
            setStatus("ready");
          }
          return;
        }

        // Autônomo
        if (au) {
          setPapel("paciente_autonomo");
          if (!cancel) {
            setDados({ userId: user.id, email, nome: au.nome, nascimento: au.nascimento ?? null });
            setStatus("ready");
          }
          return;
        }

        // Dependente
        if (dp) {
          setPapel("paciente_dependente");
          // opcional: pegar dados do cuidador
          let cuidador: { nome?: string | null; email?: string | null } | undefined = undefined;
          if (dp.cuidador_id) {
            const { data: cgRow } = await supabase
              .from("cuidadores")
              .select("nome")
              .eq("user_id", dp.cuidador_id)
              .maybeSingle();
            cuidador = { nome: cgRow?.nome ?? null, email: null };
          }
          if (!cancel) {
            setDados({ 
              userId: user.id, 
              email, 
              nome: dp.nome, 
              nome_usuario: dp.nome_usuario, 
              nascimento: dp.nascimento ?? null, 
              cuidador 
            });
            setStatus("ready");
          }
          return;
        }

        // Nenhuma tabela tem o user_id => cadastro incompleto
        if (!cancel) setStatus("empty");
      } catch (e: any) {
        if (!cancel) { 
          setErro(e?.message ?? "Falha ao carregar perfil"); 
          setStatus("error"); 
        }
      }
    })();
    return () => { cancel = true; };
  }, []);

  return { status, papel, dados, dependentes, erro };
}
