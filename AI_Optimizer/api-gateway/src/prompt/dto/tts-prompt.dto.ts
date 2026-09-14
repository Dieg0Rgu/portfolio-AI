import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TtsPromptDto {
  @IsString()
  @IsNotEmpty({ message: 'El texto no puede estar vacío.' })
  text: string;

  @IsString()
  @IsOptional()
  voice?: string;

  @IsString()
  @IsOptional()
  lang?: string = 'es';
}
