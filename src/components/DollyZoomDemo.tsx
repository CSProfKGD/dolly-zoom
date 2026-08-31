'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView } from './CameraView';
import { DollyControl } from './DollyControl';
import { GeometryView } from './GeometryView';
import type { SlabPose, SubjectPose } from './GeometryView';
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
  const [stableDepth, setStableDepth] = useState(0);
  const [slabs, setSlabs] = useState<[SlabPose, SlabPose]>([
    { x: -2.35, z: -3.3, yaw: -0.474 },
    { x: 2.15, z: -4.55, yaw: -0.2 },
  ]);
  const [subject, setSubject] = useState<SubjectPose>({ x: 0, z: 0 });
  const autoFrame = useRef<number | null>(null);
  const autoDelay = useRef<number | null>(null);
  const transitionFrame = useRef<number | null>(null);
  const distance = interpolateCameraDistance(t);
  const stableDistance = distance - stableDepth;
  const verticalFov = verticalFovFromFocalLength(focalLength);

  const cancelMotion = useCallback(() => {
    if (autoDelay.current !== null) window.clearTimeout(autoDelay.current);
    if (autoFrame.current !== null) cancelAnimationFrame(autoFrame.current);
    if (transitionFrame.current !== null) cancelAnimationFrame(transitionFrame.current);
    autoDelay.current = null;
    autoFrame.current = null;
    transitionFrame.current = null;
  }, []);

  const handleSlider = useCallback((nextT: number) => {
    cancelMotion();
    const nextDistance = interpolateCameraDistance(nextT);
    setT(nextT);
    if (compensated) setFocalLength(focalLengthForConstantScale(nextDistance - stableDepth));
  }, [cancelMotion, compensated, stableDepth]);

  const animateFocalTo = useCallback((target: number) => {
    if (transitionFrame.current !== null) cancelAnimationFrame(transitionFrame.current);
    const from = focalLength;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 380);
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
    animateFocalTo(focalLengthForConstantScale(stableDistance));
  }, [animateFocalTo, cancelMotion, compensated, stableDistance]);

  const updateStableDepth = useCallback((nextDepth: number) => {
    cancelMotion();
    setStableDepth(nextDepth);
    if (compensated) setFocalLength(focalLengthForConstantScale(distance - nextDepth));
  }, [cancelMotion, compensated, distance]);

  const updateSlab = useCallback((index: number, pose: SlabPose) => {
    cancelMotion();
    setSlabs((current) => current.map((slab, slabIndex) => slabIndex === index ? pose : slab) as [SlabPose, SlabPose]);
  }, [cancelMotion]);

  const updateSubject = useCallback((pose: SubjectPose) => {
    cancelMotion();
    setSubject(pose);
  }, [cancelMotion]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    autoDelay.current = window.setTimeout(() => {
      const started = performance.now();
      const duration = 3800;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const nextT = progress < 0.7
          ? easeInOutCubic(progress / 0.7)
          : 1 - 0.5 * easeInOutCubic((progress - 0.7) / 0.3);
        const nextDistance = interpolateCameraDistance(nextT);
        setT(nextT);
        setFocalLength(focalLengthForConstantScale(nextDistance - stableDepth));
        if (progress < 1) autoFrame.current = requestAnimationFrame(tick);
        else autoFrame.current = null;
      };
      autoFrame.current = requestAnimationFrame(tick);
    }, 450);

    return cancelMotion;
  }, [cancelMotion, stableDepth]);

  return (
    <main className="demo-page">
      <header className="hero-block">
        <h1>Dolly Zoom</h1>
        <p className="subtitle">Same Subject. Different Perspective.</p>
      </header>

      <section className="visual-stack">
        <div className="section-label">Camera view</div>
        <div className="camera-panel">
          <CameraView distance={distance} verticalFov={verticalFov} slabs={slabs} subject={subject} />
        </div>

        <div className="section-label geometry-heading">Top-down geometry</div>
        <GeometryView distance={distance} focalLength={focalLength} stableDepth={stableDepth} slabs={slabs} subject={subject} onStableDepthChange={updateStableDepth} onSlabChange={updateSlab} onSubjectChange={updateSubject} />
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
