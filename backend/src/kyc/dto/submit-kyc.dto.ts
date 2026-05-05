import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class SubmitKycDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  documentFrontUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  documentBackUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  selfieUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  proofOfAddressUrl?: string;
}
