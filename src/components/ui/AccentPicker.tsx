import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildAccentColor } from '../../utils/accent';

interface AccentPickerProps {
  hue: number;
  lightness: number;
  chroma: number;
  onChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
  containerClassName?: string;
  previewLabel?: string;
  showPreview?: boolean;
  lightnessMin?: number;
  lightnessMax?: number;
  chromaMax?: number;
}

export const AccentPicker: React.FC<AccentPickerProps> = ({
  hue,
  lightness,
  chroma,
  onChange,
  containerClassName,
  previewLabel = 'Custom Accent',
  showPreview = true,
  lightnessMin = 0.5,
  lightnessMax = 0.95,
  chromaMax = 0.3,
}) => {
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const hueRef = useRef<HTMLDivElement | null>(null);
  const clampedLightness = Math.min(lightnessMax, Math.max(lightnessMin, lightness));
  const clampedChroma = Math.min(chromaMax, Math.max(0, chroma));
  const lightnessSpan = Math.max(0.01, lightnessMax - lightnessMin);

  const oklchColor = useMemo(
    () => buildAccentColor({ hue, lightness: clampedLightness, chroma: clampedChroma }),
    [hue, clampedLightness, clampedChroma]
  );

  const huePercent = (hue / 360) * 100;
  const lightnessPercent = ((clampedLightness - lightnessMin) / lightnessSpan) * 100;
  const chromaPercent = (clampedChroma / chromaMax) * 100;

  useEffect(() => {
    if (!isDraggingHue) return;
    const el = hueRef.current;
    if (!el) return;

      const handleMove = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        const newHue = Math.round(pct * 360);
      onChange({ hue: newHue, lightness: clampedLightness, chroma: clampedChroma });
    };

    const handleUp = () => setIsDraggingHue(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDraggingHue, clampedLightness, clampedChroma, onChange]);

  const hueTrackGradient =
    'linear-gradient(90deg,' +
    ' oklch(0.75 0.15 0) 0%,' +
    ' oklch(0.75 0.15 60) 16.6%,' +
    ' oklch(0.75 0.15 120) 33.3%,' +
    ' oklch(0.75 0.15 180) 50%,' +
    ' oklch(0.75 0.15 240) 66.6%,' +
    ' oklch(0.75 0.15 300) 83.3%,' +
    ' oklch(0.75 0.15 360) 100% )';

  return (
    <div className={containerClassName ?? 'space-y-4'}>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono uppercase">
          <span>Hue</span>
          <span className="font-mono text-zinc-300">{hue}°</span>
        </div>
        <div ref={hueRef} className="relative h-8 rounded-full overflow-hidden border border-zinc-700">
          <div className="absolute inset-0 rounded-full" style={{ background: hueTrackGradient }} />
          <input
            type="range"
            min={0}
            max={360}
            value={hue}
            onChange={(event) => onChange({ hue: parseInt(event.target.value, 10), lightness: clampedLightness, chroma: clampedChroma })}
            title="Adjust hue"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button
            aria-label="Hue thumb"
            onPointerDown={(event) => {
              event.preventDefault();
              setIsDraggingHue(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                onChange({ hue: (hue + 1) % 360, lightness: clampedLightness, chroma: clampedChroma });
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                onChange({ hue: (hue - 1 + 360) % 360, lightness: clampedLightness, chroma: clampedChroma });
              }
            }}
            className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg transition-transform duration-150 focus:outline-none ${
              isDraggingHue ? 'scale-105 ring-2 ring-white/40' : 'hover:scale-105'
            }`}
            style={{ left: `calc(${huePercent}% - 12px)`, background: oklchColor }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono uppercase">
          <span>Lightness</span>
          <span className="font-mono text-zinc-300">{clampedLightness.toFixed(2)}</span>
        </div>
        <div className="relative">
          <div
            className="h-2 rounded-full"
            style={{
              background: `linear-gradient(90deg, oklch(${lightnessMin} ${clampedChroma} ${hue}) 0%, oklch(${lightnessMax} ${clampedChroma} ${hue}) 100%)`,
            }}
          />
          <input
            type="range"
            min={lightnessMin}
            max={lightnessMax}
            step={0.01}
            value={clampedLightness}
            onChange={(event) => onChange({ hue, lightness: parseFloat(event.target.value), chroma: clampedChroma })}
            title="Adjust lightness"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
            style={{ left: `calc(${lightnessPercent}% - 8px)`, background: oklchColor }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono uppercase">
          <span>Chroma</span>
          <span className="font-mono text-zinc-300">{clampedChroma.toFixed(2)}</span>
        </div>
        <div className="relative">
          <div
            className="h-2 rounded-full"
            style={{
              background: `linear-gradient(90deg, oklch(${clampedLightness} 0 ${hue}) 0%, oklch(${clampedLightness} ${chromaMax} ${hue}) 100%)`,
            }}
          />
          <input
            type="range"
            min={0}
            max={chromaMax}
            step={0.01}
            value={clampedChroma}
            onChange={(event) => onChange({ hue, lightness: clampedLightness, chroma: parseFloat(event.target.value) })}
            title="Adjust chroma"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
            style={{ left: `calc(${chromaPercent}% - 8px)`, background: oklchColor }}
          />
        </div>
      </div>

      {showPreview && (
        <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
          <div className="w-10 h-10 rounded-xl border border-zinc-700 shadow-[0_0_12px_rgba(255,255,255,0.1)]" style={{ background: oklchColor }} />
          <div className="flex-1">
            <div className="text-sm font-bold text-white font-mono uppercase">{previewLabel}</div>
            <div className="text-[10px] text-zinc-500 font-mono">oklch({clampedLightness.toFixed(2)} {clampedChroma.toFixed(2)} {hue})</div>
          </div>
        </div>
      )}
    </div>
  );
};
