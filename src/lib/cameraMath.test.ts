import { describe, expect, it } from 'vitest';
import {
  computeFrustum,
  focalLengthForConstantScale,
  horizontalFovFromFocalLength,
  interpolateCameraDistance,
  projectRayToPlane,
  projectSize,
  verticalFovFromFocalLength,
} from './cameraMath';

describe('camera math', () => {
  it('interpolates the dolly endpoints and midpoint', () => {
    expect(interpolateCameraDistance(0)).toBeCloseTo(16.666667, 5);
    expect(interpolateCameraDistance(0.5)).toBeCloseTo(10.333333, 5);
    expect(interpolateCameraDistance(1)).toBe(4);
  });

  it('compensates focal length with a constant f/Z ratio', () => {
    expect(focalLengthForConstantScale(100 / 6)).toBeCloseTo(100, 8);
    expect(focalLengthForConstantScale(10.333333)).toBeCloseTo(62, 5);
    expect(focalLengthForConstantScale(4)).toBeCloseTo(24, 8);
  });

  it('derives vertical FOV from a 24mm sensor height', () => {
    expect(verticalFovFromFocalLength(62)).toBeCloseTo(21.91, 2);
  });

  it('keeps projected subject size constant under compensation', () => {
    const samples = Array.from({ length: 101 }, (_, index) => index / 100);
    const sizes = samples.map((t) => {
      const distance = interpolateCameraDistance(t);
      return projectSize(1.04, focalLengthForConstantScale(distance), distance);
    });
    sizes.forEach((size) => expect(size).toBeCloseTo(sizes[0], 10));
  });

  it('keeps a selected stability plane constant without moving scene objects', () => {
    const farSize = projectSize(1, focalLengthForConstantScale(100 / 6), 100 / 6);
    [100 / 6, 14, 10, 7, 4].forEach((cameraZ) => {
      expect(projectSize(1, focalLengthForConstantScale(cameraZ), cameraZ)).toBeCloseTo(farSize, 10);
    });
  });

  it('changes projected subject size when focal length is frozen', () => {
    expect(projectSize(1.7, 100, 4)).toBeCloseTo(projectSize(1.7, 100, 100 / 6) * (25 / 6), 10);
  });

  it('projects subject-edge rays and symmetric frustum boundaries', () => {
    const camera = { x: 80, y: 130 };
    const projected = projectRayToPlane(camera, { x: 400, y: 110 }, 700);
    expect(projected.x).toBe(700);
    expect(projected.y).toBeLessThan(110);

    const frustum = computeFrustum(camera, 700, 35);
    expect(frustum.top.y + frustum.bottom.y).toBeCloseTo(260, 8);
    expect(frustum.top.y).toBeLessThan(camera.y);
    expect(frustum.bottom.y).toBeGreaterThan(camera.y);
  });

  it('keeps the widest 24mm diagram frustum inside its drawing stage', () => {
    const halfAngle = horizontalFovFromFocalLength(24) * Math.PI / 360;
    const halfHeight = Math.tan(halfAngle) * (4 + 10.5) * 7.8;
    expect(132 - halfHeight).toBeGreaterThan(32);
    expect(132 + halfHeight).toBeLessThan(232);
  });
});
