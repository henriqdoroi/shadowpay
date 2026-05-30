"use client";

/**
 * KycGate — bloqueia globalmente todas as páginas até o KYC estar aprovado.
 *
 * Quando o status do seller != APPROVED, redireciona pra /v1/kyc.
 *
 * Whitelist de rotas que NÃO são bloqueadas (mesmo sem KYC aprovado):
 *  - /v1/kyc/* (a própria página de verificação)
 *  - /auth/*  (login / register / etc.)
 *  - /shadow  (cinematic standalone)
 *  - /v1/configs/profile (vê dados do KYC)
 *  - /v2/manager/* (admin é exceção — pode navegar mesmo sem KYC próprio)
 *
 * Admin (isAdministrator) ignora totalmente o gate.
 *
 * Lê o status do KYC via /api/user/kyc na primeira montagem e cache-amos
 * no AuthContext via window.__shadowKyc — invalidado por logout.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck } from "lucide-react";

const API = "https://shadowpay-api-production.up.railway.app";

const WHITELIST_PREFIXES = [
  "/v1/kyc",
  "/auth",
  "/shadow",
  "/v2/manager",
  // Páginas de "Perfil" — o seller pode navegar entre as tabs do perfil
  // mesmo com KYC pendente (precisa preencher endereço, conferir dados…)
  "/v1/configs/profile",
  "/v1/configs/security",
  "/v1/configs/notifications",
  "/v1/configs/integrations",
  "/v1/configs/split",
];

const isWhitelisted = (path: string) =>
  WHITELIST_PREFIXES.some((p) => path === p || path.startsWith(p + "/")) ||
  path === "/";

declare global {
  interface Window {
    __shadowKycStatus?: string;
  }
}

export default function KycGate({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<string | null>(
    typeof window !== "undefined"
      ? window.__shadowKycStatus ?? null
      : null
  );
  const [checked, setChecked] = useState(!!kycStatus);

  // Admin não é bloqueado
  const isAdmin = !!(user as any)?.isAdministrator;

  // Carrega status do KYC uma vez por sessão
  useEffect(() => {
    if (!token || isAdmin) {
      setChecked(true);
      return;
    }
    if (window.__shadowKycStatus) {
      setKycStatus(window.__shadowKycStatus);
      setChecked(true);
      return;
    }
    (async () => {
      try {
        const r = await axios.get(`${API}/api/user/kyc`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const status = String(r.data?.data?.status || "NOT_STARTED");
        window.__shadowKycStatus = status;
        setKycStatus(status);
      } catch {
        // Em caso de erro, permitimos a navegação (não trava o app por
        // problema de rede). Quando voltar online, próxima request resolve.
        setKycStatus("APPROVED");
      } finally {
        setChecked(true);
      }
    })();
  }, [token, isAdmin]);

  // Redirects:
  //  - KYC aprovado + está em /v1/kyc → vai pra dashboard (não faz sentido
  //    o seller "voltar" pra tela de verificação depois de aprovado).
  //  - KYC não aprovado + fora da whitelist → vai pra /v1/kyc.
  useEffect(() => {
    if (!checked || isAdmin) return;

    if (kycStatus === "APPROVED") {
      // Se acabou de logar e foi parar em /v1/kyc, manda pra dashboard.
      if (router.pathname.startsWith("/v1/kyc")) {
        router.replace("/v1/dashboard");
      }
      return;
    }

    if (isWhitelisted(router.pathname)) return;
    router.replace("/v1/kyc");
  }, [checked, kycStatus, isAdmin, router]);

  // Tela de bloqueio elegante enquanto resolve / redireciona
  if (
    !isAdmin &&
    checked &&
    kycStatus !== "APPROVED" &&
    !isWhitelisted(router.pathname)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center"
          style={{
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              background: "rgba(124,58,237,0.08)",
              color: "#7C3AED",
            }}
          >
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="text-[16px] font-bold text-slate-900">
            Verificação obrigatória
          </p>
          <p className="mt-1.5 text-[13px] text-slate-500">
            Para acessar esta página é necessário concluir a verificação KYC
            da sua conta.
          </p>
          <button
            onClick={() => router.push("/v1/kyc")}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-bold text-white"
            style={{
              background: "#7C3AED",
              boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
            }}
          >
            Concluir verificação
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/** Limpa o cache do KYC (chamar no logout). */
export function clearKycCache() {
  if (typeof window !== "undefined") {
    delete window.__shadowKycStatus;
  }
}
