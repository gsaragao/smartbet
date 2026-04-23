import { Inbox, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  /**
   * Optional concrete example shown right below the description. Reduces
   * activation energy: instead of "what do I put here?", the user sees
   * "oh, like that". Pair this with a prefilled form when possible.
   */
  example?: {
    label: string;
    preview: React.ReactNode;
  };
  /**
   * When provided, a tiny hint renders under the CTA ("2 campos · 20s").
   * Shrinks the perceived cost of the first action — classic friction buster.
   */
  effortHint?: string;
  className?: string;
};

/**
 * Canonical empty state — used across lists, charts and panels when the
 * user has no data yet. Compared to a bare "no data" message this pattern
 * provides:
 *   - A gentle visual (icon tile),
 *   - A title that names the absence,
 *   - A short description explaining how to populate it,
 *   - An optional "example" snippet showing exactly what a filled item looks
 *     like (strong activation-energy reducer),
 *   - An optional call-to-action with an effort hint.
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  example,
  effortHint,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border/70 bg-muted/20 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <span className="bg-primary/10 text-primary ring-primary/20 flex size-11 items-center justify-center rounded-xl ring-1">
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-foreground font-heading text-base font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {example && (
        <div className="mt-2 flex flex-col items-center gap-1.5">
          <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            {example.label}
          </span>
          <div className="border-border/60 bg-card text-foreground rounded-lg border px-3 py-2 text-left text-xs shadow-xs">
            {example.preview}
          </div>
        </div>
      )}

      {action && (
        <div className="mt-2 flex flex-col items-center gap-1">
          {action}
          {effortHint && (
            <span className="text-muted-foreground text-[11px]">{effortHint}</span>
          )}
        </div>
      )}
    </div>
  );
}
