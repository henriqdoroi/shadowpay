import Head from "next/head";
import { BellRing } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ComingSoon } from "@/components/ComingSoon";
import ShadowPanel from "@/components/ShadowPanel";

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Notificações</title>
      </Head>
      <LightShell>
        <ComingSoon
          subtitle="Configurações"
          title="Notificações"
          description="Configure como e quando você recebe alertas: vendas aprovadas, chargebacks, saques processados, alertas Shadow AI. Por e-mail, push, WhatsApp ou Telegram."
          icon={<BellRing className="h-7 w-7" />}
          accent="#EC4899"
          eta="Em breve"
        />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
