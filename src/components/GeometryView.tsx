'use client';

import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { horizontalFovFromFocalLength } from '@/src/lib/cameraMath';

export type SlabPose = { x: number; z: number; yaw: number };
export type SubjectPose = { x: number; z: number };

type GeometryViewProps = {
  distance: number;
  focalLength: number;
  slabs: [SlabPose, SlabPose];
  subject: SubjectPose;
  onSlabChange: (index: number, pose: SlabPose) => void;
  onSubjectChange: (pose: SubjectPose) => void;
};

const AXIS_Y = 132;
const SUBJECT_X = 420;
const BACKGROUND_X = 738;
const BACKGROUND_DEPTH = 10.5;
const WORLD_TO_Y = 7.8;
const WORLD_TO_X = (BACKGROUND_X - SUBJECT_X) / BACKGROUND_DEPTH;
const SUBJECT_RADIUS_WORLD = 0.85;
const SLAB_WIDTH = 1.35;
const SLAB_DEPTH = 0.55;
const FAR_DISTANCE = 100 / 6;
const NEAR_DISTANCE = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function n(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0';
}

function diagramX(z: number): number { return SUBJECT_X - z * WORLD_TO_X; }
function diagramY(x: number): number { return AXIS_Y - x * WORLD_TO_Y; }

function slabFootprint(pose: SlabPose): string {
  const halfWidth = SLAB_WIDTH / 2;
  const halfDepth = SLAB_DEPTH / 2;
  const cos = Math.cos(pose.yaw);
  const sin = Math.sin(pose.yaw);
  return [[-halfWidth, -halfDepth], [halfWidth, -halfDepth], [halfWidth, halfDepth], [-halfWidth, halfDepth]]
    .map(([localX, localZ]) => {
      const worldX = pose.x + localX * cos + localZ * sin;
      const worldZ = pose.z - localX * sin + localZ * cos;
      return `${n(diagramX(worldZ))},${n(diagramY(worldX))}`;
    }).join(' ');
}

export function GeometryView({ distance, focalLength, slabs, subject, onSlabChange, onSubjectChange }: GeometryViewProps) {
  const drag = useRef<{ index: number; mode: 'move' | 'rotate'; x: number; y: number } | null>(null);
  const draggingSubject = useRef(false);
  const travel = (FAR_DISTANCE - distance) / (FAR_DISTANCE - NEAR_DISTANCE);
  const subjectX = diagramX(subject.z);
  const subjectY = diagramY(subject.x);
  const cameraX = 92 + travel * 218 + (subjectX - SUBJECT_X);
  const halfAngle = horizontalFovFromFocalLength(focalLength) * Math.PI / 360;
  const backgroundDistance = distance + BACKGROUND_DEPTH;
  const frustumHalfHeight = Math.tan(halfAngle) * backgroundDistance * WORLD_TO_Y;
  const subjectHalfHeight = SUBJECT_RADIUS_WORLD * WORLD_TO_Y;
  const rayHalfHeight = subjectHalfHeight * backgroundDistance / distance;

  const toSvgPoint = (event: ReactPointerEvent<SVGGElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 820 / rect.width, y: (event.clientY - rect.top) * 264 / rect.height };
  };

  const beginSlabDrag = (index: number, event: ReactPointerEvent<SVGGElement>) => {
    event.preventDefault();
    if (Number.isFinite(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { index, mode: event.buttons === 3 ? 'rotate' : 'move', x: event.clientX, y: event.clientY };
  };

  const moveSlab = (index: number, event: ReactPointerEvent<SVGGElement>) => {
    const active = drag.current;
    if (!active || active.index !== index || event.buttons === 0) return;
    const pose = slabs[index];
    if (event.buttons === 3 || active.mode === 'rotate') {
      active.mode = 'rotate';
      onSlabChange(index, { ...pose, yaw: pose.yaw + (event.clientX - active.x) * 0.014 });
    } else {
      const point = toSvgPoint(event);
      onSlabChange(index, {
        ...pose,
        x: clamp((AXIS_Y - point.y) / WORLD_TO_Y, -7, 7),
        z: clamp((SUBJECT_X - point.x) / WORLD_TO_X, -10.5, -3),
      });
    }
    drag.current = { ...active, x: event.clientX, y: event.clientY };
  };

  const moveSubject = (event: ReactPointerEvent<SVGGElement>) => {
    if (!draggingSubject.current || event.buttons === 0) return;
    const point = toSvgPoint(event);
    onSubjectChange({
      x: clamp((AXIS_Y - point.y) / WORLD_TO_Y, -1.5, 1.5),
      z: clamp((SUBJECT_X - point.x) / WORLD_TO_X, -2, 1),
    });
  };

  return (
    <div className="geometry-view">
      <svg viewBox="0 0 820 264" role="img" aria-labelledby="geometry-title geometry-desc" preserveAspectRatio="xMidYMid meet" onContextMenu={(event) => event.preventDefault()}>
        <title id="geometry-title">Top-down dolly zoom geometry</title>
        <desc id="geometry-desc">A cyan camera moves on a horizontal optical axis. Its frustum and subject-edge rays terminate at gray background geometry while the gold subject stays fixed. Background slabs can be moved or rotated.</desc>

        <line className="optical-axis" x1="58" y1={subjectY} x2={BACKGROUND_X} y2={subjectY} />
        <path className="frustum-fill" d={`M ${n(cameraX)} ${n(subjectY)} L ${BACKGROUND_X} ${n(subjectY - frustumHalfHeight)} L ${BACKGROUND_X} ${n(subjectY + frustumHalfHeight)} Z`} />
        <line className="frustum-line" x1={cameraX} y1={subjectY} x2={BACKGROUND_X} y2={subjectY - frustumHalfHeight} />
        <line className="frustum-line" x1={cameraX} y1={subjectY} x2={BACKGROUND_X} y2={subjectY + frustumHalfHeight} />
        <line className="edge-ray" x1={cameraX} y1={subjectY} x2={BACKGROUND_X} y2={subjectY - rayHalfHeight} />
        <line className="edge-ray" x1={cameraX} y1={subjectY} x2={BACKGROUND_X} y2={subjectY + rayHalfHeight} />

        <g className="diagram-camera" transform={`translate(${n(cameraX)} ${n(subjectY)})`}>
          <rect x="-34" y="-11" width="28" height="22" rx="2" />
          <line className="sensor-plane" x1="-4" y1="-8" x2="-4" y2="8" />
          <path d="M-6 -7 L-1 -4 L-1 4 L-6 7 Z" />
          <line className="projection-link" x1="-1" y1="0" x2="0" y2="0" />
        </g>
        <text className="focal-label" x={cameraX} y={subjectY - 27} textAnchor="middle">{focalLength.toFixed(0)} mm</text>

        <g
          className="subject-control"
          role="button"
          tabIndex={0}
          aria-label="Golden subject. Drag to translate it on the floor plane."
          onPointerDown={(event) => {
            event.preventDefault();
            if (Number.isFinite(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
            draggingSubject.current = true;
          }}
          onPointerMove={moveSubject}
          onPointerUp={() => { draggingSubject.current = false; }}
          onPointerCancel={() => { draggingSubject.current = false; }}
        >
          <circle className="subject-hit" cx={subjectX} cy={subjectY} r="28" />
          <circle className="subject-shape" cx={subjectX} cy={subjectY} r="15" />
        </g>
        <line className="background-plane-svg" x1={BACKGROUND_X} y1="33" x2={BACKGROUND_X} y2="231" />

        {slabs.map((slab, index) => (
          <g
            key={index}
            className="slab-control"
            role="button"
            tabIndex={0}
            aria-label={`${index === 0 ? 'Left' : 'Right'} background slab. Drag to move; hold both mouse buttons while dragging to rotate.`}
            onPointerDown={(event) => beginSlabDrag(index, event)}
            onPointerMove={(event) => moveSlab(index, event)}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
          >
            <polygon className="slab-hit" points={slabFootprint(slab)} />
            <polygon className={`background-object-svg slab-${index}`} points={slabFootprint(slab)} />
          </g>
        ))}

        <line className="distance-line" x1={cameraX} y1="220" x2={subjectX} y2="220" />
        <line className="distance-tick" x1={cameraX} y1="215" x2={cameraX} y2="225" />
        <line className="distance-tick" x1={subjectX} y1="215" x2={subjectX} y2="225" />
        <text className="distance-label" x={(cameraX + subjectX) / 2} y="213" textAnchor="middle">Z = {distance.toFixed(2)} m</text>

        <g className="equation-lock" transform="translate(442 196)">
          <text className="equation-text">f / Z = constant</text>
          <text className="equation-caption" y="14">Constant projected size</text>
        </g>
      </svg>
    </div>
  );
}
