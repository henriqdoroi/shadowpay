"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  BarChart2,
  AppWindowMac,
  PiggyBank,
  User,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { MobileSidebar } from "@/components/mobile-sidebar";

export type KycStatus = "PENDING" | "APPROVED" | "BANNED" | "NOT_STARTED";

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  requiresKycApproved?: boolean;
  disabled?: boolean;
}

interface ApiFeeData {
  percentualin: number;
  fixoin: number;
}

interface NavBottomProps {
  items: NavItem[];
  userKycStatus: KycStatus;
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

type Status = "PENDING" | "APPROVED" | "FAILED" | "CANCELED" | "EXPIRED" | null;

function useTransactionStatus(
  transactionId: string,
  token: string,
  onApproved: () => void,
  onFailed?: (status: string) => void
) {
  const [status, setStatus] = useState<Status>(null);
  const [isChecking, setIsChecking] = useState(false);
  const lastSeenRef = useRef<string | null>(null);

  const checkOnce = async () => {
    if (!transactionId || !token) return null;
    setIsChecking(true);
    try {
      const resp = await axios.get(
        `https://shadowpay-production-2ca8.up.railway.app/api/payments/transaction/${transactionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!resp.data?.success) return null;
      const newStatus = resp.data.data.status?.toUpperCase();
      if (!newStatus) return null;

      if (newStatus !== lastSeenRef.current) {
        lastSeenRef.current = newStatus;
        setStatus(newStatus as Status);

        if (newStatus === "APPROVED") onApproved();
        else if (["FAILED", "CANCELED", "EXPIRED"].includes(newStatus))
          onFailed?.(newStatus);
      }
      return newStatus as Status;
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      console.warn("Erro no checkStatusOnce:", e);
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  return { status, isChecking, refresh: checkOnce };
}

export function NavBottom({ items, userKycStatus }: NavBottomProps) {
  const router = useRouter();
  const { user, token } = useAuth();

  const [depositoValue, setDepositoValue] = useState("0");
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCode, setPixCode] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [pixFees, setPixFees] = useState<ApiFeeData>({
    percentualin: 0,
    fixoin: 0,
  });
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const valorBruto = parseFloat(depositoValue) || 0;
  const valorTaxaFixa = pixFees.fixoin || 0;
  const valorTaxaPercentual = valorBruto * ((pixFees.percentualin || 0) / 100);
  const valorTaxaTotal = valorTaxaFixa + valorTaxaPercentual;
  const valorLiquido = valorBruto - valorTaxaTotal;

  const fetchFees = async () => {
    if (!token) return;
    setIsLoadingFees(true);
    try {
      const response = await axios.get<FeesResponse>(
        "https://shadowpay-production-2ca8.up.railway.app/api/user/fees",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) setPixFees(response.data.data.fees.pix);
    } catch (error) {
      console.error("Erro ao buscar taxas:", error);
    } finally {
      setIsLoadingFees(false);
    }
  };

  const handleApproved = () => {
    toast.success("Depósito aprovado!");
    closeModal();
    if (typeof window !== "undefined" && window.innerWidth <= 768)
      router.refresh();
  };

  const handleFailed = (status: string) => {
    toast.error(`Depósito com status: ${status}`);
    closeModal();
  };

  const { status, isChecking, refresh } = useTransactionStatus(
    transactionId,
    token || "",
    handleApproved,
    handleFailed
  );

  useEffect(() => {
    if (!showPixModal || !transactionId || status === "APPROVED") return;
    const interval = setInterval(() => refresh(), 2000);
    return () => clearInterval(interval);
  }, [showPixModal, transactionId, status, refresh]);

  useEffect(() => {
    if (user && token) fetchFees();
  }, [user, token]);

  if (!user) return null;

  const navigate = (url: string, disabled?: boolean) => {
    if (!disabled && url && url !== "#") router.push(url);
  };

  const Performance = items.find((i) =>
    i.title.toLowerCase().includes("performance")
  );
  const Relatorios = items.find((i) => i.title.toLowerCase().includes("relat"));
  const Saque = items.find(
    (i) =>
      i.title.toLowerCase().includes("saque") ||
      i.title.toLowerCase().includes("withdraw")
  );

  const isDisabled = (item?: NavItem) =>
    item?.requiresKycApproved && userKycStatus !== "APPROVED";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleDeposito = async () => {
    const val = parseFloat(depositoValue.replace(",", "."));
    if (isNaN(val) || val <= 0 || !user || !token) {
      toast.error("Insira um valor válido para depósito.");
      return;
    }
    setIsProcessingDeposit(true);
    try {
      const response = await axios.post(
        "https://shadowpay-production-2ca8.up.railway.app/api/payments/internal/deposit",
        {
          amount: val,
          paymentMethod: "pix",
          metadata: { description: "Depósito interno" },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data.data || {};
      setPixCode(data.pixQrCode || data.qrCode || "");
      setTransactionId(data.transactionId || "");
      setShowPixModal(true);
    } catch (error) {
      console.error("Erro ao depositar:", error);
      toast.error("Erro ao processar depósito. Tente novamente.");
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const copyPixCode = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      toast.success("Código PIX copiado!");
    }
  };
  const closeModal = () => {
    setShowPixModal(false);
    setDepositoValue("0");
    setPixCode("");
    setTransactionId("");
  };

  return (
    <>
      {/* Barra inferior mobile moderna e compacta com border-radius discreto */}
      {/* Barra inferior mobile moderna e compacta com border-radius discreto */}
      <nav className="fixed bottom-4 left-1/2 z-50 w-[95%] max-w-lg -translate-x-1/2 bg-black/90 backdrop-blur-md shadow-lg md:hidden rounded-xl border border-zinc-800">
        <ul className="flex justify-between items-center min-h-[70px] px-6 overflow-visible">
          {/* Menu */}
          <li className="flex flex-col items-center justify-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white p-3 rounded-full hover:bg-purple-700 active:bg-purple-800 transition"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="text-[10px] text-white mt-1">Menu</span>
          </li>

          {/* Carteira */}
          <li className="flex flex-col items-center justify-center">
            <button
              onClick={() =>
                navigate(
                  Performance?.url || "/v1/finance/withdraw",
                  isDisabled(Performance)
                )
              }
              disabled={isDisabled(Performance)}
              className={`text-white p-3 rounded-full transition
          ${
            isDisabled(Performance)
              ? "opacity-50"
              : "hover:bg-purple-700 active:bg-purple-800"
          }`}
            >
              <AppWindowMac className="h-6 w-6" />
            </button>
            <span className="text-[10px] text-white mt-1">Saque</span>
          </li>

          {/* Depositar */}
          <li className="relative flex flex-col items-center justify-center -top-2 z-10">
            <button
              onClick={() => setShowPixModal(true)}
              className="bg-[#7C3AED] text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-[#6B21A8] active:bg-purple-800 transition"
            >
              <CreditCard className="h-6 w-6" />
            </button>
            <span className="text-[10px] text-white mt-1">Depositar</span>
          </li>

          {/* Relatórios */}
          <li className="flex flex-col items-center justify-center">
            <button
              onClick={() =>
                navigate(
                  Relatorios?.url || "/v1/reports",
                  isDisabled(Relatorios)
                )
              }
              disabled={isDisabled(Relatorios)}
              className={`text-white p-3 rounded-full transition
          ${
            isDisabled(Relatorios)
              ? "opacity-50"
              : "hover:bg-purple-700 active:bg-purple-800"
          }`}
            >
              <BarChart2 className="h-6 w-6" />
            </button>
            <span className="text-[10px] text-white mt-1">Relatórios</span>
          </li>

          {/* Saque */}
          <li className="flex flex-col items-center justify-center">
            <button
              onClick={() =>
                navigate(Saque?.url || "/v1/configs/profile", isDisabled(Saque))
              }
              disabled={isDisabled(Saque)}
              className={`text-white p-3 rounded-full transition
          ${
            isDisabled(Saque)
              ? "opacity-50"
              : "hover:bg-purple-700 active:bg-purple-800"
          }`}
            >
              <User className="h-6 w-6" />
            </button>
            <span className="text-[10px] text-white mt-1">Perfil</span>
          </li>
        </ul>
      </nav>

      {/* Sidebar Mobile */}
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Sheet para digitar valor */}
      <Sheet
        open={showPixModal && !pixCode}
        onOpenChange={(open) => !open && closeModal()}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-6 bg-black text-white"
        >
          <SheetHeader>
            <SheetTitle className="text-center text-lg font-semibold text-white">
              Depósito via PIX
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Digite o valor do depósito
              </p>
              <p className="text-3xl font-bold mt-2 text-white">
                {formatCurrency(valorBruto)}
              </p>
              {valorBruto > 0 && !isLoadingFees && (
                <p className="text-xs text-gray-400 mt-1">
                  Líquido: {formatCurrency(valorLiquido)}
                </p>
              )}
            </div>

            {/* Teclado numérico */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "00",
                "0",
                "←",
              ].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "←")
                      setDepositoValue((v) => v.slice(0, -1) || "0");
                    else setDepositoValue((v) => (v === "0" ? key : v + key));
                  }}
                  className="h-14 text-lg font-semibold rounded-xl bg-white text-black active:bg-gray-200"
                >
                  {key}
                </button>
              ))}
            </div>

            <Button
              onClick={handleDeposito}
              disabled={isProcessingDeposit}
              className="w-full mt-4 bg-purple-700 text-white hover:bg-purple-800"
            >
              {isProcessingDeposit ? "Processando..." : "Gerar PIX"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal antigo para mostrar QR code e copiar código */}
      <Dialog open={!!pixCode} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="bg-black text-white">
          <DialogHeader>
            <DialogTitle>Depósito via PIX</DialogTitle>
            {pixCode && (
              <div className="mb-4 rounded border border-blue-400 bg-blue-50 p-3 text-blue-700 text-sm">
                O status do depósito é verificado automaticamente a cada 15
                segundos.
              </div>
            )}
          </DialogHeader>

          <div className="flex flex-col items-center justify-center mt-6 space-y-4 w-full">
            {/* QR Code */}
            <QRCodeSVG value={pixCode} size={200} />

            {/* Campo com código PIX */}
            <Input
              type="text"
              readOnly
              value={pixCode}
              className="bg-gray-800 text-white w-full text-center"
            />

            {/* Botão para copiar código */}
            <Button
              onClick={() => {
                navigator.clipboard.writeText(pixCode);
                toast.success("Código PIX copiado!");
              }}
              className="w-full bg-purple-700 text-white hover:bg-purple-800"
            >
              Copiar Código
            </Button>

            {/* Botão para fechar modal */}
            <Button
              onClick={closeModal}
              variant="outline"
              className="w-full text-white border-white hover:bg-white/10"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
