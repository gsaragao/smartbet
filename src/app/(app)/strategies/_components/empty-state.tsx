'use client';

import { Plus, Sparkles, Target } from 'lucide-react';
import * as React from 'react';

import type { WizardOptions } from '@/features/strategies/queries';
import { useUser } from '@/components/providers/user-context';

import { StrategyDialog } from './strategy-dialog';
import { TemplatePicker } from './template-picker';

export function EmptyState({ options }: { options: WizardOptions }) {
  const { canWrite } = useUser();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="bg-primary/10 text-primary ring-primary/20 flex size-14 items-center justify-center rounded-2xl ring-1">
        <Target className="size-7" aria-hidden />
      </div>

      <div className="max-w-md text-center">
        <h3 className="text-foreground font-heading text-xl font-semibold">
          Crie sua primeira estratégia
        </h3>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Estratégias organizam suas apostas em torno de um racional claro, com regras, gestão de
          stake e guardrails.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {canWrite && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-card group hover:border-primary/40 flex flex-col gap-2 rounded-xl border p-5 text-left transition-all hover:shadow-md"
          >
            <div className="bg-muted text-foreground flex size-10 items-center justify-center rounded-lg">
              <Plus className="size-5" />
            </div>
            <h4 className="text-foreground font-medium">Criar do zero</h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Use o wizard guiado de 4 passos (identidade, escopo, gestão, regras).
            </p>
            <span className="text-primary mt-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
              Começar agora →
            </span>
          </button>
        )}
        {canWrite && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="bg-card group hover:border-primary/40 flex flex-col gap-2 rounded-xl border p-5 text-left transition-all hover:shadow-md"
          >
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <Sparkles className="size-5" />
            </div>
            <h4 className="text-foreground font-medium">Usar template</h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Comece com estratégias prontas: Ambas Marcam, Ao vivo 0x0 ou Under 2.5.
            </p>
            <span className="text-primary mt-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
              Ver templates →
            </span>
          </button>
        )}
      </div>

      <StrategyDialog
        mode="create"
        options={options}
        open={createOpen}
        onOpenChange={setCreateOpen}
        showTrigger={false}
      />
      <TemplatePicker options={options} open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
