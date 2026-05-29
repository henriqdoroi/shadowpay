// Taxas agora ficam no Financeiro. Redirect pra evitar quebrar links.
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function FeeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/v1/finance");
  }, [router]);
  return null;
}
