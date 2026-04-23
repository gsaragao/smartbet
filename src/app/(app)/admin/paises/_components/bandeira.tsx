import { cn } from '@/lib/utils';

type BandeiraProps = {
  /** Código ISO-3166 alpha-2, com 2 letras (ex.: "BR", "us"). */
  codigoIso: string;
  /** Tamanho fixo da bandeira. `md` (24×18) é o default, bom para tabelas densas. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/**
 * Renderiza a bandeira do país como SVG vetorial via flagcdn.com.
 *
 * Por que não emoji? Windows não desenha "regional indicator symbols"
 * como bandeiras coloridas — vira duas letras em caixinhas separadas,
 * o que fica feio num sistema usado majoritariamente em PT-BR/Windows.
 * flagcdn é CDN público, SVG grátis, com todos os ISO alpha-2.
 *
 * Fallback: se o ISO não tiver 2 letras A–Z, mostra uma pill neutra com
 * as letras pra manter a largura estável (evita layout shift na tabela).
 */

const SIZE = {
  sm: { w: 20, h: 15 },
  md: { w: 24, h: 18 },
  lg: { w: 32, h: 24 },
} as const;

export function Bandeira({ codigoIso, size = 'md', className }: BandeiraProps) {
  const upper = codigoIso?.trim().toUpperCase() ?? '';
  const isValid = /^[A-Z]{2}$/.test(upper);
  const { w, h } = SIZE[size];

  if (!isValid) {
    return (
      <span
        className={cn(
          'bg-muted text-muted-foreground inline-flex items-center justify-center rounded-sm font-mono text-[10px] font-semibold tracking-wide uppercase',
          className,
        )}
        style={{ width: w, height: h }}
        aria-hidden="true"
      >
        {upper || '??'}
      </span>
    );
  }

  const lower = upper.toLowerCase();
  // Servimos em 2x e deixamos o browser resampling — mantém nítido em retina.
  const src = `https://flagcdn.com/${w * 2}x${h * 2}/${lower}.png`;

  return (
    // Usamos <img> "nativo" em vez de next/image porque:
    //  (1) o domínio externo precisaria de allowlist no next.config;
    //  (2) são imagens mínimas (~1–2 KB PNG), sem ganho real de otimização;
    //  (3) a tabela renderiza N bandeiras — cada <Image> adiciona overhead.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Bandeira de ${upper}`}
      width={w}
      height={h}
      loading="lazy"
      decoding="async"
      className={cn(
        'ring-border/60 inline-block shrink-0 rounded-[2px] object-cover ring-1',
        className,
      )}
      style={{ width: w, height: h }}
    />
  );
}
