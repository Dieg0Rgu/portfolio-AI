import { Controller, Post, Get, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PromptService } from './prompt.service';
import { AnalyzePromptDto } from './dto/analyze-prompt.dto';
import { TranslatePromptDto } from './dto/translate-prompt.dto';
import { TtsPromptDto } from './dto/tts-prompt.dto';

@Controller('api/prompt')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzePromptDto) {
    return this.promptService.analyze(dto);
  }

  @Post('translate')
  async translate(@Body() dto: TranslatePromptDto) {
    return this.promptService.translate(dto);
  }

  @Post('tts')
  async tts(@Body() dto: TtsPromptDto, @Res() res: Response) {
    const audioBuffer = await this.promptService.tts(dto);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    res.end(audioBuffer);
  }

  @Get('health')
  async health() {
    return this.promptService.checkHealth();
  }
}
