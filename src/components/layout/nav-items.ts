import {
  BarChart3,
  Coins,
  Globe2,
  LayoutDashboard,
  LibraryBig,
  LineChart,
  ListChecks,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { Papel } from '@/lib/auth/profile';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** If true the item is listed but disabled ("coming soon"). */
  soon?: boolean;
  description?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
  /** If provided, section is only rendered when user has one of these roles. */
  roles?: Papel[];
};

/**
 * Sidebar navigation — single source of truth. The order and grouping was
 * picked to mirror the user's mental workflow:
 *
 *   1. Look at the big picture (Dashboard).
 *   2. Register activity (Bets, Matches, Bankroll).
 *   3. Evolve the plan (Strategies, Projection).
 *   4. Explore data & settings.
 *   5. Administration (only for `papel = 'admin'`).
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Visão geral',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        description: 'Resumo de ROI, yield e banca.',
      },
    ],
  },
  {
    label: 'Operação',
    items: [
      {
        href: '/bets',
        label: 'Apostas',
        icon: Target,
        description: 'Todas as apostas registradas.',
      },
      {
        href: '/matches',
        label: 'Jogos',
        icon: Trophy,
        description: 'Rodada atual e próximos jogos.',
        soon: true,
      },
      {
        href: '/banca',
        label: 'Banca',
        icon: Coins,
        description: 'Depósitos, saques e saldo.',
      },
    ],
  },
  {
    label: 'Estratégia',
    items: [
      {
        href: '/strategies',
        label: 'Estratégias',
        icon: Sparkles,
        description: 'Cadastre e acompanhe suas estratégias.',
      },
      {
        href: '/projection',
        label: 'Projeção',
        icon: LineChart,
        description: 'Simule cenários e progressões.',
        soon: true,
      },
      {
        href: '/analytics',
        label: 'Análises',
        icon: BarChart3,
        description: 'Cortes por tipo, liga e período.',
        soon: true,
      },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      {
        href: '/catalog',
        label: 'Catálogos',
        icon: LibraryBig,
        description: 'Times, ligas e tipos de aposta.',
        soon: true,
      },
      {
        href: '/settings',
        label: 'Configurações',
        icon: Settings,
        description: 'Conta, moeda e preferências.',
        soon: true,
      },
    ],
  },
  {
    label: 'Administração',
    roles: ['admin'],
    items: [
      {
        href: '/admin/tipos-aposta',
        label: 'Tipos de aposta',
        icon: ListChecks,
        description: 'Catálogo global de mercados.',
      },
      {
        href: '/admin/esportes',
        label: 'Esportes',
        icon: ShieldCheck,
        description: 'Modalidades suportadas.',
      },
      {
        href: '/admin/paises',
        label: 'Países',
        icon: Globe2,
        description: 'Federações e bandeiras.',
      },
      {
        href: '/admin/ligas',
        label: 'Ligas',
        icon: Trophy,
        description: 'Competições por esporte e país.',
      },
      {
        href: '/admin/times',
        label: 'Times',
        icon: Users,
        description: 'Clubes e seleções com escudo.',
      },
    ],
  },
];

/** Returns the subset of sections visible for a given role. */
export function visibleSections(papel: Papel): NavSection[] {
  return NAV_SECTIONS.filter((s) => !s.roles || s.roles.includes(papel));
}

/**
 * Like `visibleSections`, but hides sections whose every item is `soon`.
 * Rationale: a sidebar full of disabled links teaches the user that this app
 * is half-done. We'd rather have a compact, honest nav that grows as features
 * land — each new item will *feel like a release*, not another grayed-out row.
 */
export function visibleSectionsForNav(papel: Papel): NavSection[] {
  return visibleSections(papel)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.soon),
    }))
    .filter((section) => section.items.length > 0);
}

/**
 * Count of shipped vs planned nav items — used to render a tiny "progress of
 * the product" indicator in the sidebar footer. Goal-gradient effect: users
 * (and the builder) see how close we are to feature-complete, which is way
 * more motivating than a static "Fase 1 · MVP" label.
 */
export function navProgress(papel: Papel): { shipped: number; total: number } {
  const sections = visibleSections(papel);
  const all = sections.flatMap((s) => s.items);
  return {
    shipped: all.filter((i) => !i.soon).length,
    total: all.length,
  };
}
