'use client';

import { useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { horizontalFovFromFocalLength } from '@/src/lib/cameraMath';

export type SlabPose = { x: number; z: number; yaw: number };
export type SubjectPose = { x: number; z: number };

type GeometryViewProps = {
  distance: number;
  focalLength: number;
  stableDepth: number;
  slabs: [SlabPose, SlabPose];
  subject: SubjectPose;
  onSlabChange: (index: number, pose: SlabPose) => void;
  onSubjectChange: (pose: SubjectPose) => void;
  onStableDepthChange: (depth: number) => void;
};

const AXIS_Y = 132;
const SUBJECT_X = 420;
const BACKGROUND_X = 738;
const BACKGROUND_DEPTH = 10.5;
const WORLD_TO_Y = 24;
const WORLD_TO_X = (BACKGROUND_X - SUBJECT_X) / BACKGROUND_DEPTH;
const SLAB_WIDTHS = [2.35, 1.72] as const;
const SLAB_DEPTHS = SLAB_WIDTHS;
const FAR_DISTANCE = 6;
const NEAR_DISTANCE = 2;
const MIN_STABLE_DEPTH = -4;
const MAX_STABLE_DEPTH = 1.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function n(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0';
}

function diagramX(z: number): number { return SUBJECT_X - z * WORLD_TO_X; }
function diagramY(x: number): number { return AXIS_Y - x * WORLD_TO_Y; }

function slabFootprint(pose: SlabPose, index: number): string {
  const halfWidth = SLAB_WIDTHS[index] / 2;
  const halfDepth = SLAB_DEPTHS[index] / 2;
  const cos = Math.cos(pose.yaw);
  const sin = Math.sin(pose.yaw);
  return [[-halfWidth, -halfDepth], [halfWidth, -halfDepth], [halfWidth, halfDepth], [-halfWidth, halfDepth]]
    .map(([localX, localZ]) => {
      const worldX = pose.x + localX * cos + localZ * sin;
      const worldZ = pose.z - localX * sin + localZ * cos;
      return `${n(diagramX(worldZ))},${n(diagramY(worldX))}`;
    }).join(' ');
}

export function GeometryView({ distance, focalLength, stableDepth, slabs, subject, onSlabChange, onSubjectChange, onStableDepthChange }: GeometryViewProps) {
  const drag = useRef<{ index: number; mode: 'move' | 'rotate'; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const draggingSubject = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const draggingStableDepth = useRef(false);
  const travel = (FAR_DISTANCE - distance) / (FAR_DISTANCE - NEAR_DISTANCE);
  const subjectX = diagramX(subject.z);
  const subjectY = diagramY(subject.x);
  const stableX = diagramX(stableDepth);
  const cameraX = 92 + travel * 218;
  const halfAngle = horizontalFovFromFocalLength(focalLength) * Math.PI / 360;
  const backgroundDistance = distance + BACKGROUND_DEPTH;
  const frustumHalfHeight = Math.tan(halfAngle) * backgroundDistance * WORLD_TO_Y;

  const toSvgPoint = (event: ReactPointerEvent<SVGGElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * 820 / rect.width,
      y: 24 + (event.clientY - rect.top) * 216 / rect.height,
    };
  };

  const beginSlabDrag = (index: number, event: ReactPointerEvent<SVGGElement>) => {
    event.preventDefault();
    if (Number.isFinite(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    const point = toSvgPoint(event);
    drag.current = {
      index,
      mode: event.buttons === 3 ? 'rotate' : 'move',
      x: event.clientX,
      y: event.clientY,
      offsetX: diagramX(slabs[index].z) - point.x,
      offsetY: diagramY(slabs[index].x) - point.y,
    };
  };

  const detectRotationChord = (index: number, event: ReactMouseEvent<SVGGElement>) => {
    if ((event.buttons & 3) !== 3) return;
    event.preventDefault();
    const active = drag.current;
    if (active?.index === index) active.mode = 'rotate';
    else drag.current = { index, mode: 'rotate', x: event.clientX, y: event.clientY, offsetX: 0, offsetY: 0 };
  };

  const moveSlab = (index: number, event: ReactPointerEvent<SVGGElement>) => {
    const active = drag.current;
    if (!active || active.index !== index) return;
    const pose = slabs[index];
    if (event.buttons === 3 || active.mode === 'rotate') {
      active.mode = 'rotate';
      onSlabChange(index, { ...pose, yaw: pose.yaw + (event.clientX - active.x) * 0.014 });
    } else {
      const point = toSvgPoint(event);
      onSlabChange(index, {
        ...pose,
        x: clamp((AXIS_Y - (point.y + active.offsetY)) / WORLD_TO_Y, -4.2, 4.2),
        z: clamp((SUBJECT_X - (point.x + active.offsetX)) / WORLD_TO_X, -10.5, 10.5),
      });
    }
    drag.current = { ...active, x: event.clientX, y: event.clientY };
  };

  const moveSubject = (event: ReactPointerEvent<SVGGElement>) => {
    const active = draggingSubject.current;
    if (!active) return;
    const point = toSvgPoint(event);
    onSubjectChange({
      x: clamp((AXIS_Y - (point.y + active.offsetY)) / WORLD_TO_Y, -3.2, 3.2),
      z: clamp((SUBJECT_X - (point.x + active.offsetX)) / WORLD_TO_X, -8.5, 1.5),
    });
  };

  const moveStableDepth = (event: ReactPointerEvent<SVGGElement>) => {
    if (!draggingStableDepth.current) return;
    const point = toSvgPoint(event);
    onStableDepthChange(clamp((SUBJECT_X - point.x) / WORLD_TO_X, MIN_STABLE_DEPTH, MAX_STABLE_DEPTH));
  };

  return (
    <div className="geometry-view">
      <svg viewBox="0 24 820 216" role="img" aria-labelledby="geometry-title geometry-desc" preserveAspectRatio="xMidYMid meet" onContextMenu={(event) => event.preventDefault()}>
        <title id="geometry-title">Top-down dolly zoom geometry</title>
        <desc id="geometry-desc">A cyan camera moves on a horizontal optical axis. Its two frustum boundaries pass the gold subject and two movable, rotated cubes.</desc>

        <path className="frustum-fill" d={`M ${n(cameraX)} ${AXIS_Y} L ${BACKGROUND_X} ${n(AXIS_Y - frustumHalfHeight)} L ${BACKGROUND_X} ${n(AXIS_Y + frustumHalfHeight)} Z`} />
        <line className="frustum-line" x1={cameraX} y1={AXIS_Y} x2={BACKGROUND_X} y2={AXIS_Y - frustumHalfHeight} />
        <line className="frustum-line" x1={cameraX} y1={AXIS_Y} x2={BACKGROUND_X} y2={AXIS_Y + frustumHalfHeight} />

        <g className="diagram-camera" transform={`translate(${n(cameraX)} ${AXIS_Y})`}>
          <rect x="-34" y="-11" width="28" height="22" rx="2" />
          <line className="sensor-plane" x1="-4" y1="-8" x2="-4" y2="8" />
          <path d="M-6 -7 L-1 -4 L-1 4 L-6 7 Z" />
          <line className="projection-link" x1="-1" y1="0" x2="0" y2="0" />
        </g>
        <text className="focal-label" x={cameraX} y={AXIS_Y - 31} textAnchor="middle">f = {focalLength.toFixed(1)} mm</text>

        <g
          className="stability-plane-control"
          role="slider"
          tabIndex={0}
          aria-label="Depth plane whose projected pixels remain stable"
          aria-valuemin={MIN_STABLE_DEPTH}
          aria-valuemax={MAX_STABLE_DEPTH}
          aria-valuenow={Number(stableDepth.toFixed(2))}
          onPointerDown={(event) => {
            event.preventDefault();
            if (Number.isFinite(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
            draggingStableDepth.current = true;
          }}
          onPointerMove={moveStableDepth}
          onPointerUp={() => { draggingStableDepth.current = false; }}
          onPointerCancel={() => { draggingStableDepth.current = false; }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') onStableDepthChange(clamp(stableDepth + 0.1, MIN_STABLE_DEPTH, MAX_STABLE_DEPTH));
            if (event.key === 'ArrowRight') onStableDepthChange(clamp(stableDepth - 0.1, MIN_STABLE_DEPTH, MAX_STABLE_DEPTH));
            if (event.key === 'Home') onStableDepthChange(MAX_STABLE_DEPTH);
            if (event.key === 'End') onStableDepthChange(MIN_STABLE_DEPTH);
          }}
        >
          <line className="stability-plane-hit" x1={stableX} y1="28" x2={stableX} y2="226" />
          <line className="stability-plane-line" x1={stableX} y1="28" x2={stableX} y2="226" />
          <circle className="stability-plane-handle" cx={stableX} cy="28" r="3.5" />
        </g>

        <g
          className="subject-control"
          role="button"
          tabIndex={0}
          aria-label="Golden subject. Drag to translate it on the floor plane."
          onPointerDown={(event) => {
            event.preventDefault();
            if (Number.isFinite(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
            const point = toSvgPoint(event);
            draggingSubject.current = { offsetX: subjectX - point.x, offsetY: subjectY - point.y };
          }}
          onPointerMove={moveSubject}
          onPointerUp={() => { draggingSubject.current = null; }}
          onPointerCancel={() => { draggingSubject.current = null; }}
        >
          <circle className="subject-hit" cx={subjectX} cy={subjectY} r="32" />
          <circle className="subject-shape" cx={subjectX} cy={subjectY} r="18" />
        </g>
        {slabs.map((slab, index) => (
          <g
            key={index}
            className="slab-control"
            role="button"
            tabIndex={0}
            aria-label={`${index === 0 ? 'Teal' : 'Purple'} cube. Drag to move; hold both mouse buttons while dragging to rotate.`}
            onPointerDown={(event) => beginSlabDrag(index, event)}
            onMouseDown={(event) => detectRotationChord(index, event)}
            onPointerMove={(event) => moveSlab(index, event)}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
          >
            <polygon className="slab-hit" points={slabFootprint(slab, index)} />
            <polygon className={`background-object-svg slab-${index}`} points={slabFootprint(slab, index)} />
          </g>
        ))}

        <line className="distance-line" x1={cameraX} y1="198" x2={stableX} y2="198" />
        <line className="distance-tick" x1={cameraX} y1="193" x2={cameraX} y2="203" />
        <line className="distance-tick" x1={stableX} y1="193" x2={stableX} y2="203" />
        <text className="distance-label" x={stableX - 4} y="220" textAnchor="end">Z = {(distance - stableDepth).toFixed(2)} m</text>

      </svg>
    </div>
  );
}
