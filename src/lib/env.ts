import { z } from 'zod';

/**
 * Runtime-validated environment variables.
 *
 * Using Zod ensures the app fails fast at startup if any critical variable is
 * missing or malformed, instead of silently passing `undefined` to the
 * Supabase client and crashing later with a cryptic error.
 *
 * Only variables prefixed with `NEXT_PUBLIC_` are available on the client.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

const serverSchema = publicSchema.extend({
  // Server-only — never expose to the browser (not prefixed with NEXT_PUBLIC_).
  // Required for admin RPCs and seed scripts. Validate presence explicitly in
  // any server action that actually uses this key instead of relying on this
  // schema (module is imported by browser-safe code and cannot throw at build).
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

export const publicEnv: PublicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const serverEnv: ServerEnv = serverSchema.parse({
  ...publicEnv,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});
