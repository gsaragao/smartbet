import { cn } from '@/lib/utils';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  /**
   * When true, renders the eyebrow as a pill-shaped brand tag with a
   * pulsing dot — used on high-visibility pages (Dashboard, Bankroll).
   * When false (default), keeps the sober uppercase label used in
   * CRUD / admin pages.
   */
  eyebrowAsTag?: boolean;
};

/**
 * Standard page header used across authenticated routes. Keeps visual
 * consistency: eyebrow (section tag), title (h1), description, and aligned
 * action slot on the right. Stacks gracefully on mobile.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  eyebrowAsTag = false,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        {eyebrow &&
          (eyebrowAsTag ? (
            <span className="border-primary/20 bg-primary/5 text-primary inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase">
              <span className="bg-primary size-1.5 animate-pulse rounded-full" />
              {eyebrow}
            </span>
          ) : (
            <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              {eyebrow}
            </p>
          ))}
        <h1 className="font-heading text-foreground text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
