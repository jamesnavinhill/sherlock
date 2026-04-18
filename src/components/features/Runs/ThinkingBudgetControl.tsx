import React from 'react';
import { Brain } from 'lucide-react';

import { RangeField } from '@/components/system/controls';

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
    <RangeField
      className={className}
      label={label}
      labelClassName={labelClassName}
      value={effectiveValue}
      min={0}
      max={8192}
      step={512}
      onChange={onChange}
      disabled={!supportsThinkingBudget}
      inputClassName={inputClassName}
      icon={Brain}
      formatValue={(nextValue) => `(${nextValue})`}
      description={
        supportsThinkingBudget
          ? supportedHint
          : unsupportedHint || `${providerLabel} ignores this setting.`
      }
      descriptionClassName={helpClassName}
    />
  );
};
