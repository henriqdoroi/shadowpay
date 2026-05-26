import Image from "next/image";
import { ArrowRight, ShieldCheck, FileText, Camera, User } from "lucide-react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import Head from "next/head";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const SHADOW_BG =
  "radial-gradient(1100px 700px at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 50%), linear-gradient(180deg,#040712,#070b17 50%,#090f1f)";

function KycContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleStartVerification = () => {
    router.push("/v1/kyc/document-upload");
  };

  const checklist = [
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Documento de identidade válido (RG, CNH ou Passaporte)",
    },
    { icon: <Camera className="h-4 w-4" />, label: "Foto clara do documento" },
    { icon: <User className="h-4 w-4" />, label: "Selfie para verificação facial" },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      label: "Comprovante de inscrição CNPJ",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Verificação KYC</title>
      </Head>

      <div
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 text-white"
        style={{ background: SHADOW_BG }}
      >
        {/* Partículas */}
        {mounted && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute h-1 w-1 rounded-full bg-violet-400/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
                transition={{
                  duration: 5 + Math.random() * 4,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        )}

        {/* Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(124,58,237,0.45), rgba(99,102,241,0.15) 50%, transparent 70%)",
          }}
        />

        <div className="relative z-10 w-full max-w-2xl space-y-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-[0_8px_24px_-12px_rgba(124,58,237,0.7)]">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span
              className="text-sm font-semibold tracking-[0.16em] text-white/70"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              SHADOWPAY · KYC
            </span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3 text-center"
          >
            <h1
              className="text-3xl font-bold text-white md:text-[40px]"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Verificação de identidade
            </h1>
            <p className="mx-auto max-w-lg text-sm text-white/55 md:text-base">
              Para sua segurança e conformidade, precisamos confirmar quem você é
              antes de liberar toda a operação.
            </p>
          </motion.div>

          {/* Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] p-8 backdrop-blur-xl"
          >
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl"
              style={{ background: "rgba(139,92,246,0.18)" }}
            />

            {/* Ilustração */}
            <div className="relative flex justify-center">
              <Image
                alt="Identity verification illustration"
                src={"/8449768_3907312.svg"}
                width={560}
                height={320}
                className="h-auto max-w-full opacity-90"
              />
            </div>

            {/* Checklist */}
            <div className="relative mt-6 space-y-3">
              <h3
                className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-white/55"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                O que você precisa
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {checklist.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 + i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-white/80"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-xs text-white/40">
                Não tem o CNPJ?{" "}
                <a
                  href="https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp"
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-300 underline-offset-2 hover:underline"
                >
                  Emita aqui
                </a>
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handleStartVerification}
              className="group relative mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                boxShadow: "0 20px 48px -18px rgba(124,58,237,0.7)",
              }}
            >
              Iniciar verificação
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>

            <p className="relative mt-4 text-center text-xs text-white/40">
              🔒 Seus dados são protegidos com criptografia ponta-a-ponta
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-center text-xs text-white/35"
          >
            Processo rápido e seguro · Geralmente leva menos de 2 minutos
          </motion.p>
        </div>
      </div>
    </>
  );
}

export default function Kyc() {
  return (
    <ProtectedRoute>
      <KycContent />
    </ProtectedRoute>
  );
}
