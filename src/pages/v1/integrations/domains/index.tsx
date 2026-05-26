import Head from "next/head";
import { Globe } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ComingSoon } from "@/components/ComingSoon";
import ShadowPanel from "@/components/ShadowPanel";

export default function DomainsPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Domínios</title>
      </Head>
      <LightShell>
        <ComingSoon
          subtitle="Integrações"
          title="Domínios"
          description="Conecte seu domínio próprio aos seus checkouts. Aumente a confiança do cliente, reduza fraude e mantenha controle total sobre a sua marca de pagamento."
          icon={<Globe className="h-7 w-7" />}
          accent="#22C55E"
          eta="Em breve"
        />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
