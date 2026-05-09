import { Users } from 'lucide-react';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentProfile } from '@/lib/auth/profile';
import { listarPerfisAdmin, resumoPerfis } from '@/features/admin/usuarios/queries';

import { UsuariosGrid } from './_components/usuarios-grid';
import { UsuariosResumo } from './_components/usuarios-resumo';

export const metadata = {
  title: 'Usuários',
};

export default function AdminUsuariosPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        description="Perfis da aplicação ligados ao login. Altere papéis (admin, executor, consulta), nome e preferências regionais. Novos cadastros continuam vindo do registro público."
      />

      <Suspense fallback={<ConteudoSkeleton />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}

async function Conteudo() {
  const [perfis, me] = await Promise.all([listarPerfisAdmin(), getCurrentProfile()]);

  if (!me) return null;

  const resumo = resumoPerfis(perfis);

  if (perfis.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum perfil encontrado"
        description="Quando usuários se registrarem, eles aparecerão aqui."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <UsuariosResumo resumo={resumo} />
      {resumo.legacy_usuario > 0 ? (
        <p className="text-muted-foreground text-center text-xs">
          {resumo.legacy_usuario} perfil(is) com papel legado{' '}
          <code className="bg-muted rounded px-1">usuario</code> — considere migrar para executor ou
          consulta.
        </p>
      ) : null}
      <UsuariosGrid perfis={perfis} currentUserId={me.id} />
    </div>
  );
}

function ConteudoSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
