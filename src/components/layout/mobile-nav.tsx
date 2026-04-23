'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';

import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import type { Papel } from '@/lib/auth/profile';

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  papel: Papel;
};

/**
 * Slide-in navigation for small screens. Uses the Base UI Dialog primitive —
 * which handles focus trap, escape-to-close and scroll lock for us. The
 * sidebar content is reused as-is for parity with desktop.
 */
export function MobileNav({ open, onOpenChange, papel }: MobileNavProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200 lg:hidden" />
        <DialogPrimitive.Popup className="bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r shadow-xl transition-transform duration-200 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full lg:hidden">
          <DialogPrimitive.Title className="sr-only">
            Navegação
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Atalhos para todas as áreas do Smart Bet.
          </DialogPrimitive.Description>

          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 z-10"
                aria-label="Fechar navegação"
              >
                <X className="size-4" />
              </Button>
            }
          />

          <Sidebar className="flex w-full border-none" papel={papel} onNavigate={() => onOpenChange(false)} />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
