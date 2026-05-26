import Head from "next/head";
import { Shield } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ComingSoon } from "@/components/ComingSoon";
import ShadowPanel from "@/components/ShadowPanel";

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Segurança</title>
      </Head>
      <LightShell>
        <ComingSoon
          subtitle="Configurações"
          title="Segurança"
          description="Centralize 2FA, dispositivos confiáveis, sessões ativas, logs de acesso e whitelisting de IPs. Sua operação protegida em um só lugar."
          icon={<Shield className="h-7 w-7" />}
          accent="#F59E0B"
          eta="Em breve"
        />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
