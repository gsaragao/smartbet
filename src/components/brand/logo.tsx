import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  /** If true, only renders the symbol. Otherwise, renders symbol + wordmark. */
  symbolOnly?: boolean;
};

/**
 * Smart Bet brand logo.
 *
 * The symbol is an upward trending chart arrow composed of two segments —
 * evoking the idea of data-driven growth (the core promise of Smart Bet).
 * The mark uses the brand emerald with a subtle vertical gradient, so it
 * reads as an intentional logotype rather than a generic icon.
 */
export function Logo({ className, symbolOnly = false }: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className="size-7" />
      {!symbolOnly && (
        <span className="font-heading text-[15px] font-semibold tracking-tight">
          Smart<span className="text-primary">Bet</span>
        </span>
      )}
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sb-logo-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(from var(--primary) calc(l + 0.08) c h)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#sb-logo-grad)" />
      {/* Inner highlight — adds depth without feeling skeuomorphic. */}
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="8.5"
        fill="none"
        stroke="oklch(from white l c h / 0.18)"
        strokeWidth="1"
      />
      <path
        d="M8 20.5 L13.5 15 L17 18.5 L24 11"
        stroke="var(--primary-foreground)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 11 L24 11 L24 15"
        stroke="var(--primary-foreground)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
