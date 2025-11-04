import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

type Role = "paciente_autonomo" | "cuidador" | "paciente_dependente";

export interface CareContextRow {
  id: string;
  nome: string;
  tipo: "self" | "dependent";
  dependente_id: string | null;
  owner_user_id: string;
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
  bootstrapping: boolean;
}

const CareContextContext = createContext<CareCtxState | undefined>(undefined);
const LS_KEY = "sanare-care-context";

export function CareContextProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [contexts, setContexts] = useState<CareContextView[]>([]);
  const [currentContext, setCurrentContextState] = useState<CareContextView | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);

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
    setBootstrapping(true);

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
      let contextsList: CareContextRow[] = [];

      // Busca contextos criados pelo usuário (cuidador ou autônomo)
      const { data: ownedCtxs, error: ownedErr } = await supabase
        .from("care_contexts")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true });

      if (ownedErr) {
        console.error("Error loading owned contexts:", ownedErr);
      } else {
        contextsList = [...(ownedCtxs ?? [])] as CareContextRow[];
      }

      // Se for paciente_dependente, busca o contexto onde ele é o dependente
      if (role === "paciente_dependente") {
        // Busca o registro do dependente
        const { data: depRecord } = await supabase
          .from("pacientes_dependentes")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (depRecord?.id) {
          // Busca contextos onde ele é o dependente (criado pelo cuidador)
          const { data: depCtxs } = await supabase
            .from("care_contexts")
            .select("*")
            .eq("dependente_id", depRecord.id)
            .order("created_at", { ascending: true });

          if (depCtxs && depCtxs.length > 0) {
            // Substitui a lista com os contextos do dependente
            contextsList = depCtxs as CareContextRow[];
          }
        }
      }

      // 3) Bootstrap: Garante que sempre haja um contexto para o usuário
      if (role === "paciente_autonomo") {
        const hasSelf = contextsList.some((c) => c.tipo === "self" && c.owner_user_id === user.id);
        if (!hasSelf) {
          // Cria contexto self para autônomo
          const { data: created, error: createErr } = await supabase
            .from("care_contexts")
            .insert([{ nome: "Meu Cuidado", tipo: "self", owner_user_id: user.id }])
            .select()
            .maybeSingle();
          if (!createErr && created) {
            contextsList = [created as CareContextRow, ...contextsList];
          } else if (createErr) {
            console.error("Error creating self context:", createErr);
          }
        }
      } else if (role === "paciente_dependente") {
        // Paciente dependente: deve ter um contexto criado pelo cuidador
        // onde ele é o dependente_id, não o owner
        if (contextsList.length === 0) {
          console.warn("Paciente dependente sem contexto criado pelo cuidador.");
        }
      }

      // 4) Adiciona nome do owner aos contextos dependent
      const withNames: CareContextView[] = await Promise.all(
        contextsList.map(async (ctx) => {
          if (ctx.tipo === "dependent" && ctx.dependente_id) {
            const { data: depProfile } = await supabase
              .from("pacientes_dependentes")
              .select("nome")
              .eq("id", ctx.dependente_id)
              .maybeSingle();
            return { ...ctx, owner_name: depProfile?.nome ?? undefined };
          }
          return ctx as CareContextView;
        }),
      );

      setContexts(withNames);

      // 5) Define currentContext com garantia de seleção
      let chosen: CareContextView | null = null;

      // Tenta restaurar do localStorage (se ainda válido)
      const fromLSRaw = localStorage.getItem(LS_KEY);
      if (fromLSRaw) {
        try {
          const fromLS = JSON.parse(fromLSRaw) as CareContextView;
          const stillThere = withNames.find((c) => c.id === fromLS.id);
          if (stillThere) chosen = stillThere;
        } catch (e) {
          console.warn("Error parsing localStorage context:", e);
          localStorage.removeItem(LS_KEY);
        }
      }

      // Se não restaurou, seleciona baseado no role
      if (!chosen && withNames.length > 0) {
        if (role === "paciente_autonomo") {
          // Autônomo: sempre seleciona seu contexto self
          chosen = withNames.find((c) => c.tipo === "self" && c.owner_user_id === user.id) ?? withNames[0];
        } else if (role === "paciente_dependente") {
          // Dependente: seleciona o contexto onde ele é o dependente (criado pelo cuidador)
          chosen = withNames.find((c) => c.tipo === "dependent") ?? withNames[0];
        } else if (role === "cuidador") {
          // Cuidador: seleciona automaticamente se tiver exatamente 1 contexto
          if (withNames.length === 1) {
            chosen = withNames[0];
          }
          // Se tiver mais de 1, deixa null para forçar seleção manual
        }
      }

      setCurrentContextState(chosen);

      // Aguarda um frame para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 0));
    } catch (e) {
      console.error("Error in loadContexts:", e);
    } finally {
      setLoading(false);
      setBootstrapping(false);
    }
  };

  const selectDependent = (ownerUserId: string) => {
    const depCtx = contexts.find(
      (c) => c.tipo === "dependent" && c.owner_user_id === ownerUserId
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
    isContextReady: !loading && !bootstrapping,
    userRole,
    reload: loadContexts,
    selectDependent,
    bootstrapping,
  };

  return <CareContextContext.Provider value={value}>{children}</CareContextContext.Provider>;
}

export function useCareContext() {
  const ctx = useContext(CareContextContext);
  if (!ctx) throw new Error("useCareContext must be used within a CareContextProvider");
  return ctx;
}
