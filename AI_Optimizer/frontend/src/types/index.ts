export interface PromptScores {
  claridad: number;
  especificidad: number;
  objetividad: number;
  veracidad: number;
  contexto: number;
  coherencia: number;
  calidad_general: number;
}

export interface PromptFlaws {
  ambiguedad: boolean;
  falta_contexto: boolean;
  falta_objetivo: boolean;
  falta_restricciones: boolean;
  detalles: string[];
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface TokenSavings {
  tokens_sin_optimizar_estimados: number;
  tokens_optimizados: number;
  tokens_ahorrados: number;
  porcentaje_ahorro: number;
  costo_ahorrado_usd_1k: number;
  iteraciones_ahorradas: number;
}

export interface PromptImprovementDetails {
  tecnicas_aplicadas: string[];
  mejoras_clave: string[];
  impacto_estimado: string;
  proxima_accion: string;
}

export interface AnalysisResponse {
  prompt_original: string;
  rol_detectado: string;
  tipo_prompt: string;
  idioma: string;
  formato_salida?: string;
  fallas: PromptFlaws;
  scores: PromptScores;
  prompt_mejorado: string;
  sugerencias: string;
  detalles_mejora?: PromptImprovementDetails;
  ahorro?: TokenSavings;
  tokens?: TokenUsage;
}

export interface HistoryItem extends AnalysisResponse {
  id: number;
  date: string;
  durationMs?: number;
}

export type Language = 'es' | 'en';
