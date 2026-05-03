import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plug, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";

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

function WebhookContent() {
  const { user, token } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookType, setNewWebhookType] = useState<string>("");
  const [newWebhookDescription, setNewWebhookDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Função para buscar webhooks
  const fetchWebhooks = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await axios.get<WebhooksResponse>(
        "https://api.safira.cash/api/webhooks",
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

  // Função para criar webhook
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
        "https://api.safira.cash/api/webhooks",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        await fetchWebhooks(); // Recarregar lista
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

  // Função para deletar webhook
  const deleteWebhook = async (id: string) => {
    if (!token) return;

    try {
      const response = await axios.delete(
        `https://api.safira.cash/api/webhooks/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        await fetchWebhooks(); // Recarregar lista
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

  const getStatusBadge = (isActive: boolean) => {
    const config = isActive
      ? { variant: "default" as const, label: "Ativo", icon: CheckCircle }
      : { variant: "secondary" as const, label: "Inativo", icon: XCircle };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (eventType: string) => {
    const typeConfig = {
      TRANSACTIONS: {
        label: "Transações",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      PRODUCTS: {
        label: "Produtos",
        color:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      },
    };

    const config = typeConfig[eventType as keyof typeof typeConfig];

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
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

  return (
    <div className="min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Safira Cash</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Webhooks</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen">
            {/* Cards resumo */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              {/* Total Webhooks */}
              <Card
                className="
              p-6
              min-w-[280px] max-w-[360px] w-full
              md:min-w-auto md:max-w-none
              flex flex-col justify-between
            "
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Total de Webhooks
                    <Plug className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-3xl font-bold">{totalWebhooks}</h3>
                  <p className="text-sm text-muted-foreground">
                    Webhooks configurados
                  </p>
                </CardContent>
              </Card>

              {/* Webhooks ativos */}
              <Card
                className="
              p-6
              min-w-[280px] max-w-[360px] w-full
              md:min-w-auto md:max-w-none
              flex flex-col justify-between
            "
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Webhooks Ativos
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-3xl font-bold text-green-600">
                    {activeWebhooks}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Funcionando corretamente
                  </p>
                </CardContent>
              </Card>

              {/* Botão adicionar webhook */}
              <Card
                className="
              p-6
              min-w-[280px] max-w-[360px] w-full
              md:min-w-auto md:max-w-none
              flex flex-col justify-between
            "
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Conectar Webhook
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure novos webhooks para receber notificações em tempo
                    real
                  </p>
                  <Button className="w-full cursor-pointer" onClick={openModal}>
                    <Plus className="h-5 w-5 mr-2" />
                    Conectar Webhook
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Lista webhooks */}
            <Card
              className="
            overflow-x-auto
            p-4
            min-w-[280px] max-w-[360px] w-full
            md:min-w-auto md:max-w-none md:p-6
            flex flex-col justify-between
          "
            >
              <CardHeader>
                <CardTitle>Webhooks Conectados</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                      Carregando webhooks...
                    </p>
                  </div>
                ) : !webhooks || webhooks.length === 0 ? (
                  <div className="text-center py-8">
                    <Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Nenhum webhook configurado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Configure seu primeiro webhook para começar a receber
                      notificações
                    </p>
                    <Button
                      onClick={openModal}
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Conectar Primeiro Webhook
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL do Webhook</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Último Disparo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhooks.map((webhook) => (
                        <TableRow
                          key={webhook.id}
                          className="hover:bg-muted/50 dark:hover:bg-gray-800"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-foreground" />
                              <div>
                                <p className="font-medium">
                                  {truncateUrl(webhook.url)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {
                                    webhook.url
                                      .replace("https://", "")
                                      .replace("http://", "")
                                      .split("/")[0]
                                  }
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(webhook.eventType)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(webhook.isActive)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(webhook.createdAt)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {webhook.lastSentAt
                              ? formatDate(webhook.lastSentAt)
                              : "Nunca"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteWebhook(webhook.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {/* Modal de adicionar webhook */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Conectar Novo Webhook
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Info */}
            <div className="text-center space-y-2 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Configure um webhook</p>
              <p className="text-xs text-muted-foreground">
                Receba notificações em tempo real sobre eventos em sua conta
              </p>
            </div>

            {/* URL */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Plug className="h-4 w-4" />
                URL do Webhook
              </Label>
              <Input
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                placeholder="https://api.exemplo.com/webhook"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Insira a URL completa onde deseja receber as notificações
              </p>
            </div>

            {/* Tipo */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de Evento</Label>
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
              <p className="text-xs text-muted-foreground">
                Escolha que tipo de eventos você deseja receber
              </p>
            </div>

            {/* Info importante */}
            <div className="text-center space-y-3 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Informações Importantes</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• O webhook será testado após a configuração</p>
                <p>• Certifique-se de que a URL está acessível</p>
                <p>• Você pode configurar múltiplos webhooks</p>
                <p>• Os dados serão enviados via POST em JSON</p>
              </div>
            </div>

            {/* Botões */}
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
                {isCreating ? "Conectando..." : "Conectar Webhook"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Webhook() {
  return (
    <ProtectedRoute>
      <WebhookContent />
    </ProtectedRoute>
  );
}
