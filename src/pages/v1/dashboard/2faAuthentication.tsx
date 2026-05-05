import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";

interface TwoFAModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  user: {
    id: string;
    twofaEnabled: boolean;
    [key: string]: any;
  } | null;
  setUser: (user: any) => void; // Função para atualizar o estado do usuário no dashboard
}

export default function TwoFAModal({
  isOpen,
  onClose,
  token,
  user,
  setUser,
}: TwoFAModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [userToken, setUserToken] = useState("");
  const [error, setError] = useState("");

  const fetchSetup = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        "https://shadowpay-production-2ca8.up.railway.app/api/pages/2fa/setup",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setQrCodeUrl(res.data.qrCodeUrl);
      setSecret(res.data.secret); // opcional, só para mostrar manualmente
    } catch (err: any) {
      console.error(err);
      setError("Falha ao gerar QR Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!userToken) return;
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "https://shadowpay-production-2ca8.up.railway.app/api/pages/2fa/verify",
        { token: userToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        if (user) setUser({ ...user, twofaEnabled: true });

        onClose();

        // 🔁 Força o reload da página após ativar o 2FA
        setTimeout(() => {
          window.location.reload();
        }, 800); // pequeno delay para garantir que o modal feche primeiro
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.twofaEnabled) {
      setQrCodeUrl(null);
      setSecret(null);
    }
  }, [user]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
      <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-2xl shadow-xl w-[90%] max-w-lg z-50 flex flex-col gap-6">
        <Dialog.Title className="text-xl font-bold text-foreground">
          Ativar 2FA
        </Dialog.Title>

        {!qrCodeUrl && !secret ? (
          <Button
            onClick={fetchSetup}
            disabled={loading}
            className="cursor-pointer w-full border border-white bg-transparent text-white hover:bg-[#6a0dad] transition-colors"
          >
            {loading ? "Gerando QR Code..." : "Gerar QR Code / Secret"}
          </Button>
        ) : (
          <div className="flex flex-col gap-4 items-center w-full">
            {qrCodeUrl && (
              <div className="w-48 h-48 sm:w-56 sm:h-56 border rounded-md p-2 bg-white flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Code 2FA"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="w-full overflow-x-auto text-center">
              <code className="text-sm text-muted-foreground">{secret}</code>
            </div>

            <input
              type="text"
              placeholder="Digite o código do Authenticator"
              value={userToken}
              onChange={(e) => setUserToken(e.target.value)}
              className="border border-input rounded-md p-3 w-full text-center focus:outline-none focus:ring-2 focus:ring-primary text-white"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              onClick={handleVerify}
              disabled={loading || !userToken}
              className="w-full border border-white bg-transparent text-white hover:bg-[#6a0dad] transition-colors"
            >
              {loading ? "Verificando..." : "Ativar 2FA"}
            </Button>
          </div>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
