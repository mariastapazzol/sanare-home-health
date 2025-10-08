export type Papel = 'cuidador' | 'paciente_autonomo' | 'paciente_dependente';

export type MenuItem = { 
  key: string; 
  label: string; 
  path: string;
};

// Menu lateral (sidebar/dropdown)
export const sidebarByRole: Record<Papel, MenuItem[]> = {
  cuidador: [
    { key: 'perfil',    label: 'Perfil',     path: '/profile' },
    { key: 'lembretes', label: 'Lembretes',  path: '/lembretes' },
    { key: 'sair',      label: 'Sair',       path: '/logout' },
  ],
  paciente_autonomo: [
    // apenas Lembretes e Sair (sem Perfil)
    { key: 'lembretes', label: 'Lembretes',  path: '/lembretes' },
    { key: 'sair',      label: 'Sair',       path: '/logout' },
  ],
  paciente_dependente: [
    { key: 'perfil',    label: 'Perfil',     path: '/profile' },
    { key: 'sair',      label: 'Sair',       path: '/logout' },
  ],
};

// Ações exibidas como cards na Home
export const homeActionsByRole: Record<Papel, MenuItem[]> = {
  cuidador: [
    { key: 'meds',      label: 'Medicamentos',     path: '/medicamentos' },
    { key: 'estoque',   label: 'Estoque',          path: '/stock' },
    { key: 'diario',    label: 'Diário Emocional', path: '/diary' },
    { key: 'sintomas',  label: 'Sintomas e Sinais',path: '/sintomas' },
    { key: 'vitals',    label: 'Sinais Vitais',    path: '/vitals' },
    { key: 'checklist', label: 'Checklist Diário', path: '/checklist-diario' },
  ],
  paciente_autonomo: [
    // refeita como a do cuidador
    { key: 'meds',      label: 'Medicamentos',     path: '/medicamentos' },
    { key: 'estoque',   label: 'Estoque',          path: '/stock' },
    { key: 'diario',    label: 'Diário Emocional', path: '/diary' },
    { key: 'sintomas',  label: 'Sintomas e Sinais',path: '/sintomas' },
    { key: 'vitals',    label: 'Sinais Vitais',    path: '/vitals' },
    { key: 'checklist', label: 'Checklist Diário', path: '/checklist-diario' },
  ],
  paciente_dependente: [
    // permanece como já implementado (botões/topo + checklist embutido na própria Home)
    { key: 'diario',    label: 'Diário Emocional', path: '/diary' },
    { key: 'sintomas',  label: 'Sintomas e Sinais',path: '/sintomas' },
  ],
};

export function getSidebarForRole(papel: Papel | null): MenuItem[] {
  if (!papel) return [];
  return sidebarByRole[papel] || [];
}

export function getHomeActionsForRole(papel: Papel | null): MenuItem[] {
  if (!papel) return [];
  return homeActionsByRole[papel] || [];
}
