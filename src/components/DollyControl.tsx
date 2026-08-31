import type { CSSProperties } from 'react';

type DollyControlProps = {
  t: number;
  compensated: boolean;
  onChange: (value: number) => void;
  onInteraction: () => void;
  onToggleCompensation: () => void;
};

export function DollyControl({ t, compensated, onChange, onInteraction, onToggleCompensation }: DollyControlProps) {
  const sliderStyle = { '--slider-progress': `${t * 100}%` } as CSSProperties;

  return (
    <div className="control-dock-main">
      <div className="control-topline">
        <div>
          <span className="control-label">Dolly ↔ Zoom</span>
          <output className="dolly-readout" htmlFor="dolly-range">
            <span className="t-symbol">t</span>
            <span className="readout-equals">=</span>
            {t.toFixed(2)}
          </output>
        </div>

        <button
          type="button"
          className={`freeze-control ${compensated ? '' : 'is-frozen'}`}
          aria-pressed={!compensated}
          onClick={onToggleCompensation}
        >
          <span className="switch-glyph" aria-hidden="true"><i /></span>
          {compensated ? 'Freeze lens' : 'Resume zoom'}
        </button>
      </div>

      <div className="slider-wrap" style={sliderStyle}>
        <label className="sr-only" htmlFor="dolly-range">Dolly and zoom position from far tele to near wide</label>
        <input
          id="dolly-range"
          type="range"
          min="0"
          max="1000"
          step="1"
          value={Math.round(t * 1000)}
          onPointerDown={onInteraction}
          onKeyDown={onInteraction}
          onChange={(event) => onChange(Number(event.currentTarget.value) / 1000)}
        />
        <div className="landmarks" aria-hidden="true"><span>Far / Tele</span><span>Near / Wide</span></div>
      </div>
    </div>
  );
}
