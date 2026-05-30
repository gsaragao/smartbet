import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { publicEnv, serverEnv } from '@/lib/env';
import type { Database } from '@/types/supabase';

/**
 * Cliente Supabase com service role — apenas servidor, sem cookies.
 * Usar só em fluxos explicitamente autorizados (ex.: admin redefinir senha).
 */
export function createSupabaseServiceRoleClient() {
  const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.length) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY_MISSING');
  }
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
