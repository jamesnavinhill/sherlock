import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { Eyebrow, Heading } from '../typography';
import { Button, type ButtonVariant } from './Button';
import { IconButton } from './IconButton';
import { PopupSurface } from './PopupSurface';
import { useDismissableLayer } from '../utils/useDismissableLayer';
import { cx } from '../utils/cx';

export interface DateRangeValue {
  start: string | null;
  end: string | null;
}

export interface DateRangePreset {
  id: string;
  label: string;
  range: DateRangeValue;
}

export interface DateRangePickerProps {
  label?: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  presets?: DateRangePreset[];
  align?: 'start' | 'end';
  layout?: 'field' | 'inline';
  triggerVariant?: Extract<ButtonVariant, 'secondary' | 'toolbar' | 'icon'>;
  triggerLabel?: string;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

const buildMonthDays = (month: Date) => {
  const firstDay = startOfMonth(month);
  const startWeekday = firstDay.getDay();
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return {
      key: toDateKey(day),
      date: day,
      inMonth: day.getMonth() === month.getMonth(),
    };
  });
};

const buildSelectionLabel = (value: DateRangeValue) => {
  if (!value.start) {
    return 'Select range';
  }

  if (!value.end || value.start === value.end) {
    return dateFormatter.format(parseDateKey(value.start));
  }

  return `${dateFormatter.format(parseDateKey(value.start))} to ${dateFormatter.format(parseDateKey(value.end))}`;
};

const getInitialMonth = (value: DateRangeValue) =>
  startOfMonth(value.start ? parseDateKey(value.start) : new Date());

const selectDay = (current: DateRangeValue, nextDay: string): DateRangeValue => {
  if (!current.start || current.end) {
    return { start: nextDay, end: null };
  }

  if (nextDay < current.start) {
    return { start: nextDay, end: current.start };
  }

  return { start: current.start, end: nextDay };
};

const dateRangeEquals = (left: DateRangeValue, right: DateRangeValue) =>
  left.start === right.start && left.end === right.end;

export function DateRangePicker({
  label,
  value,
  onChange,
  presets = [],
  align = 'start',
  layout = 'field',
  triggerVariant = 'secondary',
  triggerLabel,
  className,
  triggerClassName,
  panelClassName,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(value);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(value));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  const close = () => {
    setDraft(value);
    setVisibleMonth(getInitialMonth(value));
    setOpen(false);
  };

  useDismissableLayer(open, rootRef, close);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(value);
    setVisibleMonth(getInitialMonth(value));
  }, [open, value]);

  const calendarMonths = useMemo(
    () => [visibleMonth, addMonths(visibleMonth, 1)],
    [visibleMonth]
  );
  const todayKey = toDateKey(new Date());
  const selectionLabel = buildSelectionLabel(value);
  const draftLabel = buildSelectionLabel(draft);
  const hasDraftSelection = Boolean(draft.start || draft.end);
  const canApplyDraft = !dateRangeEquals(draft, value);
  const showFieldLabel = layout === 'field' && Boolean(label);
  const showSelectionLabel = triggerVariant !== 'icon';
  const iconTriggerLabel = `${triggerLabel ?? 'Date range'}: ${selectionLabel}`;

  return (
    <div
      className={cx(
        layout === 'field' ? 'ds-select-wrap' : 'ds-menu-wrap',
        'ds-date-range-wrap',
        className
      )}
      ref={rootRef}
    >
      {showFieldLabel ? <Eyebrow>{label}</Eyebrow> : null}
      <Button
        variant={triggerVariant}
        className={cx(
          'ds-date-range-trigger',
          layout === 'field' ? 'ds-date-range-trigger-block' : 'ds-date-range-trigger-inline',
          triggerClassName
        )}
        leadingIcon={<CalendarDays size={14} />}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        aria-label={!showSelectionLabel ? iconTriggerLabel : undefined}
        title={!showSelectionLabel ? iconTriggerLabel : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {showSelectionLabel ? (
          <span className="ds-date-range-trigger-label">{selectionLabel}</span>
        ) : null}
      </Button>

      {open ? (
        <PopupSurface
          id={panelId}
          className={cx('ds-date-range-panel', panelClassName)}
          align={align}
          role="dialog"
          aria-label="Date range"
        >
          <div className="ds-overlay-panel-header ds-date-range-header">
            <div className="ds-overlay-panel-copy ds-date-range-copy">
              <Eyebrow>Date Range</Eyebrow>
              <Heading level="inline" as="span">
                {draftLabel}
              </Heading>
            </div>
            <div className="ds-overlay-panel-actions">
              <IconButton
                appearance="ghost"
                label="Close date range picker"
                icon={<X size={18} strokeWidth={2.5} />}
                onClick={close}
              />
            </div>
          </div>

          <div className="ds-overlay-panel-body ds-date-range-body">
            <div className="ds-date-range-controls">
              {presets.length ? (
                <div className="ds-date-range-presets">
                  {presets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="secondary"
                      size="compact"
                      onClick={() => setDraft(preset.range)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="ds-overlay-panel-actions ds-date-range-nav">
                <IconButton
                  appearance="ghost"
                  label="Previous month"
                  icon={<ChevronLeft size={16} />}
                  onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                />
                <IconButton
                  appearance="ghost"
                  label="Next month"
                  icon={<ChevronRight size={16} />}
                  onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                />
              </div>
            </div>

            <div className="ds-date-range-calendars">
              {calendarMonths.map((month) => {
                const days = buildMonthDays(month);

                return (
                  <div key={month.toISOString()} className="ds-date-calendar">
                    <div className="ds-date-calendar-month">{monthFormatter.format(month)}</div>
                    <div className="ds-date-calendar-weekdays">
                      {WEEKDAY_LABELS.map((weekday) => (
                        <span key={weekday} className="ds-date-calendar-weekday">
                          {weekday}
                        </span>
                      ))}
                    </div>
                    <div className="ds-date-calendar-grid">
                      {days.map((day) => {
                        const isSelectedStart = draft.start === day.key;
                        const isSelectedEnd = draft.end === day.key;
                        const hasRange = Boolean(draft.start && draft.end);
                        const inRange =
                          hasRange &&
                          draft.start !== null &&
                          draft.end !== null &&
                          day.key >= draft.start &&
                          day.key <= draft.end;

                        return (
                          <button
                            key={day.key}
                            type="button"
                            className="ds-date-calendar-day"
                            data-in-month={day.inMonth ? 'true' : 'false'}
                            data-selected={isSelectedStart || isSelectedEnd ? 'true' : undefined}
                            data-in-range={inRange ? 'true' : undefined}
                            data-today={day.key === todayKey ? 'true' : undefined}
                            onClick={() => setDraft((current) => selectDay(current, day.key))}
                          >
                            {day.date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <footer className="ds-overlay-panel-footer ds-date-range-footer">
            <Button
              variant="ghost"
              disabled={!hasDraftSelection}
              onClick={() => {
                setDraft({ start: null, end: null });
              }}
            >
              Clear
            </Button>
            <div className="ds-overlay-panel-actions">
              <Button
                variant="secondary"
                size="compact"
                disabled={!canApplyDraft}
                onClick={() => {
                  onChange({
                    start: draft.start,
                    end: draft.start ? draft.end ?? draft.start : null,
                  });
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </footer>
        </PopupSurface>
      ) : null}
    </div>
  );
}
