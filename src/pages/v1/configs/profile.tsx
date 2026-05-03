"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  User,
  Building,
  Mail,
  Phone,
  FileText,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UserProfile {
  companyName: string;
  email: string;
  number: string;
  cpf_cnpj: string;
  zipCode: string;
  companyModality: string | null;
  companyActivity: string | null;
}

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token não encontrado");

        const response = await fetch(
          "https://api.safira.cash/api/user/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ao buscar perfil: ${response.statusText}`);
        }

        const result = await response.json();
        setUserProfile(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Envia a requisição para alterar a senha
  const handlePasswordSubmit = async () => {
    // Valida se as senhas coincidem
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }

    // Valida tamanho mínimo da nova senha
    if (passwordData.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres!");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Busca o token JWT no localStorage
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      // Chama a API para alterar a senha
      const response = await fetch(
        "https://api.safira.cash/api/auth/password",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: passwordData.currentPassword,
            new_password: passwordData.newPassword,
          }),
        }
      );

      // Se a resposta não for OK, extrai a mensagem de erro e lança
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao alterar senha");
      }

      // Reseta os campos após sucesso
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Senha alterada com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;
  if (error) return <div className="p-4 text-red-500">Erro: {error}</div>;

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Safira Cash</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Perfil</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <main className="flex flex-col gap-8 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Seu Perfil</h1>
                <p className="text-muted-foreground">
                  Visualize suas informações e altere sua senha
                </p>
              </div>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => window.open("https://wa.me/5531975610055?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20solu%C3%A7%C3%B5es%20escal%C3%A1veis%20para%20processar%20pagamento", "_blank")}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Suporte
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Empresa */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" /> Informações da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Razão Social</Label>
                    <div className="bg-muted p-3 rounded-md">
                      {userProfile?.companyName || "—"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CNPJ</Label>
                      <div className="bg-muted p-3 rounded-md">
                        {userProfile?.cpf_cnpj || "—"}
                      </div>
                    </div>
                    <div>
                      <Label>CEP</Label>
                      <div className="bg-muted p-3 rounded-md">
                        {userProfile?.zipCode || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Empresa</Label>
                      <div className="bg-muted p-3 rounded-md">
                        {userProfile?.companyModality || "—"}
                      </div>
                    </div>
                    <div>
                      <Label>Ramo de Atuação</Label>
                      <div className="bg-muted p-3 rounded-md">
                        {userProfile?.companyActivity || "—"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contato */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" /> Informações de Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> E-mail
                    </Label>
                    <div className="bg-muted p-3 rounded-md">
                      {userProfile?.email || "—"}
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> WhatsApp
                    </Label>
                    <div className="bg-muted p-3 rounded-md">
                      {userProfile?.number || "—"}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <FileText className="h-5 w-5 text-blue-500 mb-2" />
                    <p className="text-sm text-blue-700">
                      Para alterar os dados, entre em contato com o suporte.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Senha */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" /> Alterar Senha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["currentPassword", "newPassword", "confirmPassword"].map(
                    (field, i) => (
                      <div key={field}>
                        <Label htmlFor={field}>
                          {field === "currentPassword"
                            ? "Senha Atual"
                            : field === "newPassword"
                            ? "Nova Senha"
                            : "Confirmar Senha"}
                        </Label>
                        <div className="relative">
                          <Input
                            id={field}
                            type={
                              field === "currentPassword"
                                ? showCurrentPassword
                                  ? "text"
                                  : "password"
                                : field === "newPassword"
                                ? showNewPassword
                                  ? "text"
                                  : "password"
                                : showConfirmPassword
                                ? "text"
                                : "password"
                            }
                            value={
                              passwordData[field as keyof typeof passwordData]
                            }
                            onChange={(e) =>
                              handlePasswordChange(field, e.target.value)
                            }
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => {
                              if (field === "currentPassword")
                                setShowCurrentPassword((v) => !v);
                              if (field === "newPassword")
                                setShowNewPassword((v) => !v);
                              if (field === "confirmPassword")
                                setShowConfirmPassword((v) => !v);
                            }}
                          >
                            {(field === "currentPassword" &&
                              showCurrentPassword) ||
                            (field === "newPassword" && showNewPassword) ||
                            (field === "confirmPassword" &&
                              showConfirmPassword) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handlePasswordSubmit}
                    disabled={
                      isChangingPassword ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                    className="min-w-[120px] cursor-pointer"
                  >
                    {isChangingPassword ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <h4 className="text-sm font-medium text-amber-900 mb-2">
                    Dicas de Segurança
                  </h4>
                  <ul className="text-xs text-amber-800 list-disc ml-5 space-y-1">
                    <li>Use pelo menos 8 caracteres</li>
                    <li>Combine letras, números e símbolos</li>
                    <li>Evite informações pessoais</li>
                    <li>Não reutilize senhas antigas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
