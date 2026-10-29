"use client";

/**
 * /v1/conquistas — "Sala das Sombras": a patente do seller pelo faturamento
 * da vida toda, a trilha até o topo e os prêmios da campanha.
 *
 * Só leitura: usa o faturamento de /api/user/dashboard-stats (o mesmo da
 * pílula "Faturamento" do topo). Patentes e prêmios em src/lib/ranks.ts.
 */
import { useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { Check, Lock, Trophy } from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import { StatusBadge } from "@/components/PanelBits";
import { useAuth } from "@/contexts/AuthContext";
import { useValuesVisible } from "@/lib/useValuesVisible";
import { PRIZES, RANKS, fmtShort, rankFor } from "@/lib/ranks";

const API = "https://shadowpay-backend.onrender.com";

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

function ConquistasContent() {
  const { token } = useAuth();
  const [valuesVisible, toggleValues] = useValuesVisible();
  const [revenue, setRevenue] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/user/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setRevenue(Number(r.data?.data?.grossRevenue) || 0))
      .catch(() => setRevenue(0));
  }, [token]);

  const v = revenue ?? 0;
  const r = rankFor(v);
  const hide = (s: string) => (valuesVisible ? s : "••••••");

  return (
    <>
      <Head>
        <title>ShadowPay — Conquistas</title>
      </Head>
      <LightShell valuesVisible={valuesVisible} onToggleValues={toggleValues}>
        <header className="mb-6">
          <h1 className="text-[22px] font-semibold text-slate-900 sm:text-[26px]">Conquistas</h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Sua patente sobe a cada marco de faturamento. Aqui fica a sua trilha até o topo.
          </p>
        </header>

        {/* PRÓXIMO ALVO */}
        <section className="sp-trophy-hero sp-glow relative mb-6 overflow-hidden rounded-2xl p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {r.next ? (
                <span className="sp-trophy-pill inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums">
                  {valuesVisible ? `Faltam ${brl(r.missing)}` : "Faltam ••••••"}
                </span>
              ) : (
                <span className="sp-trophy-pill inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold">
                  Patente máxima
                </span>
              )}
              <p className="sp-trophy-sub mt-4 text-[13.5px] font-medium">
                {r.next ? "Próxima patente" : "Sua patente"}
              </p>
              <h2 className="sp-trophy-title mt-1 text-[28px] font-semibold leading-tight sm:text-[34px]">
                {r.next ? r.next.name : r.current.name}
              </h2>
              <p className="sp-trophy-quote mt-3 border-l-2 pl-3 text-[13.5px] italic">
                “{r.current.tagline}”
              </p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="sp-trophy-sub text-[13px] font-medium">Você é</p>
              <p className="sp-trophy-title text-[18px] font-semibold">{r.current.name}</p>
              <p className="sp-trophy-pct mt-1 text-[44px] font-semibold leading-none tabular-nums">
                {Math.floor(r.pct)}%
              </p>
            </div>
          </div>
          <div className="mt-6">
            <div className="sp-trophy-track h-2.5 overflow-hidden rounded-full">
              <span
                className="sp-trophy-fill block h-full rounded-full"
                style={{ width: `${v > 0 ? Math.max(r.pct, 2) : 0}%`, transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)" }}
              />
            </div>
            <div className="sp-trophy-sub mt-2 flex justify-between text-[12px] tabular-nums">
              <span>{hide(fmtShort(r.current.min))}</span>
              <span>{hide(brl(v))}</span>
              <span>{r.next ? fmtShort(r.next.min) : "—"}</span>
            </div>
          </div>
        </section>

        {/* TRILHA DAS PATENTES */}
        <section className="mb-6">
          <h2 className="mb-3 text-[16px] font-semibold text-slate-900">Trilha das patentes</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            {RANKS.map((rank, i) => {
              const state = i < r.idx ? "done" : i === r.idx ? "current" : "locked";
              return (
                <div
                  key={rank.name}
                  className={`sp-kpi relative flex flex-col items-center rounded-2xl p-4 text-center ${
                    state === "current" ? "sp-kpi-hero sp-glow" : ""
                  } ${state === "locked" ? "sp-rank-locked" : ""}`}
                >
                  <span
                    className="sp-rank-emblem flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      backgroundImage: "url(/logoshadowpay.png)",
                      backgroundSize: "68%",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                    }}
                    aria-hidden="true"
                  />
                  <p className="sp-kpi-value mt-3 text-[14px] font-semibold leading-tight">{rank.name}</p>
                  <p className="sp-kpi-label mt-1 text-[12.5px] tabular-nums">
                    {rank.min === 0 ? "Início" : fmtShort(rank.min)}
                  </p>
                  <span className="mt-2.5">
                    {state === "done" ? (
                      <StatusBadge tone="green">Conquistada</StatusBadge>
                    ) : state === "current" ? (
                      <span className="sp-trophy-pill inline-flex rounded-full px-2 py-0.5 text-[12px] font-semibold">Atual</span>
                    ) : (
                      <StatusBadge tone="gray" plain>
                        Bloqueada
                      </StatusBadge>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* PRÊMIOS DA CAMPANHA */}
        <section className="mb-10">
          <h2 className="text-[16px] font-semibold text-slate-900">Prêmios da campanha</h2>
          <p className="mb-3 mt-0.5 text-[13.5px] text-slate-500">Bateu o marco de faturamento, o prêmio é seu.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PRIZES.map((p) => {
              const unlocked = v >= p.target;
              const pct = Math.min(100, (v / p.target) * 100);
              return (
                <div key={p.target} className="sp-kpi flex flex-col rounded-2xl p-5">
                  <div className="sp-plaque flex flex-col items-center rounded-xl px-4 py-6">
                    <p className="text-[11px] font-semibold tracking-wide text-[#9CA3AF]">ShadowPay</p>
                    <span
                      className="my-3 flex h-14 w-14 items-center justify-center rounded-full"
                      style={{ background: unlocked ? "rgba(251,191,36,0.16)" : "rgba(255,255,255,0.06)" }}
                    >
                      {unlocked ? (
                        <Trophy className="h-7 w-7" style={{ color: "#FBBF24" }} />
                      ) : (
                        <Lock className="h-6 w-6" style={{ color: "#8B8B93" }} />
                      )}
                    </span>
                    <p className="text-[32px] font-extrabold leading-none text-white">{fmtShort(p.target).replace("R$ ", "")}</p>
                    <p className="mt-1.5 text-[12px] font-semibold text-[#D1D5DB]">em faturamento</p>
                  </div>
                  <p className="sp-kpi-value mt-4 text-[15px] font-semibold">{p.prize}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {unlocked ? (
                      <StatusBadge tone="green" plain>
                        <Check className="h-3 w-3" /> Desbloqueado
                      </StatusBadge>
                    ) : (
                      <span className="sp-kpi-label text-[12.5px] tabular-nums">
                        {valuesVisible ? `Faltam ${fmtShort(p.target - v)}` : "Faltam ••••••"}
                      </span>
                    )}
                    <span className="sp-kpi-label text-[12.5px] tabular-nums">{Math.floor(pct)}%</span>
                  </div>
                  <div className="sp-trophy-track mt-2 h-1.5 overflow-hidden rounded-full">
                    <span className="sp-trophy-fill block h-full rounded-full" style={{ width: `${v > 0 ? Math.max(pct, 2) : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function ConquistasPage() {
  return (
    <ProtectedRoute>
      <ConquistasContent />
    </ProtectedRoute>
  );
}
