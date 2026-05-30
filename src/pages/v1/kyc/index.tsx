"use client";

/**
 * /v1/kyc — Documentos / Verificação KYC (tema dark glassy violeta)
 *
 * 3 estados visuais:
 *  1. APPROVED → Status Verificação (verde) + Upload (Aprovado verde)
 *  2. PENDING/NOT_STARTED + endereço incompleto → "Preencha endereço"
 *  3. PENDING/NOT_STARTED + endereço OK → wizard de upload dos 4 docs
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
  ArrowRight,
  Upload,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ProfileTabs } from "@/components/ProfileTabs";
import ShadowPanel from "@/components/ShadowPanel";
import { useAuth } from "@/contexts/AuthContext";
import {
  DarkConfigShell,
  DarkCard,
  SectionHeader,
  DARK_T,
  StatusPill,
} from "@/components/DarkConfigShell";

const API = "https://shadowpay-api-production.up.railway.app";

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
  const addressComplete =
    !!endereco?.zip &&
    !!endereco?.number &&
    !!endereco?.city &&
    !!endereco?.state;

  return (
    <>
      <Head>
        <title>ShadowPay — Documentos</title>
      </Head>
      <LightShell>
        <DarkConfigShell>
          <ProfileTabs />

          {loading ? (
            <DarkCard className="p-10 text-center" style={{ color: DARK_T.textMuted }}>
              Carregando…
            </DarkCard>
          ) : status === "APPROVED" ? (
            <ApprovedView data={data} />
          ) : !addressComplete ? (
            <AddressIncompleteView onGoToProfile={() => router.push("/v1/configs/profile")} />
          ) : (
            <UploadView
              data={data}
              token={token!}
              onReload={fetchKyc}
            />
          )}
        </DarkConfigShell>
      </LightShell>
      <ShadowPanel />
    </>
  );
}

/* ==============================================================
 * APROVADO — 2 cards
 * ============================================================ */

function ApprovedView({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Status da Verificação */}
      <DarkCard className="p-6">
        <SectionHeader
          icon={<Check className="h-5 w-5" />}
          iconBg={DARK_T.greenSoft}
          iconColor={DARK_T.green}
          title="Status da Verificação"
          right={<StatusPill label="Aprovado" variant="green" />}
        />
        <p
          className="mb-3 text-[13.5px]"
          style={{ color: DARK_T.text }}
        >
          Seus documentos foram aprovados! Todas as funcionalidades estão
          liberadas.
        </p>

        <div
          className="mt-4 flex items-start gap-2 rounded-xl p-3"
          style={{
            background: DARK_T.blueSoft,
            border: `1px solid rgba(6,182,212,0.25)`,
          }}
        >
          <Info
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: DARK_T.blue }}
          />
          <span className="text-[12px]" style={{ color: DARK_T.text2 }}>
            Sua identidade foi verificada com sucesso. Para alterar dados
            cadastrais, entre em contato com o suporte.
          </span>
        </div>
      </DarkCard>

      {/* Upload Documentos — Aprovado */}
      <DarkCard className="p-6">
        <SectionHeader
          icon={<CloudUpload className="h-5 w-5" />}
          title="Upload de Documentos"
          subtitle="Envie seus documentos para liberar todas as funcionalidades da plataforma."
        />

        <div className="flex flex-col items-center justify-center py-8">
          <div
            className="mb-3 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: DARK_T.greenSoft,
              border: `2px solid ${DARK_T.green}`,
              boxShadow: `0 0 32px ${DARK_T.greenSoft}`,
            }}
          >
            <Check className="h-10 w-10" style={{ color: DARK_T.green }} />
          </div>
          <p
            className="text-[20px] font-bold"
            style={{ color: DARK_T.green }}
          >
            Aprovado
          </p>
          <p
            className="mt-1 max-w-[320px] text-center text-[12.5px]"
            style={{ color: DARK_T.text2 }}
          >
            Seus documentos foram aprovados! Todas as funcionalidades estão
            liberadas.
          </p>
        </div>
      </DarkCard>
    </div>
  );
}

/* ==============================================================
 * ENDEREÇO INCOMPLETO — 2 cards
 * ============================================================ */

function AddressIncompleteView({
  onGoToProfile,
}: {
  onGoToProfile: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Status pendente */}
      <DarkCard className="p-6">
        <SectionHeader
          icon={<FileText className="h-5 w-5" />}
          iconBg={DARK_T.blueSoft}
          iconColor={DARK_T.blue}
          title="Status da Verificação"
          right={<StatusPill label="Pendente" variant="blue" />}
        />

        <p
          className="mb-4 text-[13.5px]"
          style={{ color: DARK_T.text }}
        >
          Envie seus documentos para análise.
        </p>

        <div
          className="rounded-xl p-4"
          style={{
            background: DARK_T.amberSoft,
            border: `1px solid rgba(245,158,11,0.30)`,
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: DARK_T.amber }} />
            <p
              className="text-[13px] font-bold"
              style={{ color: DARK_T.amber }}
            >
              Endereço incompleto
            </p>
          </div>
          <p
            className="mb-3 text-[12.5px]"
            style={{ color: DARK_T.text2 }}
          >
            Para enviar seus documentos, você precisa primeiro preencher seu
            endereço completo.
          </p>
          <button
            onClick={onGoToProfile}
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wider text-slate-900"
            style={{
              background: DARK_T.amber,
              boxShadow: `0 8px 20px -8px ${DARK_T.amber}`,
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Preencher Endereço
          </button>
        </div>
      </DarkCard>

      {/* Upload bloqueado */}
      <DarkCard className="p-6">
        <SectionHeader
          icon={<CloudUpload className="h-5 w-5" />}
          title="Upload de Documentos"
          subtitle="Envie seus documentos para liberar todas as funcionalidades da plataforma."
        />

        <div className="flex flex-col items-center justify-center py-6">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center"
            style={{ color: DARK_T.amber }}
          >
            <AlertTriangle className="h-12 w-12" />
          </div>
          <p
            className="text-[18px] font-bold"
            style={{ color: DARK_T.text }}
          >
            Preencha seu endereço
          </p>
          <p
            className="mt-1 mb-4 max-w-[360px] text-center text-[12.5px]"
            style={{ color: DARK_T.text2 }}
          >
            Para enviar seus documentos, você precisa primeiro completar seu
            cadastro de endereço.
          </p>
          <button
            onClick={onGoToProfile}
            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[12px] font-bold uppercase tracking-[0.1em] text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${DARK_T.primary} 0%, ${DARK_T.primaryStrong} 100%)`,
              boxShadow: `0 12px 28px -10px ${DARK_T.primaryGlow}`,
            }}
          >
            <Pencil className="h-4 w-4" />
            Ir para Minha Conta
          </button>
        </div>
      </DarkCard>
    </div>
  );
}

/* ==============================================================
 * UPLOAD (endereço completo) — 4 dropzones
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

  const allSelected =
    (files.documentFrontImage || docs.documentFrontUrl) &&
    (files.documentBackImage || docs.documentBackUrl) &&
    (files.selfieImage || docs.selfieUrl) &&
    (files.contratoSocialImage || docs.contratoSocialUrl);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Status pendente */}
      <DarkCard className="p-6">
        <SectionHeader
          icon={<FileText className="h-5 w-5" />}
          iconBg={DARK_T.blueSoft}
          iconColor={DARK_T.blue}
          title="Status da Verificação"
          right={
            <StatusPill
              label={data?.status === "PENDING" ? "Em Análise" : "Pendente"}
              variant="blue"
            />
          }
        />
        <p className="text-[13.5px]" style={{ color: DARK_T.text }}>
          {data?.status === "PENDING"
            ? "Sua verificação está em análise. Você será notificado por e-mail."
            : "Envie seus documentos para análise."}
        </p>
      </DarkCard>

      {/* Upload */}
      <DarkCard className="p-6">
        <SectionHeader
          icon={<CloudUpload className="h-5 w-5" />}
          title="Upload de Documentos"
          subtitle="Envie seus documentos para liberar todas as funcionalidades da plataforma."
        />

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
          disabled={saving || !allSelected}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold uppercase tracking-[0.1em] text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            background: `linear-gradient(135deg, ${DARK_T.primary} 0%, ${DARK_T.primaryStrong} 100%)`,
            boxShadow: `0 12px 28px -10px ${DARK_T.primaryGlow}`,
          }}
        >
          <Upload className="h-4 w-4" />
          {saving ? "Enviando…" : "Enviar Documentos"}
        </button>
      </DarkCard>
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
      <p
        className="mb-1.5 text-[12px] font-semibold"
        style={{ color: DARK_T.text2 }}
      >
        {title}
      </p>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center rounded-xl px-3 py-5 transition-colors hover:bg-violet-500/10"
        style={{
          background: has ? DARK_T.greenSoft : "rgba(139,92,246,0.06)",
          border: `1.5px dashed ${has ? DARK_T.green : "rgba(139,92,246,0.5)"}`,
          color: has ? DARK_T.green : DARK_T.primary,
        }}
      >
        {has ? <Check className="mb-1 h-6 w-6" /> : <Upload className="mb-1 h-6 w-6" />}
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

export default function KycPage() {
  return (
    <ProtectedRoute>
      <KycContent />
    </ProtectedRoute>
  );
}
