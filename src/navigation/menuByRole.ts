export interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon?: string;
}

/** Ações (cards) da Home **/
const ACTIONS: MenuItem[] = [
  { key: "medicamentos", label: "Medicamentos", path: "/medicamentos" },
  { key: "estoque", label: "Estoque", path: "/estoque" },
  { key: "diary", label: "Diário Emocional", path: "/diario" },
  { key: "sintomas", label: "Sintomas e Sinais", path: "/sintomas" },
];

/** Menu Sidebar/Dropdown **/
const SIDEBAR: MenuItem[] = [
  { key: "profile", label: "Perfil", path: "/profile" },
  { key: "lembretes", label: "Lembretes", path: "/lembretes" },
  { key: "receitas", label: "Receitas", path: "/receitas" },
];

export function getHomeActions(): MenuItem[] {
  return ACTIONS;
}

export function getSidebarMenu(): MenuItem[] {
  return SIDEBAR;
}
