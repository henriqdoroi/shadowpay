import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Save, Settings, CreditCard } from 'lucide-react';
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

interface PSPConfig {
  isActive: boolean;
  cashinFixedFee: string;
  cashinPercentageFee: string;
  cashoutFixedFee: string;
  cashoutPercentageFee: string;
  secretKey: string;
}

export default function PSPKeyPage() {
  const [config, setConfig] = useState<PSPConfig>({
    isActive: true,
    cashinFixedFee: '0.50',
    cashinPercentageFee: '2.99',
    cashoutFixedFee: '1.00',
    cashoutPercentageFee: '1.50',
    secretKey: 'sk_test_4eC39HqLyjWDarjtT1zdp7dc'
  });

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfigChange = (field: keyof PSPConfig, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simular chamada da API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    alert('Configurações salvas com sucesso!');
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value || '0');
    return `R$ ${numValue.toFixed(2)}`;
  };

  const formatPercentage = (value: string) => {
    const numValue = parseFloat(value || '0');
    return `${numValue.toFixed(2)}%`;
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Safira Cash
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/v2/manager">
                      Administrativo
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>PSP Keys</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Configuração PSP</h1>
              <p className="text-muted-foreground">
                Configure as integrações com provedores de serviços de pagamento
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Cashtime PSP Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Cashtime</CardTitle>
                      <CardDescription>
                        Provedor de serviços de pagamento
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="cashtime-active"
                        checked={config.isActive}
                        onCheckedChange={(checked) => handleConfigChange('isActive', checked)}
                      />
                      <Label htmlFor="cashtime-active" className="text-sm font-medium">
                        {config.isActive ? "Ativo" : "Inativo"}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Secret Key */}
                <div className="space-y-2">
                  <Label htmlFor="secret-key" className="text-sm font-medium">
                    Secret Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="secret-key"
                      type={showSecretKey ? "text" : "password"}
                      value={config.secretKey}
                      onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                      className="pr-10"
                      placeholder="Insira a secret key da Cashtime"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Cash In Fees */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-600">Taxas de Cash In</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cashin-fixed" className="text-sm font-medium">
                        Taxa Fixa
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          R$
                        </span>
                        <Input
                          id="cashin-fixed"
                          type="number"
                          step="0.01"
                          min="0"
                          value={config.cashinFixedFee}
                          onChange={(e) => handleConfigChange('cashinFixedFee', e.target.value)}
                          className="pl-8"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Valor: {formatCurrency(config.cashinFixedFee)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cashin-percentage" className="text-sm font-medium">
                        Taxa Percentual
                      </Label>
                      <div className="relative">
                        <Input
                          id="cashin-percentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={config.cashinPercentageFee}
                          onChange={(e) => handleConfigChange('cashinPercentageFee', e.target.value)}
                          className="pr-8"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Percentual: {formatPercentage(config.cashinPercentageFee)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      <strong>Exemplo para R$ 100,00:</strong> Taxa total = {formatCurrency(config.cashinFixedFee)} + {formatPercentage(config.cashinPercentageFee)} = {formatCurrency((parseFloat(config.cashinFixedFee) + (100 * parseFloat(config.cashinPercentageFee) / 100)).toString())}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Cash Out Fees */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-600">Taxas de Cash Out</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cashout-fixed" className="text-sm font-medium">
                        Taxa Fixa
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          R$
                        </span>
                        <Input
                          id="cashout-fixed"
                          type="number"
                          step="0.01"
                          min="0"
                          value={config.cashoutFixedFee}
                          onChange={(e) => handleConfigChange('cashoutFixedFee', e.target.value)}
                          className="pl-8"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Valor: {formatCurrency(config.cashoutFixedFee)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cashout-percentage" className="text-sm font-medium">
                        Taxa Percentual
                      </Label>
                      <div className="relative">
                        <Input
                          id="cashout-percentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={config.cashoutPercentageFee}
                          onChange={(e) => handleConfigChange('cashoutPercentageFee', e.target.value)}
                          className="pr-8"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Percentual: {formatPercentage(config.cashoutPercentageFee)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Exemplo para R$ 100,00:</strong> Taxa total = {formatCurrency(config.cashoutFixedFee)} + {formatPercentage(config.cashoutPercentageFee)} = {formatCurrency((parseFloat(config.cashoutFixedFee) + (100 * parseFloat(config.cashoutPercentageFee) / 100)).toString())}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    className="min-w-[120px]"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Salvando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Salvar Configurações
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}