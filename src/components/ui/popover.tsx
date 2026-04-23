'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';

import { cn } from '@/lib/utils';

function Popover(props: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root {...props} />;
}

const PopoverTrigger = PopoverPrimitive.Trigger;

type PortalContainer = NonNullable<
  React.ComponentProps<typeof PopoverPrimitive.Portal>['container']
>;

/**
 * PopoverContent com ajustes para funcionar dentro de `Dialog`:
 *
 * - `container`: opcionalmente força o portal no `document.body` para evitar
 *   clipping do `overflow` do Dialog.
 * - `positionMethod="fixed"`: fixa o popup no viewport (evita herdar `transform`
 *   ou `overflow` do ancestral).
 * - `collisionBoundary`: usa `<html>` como fronteira de colisão em vez do
 *   ancestral clipping (que dentro do Dialog é o próprio conteúdo rolável).
 * - `style={{ zIndex: 60 }}` no **Positioner**: o popup herda `position: static`
 *   do Base UI, então o `z-index` precisa estar no positioner (fixed) para
 *   ficar acima do `DialogContent` (que usa `z-50`).
 */
function PopoverContent({
  className,
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  container,
  style,
  ...props
}: PopoverPrimitive.Popup.Props & {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  container?: PortalContainer;
}) {
  // Lazy init: roda uma vez no primeiro render do client (após hydration).
  // No SSR retorna null e o Positioner usa o fallback 'clipping-ancestors'.
  const [boundary] = React.useState<HTMLElement | null>(() =>
    typeof document !== 'undefined' ? document.documentElement : null,
  );

  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        positionMethod="fixed"
        collisionBoundary={boundary ?? 'clipping-ancestors'}
        collisionPadding={8}
        style={{ zIndex: 60 }}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'bg-popover text-popover-foreground w-72 rounded-md border border-border p-3 shadow-lg outline-none',
            'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
            'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
            'transition-[opacity,transform,scale] duration-150 ease-out',
            className,
          )}
          style={style}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
