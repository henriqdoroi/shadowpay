"use client";

/**
 * /v1/kyc — Wizard de Verificação da Conta (4 etapas)
 *
 *  Step 1  Dados Cadastrais   → read-only (vindo do Seller)
 *  Step 2  Endereço            → form CEP/Logradouro/...
 *  Step 3  Documento           → 4 uploads (Frente/Verso/Selfie/Contrato)
 *  Step 4  Revisão             → "Em análise" enquanto status=PENDING,
 *                                "Aprovado" quando APPROVED, lista de docs.
 *
 *  Mantém a barra <ProfileTabs /> no topo (Perfil/Segurança/Notif./KYC).
 *
 *  Endpoints reais:
 *   GET   /api/user/kyc
 *   POST  /api/user/kyc/address
 *   POST  /api/user/kyc/documents (multipart)
 *   POST  /api/user/kyc/start
 *
 *  ?step=N na URL controla a etapa atual (1..4).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Briefcase,
  Send,
  FileText,
  ShieldCheck,
  Search,
  Upload,
  Info,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ProfileTabs } from "@/components/ProfileTabs";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primarySoft: "rgba(124,58,237,0.10)",
  primaryBg: "rgba(124,58,237,0.06)",
  border: "rgba(15,23,42,0.08)",
  borderSoft: "rgba(15,23,42,0.06)",
  card: "#FFFFFF",
  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.10)",
  red: "#EF4444",
};

type StepKey = "dados" | "endereco" | "documento" | "revisao";

const STEPS: Array<{
  key: StepKey;
  label: string;
  icon: any;
  helper: { pending: string; current: string; done: string };
}> = [
  {
    key: "dados",
    label: "Dados Cadastrais",
    icon: Briefcase,
    helper: {
      pending: "Visualize seus dados",
      current: "Visualize seus dados",
      done: "Concluído",
    },
  },
  {
    key: "endereco",
    label: "Endereço",
    icon: Send,
    helper: {
      pending: "Pendente",
      current: "Em andamento",
      done: "Concluído",
    },
  },
  {
    key: "documento",
    label: "Documento",
    icon: FileText,
    helper: {
      pending: "Pendente",
      current: "Em andamento",
      done: "Concluído",
    },
  },
  {
    key: "revisao",
    label: "Revisão",
    icon: ShieldCheck,
    helper: {
      pending: "Pendente",
      current: "Em análise",
      done: "Aprovado",
    },
  },
];

function KycContent() {
  const router = useRouter();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);

  // step controlado pela URL — ?step=2 etc.
  const stepIndex = Math.min(
    3,
    Math.max(0, Number(router.query.step) - 1 || 0)
  );
  const currentStep: StepKey = STEPS[stepIndex]!.key;

  const goStep = (n: number) => {
    router.replace(
      { pathname: router.pathname, query: { step: String(n) } },
      undefined,
      { shallow: true }
    );
  };

  // ---------- fetch state ----------
  const fetchKyc = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/user/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) setData(r.data.data);
    } catch (e) {
      console.error("kyc fetch", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ----- progresso e status do stepper -----
  const progress = data?.progress || {
    dadosCadastrais: true,
    endereco: false,
    documentos: false,
    revisao: false,
  };
  const kycStatus = (data?.status || "NOT_STARTED") as
    | "NOT_STARTED"
    | "PENDING"
    | "APPROVED"
    | "BANNED";

  const stepStatus = (idx: number): "done" | "current" | "pending" => {
    const key = STEPS[idx]!.key;
    if (key === "dados") {
      if (idx === stepIndex) return "current";
      return "done";
    }
    if (key === "endereco") {
      if (progress.endereco && idx !== stepIndex) return "done";
      return idx === stepIndex ? "current" : "pending";
    }
    if (key === "documento") {
      if (progress.documentos && idx !== stepIndex) return "done";
      return idx === stepIndex ? "current" : "pending";
    }
    if (key === "revisao") {
      if (kycStatus === "APPROVED") return "done";
      return idx === stepIndex ? "current" : "pending";
    }
    return "pending";
  };

  if (loading || !data) {
    return (
      <>
        <ProfileTabs />
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: T.card,
            border: `1px solid ${T.borderSoft}`,
          }}
        >
          <p className="text-sm text-slate-500">Carregando verificação…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <ProfileTabs />

      {/* HEADER PÁGINA */}
      <header className="mb-6">
        <h1
          className="text-[28px] font-bold tracking-tight text-slate-900"
          style={{ letterSpacing: "-0.005em" }}
        >
          KYC — Verificação da Conta
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-500">
          Complete todas as etapas para verificar sua identidade e liberar
          todas as funcionalidades da plataforma.
        </p>
      </header>

      {/* STEPPER */}
      <div
        className="mb-6 rounded-2xl p-5"
        style={{
          background: T.card,
          border: `1px solid ${T.borderSoft}`,
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {STEPS.map((s, idx) => {
            const status = stepStatus(idx);
            const Icon = s.icon;
            const isLast = idx === STEPS.length - 1;

            return (
              <div
                key={s.key}
                className="relative flex items-center gap-3"
              >
                {/* Bola */}
                <button
                  onClick={() => goStep(idx + 1)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-transform hover:scale-105"
                  style={{
                    background:
                      status === "done"
                        ? T.greenSoft
                        : status === "current"
                        ? T.primary
                        : "rgba(15,23,42,0.04)",
                    color:
                      status === "done"
                        ? T.green
                        : status === "current"
                        ? "#FFFFFF"
                        : T.textMuted,
                    border:
                      status === "current"
                        ? `2px solid ${T.primary}`
                        : status === "done"
                        ? `2px solid ${T.green}`
                        : `2px solid transparent`,
                  }}
                >
                  {status === "done" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </button>

                {/* Texto */}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[13px] font-bold leading-tight"
                    style={{
                      color: status === "pending" ? T.textMuted : T.text,
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{
                      color:
                        status === "current"
                          ? T.primary
                          : status === "done"
                          ? T.green
                          : T.textMuted,
                    }}
                  >
                    {status === "done"
                      ? s.helper.done
                      : status === "current"
                      ? kycStatus === "APPROVED" && s.key === "revisao"
                        ? "Aprovado"
                        : s.helper.current
                      : s.helper.pending}
                  </p>
                </div>

                {/* Linha conectora (desktop) */}
                {!isLast && (
                  <div
                    className="absolute right-[-14px] top-1/2 hidden h-px w-7 -translate-y-1/2 md:block"
                    style={{
                      background:
                        stepStatus(idx + 1) === "pending" &&
                        status === "pending"
                          ? T.border
                          : T.greenSoft,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* LAYOUT 3 COLUNAS — sidebar internal + content + side panel */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns:
            "minmax(0, 220px) minmax(0, 1fr) minmax(0, 320px)",
        }}
      >
        {/* COLUNA 1 — sidebar de etapas */}
        <aside
          className="rounded-2xl p-3"
          style={{
            background: T.card,
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
            height: "fit-content",
          }}
        >
          <ul className="space-y-1">
            {STEPS.map((s, idx) => {
              const status = stepStatus(idx);
              const Icon = s.icon;
              const active = idx === stepIndex;
              return (
                <li key={s.key}>
                  <button
                    onClick={() => goStep(idx + 1)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors"
                    style={{
                      background: active ? T.primarySoft : "transparent",
                      color: active ? T.primary : T.text2,
                    }}
                  >
                    {status === "done" ? (
                      <Check
                        className="h-4 w-4 shrink-0"
                        style={{ color: T.green }}
                      />
                    ) : (
                      <Icon
                        className="h-4 w-4 shrink-0"
                        style={{
                          color: active ? T.primary : T.textMuted,
                        }}
                      />
                    )}
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* COLUNA 2 — conteúdo do step atual */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: T.card,
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          {currentStep === "dados" && (
            <DadosCadastraisStep data={data} onContinue={() => goStep(2)} />
          )}
          {currentStep === "endereco" && (
            <EnderecoStep
              token={token!}
              endereco={data.endereco}
              saving={saving}
              setSaving={setSaving}
              onBack={() => goStep(1)}
              onSaved={async () => {
                await fetchKyc();
                goStep(3);
              }}
            />
          )}
          {currentStep === "documento" && (
            <DocumentosStep
              token={token!}
              docs={data.documentos}
              saving={saving}
              setSaving={setSaving}
              onBack={() => goStep(2)}
              onSubmitted={async () => {
                await fetchKyc();
                goStep(4);
              }}
            />
          )}
          {currentStep === "revisao" && (
            <RevisaoStep data={data} onReload={fetchKyc} />
          )}
        </section>

        {/* COLUNA 3 — painel lateral contextual */}
        <SidePanel step={currentStep} kycStatus={kycStatus} />
      </div>
    </>
  );
}

/* ==============================================================
 * STEP 1 — Dados Cadastrais (read-only)
 * ============================================================ */

function DadosCadastraisStep({
  data,
  onContinue,
}: {
  data: any;
  onContinue: () => void;
}) {
  const d = data.dadosCadastrais || {};
  const fmtDate = (s?: string) => {
    if (!s) return "";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("pt-BR");
  };

  return (
    <>
      <div className="mb-5">
        <h2 className="text-[17px] font-bold text-slate-900">
          Dados Cadastrais
        </h2>
        <p className="mt-0.5 text-[12.5px] text-slate-500">
          Confira os dados da sua conta. Estas informações não podem ser
          alteradas.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReadField label="Nome Completo" value={d.companyName} />
        <ReadField label="E-mail" value={d.email} />
        <ReadField label="CPF / CNPJ" value={d.cpfCnpj} />
        <ReadField
          label="Tipo de Pessoa"
          value={d.tipoPessoa === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
        />
        <ReadField
          label="Data de Nascimento / Abertura"
          value={fmtDate(d.dataNascimentoAbertura)}
        />
        <ReadField label="Telefone" value={d.phone} />
        <ReadField label="ID da Conta" value={d.accountId} />
        <ReadField label="Categoria do Negócio (MCC)" value={d.mcc} />
      </div>

      <div
        className="mt-6 flex items-start gap-3 rounded-xl p-4"
        style={{
          background: T.primaryBg,
          border: `1px solid ${T.borderSoft}`,
        }}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: T.primary }} />
        <div>
          <p className="text-[13px] font-bold text-slate-900">
            Por que não posso alterar?
          </p>
          <p className="mt-0.5 text-[12px] text-slate-600">
            Para garantir a segurança da sua conta e cumprir com as
            regulamentações, os dados cadastrais não podem ser alterados.
            Entre em contato com o suporte se precisar de alguma atualização.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onContinue}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5"
          style={{
            background: T.primary,
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
          }}
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

/* ==============================================================
 * STEP 2 — Endereço
 * ============================================================ */

function EnderecoStep({
  token,
  endereco,
  saving,
  setSaving,
  onBack,
  onSaved,
}: {
  token: string;
  endereco: any;
  saving: boolean;
  setSaving: (b: boolean) => void;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    zip: endereco?.zip || "",
    street: endereco?.street || "",
    number: endereco?.number || "",
    complement: endereco?.complement || "",
    neighborhood: endereco?.neighborhood || "",
    city: endereco?.city || "",
    state: endereco?.state || "",
  });

  // ViaCEP — autopreenche ao digitar CEP de 8 dígitos
  const lookupCep = async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const j = await r.json();
      if (j && !j.erro) {
        setForm((f) => ({
          ...f,
          street: j.logradouro || f.street,
          neighborhood: j.bairro || f.neighborhood,
          city: j.localidade || f.city,
          state: j.uf || f.state,
        }));
      }
    } catch {
      // silencioso
    }
  };

  const submit = async () => {
    if (!form.zip || !form.street || !form.number || !form.city || !form.state) {
      toast.error("Preencha CEP, logradouro, número, cidade e estado.");
      return;
    }
    setSaving(true);
    try {
      const r = await axios.post(`${API}/api/user/kyc/address`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) {
        toast.success("Endereço salvo.");
        onSaved();
      } else {
        toast.error(r.data?.message || "Erro ao salvar.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "h-11 w-full rounded-xl border bg-white px-3 text-[13.5px] text-slate-800 outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100";
  const labelCls = "mb-1.5 block text-[12px] font-semibold text-slate-600";

  return (
    <>
      <div className="mb-5">
        <h2 className="text-[17px] font-bold text-slate-900">
          Endereço Residencial
        </h2>
        <p className="mt-0.5 text-[12.5px] text-slate-500">
          Informe seu endereço residencial. Essa informação é obrigatória para
          concluir sua verificação.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>CEP</label>
          <div className="relative">
            <input
              value={form.zip}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                const formatted =
                  v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
                setForm({ ...form, zip: formatted });
                if (v.length === 8) lookupCep(v);
              }}
              className={inputCls}
              placeholder="00000-000"
              style={{ borderColor: T.border, paddingRight: 40 }}
            />
            <Search
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: T.textMuted }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_140px]">
          <div>
            <label className={labelCls}>Logradouro</label>
            <input
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className={inputCls}
              style={{ borderColor: T.border }}
              placeholder="Rua / Av."
            />
          </div>
          <div>
            <label className={labelCls}>Número</label>
            <input
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              className={inputCls}
              style={{ borderColor: T.border }}
              placeholder="000"
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Complemento</label>
          <input
            value={form.complement}
            onChange={(e) => setForm({ ...form, complement: e.target.value })}
            className={inputCls}
            style={{ borderColor: T.border }}
            placeholder="Apto 12 (Opcional)"
          />
        </div>

        <div>
          <label className={labelCls}>Bairro</label>
          <input
            value={form.neighborhood}
            onChange={(e) =>
              setForm({ ...form, neighborhood: e.target.value })
            }
            className={inputCls}
            style={{ borderColor: T.border }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_140px]">
          <div>
            <label className={labelCls}>Cidade</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputCls}
              style={{ borderColor: T.border }}
            />
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <select
              value={form.state}
              onChange={(e) =>
                setForm({ ...form, state: e.target.value.toUpperCase() })
              }
              className={inputCls}
              style={{ borderColor: T.border }}
            >
              <option value="">UF</option>
              {[
                "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT",
                "MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO",
                "RR","SC","SP","SE","TO",
              ].map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          style={{ borderColor: T.border }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          style={{
            background: T.primary,
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
          }}
        >
          {saving ? "Salvando…" : "Continuar"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

/* ==============================================================
 * STEP 3 — Documentos
 * ============================================================ */

function DocumentosStep({
  token,
  docs,
  saving,
  setSaving,
  onBack,
  onSubmitted,
}: {
  token: string;
  docs: any;
  saving: boolean;
  setSaving: (b: boolean) => void;
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const [files, setFiles] = useState<{
    documentFrontImage: File | null;
    documentBackImage: File | null;
    selfieImage: File | null;
    contratoSocialImage: File | null;
  }>({
    documentFrontImage: null,
    documentBackImage: null,
    selfieImage: null,
    contratoSocialImage: null,
  });

  const submit = async () => {
    if (
      !files.documentFrontImage &&
      !docs.documentFrontUrl
    ) {
      toast.error("Envie a frente do documento.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      if (files.documentFrontImage)
        fd.append("documentFrontImage", files.documentFrontImage);
      if (files.documentBackImage)
        fd.append("documentBackImage", files.documentBackImage);
      if (files.selfieImage) fd.append("selfieImage", files.selfieImage);
      if (files.contratoSocialImage)
        fd.append("contratoSocialImage", files.contratoSocialImage);

      const r = await axios.post(`${API}/api/user/kyc/documents`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (r.data?.success) {
        toast.success("Documentos enviados!");
        onSubmitted();
      } else {
        toast.error(r.data?.message || "Erro ao enviar.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-5">
        <h2 className="text-[17px] font-bold text-slate-900">
          Envie seus documentos
        </h2>
        <p className="mt-0.5 text-[12.5px] text-slate-500">
          Todos os documentos são obrigatórios para concluir sua verificação.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UploadCard
          title="Documento (Frente)"
          subtitle="Envie uma foto nítida da frente do seu documento oficial com foto."
          accept="image/png,image/jpeg"
          extLabel="PNG, JPG ou JPEG (máx. 10MB)"
          file={files.documentFrontImage}
          existingUrl={docs.documentFrontUrl}
          onFile={(f) => setFiles({ ...files, documentFrontImage: f })}
        />
        <UploadCard
          title="Documento (Verso)"
          subtitle="Envie uma foto nítida do verso do seu documento."
          accept="image/png,image/jpeg"
          extLabel="PNG, JPG ou JPEG (máx. 10MB)"
          file={files.documentBackImage}
          existingUrl={docs.documentBackUrl}
          onFile={(f) => setFiles({ ...files, documentBackImage: f })}
        />
        <UploadCard
          title="Selfie segurando o documento"
          subtitle="Tire uma selfie segurando seu documento ao lado do rosto."
          accept="image/png,image/jpeg"
          extLabel="PNG, JPG ou JPEG (máx. 10MB)"
          file={files.selfieImage}
          existingUrl={docs.selfieUrl}
          onFile={(f) => setFiles({ ...files, selfieImage: f })}
        />
        <UploadCard
          title="Contrato Social / Estatuto"
          subtitle="Envie o contrato social ou estatuto da sua empresa."
          accept="application/pdf,image/png,image/jpeg"
          extLabel="PDF (máx. 15MB)"
          file={files.contratoSocialImage}
          existingUrl={docs.contratoSocialUrl}
          onFile={(f) => setFiles({ ...files, contratoSocialImage: f })}
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          style={{ borderColor: T.border }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          style={{
            background: T.primary,
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
          }}
        >
          {saving ? "Enviando…" : "Continuar"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

function UploadCard({
  title,
  subtitle,
  accept,
  extLabel,
  file,
  existingUrl,
  onFile,
}: {
  title: string;
  subtitle: string;
  accept: string;
  extLabel: string;
  file: File | null;
  existingUrl?: string;
  onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = !!file || !!existingUrl;
  return (
    <div>
      <p className="text-[13px] font-bold text-slate-900">{title}</p>
      <p className="mt-0.5 text-[11.5px] text-slate-500">{subtitle}</p>
      <button
        onClick={() => inputRef.current?.click()}
        className="mt-2 flex w-full flex-col items-center justify-center rounded-xl px-4 py-7 text-center transition-colors hover:bg-violet-50"
        style={{
          background: hasFile ? T.greenSoft : T.primaryBg,
          border: `1.5px dashed ${hasFile ? T.green : T.primary}`,
          color: hasFile ? T.green : T.primary,
        }}
      >
        {hasFile ? (
          <Check className="mb-2 h-7 w-7" />
        ) : (
          <Upload className="mb-2 h-7 w-7" />
        )}
        <p className="text-[13px] font-bold">
          {hasFile
            ? file
              ? `Selecionado: ${file.name.slice(0, 24)}${
                  file.name.length > 24 ? "…" : ""
                }`
              : "Já enviado"
            : "Clique para enviar"}
        </p>
        <p className="mt-0.5 text-[11px] opacity-80">
          {hasFile ? "Clique pra trocar" : "ou arraste o arquivo aqui"}
        </p>
        <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-wider opacity-70">
          {extLabel}
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
    </div>
  );
}

/* ==============================================================
 * STEP 4 — Revisão
 * ============================================================ */

function RevisaoStep({
  data,
  onReload,
}: {
  data: any;
  onReload: () => void;
}) {
  const router = useRouter();
  const status = data.status as "PENDING" | "APPROVED" | "BANNED" | "NOT_STARTED";
  const docs = data.documentos || {};
  const items = [
    { key: "documentFrontUrl", label: "Documento (Frente)" },
    { key: "documentBackUrl", label: "Documento (Verso)" },
    { key: "selfieUrl", label: "Selfie segurando o documento" },
    { key: "contratoSocialUrl", label: "Contrato Social / Estatuto" },
  ];

  const approved = status === "APPROVED";
  const banned = status === "BANNED";

  return (
    <>
      <div className="mb-5">
        <h2 className="text-[17px] font-bold text-slate-900">
          Revisão dos Documentos
        </h2>
        <p className="mt-0.5 text-[12.5px] text-slate-500">
          {approved
            ? "Nossa equipe analisou todas as suas informações e documentos. Sua conta está verificada e todas as funcionalidades foram liberadas."
            : "Estamos analisando suas informações. Assim que a verificação for concluída, você será notificado por e-mail."}
        </p>
      </div>

      {/* Card central status */}
      <div
        className="mb-6 flex flex-col items-center justify-center rounded-2xl p-8 text-center"
        style={{
          background: approved
            ? T.greenSoft
            : banned
            ? "rgba(239,68,68,0.08)"
            : T.primaryBg,
          border: `1px solid ${T.borderSoft}`,
        }}
      >
        <div
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: approved
              ? T.green
              : banned
              ? T.red
              : T.primary,
            color: "#FFFFFF",
          }}
        >
          {approved ? (
            <ShieldCheck className="h-7 w-7" />
          ) : banned ? (
            <FileText className="h-7 w-7" />
          ) : (
            <Search className="h-7 w-7" />
          )}
        </div>
        <p
          className="text-[20px] font-bold"
          style={{
            color: approved ? T.green : banned ? T.red : T.primary,
          }}
        >
          {approved ? "Aprovado" : banned ? "Não aprovado" : "Em análise"}
        </p>
        <p className="mt-1 text-[12.5px] text-slate-500">
          {approved
            ? "Sua verificação foi concluída com sucesso."
            : banned
            ? data.message || "Sua verificação foi negada. Entre em contato com o suporte."
            : "Sua verificação está em andamento."}
        </p>
      </div>

      {/* Lista de documentos */}
      <div
        className="rounded-2xl"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.borderSoft}`,
        }}
      >
        <p
          className="px-5 py-3 text-[13px] font-bold text-slate-900"
          style={{ borderBottom: `1px solid ${T.borderSoft}` }}
        >
          Documentos enviados
        </p>
        <ul>
          {items.map((it, i) => {
            const sent = !!docs[it.key];
            return (
              <li
                key={it.key}
                className="flex items-center justify-between px-5 py-3"
                style={{
                  borderBottom:
                    i < items.length - 1
                      ? `1px solid ${T.borderSoft}`
                      : "none",
                }}
              >
                <span className="flex items-center gap-2 text-[13px] text-slate-700">
                  <FileText
                    className="h-4 w-4"
                    style={{ color: T.textMuted }}
                  />
                  {it.label}
                </span>
                {sent ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: T.greenSoft,
                      color: T.green,
                    }}
                  >
                    <Check className="h-3 w-3" />
                    {approved ? "Aprovado" : "Recebido"}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Não enviado
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {approved ? (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => router.push("/v1/dashboard")}
            className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            style={{ borderColor: T.border }}
          >
            Ir para o Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className="mt-4 flex items-center gap-2 rounded-xl p-3 text-[12px] text-slate-600"
          style={{
            background: T.primaryBg,
            border: `1px solid ${T.borderSoft}`,
          }}
        >
          <Info className="h-4 w-4" style={{ color: T.primary }} />
          Você será redirecionado automaticamente após a conclusão da análise.
        </div>
      )}
    </>
  );
}

/* ==============================================================
 * Side panel contextual (coluna direita)
 * ============================================================ */

function SidePanel({
  step,
  kycStatus,
}: {
  step: StepKey;
  kycStatus: string;
}) {
  const router = useRouter();

  const config = {
    dados: {
      icon: ShieldCheck,
      iconColor: T.primary,
      title: "Confira seus dados",
      desc: "Confirme se as informações da sua conta estão corretas antes de continuar para o próximo passo.",
      points: [
        {
          title: "Identidade",
          desc: "Verificamos quem está acessando a conta",
        },
        {
          title: "Conformidade",
          desc: "Atendimento às exigências regulatórias",
        },
        {
          title: "Segurança",
          desc: "Protegemos sua conta contra fraudes",
        },
      ],
    },
    endereco: {
      icon: ShieldCheck,
      iconColor: T.primary,
      title: "Por que precisamos do seu endereço?",
      desc: "Seu endereço é utilizado para verificação de identidade e conformidade com as regulamentações financeiras.",
      points: [
        {
          title: "Verificação de identidade",
          desc: "Confirmação de suas informações cadastrais",
        },
        {
          title: "Segurança da conta",
          desc: "Proteção adicional para sua conta",
        },
        {
          title: "Conformidade regulatória",
          desc: "Atendimento às exigências legais",
        },
      ],
    },
    documento: {
      icon: ShieldCheck,
      iconColor: T.primary,
      title: "Por que precisamos desses documentos?",
      desc: "Esses documentos são exigidos para garantir a segurança da sua conta e cumprir com as regulamentações financeiras.",
      points: [
        {
          title: "Segurança e prevenção",
          desc: "Protegemos sua conta e seus dados",
        },
        {
          title: "Conformidade legal",
          desc: "Atendemos às exigências regulatórias",
        },
        {
          title: "Liberação de funcionalidades",
          desc: "Após a aprovação, todas as funcionalidades serão liberadas",
        },
      ],
    },
    revisao:
      kycStatus === "APPROVED"
        ? {
            icon: ShieldCheck,
            iconColor: T.green,
            title: "Verificação concluída!",
            desc: "Sua identidade foi verificada com sucesso. A partir de agora, você tem acesso completo a todos os recursos da plataforma.",
            points: [
              {
                title: "Saques liberados",
                desc: "Realize saques de seus saldos.",
              },
              {
                title: "Limites aumentados",
                desc: "Acesse limites maiores de recebimento e saque",
              },
              {
                title: "Funcionalidades completas",
                desc: "Tenha acesso a todas as ferramentas da plataforma.",
              },
              {
                title: "Mais segurança",
                desc: "Sua conta está protegida e verificada.",
              },
            ],
          }
        : {
            icon: ShieldCheck,
            iconColor: T.primary,
            title: "O que acontece agora?",
            desc: "Nossa equipe irá verificar seus documentos e informações. Esse processo garante a segurança da sua conta e o cumprimento das regulamentações.",
            points: [
              {
                title: "Análise manual",
                desc: "Um especialista irá analisar seus documentos.",
              },
              {
                title: "Você será notificado",
                desc: "Enviaremos um e-mail com o resultado da verificação.",
              },
              {
                title: "Documentos aprovados",
                desc: "Após a aprovação, todas as funcionalidades serão liberadas automaticamente.",
              },
            ],
          },
  }[step];

  const HeaderIcon = config.icon;

  return (
    <aside
      className="rounded-2xl p-5"
      style={{
        background: T.card,
        border: `1px solid ${T.borderSoft}`,
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        height: "fit-content",
      }}
    >
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background:
            step === "revisao" && kycStatus === "APPROVED"
              ? T.greenSoft
              : T.primarySoft,
          color: config.iconColor,
        }}
      >
        <HeaderIcon className="h-5 w-5" />
      </div>
      <p className="text-[14px] font-bold text-slate-900">{config.title}</p>
      <p className="mt-1 text-[12px] text-slate-500">{config.desc}</p>

      <div className="mt-4 space-y-3">
        {config.points.map((p) => (
          <div key={p.title} className="flex items-start gap-2.5">
            <div
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{
                background:
                  step === "revisao" && kycStatus === "APPROVED"
                    ? T.greenSoft
                    : T.primarySoft,
                color: config.iconColor,
              }}
            >
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-bold text-slate-800">
                {p.title}
              </p>
              <p className="mt-0.5 text-[11.5px] text-slate-500">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {step === "revisao" && kycStatus !== "APPROVED" && (
        <div
          className="mt-5 rounded-xl p-3"
          style={{
            background: T.primaryBg,
            border: `1px solid ${T.borderSoft}`,
          }}
        >
          <p className="text-[12.5px] font-bold text-slate-900">
            Precisa de ajuda?
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            Entre em contato com nosso suporte caso tenha dúvidas sobre o
            processo de verificação.
          </p>
          <a
            href="https://wa.me/559991519044"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-3 text-[11.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            style={{ borderColor: T.border }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Abrir chat
          </a>
        </div>
      )}
    </aside>
  );
}

/* ==============================================================
 * Helpers
 * ============================================================ */

function ReadField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-slate-600">
        {label}
      </label>
      <div
        className="flex h-11 w-full items-center rounded-xl px-3 text-[13.5px] text-slate-800"
        style={{
          background: "#F8FAFC",
          border: `1px solid ${T.borderSoft}`,
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export default function KycPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — KYC</title>
      </Head>
      <LightShell>
        <KycContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
