/**
 * Atribuição de tráfego do checkout — de onde veio a venda.
 *
 * O que é capturado da URL do checkout:
 *  - utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, sck:
 *    vão pra venda e o backend repassa pra UTMify (campos documentados);
 *  - fbclid, gclid, ttclid: ids de clique das plataformas de anúncio — ficam só
 *    na venda da ShadowPay (a UTMify não tem campo pra eles);
 *  - página de origem (document.referrer) só com origem + caminho.
 *
 * Estratégia: ÚLTIMO CLIQUE COM PARÂMETRO, por seller, válido por 30 dias.
 *  - Uma visita com qualquer desses parâmetros substitui o conjunto INTEIRO
 *    (nunca mistura campos de campanhas diferentes).
 *  - Visita sem parâmetros (acesso direto, recarregar a página, voltar pro
 *    checkout depois) NÃO apaga a atribuição salva.
 *  - Chave por seller: o clique num anúncio de uma loja não é atribuído à
 *    venda de outra loja aberta no mesmo navegador.
 *
 * Nada aqui é dado pessoal, e o backend não confia nisso pra valor, status,
 * produto nem seller — é só a origem da venda.
 */
export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "src",
  "sck",
  "fbclid",
  "gclid",
  "ttclid",
] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

export type Attribution = Partial<Record<AttributionKey, string>> & {
  referrer?: string;
  capturedAt: number;
};

const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const storageKey = (sellerId?: string | null) => `sp_attr:${sellerId || "loja"}`;

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const s = value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 255)
    .trim();
  return s && s !== "null" && s !== "undefined" ? s : undefined;
}

/** Só a origem + caminho de um site EXTERNO (sem query string, que pode ter dado pessoal). */
function cleanReferrer(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  try {
    const u = new URL(ref);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    if (typeof window !== "undefined" && u.origin === window.location.origin) return undefined;
    return `${u.origin}${u.pathname}`.slice(0, 400);
  } catch {
    return undefined;
  }
}

/** Parâmetros de rastreamento presentes numa query string. */
export function readAttributionFromSearch(search: string): Partial<Record<AttributionKey, string>> {
  const params = new URLSearchParams(search);
  const out: Partial<Record<AttributionKey, string>> = {};
  for (const k of ATTRIBUTION_KEYS) {
    const v = clean(params.get(k));
    if (v) out[k] = v;
  }
  return out;
}

function load(key: string): Attribution | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const a = JSON.parse(raw) as Attribution;
    if (!a || typeof a.capturedAt !== "number" || Date.now() - a.capturedAt > TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return a;
  } catch {
    return null;
  }
}

function save(key: string, a: Attribution) {
  try {
    window.localStorage.setItem(key, JSON.stringify(a));
  } catch {
    // navegador sem localStorage (aba anônima etc.): vale só pra esta página
  }
}

/**
 * Lê a URL atual e devolve a atribuição vigente deste seller (a da URL, se
 * houver parâmetros; senão a salva nos últimos 30 dias).
 */
export function captureAttribution(sellerId?: string | null): Attribution | null {
  if (typeof window === "undefined") return null;
  const key = storageKey(sellerId);
  const fromUrl = readAttributionFromSearch(window.location.search);
  if (Object.keys(fromUrl).length) {
    const referrer = cleanReferrer(document.referrer);
    const fresh: Attribution = { ...fromUrl, ...(referrer ? { referrer } : {}), capturedAt: Date.now() };
    save(key, fresh);
    return fresh;
  }
  const saved = load(key);
  if (saved) return saved;
  // Sem campanha: pelo menos a página de origem, se veio de outro site.
  const referrer = cleanReferrer(document.referrer);
  return referrer ? { referrer, capturedAt: Date.now() } : null;
}

/** Campos pro POST /api/sales/public (o backend limpa e valida de novo). */
export function attributionPayload(a: Attribution | null): Record<string, string> {
  if (!a) return {};
  const out: Record<string, string> = {};
  for (const k of ATTRIBUTION_KEYS) {
    const v = a[k];
    if (v) out[k] = v;
  }
  if (a.referrer) out.referrer = a.referrer;
  return out;
}
