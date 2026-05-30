"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "sonner";

// Tipos para os dados do usuário
interface Wallet {
  id: string;
  sellerId: string;
  balance: string;
  blockedBalance: string;
  reservedBalance: string;
  isBlocked: boolean;
}

interface Credentials {
  id: string;
  sellerId: string;
  publicKey: string;
  privateKey: string;
  createdAt: string;
  lastUsedAt: string;
}

interface KYC {
  id?: string;
  status?: string;
  message: string;
}

interface Statistics {
  totalSales: number;
  grossRevenue: number;
  netRevenue: number;
  totalFees: number;
  uniqueCustomers: number;
  monthlySales: number;
  monthlyRevenue: number;
}

interface Seller {
  twofaEnabled: any;
  adquererId: string;
  id: string;
  companyName: string;
  email: string;
  number: string;
  cpf_cnpj: string;
  zipCode: string;
  companyModality: string;
  companyActivity: string;
  kycStatus: "NOT_STARTED" | "PENDING" | "APPROVED" | "BANNED";
  isAdministrator: boolean;
  feePercentPix: number;
  feeFixedPix: string;
  feePercentCard: number;
  feeFixedCard: string;
  feePercentBoleto: number;
  feeFixedBoleto: string;
  feePercentCrypto: number;
  feeFixedCrypto: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  suspendedAt: string | null;
  wallet: Wallet[];
  credentials: Credentials[];
  kyc: KYC;
  statistics?: Statistics;
}

interface LoginResponse {
  success: boolean;
  data: {
    seller: Seller;
    token: string;
    message: string;
  };
  message: string;
}

interface RegisterData {
  companyName: string;
  email: string;
  password: string;
  cpf_cnpj: string;
  number: string;
  zipCode: string;
  companyModality: string;
  companyActivity: string;
}

interface AuthContextType {
  user: Seller | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: RegisterData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Seller) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Seller | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user && !!token;

  // --- Função auxiliar para converter chave pública VAPID ---
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
  };

  // --- Função para registrar service worker (se ainda não registrado) ---
  const registerServiceWorker =
    async (): Promise<ServiceWorkerRegistration | null> => {
      if ("serviceWorker" in navigator) {
        try {
          return await navigator.serviceWorker.register("/sk.js");
        } catch (error) {
          console.error("Erro ao registrar service worker:", error);
          return null;
        }
      }
      return null;
    };

  const subscribeUserToPush = async (authToken: string) => {
    // Checa se já tentou inscrever nesta sessão
    if (sessionStorage.getItem("pushSubscribed")) {
      console.log("Push subscription já enviada nesta sessão.");
      return;
    }

    // Checa se já avisou que está negado nesta sessão
    if (sessionStorage.getItem("pushDeniedWarned")) {
      if (Notification.permission === "denied") {
        return; // não enche o saco de novo
      }
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notifications não são suportadas nesse navegador.");
      return;
    }

    try {
      if (Notification.permission === "denied") {
        toast.error(
          "Permissão para notificações negada. Por favor, habilite nas configurações do navegador."
        );
        // marca que já avisou nesta sessão
        sessionStorage.setItem("pushDeniedWarned", "true");
        return;
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Permissão para notificações negada");
          sessionStorage.setItem("pushDeniedWarned", "true");
          return;
        }
      }

      await registerServiceWorker();

      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        toast.error(
          "Falha ao obter registro ativo do service worker para push"
        );
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.VAPID_PUBLIC_KEY ||
            "BGSIIaq7ymGsCu-qDrD32FrzTJtd5KgEU5tbjhuQEWF2JVMc72XGLMJYzSK9Snb2W2Swlun9pB9O2Mrt9l7KC3A"
        ),
      });

      await axios.post(
        "https://shadowpay-api-production.up.railway.app/api/webhooks/notifications/subscribe",
        { subscription },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      sessionStorage.setItem("pushSubscribed", "true");
    } catch (error: any) {
      toast.error("Erro ao ativar notificações: " + error.message);
      console.error("Erro push:", error);
    }
  };

  // Função para buscar dados atualizados do usuário
  const refreshUserData = async (): Promise<void> => {
    if (!token) return;

    try {
      const response = await axios.get(
        "https://shadowpay-api-production.up.railway.app/api/user/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.data;

        if (
          user &&
          user.isAdministrator &&
          (!updatedUser.hasOwnProperty("isAdministrator") ||
            !updatedUser.isAdministrator)
        ) {
          updatedUser.isAdministrator = user.isAdministrator;
        }

        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logout();
      }
    }
  };

  // Verificar se há dados salvos no localStorage ao inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUserData = localStorage.getItem("user");

    if (savedToken && savedUserData) {
      try {
        const userData: Seller = JSON.parse(savedUserData);
        setToken(savedToken);
        setUser(userData);

        // Atualizar dados do usuário após carregar do localStorage
        setTimeout(() => {
          refreshUserData();
          // Inscrever push ao carregar a aplicação se já autenticado
          subscribeUserToPush(savedToken);
        }, 1000);
      } catch (error) {
        console.error("Erro ao parsear dados do usuário:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  // Polling para atualizar dados do usuário periodicamente
  // useEffect(() => {
  //   if (!isAuthenticated) return;

  //   const interval = setInterval(() => {
  //     refreshUserData();
  //   }, 30000);

  //   return () => clearInterval(interval);
  // }, [isAuthenticated, token]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const response = await axios.post<LoginResponse>(
        "https://shadowpay-api-production.up.railway.app/api/auth/login",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const { token: authToken, seller } = response.data.data;

        setToken(authToken);
        setUser(seller);

        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(seller));

        // Invalida cache do KYC pro KycGate re-checar com este novo seller.
        if (typeof window !== "undefined") {
          delete (window as any).__shadowKycStatus;
        }

        // Após login, inscreve o usuário no push
        subscribeUserToPush(authToken);

        return { success: true };
      } else {
        return {
          success: false,
          error: "Credenciais inválidas. Tente novamente.",
        };
      }
    } catch (err: any) {
      console.error("Erro no login:", err);

      let errorMessage = "Erro de conexão. Verifique sua internet.";

      if (err.response?.status === 401) {
        errorMessage = "E-mail ou senha incorretos.";
      } else if (err.response?.status === 400) {
        errorMessage = "Dados inválidos. Verifique os campos.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde.";
      }

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Invalida cache do KYC pra próxima sessão recarregar do backend.
    if (typeof window !== "undefined") {
      delete (window as any).__shadowKycStatus;
    }
    router.push("/auth/jwt/login");
  };

  const register = async (
    data: RegisterData
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://shadowpay-api-production.up.railway.app/api/auth/register",
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const loginResult = await login(data.email, data.password);
        return loginResult;
      } else {
        return {
          success: false,
          error:
            response.data.message || "Erro ao criar conta. Tente novamente.",
        };
      }
    } catch (err: any) {
      console.error("Erro no registro:", err);

      let errorMessage = "Erro de conexão. Verifique sua internet.";

      if (err.response?.status === 400) {
        errorMessage =
          err.response.data.message || "Dados inválidos. Verifique os campos.";
      } else if (err.response?.status === 409) {
        errorMessage = "E-mail ou cnpj já cadastrado.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde.";
      }

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Seller) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

export default AuthContext;
