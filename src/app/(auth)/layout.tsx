import Link from 'next/link';
import { LineChart, ShieldCheck, Sparkles } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Two-column shell for authentication routes.
 *
 *  - Left: the form (centered, narrow, focused).
 *  - Right (lg+): a "hero" panel reinforcing the product value — what you
 *    get after signing in. This reassures new users and makes the page feel
 *    like a real product, not a blank modal.
 *
 * The hero collapses gracefully on mobile / tablet.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      {/* -------- Form column -------- */}
      <div className="bg-background relative flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link
            href="/"
            className="rounded-md transition-opacity hover:opacity-80"
            aria-label="Smart Bet"
          >
            <Logo />
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="text-muted-foreground px-6 py-5 text-xs sm:px-10">
          {/* suppressHydrationWarning: server may evaluate getFullYear() in a
              different timezone than the client at year boundaries. */}
          <span suppressHydrationWarning>
            © {new Date().getFullYear()} Smart Bet · Construído para quem aposta com método.
          </span>
        </footer>
      </div>

      {/* -------- Hero column (lg+) -------- */}
      <aside className="bg-sidebar relative hidden overflow-hidden border-l lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Brand ambient glow — radial gradients tinted with primary and
            accent. Replaces the neutral grid with something that actually
            carries the brand. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 brand-glow"
        />
        {/* Dot grid on top of the glow — texture without shouting. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-dot-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        />

        <div className="relative">
          <div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase">
            <span className="bg-primary size-1.5 animate-pulse rounded-full" />
            Smart Bet · Fase 1
          </div>
          <h2 className="font-heading text-foreground mt-5 max-w-md text-4xl leading-[1.05] font-semibold tracking-tight text-balance">
            Pare de apostar no achismo. <br />
            <span className="text-primary">Comece a apostar com método.</span>
          </h2>
          <p className="text-muted-foreground mt-5 max-w-md text-[15px] leading-relaxed">
            Registre cada aposta, teste estratégias e descubra — com dados
            reais — o que de fato gera lucro na sua banca.
          </p>
        </div>

        <ul className="relative mt-10 grid gap-5">
          <FeatureBullet
            icon={<LineChart className="size-4" />}
            title="ROI, Yield e Drawdown em tempo real"
            description="Acompanhe a saúde da banca e o desempenho por estratégia, tipo de aposta e liga."
          />
          <FeatureBullet
            icon={<ShieldCheck className="size-4" />}
            title="Dados criptografados no Supabase"
            description="Row Level Security garante que só você vê suas apostas."
          />
          <FeatureBullet
            icon={<Sparkles className="size-4" />}
            title="Roadmap com IA, EV+ e notificações"
            description="Fases seguintes trazem captura ao vivo e alertas de oportunidade."
          />
        </ul>

        <div className="relative mt-10 max-w-md">
          <blockquote className="border-primary/40 border-l-2 pl-4 text-sm leading-relaxed italic">
            “O apostador profissional não vence porque acerta mais — vence
            porque mede tudo. Smart Bet foi feito pra isso.”
          </blockquote>
        </div>
      </aside>
    </div>
  );
}

function FeatureBullet({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="bg-primary/10 text-primary ring-primary/20 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </li>
  );
}
