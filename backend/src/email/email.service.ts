/**
 * EmailService — wrapper sobre Resend.
 *
 * Configurado por env:
 *   RESEND_API_KEY="re_..."        (sem ele, send() loga e ignora)
 *   EMAIL_FROM="ShadowPay <no-reply@shadowpay.com.br>"
 *
 * Nunca quebra a request — falha de envio só loga.
 *
 * Templates ficam inline aqui; pra deck visual no futuro, troca por
 * react-email ou similar.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger('Email');
  private resend: any | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>('EMAIL_FROM') || 'ShadowPay <no-reply@shadowpay.app>';
    const apiKey = config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      // Lazy import — evita carregar SDK quando não tem env
      try {
        const { Resend } = require('resend');
        this.resend = new Resend(apiKey);
      } catch (e) {
        this.logger.warn(`Resend não pôde ser instanciado: ${(e as Error).message}`);
      }
    }
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  async send({ to, subject, html, text }: SendArgs): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `Email pulado (RESEND_API_KEY ausente): to=${to} subject=${subject}`,
      );
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html, text });
    } catch (e) {
      this.logger.error(`Falha ao enviar email pra ${to}: ${(e as Error).message}`);
    }
  }

  // ------------------------------------------------------------------
  // Templates
  // ------------------------------------------------------------------

  async sendWelcome(to: string, companyName: string) {
    await this.send({
      to,
      subject: 'Bem-vindo à ShadowPay',
      html: shell(
        `<h1>Olá, ${escape(companyName)}!</h1>
         <p>Sua conta foi criada com sucesso. O próximo passo é concluir o
         <strong>KYC</strong> pra começar a operar.</p>
         <p>Qualquer dúvida, estamos por aqui.</p>`,
      ),
    });
  }

  async sendKycApproved(to: string, companyName: string) {
    await this.send({
      to,
      subject: 'KYC aprovado — sua conta está liberada',
      html: shell(
        `<h1>KYC aprovado, ${escape(companyName)}!</h1>
         <p>Sua conta está totalmente liberada pra processar pagamentos PIX.</p>`,
      ),
    });
  }

  async sendKycRejected(to: string, companyName: string, reason: string) {
    await this.send({
      to,
      subject: 'KYC pendente — ação necessária',
      html: shell(
        `<h1>KYC pendente, ${escape(companyName)}</h1>
         <p>Precisamos que você reenvie alguns documentos:</p>
         <p><em>${escape(reason)}</em></p>
         <p>Acesse o painel pra atualizar.</p>`,
      ),
    });
  }

  async sendWithdrawalPaid(to: string, amount: number, companyName: string) {
    await this.send({
      to,
      subject: `Saque pago: R$ ${amount.toFixed(2)}`,
      html: shell(
        `<h1>Saque concluído</h1>
         <p>Olá, ${escape(companyName)}. Seu saque de
         <strong>R$ ${amount.toFixed(2)}</strong> foi creditado na sua conta.</p>`,
      ),
    });
  }

  async sendPasswordChanged(to: string, ip: string | null) {
    await this.send({
      to,
      subject: 'Sua senha foi alterada',
      html: shell(
        `<h1>Senha alterada</h1>
         <p>A senha da sua conta ShadowPay foi alterada${
           ip ? ` (IP ${escape(ip)})` : ''
         }.</p>
         <p>Se não foi você, redefina a senha imediatamente e contate o suporte.</p>`,
      ),
    });
  }
}

function shell(content: string): string {
  return `<div style="font-family:system-ui,Segoe UI,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:24px;">${content}<p style="color:#888;font-size:12px;margin-top:32px;">— ShadowPay</p></div>`;
}

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[c];
  });
}
