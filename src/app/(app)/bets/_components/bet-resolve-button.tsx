'use client';

import * as React from 'react';
import { Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { BetDetail } from '@/features/bets/queries';
import { cn } from '@/lib/utils';

import { BetResolveDialog } from './bet-resolve-dialog';

type Props = {
  aposta: BetDetail;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
  className?: string;
  children?: React.ReactNode;
};

export function BetResolveButton({
  aposta,
  variant = 'default',
  size = 'default',
  className,
  children,
}: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn('gap-1.5', className)}
        onClick={() => setOpen(true)}
      >
        <Target className="size-4" />
        {children ?? 'Resolver'}
      </Button>
      <BetResolveDialog
        aposta={aposta}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
