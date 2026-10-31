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
import { forgetDeviceOnLogout, syncPushIfGranted } from "@/lib/push";
import { clearMainSession, readMainSession } from "@/lib/demo";

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
  /** Foto de perfil (data URL) — vem do /api/user/profile. */
  avatarUrl?: string | null;
  /** Subconta de simulação (DEMO) — sem saque, sem cobrança. */
  isDemo?: boolean;
  /** Admin liberou a conta demo pra este seller. */
  demoAllowed?: boolean;
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
  number: string;
  // Coletados depois no KYC obrigatório — opcionais no cadastro.
  cpf_cnpj?: string;
  zipCode?: string;
  companyModality?: string;
  companyActivity?: string;
}

interface AuthContextType {
  user: Seller | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    code?: string
  ) => Promise<{ success: boolean; error?: string; twofaRequired?: boolean }>;
  register: (
    data: RegisterData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Seller) => void;
  /** Troca o token desta sessão (ex.: depois de mudar a senha). */
  updateToken: (token: string) => void;
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

  // Push: a permissão SÓ é pedida por um toque do seller (PushEnableCard /
  // banner do dashboard). Aqui, só mantemos o aparelho registrado quando a
  // permissão já foi dada — ver src/lib/push.ts.

  // Função para buscar dados atualizados do usuário
  const refreshUserData = async (): Promise<void> => {
    if (!token) return;

    try {
      const response = await axios.get(
        "https://shadowpay-backend.onrender.com/api/user/profile",
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
          // Mantém este aparelho registrado no push (só se já permitiu).
          // Na conta demo NÃO: o aparelho fica com a conta principal.
          if (!userData.isDemo) syncPushIfGranted(savedToken);
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
    password: string,
    code?: string
  ): Promise<{ success: boolean; error?: string; twofaRequired?: boolean }> => {
    setIsLoading(true);

    try {
      const response = await axios.post<LoginResponse>(
        "https://shadowpay-backend.onrender.com/api/auth/login",
        { email, password, ...(code ? { code } : {}) },
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
        // Login novo = conta principal; sessão guardada de demo antiga não vale mais.
        clearMainSession();

        // Invalida cache do KYC pro KycGate re-checar com este novo seller.
        if (typeof window !== "undefined") {
          delete (window as any).__shadowKycStatus;
        }

        // Este aparelho passa a receber as vendas desta conta (se já permitiu)
        syncPushIfGranted(authToken, true);

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
      const errCode = err.response?.data?.error?.code;
      const serverMsg = err.response?.data?.error?.message || err.response?.data?.message;

      // Conta com 2FA: a senha está certa, falta o código do app.
      if (errCode === "TWOFA_REQUIRED") {
        return { success: false, twofaRequired: true, error: serverMsg };
      }
      if (errCode === "TWOFA_INVALID") {
        return { success: false, twofaRequired: true, error: serverMsg || "Código 2FA inválido." };
      }

      if (err.response?.status === 401) {
        errorMessage = serverMsg && !/unauthorized/i.test(serverMsg) ? serverMsg : "E-mail ou senha incorretos.";
      } else if (err.response?.status === 429) {
        // muitas tentativas: o servidor diz quanto tempo esperar
        errorMessage = serverMsg || "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
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

  const updateToken = (next: string) => {
    if (!next) return;
    setToken(next);
    localStorage.setItem("token", next);
  };

  const logout = () => {
    // Este aparelho para de receber as vendas desta conta (usa o token atual).
    // Saindo de dentro da conta demo, sai da conta principal também.
    const main = readMainSession();
    forgetDeviceOnLogout(user?.isDemo ? main?.token ?? null : token);
    clearMainSession();
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
        "https://shadowpay-backend.onrender.com/api/auth/register",
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
    updateToken,
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
