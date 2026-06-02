"use client";

/**
 * KycGate — verificação OBRIGATÓRIA como popup travado.
 *
 * NÃO redireciona mais. Sempre renderiza a página (dashboard) e, por cima,
 * abre o <KycModal> travado (fundo escuro) enquanto o KYC != APPROVED.
 * Não há aba nem página de KYC — é só o popup.
 *
 * Admin (isAdministrator) e páginas de auth/standalone ignoram o gate.
 * Status cacheado em window.__shadowKycStatus (limpo no logout).
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import KycModal from "@/components/KycModal";

const API = "https://shadowpay-api-production.up.railway.app";

// Páginas onde o popup NÃO aparece (login/cadastro, telas standalone).
const EXCLUDED = ["/auth", "/shadow", "/oauth-ads"];
const isExcluded = (p: string) =>
  EXCLUDED.some((x) => p === x || p.startsWith(x + "/"));

declare global {
  interface Window {
    __shadowKycStatus?: string;
  }
}

export default function KycGate({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<string | null>(
    typeof window !== "undefined" ? window.__shadowKycStatus ?? null : null
  );
  const [checked, setChecked] = useState<boolean>(
    typeof window !== "undefined" && !!window.__shadowKycStatus
  );

  const isAdmin = !!(user as any)?.isAdministrator;

  // Carrega o status do KYC uma vez por sessão. Espera o AuthContext
  // terminar (sem isso, em F5 token=null e dava ruído).
  useEffect(() => {
    if (authLoading) return;
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
        // erro de rede não trava o app
        setKycStatus("APPROVED");
      } finally {
        setChecked(true);
      }
    })();
  }, [authLoading, token, isAdmin]);

  const showModal =
    !authLoading &&
    !!token &&
    !isAdmin &&
    checked &&
    kycStatus !== "APPROVED" &&
    !isExcluded(router.pathname);

  return (
    <>
      {children}
      {showModal && (
        <KycModal
          onApproved={() => {
            if (typeof window !== "undefined")
              window.__shadowKycStatus = "APPROVED";
            setKycStatus("APPROVED");
          }}
        />
      )}
    </>
  );
}

/** Limpa o cache do KYC (chamar no logout). */
export function clearKycCache() {
  if (typeof window !== "undefined") {
    delete window.__shadowKycStatus;
  }
}
