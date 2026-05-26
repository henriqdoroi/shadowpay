import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, Key, Globe, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

interface ApiKey {
  id: string;
  publicKey: string;
  privateKey?: string;
  seller_ip?: string;
  createdAt: string;
  lastUsedAt?: string;
}

interface CredentialsResponse {
  success: boolean;
  data: ApiKey[];
}

interface CreateCredentialResponse {
  success: boolean;
  message: string;
  data: ApiKey;
}

interface RenewCredentialResponse {
  success: boolean;
  message: string;
  data: ApiKey;
}

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

function ApiKeyContent() {
  const { user, token } = useAuth();
  const [credentials, setCredentials] = useState<ApiKey[]>([]);
  const [, setIsLoading] = useState(true);
  const [showNewKeysModal, setShowNewKeysModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<ApiKey | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [sellerIp, setSellerIp] = useState<string>("");

  const fetchCredentials = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get<CredentialsResponse>(
        "https://shadowpay-api-production.up.railway.app/api/credentials",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setCredentials(response.data.data);
        if (response.data.data?.length > 0) {
          setSellerIp(response.data.data[0]?.seller_ip ?? "");
        }
      } else {
        toast.error("Erro ao carregar credenciais");
      }
    } catch (error) {
      console.error("Erro ao buscar credenciais:", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };
  const handleCopyKey = (key: string, type: string) => {
    navigator.clipboard.writeText(key);
    toast.success(`${type} copiada com sucesso!`);
  };

  const handleConfirmNewKeys = () => {
    if (newApiKey) {
      fetchCredentials();
      setNewApiKey(null);
      setShowNewKeysModal(false);
    }
  };

  const updateSellerIp = async () => {
    if (!token || !credentials[0]) return;
    try {
      await axios.put(
        `https://shadowpay-api-production.up.railway.app/api/credentials/${credentials[0].id}/ip`,
        { seller_ip: sellerIp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("IP atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar IP:", error);
      toast.error("Erro ao atualizar IP");
    }
  };

  const generateCredentials = async () => {
    if (!token) return;
    setIsGenerating(true);
    try {
      const response = await axios.post<CreateCredentialResponse>(
        "https://shadowpay-api-production.up.railway.app/api/credentials",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setNewApiKey(response.data.data);
        setShowNewKeysModal(true);
        toast.success(
          response.data.message || "Credenciais geradas com sucesso!"
        );
      } else {
        toast.error("Erro ao gerar credenciais");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao conectar com o servidor"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const renewCredentials = async (id: string) => {
    if (!token) return;
    setRenewingId(id);
    try {
      const response = await axios.put<RenewCredentialResponse>(
        `https://shadowpay-api-production.up.railway.app/api/credentials/${id}/renew`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setNewApiKey(response.data.data);
        setShowNewKeysModal(true);
        toast.success(
          response.data.message || "Credenciais renovadas com sucesso!"
        );
      } else {
        toast.error("Erro ao renovar credenciais");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao conectar com o servidor"
      );
    } finally {
      setRenewingId(null);
    }
  };

  useEffect(() => {
    if (user && token) fetchCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const currentCredential = credentials.length > 0 ? credentials[0] : null;
  const hasCredentials = credentials.length > 0;

  const inputCls =
    "h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/[0.05]";

  return (
    <>
      <Head>
        <title>ShadowPay — Chaves de API</title>
      </Head>

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            <header className="flex items-center gap-3 px-4 pt-6 lg:px-8">
              <SidebarTrigger className="text-white/60 hover:text-white" />
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Chaves de API
                </h1>
                <p className="mt-1 text-xs text-white/40">
                  Gere e gerencie suas credenciais de integração
                </p>
              </div>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {/* Card credenciais */}
              <motion.div
                initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
              >
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
                  style={{ background: "rgba(139,92,246,0.18)" }}
                />
                <div className="relative mb-4 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                    <Key className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                    Suas credenciais
                  </span>
                </div>

                {hasCredentials && currentCredential ? (
                  <div className="relative space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs text-white/50">
                        Public Key
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          value={currentCredential.publicKey}
                          readOnly
                          className={inputCls}
                        />
                        <button
                          onClick={() =>
                            handleCopyKey(
                              currentCredential.publicKey,
                              "Chave pública"
                            )
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs text-white/50">
                        Private Key
                      </label>
                      <input
                        type="password"
                        value="••••••••••••••••••••••••••••••••••••"
                        readOnly
                        className={inputCls}
                      />
                      <p className="text-xs text-white/40">
                        Por segurança, a chave privada só é exibida no momento da
                        criação.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs text-white/50">
                        <Globe className="mr-1.5 inline h-3.5 w-3.5" />
                        IP Autorizado
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          value={sellerIp}
                          onChange={(e) => setSellerIp(e.target.value)}
                          placeholder="Ex: 187.45.123.67"
                          className={inputCls}
                        />
                        <button
                          onClick={updateSellerIp}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                          style={{
                            background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                            boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                          }}
                        >
                          Salvar IP
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-white/40">
                        Para girar suas chaves, gere um novo par. A chave anterior
                        será revogada.
                      </p>
                      <button
                        onClick={() => renewCredentials(currentCredential.id)}
                        disabled={renewingId === currentCredential.id}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {renewingId === currentCredential.id
                          ? "Renovando…"
                          : "Renovar credenciais"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center gap-3 py-6 text-center">
                    <Key className="h-7 w-7 text-violet-400/60" />
                    <p className="text-sm text-white/60">
                      Você ainda não tem credenciais. Gere agora para integrar com
                      a API.
                    </p>
                    <button
                      onClick={generateCredentials}
                      disabled={isGenerating}
                      className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                      style={{
                        background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                        boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                      }}
                    >
                      {isGenerating ? "Gerando…" : "Gerar credenciais"}
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Histórico */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="border-b border-white/[0.06] px-5 py-4">
                  <h2
                    className="text-sm font-semibold text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Histórico de credenciais
                  </h2>
                </div>
                <div className="overflow-x-auto p-2 sm:p-4">
                  {hasCredentials ? (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-white/40">
                          <th className="px-3 py-2 font-medium">Public Key</th>
                          <th className="px-3 py-2 font-medium">IP</th>
                          <th className="px-3 py-2 font-medium">Criada em</th>
                          <th className="px-3 py-2 font-medium">Último uso</th>
                          <th className="px-3 py-2 text-right font-medium">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {credentials.map((c) => (
                          <tr
                            key={c.id}
                            className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]"
                          >
                            <td className="px-3 py-3 font-mono text-xs text-white/80">
                              {c.publicKey.substring(0, 16)}…
                            </td>
                            <td className="px-3 py-3 text-white/60">
                              {c.seller_ip || "—"}
                            </td>
                            <td className="px-3 py-3 text-white/50">
                              {new Date(c.createdAt).toLocaleString("pt-BR")}
                            </td>
                            <td className="px-3 py-3 text-white/50">
                              {c.lastUsedAt
                                ? new Date(c.lastUsedAt).toLocaleString("pt-BR")
                                : "Nunca"}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <button
                                onClick={() => renewCredentials(c.id)}
                                disabled={renewingId === c.id}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                              >
                                {renewingId === c.id ? "Renovando…" : "Renovar"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-12 text-center">
                      <Key className="mx-auto mb-3 h-6 w-6 text-violet-400/40" />
                      <p className="text-sm font-medium text-white/60">
                        Nenhuma credencial ainda
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        Gere suas chaves para integrar com a API.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </main>
          </SidebarInset>
        </SidebarProvider>

        {/* Modal de novas credenciais */}
        <Dialog open={showNewKeysModal} onOpenChange={setShowNewKeysModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                Credenciais geradas
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <Alert className="border-emerald-500/30 bg-emerald-500/[0.06]">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <AlertDescription>
                  <span className="font-semibold text-emerald-200">
                    Credenciais geradas com sucesso!
                  </span>
                  <p className="mt-1 text-emerald-200/70">
                    Copie e guarde suas chaves em um local seguro.
                  </p>
                </AlertDescription>
              </Alert>

              {newApiKey && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-white/60">
                      Public Key (chave pública)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newApiKey.publicKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleCopyKey(newApiKey.publicKey, "Chave pública")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-white/60">
                      Private Key (chave privada)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newApiKey.privateKey || ""}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleCopyKey(
                            newApiKey.privateKey || "",
                            "Chave privada"
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs font-semibold text-rose-300">
                      ⚠️ Esta é a única vez que você verá esta chave privada
                      completa.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleConfirmNewKeys} className="flex-1">
                  Confirmar e fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <ShadowPanel />
      </div>
    </>
  );
}

export default function ApiKey() {
  return (
    <ProtectedRoute>
      <ApiKeyContent />
    </ProtectedRoute>
  );
}
