# app/models.py
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class StockAnalysisRequest(BaseModel):
    ticker: str = Field(..., example="QQQ")
    period: str = Field(default="6mo", example="6mo")

class StockAnalysisResponse(BaseModel):
    ticker: str
    period: str
    max_price: float
    min_price: float
    mean_price: float
    chart_paths: List[str]

class SendEmailRequest(BaseModel):
    recipient: EmailStr
    subject: str
    body_html: str
    attachments: Optional[List[str]] = []