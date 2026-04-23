import { cn } from '@/lib/utils';

/**
 * Canonical bet/transaction statuses surfaced in lists and history views.
 * Keep this enum short on purpose — more statuses = more cognitive load per
 * row. If a new state emerges, ask first whether it's truly user-facing or
 * just an engineering detail (e.g. "syncing") that belongs elsewhere.
 */
export type Status = 'win' | 'loss' | 'pending' | 'void' | 'cashout';

type StatusBadgeProps = {
  status: Status;
  /** Override the default human label (e.g. for different locales or tenses). */
  label?: string;
  /** Compact variant (dot only, label in tooltip) is used in dense tables. */
  compact?: boolean;
  className?: string;
};

/**
 * Visual grammar:
 *   - Solid dot on the left signals "state" the way traffic lights do.
 *   - Soft tinted background keeps the badge quiet in a long list (50+ rows
 *     with saturated badges is an eyesore).
 *   - Text color uses the strong semantic token to stay WCAG AA legible on
 *     the muted background.
 */
const STYLES: Record<Status, { bg: string; text: string; dot: string; label: string }> = {
  win: {
    bg: 'bg-win-muted',
    text: 'text-win',
    dot: 'bg-win',
    label: 'Green',
  },
  loss: {
    bg: 'bg-loss-muted',
    text: 'text-loss',
    dot: 'bg-loss',
    label: 'Red',
  },
  pending: {
    bg: 'bg-pending-muted',
    text: 'text-pending',
    dot: 'bg-pending',
    label: 'Pendente',
  },
  void: {
    bg: 'bg-void-muted',
    text: 'text-void',
    dot: 'bg-void',
    label: 'Anulada',
  },
  cashout: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
    label: 'Cashout',
  },
};

export function StatusBadge({ status, label, compact, className }: StatusBadgeProps) {
  const style = STYLES[status];
  const text = label ?? style.label;

  if (compact) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}
        title={text}
      >
        <span className={cn('size-2 rounded-full', style.dot)} aria-hidden="true" />
        <span className="sr-only">{text}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        style.bg,
        style.text,
        className,
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', style.dot)}
        aria-hidden="true"
      />
      {text}
    </span>
  );
}
