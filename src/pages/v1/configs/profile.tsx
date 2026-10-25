"use client";

/**
 * /v1/configs/profile — Minha conta (mesmo visual do dashboard).
 *
 *  - Perfil: foto, dados da conta e "Segurança" (senha, verificação e 2FA)
 *  - Notificações: instalar o app, push neste aparelho, quais avisos receber
 *    e o texto de cada um
 *
 * Abas pela URL: ?tab=notificacoes · ?secao=seguranca abre a Segurança.
 * (/v1/configs/notifications e /v1/configs/security redirecionam pra cá.)
 */
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import { Bell, RefreshCw, UserRound } from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage, withRetry } from "@/lib/axiosErrors";
import { Button, C, Card } from "@/components/account/ui";
import { ProfileTab, type AccountData } from "@/components/account/ProfileTab";
import { NotificationsTab } from "@/components/account/NotificationsTab";

const API = "https://shadowpay-backend.onrender.com";

type TabId = "perfil" | "notificacoes";
const TABS: { id: TabId; label: string; Icon: typeof Bell }[] = [
  { id: "perfil", label: "Perfil", Icon: UserRound },
  { id: "notificacoes", label: "Notificações", Icon: Bell },
];

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col items-center gap-4">
        <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-slate-100" />
        <div className="h-14 w-full animate-pulse rounded-xl bg-slate-50" />
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <div className="mb-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
            <div className="h-11 animate-pulse rounded-xl bg-slate-50" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountContent() {
  const router = useRouter();
  const { token, user } = useAuth();
  const tab: TabId = router.query.tab === "notificacoes" ? "notificacoes" : "perfil";
  const openSecurity = router.query.secao === "seguranca";

  const [account, setAccount] = useState<AccountData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token) return;
    setError(null);
    withRetry(() => axios.get(`${API}/api/user/account`, { headers: { Authorization: `Bearer ${token}` } }))
      .then((r) => setAccount(r.data?.data || null))
      .catch((e) => setError(apiErrorMessage(e, "Não consegui carregar seus dados.")));
  }, [token, reload]);

  const goTab = (t: TabId) =>
    router.replace({ pathname: router.pathname, query: t === "perfil" ? {} : { tab: t } }, undefined, { shallow: true, scroll: false });

  const name = account?.companyName || user?.companyName || "Minha conta";

  return (
    <>
      <Head>
        <title>ShadowPay — Minha conta</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <h1 className="truncate text-[22px] font-semibold text-slate-900 sm:text-[26px]">{name}</h1>
          <p className="mt-1 text-[14px] text-slate-500">Seus dados, segurança e notificações.</p>
        </header>

        <Card className="mb-10">
          <div role="tablist" aria-label="Minha conta" className="flex gap-1 border-b border-[#E6E8EB] px-2 sm:px-5">
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => goTab(id)}
                  className="relative flex shrink-0 items-center gap-2 px-3.5 py-4 text-[14px] font-semibold transition-colors"
                  style={{ color: active ? C.primary : "#64748B" }}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full" style={{ background: C.primary }} />}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-8">
            {tab === "notificacoes" ? (
              <NotificationsTab />
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-[14px] text-slate-600">{error}</p>
                <Button variant="outline" onClick={() => setReload((n) => n + 1)} icon={<RefreshCw className="h-4 w-4" />}>
                  Tentar de novo
                </Button>
              </div>
            ) : !account ? (
              <ProfileSkeleton />
            ) : (
              <ProfileTab account={account} openSecurity={openSecurity} onChange={(p) => setAccount((a) => (a ? { ...a, ...p } : a))} />
            )}
          </div>
        </Card>
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}
