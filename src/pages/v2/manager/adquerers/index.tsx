"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  Plus,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

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

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

export default function AdquerersPage() {
  const [adquirentes, setAdquirentes] = useState<Adquirer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Adquirer>({
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
  });

  const API_BASE = "https://shadowpay-api-production.up.railway.app/api/admin";

  useEffect(() => {
    fetchAdquirentes();
  }, []);

  const fetchAdquirentes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      const res = await fetch(`${API_BASE}/adquerers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);

      const response = await res.json();
      if (!response.success) throw new Error("Falha ao obter adquirentes");
      setAdquirentes(response.data);
    } catch (error) {
      console.error("Erro ao buscar adquirentes:", error);
      toast.error("Erro ao buscar adquirentes");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericFields = [
      "txCashIn",
      "txPercentCashIn",
      "txPercentCashOut",
      "txCashOut",
    ];

    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Token não encontrado");
      setIsSaving(false);
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
    const refLower = form.reference?.trim().toLowerCase() || "";

    if (refLower.includes("medusa")) {
      payload.publicKey = form.publicKey;
      payload.privateKey = form.privateKey;
    }
    if (refLower.includes("pagone")) {
      payload.publicKey = form.publicKey;
      payload.privateKey = form.privateKey;
    }
    if (refLower.includes("xgate")) {
      payload.xgate_id = form.xgate_id;
      payload.xgate_user = form.xgate_user;
      payload.xgate_password = form.xgate_password;
    }
    if (refLower.includes("freepay")) {
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

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erro ao salvar adquirente");
      }

      toast.success(
        form.id
          ? "Adquirente editado com sucesso"
          : "Adquirente criado com sucesso"
      );

      fetchAdquirentes();
      setIsModalOpen(false);
      setIsViewMode(false);
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar adquirente:", error);
      toast.error("Erro ao salvar adquirente: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
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
    });
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      const res = await fetch(`${API_BASE}/adquerers/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !current }),
      });

      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);

      fetchAdquirentes();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const openEditModal = (item: Adquirer, viewOnly = false) => {
    setForm({ ...item });
    setIsViewMode(viewOnly);
    setIsModalOpen(true);
  };

  const getStatusBadge = (active: boolean) =>
    active ? (
      <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-300">
        Ativo
      </span>
    ) : (
      <span className="inline-block rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-rose-300">
        Inativo
      </span>
    );

  const renderConditionalFields = () => {
    const ref = form.reference?.toLowerCase() ?? "";

    if (ref.includes("medusa")) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="privateKey">Chave Privada</Label>
            <Input
              id="privateKey"
              name="privateKey"
              type="password"
              value={form.privateKey}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="license">License</Label>
            <Input
              id="license"
              name="license"
              type="password"
              value={form.license || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
        </div>
      );
    }

    if (ref.includes("xgate")) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="xgate_user">Usuário XGate</Label>
            <Input
              id="xgate_user"
              name="xgate_user"
              value={form.xgate_user || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="xgate_password">Senha XGate</Label>
            <Input
              id="xgate_password"
              name="xgate_password"
              value={form.xgate_password || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="xgate_id">ID XGate</Label>
            <Input
              id="xgate_id"
              name="xgate_id"
              value={form.xgate_id || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
        </div>
      );
    }
    if (ref.includes("medius")) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="privateKey">Chave Privada</Label>
            <Input
              id="privateKey"
              name="privateKey"
              type="password"
              value={form.privateKey || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="company_id">Company Id</Label>
            <Input
              id="company_id"
              name="company_id"
              type="password"
              value={form.company_id || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="passwordfreep">Senha Freepay</Label>
            <Input
              id="passwordfreep"
              name="passwordfreep"
              type="password"
              value={form.passwordfreep || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
        </div>
      );
    }
    if (ref.includes("pagone")) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="privateKey">Chave Privada</Label>
            <Input
              id="privateKey"
              name="privateKey"
              type="password"
              value={form.privateKey || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="publicKey">Chave Publica</Label>
            <Input
              id="publicKey"
              name="publicKey"
              type="password"
              value={form.publicKey || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
        </div>
      );
    }
    if (ref.includes("freepay")) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="privateKey">Chave Privada</Label>
            <Input
              id="privateKey"
              name="privateKey"
              type="password"
              value={form.privateKey || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="company_id">Company Id</Label>
            <Input
              id="company_id"
              name="company_id"
              type="password"
              value={form.company_id || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="passwordfreep">Senha Freepay</Label>
            <Input
              id="passwordfreep"
              name="passwordfreep"
              type="password"
              value={form.passwordfreep || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Head>
        <title>ShadowPay — Adquirentes (Admin)</title>
      </Head>

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            <header className="flex flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white/60 hover:text-white" />
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Adquirentes
                  </h1>
                  <p className="mt-1 text-xs text-white/40">
                    Gerencie integrações com adquirentes (XGate, Medusa,
                    Pagone, Freepay…)
                  </p>
                </div>
              </div>

              <Dialog
                open={isModalOpen}
                onOpenChange={(open) => {
                  if (!open) setIsViewMode(false);
                  setIsModalOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <button
                    onClick={() => {
                      resetForm();
                      setIsViewMode(false);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                      boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Cadastrar novo
                  </button>
                </DialogTrigger>

                <DialogContent className="max-h-[88vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {isViewMode
                        ? "Visualizar Adquirente"
                        : form.id
                        ? "Editar Adquirente"
                        : "Novo Adquirente"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reference">Nome</Label>
                      <Input
                        id="reference"
                        name="reference"
                        value={form.reference}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        name="url"
                        value={form.url}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    {renderConditionalFields()}

                    <div>
                      <Label htmlFor="txCashIn">Taxa Fixa Cash-In (R$)</Label>
                      <Input
                        id="txCashIn"
                        name="txCashIn"
                        type="number"
                        step="0.01"
                        value={form.txCashIn}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="txPercentCashIn">
                        Taxa Percentual Cash-In (%)
                      </Label>
                      <Input
                        id="txPercentCashIn"
                        name="txPercentCashIn"
                        type="number"
                        step="0.01"
                        value={form.txPercentCashIn}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="txCashOut">Taxa Fixa Cash-Out (R$)</Label>
                      <Input
                        id="txCashOut"
                        name="txCashOut"
                        type="number"
                        step="0.01"
                        value={form.txCashOut}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="txPercentCashOut">
                        Taxa Percentual Cash-Out (%)
                      </Label>
                      <Input
                        id="txPercentCashOut"
                        name="txPercentCashOut"
                        type="number"
                        step="0.01"
                        value={form.txPercentCashOut}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    {!isViewMode && (
                      <Button
                        className="cursor-pointer"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving
                          ? "Salvando…"
                          : form.id
                          ? "Atualizar"
                          : "Salvar"}
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="border-b border-white/[0.06] px-5 py-4">
                  <h2
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    <Building2 className="h-4 w-4 text-violet-300" />
                    Adquirentes cadastrados
                  </h2>
                </div>

                <div className="p-4">
                  {adquirentes.length === 0 ? (
                    <div className="py-14 text-center">
                      <Building2 className="mx-auto mb-3 h-7 w-7 text-violet-400/40" />
                      <p className="text-sm font-medium text-white/60">
                        Nenhum adquirente cadastrado
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        Cadastre o primeiro PSP para começar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Cabeçalho desktop */}
                      <div className="hidden grid-cols-12 gap-2 border-b border-white/[0.06] px-4 pb-2 text-[11px] uppercase tracking-wider text-white/40 md:grid">
                        <div className="col-span-3">Nome</div>
                        <div className="col-span-4">URL</div>
                        <div className="col-span-3">Chave APK</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-1 text-right">Ações</div>
                      </div>

                      {adquirentes.map((item) => {
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
                            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04] md:grid md:grid-cols-12 md:items-center md:gap-2"
                          >
                            {/* Mobile */}
                            <div className="space-y-1.5 text-sm md:hidden">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white/90">
                                  {item.reference}
                                </span>
                                {getStatusBadge(item.isActive)}
                              </div>
                              <div className="text-xs text-white/55">
                                <strong className="text-white/65">URL:</strong>{" "}
                                {item.url}
                              </div>
                              <div className="text-xs text-white/55">
                                <strong className="text-white/65">
                                  Chave APK:
                                </strong>{" "}
                                <span className="font-mono">{apk}</span>
                              </div>
                            </div>

                            {/* Desktop */}
                            <div className="hidden font-medium text-white/90 md:col-span-3 md:block">
                              {item.reference}
                            </div>
                            <div className="hidden truncate text-xs text-white/55 md:col-span-4 md:block">
                              {item.url}
                            </div>
                            <div className="hidden font-mono text-xs text-white/55 md:col-span-3 md:block">
                              {apk}
                            </div>
                            <div className="hidden md:col-span-1 md:block">
                              {getStatusBadge(item.isActive)}
                            </div>

                            <div className="flex items-center justify-end gap-1.5 md:col-span-1">
                              <button
                                onClick={() => openEditModal(item, true)}
                                title="Visualizar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(item, false)}
                                title="Editar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  toggleStatus(item.id!, item.isActive)
                                }
                                title={item.isActive ? "Inativar" : "Ativar"}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                              >
                                {item.isActive ? (
                                  <ToggleLeft className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <ToggleRight className="h-4 w-4 text-rose-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        <ShadowPanel />
      </div>
    </>
  );
}
