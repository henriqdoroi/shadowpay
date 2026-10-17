/* Ninja da ShadowPay em vetor (viewBox 0 0 200 200), usado na escultura 3D
 * das integrações e no zoom "dentro do olho". O olho direito fica em EYE. */

export const EYE = { x: 126, y: 104 };

const SILHOUETTE =
  "M52 78C30 60 18 40 22 22C40 35 55 55 54 74C58 52 80 30 108 30C142 30 170 58 170 92C170 115 159 134 142 146" +
  "C150 158 156 172 150 188L118 178L108 192L96 178L66 188C60 172 66 158 74 146C62 136 52 122 49 106" +
  "C34 108 18 114 6 120C14 102 30 92 48 88C48 84 50 81 52 78Z";

/** Definições SVG compartilhadas (gradientes). Renderizar uma vez por página. */
export function NinjaDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <linearGradient id="nj-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset=".45" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="nj-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="nj-eye" cx=".5" cy=".5" r=".6">
          <stop offset="0" stopColor="#f5f3ff" />
          <stop offset=".5" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7c3aed" />
        </radialGradient>
        <symbol id="nj-sil" viewBox="0 0 200 200">
          <path d={SILHOUETTE} />
        </symbol>
      </defs>
    </svg>
  );
}

/** Face completa do ninja (camada da frente). */
export function NinjaFace({ eyeGlow = true }: { eyeGlow?: boolean }) {
  return (
    <g>
      <path d={SILHOUETTE} fill="url(#nj-face)" />
      {/* faixa de luz que corre pela superfície */}
      <path d={SILHOUETTE} fill="url(#nj-sweep)" className="nj-sweep" />
      {/* visor escuro */}
      <path d="M62 96C70 66 148 62 160 92C163 122 140 140 110 140C82 140 60 124 62 96Z" fill="#0b0716" />
      {/* máscara de baixo */}
      <path d="M64 114C90 128 132 128 158 110L157 122C134 142 90 142 66 126Z" fill="#7c3aed" />
      {/* olhos bravos */}
      <path d="M78 96L106 104C102 114 86 114 78 96Z" fill={eyeGlow ? "url(#nj-eye)" : "#c4b5fd"} />
      <path d="M142 96L114 104C118 114 134 114 142 96Z" fill={eyeGlow ? "url(#nj-eye)" : "#c4b5fd"} />
      {/* brilho do capuz */}
      <path d="M86 44C104 34 130 36 148 50" stroke="#ede9fe" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  );
}

/** Ninja extrudado: N camadas da silhueta empilhadas em Z + a face na frente. */
export function NinjaSculpture({ layers = 26, depth = 2.2 }: { layers?: number; depth?: number }) {
  const out = [];
  for (let i = layers - 1; i >= 1; i--) {
    const t = i / (layers - 1);
    const c = `rgb(${Math.round(139 - 109 * t)},${Math.round(92 - 80 * t)},${Math.round(246 - 166 * t)})`;
    out.push(
      <div key={i} className="nj-ly" style={{ transform: `translateZ(${-i * depth}px)` }}>
        <svg viewBox="0 0 200 200"><use href="#nj-sil" fill={c} /></svg>
      </div>,
    );
  }
  out.push(
    <div key="face" className="nj-ly">
      <svg viewBox="0 0 200 200"><NinjaFace /></svg>
    </div>,
  );
  return <>{out}</>;
}
