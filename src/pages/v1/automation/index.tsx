import Head from "next/head";
import { Workflow } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ComingSoon } from "@/components/ComingSoon";
import ShadowPanel from "@/components/ShadowPanel";

export default function AutomationPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Automação</title>
      </Head>
      <LightShell>
        <ComingSoon
          subtitle="Inteligência"
          title="Automação"
          description="Crie fluxos automatizados: dispare ações quando uma venda for aprovada, um saque for solicitado, um chargeback chegar. Integre com WhatsApp, e-mail, n8n e Zapier."
          icon={<Workflow className="h-7 w-7" />}
          accent="#22D3EE"
          eta="Em breve"
        />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
