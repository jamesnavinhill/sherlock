import type { CSSProperties } from 'react';

import { Eyebrow, Heading, MetaValue } from '../typography';

export interface TokenSwatchProps {
  label: string;
  style: CSSProperties;
  readoutValue: string;
  readoutLabel?: string;
}

export function TokenSwatch({
  label,
  style,
  readoutValue,
  readoutLabel = 'oklch',
}: TokenSwatchProps) {
  return (
    <div className="ds-token-swatch">
      <div className="ds-token-swatch-box" style={style} />
      <div className="ds-token-swatch-copy">
        <Heading level="inline" as="span">
          {label}
        </Heading>
        <MetaValue className="ds-token-swatch-readout">{readoutValue}</MetaValue>
        <Eyebrow className="ds-token-swatch-format">{readoutLabel}</Eyebrow>
      </div>
    </div>
  );
}
