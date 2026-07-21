import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { MVP_DEFAULTS } from "@memopics/shared";

export class UploadFileItemDto {
  @IsString()
  @MinLength(1)
  clientFileId!: string;

  @IsString()
  contentType!: string;

  @IsInt()
  @Min(1)
  contentLength!: number;

  @IsOptional()
  @IsString()
  fileName?: string;
}

export class UploadInitDto {
  @IsString()
  @MinLength(1)
  uploadSessionId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MVP_DEFAULTS.MAX_PHOTOS_PER_BATCH)
  @ValidateNested({ each: true })
  @Type(() => UploadFileItemDto)
  files!: UploadFileItemDto[];
}

export class UploadCompleteDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaIds?: string[];
}
