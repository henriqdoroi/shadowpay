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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";

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

function ApiKeyContent() {
  const { user, token } = useAuth();
  const [credentials, setCredentials] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      fetchCredentials(); // Recarregar lista
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
      toast.error("IP atualizado com sucesso!");
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
  }, [user, token]);

  const currentCredential = credentials.length > 0 ? credentials[0] : null;
  const hasCredentials = credentials.length > 0;

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
                    <BreadcrumbPage>Chaves de API</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen">
            {/* Cards */}
            <Card
              className="
              p-6
              min-w-[280px] max-w-[360px] w-full
              md:min-w-auto md:max-w-none
              flex flex-col justify-between
            "
            >
              <CardHeader>
                <CardTitle>Suas Credenciais de API</CardTitle>
              </CardHeader>
              <CardContent>
                {hasCredentials && currentCredential ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Public Key</Label>
                      <Input
                        value={currentCredential.publicKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Private Key</Label>
                      <Input
                        type="password"
                        value="••••••••••••••••••••••••••••••••••••"
                        readOnly
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>IP Autorizado</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={sellerIp}
                          onChange={(e) => setSellerIp(e.target.value)}
                          placeholder="Ex: 187.45.123.67"
                        />
                        <Button
                          variant="outline"
                          className="cursor-pointer"
                          onClick={updateSellerIp}
                        >
                          Salvar IP
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button onClick={generateCredentials}>
                    Gerar Credenciais
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Histórico */}
            <Card
              className="
              overflow-x-auto
              p-6
              min-w-[280px] max-w-[360px] w-full
              md:min-w-auto md:max-w-none
              flex flex-col justify-between
            "
            >
              <CardHeader>
                <CardTitle>Histórico de Credenciais</CardTitle>
              </CardHeader>
              <CardContent>
                {hasCredentials ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Public Key</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Criada em</TableHead>
                        <TableHead>Último uso</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {credentials.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            {c.publicKey.substring(0, 16)}...
                          </TableCell>
                          <TableCell>{c.seller_ip || "-"}</TableCell>
                          <TableCell>
                            {new Date(c.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {c.lastUsedAt
                              ? new Date(c.lastUsedAt).toLocaleString()
                              : "Nunca"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              className="cursor-pointer"
                              variant="outline"
                              onClick={() => renewCredentials(c.id)}
                            >
                              Renovar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>Nenhuma credencial encontrada.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Modal de Novas Credenciais */}
      <Dialog open={showNewKeysModal} onOpenChange={setShowNewKeysModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Credenciais Geradas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Alerta */}
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <span className="font-semibold text-green-800 dark:text-green-200">
                  Credenciais geradas com sucesso!
                </span>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  Copie e guarde suas chaves em um local seguro.
                </p>
              </AlertDescription>
            </Alert>

            {/* Novas Chaves */}
            {newApiKey && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Public Key (Chave Pública)
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
                  <Label className="text-sm text-muted-foreground">
                    Private Key (Chave Privada)
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
                  <p className="text-xs text-destructive font-semibold">
                    ⚠️ ATENÇÃO: Esta é a única vez que você verá esta chave
                    privada completa!
                  </p>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3">
              <Button onClick={handleConfirmNewKeys} className="flex-1">
                Confirmar e Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApiKey() {
  return (
    <ProtectedRoute>
      <ApiKeyContent />
    </ProtectedRoute>
  );
}
