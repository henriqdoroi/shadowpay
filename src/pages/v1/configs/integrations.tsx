// /v1/configs/integrations → redireciona pra /v1/integrations (já existe).
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function IntegrationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/v1/integrations");
  }, [router]);
  return null;
}
