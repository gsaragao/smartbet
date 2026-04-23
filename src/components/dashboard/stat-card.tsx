import { TrendingDown, TrendingUp, Minus, type LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StatTrend = 'up' | 'down' | 'neutral';

/**
 * Semantic color track for the KPI. The accent only paints the icon tile
 * and (when emphasis='brand') the ambient glow — the value itself stays
 * neutral so it reads as "data", not decoration. Rationale:
 *   - 'brand'  → the hero metric (bankroll). Emerald.
 *   - 'win'    → profit/ROI/streak. Same hue as brand but framed as outcome.
 *   - 'warn'   → attention metrics (drawdown, pending bets). Amber.
 *   - 'info'   → statistical metrics (hit rate, sample). Blue.
 *   - 'neutral'→ volumetric metrics (bets this month, count). Muted.
 *
 * Keep the palette small on purpose — every extra color dilutes meaning.
 */
export type StatAccent = 'brand' | 'win' | 'warn' | 'info' | 'neutral';

type StatCardProps = {
  label: string;
  value: string;
  /** Small supporting line under the value (context, delta, etc). */
  hint?: string;
  trend?: StatTrend;
  /** Optional icon to anchor the card visually. */
  icon?: LucideIcon;
  /** Emphasized KPI gets a subtle brand ring + ambient glow. Use for the "hero" card. */
  emphasis?: 'default' | 'brand';
  /** Semantic accent for the icon tile & corner decoration. Defaults to 'neutral'. */
  accent?: StatAccent;
  className?: string;
};

const ACCENT_STYLES: Record<
  StatAccent,
  { tileBg: string; tileText: string; cornerBg: string }
> = {
  brand: {
    tileBg: 'bg-primary/10',
    tileText: 'text-primary',
    cornerBg: 'bg-primary/15',
  },
  win: {
    tileBg: 'bg-win-muted',
    tileText: 'text-win',
    cornerBg: 'bg-win/15',
  },
  warn: {
    tileBg: 'bg-pending-muted',
    tileText: 'text-pending',
    cornerBg: 'bg-pending/15',
  },
  info: {
    // chart-4 is the blue data color; keep icon text readable on its muted bg.
    tileBg: 'bg-chart-4/10',
    tileText: 'text-chart-4',
    cornerBg: 'bg-chart-4/15',
  },
  neutral: {
    tileBg: 'bg-muted',
    tileText: 'text-muted-foreground',
    cornerBg: 'bg-muted-foreground/5',
  },
};

/**
 * Dashboard stat card — the workhorse of the betting dashboard.
 *
 * Visual hierarchy:
 *   1. Label pill (uppercase eyebrow) — identifies the metric
 *   2. Value — monospace, tabular, hero-sized; the point of the card
 *   3. Trend + hint — direction and context, always subordinate
 *
 * The trend tag is a full pill (not just a glyph) so it reads at-a-glance
 * even with color-blindness, and pulls the appropriate win/loss/pending
 * domain token. Emphasized variant paints a brand ring for the
 * "primary" KPI (usually: current bankroll).
 */
export function StatCard({
  label,
  value,
  hint,
  trend = 'neutral',
  icon: Icon,
  emphasis = 'default',
  accent = 'neutral',
  className,
}: StatCardProps) {
  const isBrand = emphasis === 'brand';
  const style = ACCENT_STYLES[accent];

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-shadow duration-200',
        isBrand
          ? 'ring-brand-soft border-transparent bg-gradient-to-br from-card to-card/60'
          : 'hover:shadow-brand-sm',
        className,
      )}
    >
      {/* Soft color-coded corner circle — subtle visual signature so users
          recognize "this is the ROI card" before reading the label. Inspired
          by the CRM reference; we keep it small and off-canvas for calm. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -top-10 -right-10 size-32 rounded-full blur-2xl',
          isBrand ? 'bg-primary/15' : style.cornerBg,
        )}
      />
      <CardContent className="relative flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            {label}
          </span>
          {Icon && (
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-lg',
                isBrand ? 'bg-primary/10 text-primary' : cn(style.tileBg, style.tileText),
              )}
            >
              <Icon className="size-4" />
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-foreground font-mono text-3xl leading-none font-semibold tracking-tight tabular-nums">
            {value}
          </span>
        </div>

        {hint && (
          <div className="flex items-center gap-2">
            <TrendPill trend={trend} />
            <span className="text-muted-foreground text-xs leading-tight">{hint}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrendPill({ trend }: { trend: StatTrend }) {
  if (trend === 'up') {
    return (
      <span className="bg-win-muted text-win inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
        <TrendingUp className="size-3" />
        <span className="sr-only">Tendência de alta</span>
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="bg-loss-muted text-loss inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
        <TrendingDown className="size-3" />
        <span className="sr-only">Tendência de baixa</span>
      </span>
    );
  }
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
      <Minus className="size-3" />
      <span className="sr-only">Sem tendência</span>
    </span>
  );
}
