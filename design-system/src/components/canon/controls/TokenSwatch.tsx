import type { CSSProperties } from 'react';

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
        <span className="ds-title-inline">{label}</span>
        <span className="ds-meta-value ds-token-swatch-readout">{readoutValue}</span>
        <span className="ds-meta-label ds-token-swatch-format">{readoutLabel}</span>
      </div>
    </div>
  );
}
