import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PerfilBase = { userId: string; email: string | null };
type PerfilAutonomo = PerfilBase & { nome: string; nascimento: string | null };

export function usePerfil() {
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [dados, setDados] = useState<PerfilAutonomo | null>(null);
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

        // Busca paciente autônomo
        const { data: au } = await supabase
          .from("pacientes_autonomos")
          .select("id, nome, nascimento")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancel) return;

        if (au) {
          setDados({ userId: user.id, email, nome: au.nome, nascimento: au.nascimento ?? null });
          setStatus("ready");
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

  return { status, dados, erro };
}
