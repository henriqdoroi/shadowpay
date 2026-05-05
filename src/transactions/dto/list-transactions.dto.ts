import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListTransactionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsEnum(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CHARGEBACK', 'EXPIRED'])
  status?: string;

  @IsOptional()
  @IsEnum(['PIX', 'CARD', 'BOLETO', 'CRYPTO'])
  method?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
