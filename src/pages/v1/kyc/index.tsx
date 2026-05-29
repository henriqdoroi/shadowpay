import Image from "next/image";
import { ArrowRight, ShieldCheck, FileText, Camera, User } from "lucide-react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import Head from "next/head";
import { motion } from "framer-motion";
import { LightShell } from "@/components/LightShell";
import { ProfileTabs } from "@/components/ProfileTabs";

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
};

function KycContent() {
  const router = useRouter();

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

      <LightShell>
        <ProfileTabs />
        <div className="relative mx-auto w-full max-w-2xl space-y-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-2"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{
                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryStrong})`,
                boxShadow: "0 8px 24px -12px rgba(124,58,237,0.5)",
              }}
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span
              className="text-sm font-semibold tracking-[0.16em]"
              style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif", color: T.text2 }}
            >
              SHADOWPAY · KYC
            </span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="space-y-3 text-center"
          >
            <h1
              className="text-3xl font-bold md:text-[40px]"
              style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif", color: T.text }}
            >
              Verificação de identidade
            </h1>
            <p className="mx-auto max-w-lg text-sm md:text-base" style={{ color: T.text2 }}>
              Para sua segurança e conformidade, precisamos confirmar quem você é
              antes de liberar toda a operação.
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="relative overflow-hidden rounded-3xl p-8"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              boxShadow:
                "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -12px rgba(15,23,42,0.10)",
            }}
          >
            {/* Ilustração */}
            <div className="relative flex justify-center">
              <Image
                alt="Identity verification illustration"
                src={"/8449768_3907312.svg"}
                width={560}
                height={320}
                className="h-auto max-w-full"
              />
            </div>

            {/* Checklist */}
            <div className="relative mt-6 space-y-3">
              <h3
                className="text-center text-sm font-semibold uppercase tracking-[0.16em]"
                style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif", color: T.text2 }}
              >
                O que você precisa
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {checklist.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
                    style={{
                      background: "#F8FAFC",
                      border: `1px solid ${T.border}`,
                      color: T.text,
                    }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: T.primaryBg, color: T.primary }}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-xs" style={{ color: T.text3 }}>
                Não tem o CNPJ?{" "}
                <a
                  href="https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp"
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:underline"
                  style={{ color: T.primary }}
                >
                  Emita aqui
                </a>
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handleStartVerification}
              className="group relative mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition-transform hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                color: "#FFFFFF",
                boxShadow: "0 16px 36px -16px rgba(124,58,237,0.5)",
              }}
            >
              Iniciar verificação
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>

            <p className="relative mt-4 text-center text-xs" style={{ color: T.text3 }}>
              Seus dados são protegidos com criptografia ponta-a-ponta
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-center text-xs"
            style={{ color: T.text3 }}
          >
            Processo rápido e seguro · Geralmente leva menos de 2 minutos
          </motion.p>
        </div>
      </LightShell>
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
