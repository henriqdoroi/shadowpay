import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsEnum(['PIX', 'CARD', 'BOLETO', 'CRYPTO'])
  method!: string;

  // Em centavos? Em reais? Padronize: aqui aceito reais (ex: 199.90).
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(1_000_000)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(14)
  customerCpfCnpj?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalReference?: string;
}
