import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;
}

export class MagicLinkDto {
  @IsEmail()
  email!: string;
}

export class VerifyMagicLinkDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
