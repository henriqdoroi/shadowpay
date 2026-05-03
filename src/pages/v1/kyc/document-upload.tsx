import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, ArrowRight, ArrowLeft, CheckCircle, User, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";

function DocumentUploadContent() {
    const router = useRouter();
    const { token, refreshUserData, logout } = useAuth();
    const [frontImage, setFrontImage] = useState<File | null>(null);
    const [backImage, setBackImage] = useState<File | null>(null);
    const [frontPreview, setFrontPreview] = useState<string | null>(null);
    const [backPreview, setBackPreview] = useState<string | null>(null);
    const [selfieImage, setSelfieImage] = useState<File | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
    const [cnpjDocument, setcnpjDocument] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [kycId, setKycId] = useState<string | null>(null);
    const [isStartingKyc, setIsStartingKyc] = useState(false);

    const handleFileUpload = (file: File, type: 'front' | 'back' | 'selfie') => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                if (type === 'front') {
                    setFrontImage(file);
                    setFrontPreview(result);
                } else if (type === 'back') {
                    setBackImage(file);
                    setBackPreview(result);
                } else if (type === 'selfie') {
                    setSelfieImage(file);
                    setSelfiePreview(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handlecnpjUpload = (file: File) => {
        if (file && file.type === 'application/pdf') {
            setcnpjDocument(file);
        } else {
            alert('Por favor, selecione apenas arquivos PDF.');
        }
    };

    // Função para iniciar o processo de KYC e obter o kycId
    const startKycProcess = async () => {
        if (!token) {
            setError('Token de autenticação não encontrado');
            return null;
        }

        setIsStartingKyc(true);
        setError(null);

        try {
            const response = await axios.post(
                'https://api.safira.cash/api/user/kyc/start',
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                const newKycId = response.data.data.kycId;
                setKycId(newKycId);
                localStorage.setItem('kycId', newKycId);
                return newKycId;
            } else {
                setError('Erro ao iniciar processo de verificação');
                return null;
            }
        } catch (err: any) {
            console.error('Erro ao iniciar KYC:', err);
            
            if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else if (err.response?.status === 400) {
                setError(err.response.data?.message || 'Dados inválidos');
            } else if (err.response?.status === 409) {
                // Se já foi iniciado, pode continuar com o kycId existente
                const existingKycId = localStorage.getItem('kycId');
                if (existingKycId) {
                    setKycId(existingKycId);
                    return existingKycId;
                }
                setError('Processo de KYC já foi iniciado, mas kycId não encontrado');
            } else {
                setError('Erro interno do servidor. Tente novamente.');
            }
            return null;
        } finally {
            setIsStartingKyc(false);
        }
    };

    // Verificar se já existe um kycId ao carregar a página
    useEffect(() => {
        const existingKycId = localStorage.getItem('kycId');
        if (existingKycId) {
            setKycId(existingKycId);
        }
    }, []);

    const handleNext = async () => {
        if (!frontImage || !backImage || !selfieImage || !cnpjDocument) {
            setError('Por favor, envie todos os documentos necessários');
            return;
        }

        if (!token) {
            setError('Token de autenticação não encontrado');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Se não temos kycId, iniciar o processo de KYC primeiro
            let currentKycId = kycId;
            if (!currentKycId) {
                currentKycId = await startKycProcess();
                if (!currentKycId) {
                    setIsLoading(false);
                    return; // Erro já foi definido na função startKycProcess
                }
            }

            // Criar FormData para envio dos arquivos
            const formData = new FormData();
            formData.append('documentFrontImage', frontImage);
            formData.append('documentBackImage', backImage);
            formData.append('selfieImage', selfieImage);
            formData.append('companyDocumentImage', cnpjDocument);

            const response = await axios.post(
                'https://api.safira.cash/api/user/kyc/documents',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                // Limpar o kycId do localStorage se existir
                localStorage.removeItem('kycId');
                
                // Atualizar dados do usuário para refletir o novo status
                await refreshUserData();
                
                // Aguardar 2 segundos antes de desconectar
                setTimeout(() => {
                    // Fazer logout e redirecionar para login
                    logout();
                }, 2000);
            } else {
                setError('Erro ao enviar documentos. Tente novamente.');
            }
        } catch (err: any) {
            console.error('Erro ao enviar documentos:', err);
            
            if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else if (err.response?.status === 400) {
                setError(err.response.data?.message || 'Dados inválidos. Verifique os documentos.');
            } else if (err.response?.status === 413) {
                setError('Arquivos muito grandes. Reduza o tamanho e tente novamente.');
            } else if (err.response?.status === 415) {
                setError('Formato de arquivo não suportado.');
            } else {
                setError('Erro interno do servidor. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.push('/v1/kyc');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 p-4">
            <div className="max-w-4xl w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-white">
                        Upload de Documentos
                    </h1>
                    <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                        Envie todos os documentos necessários: frente e verso do documento de identidade, selfie e comprovante cnpj.
                    </p>
                </div>

                {/* Progress */}
                <div className="flex justify-center">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                ✓
                            </div>
                            <span className="ml-2 text-neutral-300">Introdução</span>
                        </div>
                        <div className="w-8 h-0.5 bg-purple-600"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                2
                            </div>
                            <span className="ml-2 text-white font-semibold">Documentos</span>
                        </div>
                    </div>
                </div>

                {/* Document Upload Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Front Document */}
                    <Card className="bg-neutral-800/50 border-neutral-700">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-white text-xl flex items-center justify-center gap-2">
                                <Camera className="w-5 h-5" />
                                Frente do Documento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {frontPreview ? (
                                <div className="relative">
                                    <img 
                                        src={frontPreview} 
                                        alt="Frente do documento" 
                                        className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                                    />
                                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-2 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                                        onClick={() => {
                                            setFrontImage(null);
                                            setFrontPreview(null);
                                        }}
                                    >
                                        Trocar Imagem
                                    </Button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="front-upload"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file, 'front');
                                        }}
                                    />
                                    <label htmlFor="front-upload" className="cursor-pointer">
                                        <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                                        <p className="text-neutral-300 font-semibold mb-2">Clique para fazer upload</p>
                                        <p className="text-neutral-500 text-sm">ou arraste a imagem aqui</p>
                                    </label>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Back Document */}
                    <Card className="bg-neutral-800/50 border-neutral-700">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-white text-xl flex items-center justify-center gap-2">
                                <Camera className="w-5 h-5" />
                                Verso do Documento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {backPreview ? (
                                <div className="relative">
                                    <img 
                                        src={backPreview} 
                                        alt="Verso do documento" 
                                        className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                                    />
                                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-2 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                                        onClick={() => {
                                            setBackImage(null);
                                            setBackPreview(null);
                                        }}
                                    >
                                        Trocar Imagem
                                    </Button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="back-upload"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file, 'back');
                                        }}
                                    />
                                    <label htmlFor="back-upload" className="cursor-pointer">
                                        <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                                        <p className="text-neutral-300 font-semibold mb-2">Clique para fazer upload</p>
                                        <p className="text-neutral-500 text-sm">ou arraste a imagem aqui</p>
                                    </label>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {/* Selfie Upload */}
                    <Card className="bg-neutral-800/50 border-neutral-700">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-white text-xl flex items-center justify-center gap-2">
                                <User className="w-5 h-5" />
                                Selfie
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selfiePreview ? (
                                <div className="relative">
                                    <img 
                                        src={selfiePreview} 
                                        alt="Selfie" 
                                        className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                                    />
                                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-2 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                                        onClick={() => {
                                            setSelfieImage(null);
                                            setSelfiePreview(null);
                                        }}
                                    >
                                        Trocar Foto
                                    </Button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="selfie-upload"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file, 'selfie');
                                        }}
                                    />
                                    <label htmlFor="selfie-upload" className="cursor-pointer">
                                        <User className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                                        <p className="text-neutral-300 font-semibold mb-2">Envie sua selfie</p>
                                        <p className="text-neutral-500 text-sm">Clique para selecionar</p>
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
                                    <div className="w-full h-48 bg-neutral-700 rounded-lg border-2 border-green-500 flex flex-col items-center justify-center">
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
                                <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
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
                                        <p className="text-neutral-500 text-sm">Apenas arquivos PDF</p>
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
                        <div className="grid md:grid-cols-4 gap-4 text-sm text-neutral-300">
                            <div className="text-center">
                                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    💡
                                </div>
                                <p>Boa iluminação, evite sombras</p>
                            </div>
                            <div className="text-center">
                                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    📱
                                </div>
                                <p>Mantenha documentos retos</p>
                            </div>
                            <div className="text-center">
                                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    🔍
                                </div>
                                <p>Texto legível e nítido</p>
                            </div>
                            <div className="text-center">
                                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    📄
                                </div>
                                <p>cnpj em PDF atualizado</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* KYC Status */}
                {isStartingKyc && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                        <p className="text-blue-400 text-sm flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Iniciando processo de verificação...
                        </p>
                    </div>
                )}

                {kycId && !isStartingKyc && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                        <p className="text-green-400 text-sm">
                            ✓ Processo de verificação iniciado. Envie seus documentos para finalizar.
                        </p>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4">
                    <Button 
                        variant="outline" 
                        className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                        onClick={handleBack}
                        disabled={isLoading || isStartingKyc}
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Voltar
                    </Button>
                    <Button 
                        className={`flex-1 font-semibold py-3 text-lg ${
                            frontImage && backImage && selfieImage && cnpjDocument && !isLoading && !isStartingKyc
                                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                : 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                        }`}
                        onClick={handleNext}
                        disabled={!frontImage || !backImage || !selfieImage || !cnpjDocument || isLoading || isStartingKyc}
                    >
                        {isLoading || isStartingKyc ? (
                            <>
                                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                {isStartingKyc ? 'Iniciando...' : 'Enviando...'}
                            </>
                        ) : (
                            <>
                                Finalizar Verificação
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </>
                        )}
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

export default function DocumentUpload() {
    return (
        <ProtectedRoute>
            <DocumentUploadContent />
        </ProtectedRoute>
    );
}