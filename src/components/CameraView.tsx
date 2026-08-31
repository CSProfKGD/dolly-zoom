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
    perspective.position.set(0, 1.12, distance);
    perspective.fov = verticalFov;
    perspective.near = 0.05;
    perspective.far = 80;
    perspective.lookAt(0, 1.02, -0.65);
    perspective.updateProjectionMatrix();
    invalidate();
  }, [camera, distance, invalidate, verticalFov]);

  return null;
}

function SoftGround() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, -18]}>
        <planeGeometry args={[80, 80]} />
        <meshBasicMaterial color="#060808" transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, -36]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        <shadowMaterial color="#000000" transparent opacity={0.58} />
      </mesh>
    </>
  );
}

function ArchitecturalScene({ slabs, subject }: Pick<CameraViewProps, 'slabs' | 'subject'>) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 9, 30]} />
      <ambientLight intensity={0.48} />
      <hemisphereLight args={['#dfe9ef', '#000000', 0.92]} />
      <directionalLight
        position={[-4, 8, 7]}
        intensity={2.5}
        color="#fff4dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[7, 5, -2]} intensity={1.15} color="#bcd8e4" />

      <mesh position={[subject.x, 0.85, subject.z]} castShadow>
        <sphereGeometry args={[0.85, 96, 64]} />
        <meshPhysicalMaterial
          color="#efc52b"
          roughness={0.31}
          metalness={0.04}
          clearcoat={0.42}
          clearcoatRoughness={0.3}
        />
      </mesh>

      <mesh position={[slabs[0].x, 1.175, slabs[0].z]} rotation={[0, slabs[0].yaw, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.35, 2.35, 2.35]} />
        <meshPhysicalMaterial color="#168f8c" roughness={0.3} metalness={0.1} clearcoat={0.4} clearcoatRoughness={0.25} />
      </mesh>
      <mesh position={[slabs[1].x, 0.86, slabs[1].z]} rotation={[0, slabs[1].yaw, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.72, 1.72, 1.72]} />
        <meshPhysicalMaterial color="#76538d" roughness={0.31} metalness={0.08} clearcoat={0.38} clearcoatRoughness={0.27} />
      </mesh>

      <SoftGround />
    </>
  );
}

export function CameraView({ distance, verticalFov, slabs, subject }: CameraViewProps) {
  return (
    <div className="camera-view" aria-label="Perspective camera view of a golden sphere and two colored cubes">
      <Canvas
        dpr={[1, 1.75]}
        frameloop="demand"
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [0, 1.12, distance], fov: verticalFov, near: 0.05, far: 80 }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <CameraRig distance={distance} verticalFov={verticalFov} />
        <ArchitecturalScene slabs={slabs} subject={subject} />
      </Canvas>

    </div>
  );
}
