import React from 'react';
import { Brain } from 'lucide-react';

interface ThinkingBudgetControlProps {
  providerLabel: string;
  supportsThinkingBudget: boolean;
  value: number;
  onChange: (nextValue: number) => void;
  label?: string;
  className?: string;
  labelClassName?: string;
  helpClassName?: string;
  inputClassName?: string;
  supportedHint?: string;
  unsupportedHint?: string;
}

export const ThinkingBudgetControl: React.FC<ThinkingBudgetControlProps> = ({
  providerLabel,
  supportsThinkingBudget,
  value,
  onChange,
  label = 'Thinking Budget',
  className = '',
  labelClassName = 'mb-2 flex items-center osint-meta-label',
  helpClassName = 'mt-2 osint-body-quiet',
  inputClassName = 'w-full accent-[var(--osint-primary)] disabled:opacity-40',
  supportedHint = 'Controls reasoning budget for compatible models.',
  unsupportedHint,
}) => {
  const effectiveValue = supportsThinkingBudget ? value : 0;

  return (
    <div className={className}>
      <label className={labelClassName}>
        <Brain
          className={`mr-2 h-3 w-3 ${supportsThinkingBudget ? 'text-osint-primary' : 'text-zinc-600'}`}
        />
        {label} ({effectiveValue})
      </label>
      <input
        type="range"
        min={0}
        max={8192}
        step={512}
        value={effectiveValue}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={!supportsThinkingBudget}
        className={inputClassName}
      />
      <p className={helpClassName}>
        {supportsThinkingBudget
          ? supportedHint
          : unsupportedHint || `${providerLabel} ignores this setting.`}
      </p>
    </div>
  );
};
