'use client';

import * as React from 'react';
import { Pencil, Search } from 'lucide-react';

import type { PerfilAdminListItem } from '@/features/admin/usuarios/queries';
import { formatDateTime } from '@/lib/format';
import type { Papel } from '@/lib/auth/profile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { UsuarioEditDialog } from './usuario-edit-dialog';

const PAPEL_LABEL: Record<Papel, string> = {
  admin: 'Admin',
  executor: 'Executor',
  consulta: 'Consulta',
  usuario: 'Legado',
};

const PAPEL_VARIANT: Record<Papel, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  admin: 'default',
  executor: 'secondary',
  consulta: 'outline',
  usuario: 'outline',
};

type Props = {
  perfis: PerfilAdminListItem[];
  currentUserId: string;
};

export function UsuariosGrid({ perfis, currentUserId }: Props) {
  const [q, setQ] = React.useState('');
  const [editing, setEditing] = React.useState<PerfilAdminListItem | null>(null);

  const filtrados = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return perfis;
    return perfis.filter(
      (p) =>
        p.email.toLowerCase().includes(t) || (p.nome_completo?.toLowerCase().includes(t) ?? false),
    );
  }, [perfis, q]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por e-mail ou nome…"
            className="pl-10"
            aria-label="Filtrar usuários"
          />
        </div>
        <p className="text-muted-foreground text-sm tabular-nums">
          {filtrados.length} de {perfis.length} usuário(s)
        </p>
      </div>

      {/* Desktop */}
      <div className="border-border bg-card/40 hidden overflow-x-auto rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[28%]">E-mail</TableHead>
              <TableHead className="w-[18%]">Nome</TableHead>
              <TableHead className="w-[12%]">Papel</TableHead>
              <TableHead className="w-[8%]">Moeda</TableHead>
              <TableHead className="w-[14%]">Fuso</TableHead>
              <TableHead className="w-[14%]">Cadastro</TableHead>
              <TableHead className="w-[6%] text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((p) => (
              <TableRow key={p.id} className={p.id === currentUserId ? 'bg-primary/5' : undefined}>
                <TableCell className="font-mono text-sm">{p.email}</TableCell>
                <TableCell className="text-sm">
                  {p.nome_completo ?? <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={PAPEL_VARIANT[p.papel as Papel] ?? 'outline'}>
                    {PAPEL_LABEL[p.papel as Papel] ?? p.papel}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{p.moeda}</TableCell>
                <TableCell className="text-muted-foreground max-w-[140px] truncate text-xs">
                  {p.fuso_horario}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDateTime(p.criado_em)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Editar ${p.email}`}
                    onClick={() => setEditing(p)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <ul className="flex flex-col gap-3 md:hidden">
        {filtrados.map((p) => (
          <li
            key={p.id}
            className="border-border bg-card/50 flex flex-col gap-3 rounded-xl border p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">{p.email}</p>
                {p.nome_completo ? (
                  <p className="text-muted-foreground mt-0.5 text-sm">{p.nome_completo}</p>
                ) : null}
              </div>
              <Badge variant={PAPEL_VARIANT[p.papel as Papel] ?? 'outline'}>
                {PAPEL_LABEL[p.papel as Papel] ?? p.papel}
              </Badge>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                <span className="text-foreground font-medium">Moeda:</span> {p.moeda}
              </span>
              <span className="max-w-[200px] truncate">{p.fuso_horario}</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Cadastro: {formatDateTime(p.criado_em)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setEditing(p)}
            >
              <Pencil className="size-3.5" />
              Editar
            </Button>
          </li>
        ))}
      </ul>

      {editing ? (
        <UsuarioEditDialog
          usuario={editing}
          currentUserId={currentUserId}
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}
