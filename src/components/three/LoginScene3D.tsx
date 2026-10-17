import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, MeshReflectorMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import Phone3D from "./Phone3D";
import Ninja3D from "./Ninja3D";
import Studio from "./Studio";

/**
 * Filme 3D do login (WebGL):
 *  0.0–5.2s  tracking shot: carro esportivo branco (ninja 3D ao volante) numa
 *            pista molhada em Dubai; câmera vai da frente 3/4 à traseira 3/4;
 *  5.2–6.2s  o carro arranca e some;
 *  6.0s+     clarão → logo ninja 3D sobe girando → iPhone 18 Pro Max 3D entra
 *            e recebe as vendas. O mouse move a câmera.
 * Modelo do carro: "Ferrari 458 Italia" por vicent091036 (Sketchfab), o mesmo
 * do exemplo oficial do three.js (public/login/car.glb, Draco em /draco/).
 */

const T = { exit: 5.2, brand: 6.0, phone: 6.9, sales: 8.2 };
const CAR = "/login/car.glb";
const AO = "/login/car_ao.png";
const CITY = "/login/dubai.jpg";

const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ── carro ── */
function Car({ t }: { t: React.MutableRefObject<number> }) {
  const { scene } = useGLTF(CAR, "/draco/");
  const ao = useTexture(AO);
  const group = useRef<THREE.Group>(null);
  const model = useMemo(() => {
    const m = scene.clone(true);
    const body = new THREE.MeshPhysicalMaterial({ color: "#f4f4f7", metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.03 });
    const details = new THREE.MeshStandardMaterial({ color: "#d9d9de", metalness: 1, roughness: 0.38 });
    const glass = new THREE.MeshPhysicalMaterial({ color: "#191528", metalness: 0.3, roughness: 0, transparent: true, opacity: 0.5, clearcoat: 1 });
    const set = (name: string, mat: THREE.Material) => {
      const o = m.getObjectByName(name) as THREE.Mesh | undefined;
      if (o) o.material = mat;
    };
    set("body", body);
    ["rim_fl", "rim_fr", "rim_rr", "rim_rl", "trim"].forEach((n) => set(n, details));
    set("glass", glass);
    m.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    return m;
  }, [scene]);
  const wheels = useMemo(() => ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"].map((n) => model.getObjectByName(n)).filter(Boolean) as THREE.Object3D[], [model]);
  const aoMat = useMemo(() => new THREE.MeshBasicMaterial({ map: ao, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true, premultipliedAlpha: true }), [ao]);

  useFrame((_, dt) => {
    const time = t.current;
    const g = group.current;
    if (!g) return;
    // arrancada: acelera pra -x e some
    const e = clamp01((time - T.exit) / 1.0);
    g.position.x = -e * e * 70;
    g.visible = time < T.exit + 1.05;
    g.position.y = Math.sin(time * 28) * 0.004; // vibração do motor
    wheels.forEach((w) => { w.rotation.x -= dt * (14 + e * 40); });
  });

  return (
    <group ref={group}>
      {/* modelo aponta pra +z; girado pra andar pra -x com o lado do motorista virado pra câmera */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <primitive object={model} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={2} material={aoMat}>
          <planeGeometry args={[0.655 * 4, 1.3 * 4]} />
        </mesh>
        {/* ninja ao volante (lado esquerdo, visto pelo vidro) */}
        <group position={[0.36, 0.86, -0.12]} scale={0.42}>
          <Ninja3D depth={0.2} />
        </group>
      </group>
    </group>
  );
}

/* ── pista molhada, faixas e postes correndo ── */
function Road({ t }: { t: React.MutableRefObject<number> }) {
  const dashes = useRef<THREE.Group>(null);
  const poles = useRef<THREE.Group>(null);
  const dashMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }), []);
  const edgeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#a78bfa", toneMapped: false }), []);
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd9a0", toneMapped: false }), []);
  const poleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2b2638", metalness: 0.8, roughness: 0.4 }), []);
  const N = 16, SP = 5, P = 7, PSP = 14;
  useFrame(() => {
    const time = t.current;
    const speed = time < T.exit ? 26 : 26 + (time - T.exit) * 30;
    const off = (time * speed);
    dashes.current?.children.forEach((d, i) => { d.position.x = ((i * SP + off) % (N * SP)) - (N * SP) / 2; });
    poles.current?.children.forEach((p, i) => { p.position.x = ((i * PSP + off) % (P * PSP)) - (P * PSP) / 2; });
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
        <planeGeometry args={[220, 60]} />
        <MeshReflectorMaterial
          blur={[400, 120]} resolution={1024} mixBlur={1} mixStrength={2.4} roughness={0.85} depthScale={1.1}
          minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#0e0b16" metalness={0.55} mirror={0.7}
        />
      </mesh>
      <group ref={dashes}>
        {Array.from({ length: N }).map((_, i) => (
          <group key={i}>
            <mesh position={[0, 0.012, 2.1]} rotation={[-Math.PI / 2, 0, 0]} material={dashMat}><planeGeometry args={[2.2, 0.12]} /></mesh>
            <mesh position={[0, 0.012, -2.3]} rotation={[-Math.PI / 2, 0, 0]} material={dashMat}><planeGeometry args={[2.2, 0.12]} /></mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, 0.013, 5.2]} rotation={[-Math.PI / 2, 0, 0]} material={edgeMat}><planeGeometry args={[220, 0.1]} /></mesh>
      <mesh position={[0, 0.013, -6.4]} rotation={[-Math.PI / 2, 0, 0]} material={edgeMat}><planeGeometry args={[220, 0.1]} /></mesh>
      <group ref={poles}>
        {Array.from({ length: P }).map((_, i) => (
          <group key={i} position={[0, 0, -7.4]}>
            <mesh position={[0, 3, 0]} material={poleMat}><cylinderGeometry args={[0.06, 0.08, 6, 12]} /></mesh>
            <mesh position={[0, 6, 0.5]} rotation={[Math.PI / 2, 0, 0]} material={poleMat}><cylinderGeometry args={[0.04, 0.04, 1.1, 8]} /></mesh>
            <mesh position={[0, 5.95, 1.05]} material={bulbMat}><sphereGeometry args={[0.16, 16, 16]} /></mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ── Dubai ao fundo ── */
function City({ t }: { t: React.MutableRefObject<number> }) {
  const tex = useTexture(CITY);
  const mat = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: false });
  }, [tex]);
  useFrame(() => {
    const k = 1 - ease((t.current - T.brand) / 1.2) * 0.62;
    mat.color.setRGB(k, k, k);
  });
  return (
    <mesh position={[0, 12, -46]} material={mat}>
      <planeGeometry args={[96, 53.6]} />
    </mesh>
  );
}

/* ── logo 3D + iPhone 3D ── */
function Brand({ t, sales }: { t: React.MutableRefObject<number>; sales: boolean }) {
  const logo = useRef<THREE.Group>(null);
  const phone = useRef<THREE.Group>(null);
  useFrame(({ pointer }) => {
    const time = t.current;
    const a = ease((time - T.brand) / 1.4);
    if (logo.current) {
      logo.current.visible = time > T.brand - 0.05;
      logo.current.position.y = lerp(0.4, 2.92, a) + Math.sin(time * 1.3) * 0.03 * a;
      logo.current.rotation.y = (1 - a) * Math.PI * 4 + Math.sin(time * 0.8) * 0.18 * a;
      const s = lerp(0.4, 1.0, a);
      logo.current.scale.set(s, s, s);
    }
    if (phone.current) {
      const b = ease((time - T.phone) / 1.3);
      phone.current.visible = time > T.phone - 0.05;
      phone.current.position.y = lerp(-3.6, 0.5, b);
      phone.current.rotation.y = (1 - b) * 1.1 + (-0.28 + pointer.x * 0.35 + Math.sin(time * 0.6) * 0.1) * b;
      phone.current.rotation.x = (1 - b) * 0.3 + (0.06 - pointer.y * 0.18) * b;
      phone.current.rotation.z = (1 - b) * -0.25;
    }
  });
  return (
    <group position={[0, 0, 0.8]}>
      <group ref={logo} visible={false}>
        <Ninja3D depth={0.2} />
        <pointLight position={[0, 0, -1]} intensity={14} distance={4} color="#8b5cf6" />
      </group>
      <group ref={phone} visible={false} scale={1.62}>
        <Phone3D active={sales} every={1.9} />
      </group>
    </group>
  );
}

/* ── câmera ── */
function CameraRig({ t }: { t: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ pointer }, dt) => {
    const time = t.current;
    // tracking: frente 3/4 → lado → traseira 3/4
    const d = ease(time / 5.2);
    const ang = lerp(-0.85, 0.75, d); // em volta do carro (0 = de lado)
    const r = lerp(10.8, 9.4, Math.sin(d * Math.PI)); // palco vertical: câmera mais longe pro carro caber
    const drive = new THREE.Vector3(Math.sin(ang) * r, lerp(1.45, 2.1, d), Math.cos(ang) * r);
    const driveLook = new THREE.Vector3(0, 0.75, 0);
    // marca: câmera de frente, olhando pra logo/celular
    const b = ease((time - T.brand) / 1.6);
    const brand = new THREE.Vector3(0, 1.75, 8.1);
    const brandLook = new THREE.Vector3(0, 1.62, 0.8);
    const pos = drive.lerp(brand, b);
    look.copy(driveLook).lerp(brandLook, b);
    pos.x += pointer.x * 0.45;
    pos.y += pointer.y * 0.25;
    const k = 1 - Math.pow(0.0005, dt);
    camera.position.lerp(pos, Math.min(1, k * 1.5));
    camera.lookAt(look);
  });
  return null;
}

function Clock({ t, start, on }: { t: React.MutableRefObject<number>; start: React.MutableRefObject<number>; on: boolean }) {
  useFrame(() => { t.current = on ? (performance.now() - start.current) / 1000 : 0; });
  return null;
}

/* monta só depois que tudo no <Suspense> carregou (modelo, texturas) */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady(); }, [onReady]);
  return null;
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Hud({ run }: { run: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const loop = (tt: number) => {
      const p = Math.min(1, (tt - t0) / 4600);
      setV(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [run]);
  return (
    <div className="l3-hud">
      <div><small>km/h</small><b>{Math.round(v * 287)}</b></div>
      <i />
      <div><small>Faturado hoje</small><b className="g">{brl(Math.round(v * 248390))}</b></div>
    </div>
  );
}

export default function LoginScene3D() {
  const t = useRef(0);
  const start = useRef(performance.now());
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<"drive" | "brand" | "sales">("drive");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    start.current = performance.now();
    t.current = 0;
    setPhase("drive");
    const ts = [
      setTimeout(() => setPhase("brand"), T.brand * 1000),
      setTimeout(() => setPhase("sales"), T.sales * 1000),
    ];
    return () => ts.forEach(clearTimeout);
  }, [run, loaded]);

  const onReady = useCallback(() => setLoaded(true), []);
  const driving = phase === "drive" && loaded;
  return (
    <div className="l3">
      <style dangerouslySetInnerHTML={{ __html: L3_CSS }} />
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [-7.5, 1.5, 8], fov: 34, near: 0.1, far: 200 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      >
        <color attach="background" args={["#0a0614"]} />
        <fog attach="fog" args={["#1c0f33", 14, 60]} />
        <Clock t={t} start={start} on={loaded} />
        <Suspense fallback={null}>
          <Studio warm intensity={0.9} />
          <ambientLight intensity={0.15} />
          <directionalLight position={[-6, 8, 6]} intensity={1.1} color="#ffd2a8" castShadow />
          <pointLight position={[0, 3, 4]} intensity={18} distance={14} color="#a78bfa" />
          <City t={t} />
          <Road t={t} />
          <Car t={t} />
          <Brand t={t} sales={phase === "sales"} />
          <CameraRig t={t} />
          <Ready onReady={onReady} />
        </Suspense>
      </Canvas>

      <div className="l3-vignette" />
      <motion.div className="l3-tag" animate={{ opacity: driving ? 1 : 0 }}>DUBAI · SHEIKH ZAYED RD · 21:47</motion.div>
      <motion.div className="l3-hud-wrap" animate={{ opacity: driving ? 1 : 0, y: driving ? 0 : 10 }}>
        {loaded && <Hud run={run} />}
      </motion.div>
      {phase !== "drive" && (
        <>
          <motion.div key={"f" + run} className="l3-flash" initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} transition={{ duration: 1.1 }} />
          <motion.div className="l3-word" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.5 }}>
            <span>Shadow<i>Pay</i></span>
            <small>Cada venda aprovada, no seu bolso na hora.</small>
          </motion.div>
          <button className="l3-replay" onClick={() => setRun((r) => r + 1)}><RotateCcw size={14} /> Reproduzir</button>
        </>
      )}
      <span className="l3-credit">Modelo 3D do carro: Ferrari 458 Italia por vicent091036 (Sketchfab)</span>
    </div>
  );
}

useGLTF.preload(CAR, "/draco/");

const L3_CSS = `
.l3{position:absolute;inset:0;overflow:hidden;background:#0a0614;color:#fff;font-family:var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif}
.l3 canvas{display:block}
.l3-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 45%,transparent 50%,rgba(5,3,11,.7) 100%)}
.l3-tag{position:absolute;left:32px;top:28px;z-index:5;font-family:var(--font-jetbrains),ui-monospace,monospace;font-size:11px;letter-spacing:.22em;color:rgba(255,255,255,.75)}
.l3-hud-wrap{position:absolute;left:32px;bottom:34px;z-index:5}
.l3-hud{display:flex;align-items:center;gap:18px;padding:12px 18px;border-radius:14px;background:rgba(10,7,20,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12)}
.l3-hud i{width:1px;height:30px;background:rgba(255,255,255,.15)}
.l3-hud small{display:block;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.l3-hud b{display:block;font-size:22px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.l3-hud b.g{color:#4ade80}
.l3-flash{position:absolute;inset:0;z-index:6;pointer-events:none;background:radial-gradient(circle at 50% 55%,#fff,#c4b5fd 30%,rgba(124,58,237,.4) 60%,transparent 80%)}
.l3-word{position:absolute;left:0;right:0;top:30.5%;z-index:5;text-align:center;pointer-events:none}
.l3-word span{display:block;font-size:clamp(28px,3vw,42px);font-weight:700;letter-spacing:-.03em;text-shadow:0 6px 30px rgba(0,0,0,.6),0 0 40px rgba(139,92,246,.6)}
.l3-word span i{font-style:italic;font-weight:500;color:#c4b5fd;margin-left:1px}
.l3-word small{display:block;margin-top:4px;font-size:13.5px;color:rgba(255,255,255,.72)}
.l3-replay{position:absolute;right:20px;bottom:26px;z-index:7;display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);
  background:rgba(10,7,20,.5);color:rgba(255,255,255,.85);font-size:12px;cursor:pointer;backdrop-filter:blur(10px)}
.l3-replay:hover{background:rgba(255,255,255,.12)}
.l3-credit{position:absolute;right:12px;bottom:6px;z-index:5;font-size:9.5px;color:rgba(255,255,255,.35)}
`;
