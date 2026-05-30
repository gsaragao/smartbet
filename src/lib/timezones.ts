/** Fallback when `Intl.supportedValuesOf('timeZone')` is unavailable (older runtimes). */
const FALLBACK_TIMEZONE_IDS = [
  'America/Sao_Paulo',
  'America/Fortaleza',
  'America/Manaus',
  'America/New_York',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Argentina/Buenos_Aires',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'UTC',
] as const;

let cachedIds: string[] | null = null;

function buildTimeZoneIds(): string[] {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    return [...Intl.supportedValuesOf('timeZone')];
  }
  return [...FALLBACK_TIMEZONE_IDS];
}

/** All known IANA timezone identifiers for the current runtime (cached). */
export function getAllTimeZoneIds(): string[] {
  if (cachedIds) return cachedIds;
  cachedIds = buildTimeZoneIds();
  return cachedIds;
}

export function isValidTimeZoneId(id: string): boolean {
  return getAllTimeZoneIds().includes(id);
}

/** Merge standard list with an existing value (e.g. legacy DB row) so it stays selectable. */
export function getTimeZoneOptionsWithValue(value?: string | null): string[] {
  const base = getAllTimeZoneIds();
  if (!value || base.includes(value)) return base;
  return [value, ...base];
}
