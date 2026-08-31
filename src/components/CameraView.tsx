'use client';

/* eslint-disable react-hooks/immutability */

import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { SlabPose, SubjectPose } from './GeometryView';

type CameraViewProps = {
  distance: number;
  verticalFov: number;
  slabs: [SlabPose, SlabPose];
  subject: SubjectPose;
};

function CameraRig({ distance, verticalFov }: Pick<CameraViewProps, 'distance' | 'verticalFov'>) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.position.set(0, 0.85, distance);
    perspective.fov = verticalFov;
    perspective.near = 0.05;
    perspective.far = 80;
    perspective.lookAt(0, 0.85, 0);
    perspective.updateProjectionMatrix();
    invalidate();
  }, [camera, distance, invalidate, verticalFov]);

  return null;
}

function ArchitecturalScene({ slabs, subject }: Pick<CameraViewProps, 'slabs' | 'subject'>) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 26, 52]} />
      <ambientLight intensity={0.58} />
      <hemisphereLight args={['#e9f2f7', '#050607', 1.15]} />
      <directionalLight
        position={[-4, 8, 7]}
        intensity={3.4}
        color="#fff4dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[7, 5, -2]} intensity={1.7} color="#bcd8e4" />
      <rectAreaLight position={[0, 5.5, 4]} rotation={[-Math.PI / 2.8, 0, 0]} width={14} height={5} intensity={0.65} color="#dce8ed" />

      <mesh position={[subject.x, 0.85, subject.z]} castShadow>
        <sphereGeometry args={[0.85, 96, 64]} />
        <meshPhysicalMaterial
          color="#f6c927"
          roughness={0.2}
          metalness={0.12}
          clearcoat={0.68}
          clearcoatRoughness={0.16}
        />
      </mesh>

      <mesh position={[slabs[0].x, 0.61, slabs[0].z]} rotation={[0.08, slabs[0].yaw, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 1.22, 1.22]} />
        <meshPhysicalMaterial color="#18b8b0" roughness={0.2} metalness={0.18} clearcoat={0.72} clearcoatRoughness={0.14} />
      </mesh>
      <mesh position={[slabs[1].x, 0.61, slabs[1].z]} rotation={[-0.06, slabs[1].yaw, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 1.22, 1.22]} />
        <meshPhysicalMaterial color="#a45ac4" roughness={0.2} metalness={0.14} clearcoat={0.76} clearcoatRoughness={0.13} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, -15]} receiveShadow>
        <planeGeometry args={[80, 90]} />
        <meshPhysicalMaterial
          color="#111518"
          emissive="#020304"
          emissiveIntensity={0.1}
          roughness={0.34}
          metalness={0.3}
          clearcoat={0.68}
          clearcoatRoughness={0.28}
        />
      </mesh>
    </>
  );
}

export function CameraView({ distance, verticalFov, slabs, subject }: CameraViewProps) {
  return (
    <div className="camera-view" aria-label="Perspective camera view of a fixed golden sphere and two glossy colored cubes">
      <Canvas
        dpr={[1, 1.75]}
        frameloop="demand"
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [0, 0.85, distance], fov: verticalFov, near: 0.05, far: 80 }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <CameraRig distance={distance} verticalFov={verticalFov} />
        <ArchitecturalScene slabs={slabs} subject={subject} />
      </Canvas>

      <div className="subject-invariant" aria-hidden="true">
        <i className="bracket bracket-tl" /><i className="bracket bracket-tr" />
        <i className="bracket bracket-bl" /><i className="bracket bracket-br" />
      </div>
    </div>
  );
}
