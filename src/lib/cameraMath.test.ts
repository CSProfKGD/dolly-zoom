import { describe, expect, it } from 'vitest';
import {
  computeFrustum,
  focalLengthForConstantScale,
  horizontalFovFromVerticalFov,
  horizontalFovFromFocalLength,
  interpolateCameraDistance,
  projectRayToPlane,
  projectSize,
  verticalFovFromFocalLength,
} from './cameraMath';

describe('camera math', () => {
  it('interpolates the dolly endpoints and midpoint', () => {
    expect(interpolateCameraDistance(0)).toBe(6);
    expect(interpolateCameraDistance(0.5)).toBe(4);
    expect(interpolateCameraDistance(1)).toBe(2);
  });

  it('compensates focal length with a constant f/Z ratio', () => {
    expect(focalLengthForConstantScale(6)).toBeCloseTo(35, 8);
    expect(focalLengthForConstantScale(4)).toBeCloseTo(23.333333, 5);
    expect(focalLengthForConstantScale(2)).toBeCloseTo(35 / 3, 8);
  });

  it('derives vertical FOV from a 24mm sensor height', () => {
    expect(verticalFovFromFocalLength(35 * 4 / 6)).toBeCloseTo(54.43, 2);
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
    const farSize = projectSize(1, focalLengthForConstantScale(6), 6);
    [6, 5, 4, 3, 2].forEach((cameraZ) => {
      expect(projectSize(1, focalLengthForConstantScale(cameraZ), cameraZ)).toBeCloseTo(farSize, 10);
    });
  });

  it('changes projected subject size when focal length is frozen', () => {
    expect(projectSize(1.7, 35, 2)).toBeCloseTo(projectSize(1.7, 35, 6) * 3, 10);
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

  it('matches the nominal sensor FOV at 3:2 and widens for a wider camera panel', () => {
    const verticalFov = verticalFovFromFocalLength(35);
    const nominal = horizontalFovFromVerticalFov(verticalFov, 1.5);
    const widePanel = horizontalFovFromVerticalFov(verticalFov, 2.2);
    expect(nominal).toBeCloseTo(horizontalFovFromFocalLength(35), 10);
    expect(widePanel).toBeGreaterThan(nominal);

    const camera = { x: 80, y: 130 };
    const nominalFrustum = computeFrustum(camera, 700, 35, 1.5);
    const wideFrustum = computeFrustum(camera, 700, 35, 2.2);
    expect(wideFrustum.top.y).toBeLessThan(nominalFrustum.top.y);
    expect(wideFrustum.bottom.y).toBeGreaterThan(nominalFrustum.bottom.y);
  });
});
