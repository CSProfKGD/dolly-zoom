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

function CameraRig({ distance, verticalFov, subject }: CameraViewProps) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.position.set(subject.x, 0.85, subject.z + distance);
    perspective.fov = verticalFov;
    perspective.near = 0.05;
    perspective.far = 80;
    perspective.lookAt(subject.x, 0.85, subject.z);
    perspective.updateProjectionMatrix();
    invalidate();
  }, [camera, distance, invalidate, subject.x, subject.z, verticalFov]);

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
      <pointLight position={[0, 4.5, 3]} intensity={6.5} distance={16} color="#ffd864" />

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

      <mesh position={[slabs[0].x, 3.4, slabs[0].z]} rotation={[0, slabs[0].yaw, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 6.8, 0.55]} />
        <meshStandardMaterial color="#a4adb0" roughness={0.48} metalness={0.18} />
      </mesh>
      <mesh position={[slabs[1].x, 3.4, slabs[1].z]} rotation={[0, slabs[1].yaw, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 6.8, 0.55]} />
        <meshStandardMaterial color="#747d82" roughness={0.37} metalness={0.28} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, -7]} receiveShadow>
        <planeGeometry args={[34, 38]} />
        <meshStandardMaterial color="#050708" roughness={0.72} metalness={0.2} />
      </mesh>
    </>
  );
}

export function CameraView({ distance, verticalFov, slabs, subject }: CameraViewProps) {
  return (
    <div className="camera-view" aria-label="Perspective camera view of a fixed golden sphere and two architectural slabs">
      <Canvas
        dpr={[1, 1.75]}
        frameloop="demand"
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [subject.x, 0.85, subject.z + distance], fov: verticalFov, near: 0.05, far: 80 }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <CameraRig distance={distance} verticalFov={verticalFov} subject={subject} slabs={slabs} />
        <ArchitecturalScene slabs={slabs} subject={subject} />
      </Canvas>

      <div className="subject-invariant" aria-hidden="true">
        <i className="bracket bracket-tl" /><i className="bracket bracket-tr" />
        <i className="bracket bracket-bl" /><i className="bracket bracket-br" />
        <span>Subject size · fixed</span>
      </div>
    </div>
  );
}
