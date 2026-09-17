"""FastAPI application exposing stock analysis and email sending endpoints.

The service expects a valid ``X-API-Key`` header for all POST operations – the
value is read from the ``.env`` file via the ``Settings`` singleton.
"""

import os
import base64

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.responses import JSONResponse

from .config import settings, STATIC_DIR

# from .models import Settings  # not needed – settings are imported from .config

from .stock_service import prepare_analysis, file_to_base64
from .email_service import send_analysis_email
from pydantic import BaseModel, EmailStr, Field

app = FastAPI(title="Email Assistant Backend", version="0.1.0")

# Simple API‑key dependency
async def api_key_dependency(x_api_key: str = Header(..., alias="X-API-Key")):
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    return x_api_key

class AnalysisRequest(BaseModel):
    ticker: str = Field(..., description="Ticker symbol, e.g. 'AAPL'")
    period: str = Field("6mo", description="Period for yfinance download, e.g. '6mo', '1y'")
    include_charts: bool = Field(True, description="Whether to generate chart images")

class AnalysisResponse(BaseModel):
    max: float
    min: float
    mean: float
    current: float
    close_chart_path: str | None = None
    high_chart_path: str | None = None
    close_chart_base64: str | None = None
    high_chart_base64: str | None = None

class EmailRequest(BaseModel):
    ticker: str
    period: str = "6mo"
    recipient: EmailStr
    subject: str | None = None
    include_charts: bool = True

@app.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "ok"}

@app.post("/analyse", response_model=AnalysisResponse, dependencies=[Depends(api_key_dependency)])
async def analyse(req: AnalysisRequest):
    stats, close_path, high_path = await prepare_analysis(req.ticker, req.period)
    response = {
        "max": stats["max"],
        "min": stats["min"],
        "mean": stats["mean"],
        "current": stats["current"],
    }
    if req.include_charts:
        response["close_chart_path"] = os.path.relpath(close_path, start=STATIC_DIR.parent)
        response["high_chart_path"] = os.path.relpath(high_path, start=STATIC_DIR.parent) if high_path else None
        # Embed base64 strings (useful for clients that cannot fetch static files)
        response["close_chart_base64"] = file_to_base64(close_path)
        response["high_chart_base64"] = file_to_base64(high_path) if high_path else None
    return response

@app.post("/send", status_code=202, dependencies=[Depends(api_key_dependency)])
async def send_email_endpoint(req: EmailRequest):
    # Re‑use analysis routine – this guarantees charts are available if requested.
    stats, close_path, high_path = await prepare_analysis(req.ticker, req.period)
    subject = req.subject or f"Análisis de acciones {req.ticker.upper()} – últimos {req.period}"
    await send_analysis_email(
        recipient=req.recipient,
        ticker=req.ticker,
        period=req.period,
        stats=stats,
        close_chart_path=close_path,
        high_chart_path=high_path if req.include_charts else "",
    )
    return JSONResponse(content={"detail": "Email queued/sent"})
