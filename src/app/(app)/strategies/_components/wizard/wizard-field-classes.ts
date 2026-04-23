import { cn } from '@/lib/utils';

/** Controles alinhados ao restante do app (modais de banca, etc.). */
export const wizardControlClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-none transition-[color,box-shadow] md:text-sm';

export const wizardFocusRingClass =
  'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25';

export function wizardControlCn(extra?: string) {
  return cn(wizardControlClass, wizardFocusRingClass, extra);
}
