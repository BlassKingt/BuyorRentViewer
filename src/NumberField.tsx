import { useId } from 'react';

interface Props {
  label: string; value: number | null; unit: string;
  min?: number; max: number; step?: number; scale?: number; hint?: string;
  onChange: (value: number) => void;
  onBegin: () => void;
  onValidity: (valid: boolean) => void;
  draft?: string;
  onDraftChange: (draft: string) => void;
}

export function NumberField({ label, value, unit, min = 0, max, step = 1, scale = 1, hint,
  onChange, onBegin, onValidity, draft, onDraftChange }: Props) {
  const id = useId();
  const shown = value === null ? '' : String(Number((value / scale).toFixed(6)));
  const rangeMax = Math.max(max, value === null ? max : value / scale);
  const rangeValue = Math.max(min, Math.min(rangeMax, (value ?? min * scale) / scale));
  const progress = (rangeValue - min) / (rangeMax - min || 1) * 100;
  return <div className="hc-field">
    <div className="hc-field-top">
      <label htmlFor={id}>{label}</label>
      <div className="hc-number-wrap">
        <input id={id} type="number" inputMode="decimal" step="any" value={draft ?? shown}
          placeholder="请填写" min={min} aria-describedby={hint ? `${id}-hint` : undefined}
          onFocus={onBegin} onChange={e => {
            onDraftChange(e.target.value);
            const parsed = Number(e.target.value);
            const valid = e.target.value.trim() !== '' && Number.isFinite(parsed);
            onValidity(valid);
            if (valid) onChange(parsed * scale);
          }} />
        <span>{unit}</span>
      </div>
    </div>
    <input className="hc-range" aria-label={`${label}滑块`} type="range" min={min}
      max={rangeMax} step={step} value={rangeValue}
      style={{ '--range-progress': `${progress}%` } as React.CSSProperties}
      onPointerDown={onBegin} onKeyDown={e => { if (!e.repeat) onBegin(); }}
      onChange={e => {
        const next = Number(e.target.value);
        onDraftChange(String(next)); onValidity(true); onChange(next * scale);
      }} />
    {hint && <p className="hc-field-hint" id={`${id}-hint`}>{hint}</p>}
  </div>;
}
