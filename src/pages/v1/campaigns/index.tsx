"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

/* /v1/campaigns foi renomeado pra /v1/tracking — redireciona pra preservar
   links antigos (sidebar, externos etc). */
export default function CampaignsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/v1/tracking");
  }, [router]);
  return null;
}
