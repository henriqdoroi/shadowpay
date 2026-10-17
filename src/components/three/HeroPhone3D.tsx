import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import Phone3D from "./Phone3D";
import Ninja3D from "./Ninja3D";
import Studio from "./Studio";

/* Hero da landing: iPhone 18 Pro Max 3D recebendo vendas + ninja 3D atrás.
 * Flutua, gira devagar e segue o mouse. Fundo transparente. */

function Rig() {
  const phone = useRef<THREE.Group>(null);
  const ninja = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }, dt) => {
    const t = clock.elapsedTime;
    const k = 1 - Math.pow(0.002, dt);
    if (phone.current) {
      const ty = -0.42 + Math.sin(t * 0.5) * 0.18 + pointer.x * 0.35;
      const tx = 0.06 + Math.sin(t * 0.7) * 0.04 - pointer.y * 0.2;
      phone.current.rotation.y += (ty - phone.current.rotation.y) * k;
      phone.current.rotation.x += (tx - phone.current.rotation.x) * k;
      phone.current.position.y = Math.sin(t * 0.9) * 0.05;
    }
    if (ninja.current) {
      ninja.current.rotation.y = 0.5 + Math.sin(t * 0.6) * 0.25 + pointer.x * 0.2;
      ninja.current.position.y = 0.55 + Math.sin(t * 1.1 + 1) * 0.06;
    }
  });
  return (
    <>
      <group ref={ninja} position={[-0.5, 0.55, -0.6]} scale={0.9}>
        <Ninja3D />
      </group>
      <group ref={phone} position={[0.18, 0, 0]} rotation={[0.06, -0.42, 0.06]}>
        <Phone3D every={2.2} />
      </group>
    </>
  );
}

export default function HeroPhone3D() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.05, 3.6], fov: 32 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <Studio />
        <ambientLight intensity={0.25} />
        <directionalLight position={[2, 3, 4]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-2, 1, 2]} intensity={6} color="#8b5cf6" />
        <Rig />
        <ContactShadows position={[0, -0.95, 0]} opacity={0.55} scale={4} blur={2.6} far={1.6} color="#1a0b3a" />
      </Suspense>
    </Canvas>
  );
}
