import {
  CircleDot,
  Dumbbell,
  Medal,
  Target,
  Trophy,
  Volleyball,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Mapa slug -> ícone. Mantido aqui (e não no banco) porque ícone é decisão
 * puramente visual e não deveria exigir migração.
 *
 * Slugs desconhecidos caem no fallback `Trophy`, que funciona bem para
 * qualquer modalidade competitiva.
 */
const ICON_POR_SLUG: Record<string, LucideIcon> = {
  futebol: CircleDot,
  basquete: Target,
  volei: Volleyball,
  voleibol: Volleyball,
  tenis: Medal,
  natacao: Waves,
  mma: Dumbbell,
  boxe: Dumbbell,
  esports: Zap,
};

type EsporteIconProps = {
  slug: string;
  className?: string;
};

/**
 * Renderiza o ícone do esporte. Usamos um component wrapper (em vez de
 * retornar o componente via função) para respeitar a regra do React
 * Compiler "no components created during render".
 */
export function EsporteIcon({ slug, className }: EsporteIconProps) {
  const Icon = ICON_POR_SLUG[slug.toLowerCase()] ?? Trophy;
  return <Icon className={cn(className)} />;
}
