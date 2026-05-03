"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/v1/dashboard");
    }

    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isAuthenticated, router]);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await login(email, password);

      if (result.success) {
        toast.success("Login realizado com sucesso!");

        if ("Notification" in window && Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            toast("Notificações não ativadas.");
          }
        }

        if (
          "serviceWorker" in navigator &&
          "PushManager" in window &&
          Notification.permission === "granted"
        ) {
          // Espera o service worker estar pronto
          const registration = await navigator.serviceWorker.ready;

          // Subscribe para push
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              "BGSIIaq7ymGsCu-qDrD32FrzTJtd5KgEU5tbjhuQEWF2JVMc72XGLMJYzSK9Snb2W2Swlun9pB9O2Mrt9l7KC3A"
            ),
          });

          // Envia a subscription para o backend
          await fetch("/api/webhooks/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription }),
          });

          toast.success("Notificações ativadas!");
        }

        router.push("/v1/dashboard");
      } else {
        toast.error(
          result.error || "Erro no login. Verifique suas credenciais."
        );
      }
    } catch (err) {
      toast.error("Erro inesperado no login.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(97, 20, 250, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(97, 20, 250, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Blur Effect - Top Right */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#6114fa]/10 rounded-full blur-3xl" />

      {/* Blur Effect - Bottom Left */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#6114fa]/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Image
              src="/safira-logo.png"
              alt="Safira Cash Logo"
              width={200}
              height={50}
              className=""
            />
          </div>

          <Card className="bg-neutral-800/50 border-neutral-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-white text-xl">
                Acesse sua conta!
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20 disabled:opacity-50"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm text-[#9F7AEA] hover:text-[#B794F4] transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#6114fa] hover:bg-[#6114fa/80] text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </CardContent>
            </form>
            <CardFooter className="flex flex-col space-y-4">
              <div className="flex items-center w-full">
                <Separator className="flex-1 bg-neutral-600" />
                <span className="px-4 text-sm text-neutral-400">ou</span>
                <Separator className="flex-1 bg-neutral-600" />
              </div>
              <div className="text-center">
                <span className="text-sm text-neutral-400">
                  Não tem uma conta?{" "}
                </span>
                <Link
                  href="/auth/jwt/register"
                  className="text-sm text-[#9F7AEA] hover:text-[#B794F4] transition-colors"
                >
                  Criar conta
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}
