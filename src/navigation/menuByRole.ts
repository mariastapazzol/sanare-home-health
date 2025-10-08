import { ReactNode } from 'react';

export type Papel = 'cuidador' | 'paciente_autonomo' | 'paciente_dependente';

export type MenuItem = {
  key: string;
  label: string;
  path: string;
  icon?: ReactNode;
  showInHome?: boolean; // Se deve aparecer como card na Home
  showInMenu?: boolean; // Se deve aparecer no menu dropdown
};

export const menuByRole: Record<Papel, MenuItem[]> = {
  cuidador: [
    { key: 'home', label: 'Início', path: '/home', showInHome: false, showInMenu: false },
    { key: 'medicamentos', label: 'Medicamentos', path: '/medicamentos', showInHome: true, showInMenu: true },
    { key: 'estoque', label: 'Estoque', path: '/stock', showInHome: true, showInMenu: true },
    { key: 'diario', label: 'Diário Emocional', path: '/diary', showInHome: true, showInMenu: true },
    { key: 'sintomas', label: 'Sintomas e Sinais', path: '/sintomas', showInHome: true, showInMenu: true },
    { key: 'lembretes', label: 'Lembretes', path: '/lembretes', showInHome: false, showInMenu: true },
    { key: 'perfil', label: 'Perfil', path: '/profile', showInHome: false, showInMenu: true },
    { key: 'sair', label: 'Sair', path: '/logout', showInHome: false, showInMenu: true },
  ],
  paciente_autonomo: [
    { key: 'home', label: 'Início', path: '/home', showInHome: false, showInMenu: false },
    { key: 'medicamentos', label: 'Medicamentos', path: '/medicamentos', showInHome: true, showInMenu: true },
    { key: 'estoque', label: 'Estoque', path: '/stock', showInHome: true, showInMenu: true },
    { key: 'diario', label: 'Diário Emocional', path: '/diary', showInHome: true, showInMenu: true },
    { key: 'sintomas', label: 'Sintomas e Sinais', path: '/sintomas', showInHome: true, showInMenu: true },
    { key: 'lembretes', label: 'Lembretes', path: '/lembretes', showInHome: false, showInMenu: true },
    { key: 'perfil', label: 'Perfil', path: '/profile', showInHome: false, showInMenu: true },
    { key: 'sair', label: 'Sair', path: '/logout', showInHome: false, showInMenu: true },
  ],
  paciente_dependente: [
    { key: 'home', label: 'Início', path: '/home', showInHome: false, showInMenu: false },
    { key: 'checklist', label: 'Checklist', path: '/checklist', showInHome: true, showInMenu: true },
    { key: 'sintomas', label: 'Sintomas e Sinais', path: '/sintomas', showInHome: true, showInMenu: true },
    { key: 'perfil', label: 'Perfil', path: '/profile', showInHome: true, showInMenu: true },
    { key: 'sair', label: 'Sair', path: '/logout', showInHome: false, showInMenu: true },
  ],
};

export function getMenuForRole(papel: Papel | null): MenuItem[] {
  if (!papel) return [];
  return menuByRole[papel] || [];
}

export function getHomeCardsForRole(papel: Papel | null): MenuItem[] {
  return getMenuForRole(papel).filter(item => item.showInHome);
}

export function getDropdownMenuForRole(papel: Papel | null): MenuItem[] {
  return getMenuForRole(papel).filter(item => item.showInMenu);
}
