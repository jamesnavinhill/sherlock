import React from 'react';
import { Microscope, Workflow } from 'lucide-react';

import { ThinkingBudgetControl } from './ThinkingBudgetControl';
import type { RuntimeConfigFormController } from './useRuntimeConfigForm';

interface RuntimeConfigBehaviorControlsProps {
  form: RuntimeConfigFormController;
  className?: string;
  generationHint?: string;
  searchDepthHint?: string;
  generationSectionClassName?: string;
  searchDepthSectionClassName?: string;
  thinkingBudgetClassName?: string;
}

export const RuntimeConfigBehaviorControls: React.FC<RuntimeConfigBehaviorControlsProps> = ({
  form,
  className = 'grid gap-4 md:grid-cols-2',
  generationHint = 'Single pass is lighter. Staged favors stronger evidence and reusable sections.',
  generationSectionClassName = 'border border-zinc-800 bg-zinc-900/30 p-4',
  searchDepthSectionClassName = 'border border-zinc-800 bg-zinc-900/30 p-4',
  searchDepthHint = 'Controls breadth, synthesis depth, and investigative rigor.',
  thinkingBudgetClassName = 'border border-zinc-800 bg-zinc-900/30 p-4 md:col-span-2',
}) => (
  <div className={className}>
    <section className={searchDepthSectionClassName}>
      <label className="mb-2 flex items-center osint-meta-label">
        <Microscope className="mr-2 h-3 w-3 text-osint-primary" />
        Search Depth
      </label>
      <p className="mb-3 osint-body-quiet">{searchDepthHint}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => form.setSearchDepth('STANDARD')}
          aria-pressed={form.value.searchDepth === 'STANDARD'}
          data-active={form.value.searchDepth === 'STANDARD' ? 'true' : undefined}
          className="osint-surface-button py-2 osint-meta-label-strong"
        >
          Standard
        </button>
        <button
          type="button"
          onClick={() => form.setSearchDepth('DEEP')}
          aria-pressed={form.value.searchDepth === 'DEEP'}
          data-active={form.value.searchDepth === 'DEEP' ? 'true' : undefined}
          className="osint-surface-button py-2 osint-meta-label-strong"
        >
          Deep
        </button>
      </div>
    </section>

    <section className={generationSectionClassName}>
      <label className="mb-2 flex items-center osint-meta-label">
        <Workflow className="mr-2 h-3 w-3 text-osint-primary" />
        Generation Mode
      </label>
      <p className="mb-3 osint-body-quiet">{generationHint}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => form.setGenerationMode('SINGLE_PASS')}
          aria-pressed={form.value.generationMode === 'SINGLE_PASS'}
          data-active={form.value.generationMode === 'SINGLE_PASS' ? 'true' : undefined}
          className="osint-surface-button py-2 osint-meta-label-strong"
        >
          Single Pass
        </button>
        <button
          type="button"
          onClick={() => form.setGenerationMode('STAGED')}
          aria-pressed={form.value.generationMode === 'STAGED'}
          data-active={form.value.generationMode === 'STAGED' ? 'true' : undefined}
          className="osint-surface-button py-2 osint-meta-label-strong"
        >
          Staged
        </button>
      </div>
    </section>

    <ThinkingBudgetControl
      providerLabel={form.providerMeta?.label || form.value.provider}
      supportsThinkingBudget={form.supportsThinkingBudget}
      value={form.value.thinkingBudget}
      onChange={form.setThinkingBudget}
      className={thinkingBudgetClassName}
      supportedHint="Applied by the selected model."
    />
  </div>
);
