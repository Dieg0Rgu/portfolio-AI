import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class AnalyzePromptDto {
  @IsString()
  @IsNotEmpty({ message: 'El prompt no puede estar vacío.' })
  prompt: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  iteration?: number = 1;

  @IsString()
  @IsOptional()
  target_lang?: string = 'es';

  @IsString()
  @IsOptional()
  output_format?: string = 'Markdown';
}
