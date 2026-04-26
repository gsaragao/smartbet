'use client';

import { Plus, Target } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { useUser } from '@/components/providers/user-context';
import type { RegistroOptions } from '@/features/bets/queries';

import { BetDialog } from './bet-dialog';

export function EmptyState({ options }: { options: RegistroOptions }) {
  const { canWrite } = useUser();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="bg-primary/10 text-primary ring-primary/20 flex size-14 items-center justify-center rounded-2xl ring-1">
        <Target className="size-7" aria-hidden />
      </div>

      <div className="max-w-md text-center">
        <h3 className="text-foreground font-heading text-xl font-semibold">
          Nenhuma aposta registrada ainda
        </h3>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Registre sua primeira aposta para começar a acumular dados. Vincule a
          uma estratégia para que o sistema valide automaticamente o encaixe na
          regra antes de confirmar.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {canWrite && (
        <Button
          onClick={() => setOpen(true)}
          className="gap-1.5"
          disabled={options.bancas.length === 0}
        >
          <Plus className="size-4" />
          Registrar primeira aposta
        </Button>
        )}
        <Link
          href="/strategies"
          className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
        >
          Ver estratégias
        </Link>
      </div>

      {options.bancas.length === 0 && (
        <p className="text-muted-foreground max-w-md text-center text-xs">
          Cadastre uma banca primeiro — toda aposta é escriturada contra uma
          banca para controle financeiro.
        </p>
      )}

      <BetDialog
        options={options}
        open={open}
        onOpenChange={setOpen}
        trigger={null}
      />
    </div>
  );
}
