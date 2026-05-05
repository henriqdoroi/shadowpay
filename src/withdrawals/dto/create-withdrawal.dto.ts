import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWithdrawalDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1_000_000)
  amount!: number;

  @IsEnum(['cpf', 'cnpj', 'email', 'phone', 'random'])
  pixKeyType!: string;

  @IsString()
  @MaxLength(140)
  pixKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  description?: string;
}
