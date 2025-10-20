import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

type Role = "paciente_autonomo" | "cuidador" | "paciente_dependente";

export interface CareContextRow {
  id: string;
  owner_user_id: string;
  caregiver_user_id: string | null;
  type: "self" | "dependent";
  created_at?: string;
  updated_at?: string;
}

export interface CareContextView extends CareContextRow {
  owner_name?: string;
}

interface CareCtxState {
  contexts: CareContextView[];
  currentContext: CareContextView | null;
  selectedContextId: string | null;
  setCurrentContext: (ctx: CareContextView) => void;
  clearContext: () => void;
  loading: boolean;
  isContextReady: boolean;
  userRole: Role | null;
  reload: () => Promise<void>;
  selectDependent: (ownerUserId: string) => void;
}

const CareContextContext = createContext<CareCtxState | undefined>(undefined);
const LS_KEY = "sanare-care-context";

export function CareContextProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [contexts, setContexts] = useState<CareContextView[]>([]);
  const [currentContext, setCurrentContextState] = useState<CareContextView | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedContextId = currentContext?.id ?? null;

  // Persiste no localStorage
  useEffect(() => {
    if (currentContext) {
      localStorage.setItem(LS_KEY, JSON.stringify(currentContext));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }, [currentContext]);

  useEffect(() => {
    if (!user) {
      setContexts([]);
      setCurrentContextState(null);
      setUserRole(null);
      setLoading(false);
      return;
    }
    loadContexts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setCurrentContext = (ctx: CareContextView) => setCurrentContextState(ctx);
  const clearContext = () => setCurrentContextState(null);

  const loadContexts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1) Papel
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role,name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileErr) console.warn("profiles error", profileErr);
      const role = (profile?.role ?? null) as Role | null;
      setUserRole(role);

      // 2) Busca contextos onde o usuário participa
      const { data: ctxs, error: ctxErr } = await supabase
        .from("care_contexts")
        .select("*")
        .or(`owner_user_id.eq.${user.id},caregiver_user_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (ctxErr) {
        console.error("Error loading contexts:", ctxErr);
        setLoading(false);
        return;
      }

      let contextsList = (ctxs ?? []) as CareContextRow[];

      // 3) Garante SELF somente para paciente_autonomo ou paciente_dependente (não cria para cuidador)
      if (role === "paciente_autonomo" || role === "paciente_dependente") {
        const hasSelf = contextsList.some((c) => c.type === "self" && c.owner_user_id === user.id);
        if (!hasSelf && role === "paciente_autonomo") {
          // Só cria contexto self para autônomo
          const { data: created, error: createErr } = await supabase
            .from("care_contexts")
            .insert([{ type: "self", owner_user_id: user.id }])
            .select()
            .maybeSingle();
          if (!createErr && created) {
            contextsList = [created as CareContextRow, ...contextsList];
          } else if (createErr) {
            console.error("Error creating self context:", createErr);
          }
        }
      }

      // 4) Adiciona nome do owner aos contextos dependent
      const withNames: CareContextView[] = await Promise.all(
        contextsList.map(async (ctx) => {
          if (ctx.type === "dependent") {
            const { data: ownerProfile } = await supabase
              .from("profiles")
              .select("name")
              .eq("user_id", ctx.owner_user_id)
              .maybeSingle();
            return { ...ctx, owner_name: ownerProfile?.name ?? undefined };
          }
          return ctx as CareContextView;
        }),
      );

      setContexts(withNames);

      // 5) Define currentContext:
      //    - Tenta restaurar do localStorage (se ainda válido)
      //    - Senão: autônomo => self; dependente => seu dependent; cuidador => não seleciona (força seleção manual)
      let chosen: CareContextView | null = null;

      const fromLSRaw = localStorage.getItem(LS_KEY);
      if (fromLSRaw) {
        const fromLS = JSON.parse(fromLSRaw) as CareContextView;
        const stillThere = withNames.find((c) => c.id === fromLS.id);
        if (stillThere) chosen = stillThere;
      }

      if (!chosen) {
        if (role === "paciente_autonomo") {
          chosen = withNames.find((c) => c.type === "self" && c.owner_user_id === user.id) ?? null;
        } else if (role === "paciente_dependente") {
          chosen = withNames.find((c) => c.type === "dependent" && c.owner_user_id === user.id) ?? null;
        } else if (role === "cuidador") {
          // Cuidador tem apenas 1 dependente, seleciona automaticamente
          const dependentContext = withNames.find((c) => c.type === "dependent" && c.caregiver_user_id === user.id);
          chosen = dependentContext ?? null;
        }
      }

      setCurrentContextState(chosen);
    } catch (e) {
      console.error("Error in loadContexts:", e);
    } finally {
      setLoading(false);
    }
  };

  const selectDependent = (ownerUserId: string) => {
    const depCtx = contexts.find(
      (c) => c.type === "dependent" && c.owner_user_id === ownerUserId
    );
    if (depCtx) setCurrentContextState(depCtx);
  };

  const value: CareCtxState = {
    contexts,
    currentContext,
    selectedContextId,
    setCurrentContext,
    clearContext,
    loading,
    isContextReady: !loading,
    userRole,
    reload: loadContexts,
    selectDependent,
  };

  return <CareContextContext.Provider value={value}>{children}</CareContextContext.Provider>;
}

export function useCareContext() {
  const ctx = useContext(CareContextContext);
  if (!ctx) throw new Error("useCareContext must be used within a CareContextProvider");
  return ctx;
}
