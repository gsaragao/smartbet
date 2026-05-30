'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Logo } from '@/components/brand/logo';
import { navProgress, visibleSectionsForNav, type NavItem } from '@/components/layout/nav-items';
import type { Papel } from '@/lib/auth/profile';
import { cn } from '@/lib/utils';

type SidebarProps = {
  className?: string;
  papel: Papel;
  /** Called when the user clicks a link (used by mobile drawer to close itself). */
  onNavigate?: () => void;
};

export function Sidebar({ className, papel, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const sections = visibleSectionsForNav(papel);
  const progress = papel === 'admin' ? navProgress(papel) : null;

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border relative w-64 shrink-0 flex-col border-r',
        'sticky top-0 h-dvh',
        className,
      )}
      aria-label="Navegação principal"
    >
      {/* Brand */}
      <div className="border-sidebar-border flex h-14 items-center border-b px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="rounded-md transition-opacity hover:opacity-80"
          aria-label="Ir para o Dashboard"
        >
          <Logo />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-5">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="text-muted-foreground px-2 pb-1 text-[11px] font-medium tracking-wider uppercase">
                {section.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <SidebarLink
                      item={item}
                      active={isActive(pathname, item.href)}
                      onNavigate={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Progresso do MVP: visível só para administradores (roadmap interno). */}
      {papel === 'admin' && progress ? (
        <div className="border-sidebar-border border-t px-4 py-3">
          <NavProgressBadge shipped={progress.shipped} total={progress.total} />
        </div>
      ) : null}
    </aside>
  );
}

function NavProgressBadge({ shipped, total }: { shipped: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((shipped / total) * 100);
  return (
    <div
      className="group/progress flex flex-col gap-1.5"
      aria-label={`${shipped} de ${total} módulos entregues`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
          Progresso MVP
        </span>
        <span className="text-sidebar-foreground text-[11px] font-semibold tabular-nums">
          <span className="text-primary">{shipped}</span>
          <span className="text-muted-foreground">/{total}</span>
        </span>
      </div>
      <div
        className="bg-sidebar-border/80 h-1 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const content = (
    <span
      className={cn(
        'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {/* Left accent rail — brand emerald — appears only on active item.
          Small detail, big signal: it tells the user "this is where you are"
          without relying purely on background color. */}
      {active && (
        <span
          aria-hidden="true"
          className="bg-primary absolute top-1.5 bottom-1.5 -left-1 w-0.5 rounded-full"
        />
      )}
      <Icon
        className={cn(
          'size-4 shrink-0 transition-colors',
          active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground',
        )}
      />
      <span className="truncate">{item.label}</span>
    </span>
  );

  return (
    <Link href={item.href} onClick={onNavigate}>
      {content}
    </Link>
  );
}

/**
 * A pathname is "active" if it exactly matches the href OR is a subroute,
 * except that "/dashboard" should not activate on every nested page.
 */
function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/dashboard') return false;
  return pathname.startsWith(`${href}/`);
}
