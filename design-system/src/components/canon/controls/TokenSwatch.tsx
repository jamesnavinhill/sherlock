import type { CSSProperties } from 'react';

export interface TokenSwatchProps {
  label: string;
  style: CSSProperties;
  meta: string;
}

export function TokenSwatch({ label, style, meta }: TokenSwatchProps) {
  return (
    <div className="ds-token-swatch">
      <div className="ds-token-swatch-box" style={style} />
      <div className="ds-token-swatch-copy">
        <span className="ds-title-inline">{label}</span>
        <span className="ds-body-quiet">{meta}</span>
      </div>
    </div>
  );
}
