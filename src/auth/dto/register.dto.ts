import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

/**
 * Espelha o `RegisterData` do frontend (AuthContext.tsx).
 */
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  companyName!: string;

  @IsEmail()
  @MaxLength(180)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'A senha precisa de pelo menos 8 caracteres' })
  @MaxLength(120)
  password!: string;

  @IsString()
  @Matches(/^\d{11}$|^\d{14}$/, {
    message: 'cpf_cnpj deve conter apenas dígitos (11 para CPF ou 14 para CNPJ)',
  })
  cpf_cnpj!: string;

  @IsString()
  @MaxLength(20)
  number!: string;

  @IsString()
  @MaxLength(10)
  zipCode!: string;

  @IsString()
  @MaxLength(60)
  companyModality!: string;

  @IsString()
  @MaxLength(120)
  companyActivity!: string;
}
