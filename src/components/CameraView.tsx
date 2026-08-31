'use client';

/* eslint-disable react-hooks/immutability */

import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { CubePose } from './GeometryView';

type CameraViewProps = {
  distance: number;
  verticalFov: number;
  cubes: [CubePose, CubePose];
};

function CameraRig({ distance, verticalFov }: Pick<CameraViewProps, 'distance' | 'verticalFov'>) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.position.set(0, 0.8, distance);
    perspective.fov = verticalFov;
    perspective.near = 0.05;
    perspective.far = 40;
    perspective.lookAt(0, 0.62, 0);
    perspective.updateProjectionMatrix();
    invalidate();
  }, [camera, distance, invalidate, verticalFov]);

  return null;
}

function Scene({ cubes }: Pick<CameraViewProps, 'cubes'>) {
  return (
    <>
      <color attach="background" args={['#020304']} />
      <fog attach="fog" args={['#020304', 9, 17]} />
      <ambientLight intensity={0.48} />
      <directionalLight position={[1.8, 5.5, 4]} intensity={4.2} color="#fff4d6" castShadow />
      <pointLight position={[0, 2.6, 2.5]} intensity={12} distance={9} color="#ffd94b" />
      <spotLight position={[0, 6, -1]} angle={0.55} penumbra={0.9} intensity={18} color="#d5e8f2" />

      <mesh position={[0, 0.51, 0]} castShadow>
        <sphereGeometry args={[0.52, 72, 48]} />
        <meshPhysicalMaterial color="#ffc814" roughness={0.14} metalness={0.38} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>

      <mesh position={[cubes[0].x, 0.736, cubes[0].z]} rotation={[0.12, cubes[0].yaw, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 1.22, 1.22]} />
        <meshPhysicalMaterial color="#2ba9c1" emissive="#082b33" emissiveIntensity={0.24} roughness={0.17} metalness={0.34} clearcoat={1} clearcoatRoughness={0.07} />
      </mesh>
      <mesh position={[cubes[1].x, 0.673, cubes[1].z]} rotation={[-0.1, cubes[1].yaw, -0.07]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 1.22, 1.22]} />
        <meshPhysicalMaterial color="#9d68c5" emissive="#2c1538" emissiveIntensity={0.24} roughness={0.17} metalness={0.34} clearcoat={1} clearcoatRoughness={0.07} />
      </mesh>

      <mesh position={[0, -0.51, 0]} scale={[1, 0.82, 1]} renderOrder={2}>
        <sphereGeometry args={[0.52, 48, 32]} />
        <meshBasicMaterial color="#b88700" transparent opacity={0.055} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={[cubes[0].x, -0.736, cubes[0].z]} rotation={[-0.12, cubes[0].yaw, -0.08]} renderOrder={2}>
        <boxGeometry args={[1.22, 1.22, 1.22]} />
        <meshBasicMaterial color="#249cb4" transparent opacity={0.04} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={[cubes[1].x, -0.673, cubes[1].z]} rotation={[0.1, cubes[1].yaw, 0.07]} renderOrder={2}>
        <boxGeometry args={[1.22, 1.22, 1.22]} />
        <meshBasicMaterial color="#8251a7" transparent opacity={0.04} depthTest={false} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -2.5]} receiveShadow renderOrder={1}>
        <planeGeometry args={[20, 22]} />
        <meshPhysicalMaterial color="#080a0c" roughness={0.16} metalness={0.72} clearcoat={1} clearcoatRoughness={0.1} transparent opacity={0.94} depthWrite={false} />
      </mesh>
    </>
  );
}

export function CameraView({ distance, verticalFov, cubes }: CameraViewProps) {
  return (
    <div className="camera-view" aria-label="Perspective camera view of a fixed golden sphere and two background cubes">
      <Canvas
        dpr={[1, 1.75]}
        frameloop="demand"
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [0, 0.8, distance], fov: verticalFov, near: 0.05, far: 40 }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <CameraRig distance={distance} verticalFov={verticalFov} />
        <Scene cubes={cubes} />
      </Canvas>
    </div>
  );
}
