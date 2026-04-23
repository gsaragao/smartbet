'use client';

import { Palette, X } from 'lucide-react';
import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { StrategyInput } from '@/features/strategies/schema';
import { cn } from '@/lib/utils';

import { wizardControlCn } from './wizard-field-classes';

const CORES_SUGERIDAS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#14b8a6',
  '#0ea5e9',
  '#64748b',
] as const;

const SWATCH_SIZE = 'size-9';

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border/70 bg-card/60 rounded-xl border p-4 shadow-sm sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StepIdentidade({
  form,
}: {
  form: UseFormReturn<StrategyInput>;
}) {
  const [tagDraft, setTagDraft] = React.useState('');

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <SectionCard>
        <FormField
          control={form.control}
          name="identidade.nome"
          render={({ field }) => (
            <FormItem className="gap-2">
              <FormLabel className="text-foreground">Nome</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex.: Ambas Marcam — ligas ofensivas"
                  autoFocus
                  className={wizardControlCn('font-medium')}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-muted-foreground text-xs leading-relaxed">
                Use um nome claro e único.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard>
        <FormField
          control={form.control}
          name="identidade.descricao"
          render={({ field }) => (
            <FormItem className="gap-2">
              <FormLabel className="text-foreground">Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva brevemente o racional da estratégia (opcional)"
                  rows={3}
                  className={cn(
                    'min-h-[5.5rem] resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm transition-[color,box-shadow] md:text-sm',
                    'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
                    'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25',
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard>
        <FormField
          control={form.control}
          name="identidade.cor"
          render={({ field }) => {
            const value = field.value ?? '#6366f1';
            return (
              <FormItem className="gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg">
                    <Palette className="size-4" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <FormLabel className="text-foreground">Cor</FormLabel>
                    <FormDescription className="text-muted-foreground text-xs leading-snug">
                      Todas as opções usam o mesmo formato — toque para aplicar.
                    </FormDescription>
                  </div>
                </div>
                <FormControl>
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    {/* Paleta nativa: mesmo tamanho e forma circular que os presets */}
                    <label
                      className={cn(
                        'relative flex shrink-0 cursor-pointer rounded-full border-2 border-dashed border-border bg-background p-0.5 transition-shadow hover:shadow-md',
                        'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-background',
                        !(CORES_SUGERIDAS as readonly string[]).includes(value) &&
                          'border-primary/50 ring-2 ring-primary/25 ring-offset-2 ring-offset-background',
                      )}
                      title="Cor personalizada"
                    >
                      <span className="sr-only">Cor personalizada</span>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className={cn(
                          SWATCH_SIZE,
                          'cursor-pointer appearance-none rounded-full border-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0',
                          '[&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0',
                          '[&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0',
                        )}
                        aria-label="Escolher cor personalizada"
                      />
                    </label>

                    {CORES_SUGERIDAS.map((cor) => {
                      const selected = value === cor;
                      return (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => field.onChange(cor)}
                          aria-label={`Cor ${cor}`}
                          aria-pressed={selected}
                          className={cn(
                            SWATCH_SIZE,
                            'shrink-0 rounded-full border-2 transition-transform hover:scale-105 active:scale-95',
                            selected
                              ? 'border-foreground/25 ring-primary scale-[1.02] ring-2 ring-offset-2 ring-offset-background'
                              : 'border-transparent hover:border-foreground/10',
                          )}
                          style={{ backgroundColor: cor }}
                        />
                      );
                    })}
                  </div>
                </FormControl>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  A cor aparece na faixa dos cartões e nos gráficos da estratégia.
                </p>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </SectionCard>

      <SectionCard>
        <FormField
          control={form.control}
          name="identidade.tags"
          render={({ field }) => {
            const tags = field.value ?? [];
            const addTag = (raw: string) => {
              const next = raw.trim();
              if (!next) return;
              if (tags.includes(next)) return;
              if (tags.length >= 10) return;
              field.onChange([...tags, next]);
              setTagDraft('');
            };
            return (
              <FormItem className="gap-2">
                <FormLabel className="text-foreground">Tags</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      'border-input bg-background flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5',
                      'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
                    )}
                  >
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-0.5 pr-0.5 text-xs font-normal"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            field.onChange(tags.filter((t) => t !== tag))
                          }
                          className="hover:text-destructive rounded p-0.5"
                          aria-label={`Remover tag ${tag}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addTag(tagDraft);
                        } else if (
                          e.key === 'Backspace' &&
                          !tagDraft &&
                          tags.length
                        ) {
                          field.onChange(tags.slice(0, -1));
                        }
                      }}
                      onBlur={() => addTag(tagDraft)}
                      placeholder={
                        tags.length === 0 ? 'Ex.: ao-vivo, over, futebol' : 'Adicionar…'
                      }
                      className="h-8 min-w-[6rem] flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-muted-foreground text-xs leading-relaxed">
                  Separe com Enter ou vírgula. Até 10 tags.
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </SectionCard>
    </div>
  );
}
