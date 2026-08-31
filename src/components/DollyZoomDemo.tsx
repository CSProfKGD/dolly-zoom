'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView } from './CameraView';
import { DollyControl } from './DollyControl';
import { GeometryView } from './GeometryView';
import type { CubePose } from './GeometryView';
import {
  FOCAL_LENGTH_FAR,
  focalLengthForConstantScale,
  interpolateCameraDistance,
  verticalFovFromFocalLength,
} from '@/src/lib/cameraMath';

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function DollyZoomDemo() {
  const [t, setT] = useState(0);
  const [compensated, setCompensated] = useState(true);
  const [focalLength, setFocalLength] = useState(FOCAL_LENGTH_FAR);
  const [subjectDepth, setSubjectDepth] = useState(0);
  const [cubes, setCubes] = useState<[CubePose, CubePose]>([
    { x: -1.18, z: 0.65, yaw: 0.42 },
    { x: 1.18, z: -1.1, yaw: -0.39 },
  ]);
  const autoFrame = useRef<number | null>(null);
  const autoDelay = useRef<number | null>(null);
  const transitionFrame = useRef<number | null>(null);
  const distance = interpolateCameraDistance(t);
  const verticalFov = verticalFovFromFocalLength(focalLength);

  const cancelMotion = useCallback(() => {
    if (autoDelay.current !== null) window.clearTimeout(autoDelay.current);
    if (autoFrame.current !== null) cancelAnimationFrame(autoFrame.current);
    if (transitionFrame.current !== null) cancelAnimationFrame(transitionFrame.current);
    autoDelay.current = null;
    autoFrame.current = null;
    transitionFrame.current = null;
  }, []);

  const compensatedFocal = useCallback((nextDistance: number) => {
    return focalLengthForConstantScale(nextDistance - subjectDepth);
  }, [subjectDepth]);

  const handleSlider = useCallback((nextT: number) => {
    cancelMotion();
    const nextDistance = interpolateCameraDistance(nextT);
    setT(nextT);
    if (compensated) setFocalLength(compensatedFocal(nextDistance));
  }, [cancelMotion, compensated, compensatedFocal]);

  const animateFocalTo = useCallback((target: number) => {
    if (transitionFrame.current !== null) cancelAnimationFrame(transitionFrame.current);
    const from = focalLength;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 340);
      setFocalLength(from + (target - from) * easeInOutCubic(progress));
      if (progress < 1) transitionFrame.current = requestAnimationFrame(tick);
      else transitionFrame.current = null;
    };
    transitionFrame.current = requestAnimationFrame(tick);
  }, [focalLength]);

  const toggleCompensation = useCallback(() => {
    cancelMotion();
    if (compensated) {
      setCompensated(false);
      return;
    }
    setCompensated(true);
    animateFocalTo(compensatedFocal(distance));
  }, [animateFocalTo, cancelMotion, compensated, compensatedFocal, distance]);

  const moveSubjectPlane = useCallback((nextDepth: number) => {
    cancelMotion();
    setSubjectDepth(nextDepth);
    if (compensated) setFocalLength(focalLengthForConstantScale(distance - nextDepth));
  }, [cancelMotion, compensated, distance]);

  const moveCube = useCallback((index: number, pose: CubePose) => {
    cancelMotion();
    setCubes((current) => current.map((cube, cubeIndex) => cubeIndex === index ? pose : cube) as [CubePose, CubePose]);
  }, [cancelMotion]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    autoDelay.current = window.setTimeout(() => {
      const started = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / 5200);
        const nextT = easeInOutCubic(progress);
        const nextDistance = interpolateCameraDistance(nextT);
        setT(nextT);
        setFocalLength(focalLengthForConstantScale(nextDistance));
        if (progress < 1) autoFrame.current = requestAnimationFrame(tick);
        else autoFrame.current = null;
      };
      autoFrame.current = requestAnimationFrame(tick);
    }, 550);

    return () => {
      cancelMotion();
    };
  }, [cancelMotion]);

  return (
    <main className="demo-page">
      <header className="hero-block">
        <h1>Dolly Zoom</h1>
        <p className="subtitle">Same Subject. Different Perspective.</p>
      </header>

      <section className="visual-stack">
        <div className="section-label"><span>Camera view</span></div>
        <div className="camera-panel">
          <CameraView distance={distance} verticalFov={verticalFov} cubes={cubes} />
        </div>

        <div className="section-label geometry-heading"><span>Top-down geometry</span></div>
        <GeometryView distance={distance} focalLength={focalLength} subjectDepth={subjectDepth} cubes={cubes} onSubjectDepthChange={moveSubjectPlane} onCubeChange={moveCube} />
      </section>

      <section className="bottom-dock" aria-label="Dolly zoom controls and camera values">
        <DollyControl
          t={t}
          compensated={compensated}
          onChange={handleSlider}
          onInteraction={cancelMotion}
          onToggleCompensation={toggleCompensation}
        />
      </section>
    </main>
  );
}
