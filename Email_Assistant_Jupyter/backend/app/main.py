"""FastAPI application exposing stock analysis and email sending endpoints.

Protects POST endpoints with an X-API-Key header validated against the configuration.
Provides CORS middleware and error handling for smooth integration with n8n and webhooks.
"""

import os
from pathlib import Path
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings, STATIC_DIR
from .models import AnalysisRequest, AnalysisResponse, EmailRequest
from .stock_service import prepare_analysis, file_to_base64
from .email_service import send_analysis_email

app = FastAPI(
    title="Email Assistant & Financial Analysis API",
    description="API para análisis de acciones financieras y automatización de correos electrónicos.",
    version="1.0.0",
)

# Enable CORS for n8n webhooks or local frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def api_key_dependency(x_api_key: str = Header(..., alias="X-API-Key")):
    """Validate incoming API Key header."""
    if not settings.API_KEY or x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key inválida o no autorizada.",
        )
    return x_api_key


@app.get("/health", tags=["Salud"])
async def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "ok", "version": "1.0.0"}


@app.post(
    "/analyse",
    response_model=AnalysisResponse,
    dependencies=[Depends(api_key_dependency)],
    tags=["Análisis Bursátil"],
    summary="Analizar acción financiera y generar gráficas",
)
async def analyse(req: AnalysisRequest):
    """Obtiene datos de yfinance, calcula estadísticas y genera gráficas en Base64."""
    try:
        stats, close_path, high_path = await prepare_analysis(req.ticker, req.period)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando el análisis: {str(e)}",
        )

    response = {
        "ticker": req.ticker.strip().upper(),
        "period": req.period,
        "max": stats["max"],
        "min": stats["min"],
        "mean": stats["mean"],
        "current": stats["current"],
        "close_chart_path": None,
        "high_chart_path": None,
        "close_chart_base64": None,
        "high_chart_base64": None,
    }

    if req.include_charts:
        response["close_chart_path"] = str(Path(close_path).name) if close_path else None
        response["high_chart_path"] = str(Path(high_path).name) if high_path else None
        response["close_chart_base64"] = file_to_base64(close_path)
        response["high_chart_base64"] = file_to_base64(high_path)

    return response


@app.post(
    "/send",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(api_key_dependency)],
    tags=["Email"],
    summary="Analizar y enviar reporte por correo electrónico",
)
async def send_email_endpoint(req: EmailRequest):
    """Ejecuta el análisis y envía el correo con las gráficas incrustadas."""
    try:
        stats, close_path, high_path = await prepare_analysis(req.ticker, req.period)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo análisis: {str(e)}",
        )

    try:
        await send_analysis_email(
            recipient=req.recipient,
            ticker=req.ticker,
            period=req.period,
            stats=stats,
            close_chart_path=close_path,
            high_chart_path=high_path if req.include_charts else None,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error enviando el correo: {str(e)}",
        )

    return JSONResponse(
        content={
            "detail": f"Correo para {req.recipient} con análisis de {req.ticker.upper()} enviado con éxito."
        }
    )
