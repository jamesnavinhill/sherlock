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
          className={`py-2 osint-meta-label-strong ${
            form.value.searchDepth === 'STANDARD' ? 'osint-button-soft' : 'osint-button-primary'
          }`}
        >
          Standard
        </button>
        <button
          type="button"
          onClick={() => form.setSearchDepth('DEEP')}
          className={`py-2 osint-meta-label-strong ${
            form.value.searchDepth === 'DEEP' ? 'osint-button-soft' : 'osint-button-primary'
          }`}
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
          className={`py-2 osint-meta-label-strong ${
            form.value.generationMode === 'SINGLE_PASS'
              ? 'osint-button-soft'
              : 'osint-button-primary'
          }`}
        >
          Single Pass
        </button>
        <button
          type="button"
          onClick={() => form.setGenerationMode('STAGED')}
          className={`py-2 osint-meta-label-strong ${
            form.value.generationMode === 'STAGED' ? 'osint-button-soft' : 'osint-button-primary'
          }`}
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
