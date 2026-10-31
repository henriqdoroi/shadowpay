/**
 * Conta de simulação (subconta DEMO): entrar e voltar pra conta principal.
 *
 * A sessão principal fica guardada em `sp_main_session` enquanto a pessoa
 * está na demo; "Voltar pra minha conta" restaura ela. A conta demo NÃO
 * registra o celular no push (as notificações da simulação vão pros
 * aparelhos da conta principal).
 */
import axios from "axios";
import { apiErrorMessage } from "@/lib/axiosErrors";

const API = "https://shadowpay-backend.onrender.com";
const MAIN_KEY = "sp_main_session";

type Session = { token: string; user: any };

export function readMainSession(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(MAIN_KEY) || "null");
    return s?.token ? s : null;
  } catch {
    return null;
  }
}

export function clearMainSession() {
  try {
    localStorage.removeItem(MAIN_KEY);
  } catch {
    /* ignora */
  }
}

function switchTo(s: Session, to: string) {
  localStorage.setItem("token", s.token);
  localStorage.setItem("user", JSON.stringify(s.user));
  delete (window as any).__shadowKycStatus;
  window.location.href = to;
}

/** Conta principal → conta demo (cria na 1ª vez). */
export async function enterDemo(token: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const r = await axios.post(`${API}/api/user/demo/enter`, {}, { headers: { Authorization: `Bearer ${token}` } });
    const demoToken: string | undefined = r.data?.data?.token;
    if (!demoToken) return { ok: false, message: "Não consegui abrir a conta demo." };
    const p = await axios.get(`${API}/api/user/profile`, { headers: { Authorization: `Bearer ${demoToken}` } });
    let mainUser: any = null;
    try {
      mainUser = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      /* ignora */
    }
    localStorage.setItem(MAIN_KEY, JSON.stringify({ token, user: mainUser }));
    switchTo({ token: demoToken, user: p.data?.data }, "/v1/simulador");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: apiErrorMessage(e, "Não consegui abrir a conta demo.") };
  }
}

/** Conta demo → conta principal. Sem a sessão guardada, pede login de novo. */
export function exitDemo() {
  const main = readMainSession();
  clearMainSession();
  if (!main) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth/jwt/login";
    return;
  }
  switchTo(main, "/v1/dashboard");
}
