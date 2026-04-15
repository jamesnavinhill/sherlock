import { FieldRow } from './FieldRow';

export interface RangeFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  description?: string;
}

export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format = (nextValue) => nextValue.toString(),
  description,
}: RangeFieldProps) {
  return (
    <FieldRow label={label} value={format(value)} description={description}>
      <input
        className="ds-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </FieldRow>
  );
}
