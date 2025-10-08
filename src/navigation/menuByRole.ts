export type Papel = 'cuidador' | 'paciente_autonomo' | 'paciente_dependente';
export type MenuItem = { key: string; label: string; path: string };

// --- Sidebar (menu lateral) ---
const SIDEBAR: Record<Papel, MenuItem[]> = {
  cuidador: [
    { key: 'perfil',    label: 'Perfil',     path: '/perfil' },
    { key: 'lembretes', label: 'Lembretes',  path: '/lembretes' },
    { key: 'sair',      label: 'Sair',       path: '/logout' },
  ],
  paciente_autonomo: [
    { key: 'lembretes', label: 'Lembretes',  path: '/lembretes' },
    { key: 'sair',      label: 'Sair',       path: '/logout' },
  ],
  paciente_dependente: [
    { key: 'perfil',    label: 'Perfil',     path: '/perfil' },
    { key: 'sair',      label: 'Sair',       path: '/logout' },
  ],
};

// --- Ações (cards) da Home ---
const ACTIONS: Record<Papel, MenuItem[]> = {
  cuidador: [
    { key: 'meds',      label: 'Medicamentos',      path: '/medicamentos' },
    { key: 'estoque',   label: 'Estoque',           path: '/estoque' },
    { key: 'diario',    label: 'Diário Emocional',  path: '/diario' },
    { key: 'sintomas',  label: 'Sintomas',          path: '/sintomas' },
    { key: 'vitals',    label: 'Sinais Vitais',     path: '/vitals' },
    { key: 'checklist', label: 'Checklist Diário',  path: '/checklist' },
  ],
  // AUTÔNOMO: os MESMOS 6 cards
  paciente_autonomo: [
    { key: 'meds',      label: 'Medicamentos',      path: '/medicamentos' },
    { key: 'estoque',   label: 'Estoque',           path: '/estoque' },
    { key: 'diario',    label: 'Diário Emocional',  path: '/diario' },
    { key: 'sintomas',  label: 'Sintomas',          path: '/sintomas' },
    { key: 'vitals',    label: 'Sinais Vitais',     path: '/vitals' },
    { key: 'checklist', label: 'Checklist Diário',  path: '/checklist' },
  ],
  // DEPENDENTE: apenas 2 botões no topo (checklist embutido na Home)
  paciente_dependente: [
    { key: 'vitals',    label: 'Sinais Vitais',     path: '/vitals' },
    { key: 'diario',    label: 'Diário Emocional',  path: '/diario' },
  ],
};

export function getSidebarForRole(papel?: Papel | null): MenuItem[] {
  if (!papel) return [];
  return SIDEBAR[papel] ?? [];
}
export function getHomeActionsForRole(papel?: Papel | null): MenuItem[] {
  if (!papel) return [];
  return ACTIONS[papel] ?? [];
}
