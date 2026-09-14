import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TranslatePromptDto {
  @IsString()
  @IsNotEmpty({ message: 'El texto a traducir no puede estar vacío.' })
  text: string;

  @IsString()
  @IsNotEmpty()
  target_lang: string;

  @IsString()
  @IsOptional()
  source_lang?: string = 'auto';
}
