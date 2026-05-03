import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Check, 
  X, 
  TrendingUp, 
  Users, 
  Clock,
  CreditCard,
  Mail,
  Phone,
  Hash,
  Building
} from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface WithdrawRequest {
  id: string;
  merchantId: string;
  clientName: string;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA';
  amount: number;
  netAmount: number;
  profit: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const mockWithdrawRequests: WithdrawRequest[] = [
  {
    id: 'WD001',
    merchantId: 'MERCH_001',
    clientName: 'João Silva Santos',
    pixKey: '123.456.789-00',
    pixKeyType: 'CPF',
    amount: 1500.00,
    netAmount: 1485.00,
    profit: 15.00,
    status: 'PENDING',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'WD002',
    merchantId: 'MERCH_002',
    clientName: 'Maria Oliveira Costa',
    pixKey: 'maria.oliveira@email.com',
    pixKeyType: 'EMAIL',
    amount: 2300.50,
    netAmount: 2277.50,
    profit: 23.00,
    status: 'PENDING',
    createdAt: '2024-01-15T09:15:00Z'
  },
  {
    id: 'WD003',
    merchantId: 'MERCH_003',
    clientName: 'Carlos Eduardo Lima',
    pixKey: '+55 11 99999-8888',
    pixKeyType: 'TELEFONE',
    amount: 850.75,
    netAmount: 842.25,
    profit: 8.50,
    status: 'APPROVED',
    createdAt: '2024-01-15T08:45:00Z'
  },
  {
    id: 'WD004',
    merchantId: 'MERCH_001',
    clientName: 'Ana Paula Ferreira',
    pixKey: '12.345.678/0001-90',
    pixKeyType: 'CNPJ',
    amount: 5200.00,
    netAmount: 5148.00,
    profit: 52.00,
    status: 'PENDING',
    createdAt: '2024-01-15T07:20:00Z'
  },
  {
    id: 'WD005',
    merchantId: 'MERCH_004',
    clientName: 'Roberto Almeida',
    pixKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    pixKeyType: 'CHAVE_ALEATORIA',
    amount: 750.25,
    netAmount: 742.75,
    profit: 7.50,
    status: 'REJECTED',
    createdAt: '2024-01-14T16:30:00Z'
  },
  {
    id: 'WD006',
    merchantId: 'MERCH_002',
    clientName: 'Fernanda Santos',
    pixKey: 'fernanda.santos@empresa.com.br',
    pixKeyType: 'EMAIL',
    amount: 3100.00,
    netAmount: 3069.00,
    profit: 31.00,
    status: 'PENDING',
    createdAt: '2024-01-14T14:15:00Z'
  }
];

export default function WithdrawPage() {
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>(mockWithdrawRequests);
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({});

  const handleApprove = async (withdrawId: string) => {
    setLoadingActions(prev => ({ ...prev, [withdrawId]: true }));
    
    // Simular chamada da API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setWithdrawRequests(prev => 
      prev.map(request => 
        request.id === withdrawId 
          ? { ...request, status: 'APPROVED' as const }
          : request
      )
    );
    
    setLoadingActions(prev => ({ ...prev, [withdrawId]: false }));
  };

  const handleReject = async (withdrawId: string) => {
    setLoadingActions(prev => ({ ...prev, [withdrawId]: true }));
    
    // Simular chamada da API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setWithdrawRequests(prev => 
      prev.map(request => 
        request.id === withdrawId 
          ? { ...request, status: 'REJECTED' as const }
          : request
      )
    );
    
    setLoadingActions(prev => ({ ...prev, [withdrawId]: false }));
  };

  const getPixKeyIcon = (type: string) => {
    switch (type) {
      case 'CPF':
      case 'CNPJ':
        return <Hash className="h-4 w-4" />;
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'TELEFONE':
        return <Phone className="h-4 w-4" />;
      case 'CHAVE_ALEATORIA':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-600">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  // Calcular estatísticas
  const pendingRequests = withdrawRequests.filter(req => req.status === 'PENDING');
  const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + req.amount, 0);
  const totalProfit = withdrawRequests.reduce((sum, req) => sum + req.profit, 0);
  const approvedToday = withdrawRequests.filter(req => {
    const today = new Date().toDateString();
    const reqDate = new Date(req.createdAt).toDateString();
    return req.status === 'APPROVED' && today === reqDate;
  }).length;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/v2/manager">
                  Gerenciamento
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Saques</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Saques</h1>
              <p className="text-muted-foreground">
                Gerencie e aprove solicitações de saque dos usuários
              </p>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saques Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(totalPendingAmount)} em análise
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovados Hoje</CardTitle>
                <Check className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedToday}</div>
                <p className="text-xs text-muted-foreground">
                  Saques processados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</div>
                <p className="text-xs text-muted-foreground">
                  Em taxas de saque
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{withdrawRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  Todas as solicitações
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Saques */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Saque</CardTitle>
              <CardDescription>
                Lista de todas as solicitações de saque dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Merchant ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Chave PIX</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Bruto</TableHead>
                      <TableHead>Valor Líquido</TableHead>
                      <TableHead>Lucro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {request.merchantId}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{request.clientName}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={request.pixKey}>
                            {request.pixKey}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPixKeyIcon(request.pixKeyType)}
                            <span className="text-sm">{request.pixKeyType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(request.amount)}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {formatCurrency(request.netAmount)}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(request.profit)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(request.createdAt)}
                        </TableCell>
                        <TableCell>
                          {request.status === 'PENDING' ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleApprove(request.id)}
                                disabled={loadingActions[request.id]}
                              >
                                {loadingActions[request.id] ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleReject(request.id)}
                                disabled={loadingActions[request.id]}
                              >
                                {loadingActions[request.id] ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}