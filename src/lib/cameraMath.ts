export const CAMERA_DISTANCE_FAR = 6.5;
export const CAMERA_DISTANCE_NEAR = 2;
export const FOCAL_LENGTH_FAR = 35;
export const FOCAL_LENGTH_NEAR = FOCAL_LENGTH_FAR * CAMERA_DISTANCE_NEAR / CAMERA_DISTANCE_FAR;
export const SENSOR_HEIGHT = 24;
export const SENSOR_WIDTH = 36;

export type DiagramPoint = { x: number; y: number };
export type FrustumGeometry = { top: DiagramPoint; bottom: DiagramPoint; halfAngleRadians: number };

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function interpolateCameraDistance(t: number): number {
  return CAMERA_DISTANCE_FAR + (CAMERA_DISTANCE_NEAR - CAMERA_DISTANCE_FAR) * clamp01(t);
}

export function focalLengthForConstantScale(
  distance: number,
  referenceFocalLength = FOCAL_LENGTH_FAR,
  referenceDistance = CAMERA_DISTANCE_FAR,
): number {
  return distance * referenceFocalLength / referenceDistance;
}

export function fovFromFocalLength(focalLength: number, sensorDimension: number): number {
  return 2 * Math.atan(sensorDimension / (2 * focalLength)) * 180 / Math.PI;
}

export function verticalFovFromFocalLength(focalLength: number): number {
  return fovFromFocalLength(focalLength, SENSOR_HEIGHT);
}

export function horizontalFovFromFocalLength(focalLength: number): number {
  return fovFromFocalLength(focalLength, SENSOR_WIDTH);
}

export function horizontalFovFromVerticalFov(verticalFov: number, aspect: number): number {
  const verticalHalfAngle = verticalFov * Math.PI / 360;
  return 2 * Math.atan(Math.tan(verticalHalfAngle) * aspect) * 180 / Math.PI;
}

export function projectSize(worldSize: number, focalLength: number, cameraDistance: number): number {
  return worldSize * focalLength / cameraDistance;
}

/**
 * Exact normalized-device coordinate for a point under a centered pinhole camera.
 * `cameraToPointDepth` is positive in front of the camera and `sensorDimension`
 * is expressed in the same units as `focalLength`.
 */
export function projectToNdc(
  worldOffset: number,
  focalLength: number,
  cameraToPointDepth: number,
  sensorDimension: number,
): number {
  return 2 * focalLength * worldOffset / (sensorDimension * cameraToPointDepth);
}

export function projectRayToPlane(camera: DiagramPoint, through: DiagramPoint, planeX: number): DiagramPoint {
  const scale = (planeX - camera.x) / (through.x - camera.x);
  return { x: planeX, y: camera.y + (through.y - camera.y) * scale };
}

export function computeFrustum(camera: DiagramPoint, planeX: number, focalLength: number, aspect = SENSOR_WIDTH / SENSOR_HEIGHT): FrustumGeometry {
  const verticalFov = verticalFovFromFocalLength(focalLength);
  const halfAngleRadians = horizontalFovFromVerticalFov(verticalFov, aspect) * Math.PI / 360;
  const halfHeight = Math.tan(halfAngleRadians) * (planeX - camera.x);
  return {
    top: { x: planeX, y: camera.y - halfHeight },
    bottom: { x: planeX, y: camera.y + halfHeight },
    halfAngleRadians,
  };
}
