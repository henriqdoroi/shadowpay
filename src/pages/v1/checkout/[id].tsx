"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import axios from "axios";
import { trackUTMifyEvent } from "./trackeamento";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "ativo" | "inativo" | "rascunho";
  checkoutConfig?: any;
  productImage?: string;
  productBanner?: string;
  logoUrl?: string;
  isActive?: boolean;
  linkSalesPage?: string;
  productType?: string;
  paymentMethod?: string;
  utmifyToken?: string | null;
  pixelToken?: string | null;
  fbpixelid?: string;
}

interface Deposit {
  id: string;
  paymentMethod: "pix" | "card" | "boleto";
  status: "pending" | "approved" | "rejected" | "cancelled";
  amountGross: number;
  amountNet: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  product: { id: string; name: string };
  customer: { id: string; name: string; email: string };
}

interface AppearanceSettings {
  theme: "padrao" | "escuro" | "claro";
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  showBanner: boolean;
  bannerImageUrl?: string;
  showTimer: boolean;
  timerMinutes: number;
  showHeader: boolean;
  headerTitle: string;
  showTopbar: boolean;
  topbarText: string;
  showTestimonials: boolean;
  testimonials: Array<{
    name: string;
    text: string;
    rating: number;
    imagePosition?: "left" | "right";
    image?: string;
  }>;
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
  productImageUrl?: string;
  footerText?: string;
}

interface ApiFeeData {
  percentualin: number;
  fixoin: number;
}

interface CreateSaleData {
  nome: string;
  email: string;
  cpf: string;
  celular: string;
  paymentMethod: string;
  phone?: string;
}

interface FeesResponse {
  success: boolean;
  data: {
    sellerId: string;
    companyName: string;
    fees: {
      pix: ApiFeeData;
      card: ApiFeeData;
      boleto: ApiFeeData;
      crypto: ApiFeeData;
    };
  };
}

interface FacebookEventCustomer {
  email?: string;
  phone?: string;
  ip?: string;
  userAgent?: string;
}

type PaymentStatus = "pending" | "approved";

interface FacebookEventParams {
  pixelId: string;
  accessToken: string;
  eventName: string;
  value: number;
  currency: string;
  contents: any[];
  customer: FacebookEventCustomer;
}

const productTypeMap: Record<string, string> = {
  digital: "Produto Digital",
  fisico: "Produto Físico",
  servico: "Serviço",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    price: "",
    productImage: "",
    productBanner: "",
    cpf: "",
  });

  const [appearanceSettings, setAppearanceSettings] =
    useState<AppearanceSettings>({
      theme: "padrao",
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      backgroundColor: "#FFFFFF",
      showBanner: true,
      showTimer: true,
      timerMinutes: 15,
      showHeader: true,
      headerTitle: "Oferta Especial",
      showTopbar: true,
      topbarText: "Últimas vagas disponíveis!",
      showTestimonials: false,
      testimonials: [],
      orderBumps: [],
      textColor: "#000000",
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
    });

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isClientSide, setIsClientSide] = useState(false);

  const { user, token } = useAuth();
  const customerRef = useRef<any>(null);
  const productRef = useRef<any>(null);
  const amountRef = useRef<number>(0);
  const pixelTokenRef = useRef<string | null>(null);
  const utmifyTokenRef = useRef<string | null>(null);
  const pixelIdRef = useRef<string | null>(null);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);

  interface PixData {
    amount: number;
    fee: number;
    net: number;
    qrCodeBase64?: string;
    copiaCola?: string;
  }

  const nomeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);
  const celularRef = useRef<HTMLInputElement>(null);
  const paisRef = useRef<HTMLSelectElement>(null);
  const [copied, setCopied] = useState(false);

  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBumps, setSelectedBumps] = useState<number[]>([]);
  const [addedBumps, setAddedBumps] = useState<string[]>([]);
  const [pixCode, setPixCode] = useState("");
  const [paymentMethods, setPaymentMethods] = useState({
    pix: { enabled: false, percent: 0 },
    boleto: { enabled: false, percent: 0 },
    cartao: { enabled: false, percent: 0 },
    picpay: { enabled: false, percent: 0 },
    googlepay: { enabled: false, percent: 0 },
    applepay: { enabled: false, percent: 0 },
  });

  const [pixFees, setPixFees] = useState<ApiFeeData>({
    percentualin: 0,
    fixoin: 0,
  });
  const backRedirect = formData.salesPageUrl;

  const [selectedPayment, setSelectedPayment] = useState<
    keyof typeof paymentMethods | null
  >(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "approved" | null
  >(null);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);
  const [formFields, setFormFields] = useState({
    nome: false,
    email: false,
    cpf: false,
    celular: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // // Detectar lado do cliente
  // useEffect(() => {
  //   setIsClientSide(true);
  // }, []);

  const totalPrice =
    parseFloat(formData.price ?? "0") +
    selectedBumps.reduce((sum, id) => {
      const bump = appearanceSettings.orderBumps.find((b) => b.id === id);
      return bump ? sum + parseFloat(bump.price ?? "0") : sum;
    }, 0);

  const toggleOrderBump = (id: string) => {
    const bumpId = parseInt(id);
    if (addedBumps.includes(id)) {
      setAddedBumps((prev) => prev.filter((bid) => bid !== id));
      setSelectedBumps((prev) => prev.filter((b) => b !== bumpId));
    } else {
      setAddedBumps((prev) => [...prev, id]);
      setSelectedBumps((prev) => [...prev, bumpId]);
    }
  };

  const fetchFees = async () => {
    if (!token) return;
    setIsLoadingFees(true);
    try {
      const response = await axios.get<FeesResponse>(
        "https://shadowpay-api-production.up.railway.app/api/user/fees",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        const { fees } = response.data.data;
        setPixFees(fees.pix);
      }
    } catch (error) {
      console.error("Erro ao buscar taxas:", error);
    } finally {
      setIsLoadingFees(false);
    }
  };

  // Timer do modal PIX
  useEffect(() => {
    if (!showPixModal || !pixData) return;

    setTimeLeft(300);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowPixModal(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showPixModal, pixData]);

  // UTMify script loading - só no cliente
  useEffect(() => {
    if (!isClientSide) return;

    if (!document.getElementById("utmify-script")) {
      const script = document.createElement("script");
      script.id = "utmify-script";
      script.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [isClientSide]);

  /**
   * Registra a VISITA real no backend assim que o produto carrega
   * (com sellerId / productId resolvidos). Coleta UTM da URL e referrer.
   */
  const visitFiredRef = useRef(false);
  useEffect(() => {
    if (!isClientSide || !formData?.id || visitFiredRef.current) return;
    visitFiredRef.current = true;

    const url = new URL(window.location.href);
    const q = (k: string) => url.searchParams.get(k) || undefined;
    const stored: Record<string, any> = (() => {
      try {
        return JSON.parse(localStorage.getItem("utmParams") || "{}");
      } catch {
        return {};
      }
    })();

    fetch("https://shadowpay-api-production.up.railway.app/api/tracking/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: formData.id,
        utm_source: q("utm_source") || stored.utm_source || null,
        utm_medium: q("utm_medium") || stored.utm_medium || null,
        utm_campaign: q("utm_campaign") || stored.utm_campaign || null,
        utm_content: q("utm_content") || stored.utm_content || null,
        utm_term: q("utm_term") || stored.utm_term || null,
        fbclid: q("fbclid") || stored.fbclid || null,
        src: q("src") || stored.src || null,
        sck: q("sck") || stored.sck || null,
        referrer: document.referrer || null,
      }),
    }).catch((e) => console.warn("tracking/visit fail:", e));
  }, [isClientSide, formData?.id]);

  const waitForUtmify = (callback: () => void, attempts = 0) => {
    if (isClientSide && (window as any).utmify?.track) {
      callback();
    } else if (attempts < 10) {
      setTimeout(() => waitForUtmify(callback, attempts + 1), 500);
    } else {
      console.warn("UTMify não carregou a tempo.");
    }
  };

  // Hash SHA256
  const hashSHA256 = async (value: string): Promise<string> => {
    if (!isClientSide) return "";

    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // Send Facebook Event
  const sendFacebookEvent = async ({
    pixelId,
    accessToken,
    eventName,
    value,
    currency,
    contents,
    customer,
  }: FacebookEventParams) => {
    if (!isClientSide) return;

    try {
      const eventTime = Math.floor(Date.now() / 1000);

      const hashedEmail = customer.email
        ? [await hashSHA256(customer.email.trim().toLowerCase())]
        : [];
      const hashedPhone = customer.phone
        ? [await hashSHA256(customer.phone.replace(/\D/g, ""))]
        : [];

      const fbc =
        localStorage.getItem("_fbc") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("_fbc="))
          ?.split("=")[1] ||
        null;

      const fbp =
        localStorage.getItem("_fbp") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("_fbp="))
          ?.split("=")[1] ||
        null;

      const payload = {
        data: [
          {
            event_name: eventName,
            event_time: eventTime,
            action_source: "website",
            event_source_url: window.location.href,
            user_data: {
              em: hashedEmail,
              ph: hashedPhone,
              client_ip_address: customer.ip || "0.0.0.0",
              client_user_agent: customer.userAgent || navigator.userAgent,
              fbc: fbc || undefined,
              fbp: fbp || undefined,
            },
            custom_data: {
              currency,
              value,
              contents,
            },
          },
        ],
      };

      await axios.post(
        `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${accessToken}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error(`[Facebook API] Erro ao enviar evento ${eventName}:`, err);
    }
  };

  // Check Payment Status
  const checkPaymentStatus = (saleId: string, productId: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const formatDate = (date: string | Date) => {
      const d = new Date(date);
      const pad = (n: number) => (n < 10 ? `0${n}` : n);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    intervalRef.current = setInterval(async () => {
      try {
        const txRes = await axios.get(
          `https://shadowpay-api-production.up.railway.app/api/payments/public/transaction/${saleId}`
        );

        const approvedTx = txRes.data?.data;
        if (!approvedTx || approvedTx.status?.toLowerCase() !== "approved")
          return;

        setPaymentStatus("approved");
        if (intervalRef.current) clearInterval(intervalRef.current);

        const amountValue = parseFloat(
          approvedTx.amountNet || approvedTx.amount || amountRef.current || 0
        );

        await axios.put(
          `https://shadowpay-api-production.up.railway.app/api/sales/${saleId}`,
          { status: "approved" },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const productRes = await axios.get(
          `https://shadowpay-api-production.up.railway.app/api/products/${productId}/checkout`
        );
        const productData = productRes.data.data.product;
        const utmifyToken = productData.utmifyToken;
        const gatewayFee = (amountValue * pixFees.percentualin) / 100;
        const netAmount = amountValue - gatewayFee;

        let storedParams: Record<string, any> = {};
        if (isClientSide) {
          storedParams = JSON.parse(localStorage.getItem("utmParams") || "{}");
        }

        const trackingParameters = {
          src: storedParams.src || null,
          sck: storedParams.sck || null,
          utm_source: storedParams.utm_source || "safiracash",
          utm_campaign: storedParams.utm_campaign || null,
          utm_medium: storedParams.utm_medium || "checkout",
          utm_content: storedParams.utm_content || null,
          utm_term: storedParams.utm_term || null,
          fbclid:
            storedParams.fbclid ||
            (isClientSide ? localStorage.getItem("fbclid") : null) ||
            null,
        };

        if (utmifyToken) {
          const payload = {
            orderId: `sale-${saleId}`,
            platform: "SafiraCash",
            paymentMethod: "pix",
            status: "paid",
            createdAt: formatDate(approvedTx.createdAt || new Date()),
            approvedDate: formatDate(new Date()),
            refundedAt: null,
            customer: {
              name: approvedTx.customer?.name || "Cliente",
              email:
                approvedTx.customer?.email ||
                customerRef.current?.email ||
                "cliente@teste.com",
              phone:
                approvedTx.customer?.phone ||
                customerRef.current?.phone ||
                "00000000000",
              document: approvedTx.customer?.cpf || "00000000000",
              country: "BR",
              ip: approvedTx.customer?.ip || customerRef.current?.ip || "",
            },
            products: [
              {
                id: productData.id,
                name: productData.name,
                planId: null,
                planName: null,
                quantity: 1,
                priceInCents: Math.round(amountValue * 100),
              },
            ],
            trackingParameters,
            commission: {
              totalPriceInCents: Math.round(amountValue * 100),
              gatewayFeeInCents: Math.round(gatewayFee * 100),
              userCommissionInCents: Math.round(netAmount * 100),
            },
            isTest: false,
          };

          await axios.post(
            "https://api.utmify.com.br/api-credentials/orders",
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                "x-api-token": utmifyToken,
              },
            }
          );
        }

        if (pixelIdRef.current && pixelTokenRef.current) {
          await sendFacebookEvent({
            pixelId: pixelIdRef.current,
            accessToken: pixelTokenRef.current,
            eventName: "Purchase",
            value: amountValue,
            currency: "BRL",
            contents: [{ id: productRef.current.id, quantity: 1 }],
            customer: customerRef.current,
          });
        }

        // Persiste o Purchase REAL no nosso backend (auditável + agregado
        // por seller na página /v1/tracking).
        try {
          await fetch(
            "https://shadowpay-api-production.up.railway.app/api/tracking/event",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                eventName: "Purchase",
                transactionId: saleId,
                productId: productId,
                value: amountValue,
                currency: "BRL",
                utm_source: trackingParameters.utm_source,
                utm_medium: trackingParameters.utm_medium,
                utm_campaign: trackingParameters.utm_campaign,
                utm_content: trackingParameters.utm_content,
                utm_term: trackingParameters.utm_term,
                fbclid: trackingParameters.fbclid,
                payload: {
                  product: productRef.current?.name,
                  customer: customerRef.current?.email,
                },
              }),
            }
          );
        } catch (err) {
          console.warn("tracking/event purchase:", err);
        }
      } catch (err) {
        console.error("Erro ao checar pagamento:", err);
      }
    }, 5000);
  };

  interface CreateSaleDataWithToken extends CreateSaleData {
    token?: string | null;
  }

  const handleCreateSale = async ({
    nome,
    email,
    cpf,
    celular,
    paymentMethod,
    token,
  }: CreateSaleDataWithToken) => {
    if (!formData?.id || !formData?.name) {
      console.error("formData incompleto:", formData);
      return null;
    }

    try {
      const priceToSend = parseFloat(
        ((discountPercent > 0 ? finalPrice : totalPrice) || 0).toFixed(2)
      );

      const response = await axios.post(
        "https://shadowpay-api-production.up.railway.app/api/sales/public",
        {
          productId: formData.id,
          productName: formData.name,
          price: priceToSend,
          paymentType:
            selectedPayment?.toUpperCase() || paymentMethod?.toUpperCase(),
          name: nome,
          email,
          celular,
          document: cpf,
        },
        {
          headers: { "Content-Type": "application/json" },
          validateStatus: () => true,
        }
      );

      if (!response.data?.id) {
        console.error("Falha ao criar pedido público:", response.data);
        return null;
      }

      return response.data;
    } catch (error: any) {
      console.error("Erro ao criar pedido público:", error?.message);
      return null;
    }
  };

  // Handle Buy Now
  const handleBuyNow = async (
    saleData: CreateSaleData,
    token?: string | null
  ) => {
    if (!product?.id) throw new Error("Produto não definido");

    const formatDate = (date: Date) => {
      const pad = (n: number) => (n < 10 ? `0${n}` : n);
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
      )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds()
      )}`;
    };

    try {
      const safeSaleData: CreateSaleData = {
        nome: saleData.nome || "Cliente",
        email: saleData.email || "cliente@teste.com",
        cpf: saleData.cpf || "00000000000",
        celular: saleData.celular || "+5500000000000",
        paymentMethod: saleData.paymentMethod || "PIX",
      };

      if (isClientSide) {
        if (safeSaleData.cpf) localStorage.setItem("userCPF", safeSaleData.cpf);
        if (safeSaleData.celular)
          localStorage.setItem("userPhone", safeSaleData.celular);
      }

      utmifyTokenRef.current = product.utmifyToken || null;
      pixelIdRef.current = product?.fbpixelid || null;
      pixelTokenRef.current = product?.pixelToken || null;
      await fetchFees();

      const amount = discountPercent > 0 ? finalPrice : totalPrice;

      const createdSale = await handleCreateSale({ ...safeSaleData, token });
      if (!createdSale) throw new Error("Não foi possível criar a venda");

      const saleId = createdSale.id;
      const qrCode = createdSale.qrCode;
      const transactionId = createdSale.transactionId || null;

      if (!saleId || !qrCode) throw new Error("Não foi possível gerar QR code");

      setPixCode(qrCode);
      setTransactionId(transactionId);
      setSaleId(saleId);

      const gatewayFee = (amount * pixFees.percentualin) / 100;
      const netAmount = amount - gatewayFee;

      setPixData({
        amount,
        fee: pixFees.percentualin,
        net: netAmount,
        copiaCola: qrCode,
      });

      setShowPixModal(true);
      setPaymentStatus("pending");

      if (isClientSide) {
        customerRef.current = {
          email: safeSaleData.email,
          phone: safeSaleData.celular,
          ip: "8.8.8.8",
          userAgent: navigator.userAgent,
        };
      }

      productRef.current = product;
      amountRef.current = amount;

      let storedParams: Record<string, any> = {};
      if (isClientSide) {
        storedParams = JSON.parse(localStorage.getItem("utmParams") || "{}");
      }

      if (utmifyTokenRef.current && product?.id) {
        const payload = {
          orderId: `sale-${saleId}`,
          platform: "SafiraCash",
          paymentMethod: "pix",
          status: "waiting_payment",
          ic: true,
          createdAt: formatDate(new Date()),
          approvedDate: null,
          refundedAt: null,
          customer: {
            name: safeSaleData.nome,
            email: safeSaleData.email,
            phone: safeSaleData.celular,
            document: safeSaleData.cpf,
            country: "BR",
            ip: "8.8.8.8",
          },
          products: [
            {
              id: product.id,
              name: product.name,
              planId: null,
              planName: null,
              quantity: 1,
              priceInCents: Math.round(amount * 100),
            },
          ],
          trackingParameters: {
            src: storedParams.src || null,
            sck: storedParams.sck || null,
            utm_source: storedParams.utm_source || "safiracash",
            utm_campaign: storedParams.utm_campaign || null,
            utm_medium: storedParams.utm_medium || "checkout",
            utm_content: storedParams.utm_content || null,
            utm_term: storedParams.utm_term || null,
            fbclid:
              storedParams.fbclid ||
              (isClientSide ? localStorage.getItem("fbclid") : null) ||
              null,
          },
          commission: {
            totalPriceInCents: Math.round(amount * 100),
            gatewayFeeInCents: Math.round(gatewayFee * 100),
            userCommissionInCents: Math.round(netAmount * 100),
          },
          isTest: false,
        };

        try {
          await axios.post(
            "https://api.utmify.com.br/api-credentials/orders",
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                "x-api-token": utmifyTokenRef.current,
              },
            }
          );
        } catch (err) {
          if (axios.isAxiosError(err)) {
            console.error("Erro UTMify:", err.response?.data || err.message);
          } else {
            console.error("Erro UTMify:", err);
          }
        }
      }

      if (pixelIdRef.current && pixelTokenRef.current) {
        await sendFacebookEvent({
          pixelId: pixelIdRef.current,
          accessToken: pixelTokenRef.current,
          eventName: "InitiateCheckout",
          value: product?.price || 0,
          currency: "BRL",
          contents: [{ id: product?.id, quantity: 1 }],
          customer: {
            email: safeSaleData.email,
            phone: safeSaleData.celular,
            ip: await fetch("https://api.ipify.org?format=json")
              .then((res) => res.json())
              .then((data) => data.ip)
              .catch(() => ""),
            userAgent: isClientSide ? navigator.userAgent : "",
          },
        });
      }

      checkPaymentStatus(saleId, product.id);

      return { qrCode, saleId, transactionId };
    } catch (err) {
      console.error("Erro ao gerar PIX:", err);
      throw err;
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  // Persistência de bumps - só no cliente
  useEffect(() => {
    if (!isClientSide) return;

    const storedBumps = localStorage.getItem("selectedBumps");
    if (storedBumps) {
      setSelectedBumps(JSON.parse(storedBumps));
      setAddedBumps(JSON.parse(storedBumps).map(String));
    }
  }, [isClientSide]);

  useEffect(() => {
    if (!isClientSide) return;
    localStorage.setItem("selectedBumps", JSON.stringify(selectedBumps));
  }, [selectedBumps, isClientSide]);

  const discountPercent =
    paymentMethods[selectedPayment as keyof typeof paymentMethods]?.percent ||
    0;
  const finalPrice = totalPrice - (totalPrice * discountPercent) / 100;

  // Limpa intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Redirecionamento depois de aprovado
  useEffect(() => {
    if (paymentStatus === "approved") {
      const timer = setTimeout(async () => {
        try {
          const saleRes = await axios.get(
            `https://shadowpay-api-production.up.railway.app/api/sales/public/${saleId}`
          );

          if (saleRes.data?.linkUpSell) {
            setShowPixModal(false);
            if (isClientSide) {
              window.location.assign(saleRes.data.linkUpSell);
            }
          }
        } catch (err) {
          console.error("Erro ao buscar link de upsell:", err);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [paymentStatus, saleId, isClientSide]);

  // UTM params - só no cliente
  useEffect(() => {
    if (!isClientSide) return;

    const params = new URLSearchParams(window.location.search);
    const utmData = {
      src: params.get("src"),
      sck: params.get("sck"),
      utm_source: params.get("utm_source"),
      utm_campaign: params.get("utm_campaign"),
      utm_medium: params.get("utm_medium"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
      fbclid: params.get("fbclid"),
    };
    localStorage.setItem("utmParams", JSON.stringify(utmData));
  }, [isClientSide]);

  // Função para enviar eventos ao Facebook Pixel
  const trackFacebookPixelEvent = (
    eventName: string,
    eventData: Record<string, any>
  ) => {
    if (isClientSide && (window as any).fbq) {
      (window as any).fbq("track", eventName, eventData);
    }
  };

  // Timer
  useEffect(() => {
    if (!appearanceSettings.showTimer || !isClientSide) return;

    const totalSeconds = appearanceSettings.timerMinutes * 60;
    const storedStartTime = localStorage.getItem("checkoutStartTime");
    let startTime: number = storedStartTime
      ? parseInt(storedStartTime, 10)
      : Date.now();

    if (!storedStartTime)
      localStorage.setItem("checkoutStartTime", startTime.toString());

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = totalSeconds - elapsedSeconds;
      if (remaining > 0) setTimer(remaining);
      else {
        setTimer(0);
        localStorage.removeItem("checkoutStartTime");
        clearInterval(interval);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [
    appearanceSettings.showTimer,
    appearanceSettings.timerMinutes,
    isClientSide,
  ]);

  // Fetch product - consolidado em um único useEffect
  useEffect(() => {
    const formatDate = (date: Date) => {
      const pad = (n: number) => (n < 10 ? `0${n}` : n);
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
      )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds()
      )}`;
    };

    const buildUrl = (input?: string | { filename: string } | null) => {
      if (!input) return undefined;
      const filename =
        typeof input === "string"
          ? input
          : "filename" in input
          ? input.filename
          : "";
      if (!filename) return undefined;
      const sanitized = filename.replace(/^\/+/, "");
      return `https://shadowpay-api-production.up.railway.app/${
        sanitized.startsWith("uploads/")
          ? sanitized
          : `uploads/products/${sanitized}`
      }`;
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("token");
        const url = token
          ? `https://shadowpay-api-production.up.railway.app/api/products/${id}`
          : `https://shadowpay-api-production.up.railway.app/api/products/${id}/checkout`;

        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error("Erro ao buscar produto");

        const data = await res.json();
        const p: Product = data.data?.product ?? data.data ?? null;
        if (!p) {
          console.error("Produto não encontrado ou dados inválidos");
          setProduct(null);
          return;
        }

        setProduct(p);
        utmifyTokenRef.current = p.utmifyToken || null;
        pixelTokenRef.current = p.pixelToken || null;
        pixelIdRef.current = p.fbpixelid || null;

        // Envio do evento Facebook Pixel
        if (pixelIdRef.current && pixelTokenRef.current) {
          try {
            const ipData = await fetch("https://api.ipify.org?format=json")
              .then((res) => res.json())
              .then((data) => data.ip)
              .catch(() => "0.0.0.0");

            await sendFacebookEvent({
              pixelId: pixelIdRef.current,
              accessToken: pixelTokenRef.current,
              eventName: "InitiateCheckout",
              value: p.price || 0,
              currency: "BRL",
              contents: [{ id: p.id, quantity: 1 }],
              customer: {
                email: undefined,
                phone: undefined,
                ip: ipData,
                userAgent: navigator.userAgent,
              },
            });
          } catch (err) {
            console.error("[Facebook] Erro ao enviar IC:", err);
          }
        }

        // Tracking UTMify e transações aprovadas
        const savedSaleId = localStorage.getItem("lastSaleId");
        if (savedSaleId && utmifyTokenRef.current) {
          try {
            const txRes = await axios.get(
              `https://shadowpay-api-production.up.railway.app/api/admin/transactions?saleIds=${savedSaleId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const approvedTx = txRes.data.data.transactions?.find(
              (tx: any) =>
                tx.saleId === savedSaleId &&
                tx.status?.toLowerCase() === "approved"
            );

            if (approvedTx) {
              const amountValue = parseFloat(
                approvedTx.amountNet || approvedTx.amount || 0
              );
              const gatewayFee = (amountValue * pixFees.percentualin) / 100;
              const netAmount = amountValue - gatewayFee;

              const utmParams = JSON.parse(
                localStorage.getItem("utmParams") || "{}"
              );

              const payload = {
                orderId: `sale-${savedSaleId}`,
                platform: "SafiraCash",
                paymentMethod: "pix",
                status: "paid",
                createdAt: formatDate(
                  new Date(approvedTx.createdAt || Date.now())
                ),
                approvedDate: formatDate(new Date()),
                refundedAt: null,
                customer: {
                  name: approvedTx.customer?.name || "Cliente",
                  email: approvedTx.customer?.email || "cliente@teste.com",
                  phone: approvedTx.customer?.phone || "00000000000",
                  document: approvedTx.customer?.cpf || "00000000000",
                  country: "BR",
                  ip: approvedTx.customer?.ip || "0.0.0.0",
                },
                products: [
                  {
                    id: p.id,
                    name: p.name,
                    planId: null,
                    planName: null,
                    quantity: 1,
                    priceInCents: Math.round(amountValue * 100),
                  },
                ],
                trackingParameters: {
                  src: utmParams.src || null,
                  sck: utmParams.sck || null,
                  utm_source: utmParams.utm_source || null,
                  utm_campaign: utmParams.utm_campaign || null,
                  utm_medium: utmParams.utm_medium || null,
                  utm_content: utmParams.utm_content || null,
                  utm_term: utmParams.utm_term || null,
                },
                commission: {
                  totalPriceInCents: Math.round(amountValue * 100),
                  gatewayFeeInCents: Math.round(gatewayFee * 100),
                  userCommissionInCents: Math.round(netAmount * 100),
                },
                isTest: false,
              };

              await fetch("/api/track-utmify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  payload,
                  token: utmifyTokenRef.current,
                }),
              });
            }
          } catch (err) {
            console.error("[UTMify] Erro ao enviar CPA:", err);
          }
        }

        // Configurações de checkout
        const checkoutConfig = p?.checkoutConfig || {};
        const payments = checkoutConfig.payments || {};

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
        const bannerImageUrl = checkoutConfig.bannerImageUrl
          ? buildUrl(checkoutConfig.bannerImageUrl)
          : p.productBanner
          ? buildUrl(p.productBanner)
          : null;

        const orderBumps = Array.isArray(
          checkoutConfig.customFields?.orderBumps
        )
          ? checkoutConfig.customFields.orderBumps.map(
              (bump: any, idx: number) => ({
                id: bump.id || idx + 1,
                title: bump.title || "",
                description: bump.description || "",
                price: bump.price?.toString() || "",
                active: bump.active ?? false,
              })
            )
          : [];

        // Set payment methods
        setPaymentMethods({
          pix: payments.pix || { enabled: false, percent: 0 },
          boleto: payments.boleto || { enabled: false, percent: 0 },
          cartao: payments.cartao || { enabled: false, percent: 0 },
          picpay: payments.picpay || { enabled: false, percent: 0 },
          googlepay: payments.googlepay || { enabled: false, percent: 0 },
          applepay: payments.applepay || { enabled: false, percent: 0 },
        });

        // Set form data
        setFormData((prev: any) => ({
          ...prev,
          id: p.id,
          name: p.name || "",
          description: p.description || "",
          price: p.price?.toString() || "0",
          status: p.isActive ? "ativo" : "inativo",
          checkoutUrl: p.linkSalesPage || "",
          productType:
            (Object.keys(productTypeMap).find(
              (key) => productTypeMap[key] === p.productType
            ) as "digital" | "fisico" | "servico") || "digital",
          billingType:
            p.paymentMethod?.toLowerCase() === "unique"
              ? "unico"
              : "recorrente",
          salesPageUrl: p.linkSalesPage || "",
          productImage: productImageUrl,
          bannerImageUrl,
          bannerImage: null,
          productImageFile: null,
          showProductImage: checkoutConfig.showImageProduct ?? true,
          showProductName: checkoutConfig.showProductName ?? true,
          showDescription: checkoutConfig.showDescription ?? true,
        }));

        // Set form fields visibility
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

        // Set appearance settings
        setAppearanceSettings((prev: AppearanceSettings) => ({
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
          showBanner:
            "showBanner" in checkoutConfig
              ? checkoutConfig.showBanner
              : !!bannerImageUrl,
          showHeader:
            "showHeader" in checkoutConfig
              ? checkoutConfig.showHeader
              : prev.showHeader,
          showTopbar:
            "showTopbar" in checkoutConfig
              ? checkoutConfig.showTopbar
              : prev.showTopbar,
          showTimer:
            "showTimer" in checkoutConfig
              ? checkoutConfig.showTimer
              : prev.showTimer,
          timerMinutes: checkoutConfig.timerMinutes || prev.timerMinutes,
          headerTitle: checkoutConfig.customHeroText || prev.headerTitle,
          topbarText: checkoutConfig.customTimerText || prev.topbarText,
          footerText: checkoutConfig.customFooterText || prev.footerText,
          testimonials,
          showTestimonials:
            (checkoutConfig.showTestimonials === true ||
              checkoutConfig.showTestimonials === "t" ||
              checkoutConfig.showTestimonials === "true") &&
            testimonials.length > 0,
          orderBumps,
          bannerImageUrl: bannerImageUrl || undefined,
          productImageUrl: productImageUrl || undefined,
          bannerImage: bannerImageUrl || undefined,
        }));
      } catch (err) {
        console.error("Erro ao carregar dados do produto:", err);
        setProduct(null);
      } finally {
        setLoading(false);
        setIsPageLoading(false);
      }
    };

    fetchData();
  }, [id]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  useEffect(() => {
    // Adiciona um estado falso no histórico para capturar o "voltar"
    history.pushState(null, "", window.location.href);

    const handleBack = (e?: PopStateEvent) => {
      e?.preventDefault();
      setPendingRedirect(true);
      setShowExitModal(true);
      // Volta a empurrar o estado para evitar sair imediatamente
      history.pushState(null, "", window.location.href);
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (formData.salesPageUrl) {
        // No fechar da aba não dá pra mostrar modal, apenas tentar redirecionar
        event.preventDefault();
        event.returnValue = ""; // obrigatório para alguns navegadores
      }
    };

    window.addEventListener("popstate", handleBack);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handleBack);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formData.salesPageUrl]);

  const confirmExit = () => {
    window.location.href = formData.salesPageUrl;
  };

  const cancelExit = () => {
    setShowExitModal(false);
    setPendingRedirect(false);
    history.pushState(null, "", window.location.href); // cancela voltar
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando aguarde...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex justify-center py-10">
      <div className="max-w-4xl mx-auto py-6">
        <div
          className="border rounded-lg overflow-hidden"
          style={{
            backgroundColor: appearanceSettings.backgroundColor || "white",
          }}
        >
          {/* Timer */}
          {appearanceSettings.showTimer && (
            <div
              className="mx-auto flex flex-col items-center justify-center p-3"
              style={{
                width: "95%",
                backgroundColor:
                  timer > 0 ? appearanceSettings.primaryColor : "#EF4444",
                color: "#ffffff",
                borderRadius: "0",
              }}
            >
              <span className="font-medium text-sm mb-1">
                {timer > 0 ? "Oferta expira em:" : "Oferta Expirada"}
              </span>
              {timer > 0 && (
                <span className="font-bold text-2xl">
                  {String(Math.floor(timer / 60)).padStart(2, "0")}:
                  {String(timer % 60).padStart(2, "0")}
                </span>
              )}
            </div>
          )}

          {/* Banner */}
          {appearanceSettings.showBanner &&
            appearanceSettings.bannerImageUrl && (
              <div
                className="relative mx-auto bg-center bg-no-repeat bg-cover overflow-hidden"
                style={{
                  width: "95%",
                  height: "14rem",
                  borderRadius: "0 0 4px 4px",
                  backgroundImage: `url(${
                    typeof appearanceSettings.bannerImageUrl === "string"
                      ? appearanceSettings.bannerImageUrl
                      : URL.createObjectURL(appearanceSettings.bannerImageUrl)
                  })`,
                }}
              />
            )}

          {/* Topbar */}
          {appearanceSettings.showTopbar && (
            <div
              className="mx-auto text-center font-medium overflow-hidden"
              style={{
                width: "95%",
                backgroundColor: appearanceSettings.secondaryColor,
                color: "#ffffff",
                padding: "0.5rem 0",
                borderRadius: 3,
              }}
            >
              {appearanceSettings.topbarText}
            </div>
          )}
          <br />

          {/* Produto */}
          <div className="space-y-4 text-center">
            {formData.showProductImage && (
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {formData.productImage ? (
                  <img
                    src={
                      formData.productImage instanceof File
                        ? URL.createObjectURL(formData.productImage)
                        : formData.productImage
                    }
                    alt="Produto"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Package className="h-8 w-8 text-gray-400" />
                )}
              </div>
            )}

            {formData.showProductName && (
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

            {formData.showDescription && (
              <p
                className="text-sm mb-4"
                style={{
                  color:
                    appearanceSettings.theme === "escuro"
                      ? "#d1d5db"
                      : "#6b7280",
                }}
              >
                {formData.description || "Descrição do produto"}
              </p>
            )}
          </div>

          {/* Header */}
          {appearanceSettings.showHeader && (
            <div
              className="text-center py-4 border-b"
              style={{
                color:
                  appearanceSettings.theme === "escuro" ? "#ffffff" : "#000000",
              }}
            >
              <h2 className="text-xl font-bold">
                {appearanceSettings.headerTitle}
              </h2>
            </div>
          )}

          <div className="p-6 space-y-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (isProcessingDeposit) return;

                const nome = (
                  document.querySelector<HTMLInputElement>(
                    'input[placeholder="Nome completo"]'
                  )?.value || ""
                ).trim();
                const email = (
                  document.querySelector<HTMLInputElement>(
                    'input[placeholder="nome@email.com"]'
                  )?.value || ""
                ).trim();
                const cpf = (
                  document.querySelector<HTMLInputElement>(
                    'input[placeholder="000.000.000-00"]'
                  )?.value || ""
                ).trim();
                const celular = (
                  document.querySelector<HTMLInputElement>(
                    'input[placeholder="(00) 0000-0000"]'
                  )?.value || ""
                ).trim();

                trackFacebookPixelEvent("Lead", { field: "name", value: nome });
                trackFacebookPixelEvent("Lead", {
                  field: "email",
                  value: email,
                });
                trackFacebookPixelEvent("Lead", {
                  field: "phone",
                  value: celular,
                });

                localStorage.setItem("userCPF", cpf);

                const saleData: CreateSaleData = {
                  nome,
                  email,
                  cpf,
                  celular,
                  paymentMethod: "pix",
                };

                trackUTMifyEvent("clicked_buy_now", {
                  productId: product?.id,
                });
                trackFacebookPixelEvent("InitiateCheckout", {
                  value: product?.price,
                  currency: "BRL",
                });

                const sale: any = await handleBuyNow(saleData, token);

                if (
                  (sale as unknown as { status: string })?.status === "approved"
                ) {
                  trackUTMifyEvent("purchase_completed", {
                    productId: sale.product_id,
                  });
                  trackFacebookPixelEvent("Purchase", {
                    value: sale.amount,
                    currency: "BRL",
                    transactionId: sale.id,
                  });
                }
              }}
            >
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
                            appearanceSettings.theme === "escuro"
                              ? "#d1d5db"
                              : "#374151",
                        }}
                      >
                        Nome completo
                      </label>
                      <input
                        type="text"
                        ref={nomeRef}
                        id="input-nome"
                        placeholder="Nome completo"
                        className="p-3 border rounded-lg w-full text-sm"
                        style={{
                          backgroundColor:
                            appearanceSettings.theme === "escuro"
                              ? "#374151"
                              : "#ffffff",
                          color:
                            appearanceSettings.theme === "escuro"
                              ? "#ffffff"
                              : "#000000",
                          borderColor:
                            appearanceSettings.theme === "escuro" ||
                            appearanceSettings.theme === "padrao"
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
                            appearanceSettings.theme === "escuro"
                              ? "#d1d5db"
                              : "#374151",
                        }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        ref={emailRef}
                        id="input-email"
                        placeholder="nome@email.com"
                        className="p-3 border rounded-lg w-full text-sm"
                        style={{
                          backgroundColor:
                            appearanceSettings.theme === "escuro"
                              ? "#374151"
                              : "#ffffff",
                          color:
                            appearanceSettings.theme === "escuro"
                              ? "#ffffff"
                              : "#000000",
                          borderColor:
                            appearanceSettings.theme === "escuro" ||
                            appearanceSettings.theme === "padrao"
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
                            appearanceSettings.theme === "escuro"
                              ? "#d1d5db"
                              : "#374151",
                        }}
                      >
                        CPF/CNPJ
                      </label>
                      <input
                        type="text"
                        ref={cpfRef}
                        id="input-cpf"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        onChange={(e) => {
                          e.target.value = e.target.value.replace(/\D/g, "");
                        }}
                        className="p-3 border rounded-lg w-full text-sm"
                        style={{
                          backgroundColor:
                            appearanceSettings.theme === "escuro"
                              ? "#374151"
                              : "#ffffff",
                          color:
                            appearanceSettings.theme === "escuro"
                              ? "#ffffff"
                              : "#000000",
                          borderColor:
                            appearanceSettings.theme === "escuro" ||
                            appearanceSettings.theme === "padrao"
                              ? "#4b5563"
                              : "#d1d5db",
                        }}
                      />
                    </div>
                  )}

                  {/* Celular */}
                  {formFields.celular && (
                    <div className="space-y-1">
                      <label
                        className="block text-sm font-medium text-left"
                        style={{
                          color:
                            appearanceSettings.theme === "escuro"
                              ? "#d1d5db"
                              : "#374151",
                        }}
                      >
                        Celular
                      </label>
                      <div className="flex">
                        <select
                          ref={paisRef}
                          className="p-3 border rounded-l-lg text-sm cursor-pointer"
                          style={{
                            backgroundColor:
                              appearanceSettings.theme === "escuro"
                                ? "#374151"
                                : "#ffffff",
                            color:
                              appearanceSettings.theme === "escuro"
                                ? "#ffffff"
                                : "#000000",
                            borderColor:
                              appearanceSettings.theme === "escuro" ||
                              appearanceSettings.theme === "padrao"
                                ? "#4b5563"
                                : "#d1d5db",
                          }}
                        >
                          <option value="+55" selected>
                            🇧🇷 +55
                          </option>
                          <option value="+1">🇺🇸 +1</option>
                        </select>
                        <input
                          type="tel"
                          ref={celularRef}
                          id="input-celular"
                          placeholder="(00) 0000-0000"
                          maxLength={11}
                          onChange={(e) => {
                            e.target.value = e.target.value.replace(/\D/g, "");
                          }}
                          className="p-3 border-t border-b border-r rounded-r-lg flex-1 text-sm"
                          style={{
                            backgroundColor:
                              appearanceSettings.theme === "escuro"
                                ? "#374151"
                                : "#ffffff",
                            color:
                              appearanceSettings.theme === "escuro"
                                ? "#ffffff"
                                : "#000000",
                            borderColor:
                              appearanceSettings.theme === "escuro" ||
                              appearanceSettings.theme === "padrao"
                                ? "#4b5563"
                                : "#d1d5db",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Order Bumps */}
            {appearanceSettings.orderBumps.filter(
              (ob) => ob.active && ob.title && ob.description && ob.price
            ).length > 0 && (
              <div className="space-y-3 mt-6">
                {appearanceSettings.orderBumps
                  .filter(
                    (ob) => ob.active && ob.title && ob.description && ob.price
                  )
                  .map((orderBump) => {
                    const isAdded = addedBumps.includes(
                      orderBump.id.toString()
                    );
                    return (
                      <div
                        key={orderBump.id}
                        className="border rounded-lg overflow-hidden shadow-sm"
                        style={{
                          borderColor: appearanceSettings.primaryColor,
                          backgroundColor:
                            appearanceSettings.theme === "escuro"
                              ? "#374151"
                              : "#f9fafb",
                        }}
                      >
                        <div
                          className="w-full py-1 text-center font-semibold text-sm"
                          style={{
                            backgroundColor: appearanceSettings.primaryColor,
                            color: "#ffffff",
                          }}
                        >
                          Oferta Especial
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5
                                className="font-semibold text-sm"
                                style={{
                                  color:
                                    appearanceSettings.theme === "escuro"
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
                                    appearanceSettings.theme === "escuro"
                                      ? "#d1d5db"
                                      : "#6b7280",
                                }}
                              >
                                {orderBump.description}
                              </p>
                            </div>
                            <div className="text-right ml-3 flex flex-col items-end">
                              <p
                                className="font-bold text-sm"
                                style={{
                                  color: appearanceSettings.primaryColor,
                                }}
                              >
                                R${" "}
                                {parseFloat(orderBump.price || "0")
                                  .toFixed(2)
                                  .replace(".", ",")}
                              </p>
                              <button
                                onClick={() =>
                                  toggleOrderBump(orderBump.id.toString())
                                }
                                className={`mt-2 cursor-pointer text-sm py-1 px-3 rounded font-semibold transition ${
                                  isAdded
                                    ? "bg-red-500 text-white hover:opacity-90"
                                    : "text-white hover:opacity-90"
                                }`}
                                style={{
                                  backgroundColor: isAdded
                                    ? undefined
                                    : appearanceSettings.buttonColor ||
                                      appearanceSettings.primaryColor,
                                  color:
                                    appearanceSettings.buttonTextColor ||
                                    "#ffffff",
                                }}
                              >
                                {isAdded ? "Remover" : "Adicionar ao carrinho"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Container de pagamento */}
            <div
              className="p-4 rounded-lg shadow-md space-y-2"
              style={{
                backgroundColor:
                  appearanceSettings.theme === "escuro" ? "#1f2937" : "#f9fafb",
                border:
                  appearanceSettings.theme === "escuro"
                    ? "1px solid #4b5563"
                    : "1px solid #e5e7eb",
              }}
            >
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

              <div className="flex flex-wrap gap-4 mt-2">
                {[
                  { key: "pix", label: "PIX", icon: "/icons/pix.png" },
                  { key: "boleto", label: "Boleto", icon: "/icons/boleto.png" },
                  { key: "cartao", label: "Cartão", icon: "/icons/cartao.png" },
                  { key: "picpay", label: "PicPay", icon: "/icons/picpay.png" },
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
                  paymentMethods[method.key as keyof typeof paymentMethods]
                    ?.enabled ? (
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

                      {paymentMethods[method.key as keyof typeof paymentMethods]
                        ?.percent ? (
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

              {selectedPayment &&
              paymentMethods[selectedPayment as keyof typeof paymentMethods]
                ?.percent ? (
                <p
                  className="text-sm mt-2"
                  style={{
                    color:
                      appearanceSettings.theme === "escuro"
                        ? "#d1d5db"
                        : "#6b7280",
                  }}
                >
                  {
                    paymentMethods[
                      selectedPayment as keyof typeof paymentMethods
                    ]?.percent
                  }
                  % DE DESCONTO utilizando{" "}
                  {
                    [
                      { key: "pix", label: "PIX" },
                      { key: "boleto", label: "Boleto" },
                      { key: "cartao", label: "Cartão" },
                      { key: "picpay", label: "PicPay" },
                      { key: "googlepay", label: "Google Pay" },
                      { key: "applepay", label: "Apple Pay" },
                    ].find((m) => m.key === selectedPayment)?.label
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
                  O pagamento é instantâneo e liberação imediata.
                </p>
              )}

              {/* Formulário Cartão */}
              {selectedPayment === "cartao" && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col">
                    <label
                      className="text-sm font-medium"
                      style={{
                        color:
                          appearanceSettings.theme === "escuro"
                            ? "#d1d5db"
                            : "#6b7280",
                      }}
                    >
                      Nome do titular
                    </label>
                    <input
                      type="text"
                      placeholder="Nome impresso no cartão"
                      className={`mt-1 p-2 border rounded-md bg-transparent w-full ${
                        appearanceSettings.theme === "escuro"
                          ? "border-gray-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col relative">
                    <label
                      className="text-sm font-medium"
                      style={{
                        color:
                          appearanceSettings.theme === "escuro"
                            ? "#d1d5db"
                            : "#6b7280",
                      }}
                    >
                      Número do cartão
                    </label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      className={`mt-1 p-2 border rounded-md pr-12 bg-transparent w-full ${
                        appearanceSettings.theme === "escuro"
                          ? "border-gray-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                    <img
                      src="/icons/cartao.png"
                      alt="Cartão"
                      className="w-6 h-6 absolute right-3 top-1/2 transform -translate-y-0/2 pointer-events-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex flex-col">
                      <label
                        className="text-sm font-medium"
                        style={{
                          color:
                            appearanceSettings.theme === "escuro"
                              ? "#d1d5db"
                              : "#6b7280",
                        }}
                      >
                        Validade
                      </label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className={`mt-1 p-2 border rounded-md bg-transparent w-full ${
                          appearanceSettings.theme === "escuro"
                            ? "border-gray-500 text-white placeholder-gray-400"
                            : "border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label
                        className="text-sm font-medium"
                        style={{
                          color:
                            appearanceSettings.theme === "escuro"
                              ? "#d1d5db"
                              : "#6b7280",
                        }}
                      >
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className={`mt-1 p-2 border rounded-md bg-transparent w-full ${
                          appearanceSettings.theme === "escuro"
                            ? "border-gray-500 text-white placeholder-gray-400"
                            : "border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label
                        className="text-sm font-medium"
                        style={{
                          color:
                            appearanceSettings.theme === "escuro"
                              ? "#d1d5db"
                              : "#6b7280",
                        }}
                      >
                        Parcelamento
                      </label>
                      <select
                        className={`mt-1 p-2 border rounded-md bg-transparent cursor-pointer w-full ${
                          appearanceSettings.theme === "escuro"
                            ? "border-gray-500 text-white"
                            : "border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="1">1x sem juros</option>
                        <option value="2">2x sem juros</option>
                        <option value="3">3x sem juros</option>
                      </select>
                    </div>
                  </div>
                </div>
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
                Ao clicar em "Comprar agora" você será encaminhado para um
                ambiente seguro, onde encontrará o passo a passo para realizar o
                pagamento.
              </p>
            </div>

            {/* Resumo da compra */}
            <div
              className="p-3 rounded-lg shadow-md flex flex-col items-center space-y-3"
              style={{
                backgroundColor:
                  appearanceSettings.theme === "escuro" ? "#1f2937" : "#ffffff",
                border:
                  appearanceSettings.theme === "escuro"
                    ? "1px solid #4b5563"
                    : "1px solid #e5e7eb",
              }}
            >
              <div className="flex w-full justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <ShoppingCart
                    className="h-5 w-5"
                    style={{
                      color:
                        appearanceSettings.theme === "escuro"
                          ? "#ffffff"
                          : "#111827",
                    }}
                  />
                  <span
                    className="font-medium text-base"
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
                    style={{ color: appearanceSettings.primaryColor }}
                  >
                    {discountPercent > 0
                      ? `R$ ${finalPrice.toFixed(2).replace(".", ",")}`
                      : `R$ ${totalPrice.toFixed(2).replace(".", ",")}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full justify-start">
                <div className="w-12 h-12 border rounded-lg overflow-hidden flex-shrink-0">
                  {formData.productImage ? (
                    <img
                      src={
                        formData.productImage instanceof File
                          ? URL.createObjectURL(formData.productImage)
                          : formData.productImage.startsWith("blob:")
                          ? formData.productImage
                          : formData.productImage.startsWith("http")
                          ? formData.productImage
                          : `https://shadowpay-api-production.up.railway.app/uploads/products/${formData.productImage}`
                      }
                      alt="Produto"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p
                    className="text-sm font-normal mb-0.5"
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
                    style={{ color: appearanceSettings.primaryColor }}
                  >
                    {discountPercent > 0
                      ? `R$ ${finalPrice.toFixed(2).replace(".", ",")}`
                      : `R$ ${totalPrice.toFixed(2).replace(".", ",")}`}
                  </p>
                </div>
              </div>

              <Button
                className={`mt-4 w-full max-w-sm px-5 py-2.5 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isProcessingDeposit
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : "hover:scale-105 hover:shadow-lg cursor-pointer"
                }`}
                style={{ backgroundColor: "#22c55e" }}
                onClick={async () => {
                  if (isProcessingDeposit) return;

                  if (formFields.nome && !nomeRef.current?.value.trim()) {
                    toast.error("Preencha o campo Nome completo.");
                    nomeRef.current?.focus();
                    return;
                  }
                  if (formFields.email && !emailRef.current?.value.trim()) {
                    toast.error("Preencha o campo Email.");
                    emailRef.current?.focus();
                    return;
                  }
                  if (formFields.cpf && !cpfRef.current?.value.trim()) {
                    toast.error("Preencha o campo CPF.");
                    cpfRef.current?.focus();
                    return;
                  }
                  if (formFields.celular && !celularRef.current?.value.trim()) {
                    toast.error("Preencha o campo Celular.");
                    celularRef.current?.focus();
                    return;
                  }
                  if (!selectedPayment) {
                    toast.error("Selecione uma forma de pagamento.");
                    return;
                  }

                  setIsProcessingDeposit(true);
                  await new Promise((resolve) => setTimeout(resolve, 0));

                  const saleData: CreateSaleData = {
                    nome: formFields.nome ? nomeRef.current!.value.trim() : "",
                    email: formFields.email
                      ? emailRef.current!.value.trim()
                      : "",
                    cpf: formFields.cpf ? cpfRef.current!.value.trim() : "",
                    celular: formFields.celular
                      ? `${
                          paisRef.current?.value || "+55"
                        }${celularRef.current!.value.trim()}`
                      : "",
                    paymentMethod: "PIX",
                  };

                  try {
                    const sale = await handleBuyNow(saleData, token || null);

                    if (sale?.qrCode) {
                      setPixCode(sale.qrCode);
                      setShowPixModal(true);
                    } else {
                      toast.error("Erro ao gerar QR code.");
                    }
                  } catch (err: any) {
                    console.error("Erro ao processar compra:", err);
                    toast.error(
                      err?.message || "Ocorreu um erro. Tente novamente."
                    );
                  } finally {
                    setIsProcessingDeposit(false);
                  }
                }}
              >
                {isProcessingDeposit ? "Gerando PIX..." : "Finalizar Pagamento"}
              </Button>
            </div>

            {/* Modal PIX */}
            {showPixModal && pixData && (
              <div className="fixed inset-0 h-screen w-screen flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md text-center relative transition-all duration-700 ease-out">
                  {paymentStatus === "pending" ? (
                    <>
                      <h2 className="text-lg text-black font-bold mb-4">
                        Pagamento PIX
                      </h2>
                      <p className="text-black font-semibold mb-4">
                        Valor a pagar: R${" "}
                        {discountPercent > 0
                          ? finalPrice.toFixed(2).replace(".", ",")
                          : totalPrice.toFixed(2).replace(".", ",")}
                      </p>

                      <p className="text-sm text-gray-700 mb-2">
                        QR Code expira em:{" "}
                        {Math.floor(timeLeft / 60)
                          .toString()
                          .padStart(2, "0")}
                        :{(timeLeft % 60).toString().padStart(2, "0")}
                      </p>

                      {pixCode && (
                        <>
                          <div className="flex justify-center my-4">
                            <QRCodeSVG
                              value={pixCode}
                              size={200}
                              bgColor="#ffffff"
                              fgColor="#000000"
                              level="Q"
                              includeMargin={true}
                            />
                          </div>
                          <div className="flex gap-2 mb-4 relative">
                            <input
                              type="text"
                              readOnly
                              value={pixCode}
                              className="flex-1 text-black text-xs font-mono border rounded-lg p-2"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(pixCode);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="bg-green-500 text-black px-4 py-2 rounded hover:bg-green-600 transition-colors cursor-pointer"
                            >
                              Copiar
                            </button>
                          </div>
                          {copied && (
                            <span className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded shadow">
                              Chave pix copiada!
                            </span>
                          )}
                        </>
                      )}

                      <div className="text-left mb-4">
                        <h3 className="font-semibold mb-1 text-black">
                          Como pagar:
                        </h3>
                        <ol className="list-decimal list-inside text-sm text-gray-700">
                          <li>
                            Escaneie o QR Code ou copie o código PIX acima.
                          </li>
                          <li>
                            Efetue o pagamento via seu aplicativo bancário.
                          </li>
                          <li>
                            Aguarde o processamento automático do pagamento.
                          </li>
                        </ol>
                      </div>

                      <div className="flex justify-between mt-4">
                        <button
                          onClick={() => {
                            const productId: string | null =
                              product !== null && product !== undefined
                                ? product.toString()
                                : null;

                            if (productId && saleId != null) {
                              checkPaymentStatus(saleId.toString(), productId);
                            } else {
                              console.warn("Produto ou saleId inválido");
                            }
                          }}
                          className="cursor-pointer"
                        >
                          Já Paguei
                        </button>

                        <button
                          onClick={() => window.location.reload()}
                          className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 transition-all duration-700 ease-out">
                      {/* Check com halo verde */}
                      <div className="relative mb-5">
                        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                          <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>

                      <h2 className="text-2xl text-slate-900 font-bold mb-1 text-center">
                        Pagamento confirmado!
                      </h2>
                      <p className="text-sm text-slate-600 text-center mb-4 px-4">
                        Sua compra foi aprovada com sucesso.
                      </p>

                      {/* Card com detalhes do pedido */}
                      <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
                        <div className="flex flex-col gap-2">
                          {formData?.name && (
                            <div className="flex justify-between items-start gap-3">
                              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                Produto
                              </span>
                              <span className="text-sm text-slate-900 font-semibold text-right">
                                {formData.name}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center gap-3">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                              Valor
                            </span>
                            <span className="text-base text-green-700 font-bold">
                              R${" "}
                              {(discountPercent > 0
                                ? finalPrice
                                : totalPrice
                              )
                                .toFixed(2)
                                .replace(".", ",")}
                            </span>
                          </div>
                          {saleId && (
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                Pedido
                              </span>
                              <span className="text-xs text-slate-600 font-mono">
                                #{String(saleId).slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mensagem de suporte */}
                      {(formData?.supportEmail || formData?.telefone) && (
                        <div className="w-full bg-blue-50 rounded-xl border border-blue-100 p-3 mb-4 text-xs text-blue-900 text-center">
                          <p className="font-semibold mb-1">
                            Precisa de ajuda?
                          </p>
                          {formData?.supportEmail && (
                            <p>{formData.supportEmail}</p>
                          )}
                          {formData?.telefone && (
                            <p>{formData.telefone}</p>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-slate-500 text-center mb-4 px-2">
                        Você receberá os detalhes da compra no e-mail informado.
                        Pode fechar esta janela com segurança.
                      </p>

                      <button
                        onClick={() => {
                          setShowPixModal(false);
                          if (backRedirect) {
                            window.location.assign(backRedirect);
                          }
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-sm hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30"
                      >
                        Concluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {showExitModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
                  <h2 className="text-lg font-bold mb-4">
                    Deseja realmente sair?
                  </h2>
                  <p className="mb-6 text-gray-600">
                    Você será redirecionado para a página de vendas.
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={cancelExit}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmExit}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Texto e segurança */}
            <div className="flex flex-col gap-4 mt-6 text-gray-600 text-xs">
              <p className="leading-snug">
                Ao clicar em <strong>Finalizar pagamento</strong>, você concorda
                com os{" "}
                <a
                  href="https://safiracash.com.br/termos"
                  className="underline hover:text-blue-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  termos
                </a>{" "}
                e{" "}
                <a
                  href="https://safiracash.com.br/privacidade"
                  className="underline hover:text-blue-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  política de privacidade
                </a>
                .
              </p>

              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-green-700 font-medium">
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

                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Ambiente seguro
                  </span>
                </div>
              </div>
            </div>

            {/* Depoimentos Preview */}
            {appearanceSettings.showTestimonials &&
              appearanceSettings.testimonials.filter((t) => t.name && t.text)
                .length > 0 && (
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
                            appearanceSettings.theme === "escuro"
                              ? "#374151"
                              : "#f3f4f6",
                          flexDirection:
                            testimonial.imagePosition === "right"
                              ? "row-reverse"
                              : "row",
                        }}
                      >
                        {testimonial.image && (
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={
                                typeof testimonial.image === "string"
                                  ? testimonial.image
                                  : URL.createObjectURL(testimonial.image)
                              }
                              alt={testimonial.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex text-yellow-400 text-xs mb-1">
                            {"★".repeat(testimonial.rating)}
                          </div>

                          <p
                            className="text-sm"
                            style={{
                              color:
                                appearanceSettings.theme === "escuro"
                                  ? "#d1d5db"
                                  : "#374151",
                            }}
                          >
                            "{testimonial.text}"
                          </p>

                          <p
                            className="text-xs font-medium mt-1"
                            style={{
                              color:
                                appearanceSettings.theme === "escuro"
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

            {/* Copyright */}
            <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-14a6 6 0 100 12 6 6 0 000-12zm0 10a4 4 0 110-8 4 4 0 010 8z" />
              </svg>
              SafiraCash todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
