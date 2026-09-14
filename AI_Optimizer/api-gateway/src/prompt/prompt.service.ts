import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { AnalyzePromptDto } from './dto/analyze-prompt.dto';
import { TranslatePromptDto } from './dto/translate-prompt.dto';
import { TtsPromptDto } from './dto/tts-prompt.dto';

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly aiClient: AxiosInstance;

  constructor() {
    const aiBaseUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
    this.aiClient = axios.create({
      baseURL: aiBaseUrl,
      timeout: 30000,
    });
    this.logger.log(`PromptService configurado apuntando a AI Microservice en: ${aiBaseUrl}`);
  }

  async analyze(dto: AnalyzePromptDto) {
    try {
      this.logger.log(`Enviando prompt a analizar (Iteración ${dto.iteration || 1})...`);
      const response = await this.aiClient.post('/api/analyze', {
        prompt: dto.prompt,
        iteration: dto.iteration ?? 1,
        target_lang: dto.target_lang ?? 'es',
        output_format: dto.output_format ?? 'Markdown',
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error en análisis de IA: ${error.message}`);
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data?.detail || error.message || 'Error comunicando con microservicio de IA';
      throw new HttpException(message, status);
    }
  }

  async translate(dto: TranslatePromptDto) {
    try {
      this.logger.log(`Traduciendo texto a ${dto.target_lang}...`);
      const response = await this.aiClient.post('/api/translate', {
        text: dto.text,
        target_lang: dto.target_lang,
        source_lang: dto.source_lang ?? 'auto',
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error en traducción: ${error.message}`);
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data?.detail || error.message || 'Error en microservicio de traducción';
      throw new HttpException(message, status);
    }
  }

  async tts(dto: TtsPromptDto) {
    try {
      this.logger.log(`Generando audio TTS con voz: ${dto.voice || 'auto'} e idioma: ${dto.lang || 'es'}...`);
      const response = await this.aiClient.post('/api/tts', {
        text: dto.text,
        voice: dto.voice,
        lang: dto.lang ?? 'es',
      }, {
        responseType: 'arraybuffer',
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error en TTS: ${error.message}`);
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException('Error generando síntesis de voz', status);
    }
  }

  async checkHealth() {
    try {
      // Intentar ping al microservicio
      const res = await this.aiClient.get('/docs', { timeout: 3000 });
      return {
        gateway: 'UP',
        ai_microservice: res.status === 200 ? 'UP' : 'DEGRADED',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        gateway: 'UP',
        ai_microservice: 'DOWN',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
