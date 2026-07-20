import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateGuestSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;
}
