/**
 * Foto de perfil: recorta no centro (quadrado) e reduz pra 320px no próprio
 * navegador. Sai um JPEG de ~20–40 KB — o backend guarda como data URL.
 */
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";
export const AVATAR_MAX_BYTES = 10 * 1024 * 1024; // arquivo original: até 10 MB

const SIZE = 320;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("read"));
    fr.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("decode"));
    im.src = src;
  });
}

/** Valida e converte a foto escolhida. Lança Error com mensagem pronta pro usuário. */
export async function makeAvatar(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error("Use uma imagem JPG, PNG ou WEBP.");
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error("A imagem passa de 10 MB. Escolha uma menor.");
  }
  let img: HTMLImageElement;
  try {
    img = await loadImage(await readAsDataUrl(file));
  } catch {
    throw new Error("Não consegui abrir essa imagem. Tente outra.");
  }
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) throw new Error("Não consegui abrir essa imagem. Tente outra.");
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu preparar a foto.");
  // fundo branco (PNG transparente não fica preto no JPEG)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2,
    (img.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  return canvas.toDataURL("image/jpeg", 0.86);
}
