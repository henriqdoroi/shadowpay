import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ArrowRight, ArrowLeft, CheckCircle, Upload, FileText } from "lucide-react";
import { useRouter } from "next/router";

export default function Selfie() {
    const router = useRouter();
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [cnpjDocument, setcnpjDocument] = useState<File | null>(null);

    const handleSelfieUpload = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelfieImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Por favor, selecione apenas arquivos de imagem.');
        }
    };

    const removeSelfie = () => {
        setSelfieImage(null);
    };

    const handlecnpjUpload = (file: File) => {
        if (file && file.type === 'application/pdf') {
            setcnpjDocument(file);
        } else {
            alert('Por favor, selecione apenas arquivos PDF.');
        }
    };

    const handleNext = () => {
        if (selfieImage && cnpjDocument) {
            // Navegar para página de conclusão ou dashboard
            router.push('/v1/dashboard');
        }
    };

    const handleBack = () => {
        router.push('/v1/kyc/document-upload');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 p-4">
            <div className="max-w-4xl w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-white">
                        Selfie e Documento cnpj
                    </h1>
                    <p className="text-neutral-400 text-lg max-w-md mx-auto">
                        Tire uma selfie e faça upload do seu documento cnpj em PDF.
                    </p>
                </div>

                {/* Progress */}
                <div className="flex justify-center">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                ✓
                            </div>
                            <span className="ml-2 text-neutral-300">Introdução</span>
                        </div>
                        <div className="w-8 h-0.5 bg-blue-600"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                ✓
                            </div>
                            <span className="ml-2 text-neutral-300">Documento</span>
                        </div>
                        <div className="w-8 h-0.5 bg-blue-600"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                3
                            </div>
                            <span className="ml-2 text-white font-semibold">Selfie & cnpj</span>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Selfie Capture */}
                    <Card className="bg-neutral-800/50 border-neutral-700">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-white text-xl flex items-center justify-center gap-2">
                                <User className="w-5 h-5" />
                                Selfie
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selfieImage ? (
                                <div className="relative">
                                    <img 
                                        src={selfieImage} 
                                        alt="Selfie enviada" 
                                        className="w-full h-64 object-cover rounded-lg border-2 border-green-500"
                                    />
                                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-2 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                                        onClick={removeSelfie}
                                    >
                                        Trocar Foto
                                    </Button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="selfie-upload"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleSelfieUpload(file);
                                        }}
                                    />
                                    <label htmlFor="selfie-upload" className="cursor-pointer">
                                        <User className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                                        <p className="text-neutral-300 font-semibold mb-2">Envie sua selfie</p>
                                        <p className="text-neutral-500 text-sm mb-2">Formatos: JPG, PNG, JPEG</p>
                                        <p className="text-blue-400 text-sm underline">Clique para selecionar</p>
                                    </label>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* cnpj Document Upload */}
                    <Card className="bg-neutral-800/50 border-neutral-700">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-white text-xl flex items-center justify-center gap-2">
                                <FileText className="w-5 h-5" />
                                Documento cnpj
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {cnpjDocument ? (
                                <div className="relative">
                                    <div className="w-full h-64 bg-neutral-700 rounded-lg border-2 border-green-500 flex flex-col items-center justify-center">
                                        <FileText className="w-16 h-16 text-green-500 mb-4" />
                                        <p className="text-white font-semibold">{cnpjDocument.name}</p>
                                        <p className="text-neutral-400 text-sm">
                                            {(cnpjDocument.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-2 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                                        onClick={() => setcnpjDocument(null)}
                                    >
                                        Trocar Arquivo
                                    </Button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        id="cnpj-upload"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handlecnpjUpload(file);
                                        }}
                                    />
                                    <label htmlFor="cnpj-upload" className="cursor-pointer">
                                        <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                                        <p className="text-neutral-300 font-semibold mb-2">Upload do cnpj</p>
                                        <p className="text-neutral-500 text-sm mb-2">Apenas arquivos PDF</p>
                                        <p className="text-blue-400 text-sm underline">Clique para selecionar</p>
                                    </label>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tips */}
                <Card className="bg-neutral-800/30 border-neutral-700">
                    <CardContent className="pt-6">
                        <h3 className="text-white font-semibold mb-4 text-center">Dicas importantes:</h3>
                        <div className="grid md:grid-cols-2 gap-6 text-sm text-neutral-300">
                            <div>
                                <h4 className="text-white font-semibold mb-2">Para a selfie:</h4>
                                <ul className="space-y-1">
                                    <li>• Remova óculos escuros e chapéus</li>
                                    <li>• Mantenha boa iluminação no rosto</li>
                                    <li>• Rosto deve estar claramente visível</li>
                                    <li>• Imagem nítida e de boa qualidade</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Para o cnpj:</h4>
                                <ul className="space-y-1">
                                    <li>• Documento deve estar atualizado</li>
                                    <li>• Arquivo em formato PDF</li>
                                    <li>• Tamanho máximo de 10MB</li>
                                    <li>• Texto deve estar legível</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex gap-4">
                    <Button 
                        variant="outline" 
                        className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Voltar
                    </Button>
                    <Button 
                        className={`flex-1 font-semibold py-3 text-lg ${
                            selfieImage && cnpjDocument 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                        }`}
                        onClick={handleNext}
                        disabled={!selfieImage || !cnpjDocument}
                    >
                        Finalizar Verificação
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>

                {/* Security Note */}
                <div className="text-center text-sm text-neutral-400">
                    <p>
                        🔒 Todos os dados são processados com segurança e protegidos por criptografia
                    </p>
                </div>
            </div>
        </div>
    );
}