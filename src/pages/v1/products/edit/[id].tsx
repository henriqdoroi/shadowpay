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
import { toast } from "sonner";
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
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  status?: "ativo" | "inativo" | "rascunho";
  sales?: number;
  createdAt?: string;
  checkoutUrl?: string;
  showProductName?: boolean;
  showProductDescription?: boolean;
  // CAMPOS OPCIONAIS DA API
  checkoutConfig?: any;
  isActive?: boolean;
  productImageUrl?: string;
  productImage?: string;
  productBannerUrl?: string;
  productBanner?: string;
  linkSalesPage?: string;
  linkUpSell?: string;
  daysGuarantee?: number;
  whatsappSupport?: string;
  emailSupport?: string;
  productType?: string;
  paymentMethod?: string;
  logoUrl?: string;
}

type Testimonial = {
  name: string;
  text: string;
  rating: number;
  image?: File | string | null;
  imagePosition?: "left" | "right";
};
interface AppearanceSettings {
  theme: "padrao" | "escuro" | "claro";
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  showBanner: boolean;
  showProductImage?: boolean;
  showProductName?: boolean;
  showProductDescription?: boolean;
  bannerImage: File | null;
  showTimer: boolean;
  timerMinutes: number;
  showHeader: boolean;
  headerTitle: string;
  showTopbar: boolean;
  topbarText: string;
  showTestimonials: boolean;
  testimonials: Array<{ name: string; text: string; rating: number }>;
  orderBumps: Array<{
    id: number;
    title: string;
    description: string;
    price: string;
    active: boolean;
  }>;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  logoUrl?: string;
  // Preview
  productImageUrl?: string;
  bannerImageUrl?: string;
  customFields?: any;
  // Arquivos
  productImageFile?: File | null;
  bannerImageFile?: File | null;
  footerText?: string;
  checkoutUrl?: string;
  productImage?: string;
  productBanner?: string;
}
type FormDataType = {
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
  paymentMethods: {
    pix: boolean;
    cartao: boolean;
    boleto: boolean;
  };
};

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    status: "ativo" | "inativo" | "rascunho";
    checkoutUrl: string;
    productType: "digital" | "fisico" | "servico";
    billingType: "unico" | "recorrente";
    salesPageUrl: string;
    upsellUrl: string;
    bannerImageUrl: string | null;

    warrantyDays: string;
    supportWhatsapp: string;
    supportEmail: string;
    productImageFile?: File | null; // novo
    productImage: string | File | null;
    showProductImage: boolean;
  }>({
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
    bannerImageUrl: null,
    supportWhatsapp: "",
    supportEmail: "",
    productImage: null,
    showProductImage: false,
  });

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
    bannerImageUrl: string | null;
    showTimer: boolean;
    timerMinutes: number;
    showHeader: boolean;
    headerTitle: string;
    showTopbar: boolean;
    topbarText: string;
    showTestimonials: boolean;
    showProductImage: boolean; // Added this line
    showProductName: boolean; // Added this line
    showProductDescription: boolean; // Added this line
    customFields: Record<string, any>;
    footerText: string;
    testimonials: Array<{
      name: string;
      text: string;
      rating: number;
      image: File | string | null; // Ensure no undefined
      imagePosition: "left" | "right";
    }>;
    orderBumps: Array<{
      id: number;
      title: string;
      description: string;
      price: string;
      active: boolean;
    }>;
    logoUrl: string | null;
    checkoutUrl: string | null;
    productImage: File | string | null;
    productImageUrl: string | null;
    productBanner: File | string | null;
    productBannerUrl: string | null;
  }>({
    theme: "padrao",
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    buttonColor: "#3B82F6",
    buttonTextColor: "#FFFFFF",
    showBanner: true,
    bannerImage: null,
    bannerImageFile: null,
    showProductName: true, // Ensure this matches the updated type
    showProductDescription: true,
    showTimer: true,
    timerMinutes: 15,
    showHeader: true,
    headerTitle: "Oferta Especial",
    showTopbar: true,
    topbarText: "Últimas vagas disponíveis!",
    showTestimonials: true,
    showProductImage: true, // <-- adiciona aqui
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
    logoUrl: null,
    checkoutUrl: null,
    productImage: null,
    productImageUrl: null,
    productBanner: null,
    productBannerUrl: null,
    bannerImageUrl: null, // Add this line
  });

  const [paymentMethods, setPaymentMethods] = useState({
    pix: { enabled: false, percent: 0 },
    boleto: { enabled: false, percent: 0 },
    cartao: { enabled: false, percent: 0 },
    picpay: { enabled: false, percent: 0 },
    googlepay: { enabled: false, percent: 0 },
    applepay: { enabled: false, percent: 0 },
  });

  const [selectedPayment, setSelectedPayment] = useState<
    keyof typeof paymentMethods | null
  >(null);

  const handleToggle = (key: keyof typeof paymentMethods, value: boolean) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: value },
    }));
  };

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
      url: "https://dash.safira.cash/v1/checkout/" + (id || "1"),
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
  const [formFields, setFormFields] = useState({
    nome: false,
    email: false,
    cpf: false,
    celular: false,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const currentOrders = orders.slice(startIndex, startIndex + ordersPerPage);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return console.error("Token não encontrado");

        const res = await fetch(`https://shadowpay-api-production.up.railway.app/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Erro ao buscar produto");

        const data = await res.json();
        const p: Product = data.data?.product || data.data;
        setProduct(p);
        const checkoutConfig = p?.checkoutConfig || {};
        const payments = checkoutConfig.payments || {};

        const buildUrl = (
          input: string | { filename: string } | null | undefined
        ): string | null => {
          if (!input) return null;
          const filename =
            typeof input === "string"
              ? input
              : "filename" in input
              ? input.filename
              : "";
          if (!filename) return null;
          const sanitized = filename.replace(/^\/+/, "");
          return `https://shadowpay-api-production.up.railway.app/${
            sanitized.startsWith("uploads/")
              ? sanitized
              : `uploads/products/${sanitized}`
          }`;
        };

        const testimonials = Array.isArray(checkoutConfig.testimonials)
          ? checkoutConfig.testimonials.map((t: any) => ({
              name: t.name || "",
              text: t.text || "",
              rating: t.rating || 0,
              image: t.image ? buildUrl(t.image) : null,
              imagePosition: t.imagePosition === "right" ? "right" : "left",
            }))
          : [];

        const productImageUrl = buildUrl(
          checkoutConfig.productImageUrl ?? p.productImage
        );
        const bannerImageUrl = buildUrl(
          checkoutConfig.bannerImageUrl ?? p.productBanner
        );

        const orderBumps = Array.isArray(
          checkoutConfig.customFields?.orderBumps
        )
          ? checkoutConfig.customFields.orderBumps.map(
              (bump: any, index: number) => ({
                id: bump.id || index + 1,
                title: bump.title || "",
                description: bump.description || "",
                price: bump.price?.toString() || "",
                active: bump.active ?? false,
              })
            )
          : [];

        setPaymentMethods({
          pix: payments.pix || { enabled: false, percent: 0 },
          boleto: payments.boleto || { enabled: false, percent: 0 },
          cartao: payments.cartao || { enabled: false, percent: 0 },
          picpay: payments.picpay || { enabled: false, percent: 0 },
          googlepay: payments.googlepay || { enabled: false, percent: 0 },
          applepay: payments.applepay || { enabled: false, percent: 0 },
        });

        // Atualiza formData
        setFormData((prev) => ({
          ...prev,
          name: p.name || "",
          description: p.description || "",
          price: p.price?.toString() || "0",
          status: p.isActive ? "ativo" : "inativo",
          checkoutUrl: checkoutConfig.checkoutUrl || p.linkSalesPage || "",
          productType:
            (Object.keys(productTypeMap).find(
              (key) => productTypeMap[key] === p.productType
            ) as "digital" | "fisico" | "servico") || "digital",
          billingType:
            p.paymentMethod?.toLowerCase() === "unique"
              ? "unico"
              : "recorrente",
          salesPageUrl: p.linkSalesPage || "",
          upsellUrl: p.linkUpSell || "",
          warrantyDays: p.daysGuarantee?.toString() || "",
          supportWhatsapp: p.whatsappSupport || "",
          supportEmail: p.emailSupport || "",
          productImage: productImageUrl,
          bannerImageUrl,
          bannerImage: null,
          productImageFile: null,
          showProductImage: checkoutConfig.showProductImage ?? true,
        }));

        // Atualiza appearanceSettings
        setAppearanceSettings((prev) => ({
          ...prev,
          primaryColor: checkoutConfig.primaryColor || prev.primaryColor,
          secondaryColor: checkoutConfig.secondaryColor || prev.secondaryColor,
          backgroundColor:
            checkoutConfig.backgroundColor || prev.backgroundColor,
          textColor: checkoutConfig.textColor || prev.textColor,
          buttonColor: checkoutConfig.buttonColor || prev.buttonColor,
          buttonTextColor:
            checkoutConfig.buttonTextColor || prev.buttonTextColor,
          logoUrl:
            buildUrl(checkoutConfig.logoUrl ?? p.logoUrl) || prev.logoUrl,
          theme:
            checkoutConfig.theme?.toUpperCase() === "DARK"
              ? "escuro"
              : checkoutConfig.theme?.toUpperCase() === "CLARO"
              ? "claro"
              : "padrao",
          showBanner: checkoutConfig.showBanner ?? !!bannerImageUrl,
          showHeader: checkoutConfig.showHeader ?? prev.showHeader,
          showTopbar: checkoutConfig.showTopbar ?? prev.showTopbar,
          showTimer: checkoutConfig.showTimer ?? prev.showTimer,
          timerMinutes: checkoutConfig.timerMinutes ?? prev.timerMinutes,
          headerTitle: checkoutConfig.customHeroText || prev.headerTitle,
          topbarText: checkoutConfig.customTimerText || prev.topbarText,
          footerText: checkoutConfig.customFooterText || prev.footerText,
          testimonials,
          showTestimonials: orderBumps,
          productImageUrl,
          bannerImage: bannerImageUrl,
          showProductImage: checkoutConfig.showImageProduct ?? true,
          showProductName: checkoutConfig.showProductName ?? true,
          showProductDescription: checkoutConfig.showDescription ?? true,
        }));
        setFormFields({
          nome:
            checkoutConfig.showName === true ||
            checkoutConfig.showName === "t" ||
            checkoutConfig.showname === true ||
            checkoutConfig.showname === "t",
          email:
            checkoutConfig.showEmail === true ||
            checkoutConfig.showEmail === "t" ||
            checkoutConfig.showemail === true ||
            checkoutConfig.showemail === "t",
          cpf:
            checkoutConfig.showCpf === true ||
            checkoutConfig.showCpf === "t" ||
            checkoutConfig.showcpf === true ||
            checkoutConfig.showcpf === "t",
          celular:
            checkoutConfig.showPhone === true ||
            checkoutConfig.showPhone === "t" ||
            checkoutConfig.showphone === true ||
            checkoutConfig.showphone === "t",
        });

        setApiSettings({
          pixelAdsToken: (p as any).pixelToken || "",
          fbpixelidToken: (p as any).fbpixelid || "",
          utmifyToken: (p as any).utmifyToken || "",
        });
      } catch (err) {
        console.error("Erro ao carregar dados do produto:", err);
      }
    };

    fetchData();
  }, [id]);

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

  const handleApiChange = (field: string, value: string) => {
    setApiSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "bg-green-100 text-green-800";
      case "Pendente":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const handleSave = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");

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
      if (!formData.name?.trim()) throw new Error("Preencha o nome do produto");
      if (!formData.productType) throw new Error("Selecione o tipo de produto");
      if (!formData.billingType)
        throw new Error("Selecione o método de pagamento");

      const productType = formData.productType.toUpperCase();
      const billingTypeMap: Record<string, string> = {
        unico: "UNIQUE",
        recorrente: "RECURRENT",
      };
      const billingType = billingTypeMap[formData.billingType];
      if (!billingType) throw new Error("Tipo de cobrança inválido");

      // ---------- Preparar FormData ----------
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("price", String(parseFloat(formData.price || "0")));
      formDataToSend.append(
        "isActive",
        formData.status === "ativo" ? "true" : "false"
      );
      formDataToSend.append("productType", productType);
      formDataToSend.append("paymentMethod", billingType);
      formDataToSend.append("linkSalesPage", formData.salesPageUrl || "");
      formDataToSend.append("linkUpSell", formData.upsellUrl || "");
      formDataToSend.append(
        "daysGuarantee",
        String(parseInt(formData.warrantyDays || "0", 10))
      );
      formDataToSend.append("whatsappSupport", formData.supportWhatsapp || "");
      formDataToSend.append("emailSupport", formData.supportEmail || "");
      // ---------- Pixel e UTMify ----------
      formDataToSend.append("pixelToken", apiSettings.pixelAdsToken || "");
      formDataToSend.append("fbpixelid", apiSettings.fbpixelidToken || "");
      formDataToSend.append("utmifyToken", apiSettings.utmifyToken || "");
      // ---------- Imagens ----------
      if (formData.productImageFile instanceof File) {
        formDataToSend.append("productImage", formData.productImageFile);
      } else if (typeof formData.productImage === "string") {
        const oldName = extractFileName(formData.productImage);
        if (oldName) formDataToSend.append("productImageOld", oldName);
      }

      if (appearanceSettings.bannerImageFile instanceof File) {
        formDataToSend.append(
          "bannerImage",
          appearanceSettings.bannerImageFile
        );
      } else if (typeof appearanceSettings.bannerImage === "string") {
        const oldName = extractFileName(appearanceSettings.bannerImage);
        if (oldName) formDataToSend.append("bannerImageOld", oldName);
      }

      // ---------- Testimonials ----------
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
        (ob) => ({
          id: ob.id,
          title: ob.title,
          description: ob.description,
          price: ob.price,
          active: !!ob.active,
        })
      );

      // ---------- Checkout Config ----------
      const checkoutConfig = {
        checkoutUrl: formData.checkoutUrl || "",
        theme: mapThemeToEnum(appearanceSettings.theme),
        primaryColor: appearanceSettings.primaryColor,
        secondaryColor: appearanceSettings.secondaryColor,
        backgroundColor: appearanceSettings.backgroundColor,
        textColor: appearanceSettings.textColor,
        buttonColor: appearanceSettings.buttonColor,
        buttonTextColor: appearanceSettings.buttonTextColor,
        showBanner: appearanceSettings.showBanner,
        showTopbar: appearanceSettings.showTopbar,
        showHeader: appearanceSettings.showHeader,
        showTimer: appearanceSettings.showTimer,
        showTestimonials: appearanceSettings.showTestimonials,
        timerMinutes: Number(appearanceSettings.timerMinutes),
        customHeroText: appearanceSettings.headerTitle || "",
        customTimerText: appearanceSettings.topbarText || "",
        customFooterText: appearanceSettings.footerText || "",
        testimonials: testimonialsToSave,
        showImageProduct: appearanceSettings.showProductImage,
        showProductName: appearanceSettings.showProductName,
        showDescription: appearanceSettings.showProductDescription,
        customFields: {
          ...(appearanceSettings.customFields || {}),
          links: (checkoutLinks || []).map((link) => ({
            url: link.url,
            isCustomDomain: !!link.isCustomDomain,
            createdAt: link.createdAt,
          })),
          orderBumps: orderBumpsToSave,
          paymentMethods, // ✅ mover para dentro do customFields
        },
        formFields: {
          nome: formFields.nome,
          email: formFields.email,
          cpf: formFields.cpf,
          celular: formFields.celular,
        },
      };

      formDataToSend.append("checkoutConfig", JSON.stringify(checkoutConfig));

      // ---------- Requisição ----------
      const url = `https://shadowpay-api-production.up.railway.app/api/products/${id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Erro ao atualizar produto");

      toast.success("Produto atualizado com sucesso!");
      router.push("/v1/products");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/v1/products");
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };
  if (!product) {
    return (
      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center h-full">
              <p>Carregando produto...</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    );
  }

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
                style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif", color: "#0F172A" }}
              >
                Editar Produto
              </h1>
              <p className="mt-1 text-xs" style={{ color: "#64748B" }}>
                Ajuste produto, checkout e formas de pagamento
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
                  <h1 className="text-2xl font-bold">Editar Produto</h1>
                  <p className="text-muted-foreground">
                    Modifique as informações do seu produto
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Salvando..." : "Salvar Alterações"}
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
                        {/* Switch para mostrar/ocultar nome do produto */}
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
                            <Label htmlFor="salesPageUrl">Back Redirect</Label>
                            <Input
                              id="salesPageUrl"
                              value={formData.salesPageUrl}
                              onChange={(e) =>
                                handleInputChange(
                                  "salesPageUrl",
                                  e.target.value
                                )
                              }
                              placeholder="https://vendas.payquick.com/seu-produto"
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
                              placeholder="https://upsell.payquick.com/seu-produto"
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

                      {/* Estatísticas */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Estatísticas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Total de Vendas:
                              </span>
                              <span className="font-medium">
                                {product.sales}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Receita Total:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(
                                  (product.sales ?? 0) * (product.price ?? 0)
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Criado em:
                              </span>
                              <span className="font-medium">
                                {new Intl.DateTimeFormat("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                }).format(new Date(product.createdAt ?? ""))}
                              </span>
                            </div>
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
                        {/* Checkbox para exibir banner */}
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
                                              typeof testimonial.image ===
                                              "string" ? (
                                                <img
                                                  src={testimonial.image}
                                                  alt="Preview"
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <img
                                                  src={URL.createObjectURL(
                                                    testimonial.image
                                                  )}
                                                  alt="Preview"
                                                  className="w-full h-full object-cover"
                                                />
                                              )
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

                          <div className="p-6 space-y-4">
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

                            {/* Header Preview */}
                            {appearanceSettings.showHeader && (
                              <div
                                className="text-center py-4 border-b"
                                style={{
                                  color:
                                    appearanceSettings.theme === "escuro"
                                      ? "#ffffff"
                                      : "#000000",
                                }}
                              >
                                <h2 className="text-xl font-bold">
                                  {appearanceSettings.headerTitle}
                                </h2>
                              </div>
                            )}
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
                                  <div className="flex-1 flex flex-col justify-center">
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
                                  Finalizar Pedido
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
                                          appearanceSettings.theme === "escuro"
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
                                              className="font-semibold text-sm"
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
                                              className="text-xs mt-1"
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
                                            className="rounded"
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
                                            Sim, quero adicionar esta oferta ao
                                            meu pedido
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}

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

              {/* Outras Abas (Em Desenvolvimento) */}
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
                    {/* Pixel ADS Facebook/Meta Token */}
                    <div className="space-y-2">
                      <Label htmlFor="pixelAdsToken">Token Facebook/Meta</Label>
                      <Input
                        id="pixelAdsToken"
                        value={apiSettings.pixelAdsToken}
                        onChange={(e) =>
                          handleApiChange("pixelAdsToken", e.target.value)
                        }
                        placeholder="Digite seu Id do Pixel Facebook/Meta"
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
                        Token para integração com Facebook/Meta Pixel para
                        rastreamento de conversões.
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

              <TabsContent value="pedidos" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Pedidos do Produto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Lista de Pedidos */}
                    <div className="space-y-4">
                      {currentOrders.length > 0 ? (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-3 font-medium">
                                    Cliente
                                  </th>
                                  <th className="text-left p-3 font-medium">
                                    CPF
                                  </th>
                                  <th className="text-left p-3 font-medium">
                                    Telefone
                                  </th>
                                  <th className="text-left p-3 font-medium">
                                    Email
                                  </th>
                                  <th className="text-left p-3 font-medium">
                                    Endereço
                                  </th>
                                  <th className="text-left p-3 font-medium">
                                    Valor
                                  </th>
                                  <th className="text-left p-3 font-medium">
                                    Status
                                  </th>
                                  <th className="text-left p-3 font-medium">
                                    Data
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentOrders.map((order) => (
                                  <tr
                                    key={order.id}
                                    className="border-b hover:bg-gray-50 dark:hover:bg-neutral-800"
                                  >
                                    <td className="p-3">
                                      <div className="font-medium">
                                        {order.customerName}
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground">
                                      {order.cpf}
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground">
                                      {order.phone}
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground">
                                      {order.email}
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground max-w-xs truncate">
                                      {order.address}
                                    </td>
                                    <td className="p-3 font-medium">
                                      {new Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      }).format(order.value)}
                                    </td>
                                    <td className="p-3">
                                      <span
                                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                          order.status
                                        )}`}
                                      >
                                        {order.status}
                                      </span>
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground">
                                      {new Date(
                                        order.createdAt
                                      ).toLocaleDateString("pt-BR")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Paginação */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4">
                              <p className="text-sm text-muted-foreground">
                                Mostrando {startIndex + 1} a{" "}
                                {Math.min(
                                  startIndex + ordersPerPage,
                                  orders.length
                                )}{" "}
                                de {orders.length} pedidos
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.max(prev - 1, 1)
                                    )
                                  }
                                  disabled={currentPage === 1}
                                >
                                  Anterior
                                </Button>

                                <div className="flex items-center gap-1">
                                  {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                  ).map((page) => (
                                    <Button
                                      key={page}
                                      variant={
                                        currentPage === page
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() => setCurrentPage(page)}
                                      className="w-8 h-8 p-0"
                                    >
                                      {page}
                                    </Button>
                                  ))}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.min(prev + 1, totalPages)
                                    )
                                  }
                                  disabled={currentPage === totalPages}
                                >
                                  Próximo
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nenhum pedido encontrado
                          </h3>
                          <p className="text-gray-500">
                            Este produto ainda não possui pedidos.
                          </p>
                        </div>
                      )}
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
