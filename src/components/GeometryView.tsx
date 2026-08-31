'use client';

import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { computeFrustum } from '@/src/lib/cameraMath';

export type CubePose = { x: number; z: number; yaw: number };

type GeometryViewProps = {
  distance: number;
  focalLength: number;
  subjectDepth: number;
  cubes: [CubePose, CubePose];
  onSubjectDepthChange: (depth: number) => void;
  onCubeChange: (index: number, pose: CubePose) => void;
};

const AXIS_Y = 132;
const SUBJECT_RADIUS = 17;
const BACKGROUND_X = 710;
const SUBJECT_ORIGIN_X = 408;
const DEPTH_SCALE = 52;
const LATERAL_SCALE = 42;
const MIN_SUBJECT_DEPTH = -1.25;
const MAX_SUBJECT_DEPTH = 0.85;
const CUBE_SIZE = 1.22;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function diagramX(z: number): number { return SUBJECT_ORIGIN_X - z * DEPTH_SCALE; }
function diagramY(x: number): number { return AXIS_Y - x * LATERAL_SCALE; }
function n(value: number): string { return Number.isFinite(value) ? value.toFixed(2) : '0'; }

function cubeFootprint(pose: CubePose): string {
  const half = CUBE_SIZE / 2;
  const cos = Math.cos(pose.yaw);
  const sin = Math.sin(pose.yaw);
  return [[-half, -half], [half, -half], [half, half], [-half, half]]
    .map(([localX, localZ]) => {
      const worldX = pose.x + localX * cos + localZ * sin;
      const worldZ = pose.z - localX * sin + localZ * cos;
      return `${n(diagramX(worldZ))},${n(diagramY(worldX))}`;
    }).join(' ');
}

export function GeometryView({ distance, focalLength, subjectDepth, cubes, onSubjectDepthChange, onCubeChange }: GeometryViewProps) {
  const [draggingSubject, setDraggingSubject] = useState(false);
  const activeCube = useRef<number | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const cameraX = 82 + (6 - distance) * 51;
  const subjectX = diagramX(subjectDepth);
  const frustum = computeFrustum({ x: cameraX, y: AXIS_Y }, BACKGROUND_X, focalLength);

  const svgPoint = (event: ReactPointerEvent<SVGElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 820 / rect.width, y: (event.clientY - rect.top) * 264 / rect.height };
  };

  const updateSubject = (event: ReactPointerEvent<SVGGElement>) => {
    const point = svgPoint(event);
    onSubjectDepthChange(clamp((SUBJECT_ORIGIN_X - point.x) / DEPTH_SCALE, MIN_SUBJECT_DEPTH, MAX_SUBJECT_DEPTH));
  };

  const beginCubeDrag = (index: number, event: ReactPointerEvent<SVGPolygonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activeCube.current = index;
    lastPointer.current = { x: event.clientX, y: event.clientY };
  };

  const moveCube = (index: number, event: ReactPointerEvent<SVGPolygonElement>) => {
    if (activeCube.current !== index || event.buttons === 0) return;
    const pose = cubes[index];
    if (event.buttons === 3) {
      onCubeChange(index, { ...pose, yaw: pose.yaw + (event.clientX - lastPointer.current.x) * 0.015 });
    } else {
      const point = svgPoint(event);
      onCubeChange(index, {
        ...pose,
        x: clamp((AXIS_Y - point.y) / LATERAL_SCALE, -2.25, 2.25),
        z: clamp((SUBJECT_ORIGIN_X - point.x) / DEPTH_SCALE, -1.55, 0.95),
      });
    }
    lastPointer.current = { x: event.clientX, y: event.clientY };
  };

  return (
    <div className="geometry-view">
      <svg viewBox="0 0 820 264" role="img" aria-labelledby="geometry-title geometry-desc" preserveAspectRatio="xMidYMid meet" onContextMenu={(event) => event.preventDefault()}>
        <title id="geometry-title">Interactive top-down camera geometry</title>
        <desc id="geometry-desc">A cyan camera and frustum face a fixed golden subject, an independently movable stability plane, and two draggable, rotatable cubes.</desc>
        <defs>
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <path className="frustum-fill" d={`M ${n(cameraX)} ${AXIS_Y} L ${BACKGROUND_X} ${n(frustum.top.y)} L ${BACKGROUND_X} ${n(frustum.bottom.y)} Z`} />
        <line className="frustum-line" x1={cameraX} y1={AXIS_Y} x2={frustum.top.x} y2={frustum.top.y} />
        <line className="frustum-line" x1={cameraX} y1={AXIS_Y} x2={frustum.bottom.x} y2={frustum.bottom.y} />

        <g className="diagram-camera" transform={`translate(${n(cameraX - 31)} ${AXIS_Y - 19})`} filter="url(#cyanGlow)">
          <rect width="48" height="38" rx="6" />
          <path d="M48 10 L61 4 L61 34 L48 28 Z" />
          <circle cx="22" cy="19" r="3" />
        </g>
        <text className="focal-label" x={cameraX} y={AXIS_Y - 32} textAnchor="middle">f = {focalLength.toFixed(1)} mm</text>

        {cubes.map((cube, index) => (
          <polygon
            key={index}
            className={`cube-footprint cube-${index}`}
            points={cubeFootprint(cube)}
            role="slider"
            tabIndex={0}
            aria-label={`${index === 0 ? 'Cyan' : 'Purple'} cube position and rotation`}
            onPointerDown={(event) => beginCubeDrag(index, event)}
            onPointerMove={(event) => moveCube(index, event)}
            onPointerUp={() => { activeCube.current = null; }}
            onPointerCancel={() => { activeCube.current = null; }}
          />
        ))}

        <g
          className="subject-plane-control-svg"
          role="slider"
          tabIndex={0}
          aria-label="Stable pixel plane depth"
          aria-valuemin={MIN_SUBJECT_DEPTH}
          aria-valuemax={MAX_SUBJECT_DEPTH}
          aria-valuenow={Number(subjectDepth.toFixed(2))}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            setDraggingSubject(true);
            updateSubject(event);
          }}
          onPointerMove={(event) => { if (draggingSubject) updateSubject(event); }}
          onPointerUp={() => setDraggingSubject(false)}
          onPointerCancel={() => setDraggingSubject(false)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') onSubjectDepthChange(clamp(subjectDepth + 0.05, MIN_SUBJECT_DEPTH, MAX_SUBJECT_DEPTH));
            if (event.key === 'ArrowRight') onSubjectDepthChange(clamp(subjectDepth - 0.05, MIN_SUBJECT_DEPTH, MAX_SUBJECT_DEPTH));
            if (event.key === 'Home') onSubjectDepthChange(MAX_SUBJECT_DEPTH);
            if (event.key === 'End') onSubjectDepthChange(MIN_SUBJECT_DEPTH);
          }}
        >
          <line className="subject-plane-hit" x1={subjectX} y1="25" x2={subjectX} y2="226" />
          <line className="subject-plane-line" x1={subjectX} y1="25" x2={subjectX} y2="226" />
          <circle className="subject-handle" cx={subjectX} cy="25" r="4" />
        </g>

        <circle className="subject-shape" cx={SUBJECT_ORIGIN_X} cy={AXIS_Y} r={SUBJECT_RADIUS} />

        <line className="distance-line" x1={cameraX} y1="226" x2={subjectX} y2="226" />
        <line className="distance-tick" x1={cameraX} y1="220" x2={cameraX} y2="232" />
        <line className="distance-tick" x1={subjectX} y1="220" x2={subjectX} y2="232" />
        <text className="distance-label" x={(cameraX + subjectX) / 2} y="218" textAnchor="middle">Z = {(distance - subjectDepth).toFixed(2)} m</text>
      </svg>
    </div>
  );
}
