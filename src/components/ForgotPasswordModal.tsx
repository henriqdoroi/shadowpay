"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "email" | "otp" | "password";

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setIsLoading(false);
    onClose();
  };

  const handleEmailSubmit = async () => {
    if (!email) return;
    setIsLoading(true);
    // Simular envio do e-mail
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setStep("otp");
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    // Simular verificação do OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setStep("password");
  };

  const handlePasswordSubmit = async () => {
    if (!newPassword || newPassword !== confirmPassword) return;
    setIsLoading(true);
    // Simular redefinição da senha
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    handleClose();
  };

  const goBack = () => {
    if (step === "otp") setStep("email");
    if (step === "password") setStep("otp");
  };

  const getTitle = () => {
    switch (step) {
      case "email":
        return "Recuperar senha";
      case "otp":
        return "Verificar código";
      case "password":
        return "Nova senha";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-800 border-neutral-700 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            {step !== "email" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="p-1 h-8 w-8 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-xl">{getTitle()}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {step === "email" && (
            <>
              <div className="space-y-2">
                <p className="text-sm text-neutral-300">
                  Digite seu e-mail para receber o código de verificação.
                </p>
              </div>
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
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20"
                />
              </div>
              <Button
                onClick={handleEmailSubmit}
                disabled={!email || isLoading}
                className="w-full bg-[#6114fa] hover:bg-[#0066cc] text-white"
              >
                {isLoading ? "Enviando..." : "Enviar código"}
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="space-y-2">
                <p className="text-sm text-neutral-300">
                  Digite o código de 6 dígitos enviado para <strong>{email}</strong>.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Código de verificação</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-white/5 border-white/20 text-white" />
                      <InputOTPSlot index={1} className="bg-white/5 border-white/20 text-white" />
                      <InputOTPSlot index={2} className="bg-white/5 border-white/20 text-white" />
                      <InputOTPSlot index={3} className="bg-white/5 border-white/20 text-white" />
                      <InputOTPSlot index={4} className="bg-white/5 border-white/20 text-white" />
                      <InputOTPSlot index={5} className="bg-white/5 border-white/20 text-white" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("email")}
                  className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  Reenviar código
                </Button>
                <Button
                  onClick={handleOtpSubmit}
                  disabled={otp.length !== 6 || isLoading}
                  className="flex-1 bg-[#6114fa] hover:bg-[#0066cc] text-white"
                >
                  {isLoading ? "Verificando..." : "Verificar"}
                </Button>
              </div>
            </>
          )}

          {step === "password" && (
            <>
              <div className="space-y-2">
                <p className="text-sm text-neutral-300">
                  Crie uma nova senha para sua conta.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white">
                    Nova senha
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Digite sua nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirmar senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme sua nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20"
                  />
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-400">As senhas não coincidem</p>
                )}
              </div>
              <Button
                onClick={handlePasswordSubmit}
                disabled={!newPassword || newPassword !== confirmPassword || isLoading}
                className="w-full bg-[#6114fa] hover:bg-[#0066cc] text-white"
              >
                {isLoading ? "Salvando..." : "Redefinir senha"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}