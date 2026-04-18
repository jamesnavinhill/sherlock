import React from 'react';
import { Calendar } from 'lucide-react';

import { FieldRow } from './FieldRow';
import { PopupSurface } from './PopupSurface';

interface DateRangeValue {
  start?: string;
  end?: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (nextValue: DateRangeValue) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  startLabel?: string;
  endLabel?: string;
  className?: string;
  fieldsClassName?: string;
  inputClassName?: string;
  triggerClassName?: string;
  popupClassName?: string;
  toolbarTrigger?: boolean;
  placeholder?: string;
  applyLabel?: string;
  clearLabel?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const normalizeDateRange = (value: DateRangeValue): DateRangeValue => ({
  start: value.start || undefined,
  end: value.end || undefined,
});

const buildDateRangeSummary = (value: DateRangeValue, placeholder: string) => {
  const start = value.start?.trim();
  const end = value.end?.trim();

  if (!start && !end) return placeholder;
  if (start && end) return `${start} - ${end}`;
  if (start) return `${start} - Now`;
  return `Until ${end}`;
};

const renderDateInput = (
  id: 'start' | 'end',
  label: string,
  value: string,
  onChange: (nextValue: string | undefined) => void,
  inputClassName?: string
) => (
  <label className="grid gap-2">
    <span className="osint-meta-label">{label}</span>
    <input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value || undefined)}
      onClick={(event) => event.currentTarget.showPicker?.()}
      className={cx('osint-input-field px-3 py-2 osint-meta-value', inputClassName)}
      data-date-range-field={id}
    />
  </label>
);

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  label,
  description,
  startLabel = 'From',
  endLabel = 'To',
  className,
  fieldsClassName,
  inputClassName,
  triggerClassName,
  popupClassName,
  toolbarTrigger = false,
  placeholder = 'Time Range',
  applyLabel = 'Apply',
  clearLabel = 'Clear',
  isOpen,
  onOpenChange,
  onApply,
}) => {
  const normalizedValue = normalizeDateRange(value);
  const summary = buildDateRangeSummary(normalizedValue, placeholder);
  const isPopup = typeof isOpen === 'boolean' && typeof onOpenChange === 'function';

  const updatePart = (key: keyof DateRangeValue, nextValue: string | undefined) => {
    onChange(
      normalizeDateRange({
        ...normalizedValue,
        [key]: nextValue,
      })
    );
  };

  const fields = (
    <div className={cx('grid gap-3 sm:grid-cols-2', fieldsClassName)}>
      {renderDateInput('start', startLabel, normalizedValue.start || '', (nextValue) => updatePart('start', nextValue), inputClassName)}
      {renderDateInput('end', endLabel, normalizedValue.end || '', (nextValue) => updatePart('end', nextValue), inputClassName)}
    </div>
  );

  if (!isPopup) {
    if (label || description) {
      return (
        <FieldRow
          className={className}
          label={label || 'Date Range'}
          value={summary}
          description={description}
        >
          {fields}
        </FieldRow>
      );
    }

    return <div className={className}>{fields}</div>;
  }

  return (
    <div className={cx('relative', className)}>
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cx(
          toolbarTrigger
            ? 'osint-button-chrome osint-meta-label flex items-center truncate px-2'
            : 'osint-input-field flex w-full items-center justify-between gap-3 px-3 py-2 osint-meta-value',
          triggerClassName
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <Calendar className="h-3 w-3 shrink-0 text-zinc-300" />
          <span className="truncate">{summary}</span>
        </span>
      </button>

      {isOpen ? (
        <PopupSurface
          role="dialog"
          aria-label={typeof label === 'string' ? label : 'Date range'}
          className={cx('absolute left-0 top-full z-50 mt-2 w-72 p-4', popupClassName)}
        >
          <FieldRow
            label={label || 'Date Range'}
            value={summary}
            description={description}
            className="gap-4"
          >
            <div className="grid gap-4">
              {fields}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onChange({})}
                  className="osint-ghost-button px-2 py-1 osint-meta-label"
                >
                  {clearLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApply?.();
                    onOpenChange(false);
                  }}
                  className="osint-button-primary px-3 py-1.5 osint-meta-label-strong"
                >
                  {applyLabel}
                </button>
              </div>
            </div>
          </FieldRow>
        </PopupSurface>
      ) : null}
    </div>
  );
};
