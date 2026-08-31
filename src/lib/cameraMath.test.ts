import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  CAMERA_DISTANCE_FAR,
  CAMERA_DISTANCE_NEAR,
  FOCAL_LENGTH_FAR,
  computeFrustum,
  focalLengthForConstantScale,
  horizontalFovFromVerticalFov,
  horizontalFovFromFocalLength,
  interpolateCameraDistance,
  projectRayToPlane,
  projectSize,
  projectToNdc,
  verticalFovFromFocalLength,
} from './cameraMath';

describe('camera math', () => {
  it('interpolates the dolly endpoints and midpoint', () => {
    expect(interpolateCameraDistance(0)).toBe(CAMERA_DISTANCE_FAR);
    expect(interpolateCameraDistance(0.5)).toBe((CAMERA_DISTANCE_FAR + CAMERA_DISTANCE_NEAR) / 2);
    expect(interpolateCameraDistance(1)).toBe(CAMERA_DISTANCE_NEAR);
  });

  it('compensates focal length with a constant f/Z ratio', () => {
    expect(focalLengthForConstantScale(CAMERA_DISTANCE_FAR)).toBeCloseTo(FOCAL_LENGTH_FAR, 8);
    expect(focalLengthForConstantScale((CAMERA_DISTANCE_FAR + CAMERA_DISTANCE_NEAR) / 2)).toBeCloseTo(FOCAL_LENGTH_FAR * (CAMERA_DISTANCE_FAR + CAMERA_DISTANCE_NEAR) / (2 * CAMERA_DISTANCE_FAR), 8);
    expect(focalLengthForConstantScale(CAMERA_DISTANCE_NEAR)).toBeCloseTo(FOCAL_LENGTH_FAR * CAMERA_DISTANCE_NEAR / CAMERA_DISTANCE_FAR, 8);
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

  it('keeps every point on the selected plane exactly fixed in image coordinates', () => {
    const stableDepth = -0.8;
    const offsets = [-1.4, -0.5, 0, 0.72, 1.6];
    const referenceDistance = 6 - stableDepth;
    const referenceFocal = focalLengthForConstantScale(referenceDistance);

    offsets.forEach((offset) => {
      const reference = projectToNdc(offset, referenceFocal, referenceDistance, 36);
      [6, 5, 4, 3, 2].forEach((cameraZ) => {
        const depth = cameraZ - stableDepth;
        const focal = focalLengthForConstantScale(depth);
        expect(projectToNdc(offset, focal, depth, 36)).toBeCloseTo(reference, 12);
      });
    });
  });

  it('matches the exact Three.js perspective projection at every dolly position', () => {
    const aspect = 2.4;
    const stableDepth = -0.8;
    const worldPoints = [
      new THREE.Vector3(-1.25, 0.2, stableDepth),
      new THREE.Vector3(0.35, 0.85, stableDepth),
      new THREE.Vector3(1.1, 1.55, stableDepth),
    ];

    const projectAt = (cameraZ: number) => {
      const focal = focalLengthForConstantScale(cameraZ - stableDepth);
      const camera = new THREE.PerspectiveCamera(verticalFovFromFocalLength(focal), aspect, 0.05, 80);
      camera.position.set(0, 0.85, cameraZ);
      camera.lookAt(0, 0.85, 0);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
      return worldPoints.map((point) => point.clone().project(camera));
    };

    const reference = projectAt(6);
    [5, 4, 3, 2].forEach((cameraZ) => {
      projectAt(cameraZ).forEach((projected, index) => {
        expect(projected.x).toBeCloseTo(reference[index].x, 12);
        expect(projected.y).toBeCloseTo(reference[index].y, 12);
      });
    });
  });

  it('widens horizontal coverage with viewport aspect while preserving vertical coverage', () => {
    const focal = 35;
    const vertical = projectToNdc(0.5, focal, 6, 24);
    const horizontalAtThreeTwo = projectToNdc(0.5, focal, 6, 24 * 1.5);
    const horizontalAtWide = projectToNdc(0.5, focal, 6, 24 * 2.2);

    expect(vertical).toBe(projectToNdc(0.5, focal, 6, 24));
    expect(Math.abs(horizontalAtWide)).toBeLessThan(Math.abs(horizontalAtThreeTwo));
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
