"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ComingSoon } from "@/components/ComingSoon";
import Head from "next/head";
import { Building2 } from "lucide-react";

export default function AcquirersPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Adquirentes</title>
      </Head>
      <LightShell>
        <ComingSoon
          subtitle="AVANÇADO"
          title="Adquirentes"
          description="Veja todas as adquirentes conectadas à sua conta, taxas, limites e roteamento PIX. Solicite uma nova adquirente direto pelo painel."
          icon={<Building2 className="h-8 w-8" />}
          accent="#0EA5E9"
          eta="EM BREVE"
        />
      </LightShell>
    </ProtectedRoute>
  );
}
