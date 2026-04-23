'use client';

import * as React from 'react';
import { LogOut, Menu, User as UserIcon } from 'lucide-react';

import { signOutAction } from '@/app/(auth)/actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import type { Papel } from '@/lib/auth/profile';

type TopbarProps = {
  user: { id: string; email: string; papel: Papel };
  onMobileMenuToggle: () => void;
};

export function Topbar({ user, onMobileMenuToggle }: TopbarProps) {
  const initial = user.email?.[0]?.toUpperCase() ?? '?';
  const isAdmin = user.papel === 'admin';

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMobileMenuToggle}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Empty spacer — on large screens the sidebar owns brand placement.
          On mobile we rely on the drawer so we don't duplicate the logo. */}
      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {isAdmin && (
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary hidden gap-1 sm:inline-flex"
          >
            Admin
          </Badge>
        )}
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <UserMenu email={user.email} initial={initial} />
      </div>
    </header>
  );
}

function UserMenu({ email, initial }: { email: string; initial: string }) {
  const [isPending, startTransition] = React.useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            aria-label="Abrir menu do usuário"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-muted-foreground text-[11px] font-normal tracking-wide uppercase">
            Conectado como
          </span>
          <span className="truncate text-sm font-medium">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserIcon className="size-4" /> Minha conta
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isPending}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          {isPending ? 'Saindo...' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
