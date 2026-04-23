'use client';

import * as React from 'react';
import { Shield } from 'lucide-react';

import { cn } from '@/lib/utils';

type Props = {
  url: string | null;
  alt: string;
  /** Tamanho em pixels (width/height). */
  size?: number;
  className?: string;
};

/**
 * Renderiza o escudo do time. Se a URL falhar (404, CORS, host offline),
 * caímos no fallback com o ícone Shield — assim o layout nunca quebra
 * mesmo com CDNs instáveis.
 *
 * Usamos `<img>` puro em vez de `next/image` porque:
 *   1. As URLs são livres (cadastro pelo usuário), então configurar
 *      `remotePatterns` pra cada host é impraticável.
 *   2. Escudos são pequenos (≤ 64px) — o ganho de otimização é ínfimo.
 */
export function Escudo({ url, alt, size = 28, className }: Props) {
  const [failed, setFailed] = React.useState(false);
  const hasImg = Boolean(url) && !failed;

  return (
    <span
      className={cn(
        'bg-muted/60 text-muted-foreground ring-border/40 inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {hasImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url as string}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <Shield className="size-[55%]" />
      )}
    </span>
  );
}
