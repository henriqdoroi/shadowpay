"use client";

/**
 * /v1/kyc — Verificação tema light.
 *
 * 3 estados visuais:
 *  1. APPROVED → Status (Aprovado verde) + Upload (Aprovado check verde gigante)
 *  2. PENDING/NOT_STARTED + endereço incompleto → "Preencha endereço" amarelo
 *  3. Endereço completo + ainda não enviou docs → wizard de upload dos 4 docs
 *  4. PENDING (já enviou docs) → "Em análise" azul
 */

import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { useRouter } from "next/router";
import { toast } from "sonner";
import {
  Check,
  FileText,
  CloudUpload,
  AlertTriangle,
  Info,
  Pencil,
  Upload,
  Clock,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ProfileTabs } from "@/components/ProfileTabs";
import ShadowPanel from "@/components/ShadowPanel";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  card: "#FFFFFF",
  borderSoft: "rgba(15,23,42,0.06)",
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primarySoft: "rgba(124,58,237,0.10)",
  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.12)",
  blue: "#06B6D4",
  blueSoft: "rgba(6,182,212,0.12)",
  amber: "#F59E0B",
  amberSoft: "rgba(245,158,11,0.12)",
};

function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: "green" | "amber" | "blue";
}) {
  const map = {
    green: { bg: T.greenSoft, color: T.green },
    amber: { bg: T.amberSoft, color: T.amber },
    blue: { bg: T.blueSoft, color: T.blue },
  };
  const cfg = map[variant];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {label}
    </span>
  );
}

function SectionIcon({
  children,
  bg,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ background: bg, color }}
    >
      {children}
    </div>
  );
}

function KycContent() {
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchKyc = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/user/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) setData(r.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const status = data?.status as
    | "NOT_STARTED"
    | "PENDING"
    | "APPROVED"
    | "BANNED"
    | undefined;
  const endereco = data?.endereco;
  const docs = data?.documentos || {};
  const addressComplete =
    !!endereco?.zip &&
    !!endereco?.number &&
    !!endereco?.city &&
    !!endereco?.state;
  const allDocsUploaded =
    !!docs.documentFrontUrl &&
    !!docs.documentBackUrl &&
    !!docs.selfieUrl &&
    !!docs.contratoSocialUrl;

  const body = (() => {
    if (loading) {
      return (
        <div
          className="rounded-2xl p-10 text-center text-sm text-slate-500"
          style={{
            background: T.card,
            border: `1px solid ${T.borderSoft}`,
          }}
        >
          Carregando…
        </div>
      );
    }
    if (status === "APPROVED") return <ApprovedView />;
    if (!addressComplete)
      return (
        <AddressIncompleteView
          onGoToProfile={() => router.push("/v1/configs/profile")}
        />
      );
    if (status === "PENDING" && allDocsUploaded) return <UnderReviewView />;
    return <UploadView data={data} token={token!} onReload={fetchKyc} />;
  })();

  return (
    <>
      <Head>
        <title>ShadowPay — KYC</title>
      </Head>
      <LightShell>
        <ProfileTabs />
        {body}
      </LightShell>
      <ShadowPanel />
    </>
  );
}

/* ==============================================================
 * APROVADO
 * ============================================================ */

function ApprovedView() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <SectionIcon bg={T.greenSoft} color={T.green}>
              <Check className="h-5 w-5" />
            </SectionIcon>
            <div>
              <p className="text-[16px] font-bold text-slate-900">
                Status da Verificação
              </p>
              <div className="mt-1">
                <StatusPill label="Aprovado" variant="green" />
              </div>
            </div>
          </div>
        </div>
        <p className="mb-3 text-[13.5px] text-slate-700">
          Seus documentos foram aprovados! Todas as funcionalidades estão
          liberadas.
        </p>
        <div
          className="mt-4 flex items-start gap-2 rounded-xl p-3"
          style={{
            background: T.blueSoft,
            border: `1px solid rgba(6,182,212,0.25)`,
          }}
        >
          <Info
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: T.blue }}
          />
          <span className="text-[12px] text-slate-700">
            Sua identidade foi verificada. Para alterar dados cadastrais,
            entre em contato com o suporte.
          </span>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <SectionIcon bg={T.primarySoft} color={T.primary}>
            <CloudUpload className="h-5 w-5" />
          </SectionIcon>
          <div>
            <p className="text-[16px] font-bold text-slate-900">
              Upload de Documentos
            </p>
            <p className="text-[12px] text-slate-500">
              Envie seus documentos para liberar todas as funcionalidades da
              plataforma.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          <div
            className="mb-3 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: T.greenSoft,
              border: `2px solid ${T.green}`,
              boxShadow: `0 8px 24px ${T.greenSoft}`,
            }}
          >
            <Check className="h-10 w-10" style={{ color: T.green }} />
          </div>
          <p className="text-[20px] font-bold" style={{ color: T.green }}>
            Aprovado
          </p>
          <p className="mt-1 max-w-[320px] text-center text-[12.5px] text-slate-600">
            Seus documentos foram aprovados! Todas as funcionalidades estão
            liberadas.
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ==============================================================
 * ENDEREÇO INCOMPLETO
 * ============================================================ */

function AddressIncompleteView({
  onGoToProfile,
}: {
  onGoToProfile: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <SectionIcon bg={T.blueSoft} color={T.blue}>
              <FileText className="h-5 w-5" />
            </SectionIcon>
            <div>
              <p className="text-[16px] font-bold text-slate-900">
                Status da Verificação
              </p>
              <div className="mt-1">
                <StatusPill label="Pendente" variant="blue" />
              </div>
            </div>
          </div>
        </div>
        <p className="mb-4 text-[13.5px] text-slate-700">
          Envie seus documentos para análise.
        </p>

        <div
          className="rounded-xl p-4"
          style={{
            background: T.amberSoft,
            border: `1px solid rgba(245,158,11,0.30)`,
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle
              className="h-4 w-4 shrink-0"
              style={{ color: T.amber }}
            />
            <p
              className="text-[13px] font-bold"
              style={{ color: "#B45309" }}
            >
              Endereço incompleto
            </p>
          </div>
          <p className="mb-3 text-[12.5px] text-slate-700">
            Para enviar seus documentos, você precisa primeiro preencher seu
            endereço completo.
          </p>
          <button
            onClick={onGoToProfile}
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wider text-white"
            style={{
              background: T.amber,
              boxShadow: `0 8px 20px -8px ${T.amber}`,
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Preencher Endereço
          </button>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <SectionIcon bg={T.primarySoft} color={T.primary}>
            <CloudUpload className="h-5 w-5" />
          </SectionIcon>
          <div>
            <p className="text-[16px] font-bold text-slate-900">
              Upload de Documentos
            </p>
            <p className="text-[12px] text-slate-500">
              Envie seus documentos para liberar todas as funcionalidades da
              plataforma.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-6">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center"
            style={{ color: T.amber }}
          >
            <AlertTriangle className="h-12 w-12" />
          </div>
          <p className="text-[18px] font-bold text-slate-900">
            Preencha seu endereço
          </p>
          <p className="mb-4 mt-1 max-w-[360px] text-center text-[12.5px] text-slate-600">
            Para enviar seus documentos, você precisa primeiro completar seu
            cadastro de endereço.
          </p>
          <button
            onClick={onGoToProfile}
            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[12px] font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: T.primary,
              boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
            }}
          >
            <Pencil className="h-4 w-4" />
            Ir para Minha Conta
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ==============================================================
 * EM ANÁLISE (já enviou docs)
 * ============================================================ */

function UnderReviewView() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <SectionIcon bg={T.blueSoft} color={T.blue}>
              <FileText className="h-5 w-5" />
            </SectionIcon>
            <div>
              <p className="text-[16px] font-bold text-slate-900">
                Status da Verificação
              </p>
              <div className="mt-1">
                <StatusPill label="Em análise" variant="blue" />
              </div>
            </div>
          </div>
        </div>
        <p className="text-[13.5px] text-slate-700">
          Sua verificação está em andamento. Nossa equipe está analisando seus
          documentos.
        </p>
        <div
          className="mt-4 flex items-start gap-2 rounded-xl p-3"
          style={{
            background: T.blueSoft,
            border: `1px solid rgba(6,182,212,0.25)`,
          }}
        >
          <Info
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: T.blue }}
          />
          <span className="text-[12px] text-slate-700">
            Você será notificado por e-mail assim que a análise for concluída.
            Geralmente leva até 24h úteis.
          </span>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <SectionIcon bg={T.primarySoft} color={T.primary}>
            <CloudUpload className="h-5 w-5" />
          </SectionIcon>
          <div>
            <p className="text-[16px] font-bold text-slate-900">
              Upload de Documentos
            </p>
            <p className="text-[12px] text-slate-500">
              Documentos enviados aguardando análise.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div
            className="mb-3 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: T.blueSoft,
              border: `2px solid ${T.blue}`,
            }}
          >
            <Clock className="h-10 w-10" style={{ color: T.blue }} />
          </div>
          <p className="text-[20px] font-bold" style={{ color: T.blue }}>
            Em análise
          </p>
          <p className="mt-1 max-w-[320px] text-center text-[12.5px] text-slate-600">
            Nossa equipe está analisando seus documentos. Aguarde a aprovação
            para liberar todas as funcionalidades.
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ==============================================================
 * UPLOAD (endereço completo, ainda não enviou tudo)
 * ============================================================ */

function UploadView({
  data,
  token,
  onReload,
}: {
  data: any;
  token: string;
  onReload: () => void;
}) {
  const docs = data?.documentos || {};
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
  const [saving, setSaving] = useState(false);

  const submit = async () => {
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
        toast.success(r.data.message || "Documentos enviados!");
        onReload();
      } else {
        toast.error(r.data?.message || "Erro ao enviar.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  const ready =
    (files.documentFrontImage || docs.documentFrontUrl) &&
    (files.documentBackImage || docs.documentBackUrl) &&
    (files.selfieImage || docs.selfieUrl) &&
    (files.contratoSocialImage || docs.contratoSocialUrl);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <SectionIcon bg={T.blueSoft} color={T.blue}>
              <FileText className="h-5 w-5" />
            </SectionIcon>
            <div>
              <p className="text-[16px] font-bold text-slate-900">
                Status da Verificação
              </p>
              <div className="mt-1">
                <StatusPill label="Pendente" variant="blue" />
              </div>
            </div>
          </div>
        </div>
        <p className="text-[13.5px] text-slate-700">
          Envie seus documentos para análise.
        </p>
        <div
          className="mt-4 flex items-start gap-2 rounded-xl p-3"
          style={{
            background: T.amberSoft,
            border: `1px solid rgba(245,158,11,0.25)`,
          }}
        >
          <Info
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: T.amber }}
          />
          <span className="text-[12px] text-slate-700">
            Envie os 4 documentos no card ao lado. Após o envio, sua
            verificação entra em análise.
          </span>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <SectionIcon bg={T.primarySoft} color={T.primary}>
            <CloudUpload className="h-5 w-5" />
          </SectionIcon>
          <div>
            <p className="text-[16px] font-bold text-slate-900">
              Upload de Documentos
            </p>
            <p className="text-[12px] text-slate-500">
              Envie seus documentos para liberar todas as funcionalidades da
              plataforma.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Dropzone
            title="Documento (Frente)"
            file={files.documentFrontImage}
            existingUrl={docs.documentFrontUrl}
            onFile={(f) => setFiles({ ...files, documentFrontImage: f })}
          />
          <Dropzone
            title="Documento (Verso)"
            file={files.documentBackImage}
            existingUrl={docs.documentBackUrl}
            onFile={(f) => setFiles({ ...files, documentBackImage: f })}
          />
          <Dropzone
            title="Selfie com documento"
            file={files.selfieImage}
            existingUrl={docs.selfieUrl}
            onFile={(f) => setFiles({ ...files, selfieImage: f })}
          />
          <Dropzone
            title="Contrato Social"
            file={files.contratoSocialImage}
            existingUrl={docs.contratoSocialUrl}
            accept="application/pdf,image/png,image/jpeg"
            onFile={(f) => setFiles({ ...files, contratoSocialImage: f })}
          />
        </div>

        <button
          onClick={submit}
          disabled={saving || !ready}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            background: T.primary,
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
          }}
        >
          <Upload className="h-4 w-4" />
          {saving ? "Enviando…" : "Enviar Documentos"}
        </button>
      </Card>
    </div>
  );
}

function Dropzone({
  title,
  file,
  existingUrl,
  onFile,
  accept = "image/png,image/jpeg",
}: {
  title: string;
  file: File | null;
  existingUrl?: string;
  onFile: (f: File | null) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const has = !!file || !!existingUrl;

  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold text-slate-700">
        {title}
      </p>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center rounded-xl px-3 py-5 transition-colors hover:bg-violet-50"
        style={{
          background: has ? T.greenSoft : T.primarySoft,
          border: `1.5px dashed ${has ? T.green : T.primary}`,
          color: has ? T.green : T.primary,
        }}
      >
        {has ? (
          <Check className="mb-1 h-6 w-6" />
        ) : (
          <Upload className="mb-1 h-6 w-6" />
        )}
        <p className="text-[12px] font-bold">
          {has
            ? file
              ? "Pronto pra enviar"
              : "Já enviado"
            : "Clique para enviar"}
        </p>
        <p className="mt-0.5 text-[10px] opacity-80">
          {accept.includes("pdf") ? "PDF, PNG ou JPG" : "PNG ou JPG"}
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
 * Card primitive
 * ============================================================ */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: T.card,
        border: `1px solid ${T.borderSoft}`,
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      {children}
    </div>
  );
}

export default function KycPage() {
  return (
    <ProtectedRoute>
      <KycContent />
    </ProtectedRoute>
  );
}
