import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { serializeSeller } from '../users/seller.serializer';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  // ----------------------------------------------------------------
  // Register
  // ----------------------------------------------------------------
  async register(dto: RegisterDto) {
    // Verifica duplicidade
    const existsEmail = await this.prisma.seller.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existsEmail) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const existsDoc = await this.prisma.seller.findUnique({
      where: { cpf_cnpj: dto.cpf_cnpj },
    });
    if (existsDoc) {
      throw new ConflictException('CPF/CNPJ já cadastrado.');
    }

    const saltRounds =
      Number(this.config.get<string>('BCRYPT_SALT_ROUNDS')) || 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Cria seller + wallet + credentials + KYC numa transação atômica
    const seller = await this.prisma.$transaction(async (tx) => {
      const created = await tx.seller.create({
        data: {
          companyName: dto.companyName.trim(),
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          number: dto.number,
          cpf_cnpj: dto.cpf_cnpj,
          zipCode: dto.zipCode,
          companyModality: dto.companyModality,
          companyActivity: dto.companyActivity,
        },
      });

      await tx.wallet.create({
        data: { sellerId: created.id },
      });

      await tx.credentials.create({
        data: {
          sellerId: created.id,
          publicKey: this.generatePublicKey(),
          privateKey: this.generatePrivateKey(),
        },
      });

      await tx.kyc.create({
        data: {
          sellerId: created.id,
          status: 'NOT_STARTED',
          message: '',
        },
      });

      return tx.seller.findUnique({
        where: { id: created.id },
        include: {
          wallet: true,
          credentials: true,
          kyc: true,
        },
      });
    });

    if (!seller) {
      throw new BadRequestException('Falha ao criar conta.');
    }

    // Email de boas-vindas (não bloqueia a resposta)
    this.email.sendWelcome(seller.email, seller.companyName).catch(() => {});

    const token = this.signToken(seller.id);

    return {
      success: true,
      message: 'Conta criada com sucesso',
      data: {
        seller: serializeSeller(seller),
        token,
        message: 'Conta criada com sucesso',
      },
    };
  }

  // ----------------------------------------------------------------
  // Login
  // ----------------------------------------------------------------
  async login(dto: LoginDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        wallet: true,
        credentials: true,
        kyc: true,
      },
    });

    if (!seller) {
      // Mensagem genérica pra não vazar se o e-mail existe
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    if (seller.suspendedAt) {
      throw new UnauthorizedException('Conta suspensa. Contate o suporte.');
    }

    if (seller.deletedAt) {
      throw new UnauthorizedException('Conta inválida.');
    }

    const valid = await bcrypt.compare(dto.password, seller.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const token = this.signToken(seller.id);

    return {
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        seller: serializeSeller(seller),
        token,
        message: 'Login realizado com sucesso',
      },
    };
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  private signToken(sellerId: string): string {
    return this.jwt.sign(
      { sub: sellerId },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '7d',
      },
    );
  }

  private generatePublicKey(): string {
    return 'pk_live_' + randomBytes(24).toString('hex');
  }

  private generatePrivateKey(): string {
    return 'sk_live_' + randomBytes(32).toString('hex');
  }
}
