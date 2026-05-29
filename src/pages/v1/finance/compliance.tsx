// Compliance foi removido da navegação. Redireciona pra Financeiro.
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ComplianceRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/v1/finance");
  }, [router]);
  return null;
}
