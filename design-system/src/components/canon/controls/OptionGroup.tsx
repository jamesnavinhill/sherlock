import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { Eyebrow, Heading, Text } from '../typography';
import { cx } from '../utils/cx';

export interface OptionGroupOption {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export type OptionGroupSelectionMode = 'single' | 'multiple';

export interface OptionGroupBaseProps {
  label?: string;
  options: ReadonlyArray<OptionGroupOption>;
  className?: string;
  columns?: 1 | 2;
}

export interface SingleOptionGroupProps extends OptionGroupBaseProps {
  selectionMode?: 'single';
  value: string;
  onChange: (value: string) => void;
}

export interface MultipleOptionGroupProps extends OptionGroupBaseProps {
  selectionMode: 'multiple';
  value: string[];
  onChange: (value: string[]) => void;
}

export type OptionGroupProps = SingleOptionGroupProps | MultipleOptionGroupProps;

export function OptionGroup(props: OptionGroupProps) {
  const { label, options, className, columns = 2 } = props;
  const selectedValues = props.selectionMode === 'multiple' ? props.value : [props.value];

  return (
    <div className={cx('ds-field-row', className)}>
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      <div
        className={cx('ds-option-group', columns === 1 && 'ds-option-group-single-column')}
        role={props.selectionMode === 'multiple' ? 'group' : 'radiogroup'}
      >
        {options.map((option) => {
          const selected = selectedValues.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              role={props.selectionMode === 'multiple' ? 'checkbox' : 'radio'}
              className="ds-option-card"
              data-active={selected ? 'true' : undefined}
              disabled={option.disabled}
              aria-checked={selected}
              onClick={() => {
                if (option.disabled) {
                  return;
                }

                if (props.selectionMode === 'multiple') {
                  props.onChange(
                    selected
                      ? props.value.filter((value) => value !== option.id)
                      : [...props.value, option.id]
                  );
                  return;
                }

                props.onChange(option.id);
              }}
            >
              <span className="ds-option-card-leading">
                <span className="ds-option-card-icon">{option.icon}</span>
                <span className="ds-option-card-check">
                  {selected ? <Check size={14} strokeWidth={2.4} /> : null}
                </span>
              </span>
              <span className="ds-option-card-stack">
                <Heading level="inline" as="span" className="ds-option-card-title">
                  {option.label}
                </Heading>
                {option.description ? (
                  <Text as="span" className="ds-option-card-description" variant="quiet">
                    {option.description}
                  </Text>
                ) : null}
              </span>
              {option.meta ? <span className="ds-option-card-meta">{option.meta}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
