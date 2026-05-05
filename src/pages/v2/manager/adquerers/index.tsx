// AdquerersPage.tsx
"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Adquirer {
  id?: string;
  reference: string;
  url: string;
  txCashIn: number;
  txPercentCashIn: number;
  txPercentCashOut: number;
  txCashOut: number;
  publicKey: string;
  privateKey: string;
  isActive: boolean;
  license?: string;
  passwordfreep: string;
  xgate_id?: string;
  xgate_user?: string;
  xgate_password?: string;
  company_id?: string; // <-- aqui
}

export default function AdquerersPage() {
  const [adquirentes, setAdquirentes] = useState<Adquirer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Adquirer>({
    reference: "",
    url: "",
    passwordfreep: "",
    txCashIn: 0,
    txPercentCashIn: 0,
    txPercentCashOut: 0,
    txCashOut: 0,
    publicKey: "",
    privateKey: "",
    company_id: "",
    isActive: true,
    xgate_user: "",
    xgate_password: "",
    xgate_id: "",
  });

  const API_BASE = "https://shadowpay-production-2ca8.up.railway.app/api/admin";

  useEffect(() => {
    fetchAdquirentes();
  }, []);

  const fetchAdquirentes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      const res = await fetch(`${API_BASE}/adquerers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);

      const response = await res.json();
      if (!response.success) throw new Error("Falha ao obter adquirentes");
      setAdquirentes(response.data);
    } catch (error) {
      console.error("Erro ao buscar adquirentes:", error);
      toast.error("Erro ao buscar adquirentes");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericFields = [
      "txCashIn",
      "txPercentCashIn",
      "txPercentCashOut",
      "txCashOut",
    ];

    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Token não encontrado");
      return;
    }

    let payload: Partial<Adquirer> = {
      reference: form.reference,
      url: form.url,
      txCashIn: form.txCashIn,
      txPercentCashIn: form.txPercentCashIn,
      txPercentCashOut: form.txPercentCashOut,
      txCashOut: form.txCashOut,
      isActive: form.isActive,
      publicKey: form.publicKey, // <--- garante envio
      privateKey: form.privateKey,
    };
    const refLower = form.reference?.trim().toLowerCase() || "";

    if (refLower.includes("medusa")) {
      payload.publicKey = form.publicKey;
      payload.privateKey = form.privateKey;
    }
    if (refLower.includes("pagone")) {
      payload.publicKey = form.publicKey;
      payload.privateKey = form.privateKey;
    }
    if (refLower.includes("xgate")) {
      payload.xgate_id = form.xgate_id;
      payload.xgate_user = form.xgate_user;
      payload.xgate_password = form.xgate_password;
    }
    if (refLower.includes("freepay")) {
      payload.company_id = form.company_id;
      payload.privateKey = form.privateKey;
      payload.passwordfreep = form.passwordfreep;
    }

    try {
      const res = await fetch(
        form.id ? `${API_BASE}/adquerers/${form.id}` : `${API_BASE}/adquerers`,
        {
          method: form.id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erro ao salvar adquirente");
      }

      toast.success(
        form.id
          ? "Adquirente editado com sucesso"
          : "Adquirente criado com sucesso"
      );

      fetchAdquirentes();
      setIsModalOpen(false);
      setIsViewMode(false);
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar adquirente:", error);
      toast.error("Erro ao salvar adquirente: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      reference: "",
      url: "",
      passwordfreep: "",
      txCashIn: 0,
      txPercentCashIn: 0,
      txPercentCashOut: 0,
      txCashOut: 0,
      publicKey: "",
      privateKey: "",
      company_id: "",
      isActive: true,
      xgate_user: "",
      xgate_password: "",
      xgate_id: "",
    });
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      const res = await fetch(`${API_BASE}/adquerers/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !current }),
      });

      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);

      fetchAdquirentes();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const openEditModal = (item: Adquirer, viewOnly = false) => {
    setForm({ ...item });
    setIsViewMode(viewOnly);
    setIsModalOpen(true);
  };

  const getStatusBadge = (active: boolean) => (
    <Badge variant={active ? "default" : "destructive"}>
      {active ? "Ativo" : "Inativo"}
    </Badge>
  );

  const renderConditionalFields = () => {
    const ref = form.reference?.toLowerCase() ?? "";

    if (ref.includes("medusa")) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="privateKey">Chave Privada</Label>
            <Input
              id="privateKey"
              name="privateKey"
              type="password"
              value={form.privateKey}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="license">License</Label>
            <Input
              id="license"
              name="license"
              type="password"
              value={form.license || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
        </div>
      );
    }

    if (ref.includes("xgate")) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="xgate_user">Usuário XGate</Label>
            <Input
              id="xgate_user"
              name="xgate_user"
              value={form.xgate_user || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="xgate_password">Senha XGate</Label>
            <Input
              id="xgate_password"
              name="xgate_password"
              value={form.xgate_password || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="xgate_id">ID XGate</Label>
            <Input
              id="xgate_id"
              name="xgate_id"
              value={form.xgate_id || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
        </div>
      );
    }
    if (ref.includes("medius")) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="privateKey">Chave Privada</Label>
            <Input
              id="privateKey"
              name="privateKey"
              type="password"
              value={form.privateKey || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="company_id">Company Id</Label>
            <Input
              id="company_id"
              name="company_id"
              type="password"
              value={form.company_id || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="passwordfreep">Senha Freepay</Label>
            <Input
              id="passwordfreep"
              name="passwordfreep"
              type="password"
              value={form.passwordfreep || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
        </div>
      );
    }
    if (ref.includes("pagone")) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="privateKey">Chave Privada</Label>
            <Input
              id="privateKey"
              name="privateKey"
              type="password"
              value={form.privateKey || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="publicKey">Chave Publica</Label>
            <Input
              id="publicKey"
              name="publicKey"
              type="password"
              value={form.publicKey || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
        </div>
      );
    }
    if (ref.includes("freepay")) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="privateKey">Chave Privada</Label>
            <Input
              id="privateKey"
              name="privateKey"
              type="password"
              value={form.privateKey || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="company_id">Company Id</Label>
            <Input
              id="company_id"
              name="company_id"
              type="password"
              value={form.company_id || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="passwordfreep">Senha Freepay</Label>
            <Input
              id="passwordfreep"
              name="passwordfreep"
              type="password"
              value={form.passwordfreep || ""}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center gap-2 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-2 h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Safira Cash</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Adquirentes</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Adquirentes</h1>
              <Dialog
                open={isModalOpen}
                onOpenChange={(open) => {
                  if (!open) setIsViewMode(false);
                  setIsModalOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    className="cursor-pointer"
                    onClick={() => {
                      resetForm();
                      setIsViewMode(false);
                      setIsModalOpen(true);
                    }}
                  >
                    Cadastrar Novo
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {isViewMode
                        ? "Visualizar Adquirente"
                        : form.id
                        ? "Editar Adquirente"
                        : "Novo Adquirente"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Nome */}
                    <div>
                      <Label htmlFor="reference">Nome</Label>
                      <Input
                        id="reference"
                        name="reference"
                        value={form.reference}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    {/* Campos padrão */}
                    <div>
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        name="url"
                        value={form.url}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    {renderConditionalFields()}

                    {/* Taxas */}
                    <div>
                      <Label htmlFor="txCashIn">Taxa Fixa Cash-In (R$)</Label>
                      <Input
                        id="txCashIn"
                        name="txCashIn"
                        type="number"
                        step="0.01"
                        value={form.txCashIn}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="txPercentCashIn">
                        Taxa Percentual Cash-In (%)
                      </Label>
                      <Input
                        id="txPercentCashIn"
                        name="txPercentCashIn"
                        type="number"
                        step="0.01"
                        value={form.txPercentCashIn}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="txCashOut">Taxa Fixa Cash-Out (R$)</Label>
                      <Input
                        id="txCashOut"
                        name="txCashOut"
                        type="number"
                        step="0.01"
                        value={form.txCashOut}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="txPercentCashOut">
                        Taxa Percentual Cash-Out (%)
                      </Label>
                      <Input
                        id="txPercentCashOut"
                        name="txPercentCashOut"
                        type="number"
                        step="0.01"
                        value={form.txPercentCashOut}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                    </div>

                    {!isViewMode && (
                      <Button
                        className="cursor-pointer"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {form.id ? "Atualizar" : "Salvar"}
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Adquirentes Cadastrados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {adquirentes.length === 0 && (
                  <p>Nenhum adquirente cadastrado.</p>
                )}

                <div className="hidden md:grid grid-cols-12 gap-2 border-b font-semibold text-sm text-muted-foreground pb-2 px-4">
                  <div className="col-span-3">Nome</div>
                  <div className="col-span-4">URL</div>
                  <div className="col-span-3">Chave APK</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1 text-right">Ações</div>
                </div>

                {adquirentes.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-md p-4 space-y-2 md:space-y-0 md:grid md:grid-cols-12 md:gap-2 md:items-center"
                  >
                    {/* Mobile */}
                    <div className="md:hidden text-sm space-y-1">
                      <div>
                        <strong>Nome:</strong> {item.reference}
                      </div>
                      <div>
                        <strong>URL:</strong> {item.url}
                      </div>
                      <div>
                        <strong>Chave APK:</strong>{" "}
                        {item.reference === "FREEPAY"
                          ? item.passwordfreep
                            ? item.passwordfreep.slice(0, 4) + "••••••••"
                            : ""
                          : item.privateKey
                          ? item.privateKey.slice(0, 4) + "••••••••"
                          : item.xgate_user
                          ? item.xgate_user.slice(0, 4) + "••••••••"
                          : ""}
                      </div>
                      <div>
                        <strong>Status:</strong> {getStatusBadge(item.isActive)}
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:block col-span-3">
                      {item.reference}
                    </div>
                    <div className="hidden md:block col-span-4 truncate">
                      {item.url}
                    </div>
                    <div className="hidden md:block col-span-3 text-muted-foreground">
                      {item.reference === "FREEPAY"
                        ? item.passwordfreep
                          ? item.passwordfreep.slice(0, 4) + "••••••••"
                          : ""
                        : item.privateKey
                        ? item.privateKey.slice(0, 4) + "••••••••"
                        : item.xgate_user
                        ? item.xgate_user.slice(0, 4) + "••••••••"
                        : ""}
                    </div>
                    <div className="hidden md:block col-span-1">
                      {getStatusBadge(item.isActive)}
                    </div>

                    <div className="flex justify-end items-center gap-2 col-span-12 md:col-span-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              className="cursor-pointer"
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(item, true)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Visualizar</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              className="cursor-pointer"
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(item, false)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              className="cursor-pointer"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                toggleStatus(item.id!, item.isActive)
                              }
                            >
                              {item.isActive ? (
                                <ToggleLeft className="h-4 w-4 text-green-500" />
                              ) : (
                                <ToggleRight className="h-4 w-4 text-red-500" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.isActive ? "Inativar" : "Ativar"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
