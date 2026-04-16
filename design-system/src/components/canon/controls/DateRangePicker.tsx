import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from './Button';
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
  className?: string;
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

export function DateRangePicker({
  label,
  value,
  onChange,
  presets = [],
  align = 'start',
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(value);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(value));
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className={cx('ds-select-wrap', className)} ref={rootRef}>
      {label ? <span className="ds-meta-label">{label}</span> : null}
      <Button
        variant="secondary"
        className="ds-date-range-trigger"
        leadingIcon={<CalendarDays size={14} />}
        trailingIcon={null}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="ds-date-range-trigger-label">{selectionLabel}</span>
      </Button>

      {open ? (
        <PopupSurface className="ds-date-range-panel" align={align} role="dialog">
          <div className="ds-date-range-header">
            <div className="ds-date-range-copy">
              <span className="ds-meta-label">Date Range</span>
              <span className="ds-title-inline">{draftLabel}</span>
            </div>
            <div className="ds-date-range-nav">
              <Button
                variant="ghost"
                aria-label="Previous month"
                leadingIcon={<ChevronLeft size={14} />}
                onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              />
              <Button
                variant="ghost"
                aria-label="Next month"
                leadingIcon={<ChevronRight size={14} />}
                onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              />
            </div>
          </div>

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

          <div className="ds-date-range-footer">
            <div className="ds-body-quiet">
              {draft.start
                ? draft.end
                  ? 'Apply the selected range to update filters and saved views.'
                  : 'Choose an end date to complete the range.'
                : 'Pick a start date to begin the range.'}
            </div>
            <div className="ds-overlay-actions">
              <Button
                variant="ghost"
                onClick={() => {
                  onChange({ start: null, end: null });
                  setDraft({ start: null, end: null });
                  setOpen(false);
                }}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                disabled={!draft.start}
                onClick={() => {
                  onChange({
                    start: draft.start,
                    end: draft.end ?? draft.start,
                  });
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopupSurface>
      ) : null}
    </div>
  );
}
