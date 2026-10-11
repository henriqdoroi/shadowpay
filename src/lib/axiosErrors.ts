import axios from "axios";

/**
 * O backend devolve erros no formato `{ success:false, error:{ code, message } }`
 * (AllExceptionsFilter), mas as telas leem `e.response.data.message`. Sem isto,
 * qualquer erro HTTP aparecia como mensagem genérica ("Erro ao enviar.") e
 * escondia o motivo real.
 *
 * Este interceptor global copia `error.message` -> `message` e troca páginas de
 * erro não-JSON (ex.: proxy do Render reiniciando) por um texto claro.
 */
const STATUS_MSG: Record<number, string> = {
  401: "Sua sessão expirou. Entre novamente.",
  413: "Arquivo grande demais para enviar.",
  429: "Muitas tentativas seguidas. Aguarde alguns segundos e tente de novo.",
  502: "O servidor está reiniciando. Tente de novo em alguns segundos.",
  503: "O servidor está reiniciando. Tente de novo em alguns segundos.",
  504: "O servidor demorou para responder. Tente de novo em alguns segundos.",
};

// Mensagens padrão (em inglês) do Nest — trocadas pelo texto em português.
const GENERIC_EN = new Set(["Unauthorized", "Forbidden", "Bad Request", "Too Many Requests"]);

export function installAxiosErrorNormalizer() {
  const g = globalThis as any;
  if (g.__spAxiosErrorNormalizer) return;
  g.__spAxiosErrorNormalizer = true;

  axios.interceptors.response.use(undefined, (err) => {
    const res = err?.response;
    if (res) {
      const d = res.data;
      if (d && typeof d === "object") {
        if (!d.message) {
          const backendMsg: string | undefined = d.error?.message;
          const friendly = STATUS_MSG[res.status];
          d.message =
            backendMsg && !(GENERIC_EN.has(backendMsg) && friendly)
              ? backendMsg
              : friendly || backendMsg;
        }
      } else {
        res.data = {
          success: false,
          message: STATUS_MSG[res.status] || `Erro ${res.status} no servidor.`,
        };
      }
    }
    return Promise.reject(err);
  });
}

/** Mensagem pra falha sem resposta (rede caiu / servidor acordando). */
export const OFFLINE_MSG =
  "Não consegui falar com o servidor (ele pode estar reiniciando). Tente de novo em alguns segundos.";

/** Mensagem amigável de um erro do axios, com fallback. */
export function apiErrorMessage(e: any, fallback: string): string {
  if (!e?.response) return OFFLINE_MSG;
  return e.response.data?.message || fallback;
}

/**
 * Repete a chamada em falhas TEMPORÁRIAS (sem resposta, 429, 502, 503, 504) —
 * cobre o Render acordando/trocando de instância. Erros de verdade (400, 401,
 * 500...) sobem na hora.
 */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const st = e?.response?.status;
      const transient = !e?.response || [429, 502, 503, 504].includes(st);
      if (!transient || i >= tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}
