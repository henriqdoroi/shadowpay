// Mantido pra compatibilidade de bookmark / link antigo.
// /v1/finance/withdraw → /v1/finance (página única agora).
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function WithdrawRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/v1/finance");
  }, [router]);
  return null;
}
