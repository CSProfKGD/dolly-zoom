import type { CSSProperties } from 'react';

type DollyControlProps = {
  t: number;
  compensated: boolean;
  playing: boolean;
  onChange: (value: number) => void;
  onInteraction: () => void;
  onToggleCompensation: () => void;
  onPlay: () => void;
};

export function DollyControl({
  t,
  compensated,
  playing,
  onChange,
  onInteraction,
  onToggleCompensation,
  onPlay,
}: DollyControlProps) {
  const sliderStyle = { '--slider-progress': `${t * 100}%` } as CSSProperties;

  return (
    <div className="control-dock-main">
      <div className="control-topline">
        <span className="control-label">Camera position</span>
      </div>

      <div className="control-row">
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

        <div className="control-actions">
          <button
            type="button"
            className={`autoplay-button ${playing ? 'is-playing' : ''}`}
            aria-label={playing ? 'Stop automatic dolly zoom' : 'Play automatic dolly zoom'}
            onClick={onPlay}
          >
            <span className="autoplay-glyph" aria-hidden="true"><i /></span>
            <span>Auto Play</span>
          </button>
          <button
            type="button"
            className={`dolly-switch ${compensated ? 'is-on' : 'is-off'}`}
            role="switch"
            aria-checked={compensated}
            onClick={onToggleCompensation}
          >
            <span className="switch-label">Dolly Zoom</span>
            <span className="switch-glyph" aria-hidden="true"><i /></span>
          </button>
        </div>
      </div>

    </div>
  );
}
