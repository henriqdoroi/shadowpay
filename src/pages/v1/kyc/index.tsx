import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";

function KycContent() {
    const router = useRouter();

    const handleStartVerification = () => {
        router.push('/v1/kyc/document-upload');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 p-4">
            <div className="max-w-2xl w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">

                    <h1 className="text-4xl font-bold text-white">
                        Verificação de Identidade
                    </h1>
                    <p className="text-neutral-400 text-lg max-w-md mx-auto">
                        Para sua segurança e conformidade, precisamos verificar sua identidade antes de continuar.
                    </p>
                </div>

                {/* Main Card */}
                <Card className="bg-neutral-800/50 border-neutral-700">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-white text-2xl">
                            Confirme sua Identidade
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Illustration */}
                        <div className="flex justify-center">
                            <Image 
                                alt="Identity verification illustration"
                                src={'/8449768_3907312.svg'}
                                width={680}
                                height={400}
                                className="max-w-full h-auto"
                            />
                        </div>

                        {/* Information */}
                        <div className="space-y-4 text-center">
                            <h3 className="text-xl font-semibold text-white">
                                O que você precisará:
                            </h3>
                            <div className="grid gap-3 text-neutral-300">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span>Documento de identidade válido (RG, CNH ou Passaporte)</span>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span>Foto clara do documento</span>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span>Selfie para verificação facial</span>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span>Comprovante de Inscrição cnpj</span> <a
                                    href="https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp"
                                    className="text-purple-500">Como emitir?</a>
                                </div>
                            </div>
                        </div>



                        {/* Action Button */}
                        <div className="pt-4">
                            <Button 
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 text-lg"
                                size="lg"
                                onClick={handleStartVerification}
                            >
                                Iniciar Verificação
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>

                        {/* Security Note */}
                        <div className="text-center text-sm text-neutral-400 pt-2">
                            <p>
                                🔒 Seus dados são protegidos com criptografia de ponta a ponta
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-neutral-500 text-sm">
                    <p>
                        Processo rápido e seguro • Geralmente leva menos de 2 minutos
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function Kyc() {
    return (
        <ProtectedRoute>
            <KycContent />
        </ProtectedRoute>
    );
}