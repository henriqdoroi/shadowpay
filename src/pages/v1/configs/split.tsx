"use client";

/**
 * /v1/configs/split — Split de pagamento (placeholder em construção)
 */
import Head from "next/head";
import { GitBranch, Clock } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ProfileTabs } from "@/components/ProfileTabs";
import ShadowPanel from "@/components/ShadowPanel";
import {
  DarkConfigShell,
  DarkCard,
  SectionHeader,
  DARK_T,
  StatusPill,
} from "@/components/DarkConfigShell";

function SplitContent() {
  return (
    <>
      <Head>
        <title>ShadowPay — Split de Pagamento</title>
      </Head>
      <LightShell>
        <DarkConfigShell>
          <ProfileTabs />

          <DarkCard className="p-6">
            <SectionHeader
              icon={<GitBranch className="h-5 w-5" />}
              title="Split de Pagamento"
              subtitle="Divida automaticamente o valor de cada venda entre parceiros."
              right={<StatusPill label="Em breve" variant="violet" />}
            />

            <div className="flex flex-col items-center justify-center py-12">
              <div
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  background: "rgba(139,92,246,0.15)",
                  border: `2px solid ${DARK_T.primary}`,
                }}
              >
                <Clock className="h-8 w-8" style={{ color: DARK_T.primary }} />
              </div>
              <p className="text-[18px] font-bold" style={{ color: DARK_T.text }}>
                Funcionalidade em construção
              </p>
              <p
                className="mt-2 max-w-md text-center text-[13px]"
                style={{ color: DARK_T.text2 }}
              >
                Em breve você poderá configurar split automático entre
                vendedores, afiliados e parceiros. Defina porcentagens fixas
                ou por produto.
              </p>
            </div>
          </DarkCard>
        </DarkConfigShell>
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function SplitPage() {
  return (
    <ProtectedRoute>
      <SplitContent />
    </ProtectedRoute>
  );
}
