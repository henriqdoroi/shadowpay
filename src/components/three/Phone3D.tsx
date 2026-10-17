import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/* iPhone 18 Pro Max modelado em código (unidades ~ 1 = 10 cm):
 * corpo de titânio extrudado com chanfro, vidro frontal, tela viva (canvas
 * desenhado a cada quadro → textura) com a tela de bloqueio recebendo
 * notificações de venda da ShadowPay, Dynamic Island, botões e módulo
 * triplo de câmeras atrás. */

const W = 0.78, H = 1.63, D = 0.082, R = 0.118;
const SW = W - 0.058, SH = H - 0.058, SR = R - 0.03; // tela
const CW = 600, CH = Math.round((CW * SH) / SW);       // canvas da tela
const FONT = `-apple-system, "SF Pro Display", "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif`;
const ICON = "/shadow-ninja-icon.png";

const SALES = [
  ["Mentoria Escala", 997], ["Consultoria VIP", 1490], ["Kit Premium", 289.9], ["Curso Lançamento", 297],
  ["Comunidade Elite", 197], ["Acesso Vitalício", 890], ["Workshop Tráfego", 540], ["Assinatura Pro", 79.9],
] as const;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function rrShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/* ShapeGeometry com UV normalizado 0..1 (pra textura cobrir a tela inteira) */
function flatGeo(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(rrShape(w, h, r), 32);
  const pos = g.attributes.position!;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + w / 2) / w;
    uv[i * 2 + 1] = (pos.getY(i) + h / 2) / h;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type N = { id: number; name: string; value: number; born: number; y: number };

export default function Phone3D({ active = true, every = 2.1, max = 4, ...props }: { active?: boolean; every?: number; max?: number } & JSX.IntrinsicElements["group"]) {
  const canvas = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = CW; c.height = CH;
    return c;
  }, []);
  const texture = useMemo(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [canvas]);
  const icon = useRef<HTMLImageElement | null>(null);
  const list = useRef<N[]>([]);
  const seq = useRef(0);
  const clock = useRef({ t: 0, last: -99, acc: 0 });

  useEffect(() => {
    const im = new Image();
    im.src = ICON;
    im.onload = () => { icon.current = im; };
  }, []);
  useEffect(() => { if (!active) { list.current = []; clock.current.last = -99; } }, [active]);

  const geos = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(rrShape(W - 0.02, H - 0.02, R - 0.01), {
      depth: D - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 8, curveSegments: 32,
    });
    body.translate(0, 0, -(D - 0.02) / 2);
    return {
      body,
      glass: flatGeo(W - 0.012, H - 0.012, R - 0.006),
      screen: flatGeo(SW, SH, SR),
      back: flatGeo(W - 0.03, H - 0.03, R - 0.015),
      plateau: new THREE.ExtrudeGeometry(rrShape(0.36, 0.36, 0.09), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 4, curveSegments: 24 }),
    };
  }, []);

  const mats = useMemo(() => ({
    titanium: new THREE.MeshPhysicalMaterial({ color: "#3a3150", metalness: 1, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    bezel: new THREE.MeshPhysicalMaterial({ color: "#030305", metalness: 0.2, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 }),
    screen: new THREE.MeshBasicMaterial({ map: texture ?? undefined, toneMapped: false }),
    glare: new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 1, roughness: 0.02, transparent: true, opacity: 0.09, depthWrite: false }),
    backGlass: new THREE.MeshPhysicalMaterial({ color: "#3b2f5c", metalness: 0.4, roughness: 0.45, clearcoat: 1, clearcoatRoughness: 0.35 }),
    lens: new THREE.MeshPhysicalMaterial({ color: "#05040a", metalness: 0.6, roughness: 0.05, clearcoat: 1 }),
    ring: new THREE.MeshPhysicalMaterial({ color: "#8f86a8", metalness: 1, roughness: 0.18 }),
  }), [texture]);

  // desenha a tela de bloqueio (~30fps)
  useFrame((_, dt) => {
    const c = clock.current;
    c.t += dt;
    c.acc += dt;
    if (!canvas || !texture || c.acc < 1 / 30) return;
    c.acc = 0;
    const now = c.t;

    if (active && now - c.last >= every) {
      c.last = now;
      const s = SALES[seq.current % SALES.length]!;
      const id = ++seq.current;
      list.current = [{ id, name: s[0], value: s[1], born: now, y: -1 }, ...list.current].slice(0, max);
    }

    const ctx = canvas.getContext("2d")!;
    // papel de parede
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, "#2d1460"); g.addColorStop(0.55, "#120a26"); g.addColorStop(1, "#07040f");
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
    const r1 = ctx.createRadialGradient(CW * 0.2, CH * 0.12, 0, CW * 0.2, CH * 0.12, CW * 0.9);
    r1.addColorStop(0, "rgba(167,139,250,.55)"); r1.addColorStop(1, "rgba(167,139,250,0)");
    ctx.fillStyle = r1; ctx.fillRect(0, 0, CW, CH);
    const r2 = ctx.createRadialGradient(CW * 0.9, CH * 0.78, 0, CW * 0.9, CH * 0.78, CW * 0.8);
    r2.addColorStop(0, "rgba(124,58,237,.55)"); r2.addColorStop(1, "rgba(124,58,237,0)");
    ctx.fillStyle = r2; ctx.fillRect(0, 0, CW, CH);

    const d = new Date();
    const hh = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const dd = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

    // status bar + Dynamic Island
    ctx.fillStyle = "#fff";
    ctx.font = `600 ${CW * 0.042}px ${FONT}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(hh, CW * 0.1, CW * 0.075);
    for (let i = 0; i < 4; i++) { rr(ctx, CW * 0.72 + i * CW * 0.018, CW * 0.085 - i * CW * 0.008, CW * 0.012, CW * 0.012 + i * CW * 0.008, 2); ctx.fill(); }
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2;
    rr(ctx, CW * 0.81, CW * 0.06, CW * 0.075, CW * 0.035, 6); ctx.stroke();
    rr(ctx, CW * 0.815, CW * 0.065, CW * 0.055, CW * 0.025, 4); ctx.fill();
    ctx.fillStyle = "#000";
    rr(ctx, CW * 0.345, CW * 0.035, CW * 0.31, CW * 0.085, CW * 0.0425); ctx.fill();
    ctx.fillStyle = "#11101a"; ctx.beginPath(); ctx.arc(CW * 0.61, CW * 0.0775, CW * 0.016, 0, Math.PI * 2); ctx.fill();

    // relógio
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.font = `600 ${CW * 0.046}px ${FONT}`;
    ctx.fillText(dd.charAt(0).toUpperCase() + dd.slice(1), CW / 2, CH * 0.115);
    ctx.fillStyle = "rgba(255,255,255,.94)";
    ctx.font = `700 ${CW * 0.25}px ${FONT}`;
    ctx.fillText(hh, CW / 2, CH * 0.2);

    // notificações
    const x0 = CW * 0.05, cw = CW * 0.9, ch = CW * 0.2, gap = CW * 0.022, top = CH * 0.34;
    list.current.forEach((n, i) => {
      const target = top + i * (ch + gap);
      if (n.y < 0) n.y = target - ch * 0.9;
      n.y += (target - n.y) * 0.22;
      const age = now - n.born;
      const a = Math.min(1, age / 0.35) * (i >= max - 1 ? 0.45 : 1 - i * 0.1);
      const sc = 1 - i * 0.025;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(CW / 2, n.y + ch / 2);
      ctx.scale(sc, sc);
      ctx.translate(-CW / 2, -(n.y + ch / 2));
      rr(ctx, x0, n.y, cw, ch, CW * 0.06);
      ctx.fillStyle = "rgba(255,255,255,.17)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.lineWidth = 1.5; ctx.stroke();
      // ícone
      const ix = x0 + CW * 0.035, iy = n.y + (ch - CW * 0.12) / 2, is = CW * 0.12;
      const ig = ctx.createLinearGradient(ix, iy, ix + is, iy + is);
      ig.addColorStop(0, "#2a1755"); ig.addColorStop(1, "#130b26");
      rr(ctx, ix, iy, is, is, is * 0.24); ctx.fillStyle = ig; ctx.fill();
      if (icon.current) ctx.drawImage(icon.current, ix + is * 0.08, iy + is * 0.08, is * 0.84, is * 0.84);
      // textos
      const tx = ix + is + CW * 0.03;
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,.68)";
      ctx.font = `600 ${CW * 0.032}px ${FONT}`;
      ctx.fillText("SHADOWPAY", tx, n.y + ch * 0.24);
      ctx.textAlign = "right";
      ctx.fillText(i === 0 ? "agora" : `${i * 2} min atrás`, x0 + cw - CW * 0.035, n.y + ch * 0.24);
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${CW * 0.042}px ${FONT}`;
      ctx.fillText("Venda aprovada!", tx, n.y + ch * 0.5);
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.font = `500 ${CW * 0.036}px ${FONT}`;
      const body = `Pix · ${brl(n.value)} — ${n.name}`;
      ctx.fillText(body.length > 34 ? body.slice(0, 33) + "…" : body, tx, n.y + ch * 0.76);
      ctx.restore();
    });

    // atalhos da tela de bloqueio + barra home
    ctx.fillStyle = "rgba(255,255,255,.14)";
    ctx.beginPath(); ctx.arc(CW * 0.17, CH * 0.905, CW * 0.065, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(CW * 0.83, CH * 0.905, CW * 0.065, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.9)";
    rr(ctx, CW * 0.32, CH * 0.972, CW * 0.36, CW * 0.014, CW * 0.007); ctx.fill();

    texture.needsUpdate = true;
  });

  const zf = D / 2 + 0.0005; // frente
  return (
    <group {...props}>
      {/* corpo */}
      <mesh geometry={geos.body} material={mats.titanium} castShadow />
      {/* frente: borda preta + tela + brilho do vidro */}
      <mesh geometry={geos.glass} material={mats.bezel} position={[0, 0, zf]} />
      <mesh geometry={geos.screen} material={mats.screen} position={[0, 0, zf + 0.0006]} />
      <mesh geometry={geos.glass} material={mats.glare} position={[0, 0, zf + 0.0012]} />
      {/* traseira */}
      <mesh geometry={geos.back} material={mats.backGlass} position={[0, 0, -zf]} rotation={[0, Math.PI, 0]} />
      <group position={[0.17, 0.58, -zf - 0.001]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={geos.plateau} material={mats.backGlass} />
        {[[-0.075, 0.075], [-0.075, -0.075], [0.075, 0]].map(([x, y], k) => (
          <group key={k} position={[x!, y!, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={mats.ring}><cylinderGeometry args={[0.066, 0.07, 0.03, 40]} /></mesh>
            <mesh material={mats.lens} position={[0, 0.016, 0]}><cylinderGeometry args={[0.048, 0.048, 0.006, 40]} /></mesh>
          </group>
        ))}
        <mesh position={[0.075, 0.1, 0.02]} material={mats.ring}><sphereGeometry args={[0.018, 16, 16]} /></mesh>
      </group>
      {/* botões */}
      <mesh position={[-W / 2 - 0.004, 0.42, 0]} material={mats.titanium}><boxGeometry args={[0.012, 0.09, 0.03]} /></mesh>
      <mesh position={[-W / 2 - 0.004, 0.26, 0]} material={mats.titanium}><boxGeometry args={[0.012, 0.15, 0.03]} /></mesh>
      <mesh position={[-W / 2 - 0.004, 0.07, 0]} material={mats.titanium}><boxGeometry args={[0.012, 0.15, 0.03]} /></mesh>
      <mesh position={[W / 2 + 0.004, 0.3, 0]} material={mats.titanium}><boxGeometry args={[0.012, 0.22, 0.03]} /></mesh>
      <mesh position={[W / 2 + 0.004, -0.2, 0]} material={mats.bezel}><boxGeometry args={[0.012, 0.13, 0.026]} /></mesh>
    </group>
  );
}
