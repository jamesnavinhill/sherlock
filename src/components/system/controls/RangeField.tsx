import React from 'react';
import type { LucideIcon } from 'lucide-react';

import { FieldRow } from './FieldRow';

interface RangeFieldProps {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (nextValue: number) => void;
  description?: React.ReactNode;
  formatValue?: (value: number) => React.ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  descriptionClassName?: string;
  inputClassName?: string;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const RangeField: React.FC<RangeFieldProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  description,
  formatValue,
  icon: Icon,
  disabled = false,
  className,
  labelClassName,
  valueClassName,
  descriptionClassName,
  inputClassName,
}) => (
  <FieldRow
    className={className}
    label={
      <span className={cx('inline-flex items-center gap-2', labelClassName)}>
        {Icon ? <Icon className="h-3 w-3 text-osint-primary" /> : null}
        <span>{label}</span>
      </span>
    }
    value={formatValue ? formatValue(value) : value}
    valueClassName={valueClassName}
    description={description}
    descriptionClassName={descriptionClassName}
  >
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      disabled={disabled}
      className={cx('osint-range-field', disabled && 'opacity-40', inputClassName)}
    />
  </FieldRow>
);
