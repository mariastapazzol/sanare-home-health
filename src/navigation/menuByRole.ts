export type Papel = "cuidador" | "paciente_autonomo" | "paciente_dependente";

export interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon?: string;
}

/** Ações (cards) da Home **/
const ACTIONS: Record<Papel, MenuItem[]> = {
  cuidador: [
    { key: "medicamentos", label: "Medicamentos", path: "/medicamentos" },
    { key: "estoque", label: "Estoque", path: "/estoque" },
    { key: "diary", label: "Diário Emocional", path: "/diario" },
    { key: "sintomas", label: "Sintomas e Sinais", path: "/sintomas" },
  ],
  paciente_autonomo: [
    { key: "medicamentos", label: "Medicamentos", path: "/medicamentos" },
    { key: "estoque", label: "Estoque", path: "/estoque" },
    { key: "diary", label: "Diário Emocional", path: "/diario" },
    { key: "sintomas", label: "Sintomas e Sinais", path: "/sintomas" },
  ],
  paciente_dependente: [
    { key: "diary", label: "Diário Emocional", path: "/diario" },
    { key: "sintomas", label: "Sintomas e Sinais", path: "/sintomas" },
  ],
};

/** Menu Sidebar/Dropdown **/
const SIDEBAR: Record<Papel, MenuItem[]> = {
  cuidador: [
    { key: "profile", label: "Perfil", path: "/profile" },
    { key: "lembretes", label: "Lembretes", path: "/lembretes" },
    { key: "receitas", label: "Receitas", path: "/receitas" },
  ],
  paciente_autonomo: [
    { key: "profile", label: "Perfil", path: "/profile" },
    { key: "lembretes", label: "Lembretes", path: "/lembretes" },
    { key: "receitas", label: "Receitas", path: "/receitas" },
  ],
  paciente_dependente: [{ key: "profile", label: "Perfil", path: "/profile" }],
};

export function getHomeActionsForRole(papel?: Papel | null): MenuItem[] {
  if (!papel) return [];
  return ACTIONS[papel] ?? [];
}

export function getSidebarForRole(papel?: Papel | null): MenuItem[] {
  if (!papel) return [];
  return SIDEBAR[papel] ?? [];
}
