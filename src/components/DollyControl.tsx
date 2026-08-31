import type { CSSProperties } from 'react';

type DollyControlProps = {
  t: number;
  distance: number;
  focalLength: number;
  verticalFov: number;
  compensated: boolean;
  onChange: (value: number) => void;
  onInteraction: () => void;
  onToggleCompensation: () => void;
};

export function DollyControl({
  t,
  distance,
  focalLength,
  verticalFov,
  compensated,
  onChange,
  onInteraction,
  onToggleCompensation,
}: DollyControlProps) {
  const sliderStyle = { '--slider-progress': `${t * 100}%` } as CSSProperties;

  return (
    <div className="control-dock-main">
      <div className="control-topline">
        <span className="control-label">Camera position</span>
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
        <div className="landmarks" aria-hidden="true"><span>Far</span><span>Near</span></div>
      </div>

      <div className="control-footer">
        <output className="live-readout" htmlFor="dolly-range" aria-live="polite">
          <span>{distance.toFixed(2)} m</span><i>·</i><span className={compensated ? 'focal-value is-coupled' : 'focal-value'}>{focalLength.toFixed(0)} mm</span><i>·</i><span>{verticalFov.toFixed(1)}°</span>
        </output>
        <button
          type="button"
          className={`dolly-switch ${compensated ? 'is-on' : 'is-off'}`}
          role="switch"
          aria-checked={compensated}
          onClick={onToggleCompensation}
        >
          <span className="switch-label">Dolly Zoom</span>
          <span className="switch-glyph" aria-hidden="true"><i /></span>
          <span className="switch-state">{compensated ? 'On' : 'Off'}</span>
        </button>
      </div>
    </div>
  );
}
