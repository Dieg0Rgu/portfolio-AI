from pydantic import BaseModel, Field
from typing import List, Optional

class PromptAnalysisRequest(BaseModel):
    prompt: str
    iteration: int = 1
    target_lang: Optional[str] = "es" # "es" | "en"

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

class AnalysisResponse(BaseModel):
    prompt_original: str
    rol_detectado: str
    tipo_prompt: str # "Zero-Shot", "Few-Shot", "Chain-of-Thought", etc.
    idioma: str
    fallas: PromptFlaws
    scores: PromptScores
    prompt_mejorado: str
    sugerencias: str