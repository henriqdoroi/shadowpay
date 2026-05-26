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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plug,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Webhook as WebhookIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

interface WebhookConnection {
  id: string;
  url: string;
  eventType: "TRANSACTIONS" | "PRODUCTS";
  isActive: boolean;
  createdAt: string;
  lastSentAt?: string;
  description?: string;
  sellerId: string;
}

interface WebhooksResponse {
  success: boolean;
  data: WebhookConnection[];
}

interface CreateWebhookRequest {
  url: string;
  eventType: "TRANSACTIONS" | "PRODUCTS";
  description?: string;
}

const webhookTypes = [
  { value: "TRANSACTIONS", label: "Transações" },
  { value: "PRODUCTS", label: "Produtos" },
];

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

function WebhookContent() {
  const { user, token } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookType, setNewWebhookType] = useState<string>("");
  const [newWebhookDescription, setNewWebhookDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchWebhooks = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await axios.get<WebhooksResponse>(
        "https://shadowpay-api-production.up.railway.app/api/webhooks",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setWebhooks(response.data.data);
      } else {
        toast.error("Erro ao carregar webhooks");
      }
    } catch (error) {
      console.error("Erro ao buscar webhooks:", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!token || !newWebhookUrl.trim() || !newWebhookType) return;

    setIsCreating(true);
    try {
      const requestData: CreateWebhookRequest = {
        url: newWebhookUrl.trim(),
        eventType: newWebhookType as "TRANSACTIONS" | "PRODUCTS",
      };

      if (newWebhookDescription.trim()) {
        requestData.description = newWebhookDescription.trim();
      }

      const response = await axios.post(
        "https://shadowpay-api-production.up.railway.app/api/webhooks",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        await fetchWebhooks();
        closeModal();
        toast.success("Webhook criado com sucesso!");
      } else {
        toast.error(response.data.message || "Erro ao criar webhook");
      }
    } catch (error: any) {
      console.error("Erro ao criar webhook:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao conectar com o servidor";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!token) return;

    try {
      const response = await axios.delete(
        `https://shadowpay-api-production.up.railway.app/api/webhooks/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        await fetchWebhooks();
        toast.success("Webhook deletado com sucesso!");
      } else {
        toast.error(response.data.message || "Erro ao deletar webhook");
      }
    } catch (error: any) {
      console.error("Erro ao deletar webhook:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao conectar com o servidor";
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchWebhooks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getStatusBadge = (isActive: boolean) =>
    isActive ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-300">
        <CheckCircle className="h-3 w-3" /> Ativo
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/60">
        <XCircle className="h-3 w-3" /> Inativo
      </span>
    );

  const getTypeBadge = (eventType: string) => {
    const map: Record<string, { color: string; label: string }> = {
      TRANSACTIONS: {
        color: "bg-violet-500/15 text-violet-300 border-violet-500/30",
        label: "Transações",
      },
      PRODUCTS: {
        color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        label: "Produtos",
      },
    };
    const config = map[eventType] ?? {
      color: "bg-white/10 text-white/60 border-white/15",
      label: eventType,
    };
    return (
      <span
        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const openModal = () => {
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setNewWebhookUrl("");
    setNewWebhookType("");
    setNewWebhookDescription("");
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  const activeWebhooks = webhooks?.filter((w) => w.isActive).length || 0;
  const totalWebhooks = webhooks?.length || 0;

  const kpis = [
    {
      label: "Total de webhooks",
      value: String(totalWebhooks),
      sub: "Webhooks configurados",
      icon: <Plug className="h-4 w-4" />,
      accent: "#8B5CF6",
    },
    {
      label: "Webhooks ativos",
      value: String(activeWebhooks),
      sub: "Funcionando corretamente",
      icon: <CheckCircle className="h-4 w-4" />,
      accent: "#34D399",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Webhooks</title>
      </Head>

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            <header className="flex flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white/60 hover:text-white" />
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Webhooks
                  </h1>
                  <p className="mt-1 text-xs text-white/40">
                    Receba notificações em tempo real dos eventos da sua conta
                  </p>
                </div>
              </div>
              <button
                onClick={openModal}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                  boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                }}
              >
                <Plus className="h-4 w-4" />
                Conectar webhook
              </button>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {/* KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                  >
                    <div
                      className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                      style={{ background: `${k.accent}22` }}
                    />
                    <div className="relative mb-4 flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${k.accent}1f`, color: k.accent }}
                      >
                        {k.icon}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                        {k.label}
                      </span>
                    </div>
                    <div
                      className="relative text-3xl font-semibold tracking-tight text-white"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {k.value}
                    </div>
                    <p className="relative mt-1.5 text-xs text-white/35">
                      {k.sub}
                    </p>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                >
                  <div
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
                    style={{ background: "rgba(99,102,241,0.2)" }}
                  />
                  <div className="relative mb-4 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                      <Plus className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                      Conectar webhook
                    </span>
                  </div>
                  <p className="relative mb-4 text-xs text-white/40">
                    Configure novos webhooks para receber notificações em tempo
                    real
                  </p>
                  <button
                    onClick={openModal}
                    className="relative inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                      boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                    }}
                  >
                    <Plus className="h-4 w-4" /> Conectar webhook
                  </button>
                </motion.div>
              </div>

              {/* Lista de webhooks */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="border-b border-white/[0.06] px-5 py-4">
                  <h2
                    className="text-sm font-semibold text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Webhooks conectados
                  </h2>
                </div>
                <div className="p-2 sm:p-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-14 animate-pulse rounded-xl bg-white/10"
                        />
                      ))}
                    </div>
                  ) : !webhooks || webhooks.length === 0 ? (
                    <div className="py-14 text-center">
                      <WebhookIcon className="mx-auto mb-3 h-8 w-8 text-violet-400/40" />
                      <h3 className="text-base font-semibold text-white/80">
                        Nenhum webhook configurado
                      </h3>
                      <p className="mx-auto mt-1 max-w-md text-sm text-white/40">
                        Configure seu primeiro webhook para começar a receber
                        notificações dos eventos da sua conta.
                      </p>
                      <button
                        onClick={openModal}
                        className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Conectar primeiro webhook
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-white/40">
                            <th className="px-3 py-2 font-medium">URL</th>
                            <th className="px-3 py-2 font-medium">Tipo</th>
                            <th className="px-3 py-2 font-medium">Status</th>
                            <th className="px-3 py-2 font-medium">Criado em</th>
                            <th className="px-3 py-2 font-medium">
                              Último disparo
                            </th>
                            <th className="px-3 py-2 text-right font-medium">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {webhooks.map((webhook) => (
                            <tr
                              key={webhook.id}
                              className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]"
                            >
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                                    <WebhookIcon className="h-3.5 w-3.5" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-white/90">
                                      {truncateUrl(webhook.url)}
                                    </p>
                                    <p className="truncate text-xs text-white/40">
                                      {
                                        webhook.url
                                          .replace("https://", "")
                                          .replace("http://", "")
                                          .split("/")[0]
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                {getTypeBadge(webhook.eventType)}
                              </td>
                              <td className="px-3 py-3">
                                {getStatusBadge(webhook.isActive)}
                              </td>
                              <td className="px-3 py-3 text-white/50">
                                {formatDate(webhook.createdAt)}
                              </td>
                              <td className="px-3 py-3 text-white/50">
                                {webhook.lastSentAt
                                  ? formatDate(webhook.lastSentAt)
                                  : "Nunca"}
                              </td>
                              <td className="px-3 py-3 text-right">
                                <button
                                  onClick={() => deleteWebhook(webhook.id)}
                                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 text-xs text-rose-300 transition-colors hover:bg-rose-500/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">
                                    Excluir
                                  </span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            </main>
          </SidebarInset>
        </SidebarProvider>

        {/* Modal de adicionar webhook */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                Conectar novo webhook
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                <p className="text-sm font-medium text-white/80">
                  Configure um webhook
                </p>
                <p className="text-xs text-white/45">
                  Receba notificações em tempo real sobre eventos da sua conta
                </p>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Plug className="h-4 w-4" />
                  URL do webhook
                </Label>
                <Input
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://api.exemplo.com/webhook"
                  className="text-sm"
                />
                <p className="text-xs text-white/40">
                  Insira a URL completa onde deseja receber as notificações
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de evento</Label>
                <Select value={newWebhookType} onValueChange={setNewWebhookType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo de evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {webhookTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-white/40">
                  Escolha que tipo de eventos você deseja receber
                </p>
              </div>

              <div className="space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                <p className="text-sm font-medium text-white/80">
                  Informações importantes
                </p>
                <div className="space-y-0.5 text-xs text-white/45">
                  <p>• O webhook será testado após a configuração</p>
                  <p>• Certifique-se de que a URL está acessível</p>
                  <p>• Você pode configurar múltiplos webhooks</p>
                  <p>• Os dados serão enviados via POST em JSON</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={closeModal} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={createWebhook}
                  className="flex-1 cursor-pointer"
                  disabled={
                    !newWebhookUrl.trim() || !newWebhookType || isCreating
                  }
                >
                  {isCreating ? "Conectando…" : "Conectar webhook"}
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

export default function Webhook() {
  return (
    <ProtectedRoute>
      <WebhookContent />
    </ProtectedRoute>
  );
}
