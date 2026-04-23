import { requireAdmin } from '@/lib/auth/profile';

export const metadata = {
  title: 'Administração',
};

/**
 * Additional guard for /admin routes. The (app) layout already ensures the
 * user is authenticated; here we enforce `papel = 'admin'` and 404 otherwise
 * (never leak the existence of admin pages).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
