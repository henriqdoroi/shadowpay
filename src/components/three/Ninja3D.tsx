import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

/* Ninja oficial da ShadowPay em 3D: a silhueta (traçada do PNG oficial e
 * salva em /login/ninja-shape.json, coords 0..1) é extrudada com chanfro;
 * a frente recebe a arte original (/shadow-ninja-icon.png, mesmo recorte)
 * e as laterais são violeta metálico. Tamanho: 1 unidade de altura. */

const ICON = "/shadow-ninja-icon.png";
const SHAPE_URL = "/login/ninja-shape.json";

let shapeCache: [number, number][] | null = null;

export default function Ninja3D({ depth = 0.16, ...props }: { depth?: number } & JSX.IntrinsicElements["group"]) {
  const [pts, setPts] = useState<[number, number][] | null>(shapeCache);
  const tex = useTexture(ICON);

  useEffect(() => {
    if (shapeCache) return;
    let alive = true;
    fetch(SHAPE_URL).then((r) => r.json()).then((j: { shapes: [number, number][][] }) => {
      shapeCache = j.shapes[0] ?? null;
      if (alive) setPts(shapeCache);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const geo = useMemo(() => {
    if (!pts || pts.length < 3) return null;
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.018, bevelSegments: 6, curveSegments: 8,
    });
    g.translate(-0.5, -0.5, -depth / 2);
    g.computeVertexNormals();
    return g;
  }, [pts, depth]);

  const mats = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 8;
    const face = new THREE.MeshPhysicalMaterial({
      map: tex, emissiveMap: tex, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.35,
      roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.12,
    });
    const side = new THREE.MeshPhysicalMaterial({
      color: "#5b21b6", metalness: 0.85, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08,
    });
    return [face, side];
  }, [tex]);

  if (!geo) return null;
  return (
    <group {...props}>
      <mesh geometry={geo} material={mats} castShadow />
    </group>
  );
}
