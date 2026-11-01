import Head from "next/head";
import { LightShell } from "@/components/LightShell";
import StoreCheckoutSettings from "@/components/store-checkout/StoreCheckoutSettings";
import OffersPanel from "@/components/offers/OffersPanel";
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
  backRedirectUrl?: string | null;
  upsellUrl?: string | null;
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
  // ?tab=checkouts abre direto na lista de checkouts (volta do builder)
  const [activeTab, setActiveTab] = useState("dados-gerais");
  useEffect(() => {
    if (router.query.tab === "checkouts") setActiveTab("checkouts");
  }, [router.query.tab]);

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

  // Link real do checkout deste produto (domínio onde o painel está aberto)
  const [checkoutLinks, setCheckoutLinks] = useState([
    {
      id: 1,
      url: "",
      domain: "",
      isCustomDomain: false,
      createdAt: new Date().toISOString(),
    },
  ]);
  useEffect(() => {
    if (typeof window === "undefined" || !id) return;
    setCheckoutLinks((prev) =>
      prev.map((l, i) =>
        i === 0 && !l.isCustomDomain
          ? { ...l, url: `${window.location.origin}/v1/checkout/${id}`, domain: window.location.host }
          : l
      )
    );
  }, [id]);

  const productTypeMap: Record<string, "DIGITAL" | "PHYSICAL" | "SERVICE"> = {
    digital: "DIGITAL",
    fisico: "PHYSICAL",
    servico: "SERVICE",
  };

  const [newCustomDomain, setNewCustomDomain] = useState("");
  const [apiSettings, setApiSettings] = useState({
    pixelAdsToken: "",
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

        const res = await fetch(`https://shadowpay-backend.onrender.com/api/products/${id}`, {
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
          return `https://shadowpay-backend.onrender.com/${
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
          salesPageUrl: p.backRedirectUrl || p.linkSalesPage || "",
          upsellUrl: p.linkUpSell || p.upsellUrl || "",
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
          // Antes os bumps iam parar aqui por engano: salvar apagava os order
          // bumps do produto e desligava os depoimentos.
          showTestimonials:
            checkoutConfig.showTestimonials === true ||
            checkoutConfig.showTestimonials === "t" ||
            checkoutConfig.showTestimonials === "true",
          orderBumps: orderBumps.length ? orderBumps : prev.orderBumps,
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
      // ---------- Pixel (UTMify agora é da conta: Integrações → UTMify) ----------
      formDataToSend.append("pixelToken", apiSettings.pixelAdsToken || "");
      formDataToSend.append("fbpixelid", apiSettings.fbpixelidToken || "");
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
        // No topo (como no criar produto): é daqui que o checkout e o servidor
        // leem o desconto do PIX. Só dentro de customFields o desconto zerava.
        paymentMethods,
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
      const url = `https://shadowpay-backend.onrender.com/api/products/${id}`;
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
      <LightShell>
        <Head>
          <title>ShadowPay — Editar produto</title>
        </Head>
        <div className="flex h-64 items-center justify-center text-[14px] text-slate-500">Carregando produto…</div>
      </LightShell>
    );
  }

  return (
    <LightShell>
      <Head>
        <title>ShadowPay — Editar produto</title>
      </Head>
          <div className="flex flex-col gap-6 pb-10" style={{ color: "#0F172A" }}>
            {/* Header (mesmo padrão das outras páginas) */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  size="icon"
                  onClick={handleBack}
                  aria-label="Voltar para Produtos"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-[22px] font-semibold text-slate-900 sm:text-[26px]">Editar produto</h1>
                  <p className="mt-0.5 text-[14px] text-slate-500">Ajuste o produto, o checkout e as formas de pagamento.</p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex h-11 items-center gap-2 rounded-xl bg-[#8A1EF7] px-5 font-semibold text-white hover:bg-[#6C0DE0] cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>

            {/* Tabs de Edição */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  value="dados-gerais"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Dados Gerais</span>
                </TabsTrigger>

                <TabsTrigger
                  value="checkouts"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Checkouts</span>
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
                              placeholder="https://seusite.com/oferta-especial"
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
                              placeholder="https://seusite.com/upsell"
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
                              placeholder="suporte@seusite.com"
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

              {/* Aba Checkouts: vários checkouts por produto (visual no Checkout Builder) */}
              <TabsContent value="checkouts" className="space-y-6">
                {typeof id === "string" && <OffersPanel productId={id} />}
                {typeof id === "string" && <StoreCheckoutSettings productId={id} />}
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
                    {/* UTMify agora é da conta — Integrações → UTMify */}
                    <div
                      className="flex items-start gap-3 rounded-xl p-3.5"
                      style={{
                        background: "rgba(245,158,11,0.06)",
                        border: "1px solid #ECECF0",
                      }}
                    >
                      <Zap
                        className="mt-0.5 h-[18px] w-[18px] shrink-0"
                        style={{ color: "#D97706" }}
                      />
                      <div className="text-[12.5px] leading-relaxed text-slate-600">
                        <b className="text-slate-900">A UTMify agora é da conta.</b>{" "}
                        Conecte seu token uma vez em{" "}
                        <a
                          href="/v1/integrations/utmify"
                          className="font-semibold underline"
                          style={{ color: "#8A1EF7" }}
                        >
                          Integrações → UTMify
                        </a>{" "}
                        e todas as vendas deste e dos outros produtos vão pra
                        UTMify automaticamente, com as UTMs — direto do nosso
                        servidor, sem expor seu token no checkout. Se você tinha
                        colocado um token aqui, a conexão foi passada pra lá —
                        confira em Integrações → UTMify.
                      </div>
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
    </LightShell>
  );
}
