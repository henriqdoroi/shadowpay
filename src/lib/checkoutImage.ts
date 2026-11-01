/**
 * Imagens do Checkout Builder (banner, produto, bump, depoimento): reduz no
 * próprio navegador e salva como WEBP (mantém fundo transparente). Sai bem
 * abaixo do limite do servidor (~1,5 MB por imagem) — checkout leve no 4G.
 */
import { loadImage, readAsDataUrl } from "./avatar";

export const CHECKOUT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_FILE = 15 * 1024 * 1024;
/** tamanho alvo do data URL (caracteres ≈ bytes × 4/3) */
const TARGET_CHARS = 700_000;

/** Lança Error com mensagem pronta pro usuário. */
export async function makeCheckoutImage(file: File, maxSide = 1600): Promise<string> {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("Use uma imagem JPG, PNG, WEBP ou GIF.");
  if (file.size > MAX_FILE) throw new Error("A imagem passa de 15 MB. Escolha uma menor.");
  let img: HTMLImageElement;
  try {
    img = await loadImage(await readAsDataUrl(file));
  } catch {
    throw new Error("Não consegui abrir essa imagem. Tente outra.");
  }
  const w0 = img.naturalWidth;
  const h0 = img.naturalHeight;
  if (!w0 || !h0) throw new Error("Não consegui abrir essa imagem. Tente outra.");
  let scale = Math.min(1, maxSide / Math.max(w0, h0));
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w0 * scale));
    canvas.height = Math.max(1, Math.round(h0 * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não conseguiu preparar a imagem.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL("image/webp", 0.86);
    if (webp.startsWith("data:image/webp")) {
      if (webp.length <= TARGET_CHARS) return webp;
      for (const q of [0.74, 0.62]) {
        const out = canvas.toDataURL("image/webp", q);
        if (out.length <= TARGET_CHARS) return out;
      }
    } else {
      // navegador sem WEBP (Safari antigo): PNG se couber (mantém
      // transparência); senão JPEG com fundo branco (PNG ignora qualidade)
      const png = canvas.toDataURL("image/png");
      if (png.length <= TARGET_CHARS) return png;
      const flat = document.createElement("canvas");
      flat.width = canvas.width;
      flat.height = canvas.height;
      const fctx = flat.getContext("2d");
      if (fctx) {
        fctx.fillStyle = "#ffffff";
        fctx.fillRect(0, 0, flat.width, flat.height);
        fctx.drawImage(canvas, 0, 0);
        for (const q of [0.86, 0.74, 0.62]) {
          const out = flat.toDataURL("image/jpeg", q);
          if (out.length <= TARGET_CHARS) return out;
        }
      }
    }
    scale *= 0.75;
  }
  throw new Error("Essa imagem ficou pesada demais. Tente uma menor.");
}
