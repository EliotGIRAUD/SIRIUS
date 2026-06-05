import type { UserRole } from './types';

export function homeForRole(role: UserRole): string {
  switch (role) {
    case 'shelter':
      return '/shelter';
    case 'breeder':
      return '/breeder';
    case 'sponsor':
      return '/sponsor';
    default:
      return '/login';
  }
}

export const SHELTER_NAV = [
  { to: '/shelter', label: 'Tableau de bord' },
  { to: '/shelter/codes', label: 'Codes adoptant' },
  { to: '/shelter/subscription', label: 'Abonnement' },
  { to: '/shelter/settings', label: 'Paramètres' },
] as const;

export const BREEDER_NAV = [
  { to: '/breeder', label: 'Tableau de bord' },
  { to: '/breeder/profile', label: 'Ma fiche' },
  { to: '/breeder/subscription', label: 'Abonnement' },
] as const;

export const SPONSOR_NAV = [
  { to: '/sponsor', label: 'Campagnes' },
  { to: '/sponsor/new', label: 'Nouvelle campagne' },
] as const;
