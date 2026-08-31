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
  const [cameraAspect, setCameraAspect] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slabs, setSlabs] = useState<[SlabPose, SlabPose]>([
    { x: -2.35, z: -4.6, yaw: -Math.PI / 4 },
    { x: 1.9, z: 0.8, yaw: Math.PI / 4 },
  ]);
  const [subject, setSubject] = useState<SubjectPose>({ x: 0, z: 0 });
  const autoFrame = useRef<number | null>(null);
  const transitionFrame = useRef<number | null>(null);
  const tRef = useRef(t);
  const distance = interpolateCameraDistance(t);
  const stableDistance = distance - stableDepth;
  const verticalFov = verticalFovFromFocalLength(focalLength);

  const cancelMotion = useCallback(() => {
    if (autoFrame.current !== null) cancelAnimationFrame(autoFrame.current);
    if (transitionFrame.current !== null) cancelAnimationFrame(transitionFrame.current);
    autoFrame.current = null;
    transitionFrame.current = null;
    setIsPlaying(false);
  }, []);

  const runAutoplay = useCallback(() => {
    cancelMotion();
    const startT = tRef.current;
    const endT = startT >= 0.999 ? 0 : 1;
    setIsPlaying(true);
    if (compensated) setFocalLength(focalLengthForConstantScale(interpolateCameraDistance(startT) - stableDepth));
    const startLeg = (fromT: number, toT: number) => {
      const started = performance.now();
      const duration = 3800 * Math.max(0.18, Math.abs(toT - fromT));
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const nextT = fromT + (toT - fromT) * easeInOutCubic(progress);
        const nextDistance = interpolateCameraDistance(nextT);
        setT(nextT);
        if (compensated) setFocalLength(focalLengthForConstantScale(nextDistance - stableDepth));
        if (progress < 1) autoFrame.current = requestAnimationFrame(tick);
        else startLeg(toT, toT === 1 ? 0 : 1);
      };
      autoFrame.current = requestAnimationFrame(tick);
    };
    startLeg(startT, endT);
  }, [cancelMotion, compensated, stableDepth]);

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
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    return cancelMotion;
  }, [cancelMotion]);

  return (
    <main className="demo-page">
      <header className="hero-block">
        <h1>Dolly Zoom</h1>
        <p className="subtitle">Same Subject. Different Perspective.</p>
      </header>

      <section className="visual-stack">
        <div className="section-label">Camera view</div>
        <div className="camera-panel">
          <CameraView distance={distance} verticalFov={verticalFov} slabs={slabs} subject={subject} onAspectChange={setCameraAspect} />
        </div>

        <div className="section-label geometry-heading">Top-down geometry</div>
        <GeometryView distance={distance} focalLength={focalLength} cameraAspect={cameraAspect} stableDepth={stableDepth} slabs={slabs} subject={subject} onStableDepthChange={updateStableDepth} onSlabChange={updateSlab} onSubjectChange={updateSubject} />
      </section>

      <section className="bottom-dock" aria-label="Dolly zoom controls and camera values">
        <DollyControl
          t={t}
          compensated={compensated}
          playing={isPlaying}
          onChange={handleSlider}
          onInteraction={cancelMotion}
          onToggleCompensation={toggleCompensation}
          onPlay={isPlaying ? cancelMotion : runAutoplay}
        />
      </section>
    </main>
  );
}
