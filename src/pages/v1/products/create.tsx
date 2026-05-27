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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Package,
  Upload,
  Settings,
  Zap,
  Link,
  Code,
  ShoppingCart,
  ExternalLink,
  Trash2,
  Plus,
} from "lucide-react";
import router, { useRouter } from "next/router";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "ativo" | "inativo" | "rascunho";
  sales: number;
  createdAt: string;
  checkoutUrl: string;
}
interface ProductFormData {
  name: string;
  description: string;
  price: string;
  status: "ativo" | "inativo" | "rascunho";
  checkoutUrl: string;
  productType: "digital" | "fisico" | "servico";
  billingType: "unico" | "recorrente";
  salesPageUrl: string;
  upsellUrl: string;
  warrantyDays: string;
  supportWhatsapp?: string;
  supportEmail?: string;
  productImage?: File | string | null;
  bannerImageUrl?: string;
  productImageFile?: File;
}

export default function CreateProduct() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    status: "ativo",
    checkoutUrl: "",
    productType: "digital",
    billingType: "unico",
    salesPageUrl: "",
    upsellUrl: "",
    warrantyDays: "",
    supportWhatsapp: "",
    supportEmail: "",
    productImage: null,
    bannerImageUrl: "",
  });
  type Testimonial = {
    name: string;
    text: string;
    rating: number;
    image?: File | null; // novo campo para imagem
    imagePosition?: "left" | "right"; // novo campo para posição
  };
  // Ajusta o estado do appearanceSettings
  const [appearanceSettings, setAppearanceSettings] = useState<{
    theme: "padrao" | "escuro" | "claro";
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    showBanner: boolean;
    bannerImage: File | string | null;
    bannerImageFile: File | null;
    showTimer: boolean;
    timerMinutes: number;
    showHeader: boolean;
    headerTitle: string;
    showProductName: boolean; // Added this line
    showProductImage: boolean;
    showProductDescription: boolean; // Added this line
    showTopbar: boolean;
    topbarText: string;
    showTestimonials: boolean;
    customFields: Record<string, any>;
    footerText: string;
    testimonials: Testimonial[]; // <- usa o tipo atualizado
    orderBumps: Array<{
      id: number;
      title: string;
      description: string;
      price: string;
      active: boolean;
    }>;
  }>({
    theme: "padrao",
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#FFFFFF",
    showBanner: false,
    bannerImage: null,
    showProductImage: false,
    showProductName: true,
    showProductDescription: false,
    bannerImageFile: null,
    showTimer: false,
    timerMinutes: 15,
    showHeader: false,
    headerTitle: "Oferta Especial",
    showTopbar: false,
    topbarText: "Últimas vagas disponíveis!",
    showTestimonials: false,
    customFields: {},
    footerText: "",
    testimonials: [
      {
        name: "",
        text: "",
        rating: 0,
        image: null,
        imagePosition: "left",
      },
    ],
    orderBumps: [
      { id: 1, title: "", description: "", price: "", active: false },
    ],
  });
  const [paymentMethods, setPaymentMethods] = useState({
    pix: { enabled: false, percent: 0 },
    boleto: { enabled: false, percent: 0 },
    cartao: { enabled: false, percent: 0 },
    picpay: { enabled: false, percent: 0 },
    googlepay: { enabled: false, percent: 0 },
    applepay: { enabled: false, percent: 0 },
  });
  // Estado para armazenar a forma de pagamento selecionada
  const [selectedPayment, setSelectedPayment] = useState<
    keyof typeof paymentMethods | null
  >(null);

  // Função para ativar/desativar
  const handleToggle = (key: keyof typeof paymentMethods, value: boolean) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: value },
    }));
  };

  // Função para alterar %
  const handlePercentChange = (
    key: keyof typeof paymentMethods,
    value: number
  ) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [key]: { ...prev[key], percent: Number(value) },
    }));
  };
  const [checkoutLinks, setCheckoutLinks] = useState([
    {
      id: 1,
      url: "https://dash.safira.cash/produto-" + (id || "1"),
      domain: "dash.safira.cash",
      isCustomDomain: false,
      createdAt: new Date().toISOString(),
    },
  ]);
  const productTypeMap: Record<string, "DIGITAL" | "PHYSICAL" | "SERVICE"> = {
    digital: "DIGITAL",
    fisico: "PHYSICAL",
    servico: "SERVICE",
  };

  const [newCustomDomain, setNewCustomDomain] = useState("");

  const [apiSettings, setApiSettings] = useState({
    pixelAdsToken: "",
    utmifyToken: "",
    fbpixelidToken: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAppearanceChange = (field: string, value: any) => {
    setAppearanceSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const [formFields, setFormFields] = useState({
    nome: false,
    email: false,
    cpf: false,
    celular: false,
  });
  const handleApiChange = (field: string, value: string) => {
    setApiSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formDataToSend = new FormData();
  for (let [key, value] of formDataToSend.entries()) {
    console.log(key, value);
  }

  const handleSave = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");

    const paymentMethodMap: Record<
      "unico" | "recorrente",
      "UNIQUE" | "RECURRENT"
    > = {
      unico: "UNIQUE",
      recorrente: "RECURRENT",
    };

    const mapThemeToEnum = (
      theme: string
    ): "MODERN" | "CLASSIC" | "MINIMAL" | "DARK" | "CUSTOM" => {
      switch ((theme || "").toLowerCase()) {
        case "escuro":
          return "DARK";
        case "claro":
          return "MODERN";
        case "padrao":
        default:
          return "MODERN";
      }
    };

    const extractFileName = (urlOrPath: string) => {
      if (!urlOrPath) return "";
      if (urlOrPath.startsWith("blob:")) return "";
      const clean = urlOrPath.split("?")[0];
      const parts = clean?.split("/") ?? []; // retorna array vazio se clean for undefined
      return parts[parts.length - 1] || "";
    };

    try {
      // ---------- Validações ----------
      if (!formData.name?.trim())
        throw new Error("Por favor, preencha o campo Nome do produto.");
      if (!formData.productType)
        throw new Error("Selecione o tipo de produto.");
      if (!formData.billingType)
        throw new Error("Selecione o método de pagamento.");

      // ---------- Preparar FormData ----------
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append(
        "price",
        String(parseFloat(formData.price || "0") || 0)
      );
      formDataToSend.append(
        "isActive",
        formData.status === "ativo" ? "true" : "false"
      );
      formDataToSend.append(
        "productType",
        productTypeMap[formData.productType] || "DIGITAL"
      );
      formDataToSend.append(
        "paymentMethod",
        paymentMethodMap[formData.billingType as "unico" | "recorrente"] ||
          "UNIQUE"
      );
      formDataToSend.append("linkSalesPage", formData.salesPageUrl || "");
      formDataToSend.append("linkUpSell", formData.upsellUrl || "");
      formDataToSend.append(
        "daysGuarantee",
        String(parseInt(formData.warrantyDays || "0", 10) || 0)
      );
      formDataToSend.append("whatsappSupport", formData.supportWhatsapp || "");
      formDataToSend.append("emailSupport", formData.supportEmail || "");
      // ---------- Pixel e UTMify ----------
      formDataToSend.append("pixelToken", apiSettings.pixelAdsToken || "");
      formDataToSend.append("fbpixelid", apiSettings.fbpixelidToken || "");
      formDataToSend.append("utmifyToken", apiSettings.utmifyToken || "");
      // ---------- Imagem do produto ----------
      if (formData.productImageFile instanceof File) {
        formDataToSend.append("productImage", formData.productImageFile);
      } else if (typeof formData.productImage === "string") {
        const oldName = extractFileName(formData.productImage);
        if (oldName) formDataToSend.append("productImageOld", oldName);
      }

      // ---------- Banner do checkout ----------
      if (appearanceSettings.bannerImageFile instanceof File) {
        formDataToSend.append(
          "bannerImage",
          appearanceSettings.bannerImageFile
        );
      } else if (typeof appearanceSettings.bannerImage === "string") {
        const oldName = extractFileName(appearanceSettings.bannerImage);
        if (oldName) formDataToSend.append("bannerImageOld", oldName);
      }

      const testimonialsToSave = (appearanceSettings.testimonials || []).map(
        (t, i) => {
          if (t.image instanceof File) {
            formDataToSend.append(`testimonialImage_${i}`, t.image); // ✅ envia o arquivo real
          }
          return {
            name: t.name,
            text: t.text,
            rating: t.rating,
            image: t.image instanceof File ? "" : t.image || null, // ✅ backend vai definir o caminho
            imagePosition: t.imagePosition || "left",
          };
        }
      );

      // ---------- OrderBumps ----------
      const orderBumpsToSave = (appearanceSettings.orderBumps || []).map(
        (o) => ({
          id: o.id,
          title: o.title,
          description: o.description,
          price: o.price,
          active: o.active,
        })
      );
      const isNew = !id; // true se estiver criando
      // ---------- Checkout Config completo ----------
      formDataToSend.append(
        "checkoutConfig",
        JSON.stringify({
          checkoutUrl: formData.checkoutUrl || "",
          theme: mapThemeToEnum(appearanceSettings.theme),
          primaryColor: appearanceSettings.primaryColor,
          secondaryColor: appearanceSettings.secondaryColor,
          backgroundColor: appearanceSettings.backgroundColor,
          textColor: appearanceSettings.textColor,
          buttonColor: appearanceSettings.buttonColor,
          buttonTextColor: appearanceSettings.buttonTextColor,
          showImageProduct: appearanceSettings.showProductImage,
          showProductName: appearanceSettings.showProductName,
          showDescription: isNew
            ? false
            : appearanceSettings.showProductDescription,
          showHeader: isNew ? false : appearanceSettings.showHeader,
          customFields: {
            ...(appearanceSettings.customFields || {}),
            links: (checkoutLinks || []).map((link) => ({
              url: link.url,
              isCustomDomain: !!link.isCustomDomain,
              createdAt: link.createdAt,
            })),
            orderBumps: orderBumpsToSave,
          },
          customHeroText: appearanceSettings.headerTitle,
          customTimerText: appearanceSettings.topbarText,
          customFooterText: appearanceSettings.footerText,
          testimonials: testimonialsToSave,
          showTimer: appearanceSettings.showTimer,
          timerMinutes: appearanceSettings.timerMinutes,
          paymentMethods,
          formFields: {
            nome: formFields.nome,
            email: formFields.email,
            cpf: formFields.cpf,
            celular: formFields.celular,
          },
        })
      );

      // ---------- Requisição ----------
      const url = id
        ? `https://shadowpay-api-production.up.railway.app/api/products/${id}`
        : "https://shadowpay-api-production.up.railway.app/api/products";
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Erro ao salvar produto");
      router.push("/v1/products");
    } catch (error) {
      console.error("❌ Erro ao salvar produto:", error);
      alert(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/v1/products");
  };

  return (
    <div className="min-h-screen" style={{ color: "#0F172A" }}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset
          style={{
            background: "#F1F3F8",
            color: "#0F172A",
          }}
        >
          <header className="flex items-center gap-3 px-4 pt-6 lg:px-8">
            <SidebarTrigger style={{ color: "#64748B" }} />
            <div>
              <h1
                className="text-2xl font-bold tracking-tight md:text-[28px]"
                style={{ fontFamily: "'Clash Display', sans-serif", color: "#0F172A" }}
              >
                Criar Produto
              </h1>
              <p className="mt-1 text-xs" style={{ color: "#64748B" }}>
                Configure produto, checkout e formas de pagamento
              </p>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  size="icon"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Criar Produto</h1>
                  <p className="text-muted-foreground">
                    Preencha as informações do seu produto
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Salvando..." : "Criar Produto"}
              </Button>
            </div>

            {/* Tabs de Edição */}
            <Tabs defaultValue="dados-gerais" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  value="dados-gerais"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Dados Gerais</span>
                </TabsTrigger>

                <TabsTrigger
                  value="aparencia"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Aparência</span>
                </TabsTrigger>

                <TabsTrigger
                  value="links"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Link className="h-4 w-4" />
                  <span className="hidden sm:inline">Links</span>
                </TabsTrigger>

                <TabsTrigger
                  value="apis"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Code className="h-4 w-4" />
                  <span className="hidden sm:inline">API's</span>
                </TabsTrigger>
              </TabsList>

              {/* Aba Dados Gerais */}
              <TabsContent value="dados-gerais" className="space-y-6">
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                  {/* Informações Básicas */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Informações do Produto
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Nome do Produto */}
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            className="cursor-pointer"
                            checked={appearanceSettings.showProductName}
                            onCheckedChange={(checked) =>
                              setAppearanceSettings((prev) => ({
                                ...prev,
                                showProductName: checked,
                              }))
                            }
                          />
                          <span className="text-sm">
                            Mostrar nome do produto
                          </span>
                        </div>

                        {/* Input do nome do produto */}
                        {appearanceSettings.showProductName && (
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome do Produto</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) =>
                                handleInputChange("name", e.target.value)
                              }
                              placeholder="Digite o nome do produto"
                            />
                          </div>
                        )}

                        {/* Valor do Produto */}
                        <div className="space-y-2">
                          <Label htmlFor="price">Valor do Produto (R$)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) =>
                              handleInputChange("price", e.target.value)
                            }
                            placeholder="0,00"
                            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                        </div>
                        {/* Descrição */}
                        {/* Switch para mostrar/ocultar descrição do produto */}
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            className="cursor-pointer"
                            checked={appearanceSettings.showProductDescription}
                            onCheckedChange={(checked) =>
                              setAppearanceSettings((prev) => ({
                                ...prev,
                                showProductDescription: checked,
                              }))
                            }
                          />
                          <span className="text-sm">
                            Mostrar descrição do produto
                          </span>
                        </div>

                        {/* Textarea da descrição */}
                        {appearanceSettings.showProductDescription && (
                          <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) =>
                                handleInputChange("description", e.target.value)
                              }
                              placeholder="Descreva seu produto"
                              rows={4}
                            />
                          </div>
                        )}
                        {/* Tipo de Produto e Tipo de Cobrança */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tipo de Produto</Label>
                            <Select
                              value={formData.productType}
                              onValueChange={(
                                value: "digital" | "fisico" | "servico"
                              ) => handleInputChange("productType", value)}
                            >
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="digital">Digital</SelectItem>
                                <SelectItem value="fisico">Físico</SelectItem>
                                <SelectItem value="servico">Serviço</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Tipo de Cobrança</Label>
                            <Select
                              value={formData.billingType}
                              onValueChange={(value: "unico" | "recorrente") =>
                                handleInputChange("billingType", value)
                              }
                            >
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unico">
                                  Pagamento Único
                                </SelectItem>
                                <SelectItem value="recorrente">
                                  Recorrente
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* URLs */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="salesPageUrl">
                              Back Redirect
                            </Label>
                            <Input
                              id="salesPageUrl"
                              value={formData.salesPageUrl}
                              onChange={(e) =>
                                handleInputChange(
                                  "salesPageUrl",
                                  e.target.value
                                )
                              }
                              placeholder="https://vendas.safiracash.com/seu-produto"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="upsellUrl">URL de Upsell</Label>
                            <Input
                              id="upsellUrl"
                              value={formData.upsellUrl}
                              onChange={(e) =>
                                handleInputChange("upsellUrl", e.target.value)
                              }
                              placeholder="https://upsell.safiracash.com/seu-produto"
                            />
                          </div>
                        </div>

                        {/* Período de Garantia */}
                        <div className="space-y-2">
                          <Label htmlFor="warrantyDays">
                            Período de Garantia (dias)
                          </Label>
                          <Input
                            id="warrantyDays"
                            type="number"
                            value={formData.warrantyDays}
                            onChange={(e) =>
                              handleInputChange("warrantyDays", e.target.value)
                            }
                            placeholder="30"
                            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                        </div>

                        {/* Suporte */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="supportWhatsapp">
                              WhatsApp Suporte
                            </Label>
                            <Input
                              id="supportWhatsapp"
                              value={formData.supportWhatsapp}
                              onChange={(e) =>
                                handleInputChange(
                                  "supportWhatsapp",
                                  e.target.value
                                )
                              }
                              placeholder="+5511999999999"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="supportEmail">Email Suporte</Label>
                            <Input
                              id="supportEmail"
                              type="email"
                              value={formData.supportEmail}
                              onChange={(e) =>
                                handleInputChange(
                                  "supportEmail",
                                  e.target.value
                                )
                              }
                              placeholder="suporte@payquick.com"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Configurações e Imagem */}
                  <div>
                    <div className="space-y-6">
                      {/* Status */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Label>Status do Produto</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(
                                value: "ativo" | "inativo" | "rascunho"
                              ) => handleInputChange("status", value)}
                            >
                              <SelectTrigger className="cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                                <SelectItem value="rascunho">
                                  Rascunho
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Imagem do Produto */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Imagem do Produto
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Switch para exibir ou ocultar */}
                            <div className="flex items-center gap-2 mb-2">
                              <Switch
                                className="cursor-pointer"
                                checked={appearanceSettings.showProductImage}
                                onCheckedChange={(checked) =>
                                  setAppearanceSettings((prev) => ({
                                    ...prev,
                                    showProductImage: !!checked,
                                  }))
                                }
                              />
                              <span className="text-sm font-medium">
                                Exibir imagem no checkout
                              </span>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-4">
                                <Label
                                  htmlFor="productImage"
                                  className="cursor-pointer"
                                >
                                  <span className="mt-2 block text-sm font-medium text-gray-900">
                                    Clique para fazer upload
                                  </span>
                                  <span className="mt-1 block text-xs text-gray-500">
                                    PNG, JPG até 10MB
                                  </span>
                                </Label>
                                <Input
                                  id="productImage"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    if (file.size > 10 * 1024 * 1024) {
                                      alert(
                                        "Arquivo muito grande. Máximo 10MB."
                                      );
                                      return;
                                    }

                                    // Salvar arquivo para envio ao backend
                                    handleInputChange("productImageFile", file);

                                    // Salvar preview local
                                    handleInputChange(
                                      "productImage",
                                      URL.createObjectURL(file)
                                    );
                                  }}
                                />
                              </div>
                            </div>

                            {/* Preview da imagem */}
                            {formData.productImage && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                  Preview da Imagem:
                                </p>
                                <img
                                  src={
                                    formData.productImage instanceof File
                                      ? URL.createObjectURL(
                                          formData.productImage
                                        )
                                      : formData.productImage // se já for URL
                                  }
                                  alt="Preview do Produto"
                                  className="h-32 mx-auto rounded-md border"
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Aba Aparência */}
              <TabsContent value="aparencia" className="space-y-6">
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  {/* Configurações de Aparência */}
                  <div className="space-y-6">
                    {/* Cores e Tema */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Cores e Tema
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Tema */}
                        <div className="space-y-2">
                          <Label>Tema</Label>
                          <Select
                            value={appearanceSettings.theme}
                            onValueChange={(
                              value: "padrao" | "escuro" | "claro"
                            ) => handleAppearanceChange("theme", value)}
                          >
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="padrao">Padrão</SelectItem>
                              <SelectItem value="claro">Claro</SelectItem>
                              <SelectItem value="escuro">Escuro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Paletas prontas */}
                        <div className="space-y-2">
                          <Label>Combinações sugeridas</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { primary: "#000000", secondary: "#FFD700" }, // Preto + Dourado
                              { primary: "#1E3A8A", secondary: "#FACC15" }, // Azul escuro + Amarelo
                              { primary: "#0F172A", secondary: "#22C55E" }, // Azul petróleo + Verde
                              { primary: "#111827", secondary: "#E11D48" }, // Preto suave + Vermelho
                              { primary: "#4B5563", secondary: "#FBBF24" }, // Cinza escuro + Amarelo
                              { primary: "#065F46", secondary: "#34D399" }, // Verde escuro + Verde claro
                              { primary: "#7C3AED", secondary: "#C4B5FD" }, // Roxo + Lilás
                              { primary: "#B91C1C", secondary: "#FCA5A5" }, // Vermelho + Rosa claro
                            ].map((palette, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  handleAppearanceChange(
                                    "primaryColor",
                                    palette.primary
                                  );
                                  handleAppearanceChange(
                                    "secondaryColor",
                                    palette.secondary
                                  );
                                }}
                                className="cursor-pointer rounded-sm overflow-hidden shadow border hover:scale-105 transition-transform"
                              >
                                <div
                                  className="h-6 w-12"
                                  style={{ backgroundColor: palette.primary }}
                                />
                                <div
                                  className="h-6 w-12"
                                  style={{ backgroundColor: palette.secondary }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Seletor manual de cores */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Cor primária */}
                          <div className="space-y-2">
                            <Label htmlFor="primaryColor">Cor Primária</Label>
                            <div className="flex gap-2">
                              <Input
                                id="primaryColor"
                                type="color"
                                value={appearanceSettings.primaryColor}
                                onChange={(e) =>
                                  handleAppearanceChange(
                                    "primaryColor",
                                    e.target.value
                                  )
                                }
                                className="w-12 h-10 p-1 border rounded cursor-pointer"
                              />
                              <Input
                                value={appearanceSettings.primaryColor}
                                onChange={(e) =>
                                  handleAppearanceChange(
                                    "primaryColor",
                                    e.target.value
                                  )
                                }
                                placeholder="#3B82F6"
                                className="flex-1"
                              />
                            </div>
                          </div>

                          {/* Cor secundária */}
                          <div className="space-y-2">
                            <Label htmlFor="secondaryColor">
                              Cor Secundária
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="secondaryColor"
                                type="color"
                                value={appearanceSettings.secondaryColor}
                                onChange={(e) =>
                                  handleAppearanceChange(
                                    "secondaryColor",
                                    e.target.value
                                  )
                                }
                                className="w-12 h-10 p-1 border rounded cursor-pointer"
                              />
                              <Input
                                value={appearanceSettings.secondaryColor}
                                onChange={(e) =>
                                  handleAppearanceChange(
                                    "secondaryColor",
                                    e.target.value
                                  )
                                }
                                placeholder="#10B981"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Banner */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Banner</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Switch para exibir banner */}
                        <div className="flex items-center space-x-2">
                          <Switch
                            className="cursor-pointer"
                            id="showBanner"
                            checked={appearanceSettings.showBanner}
                            onCheckedChange={(checked) =>
                              handleAppearanceChange("showBanner", checked)
                            }
                          />
                          <Label htmlFor="showBanner">Exibir banner</Label>
                        </div>

                        {/* Se o banner estiver habilitado */}
                        {appearanceSettings.showBanner && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="bannerImage">
                                Imagem do Banner
                              </Label>

                              <div className="border border-dashed border-neutral-600 rounded-lg p-4 text-center">
                                {/* Input para arquivo */}
                                <input
                                  id="bannerImage"
                                  type="file"
                                  accept=".png,.jpg,.jpeg"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    // Validação de tamanho
                                    if (file.size > 10 * 1024 * 1024) {
                                      alert(
                                        "Arquivo muito grande. Máximo 10MB."
                                      );
                                      return;
                                    }

                                    // Salva arquivo para envio ao backend
                                    handleAppearanceChange(
                                      "bannerImageFile",
                                      file
                                    );

                                    // Salva preview local
                                    handleAppearanceChange(
                                      "bannerImage",
                                      URL.createObjectURL(file)
                                    );
                                  }}
                                  className="w-full text-sm cursor-pointer text-gray-500 
                file:mr-4 file:py-2 file:px-4 file:rounded-full 
                file:border-0 file:text-sm file:font-semibold 
                file:bg-blue-50 file:text-blue-700 
                hover:file:bg-blue-100 file:cursor-pointer"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                  PNG ou JPG até 10MB
                                </p>

                                {/* Preview da imagem */}
                                {appearanceSettings.bannerImage && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600">
                                      Preview do Banner:
                                    </p>
                                    <img
                                      src={
                                        appearanceSettings.bannerImage instanceof
                                        File
                                          ? URL.createObjectURL(
                                              appearanceSettings.bannerImage
                                            )
                                          : appearanceSettings.bannerImage // se já for URL
                                      }
                                      alt="Preview do Banner"
                                      className="h-32 mx-auto rounded-md border"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Timer */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Timer de Urgência</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            className="cursor-pointer"
                            id="showTimer"
                            checked={appearanceSettings.showTimer}
                            onCheckedChange={(checked) =>
                              handleAppearanceChange("showTimer", checked)
                            }
                          />
                          <Label htmlFor="showTimer">
                            Exibir timer de urgência
                          </Label>
                        </div>

                        {appearanceSettings.showTimer && (
                          <div className="space-y-2">
                            <Label htmlFor="timerMinutes">
                              Tempo em minutos
                            </Label>
                            <Input
                              id="timerMinutes"
                              type="number"
                              value={appearanceSettings.timerMinutes}
                              onChange={(e) =>
                                handleAppearanceChange(
                                  "timerMinutes",
                                  parseInt(e.target.value)
                                )
                              }
                              placeholder="15"
                              min="1"
                              max="60"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Header */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Header</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            className="cursor-pointer"
                            id="showHeader"
                            checked={appearanceSettings.showHeader}
                            onCheckedChange={(checked) =>
                              handleAppearanceChange("showHeader", checked)
                            }
                          />
                          <Label htmlFor="showHeader">Exibir header</Label>
                        </div>

                        {appearanceSettings.showHeader && (
                          <div className="space-y-2">
                            <Label htmlFor="headerTitle">
                              Título do Header
                            </Label>
                            <Input
                              id="headerTitle"
                              value={appearanceSettings.headerTitle}
                              onChange={(e) =>
                                handleAppearanceChange(
                                  "headerTitle",
                                  e.target.value
                                )
                              }
                              placeholder="Oferta Especial"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Métodos de pagamento</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { key: "pix", label: "PIX" },
                            { key: "boleto", label: "Boleto" },
                            { key: "cartao", label: "Cartão" },
                            { key: "picpay", label: "PicPay" },
                            { key: "googlepay", label: "Google Pay" },
                            { key: "applepay", label: "Apple Pay" },
                          ].map((method) => (
                            <div
                              key={method.key}
                              className="flex flex-col space-y-2"
                            >
                              {/* Switch */}
                              <div className="flex items-center space-x-2">
                                <Switch
                                  className="cursor-pointer"
                                  checked={
                                    paymentMethods[
                                      method.key as keyof typeof paymentMethods
                                    ]?.enabled || false
                                  }
                                  onCheckedChange={(checked) =>
                                    handleToggle(
                                      method.key as
                                        | "pix"
                                        | "boleto"
                                        | "cartao"
                                        | "picpay"
                                        | "googlepay"
                                        | "applepay",
                                      checked
                                    )
                                  }
                                />
                                <Label>{method.label}</Label>
                              </div>

                              {/* Input de % */}
                              {paymentMethods[
                                method.key as keyof typeof paymentMethods
                              ]?.enabled && (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    value={
                                      paymentMethods[
                                        method.key as keyof typeof paymentMethods
                                      ]?.percent || 0
                                    }
                                    onChange={(e) =>
                                      handlePercentChange(
                                        method.key as
                                          | "pix"
                                          | "boleto"
                                          | "cartao"
                                          | "picpay"
                                          | "googlepay"
                                          | "applepay",
                                        Number(e.target.value) // <-- converte string para number
                                      )
                                    }
                                    placeholder="0"
                                    className="w-full"
                                  />
                                  <span className="text-sm">%</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>Formulario de Identificação</CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { key: "nome", label: "Nome completo" },
                            { key: "email", label: "Email" },
                            { key: "cpf", label: "CPF/CNPJ" },
                            { key: "celular", label: "Celular" },
                          ].map((field) => (
                            <div
                              key={field.key}
                              className="flex flex-col space-y-2"
                            >
                              {/* Switch */}
                              <div className="flex items-center space-x-2">
                                <Switch
                                  className="cursor-pointer"
                                  checked={
                                    formFields[
                                      field.key as keyof typeof formFields
                                    ]
                                  }
                                  onCheckedChange={(checked) =>
                                    setFormFields((prev) => ({
                                      ...prev,
                                      [field.key]: checked,
                                    }))
                                  }
                                />
                                <Label>{field.label}</Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    {/* Topbar */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Topbar</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            className="cursor-pointer"
                            id="showTopbar"
                            checked={appearanceSettings.showTopbar}
                            onCheckedChange={(checked) =>
                              handleAppearanceChange("showTopbar", checked)
                            }
                          />
                          <Label htmlFor="showTopbar">Exibir topbar</Label>
                        </div>

                        {appearanceSettings.showTopbar && (
                          <div className="space-y-2">
                            <Label htmlFor="topbarText">Texto da Topbar</Label>
                            <Input
                              id="topbarText"
                              value={appearanceSettings.topbarText}
                              onChange={(e) =>
                                handleAppearanceChange(
                                  "topbarText",
                                  e.target.value
                                )
                              }
                              placeholder="Últimas vagas disponíveis!"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Depoimentos */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Depoimentos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            className="cursor-pointer"
                            id="showTestimonials"
                            checked={appearanceSettings.showTestimonials}
                            onCheckedChange={(checked) =>
                              handleAppearanceChange(
                                "showTestimonials",
                                checked
                              )
                            }
                          />
                          <Label htmlFor="showTestimonials">
                            Exibir depoimentos
                          </Label>
                        </div>

                        {appearanceSettings.showTestimonials && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                Depoimentos Configurados:
                              </p>
                              {appearanceSettings.testimonials.length < 5 && (
                                <Button
                                  className="cursor-pointer"
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newTestimonial = {
                                      name: "",
                                      text: "",
                                      rating: 5,
                                      image: null,
                                      imagePosition: "left",
                                    };
                                    handleAppearanceChange("testimonials", [
                                      ...appearanceSettings.testimonials,
                                      newTestimonial,
                                    ]);
                                  }}
                                >
                                  Adicionar Depoimento
                                </Button>
                              )}
                            </div>

                            <div className="space-y-3">
                              {appearanceSettings.testimonials.map(
                                (testimonial, index) => (
                                  <div
                                    key={index}
                                    className="border rounded-lg p-4 space-y-4"
                                  >
                                    <div className="flex items-center justify-between">
                                      <p className="font-medium text-sm">
                                        Depoimento {index + 1}
                                      </p>
                                      {appearanceSettings.testimonials.length >
                                        1 && (
                                        <Button
                                          className="cursor-pointer"
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const updatedTestimonials =
                                              appearanceSettings.testimonials.filter(
                                                (_, i) => i !== index
                                              );
                                            handleAppearanceChange(
                                              "testimonials",
                                              updatedTestimonials
                                            );
                                          }}
                                        >
                                          Remover
                                        </Button>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Nome */}
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`testimonialName-${index}`}
                                        >
                                          Nome
                                        </Label>
                                        <Input
                                          id={`testimonialName-${index}`}
                                          value={testimonial.name}
                                          onChange={(e) => {
                                            const updatedTestimonials =
                                              appearanceSettings.testimonials.map(
                                                (t, i) =>
                                                  i === index
                                                    ? {
                                                        ...t,
                                                        name: e.target.value,
                                                      }
                                                    : t
                                              );
                                            handleAppearanceChange(
                                              "testimonials",
                                              updatedTestimonials
                                            );
                                          }}
                                          placeholder="Nome do cliente"
                                        />
                                      </div>

                                      {/* Avaliação */}
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`testimonialRating-${index}`}
                                        >
                                          Avaliação (estrelas)
                                        </Label>
                                        <Select
                                          value={testimonial.rating.toString()}
                                          onValueChange={(value) => {
                                            const updatedTestimonials =
                                              appearanceSettings.testimonials.map(
                                                (t, i) =>
                                                  i === index
                                                    ? {
                                                        ...t,
                                                        rating: parseInt(value),
                                                      }
                                                    : t
                                              );
                                            handleAppearanceChange(
                                              "testimonials",
                                              updatedTestimonials
                                            );
                                          }}
                                        >
                                          <SelectTrigger className="cursor-pointer">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="1">
                                              1 ★
                                            </SelectItem>
                                            <SelectItem value="2">
                                              2 ★★
                                            </SelectItem>
                                            <SelectItem value="3">
                                              3 ★★★
                                            </SelectItem>
                                            <SelectItem value="4">
                                              4 ★★★★
                                            </SelectItem>
                                            <SelectItem value="5">
                                              5 ★★★★★
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Comentário */}
                                      <div className="col-span-1 md:col-span-2 space-y-2">
                                        <Label
                                          htmlFor={`testimonialText-${index}`}
                                        >
                                          Comentário
                                        </Label>
                                        <Textarea
                                          id={`testimonialText-${index}`}
                                          value={testimonial.text}
                                          onChange={(e) => {
                                            const updatedTestimonials =
                                              appearanceSettings.testimonials.map(
                                                (t, i) =>
                                                  i === index
                                                    ? {
                                                        ...t,
                                                        text: e.target.value,
                                                      }
                                                    : t
                                              );
                                            handleAppearanceChange(
                                              "testimonials",
                                              updatedTestimonials
                                            );
                                          }}
                                          placeholder="Comentário do cliente"
                                          rows={3}
                                        />
                                      </div>

                                      {/* Upload de imagem + botão escolher + select */}
                                      <div className="space-y-2 col-span-1 md:col-span-2">
                                        <div className="flex items-center space-x-4">
                                          {/* Círculo clicável */}
                                          <label
                                            htmlFor={`testimonialImage-${index}`}
                                            className="w-20 h-20 rounded-full border overflow-hidden flex items-center justify-center bg-gray-100 cursor-pointer flex-shrink-0"
                                          >
                                            {testimonial.image ? (
                                              <img
                                                src={URL.createObjectURL(
                                                  testimonial.image
                                                )}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span className="text-gray-400 text-xs text-center">
                                                Preview
                                              </span>
                                            )}
                                          </label>

                                          {/* Input escondido */}
                                          <input
                                            id={`testimonialImage-${index}`}
                                            type="file"
                                            accept="image/png, image/jpeg, image/jpg"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file =
                                                e.target.files?.[0] || null;
                                              const updatedTestimonials =
                                                appearanceSettings.testimonials.map(
                                                  (t, i) =>
                                                    i === index
                                                      ? { ...t, image: file }
                                                      : t
                                                );
                                              handleAppearanceChange(
                                                "testimonials",
                                                updatedTestimonials
                                              );
                                            }}
                                          />

                                          {/* Select de posição + botão Escolher */}
                                          <div className="flex items-center space-x-2">
                                            <Select
                                              value={
                                                testimonial.imagePosition ||
                                                "left"
                                              }
                                              onValueChange={(value) => {
                                                const updatedTestimonials =
                                                  appearanceSettings.testimonials.map(
                                                    (t, i) =>
                                                      i === index
                                                        ? {
                                                            ...t,
                                                            imagePosition:
                                                              value,
                                                          }
                                                        : t
                                                  );
                                                handleAppearanceChange(
                                                  "testimonials",
                                                  updatedTestimonials
                                                );
                                              }}
                                            >
                                              <SelectTrigger className="cursor-pointer">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="left">
                                                  Esquerda
                                                </SelectItem>
                                                <SelectItem value="right">
                                                  Direita
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>

                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                document
                                                  .getElementById(
                                                    `testimonialImage-${index}`
                                                  )
                                                  ?.click();
                                              }}
                                            >
                                              Escolher
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Order Bumps */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Order Bumps
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Adicione ofertas complementares (máximo 3)
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Order Bumps Configurados:
                          </p>
                          {appearanceSettings.orderBumps.length < 3 && (
                            <Button
                              className="cursor-pointer"
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOrderBump = {
                                  id: Date.now(),
                                  title: "",
                                  description: "",
                                  price: "",
                                  active: false,
                                };
                                handleAppearanceChange("orderBumps", [
                                  ...appearanceSettings.orderBumps,
                                  newOrderBump,
                                ]);
                              }}
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Adicionar
                            </Button>
                          )}
                        </div>

                        <div className="space-y-4">
                          {appearanceSettings.orderBumps.map(
                            (orderBump, index) => (
                              <div
                                key={orderBump.id}
                                className="border rounded-lg p-4 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      className="cursor-pointer"
                                      id={`orderBump-${orderBump.id}`}
                                      checked={orderBump.active}
                                      onCheckedChange={(checked) => {
                                        const updatedOrderBumps =
                                          appearanceSettings.orderBumps.map(
                                            (ob) =>
                                              ob.id === orderBump.id
                                                ? {
                                                    ...ob,
                                                    active: checked as boolean,
                                                  }
                                                : ob
                                          );
                                        handleAppearanceChange(
                                          "orderBumps",
                                          updatedOrderBumps
                                        );
                                      }}
                                    />
                                    <Label
                                      htmlFor={`orderBump-${orderBump.id}`}
                                    >
                                      Order Bump {index + 1}
                                    </Label>
                                  </div>
                                  {appearanceSettings.orderBumps.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updatedOrderBumps =
                                          appearanceSettings.orderBumps.filter(
                                            (ob) => ob.id !== orderBump.id
                                          );
                                        handleAppearanceChange(
                                          "orderBumps",
                                          updatedOrderBumps
                                        );
                                      }}
                                    >
                                      Remover
                                    </Button>
                                  )}
                                </div>

                                {orderBump.active && (
                                  <div className="space-y-3 ml-6">
                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`orderBumpTitle-${orderBump.id}`}
                                      >
                                        Título
                                      </Label>
                                      <Input
                                        id={`orderBumpTitle-${orderBump.id}`}
                                        value={orderBump.title}
                                        onChange={(e) => {
                                          const updatedOrderBumps =
                                            appearanceSettings.orderBumps.map(
                                              (ob) =>
                                                ob.id === orderBump.id
                                                  ? {
                                                      ...ob,
                                                      title: e.target.value,
                                                    }
                                                  : ob
                                            );
                                          handleAppearanceChange(
                                            "orderBumps",
                                            updatedOrderBumps
                                          );
                                        }}
                                        placeholder="Digite o título do order bump"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`orderBumpDescription-${orderBump.id}`}
                                      >
                                        Descrição
                                      </Label>
                                      <Textarea
                                        id={`orderBumpDescription-${orderBump.id}`}
                                        value={orderBump.description}
                                        onChange={(e) => {
                                          const updatedOrderBumps =
                                            appearanceSettings.orderBumps.map(
                                              (ob) =>
                                                ob.id === orderBump.id
                                                  ? {
                                                      ...ob,
                                                      description:
                                                        e.target.value,
                                                    }
                                                  : ob
                                            );
                                          handleAppearanceChange(
                                            "orderBumps",
                                            updatedOrderBumps
                                          );
                                        }}
                                        placeholder="Digite a descrição do order bump"
                                        rows={3}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`orderBumpPrice-${orderBump.id}`}
                                      >
                                        Valor (R$)
                                      </Label>
                                      <Input
                                        id={`orderBumpPrice-${orderBump.id}`}
                                        type="number"
                                        step="0.01"
                                        value={orderBump.price}
                                        onChange={(e) => {
                                          const updatedOrderBumps =
                                            appearanceSettings.orderBumps.map(
                                              (ob) =>
                                                ob.id === orderBump.id
                                                  ? {
                                                      ...ob,
                                                      price: e.target.value,
                                                    }
                                                  : ob
                                            );
                                          handleAppearanceChange(
                                            "orderBumps",
                                            updatedOrderBumps
                                          );
                                        }}
                                        placeholder="0,00"
                                        className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Preview do Checkout */}
                  <div className="hidden lg:block">
                    <Card className="sticky top-4">
                      <CardHeader>
                        <CardTitle>Preview do Checkout</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Veja como ficará seu checkout
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="border rounded-lg overflow-hidden"
                          style={{
                            backgroundColor:
                              appearanceSettings.theme === "escuro"
                                ? "#1f2937"
                                : appearanceSettings.theme === "claro"
                                ? "#ffffff"
                                : "#f9fafb",
                          }}
                        >
                          {" "}
                          {/* Timer Preview */}
                          {appearanceSettings.showTimer && (
                            <div
                              className="text-center p-4"
                              style={{
                                backgroundColor:
                                  appearanceSettings.primaryColor,
                                color: "#ffffff",
                                borderRadius: "0px", // garante que não tenha arredondamento
                              }}
                            >
                              <p className="text-sm font-medium">
                                Oferta expira em:
                              </p>
                              <p className="text-2xl font-bold">
                                {String(
                                  Math.floor(appearanceSettings.timerMinutes)
                                ).padStart(2, "0")}
                                :00
                              </p>
                            </div>
                          )}
                          {/* Banner Preview */}
                          {appearanceSettings.showBanner &&
                            appearanceSettings.bannerImage && (
                              <div
                                className="relative w-full h-60 bg-center bg-no-repeat bg-cover overflow-hidden"
                                style={{
                                  backgroundImage: `url(${
                                    typeof appearanceSettings.bannerImage ===
                                    "string"
                                      ? appearanceSettings.bannerImage
                                      : URL.createObjectURL(
                                          appearanceSettings.bannerImage
                                        )
                                  })`,
                                  borderRadius: "0px",
                                }}
                              />
                            )}
                          {/* Topbar Preview */}
                          {appearanceSettings.showTopbar && (
                            <div
                              className="text-center py-2 text-sm font-medium"
                              style={{
                                backgroundColor:
                                  appearanceSettings.secondaryColor,
                                color: "#ffffff",
                                borderRadius: "0px",
                              }}
                            >
                              {appearanceSettings.topbarText}
                            </div>
                          )}
                          <br />
                          <div className="space-y-4 text-center">
                            {/* Produto Preview */}
                            <div className="space-y-4 text-center">
                              {/* Imagem do Produto */}
                              {appearanceSettings.showProductImage && (
                                <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                  {formData.productImage ? (
                                    <img
                                      src={
                                        formData.productImage instanceof File
                                          ? URL.createObjectURL(
                                              formData.productImage
                                            )
                                          : formData.productImage.startsWith(
                                              "blob:"
                                            )
                                          ? formData.productImage
                                          : formData.productImage.startsWith(
                                              "http"
                                            )
                                          ? formData.productImage
                                          : `https://shadowpay-api-production.up.railway.app/uploads/products/${formData.productImage}`
                                      }
                                      alt="Produto"
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <Package className="h-8 w-8 text-gray-400" />
                                  )}
                                </div>
                              )}

                              {/* Nome do Produto */}
                              {appearanceSettings.showProductName && (
                                <h3
                                  className="font-bold text-xl mb-2"
                                  style={{
                                    color:
                                      appearanceSettings.theme === "escuro"
                                        ? "#ffffff"
                                        : "#000000",
                                  }}
                                >
                                  {formData.name || "Produto Teste"}
                                </h3>
                              )}

                              {/* Descrição do Produto */}
                              {appearanceSettings.showProductDescription && (
                                <p
                                  className="text-sm mb-4"
                                  style={{
                                    color:
                                      appearanceSettings.theme === "escuro"
                                        ? "#d1d5db"
                                        : "#6b7280",
                                  }}
                                >
                                  {formData.description ||
                                    "Descrição do produto"}
                                </p>
                              )}
                            </div>

                            <div className="space-y-6">
                              {/* Formulário de Identificação */}
                              <div
                                className="p-4 rounded-lg shadow-md space-y-4"
                                style={{
                                  backgroundColor:
                                    appearanceSettings.theme === "escuro"
                                      ? "#1f2937"
                                      : "#ffffff",
                                  border:
                                    appearanceSettings.theme === "escuro"
                                      ? "1px solid #4b5563"
                                      : "1px solid #e5e7eb",
                                }}
                              >
                                <h3
                                  className="font-semibold mb-2 flex items-center space-x-2"
                                  style={{
                                    color:
                                      appearanceSettings.theme === "escuro"
                                        ? "#ffffff"
                                        : "#111827",
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5.121 17.804A13.937 13.937 0 0112 15c2.497 0 4.827.671 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  <span>Identificação</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Nome completo */}
                                  {formFields.nome && (
                                    <div className="space-y-1">
                                      <label
                                        className="block text-sm font-medium text-left"
                                        style={{
                                          color:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#d1d5db"
                                              : "#374151",
                                        }}
                                      >
                                        Nome completo
                                      </label>
                                      <input
                                        className="p-3 border rounded-lg w-full text-sm"
                                        placeholder="Nome completo"
                                        style={{
                                          backgroundColor:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#374151"
                                              : "#ffffff",
                                          color:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#ffffff"
                                              : "#000000",
                                          borderColor:
                                            appearanceSettings.theme ===
                                              "escuro" ||
                                            appearanceSettings.theme ===
                                              "padrao"
                                              ? "#4b5563"
                                              : "#d1d5db",
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Email */}
                                  {formFields.email && (
                                    <div className="space-y-1">
                                      <label
                                        className="block text-sm font-medium text-left"
                                        style={{
                                          color:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#d1d5db"
                                              : "#374151",
                                        }}
                                      >
                                        Email
                                      </label>
                                      <input
                                        type="email"
                                        className="p-3 border rounded-lg w-full text-sm"
                                        placeholder="nome@email.com"
                                        style={{
                                          backgroundColor:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#374151"
                                              : "#ffffff",
                                          color:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#ffffff"
                                              : "#000000",
                                          borderColor:
                                            appearanceSettings.theme ===
                                              "escuro" ||
                                            appearanceSettings.theme ===
                                              "padrao"
                                              ? "#4b5563"
                                              : "#d1d5db",
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* CPF/CNPJ */}
                                  {formFields.cpf && (
                                    <div className="space-y-1">
                                      <label
                                        className="block text-sm font-medium text-left"
                                        style={{
                                          color:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#d1d5db"
                                              : "#374151",
                                        }}
                                      >
                                        CPF/CNPJ
                                      </label>
                                      <input
                                        className="p-3 border rounded-lg w-full text-sm"
                                        placeholder="000.000.000-00"
                                        maxLength={14} // limita para CPF (11) ou CNPJ (14)
                                        onChange={(e) => {
                                          e.target.value =
                                            e.target.value.replace(/\D/g, "");
                                        }}
                                        style={{
                                          backgroundColor:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#374151"
                                              : "#ffffff",
                                          color:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#ffffff"
                                              : "#000000",
                                          borderColor:
                                            appearanceSettings.theme ===
                                              "escuro" ||
                                            appearanceSettings.theme ===
                                              "padrao"
                                              ? "#4b5563"
                                              : "#d1d5db",
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Celular com seletor de país */}
                                  {formFields.celular && (
                                    <div className="space-y-1">
                                      <label
                                        className="block text-sm font-medium text-left"
                                        style={{
                                          color:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#d1d5db"
                                              : "#374151",
                                        }}
                                      >
                                        Celular
                                      </label>
                                      <div className="flex">
                                        <select
                                          className="p-3 border rounded-l-lg text-sm cursor-pointer"
                                          style={{
                                            backgroundColor:
                                              appearanceSettings.theme ===
                                              "escuro"
                                                ? "#374151"
                                                : "#ffffff",
                                            color:
                                              appearanceSettings.theme ===
                                              "escuro"
                                                ? "#ffffff"
                                                : "#000000",
                                            borderColor:
                                              appearanceSettings.theme ===
                                                "escuro" ||
                                              appearanceSettings.theme ===
                                                "padrao"
                                                ? "#4b5563"
                                                : "#d1d5db",
                                          }}
                                        >
                                          <option value="BR" selected>
                                            🇧🇷 +55
                                          </option>
                                          <option value="US">🇺🇸 +1</option>
                                        </select>
                                        <input
                                          className="p-3 border-t border-b border-r rounded-r-lg flex-1 text-sm"
                                          placeholder="(00) 0000-0000"
                                          maxLength={11} // formato nacional sem máscara
                                          onChange={(e) => {
                                            e.target.value =
                                              e.target.value.replace(/\D/g, "");
                                          }}
                                          style={{
                                            backgroundColor:
                                              appearanceSettings.theme ===
                                              "escuro"
                                                ? "#374151"
                                                : "#ffffff",
                                            color:
                                              appearanceSettings.theme ===
                                              "escuro"
                                                ? "#ffffff"
                                                : "#000000",
                                            borderColor:
                                              appearanceSettings.theme ===
                                                "escuro" ||
                                              appearanceSettings.theme ===
                                                "padrao"
                                                ? "#4b5563"
                                                : "#d1d5db",
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Container de pagamento */}
                              <div
                                className="p-4 rounded-lg shadow-md space-y-2"
                                style={{
                                  backgroundColor:
                                    appearanceSettings.theme === "escuro"
                                      ? "#1f2937"
                                      : "#f9fafb",
                                  border:
                                    appearanceSettings.theme === "escuro"
                                      ? "1px solid #4b5563"
                                      : "1px solid #e5e7eb",
                                }}
                              >
                                {/* Título */}
                                <p
                                  className="font-medium"
                                  style={{
                                    color:
                                      appearanceSettings.theme === "escuro"
                                        ? "#ffffff"
                                        : "#111827",
                                  }}
                                >
                                  Formas de pagamento
                                </p>

                                {/* Quadrados com ícones dos métodos ativos */}
                                <div className="flex flex-wrap gap-4 mt-2">
                                  {[
                                    {
                                      key: "pix",
                                      label: "PIX",
                                      icon: "/icons/pix.png",
                                    },
                                    {
                                      key: "boleto",
                                      label: "Boleto",
                                      icon: "/icons/boleto.png",
                                    },
                                    {
                                      key: "cartao",
                                      label: "Cartão",
                                      icon: "/icons/cartao.png",
                                    },
                                    {
                                      key: "picpay",
                                      label: "PicPay",
                                      icon: "/icons/picpay.png",
                                    },
                                    {
                                      key: "googlepay",
                                      label: "Google Pay",
                                      icon: "/icons/gpay.png",
                                    },
                                    {
                                      key: "applepay",
                                      label: "Apple Pay",
                                      icon: "/icons/apple.png",
                                    },
                                  ].map((method) =>
                                    paymentMethods[
                                      method.key as keyof typeof paymentMethods
                                    ]?.enabled ? (
                                      <div
                                        key={method.key}
                                        onClick={() =>
                                          setSelectedPayment(
                                            method.key as keyof typeof paymentMethods
                                          )
                                        }
                                        className={`w-20 h-24 flex flex-col items-center justify-center rounded-md border-2 cursor-pointer transition-all relative ${
                                          selectedPayment === method.key
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-300 bg-transparent hover:border-green-400"
                                        }`}
                                      >
                                        <img
                                          src={method.icon}
                                          alt={method.label}
                                          className="w-12 h-12 object-contain"
                                        />

                                        {/* Faixa de desconto */}
                                        {paymentMethods[
                                          method.key as keyof typeof paymentMethods
                                        ]?.percent ? (
                                          <span className="absolute bottom-0 mb-1 text-xs font-bold text-green-700 border border-green-500 px-2 py-0.5 rounded-full bg-white">
                                            {
                                              paymentMethods[
                                                method.key as keyof typeof paymentMethods
                                              ]?.percent
                                            }
                                            % OFF
                                          </span>
                                        ) : null}
                                      </div>
                                    ) : null
                                  )}
                                </div>

                                {/* Texto explicativo dinâmico */}
                                {selectedPayment &&
                                paymentMethods[selectedPayment]?.percent ? (
                                  <p
                                    className="text-sm mt-2"
                                    style={{
                                      color:
                                        appearanceSettings.theme === "escuro"
                                          ? "#d1d5db"
                                          : "#6b7280",
                                    }}
                                  >
                                    {paymentMethods[selectedPayment]?.percent}%
                                    DE DESCONTO utilizando{" "}
                                    {
                                      [
                                        { key: "pix", label: "PIX" },
                                        { key: "boleto", label: "Boleto" },
                                        { key: "cartao", label: "Cartão" },
                                        { key: "picpay", label: "PicPay" },
                                        {
                                          key: "googlepay",
                                          label: "Google Pay",
                                        },
                                        { key: "applepay", label: "Apple Pay" },
                                      ].find((m) => m.key === selectedPayment)
                                        ?.label
                                    }
                                  </p>
                                ) : (
                                  <p
                                    className="text-sm mt-2"
                                    style={{
                                      color:
                                        appearanceSettings.theme === "escuro"
                                          ? "#d1d5db"
                                          : "#6b7280",
                                    }}
                                  >
                                    O pagamento é instantâneo e liberação
                                    imediata.
                                  </p>
                                )}

                                <p
                                  className="text-sm"
                                  style={{
                                    color:
                                      appearanceSettings.theme === "escuro"
                                        ? "#d1d5db"
                                        : "#6b7280",
                                  }}
                                >
                                  Ao clicar em “Comprar agora” você será
                                  encaminhado para um ambiente seguro, onde
                                  encontrará o passo a passo para realizar o
                                  pagamento.
                                </p>
                              </div>
                              {/* Order Bumps Preview */}
                              {appearanceSettings.orderBumps.filter(
                                (ob) =>
                                  ob.active &&
                                  ob.title &&
                                  ob.description &&
                                  ob.price
                              ).length > 0 && (
                                <div className="space-y-3 mt-6">
                                  {appearanceSettings.orderBumps
                                    .filter(
                                      (ob) =>
                                        ob.active &&
                                        ob.title &&
                                        ob.description &&
                                        ob.price
                                    )
                                    .map((orderBump, index) => (
                                      <div
                                        key={orderBump.id}
                                        className="border rounded-lg overflow-hidden shadow-sm"
                                        style={{
                                          borderColor:
                                            appearanceSettings.primaryColor,
                                          backgroundColor:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#374151"
                                              : "#f9fafb",
                                        }}
                                      >
                                        {/* Faixa superior com cor e texto centralizado */}
                                        <div
                                          className="w-full py-1 text-center font-semibold text-sm"
                                          style={{
                                            backgroundColor:
                                              appearanceSettings.primaryColor,
                                            color: "#ffffff",
                                          }}
                                        >
                                          Oferta Especial
                                        </div>

                                        {/* Conteúdo do Order Bump */}
                                        <div className="p-4 space-y-2">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <h5
                                                className="font-semibold text-s text-left"
                                                style={{
                                                  color:
                                                    appearanceSettings.theme ===
                                                    "escuro"
                                                      ? "#ffffff"
                                                      : "#000000",
                                                }}
                                              >
                                                {orderBump.title}
                                              </h5>
                                              <p
                                                className="text-xs mt-1 text-left"
                                                style={{
                                                  color:
                                                    appearanceSettings.theme ===
                                                    "escuro"
                                                      ? "#d1d5db"
                                                      : "#6b7280",
                                                }}
                                              >
                                                {orderBump.description}
                                              </p>
                                            </div>
                                            <div className="text-right ml-3">
                                              <p
                                                className="font-bold text-sm"
                                                style={{
                                                  color:
                                                    appearanceSettings.primaryColor,
                                                }}
                                              >
                                                R${" "}
                                                {parseFloat(
                                                  orderBump.price || "0"
                                                )
                                                  .toFixed(2)
                                                  .replace(".", ",")}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center space-x-2 pt-2">
                                            <input
                                              type="checkbox"
                                              className="rounded cursor-pointer"
                                              style={{
                                                accentColor:
                                                  appearanceSettings.primaryColor,
                                              }}
                                            />
                                            <span
                                              className="text-xs"
                                              style={{
                                                color:
                                                  appearanceSettings.theme ===
                                                  "escuro"
                                                    ? "#d1d5db"
                                                    : "#374151",
                                              }}
                                            >
                                              Sim, quero adicionar esta oferta
                                              ao meu pedido
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}
                              {/* Resumo da compra */}
                              <div
                                className="p-4 rounded-lg shadow-md flex flex-col items-center space-y-4"
                                style={{
                                  backgroundColor:
                                    appearanceSettings.theme === "escuro"
                                      ? "#1f2937"
                                      : "#ffffff",
                                  border:
                                    appearanceSettings.theme === "escuro"
                                      ? "1px solid #4b5563"
                                      : "1px solid #e5e7eb",
                                }}
                              >
                                {/* Cabeçalho: ícone + título à esquerda, resumo à direita */}
                                <div className="flex w-full justify-between items-center mb-4">
                                  <div className="flex items-center space-x-2">
                                    <ShoppingCart
                                      className="h-6 w-6"
                                      style={{
                                        color:
                                          appearanceSettings.theme === "escuro"
                                            ? "#ffffff"
                                            : "#111827",
                                      }}
                                    />
                                    <span
                                      className="font-medium text-lg"
                                      style={{
                                        color:
                                          appearanceSettings.theme === "escuro"
                                            ? "#ffffff"
                                            : "#111827",
                                      }}
                                    >
                                      Sua compra
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span
                                      className="text-sm font-medium"
                                      style={{
                                        color:
                                          appearanceSettings.theme === "escuro"
                                            ? "#d1d5db"
                                            : "#6b7280",
                                      }}
                                    >
                                      1 Item
                                    </span>
                                    <p
                                      className="text-lg font-bold"
                                      style={{
                                        color: appearanceSettings.primaryColor,
                                      }}
                                    >
                                      {formData.price
                                        ? `R$ ${parseFloat(formData.price)
                                            .toFixed(2)
                                            .replace(".", ",")}`
                                        : "R$ 0,00"}
                                    </p>
                                  </div>
                                </div>

                                {/* Produto alinhado à esquerda */}
                                <div className="flex items-center gap-4 w-full justify-start">
                                  <div className="w-16 h-16 border rounded-lg overflow-hidden flex-shrink-0">
                                    {formData.productImage ? (
                                      <img
                                        src={
                                          formData.productImage instanceof File
                                            ? URL.createObjectURL(
                                                formData.productImage
                                              )
                                            : formData.productImage.startsWith(
                                                "blob:"
                                              )
                                            ? formData.productImage
                                            : formData.productImage.startsWith(
                                                "http"
                                              )
                                            ? formData.productImage
                                            : `https://shadowpay-api-production.up.railway.app/uploads/products/${formData.productImage}`
                                        }
                                        alt="Produto"
                                        className="object-cover w-full h-full"
                                      />
                                    ) : (
                                      <Package className="h-8 w-8 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 flex flex-col text-left">
                                    <p
                                      className="text-base font-normal mb-1"
                                      style={{
                                        color:
                                          appearanceSettings.theme === "escuro"
                                            ? "#ffffff"
                                            : "#111827",
                                      }}
                                    >
                                      {formData.name || "Nome do Produto"}
                                    </p>
                                    <p
                                      className="text-sm font-medium"
                                      style={{
                                        color: appearanceSettings.primaryColor,
                                      }}
                                    >
                                      {formData.price
                                        ? `R$ ${parseFloat(formData.price)
                                            .toFixed(2)
                                            .replace(".", ",")}`
                                        : "R$ 0,00"}
                                    </p>
                                  </div>
                                </div>

                                {/* Botão Comprar agora centralizado */}
                                <Button
                                  className="mt-6 w-full max-w-sm px-6 py-3 rounded-lg font-semibold text-white cursor-pointer transition-colors duration-200 hover:bg-green-600"
                                  style={{ backgroundColor: "#22c55e" }}
                                >
                                  Finalizar pedido{" "}
                                </Button>
                              </div>
                            </div>
                            {/* Texto e segurança lado a lado */}
                            <div className="flex justify-between items-start my-4 gap-4">
                              {/* Texto sobre políticas */}
                              <p className="text-xs text-gray-600 flex-1 leading-snug">
                                Ao clicar em <strong>Comprar</strong>, você
                                concorda com 100% das nossas políticas e termos
                                de uso.
                              </p>

                              {/* Segurança */}
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 11c0-1.1.9-2 2-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M4 7V5a3 3 0 013-3h10a3 3 0 013 3v2"
                                    />
                                  </svg>
                                  Compra 100% segura
                                </div>

                                <div className="flex justify-center">
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Ambiente seguro
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Depoimentos Preview */}
                            {appearanceSettings.showTestimonials &&
                              appearanceSettings.testimonials.filter(
                                (t) => t.name && t.text
                              ).length > 0 && (
                                <div className="space-y-3 mt-6">
                                  <h4
                                    className="font-medium"
                                    style={{
                                      color:
                                        appearanceSettings.theme === "escuro"
                                          ? "#ffffff"
                                          : "#000000",
                                    }}
                                  >
                                    O que nossos clientes dizem:
                                  </h4>

                                  {appearanceSettings.testimonials
                                    .filter((t) => t.name && t.text)
                                    .slice(0, 2)
                                    .map((testimonial, index) => (
                                      <div
                                        key={index}
                                        className="p-3 rounded border flex items-start space-x-3"
                                        style={{
                                          backgroundColor:
                                            appearanceSettings.theme ===
                                            "escuro"
                                              ? "#374151"
                                              : "#f3f4f6",
                                          flexDirection:
                                            testimonial.imagePosition ===
                                            "right"
                                              ? "row-reverse"
                                              : "row",
                                        }}
                                      >
                                        {/* Imagem do cliente */}
                                        {testimonial.image && (
                                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                                            <img
                                              src={
                                                typeof testimonial.image ===
                                                "string"
                                                  ? testimonial.image
                                                  : URL.createObjectURL(
                                                      testimonial.image
                                                    )
                                              }
                                              alt={testimonial.name}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        )}

                                        <div className="flex-1">
                                          {/* Avaliação */}
                                          <div className="flex text-yellow-400 text-xs mb-1">
                                            {"★".repeat(testimonial.rating)}
                                          </div>

                                          {/* Texto do depoimento */}
                                          <p
                                            className="text-sm"
                                            style={{
                                              color:
                                                appearanceSettings.theme ===
                                                "escuro"
                                                  ? "#d1d5db"
                                                  : "#374151",
                                            }}
                                          >
                                            "{testimonial.text}"
                                          </p>

                                          {/* Nome */}
                                          <p
                                            className="text-xs font-medium mt-1"
                                            style={{
                                              color:
                                                appearanceSettings.theme ===
                                                "escuro"
                                                  ? "#ffffff"
                                                  : "#000000",
                                            }}
                                          >
                                            - {testimonial.name}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Outras Abas*/}
              <TabsContent value="links" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link className="h-5 w-5" />
                      Links do Checkout
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Lista de Links */}
                    <div className="space-y-3">
                      {checkoutLinks.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {link.domain}
                              </span>
                              {link.isCustomDomain && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  Personalizado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 break-all">
                              {link.url}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Criado em{" "}
                              {new Date(link.createdAt).toLocaleDateString(
                                "pt-BR"
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(link.url, "_blank")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Abrir
                            </Button>
                            {link.isCustomDomain && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCheckoutLinks((prev) =>
                                    prev.filter((l) => l.id !== link.id)
                                  );
                                }}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Adicionar Domínio Personalizado */}
                    <div className="border-t pt-4 opacity-50 pointer-events-none">
                      <h4 className="font-medium mb-3">
                        Adicionar Domínio Personalizado
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="meudominio.com"
                          value={newCustomDomain}
                          onChange={(e) => setNewCustomDomain(e.target.value)}
                          className="flex-1"
                          disabled // deixa o input desabilitado
                        />
                        <Button
                          onClick={() => {}}
                          disabled // deixa o botão desabilitado
                          className="flex items-center gap-2 cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Esta funcionalidade estará disponível em breve. Em breve
                        será possível adicionar domínios personalizados.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="apis" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Integrações API
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pixel ADS Token */}
                    <div className="space-y-2">
                      <Label htmlFor="pixelAdsToken">Token Facebook/Meta</Label>
                      <Input
                        id="pixelAdsToken"
                        value={apiSettings.pixelAdsToken}
                        onChange={(e) =>
                          handleApiChange("pixelAdsToken", e.target.value)
                        }
                        placeholder="Digite seu token do Pixel ADS"
                        type="password"
                      />
                      <p className="text-xs text-muted-foreground">
                        Token para integração com Facebook/Meta Pixel para
                        rastreamento de conversões.
                      </p>
                    </div>
                    {/* Id do Pixel ADS Facebook/Meta Token */}
                    <div className="space-y-2">
                      <Label htmlFor="fbpixelidToken">
                        Id do Pixel Facebook/Meta Ads
                      </Label>
                      <Input
                        id="fbpixelidToken"
                        value={apiSettings.fbpixelidToken}
                        onChange={(e) =>
                          handleApiChange("fbpixelidToken", e.target.value)
                        }
                        placeholder="Digite seu Id do Pixel Fb ADS"
                        type="password"
                      />
                      <p className="text-xs text-muted-foreground">
                        Id do pixel/campanha no Facebook/Meta Pixel
                      </p>
                    </div>
                    {/* UTMify Token */}
                    <div className="space-y-2">
                      <Label htmlFor="utmifyToken">Token UTMify</Label>
                      <Input
                        id="utmifyToken"
                        value={apiSettings.utmifyToken}
                        onChange={(e) =>
                          handleApiChange("utmifyToken", e.target.value)
                        }
                        placeholder="Digite seu token do UTMify"
                        type="password"
                      />
                      <p className="text-xs text-muted-foreground">
                        Token para integração com UTMify para rastreamento
                        avançado de campanhas.
                      </p>
                    </div>

                    {/* Status das Integrações */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">
                        Status das Integrações
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">Pixel ADS</span>
                            <p className="text-sm text-muted-foreground">
                              Facebook/Meta Pixel
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              apiSettings.pixelAdsToken
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {apiSettings.pixelAdsToken
                              ? "Conectado"
                              : "Não Conectado"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">UTMify</span>
                            <p className="text-sm text-muted-foreground">
                              Rastreamento de Campanhas
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              apiSettings.utmifyToken
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {apiSettings.utmifyToken
                              ? "Conectado"
                              : "Não Conectado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
