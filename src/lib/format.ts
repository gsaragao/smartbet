// Helpers puros de formatação compartilhados pelo app.
// Usamos `Intl` nativo — zero dependência extra.

const LOCALE_POR_MOEDA: Record<string, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
};

/**
 * Formata valores monetários respeitando a moeda da banca.
 * Exemplo: formatMoney(1250.5, 'BRL') => 'R$ 1.250,50'
 */
export function formatMoney(
  value: number | string | null | undefined,
  currency: string = 'BRL',
): string {
  const num =
    typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : 0;
  const safe = Number.isFinite(num) ? num : 0;
  const locale = LOCALE_POR_MOEDA[currency] ?? 'pt-BR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatPercent(value: number | null | undefined, fractionDigits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    signDisplay: 'exceptZero',
  }).format(value / 100);
}

/**
 * Formata um timestamp ISO em "dd/MM/yyyy HH:mm" sem libs.
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d);
}

/**
 * Converte um `Date` (ou ISO) para o formato esperado por `<input type="datetime-local">`
 * (YYYY-MM-DDTHH:mm). Sempre em horário LOCAL — por isso evitamos `toISOString()`.
 */
export function toDatetimeLocalInput(value: Date | string | null | undefined): string {
  const d =
    value instanceof Date ? value : value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
