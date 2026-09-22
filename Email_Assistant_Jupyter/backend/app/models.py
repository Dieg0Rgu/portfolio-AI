"""Pydantic schemas for request and response validation."""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class AnalysisRequest(BaseModel):
    ticker: str = Field(..., description="Símbolo de la acción, ej. 'AAPL', 'MSFT', 'NVDA'")
    period: str = Field("6mo", description="Periodo de consulta en yfinance, ej. '1mo', '3mo', '6mo', '1y'")
    include_charts: bool = Field(True, description="Si es True, genera y devuelve las imágenes de las gráficas")

class AnalysisResponse(BaseModel):
    ticker: str
    period: str
    max: float
    min: float
    mean: float
    current: float
    close_chart_path: Optional[str] = None
    high_chart_path: Optional[str] = None
    close_chart_base64: Optional[str] = None
    high_chart_base64: Optional[str] = None

class EmailRequest(BaseModel):
    ticker: str
    period: str = "6mo"
    recipient: EmailStr
    subject: Optional[str] = None
    include_charts: bool = True
