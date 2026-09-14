from pydantic import BaseModel, Field
from typing import List, Optional

class PromptAnalysisRequest(BaseModel):
    prompt: str
    iteration: int = 1
    target_lang: Optional[str] = "es" # "es" | "en"
    output_format: Optional[str] = "Markdown" # "Markdown" | "JSON" | "Texto Estructurado" | "Código" | "Tabla"

class PromptScores(BaseModel):
    claridad: int = Field(ge=0, le=100)
    especificidad: int = Field(ge=0, le=100)
    objetividad: int = Field(ge=0, le=100)
    veracidad: int = Field(ge=0, le=100)
    contexto: int = Field(ge=0, le=100)
    coherencia: int = Field(ge=0, le=100)
    calidad_general: int = Field(ge=0, le=100)

class PromptFlaws(BaseModel):
    ambiguedad: bool
    falta_contexto: bool
    falta_objetivo: bool
    falta_restricciones: bool
    detalles: List[str]

class TokenUsage(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int

class TokenSavings(BaseModel):
    tokens_sin_optimizar_estimados: int
    tokens_optimizados: int
    tokens_ahorrados: int
    porcentaje_ahorro: int
    costo_ahorrado_usd_1k: float
    iteraciones_ahorradas: int

class PromptImprovementDetails(BaseModel):
    tecnicas_aplicadas: List[str]
    mejoras_clave: List[str]
    impacto_estimado: str
    proxima_accion: str

class AnalysisResponse(BaseModel):
    prompt_original: str
    rol_detectado: str
    tipo_prompt: str # "Zero-Shot", "Few-Shot", "Chain-of-Thought", etc.
    idioma: str
    formato_salida: Optional[str] = "Markdown"
    fallas: PromptFlaws
    scores: PromptScores
    prompt_mejorado: str
    sugerencias: str
    detalles_mejora: Optional[PromptImprovementDetails] = None
    ahorro: Optional[TokenSavings] = None
    tokens: Optional[TokenUsage] = None

class TranslationRequest(BaseModel):
    text: str
    target_lang: str = "en" # "en" | "es"
    source_lang: str = "auto"

class TranslationResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    lang: Optional[str] = "es"