"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { toast } from "sonner";
import {
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  Plus,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API_BASE =
  "https://shadowpay-api-production.up.railway.app/api/admin";

interface Adquirer {
  id?: string;
  reference: string;
  url: string;
  txCashIn: number;
  txPercentCashIn: number;
  txPercentCashOut: number;
  txCashOut: number;
  publicKey: string;
  privateKey: string;
  isActive: boolean;
  license?: string;
  passwordfreep: string;
  xgate_id?: string;
  xgate_user?: string;
  xgate_password?: string;
  company_id?: string;
}

const empty: Adquirer = {
  reference: "",
  url: "",
  passwordfreep: "",
  txCashIn: 0,
  txPercentCashIn: 0,
  txPercentCashOut: 0,
  txCashOut: 0,
  publicKey: "",
  privateKey: "",
  company_id: "",
  isActive: true,
  xgate_user: "",
  xgate_password: "",
  xgate_id: "",
};

function AdquerersContent() {
  const [list, setList] = useState<Adquirer[]>([]);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Adquirer>(empty);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");
      const res = await fetch(`${API_BASE}/adquerers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const j = await res.json();
      if (!j.success) throw new Error("Falha ao obter adquirentes");
      setList(j.data);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao buscar adquirentes");
    }
  };

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nums = ["txCashIn", "txPercentCashIn", "txPercentCashOut", "txCashOut"];
    setForm((p) => ({
      ...p,
      [name]: nums.includes(name) ? Number(value) : value,
    }));
  };

  const save = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Token não encontrado");
      setSaving(false);
      return;
    }
    let payload: Partial<Adquirer> = {
      reference: form.reference,
      url: form.url,
      txCashIn: form.txCashIn,
      txPercentCashIn: form.txPercentCashIn,
      txPercentCashOut: form.txPercentCashOut,
      txCashOut: form.txCashOut,
      isActive: form.isActive,
      publicKey: form.publicKey,
      privateKey: form.privateKey,
    };
    const ref = form.reference?.trim().toLowerCase() || "";
    if (ref.includes("xgate")) {
      payload.xgate_id = form.xgate_id;
      payload.xgate_user = form.xgate_user;
      payload.xgate_password = form.xgate_password;
    }
    if (ref.includes("freepay")) {
      payload.company_id = form.company_id;
      payload.privateKey = form.privateKey;
      payload.passwordfreep = form.passwordfreep;
    }
    try {
      const res = await fetch(
        form.id ? `${API_BASE}/adquerers/${form.id}` : `${API_BASE}/adquerers`,
        {
          method: form.id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const d = await res.json();
      if (!res.ok || !d.success)
        throw new Error(d.message || "Erro ao salvar");
      toast.success(form.id ? "Editado" : "Criado");
      fetchAll();
      setOpen(false);
      setViewMode(false);
      setForm(empty);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: string, current: boolean) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/adquerers/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) return;
      fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const edit = (item: Adquirer, viewOnly = false) => {
    setForm({ ...item });
    setViewMode(viewOnly);
    setOpen(true);
  };

  const statusBadge = (a: boolean) =>
    a ? (
      <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        Ativo
      </span>
    ) : (
      <span className="inline-block rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
        Inativo
      </span>
    );

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  const condFields = () => {
    const ref = form.reference?.toLowerCase() ?? "";
    if (ref.includes("medusa") || ref.includes("pagone")) {
      return (
        <>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">
              Chave privada
            </label>
            <input
              type="password"
              name="privateKey"
              value={form.privateKey || ""}
              onChange={change}
              disabled={viewMode}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">
              Chave pública
            </label>
            <input
              type="password"
              name="publicKey"
              value={form.publicKey || ""}
              onChange={change}
              disabled={viewMode}
              className={inputCls}
            />
          </div>
        </>
      );
    }
    if (ref.includes("xgate")) {
      return (
        <>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">
              Usuário XGate
            </label>
            <input
              name="xgate_user"
              value={form.xgate_user || ""}
              onChange={change}
              disabled={viewMode}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">
              Senha XGate
            </label>
            <input
              name="xgate_password"
              value={form.xgate_password || ""}
              onChange={change}
              disabled={viewMode}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">
              ID XGate
            </label>
            <input
              name="xgate_id"
              value={form.xgate_id || ""}
              onChange={change}
              disabled={viewMode}
              className={inputCls}
            />
          </div>
        </>
      );
    }
    if (ref.includes("freepay")) {
      return (
        <>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">
              Chave privada
            </label>
            <input
              type="password"
              name="privateKey"
              value={form.privateKey || ""}
              onChange={change}
              disabled={viewMode}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">
              Company ID
            </label>
            <input
              type="password"
              name="company_id"
              value={form.company_id || ""}
              onChange={change}
              disabled={viewMode}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">
              Senha Freepay
            </label>
            <input
              type="password"
              name="passwordfreep"
              value={form.passwordfreep || ""}
              onChange={change}
              disabled={viewMode}
              className={inputCls}
            />
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <>
      <Head>
        <title>ShadowPay — Adquirentes (Admin)</title>
      </Head>
      <LightShell>
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
              Admin
            </p>
            <h1
              className="text-[28px] font-bold tracking-tight text-slate-900"
              style={{
                fontFamily: "'Clash Display', sans-serif",
                letterSpacing: "-0.005em",
              }}
            >
              Adquirentes
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Gerencie integrações com adquirentes (XGate, Medusa, Pagone,
              Freepay…).
            </p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              if (!o) setViewMode(false);
              setOpen(o);
            }}
          >
            <DialogTrigger asChild>
              <button
                onClick={() => {
                  setForm(empty);
                  setViewMode(false);
                  setOpen(true);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{
                  background: "#7C3AED",
                  boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
                }}
              >
                <Plus className="h-4 w-4" />
                Cadastrar novo
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {viewMode
                    ? "Visualizar Adquirente"
                    : form.id
                    ? "Editar Adquirente"
                    : "Novo Adquirente"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">
                    Nome
                  </label>
                  <input
                    name="reference"
                    value={form.reference}
                    onChange={change}
                    disabled={viewMode}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">
                    URL
                  </label>
                  <input
                    name="url"
                    value={form.url}
                    onChange={change}
                    disabled={viewMode}
                    className={inputCls}
                  />
                </div>
                {condFields()}
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">
                    Taxa fixa Cash-In (R$)
                  </label>
                  <input
                    name="txCashIn"
                    type="number"
                    step="0.01"
                    value={form.txCashIn}
                    onChange={change}
                    disabled={viewMode}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">
                    Taxa % Cash-In
                  </label>
                  <input
                    name="txPercentCashIn"
                    type="number"
                    step="0.01"
                    value={form.txPercentCashIn}
                    onChange={change}
                    disabled={viewMode}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">
                    Taxa fixa Cash-Out (R$)
                  </label>
                  <input
                    name="txCashOut"
                    type="number"
                    step="0.01"
                    value={form.txCashOut}
                    onChange={change}
                    disabled={viewMode}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">
                    Taxa % Cash-Out
                  </label>
                  <input
                    name="txPercentCashOut"
                    type="number"
                    step="0.01"
                    value={form.txPercentCashOut}
                    onChange={change}
                    disabled={viewMode}
                    className={inputCls}
                  />
                </div>

                {!viewMode && (
                  <button
                    onClick={save}
                    disabled={saving}
                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: "#7C3AED" }}
                  >
                    {saving ? "Salvando…" : form.id ? "Atualizar" : "Salvar"}
                  </button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h2
              className="flex items-center gap-2 text-[14px] font-semibold text-slate-900"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              <Building2 className="h-4 w-4 text-violet-500" />
              Adquirentes cadastrados
            </h2>
          </div>
          <div className="p-4">
            {list.length === 0 ? (
              <div className="py-14 text-center">
                <Building2 className="mx-auto mb-3 h-7 w-7 text-violet-300" />
                <p className="text-sm font-medium text-slate-600">
                  Nenhum adquirente cadastrado
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Cadastre o primeiro PSP para começar.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden grid-cols-12 gap-2 px-4 pb-2 text-[10px] uppercase tracking-[0.16em] text-slate-400 md:grid">
                  <div className="col-span-3">Nome</div>
                  <div className="col-span-4">URL</div>
                  <div className="col-span-3">Chave APK</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1 text-right">Ações</div>
                </div>
                {list.map((item) => {
                  const apk =
                    item.reference === "FREEPAY"
                      ? item.passwordfreep
                        ? item.passwordfreep.slice(0, 4) + "••••••••"
                        : ""
                      : item.privateKey
                      ? item.privateKey.slice(0, 4) + "••••••••"
                      : item.xgate_user
                      ? item.xgate_user.slice(0, 4) + "••••••••"
                      : "";
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 md:grid md:grid-cols-12 md:items-center md:gap-2"
                    >
                      <div className="space-y-1.5 text-sm md:hidden">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">
                            {item.reference}
                          </span>
                          {statusBadge(item.isActive)}
                        </div>
                        <div className="text-xs text-slate-500">
                          <strong className="text-slate-700">URL:</strong>{" "}
                          {item.url}
                        </div>
                        <div className="text-xs text-slate-500">
                          <strong className="text-slate-700">APK:</strong>{" "}
                          <span className="font-mono">{apk}</span>
                        </div>
                      </div>
                      <div className="hidden font-medium text-slate-900 md:col-span-3 md:block">
                        {item.reference}
                      </div>
                      <div className="hidden truncate text-xs text-slate-500 md:col-span-4 md:block">
                        {item.url}
                      </div>
                      <div className="hidden font-mono text-xs text-slate-500 md:col-span-3 md:block">
                        {apk}
                      </div>
                      <div className="hidden md:col-span-1 md:block">
                        {statusBadge(item.isActive)}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 md:col-span-1">
                        <button
                          onClick={() => edit(item, true)}
                          title="Visualizar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => edit(item, false)}
                          title="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => toggle(item.id!, item.isActive)}
                          title={item.isActive ? "Inativar" : "Ativar"}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        >
                          {item.isActive ? (
                            <ToggleLeft className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ToggleRight className="h-4 w-4 text-rose-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function AdquerersPage() {
  return (
    <ProtectedRoute>
      <AdquerersContent />
    </ProtectedRoute>
  );
}
