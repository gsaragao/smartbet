import { Eye, Shield, UserCog, Users } from 'lucide-react';

import type { UsuariosAdminResumo } from '@/features/admin/usuarios/queries';
import { cn } from '@/lib/utils';

type Props = { resumo: UsuariosAdminResumo };

export function UsuariosResumo({ resumo }: Props) {
  const cards = [
    {
      label: 'Total',
      value: resumo.total,
      icon: Users,
      className: 'from-primary/12 to-primary/5 border-primary/20',
      iconClass: 'text-primary bg-primary/15',
    },
    {
      label: 'Administradores',
      value: resumo.admins,
      icon: Shield,
      className: 'from-win/10 to-win/5 border-win/25',
      iconClass: 'text-win bg-win-muted',
    },
    {
      label: 'Executores',
      value: resumo.executores,
      icon: UserCog,
      className: 'from-foreground/8 to-muted/30 border-border',
      iconClass: 'text-foreground bg-muted',
    },
    {
      label: 'Consulta',
      value: resumo.consultas,
      icon: Eye,
      className: 'from-muted/40 to-muted/20 border-border',
      iconClass: 'text-muted-foreground bg-muted',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            'relative overflow-hidden rounded-xl border bg-gradient-to-br p-4',
            c.className,
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                {c.label}
              </p>
              <p className="font-heading text-2xl font-semibold tabular-nums">{c.value}</p>
            </div>
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                c.iconClass,
              )}
            >
              <c.icon className="size-4" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
