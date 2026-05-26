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

const SHADOW_BG =
  "radial-gradient(1100px 700px at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 50%), linear-gradient(180deg,#040712,#070b17 50%,#090f1f)";

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
        className="relative min-h-screen overflow-hidden p-4 text-white md:p-8"
        style={{ background: SHADOW_BG }}
      >
        <div className="relative z-10 mx-auto w-full max-w-4xl space-y-8 py-6">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-[0_8px_24px_-12px_rgba(124,58,237,0.7)]">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span
              className="text-xs font-semibold tracking-[0.16em] text-white/60"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              SHADOWPAY · KYC
            </span>
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3 text-center"
          >
            <h1
              className="text-3xl font-bold text-white md:text-[36px]"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Selfie & CNPJ
            </h1>
            <p className="mx-auto max-w-md text-sm text-white/55">
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
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${
                      step.current
                        ? "bg-gradient-to-br from-violet-500 to-indigo-500"
                        : step.done
                        ? "bg-gradient-to-br from-violet-500 to-indigo-500"
                        : "bg-white/10"
                    }`}
                  >
                    {step.done && !step.current ? "✓" : i + 1}
                  </div>
                  <span
                    className={`hidden text-xs sm:inline ${
                      step.current
                        ? "font-semibold text-white"
                        : "text-white/45"
                    }`}
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    {step.label}
                  </span>
                  {i < arr.length - 1 && (
                    <div className="h-px w-8 bg-violet-500/40" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Selfie */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                  <User className="h-4 w-4" />
                </span>
                <span
                  className="text-sm font-semibold text-white/85"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
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
                    className="h-64 w-full rounded-xl border-2 border-emerald-500/60 object-cover"
                  />
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </span>
                  <button
                    type="button"
                    onClick={removeSelfie}
                    className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-white/70 hover:bg-white/[0.07] hover:text-white"
                  >
                    Trocar foto
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="selfie-upload"
                  className="group flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/[0.1] bg-white/[0.02] p-6 text-center hover:border-violet-500/40 hover:bg-white/[0.04]"
                >
                  <User className="mb-3 h-10 w-10 text-white/40" />
                  <p className="text-sm font-semibold text-white/80">
                    Envie sua selfie
                  </p>
                  <p className="mt-1 text-xs text-white/40">JPG, PNG, JPEG</p>
                  <p className="mt-2 text-xs font-medium text-violet-300 underline-offset-2 group-hover:underline">
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
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                  <FileText className="h-4 w-4" />
                </span>
                <span
                  className="text-sm font-semibold text-white/85"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Documento CNPJ
                </span>
              </div>
              {cnpjDocument ? (
                <div className="relative">
                  <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-emerald-500/60 bg-white/[0.03]">
                    <FileText className="mb-3 h-14 w-14 text-emerald-400" />
                    <p className="px-3 text-center text-sm font-medium text-white/85">
                      {cnpjDocument.name}
                    </p>
                    <p className="text-xs text-white/45">
                      {(cnpjDocument.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setcnpjDocument(null)}
                    className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-white/70 hover:bg-white/[0.07] hover:text-white"
                  >
                    Trocar arquivo
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="cnpj-upload"
                  className="group flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/[0.1] bg-white/[0.02] p-6 text-center hover:border-violet-500/40 hover:bg-white/[0.04]"
                >
                  <Upload className="mb-3 h-10 w-10 text-white/40" />
                  <p className="text-sm font-semibold text-white/80">
                    Upload do CNPJ
                  </p>
                  <p className="mt-1 text-xs text-white/40">Apenas PDF</p>
                  <p className="mt-2 text-xs font-medium text-violet-300 underline-offset-2 group-hover:underline">
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
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
            <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Dicas importantes
            </h3>
            <div className="grid gap-5 text-sm text-white/65 md:grid-cols-2">
              <div>
                <h4 className="mb-1.5 text-sm font-semibold text-white/80">
                  Para a selfie
                </h4>
                <ul className="space-y-1 text-xs text-white/55">
                  <li>• Remova óculos escuros e chapéus</li>
                  <li>• Mantenha boa iluminação no rosto</li>
                  <li>• Rosto claramente visível</li>
                  <li>• Imagem nítida e de boa qualidade</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-1.5 text-sm font-semibold text-white/80">
                  Para o CNPJ
                </h4>
                <ul className="space-y-1 text-xs text-white/55">
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
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={!ready}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              style={{
                background: ready
                  ? "linear-gradient(120deg, #7C3AED, #6366F1)"
                  : "rgba(255,255,255,0.05)",
                boxShadow: ready
                  ? "0 20px 48px -18px rgba(124,58,237,0.7)"
                  : "none",
              }}
            >
              Finalizar verificação
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <p className="text-center text-xs text-white/40">
            🔒 Todos os dados são processados com segurança e protegidos por
            criptografia
          </p>
        </div>
      </div>
    </>
  );
}
