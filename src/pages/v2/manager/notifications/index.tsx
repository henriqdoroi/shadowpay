"use client";

/**
 * /v2/manager/notifications — o admin edita os textos das notificações push
 * que TODOS os sellers recebem (venda gerada, venda aprovada, saque pago),
 * liga/desliga cada tipo, vê a prévia ao vivo e manda um teste pra si mesmo.
 */
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { BellRing, Loader2, RotateCcw, Save, Smartphone } from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/axiosErrors";
import {
  EventCard,
  type PushEventInfo,
  type PushKind,
  type PushTemplates,
} from "@/components/admin/PushTemplateEditor";

const API = "https://shadowpay-backend.onrender.com";

const T = {
  primary: "#7C3AED",
  primarySoft: "rgba(124,58,237,0.08)",
  border: "rgba(15,23,42,0.08)",
};

const PLATFORM_LABEL: Record<string, string> = {
  android: "Android",
  ios: "iPhone",
  desktop: "Computador",
  other: "Outros",
};

function NotificationsAdmin() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<PushEventInfo[]>([]);
  const [saved, setSaved] = useState<PushTemplates | null>(null);
  const [draft, setDraft] = useState<PushTemplates | null>(null);
  const [stats, setStats] = useState<{ devices: number; sellers: number; byPlatform: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<PushKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [t, s] = await Promise.all([
          axios.get(`${API}/api/admin/push/templates`, { headers }),
          axios.get(`${API}/api/admin/push/stats`, { headers }),
        ]);
        setEvents(t.data?.data?.events || []);
        setSaved(t.data?.data?.templates || null);
        setDraft(t.data?.data?.templates || null);
        setStats(s.data?.data || null);
      } catch (e) {
        setError(apiErrorMessage(e, "Não consegui carregar as notificações."));
      } finally {
        setLoading(false);
      }
    })();
  }, [token, headers]);

  const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved);

  const save = async (templates: Partial<PushTemplates>) => {
    setSaving(true);
    try {
      const r = await axios.post(`${API}/api/admin/push/templates`, { templates }, { headers });
      setSaved(r.data?.data?.templates);
      setDraft(r.data?.data?.templates);
      toast.success(r.data?.message || "Notificações salvas.");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui salvar."));
    } finally {
      setSaving(false);
    }
  };

  const test = async (kind: PushKind) => {
    if (!draft) return;
    setTesting(kind);
    try {
      const r = await axios.post(
        `${API}/api/admin/push/templates/test`,
        { kind, title: draft[kind].title, body: draft[kind].body },
        { headers },
      );
      if (r.data?.success) toast.success(r.data.message, { duration: 7000 });
      else toast.error(r.data?.message || "Não consegui enviar o teste.", { duration: 9000 });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui enviar o teste."));
    } finally {
      setTesting(null);
    }
  };

  return (
    <>
      <Head>
        <title>ShadowPay — Notificações</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">Admin</p>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-[28px]">Notificações push</h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Os textos que todos os sellers recebem no celular. As alterações valem na hora, para todos.
          </p>
        </header>

        {!user?.isAdministrator ? (
          <div className="rounded-2xl bg-white p-6 text-[14px] text-slate-600" style={{ border: `1px solid ${T.border}` }}>
            Acesso restrito a administradores.
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-white" style={{ border: `1px solid ${T.border}` }} />
            ))}
          </div>
        ) : error || !draft ? (
          <div className="rounded-2xl bg-white p-6 text-[14px] text-rose-600" style={{ border: `1px solid ${T.border}` }}>
            {error || "Não consegui carregar as notificações."}
          </div>
        ) : (
          <div className="space-y-5 pb-24">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${T.border}` }}>
                <p className="text-[12px] font-medium text-slate-500">Aparelhos recebendo</p>
                <p className="mt-1 text-[24px] font-extrabold text-slate-900">{stats?.devices ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${T.border}` }}>
                <p className="text-[12px] font-medium text-slate-500">Sellers com push ativo</p>
                <p className="mt-1 text-[24px] font-extrabold text-slate-900">{stats?.sellers ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${T.border}` }}>
                <p className="text-[12px] font-medium text-slate-500">Por plataforma</p>
                <p className="mt-2 text-[13px] font-semibold text-slate-700">
                  {stats && Object.keys(stats.byPlatform).length
                    ? Object.entries(stats.byPlatform)
                        .map(([k, n]) => `${PLATFORM_LABEL[k] || k}: ${n}`)
                        .join(" · ")
                    : "Nenhum aparelho ainda"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl p-4" style={{ background: T.primarySoft }}>
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: T.primary }} />
              <p className="text-[12.5px] text-slate-600">
                O “enviar teste” chega nos aparelhos onde <b>você</b> ativou as notificações.{" "}
                <Link href="/v1/configs/notifications" className="font-semibold underline" style={{ color: T.primary }}>
                  Ativar neste aparelho
                </Link>
              </p>
            </div>

            {events.map((info) => (
              <EventCard
                key={info.kind}
                info={info}
                value={draft[info.kind]}
                onChange={(v) => setDraft((d) => (d ? { ...d, [info.kind]: v } : d))}
                onTest={() => test(info.kind)}
                testing={testing === info.kind}
              />
            ))}

            <div
              className="sticky bottom-4 z-10 flex flex-col gap-2 rounded-2xl bg-white/95 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
              style={{ border: `1px solid ${T.border}`, boxShadow: "0 16px 40px -20px rgba(15,23,42,0.35)" }}
            >
              <p className="flex items-center gap-2 px-1 text-[12.5px] text-slate-500">
                <BellRing className="h-4 w-4" style={{ color: T.primary }} />
                {dirty ? "Alterações não salvas" : "Tudo salvo"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (window.confirm("Voltar todos os textos para o padrão da ShadowPay?")) save({});
                  }}
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <RotateCcw className="h-4 w-4" /> Restaurar padrão
                </button>
                <button
                  onClick={() => save(draft)}
                  disabled={!dirty || saving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-bold text-white transition-opacity disabled:opacity-50"
                  style={{ background: T.primary }}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar para todos
                </button>
              </div>
            </div>
          </div>
        )}
      </LightShell>
    </>
  );
}

export default function NotificationsAdminPage() {
  return (
    <ProtectedRoute>
      <NotificationsAdmin />
    </ProtectedRoute>
  );
}
