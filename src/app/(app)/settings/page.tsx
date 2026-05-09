import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { requireAuth } from '@/lib/auth/profile';

import { ChangePasswordForm } from './_components/change-password-form';

export const metadata: Metadata = {
  title: 'Configurações',
  description: 'Conta e preferências.',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const profile = await requireAuth();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações"
        description="Gerencie a segurança da sua conta e preferências básicas."
      />
      <ChangePasswordForm userEmail={profile.email} />
    </div>
  );
}
