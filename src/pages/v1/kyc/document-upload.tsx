import { useState, useEffect } from "react";
import {
  Upload,
  Camera,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  User,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Head from "next/head";
import { motion } from "framer-motion";

const T = {
  bg: "#F1F3F8",
  surface: "#FFFFFF",
  text: "#0F172A",
  text2: "#475569",
  text3: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
  success: "#16A34A",
  successBg: "rgba(22, 163, 74, 0.10)",
};

interface UploadSlotProps {
  title: string;
  icon: React.ReactNode;
  preview: string | null;
  fileName?: string;
  fileSize?: number;
  inputId: string;
  accept: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  helper?: string;
}

function UploadSlot({
  title,
  icon,
  preview,
  fileName,
  fileSize,
  inputId,
  accept,
  onSelect,
  onRemove,
  helper,
}: UploadSlotProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: T.primaryBg, color: T.primary }}
        >
          {icon}
        </span>
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: "'Clash Display', sans-serif", color: T.text }}
        >
          {title}
        </span>
      </div>

      {preview || fileName ? (
        <div className="relative">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={title}
              className="h-48 w-full rounded-xl object-cover"
              style={{ border: `2px solid ${T.success}` }}
            />
          ) : (
            <div
              className="flex h-48 w-full flex-col items-center justify-center rounded-xl"
              style={{ background: T.successBg, border: `2px solid ${T.success}` }}
            >
              <FileText className="mb-3 h-12 w-12" style={{ color: T.success }} />
              <p className="px-3 text-center text-sm font-medium" style={{ color: T.text }}>
                {fileName}
              </p>
              {typeof fileSize === "number" && (
                <p className="text-xs" style={{ color: T.text2 }}>
                  {(fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          )}
          <span
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white"
            style={{ background: T.success }}
          >
            <CheckCircle className="h-4 w-4" />
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              background: "#F8FAFC",
              border: `1px solid ${T.border}`,
              color: T.text2,
            }}
          >
            Trocar arquivo
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="group flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl p-6 text-center transition-colors"
          style={{
            background: "#F8FAFC",
            border: `2px dashed ${T.border}`,
          }}
        >
          <Upload
            className="mb-3 h-10 w-10 transition-transform group-hover:scale-110"
            style={{ color: T.text3 }}
          />
          <p className="text-sm font-semibold" style={{ color: T.text }}>
            Clique para enviar
          </p>
          {helper && (
            <p className="mt-1 text-xs" style={{ color: T.text3 }}>
              {helper}
            </p>
          )}
          <input
            id={inputId}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelect(file);
            }}
          />
        </label>
      )}
    </div>
  );
}

function DocumentUploadContent() {
  const router = useRouter();
  const { token, refreshUserData, logout } = useAuth();
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cnpjDocument, setcnpjDocument] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycId, setKycId] = useState<string | null>(null);
  const [isStartingKyc, setIsStartingKyc] = useState(false);

  const handleFileUpload = (file: File, type: "front" | "back" | "selfie") => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === "front") {
          setFrontImage(file);
          setFrontPreview(result);
        } else if (type === "back") {
          setBackImage(file);
          setBackPreview(result);
        } else if (type === "selfie") {
          setSelfieImage(file);
          setSelfiePreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlecnpjUpload = (file: File) => {
    if (file && file.type === "application/pdf") {
      setcnpjDocument(file);
    } else {
      alert("Por favor, selecione apenas arquivos PDF.");
    }
  };

  const startKycProcess = async () => {
    if (!token) {
      setError("Token de autenticação não encontrado");
      return null;
    }

    setIsStartingKyc(true);
    setError(null);

    try {
      const response = await axios.post(
        "https://shadowpay-api-production.up.railway.app/api/user/kyc/start",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const newKycId = response.data.data.kycId;
        setKycId(newKycId);
        localStorage.setItem("kycId", newKycId);
        return newKycId;
      } else {
        setError("Erro ao iniciar processo de verificação");
        return null;
      }
    } catch (err: any) {
      console.error("Erro ao iniciar KYC:", err);

      if (err.response?.status === 401) {
        setError("Sessão expirada. Faça login novamente.");
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || "Dados inválidos");
      } else if (err.response?.status === 409) {
        const existingKycId = localStorage.getItem("kycId");
        if (existingKycId) {
          setKycId(existingKycId);
          return existingKycId;
        }
        setError("Processo de KYC já foi iniciado, mas kycId não encontrado");
      } else {
        setError("Erro interno do servidor. Tente novamente.");
      }
      return null;
    } finally {
      setIsStartingKyc(false);
    }
  };

  useEffect(() => {
    const existingKycId = localStorage.getItem("kycId");
    if (existingKycId) {
      setKycId(existingKycId);
    }
  }, []);

  const handleNext = async () => {
    if (!frontImage || !backImage || !selfieImage || !cnpjDocument) {
      setError("Por favor, envie todos os documentos necessários");
      return;
    }

    if (!token) {
      setError("Token de autenticação não encontrado");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let currentKycId = kycId;
      if (!currentKycId) {
        currentKycId = await startKycProcess();
        if (!currentKycId) {
          setIsLoading(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append("documentFrontImage", frontImage);
      formData.append("documentBackImage", backImage);
      formData.append("selfieImage", selfieImage);
      formData.append("companyDocumentImage", cnpjDocument);

      const response = await axios.post(
        "https://shadowpay-api-production.up.railway.app/api/user/kyc/documents",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        localStorage.removeItem("kycId");
        await refreshUserData();
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        setError("Erro ao enviar documentos. Tente novamente.");
      }
    } catch (err: any) {
      console.error("Erro ao enviar documentos:", err);

      if (err.response?.status === 401) {
        setError("Sessão expirada. Faça login novamente.");
      } else if (err.response?.status === 400) {
        setError(
          err.response.data?.message ||
            "Dados inválidos. Verifique os documentos."
        );
      } else if (err.response?.status === 413) {
        setError("Arquivos muito grandes. Reduza o tamanho e tente novamente.");
      } else if (err.response?.status === 415) {
        setError("Formato de arquivo não suportado.");
      } else {
        setError("Erro interno do servidor. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/v1/kyc");
  };

  const allReady = frontImage && backImage && selfieImage && cnpjDocument;

  return (
    <>
      <Head>
        <title>ShadowPay — Upload de documentos</title>
      </Head>

      <div
        className="relative min-h-screen overflow-hidden p-4 md:p-8"
        style={{
          background: T.bg,
          color: T.text,
          fontFamily: "'Satoshi', system-ui, sans-serif",
        }}
      >
        <div className="relative z-10 mx-auto w-full max-w-5xl space-y-8 py-6">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
              style={{
                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryStrong})`,
                boxShadow: "0 8px 24px -12px rgba(124,58,237,0.4)",
              }}
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span
              className="text-xs font-semibold tracking-[0.16em]"
              style={{ fontFamily: "'Clash Display', sans-serif", color: T.text2 }}
            >
              SHADOWPAY · KYC
            </span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-3 text-center"
          >
            <h1
              className="text-3xl font-bold md:text-[36px]"
              style={{ fontFamily: "'Clash Display', sans-serif", color: T.text }}
            >
              Upload de documentos
            </h1>
            <p className="mx-auto max-w-2xl text-sm" style={{ color: T.text2 }}>
              Envie todos os documentos necessários: frente e verso do documento
              de identidade, selfie e comprovante CNPJ.
            </p>
          </motion.div>

          {/* Progress steps */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryStrong})`,
                  }}
                >
                  ✓
                </div>
                <span className="hidden text-xs sm:inline" style={{ color: T.text2 }}>
                  Introdução
                </span>
              </div>
              <div className="h-px w-10" style={{ background: T.primary, opacity: 0.4 }} />
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryStrong})`,
                  }}
                >
                  2
                </div>
                <span
                  className="hidden text-xs font-semibold sm:inline"
                  style={{ fontFamily: "'Clash Display', sans-serif", color: T.text }}
                >
                  Documentos
                </span>
              </div>
            </div>
          </div>

          {/* Upload slots */}
          <div className="grid gap-4 md:grid-cols-2">
            <UploadSlot
              title="Frente do documento"
              icon={<Camera className="h-4 w-4" />}
              preview={frontPreview}
              inputId="front-upload"
              accept="image/*"
              onSelect={(f) => handleFileUpload(f, "front")}
              onRemove={() => {
                setFrontImage(null);
                setFrontPreview(null);
              }}
              helper="JPG, PNG · evite reflexos"
            />
            <UploadSlot
              title="Verso do documento"
              icon={<Camera className="h-4 w-4" />}
              preview={backPreview}
              inputId="back-upload"
              accept="image/*"
              onSelect={(f) => handleFileUpload(f, "back")}
              onRemove={() => {
                setBackImage(null);
                setBackPreview(null);
              }}
              helper="JPG, PNG · texto legível"
            />
            <UploadSlot
              title="Selfie"
              icon={<User className="h-4 w-4" />}
              preview={selfiePreview}
              inputId="selfie-upload"
              accept="image/*"
              onSelect={(f) => handleFileUpload(f, "selfie")}
              onRemove={() => {
                setSelfieImage(null);
                setSelfiePreview(null);
              }}
              helper="Sem óculos escuros · rosto visível"
            />
            <UploadSlot
              title="Documento CNPJ"
              icon={<FileText className="h-4 w-4" />}
              preview={null}
              fileName={cnpjDocument?.name}
              fileSize={cnpjDocument?.size}
              inputId="cnpj-upload"
              accept=".pdf"
              onSelect={handlecnpjUpload}
              onRemove={() => setcnpjDocument(null)}
              helper="Apenas PDF · comprovante CNPJ"
            />
          </div>

          {/* Dicas */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-2xl p-5"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
            }}
          >
            <h3
              className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: T.text2 }}
            >
              Dicas importantes
            </h3>
            <div
              className="grid gap-3 text-sm md:grid-cols-4"
              style={{ color: T.text2 }}
            >
              <div className="text-center">
                <div
                  className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: T.primaryBg, color: T.primary }}
                >
                  💡
                </div>
                <p className="text-xs">Boa iluminação, sem sombras</p>
              </div>
              <div className="text-center">
                <div
                  className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: T.primaryBg, color: T.primary }}
                >
                  📱
                </div>
                <p className="text-xs">Mantenha documentos retos</p>
              </div>
              <div className="text-center">
                <div
                  className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: T.primaryBg, color: T.primary }}
                >
                  🔍
                </div>
                <p className="text-xs">Texto legível e nítido</p>
              </div>
              <div className="text-center">
                <div
                  className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: T.primaryBg, color: T.primary }}
                >
                  📄
                </div>
                <p className="text-xs">CNPJ em PDF atualizado</p>
              </div>
            </div>
          </motion.div>

          {/* Mensagens */}
          {error && (
            <div
              className="rounded-xl p-4 text-center text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.30)",
                color: "#B91C1C",
              }}
            >
              {error}
            </div>
          )}
          {isStartingKyc && (
            <div
              className="flex items-center justify-center gap-2 rounded-xl p-4 text-sm"
              style={{
                background: "rgba(14, 165, 233, 0.08)",
                border: "1px solid rgba(14, 165, 233, 0.30)",
                color: "#0369A1",
              }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando processo de verificação…
            </div>
          )}
          {kycId && !isStartingKyc && (
            <div
              className="rounded-xl p-4 text-center text-sm"
              style={{
                background: T.successBg,
                border: `1px solid ${T.success}`,
                color: "#166534",
              }}
            >
              ✓ Processo de verificação iniciado. Envie seus documentos para
              finalizar.
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleBack}
              disabled={isLoading || isStartingKyc}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={!allReady || isLoading || isStartingKyc}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              style={{
                background: allReady
                  ? `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`
                  : "#E2E8F0",
                color: allReady ? "#FFFFFF" : T.text3,
                boxShadow: allReady
                  ? "0 16px 36px -16px rgba(124,58,237,0.5)"
                  : "none",
              }}
            >
              {isLoading || isStartingKyc ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isStartingKyc ? "Iniciando…" : "Enviando…"}
                </>
              ) : (
                <>
                  Finalizar verificação
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs" style={{ color: T.text3 }}>
            Todos os dados são processados com segurança e protegidos por
            criptografia
          </p>
        </div>
      </div>
    </>
  );
}

export default function DocumentUpload() {
  return (
    <ProtectedRoute>
      <DocumentUploadContent />
    </ProtectedRoute>
  );
}
