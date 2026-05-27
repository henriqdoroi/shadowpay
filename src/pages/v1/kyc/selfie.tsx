import { useState } from "react";
import {
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Upload,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/router";
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

export default function Selfie() {
  const router = useRouter();
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [cnpjDocument, setcnpjDocument] = useState<File | null>(null);

  const handleSelfieUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelfieImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Por favor, selecione apenas arquivos de imagem.");
    }
  };

  const removeSelfie = () => {
    setSelfieImage(null);
  };

  const handlecnpjUpload = (file: File) => {
    if (file && file.type === "application/pdf") {
      setcnpjDocument(file);
    } else {
      alert("Por favor, selecione apenas arquivos PDF.");
    }
  };

  const handleNext = () => {
    if (selfieImage && cnpjDocument) {
      router.push("/v1/dashboard");
    }
  };

  const handleBack = () => {
    router.push("/v1/kyc/document-upload");
  };

  const ready = !!(selfieImage && cnpjDocument);

  return (
    <>
      <Head>
        <title>ShadowPay — Selfie & CNPJ</title>
      </Head>

      <div
        className="relative min-h-screen overflow-hidden p-4 md:p-8"
        style={{
          background: T.bg,
          color: T.text,
          fontFamily: "'Satoshi', system-ui, sans-serif",
        }}
      >
        <div className="relative z-10 mx-auto w-full max-w-4xl space-y-8 py-6">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2">
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
          </div>

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
              Selfie & CNPJ
            </h1>
            <p className="mx-auto max-w-md text-sm" style={{ color: T.text2 }}>
              Tire uma selfie e faça upload do seu documento CNPJ em PDF.
            </p>
          </motion.div>

          {/* Progress */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3">
              {[
                { label: "Introdução", done: true },
                { label: "Documento", done: true },
                { label: "Selfie & CNPJ", current: true },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{
                      background:
                        step.current || step.done
                          ? `linear-gradient(135deg, ${T.primary}, ${T.primaryStrong})`
                          : "#E2E8F0",
                      color: step.current || step.done ? "#FFFFFF" : T.text3,
                    }}
                  >
                    {step.done && !step.current ? "✓" : i + 1}
                  </div>
                  <span
                    className="hidden text-xs sm:inline"
                    style={{
                      fontFamily: "'Clash Display', sans-serif",
                      fontWeight: step.current ? 600 : 400,
                      color: step.current ? T.text : T.text2,
                    }}
                  >
                    {step.label}
                  </span>
                  {i < arr.length - 1 && (
                    <div
                      className="h-px w-8"
                      style={{ background: T.primary, opacity: 0.4 }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Selfie */}
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
                  <User className="h-4 w-4" />
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: "'Clash Display', sans-serif", color: T.text }}
                >
                  Selfie
                </span>
              </div>
              {selfieImage ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selfieImage}
                    alt="Selfie enviada"
                    className="h-64 w-full rounded-xl object-cover"
                    style={{ border: `2px solid ${T.success}` }}
                  />
                  <span
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white"
                    style={{ background: T.success }}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </span>
                  <button
                    type="button"
                    onClick={removeSelfie}
                    className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium hover:opacity-80"
                    style={{
                      background: "#F8FAFC",
                      border: `1px solid ${T.border}`,
                      color: T.text2,
                    }}
                  >
                    Trocar foto
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="selfie-upload"
                  className="group flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl p-6 text-center"
                  style={{
                    background: "#F8FAFC",
                    border: `2px dashed ${T.border}`,
                  }}
                >
                  <User className="mb-3 h-10 w-10" style={{ color: T.text3 }} />
                  <p className="text-sm font-semibold" style={{ color: T.text }}>
                    Envie sua selfie
                  </p>
                  <p className="mt-1 text-xs" style={{ color: T.text3 }}>
                    JPG, PNG, JPEG
                  </p>
                  <p
                    className="mt-2 text-xs font-medium underline-offset-2 group-hover:underline"
                    style={{ color: T.primary }}
                  >
                    Clique para selecionar
                  </p>
                  <input
                    id="selfie-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSelfieUpload(file);
                    }}
                  />
                </label>
              )}
            </div>

            {/* CNPJ */}
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
                  <FileText className="h-4 w-4" />
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: "'Clash Display', sans-serif", color: T.text }}
                >
                  Documento CNPJ
                </span>
              </div>
              {cnpjDocument ? (
                <div className="relative">
                  <div
                    className="flex h-64 flex-col items-center justify-center rounded-xl"
                    style={{ background: T.successBg, border: `2px solid ${T.success}` }}
                  >
                    <FileText className="mb-3 h-14 w-14" style={{ color: T.success }} />
                    <p
                      className="px-3 text-center text-sm font-medium"
                      style={{ color: T.text }}
                    >
                      {cnpjDocument.name}
                    </p>
                    <p className="text-xs" style={{ color: T.text2 }}>
                      {(cnpjDocument.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <span
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white"
                    style={{ background: T.success }}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setcnpjDocument(null)}
                    className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium hover:opacity-80"
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
                  htmlFor="cnpj-upload"
                  className="group flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl p-6 text-center"
                  style={{
                    background: "#F8FAFC",
                    border: `2px dashed ${T.border}`,
                  }}
                >
                  <Upload className="mb-3 h-10 w-10" style={{ color: T.text3 }} />
                  <p className="text-sm font-semibold" style={{ color: T.text }}>
                    Upload do CNPJ
                  </p>
                  <p className="mt-1 text-xs" style={{ color: T.text3 }}>
                    Apenas PDF
                  </p>
                  <p
                    className="mt-2 text-xs font-medium underline-offset-2 group-hover:underline"
                    style={{ color: T.primary }}
                  >
                    Clique para selecionar
                  </p>
                  <input
                    id="cnpj-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlecnpjUpload(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Dicas */}
          <div
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
            <div className="grid gap-5 text-sm md:grid-cols-2" style={{ color: T.text2 }}>
              <div>
                <h4 className="mb-1.5 text-sm font-semibold" style={{ color: T.text }}>
                  Para a selfie
                </h4>
                <ul className="space-y-1 text-xs" style={{ color: T.text2 }}>
                  <li>• Remova óculos escuros e chapéus</li>
                  <li>• Mantenha boa iluminação no rosto</li>
                  <li>• Rosto claramente visível</li>
                  <li>• Imagem nítida e de boa qualidade</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-1.5 text-sm font-semibold" style={{ color: T.text }}>
                  Para o CNPJ
                </h4>
                <ul className="space-y-1 text-xs" style={{ color: T.text2 }}>
                  <li>• Documento deve estar atualizado</li>
                  <li>• Arquivo em formato PDF</li>
                  <li>• Tamanho máximo de 10 MB</li>
                  <li>• Texto legível</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleBack}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors hover:opacity-80"
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
              disabled={!ready}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              style={{
                background: ready
                  ? `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`
                  : "#E2E8F0",
                color: ready ? "#FFFFFF" : T.text3,
                boxShadow: ready
                  ? "0 16px 36px -16px rgba(124,58,237,0.5)"
                  : "none",
              }}
            >
              Finalizar verificação
              <ArrowRight className="h-5 w-5" />
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
