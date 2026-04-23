/**
 * Transforma um texto livre em um slug amigável para URL / identificador.
 *
 * Regras:
 *  - Tudo em minúsculas.
 *  - Remove acentos via decomposição NFD (`café` → `cafe`).
 *  - Troca qualquer run de não-alfanuméricos por um único `-`.
 *  - Retira `-` das extremidades.
 *  - Limita a 64 chars — valor razoável para URLs e lookups.
 *
 * Note que o schema do banco usa `citext` nos slugs, então o slug final é
 * case-insensitive também no lado do banco; forçar lowercase no cliente é
 * apenas por consistência visual.
 */
export function slugify(input: string, maxLength = 64): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}
