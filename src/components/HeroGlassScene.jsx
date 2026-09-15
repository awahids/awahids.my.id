import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshDistortMaterial } from '@react-three/drei';
import WebglErrorBoundary from './WebglErrorBoundary';

function GlassBlob({ reducedMotion, pointerRef }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!reducedMotion) {
      mesh.rotation.y += delta * 0.12;
      mesh.rotation.x += delta * 0.04;
    }

    const targetX = pointerRef.current.y * 0.25;
    const targetY = pointerRef.current.x * 0.35;
    mesh.rotation.x += (targetX - mesh.rotation.x) * 0.03;
    mesh.rotation.y += (targetY - mesh.rotation.y) * 0.03;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.4, 12]} />
      <MeshDistortMaterial
        color="#C8FF00"
        transparent
        opacity={0.16}
        roughness={0.08}
        metalness={0.15}
        distort={reducedMotion ? 0 : 0.28}
        speed={reducedMotion ? 0 : 1.2}
      />
    </mesh>
  );
}

export default function HeroGlassScene() {
  const pointerRef = useRef({ x: 0, y: 0 });
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(() => {
    if (reducedMotion) return undefined;
    const handlePointerMove = (event) => {
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [reducedMotion]);

  return (
    <div className="hero-3d-scene" aria-hidden="true">
      <WebglErrorBoundary fallback={null}>
        <Canvas
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 42, near: 0.1, far: 100, position: [0, 0, 4.2] }}
        >
          <ambientLight intensity={0.7} />
          <pointLight position={[3, 3, 4]} intensity={1.1} color="#C8FF00" />
          <Suspense fallback={null}>
            <Environment preset="city" />
            <GlassBlob reducedMotion={reducedMotion} pointerRef={pointerRef} />
          </Suspense>
        </Canvas>
      </WebglErrorBoundary>
    </div>
  );
}
