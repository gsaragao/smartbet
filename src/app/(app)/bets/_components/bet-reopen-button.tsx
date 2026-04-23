'use client';

import * as React from 'react';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { reabrirAposta } from '@/features/bets/actions';
import { cn } from '@/lib/utils';

type Props = {
  id: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
  className?: string;
  children?: React.ReactNode;
  onReopened?: () => void;
};

export function BetReopenButton({
  id,
  variant = 'outline',
  size = 'sm',
  className,
  children,
  onReopened,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const confirmar = () => {
    startTransition(async () => {
      const r = await reabrirAposta(id);
      if (r.ok) {
        toast.success('Aposta reaberta.');
        onReopened?.();
        setOpen(false);
      } else {
        toast.error(r.message);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn('gap-1.5', className)}
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="size-3.5" />
        {children ?? 'Reabrir'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Reabrir aposta?
            </DialogTitle>
            <DialogDescription className="text-pretty">
              Isso volta o status para <strong>pendente</strong>, remove o evento de
              banca gerado pela resolução e recalcula o progresso da estratégia.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={confirmar} disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Reabrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
