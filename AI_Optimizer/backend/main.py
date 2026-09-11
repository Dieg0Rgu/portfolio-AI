import os
import json
import re
import time
import asyncio
import httpx
import traceback
import edge_tts
import io
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from schemas import PromptAnalysisRequest, AnalysisResponse
from groq import AsyncGroq
from google import genai
from google.genai import types

GROQ_MODEL = "openai/gpt-oss-20b"
GEMINI_MODEL = "gemini-3.5-flash"
MAX_GRACE_TIME = 2.5   # si Groq no responde en este lapso, se lanza el respaldo Gemini
MAX_ANALYSIS_TIME = 12.0  # deadline total del bloque cloud: nunca superar este tiempo


def get_groq_api_keys() -> list[str]:
    """Devuelve todas las claves de Groq válidas encontradas en el entorno."""
    keys: list[str] = []
    for var in ("GROQ_API_KEYS", "GROQ_API_KEY", "GROQ_API_KEY_1", "GROQ_API_KEY_2"):
        raw = os.getenv(var)
        if not raw:
            continue
        for part in re.split(r"[,\s]+", raw):
            part = part.strip().strip('"').strip("'")
            if part.startswith("gsk_") and part not in keys:
                keys.append(part)
    return keys


app = FastAPI(title="Prompt Refiner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """Eres un experto en Prompt Engineering y lingüística aplicada.
Tu tarea es analizar el prompt de entrada, clasificarlo con precisión, detectar deficiencias estructurales y devolver una versión optimizada en formato JSON estrictamente válido.

Reglas lingüísticas y de contenido:
1. "idioma": Detecta si el prompt original está en "Español" o "Inglés".
2. "prompt_mejorado" y "sugerencias": Deben redactarse exactamente en el MISMO idioma detectado en el prompt original.
3. No sugieras cambiar de idioma si el texto original ya tiene coherencia léxica.
4. "tipo_prompt": Debe ser estrictamente uno de los siguientes valores: "Zero-Shot", "Few-Shot" o "Chain-of-Thought".

Estructura JSON requerida:
{
  "rol_detectado": "Rol identificado o deducido (ej. Redactor SEO, Desarrollador Fullstack)",
  "tipo_prompt": "Zero-Shot" | "Few-Shot" | "Chain-of-Thought",
  "idioma": "Español" | "Inglés",
  "fallas": {
    "ambiguedad": true/false,
    "falta_contexto": true/false,
    "falta_objetivo": true/false,
    "falta_restricciones": true/false,
    "detalles": ["Lista concisa de deficiencias detectadas"]
  },
  "scores": {
    "claridad": 0-100,
    "especificidad": 0-100,
    "objetividad": 0-100,
    "veracidad": 0-100,
    "contexto": 0-100,
    "coherencia": 0-100,
    "calidad_general": 0-100
  },
  "prompt_mejorado": "Versión optimizada que define un rol claro, contexto, directivas y restricciones paso a paso",
  "sugerencias": "Recomendación concisa sobre qué ajustar en la siguiente iteración"
}

Devuelve ÚNICAMENTE el objeto JSON plano sin delimitadores Markdown ni texto adicional."""

DEFAULT_FALLBACK = {
    "rol_detectado": "General",
    "tipo_prompt": "Zero-Shot",
    "idioma": "Español",
    "fallas": {
        "ambiguedad": True,
        "falta_contexto": True,
        "falta_objetivo": True,
        "falta_restricciones": True,
        "detalles": ["El prompt original carece de contexto y parámetros claros."]
    },
    "scores": {
        "claridad": 45,
        "especificidad": 35,
        "objetividad": 50,
        "veracidad": 50,
        "contexto": 30,
        "coherencia": 60,
        "calidad_general": 40
    },
    "sugerencias": "Define claramente el público objetivo, el formato de salida y el tono deseado."
}


def sanitize_and_parse_json(raw_text: str, original_prompt: str) -> dict:
    """Extrae el primer bloque JSON delimitado por llaves, sanea los tipos y completa campos ausentes."""
    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    clean_text = match.group(0) if match else raw_text

    try:
        data = json.loads(clean_text)
    except json.JSONDecodeError:
        data = {}

    result = {
        "prompt_original": original_prompt,
        "rol_detectado": str(data.get("rol_detectado", DEFAULT_FALLBACK["rol_detectado"])),
        "tipo_prompt": str(data.get("tipo_prompt", DEFAULT_FALLBACK["tipo_prompt"])),
        "idioma": str(data.get("idioma", DEFAULT_FALLBACK["idioma"])),
        "fallas": data.get("fallas") if isinstance(data.get("fallas"), dict) else DEFAULT_FALLBACK["fallas"],
        "scores": data.get("scores") if isinstance(data.get("scores"), dict) else DEFAULT_FALLBACK["scores"],
        "prompt_mejorado": str(
            data.get(
                "prompt_mejorado",
                f"Actúa como un experto. Elabora una respuesta técnica, estructurada y persuasiva sobre: {original_prompt}"
            )
        ),
        "sugerencias": str(data.get("sugerencias", DEFAULT_FALLBACK["sugerencias"]))
    }

    # Validación estricta de subcampos requeridos en fallas
    expected_flaws = ["ambiguedad", "falta_contexto", "falta_objetivo", "falta_restricciones"]
    for flaw in expected_flaws:
        if not isinstance(result["fallas"].get(flaw), bool):
            result["fallas"][flaw] = DEFAULT_FALLBACK["fallas"][flaw]

    if not isinstance(result["fallas"].get("detalles"), list):
        result["fallas"]["detalles"] = DEFAULT_FALLBACK["fallas"]["detalles"]

    # Validación y clamp (0-100) en todos los scores requeridos
    expected_scores = ["claridad", "especificidad", "objetividad", "veracidad", "contexto", "coherencia", "calidad_general"]
    for key in expected_scores:
        val = result["scores"].get(key)
        if isinstance(val, (int, float)):
            result["scores"][key] = max(0, min(100, int(val)))
        else:
            result["scores"][key] = DEFAULT_FALLBACK["scores"][key]

    return result


async def call_gemini(user_message: str, original_prompt: str) -> str | None:
    """Ejecuta la inferencia con Gemini forzando salida JSON (cliente async)."""
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY_1")
    if not gemini_key:
        return None

    gemini_key = gemini_key.strip().strip('"').strip("'")
    client = genai.Client(api_key=gemini_key)

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=GEMINI_MODEL,
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.2,
                    response_mime_type="application/json",
                ),
            ),
            timeout=MAX_ANALYSIS_TIME,
        )
        print("[RESPALDO]: Inferencia completada con Gemini.")
        return sanitize_and_parse_json(response.text, original_prompt)
    except Exception as e:
        print(f"[AVISO]: Gemini falló: {type(e).__name__}: {e}")
        return None


def _retry_seconds(err: Exception) -> float:
    """Extrae el tiempo 'try again in Xs' que envía Groq en un RateLimitError (429)."""
    text = str(err)
    match = re.search(r"try again in\s+([\d.]+)s", text)
    if match:
        return min(float(match.group(1)), MAX_ANALYSIS_TIME)
    return 0.0


async def call_groq(user_message: str, original_prompt: str) -> str | None:
    """Itera sobre las claves de Groq con reintento acotado ante 429 (rate limit)."""
    for idx, key in enumerate(get_groq_api_keys()):
        client = AsyncGroq(api_key=key, timeout=MAX_ANALYSIS_TIME, max_retries=0)
        for attempt in range(2):  # máx. 2 intentos por clave (1 si fue 429 con retry_after)
            try:
                print(f"[NIVEL 1]: Intentando Groq (Key #{idx + 1}, {GROQ_MODEL}, intento {attempt + 1})...")
                chat_completion = await client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_message}
                    ],
                    model=GROQ_MODEL,
                    temperature=0.2,
                    max_tokens=900,
                    response_format={"type": "json_object"}
                )
                raw_response = chat_completion.choices[0].message.content
                result = sanitize_and_parse_json(raw_response, original_prompt)
                if result:
                    print("[EXITO]: Inferencia completada con Groq.")
                    return result
                print("[AVISO]: Groq devolvió JSON vacío.")
            except asyncio.CancelledError:
                print("[AVISO]: Groq cancelado por carrera con otro proveedor (respuesta más rápida).")
                raise
            except Exception as e:
                wait = _retry_seconds(e)
                if wait > 0 and attempt == 0:
                    print(f"[AVISO]: Límite de Groq alcanzado, reintentando en {wait:.1f}s...")
                    await asyncio.sleep(wait)
                    continue
                print(f"[AVISO]: Groq Key #{idx + 1} falló: {type(e).__name__}: {str(e)[:160]}")
                break
    return None


async def _first_success(user_message: str, original_prompt: str) -> str | None:
    """Responde en el menor tiempo posible: Groq primero (ultrarrápido).

    Gemini solo se lanza como respaldo si Groq no respondió en MAX_GRACE_TIME,
    evitando gastar tokens de Gemini en cada análisis. Un deadline común
    (MAX_ANALYSIS_TIME) impide que los fallbacks sumen latencia.
    """
    groq_keys = get_groq_api_keys()
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY_1")

    if not groq_keys and not gemini_key:
        return None
    if not groq_keys:
        return await asyncio.wait_for(call_gemini(user_message, original_prompt), MAX_ANALYSIS_TIME)

    deadline = time.monotonic() + MAX_ANALYSIS_TIME
    groq_task = asyncio.create_task(call_groq(user_message, original_prompt))
    gemini_task = None

    def _start_gemini():
        nonlocal gemini_task
        if gemini_task is None and gemini_key:
            gemini_task = asyncio.create_task(call_gemini(user_message, original_prompt))

    tasks = [groq_task]
    try:
        # Fase 1: ventana de gracia para Groq (no despertar Gemini si no hace falta)
        done, pending = await asyncio.wait(
            tasks, timeout=min(MAX_GRACE_TIME, max(0, deadline - time.monotonic())),
            return_when=asyncio.FIRST_COMPLETED,
        )
        if done:
            try:
                if gr := groq_task.result():
                    return gr
            except Exception:
                pass

        # Fase 2: con Gemini activo, esperar el primer proveedor exitoso
        _start_gemini()
        tasks = list(pending)
        if gemini_task:
            tasks.append(gemini_task)

        while tasks:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                break
            done, pending = await asyncio.wait(tasks, timeout=remaining, return_when=asyncio.FIRST_COMPLETED)
            for t in done:
                try:
                    result = t.result()
                except Exception:
                    continue
                if result:
                    return result
            tasks = list(pending)
    finally:
        for t in ([groq_task] + ([gemini_task] if gemini_task else [])):
            if not t.done():
                t.cancel()
    return None


@ app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_prompt(payload: PromptAnalysisRequest):
    user_message = f"Prompt original a evaluar: \"{payload.prompt}\"\nIteración: {payload.iteration}"

    # NIVEL 1 y 2: GROQ y GEMINI en paralelo (respuesta del más rápido)
    result = await _first_success(user_message, payload.prompt)
    if result:
        return result

    # NIVEL 3: OLLAMA LOCAL (respaldo offline, solo si no hay clave ni fallo de camino)
    print("\n[NIVEL 3]: Todos los servicios en la nube fallaron. Pasando a Ollama local...")
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/api/chat")
    model_name = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            res = await client.post(
                ollama_url,
                json={
                    "model": model_name,
                    "keep_alive": -1,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_message}
                    ],
                    "format": "json",
                    "stream": False,
                    "options": {
                        "temperature": 0.2,
                        "num_predict": 350
                    }
                }
            )
            res.raise_for_status()
            raw_response = res.json().get("message", {}).get("content", "")
            print("[EXITO]: Inferencia completada con Ollama local.")
            return sanitize_and_parse_json(raw_response, payload.prompt)
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Fallaron todos los niveles de inferencia (Groq, Gemini y Ollama): {str(e)}"
            )




@app.post("/api/tts")
async def text_to_speech(data: dict):
    text = data.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío.")

    # Voz neural natural en español (ej. es-ES-AlvaroNeural o es-MX-DaliaNeural)
    voice = "es-ES-AlvaroNeural"
    communicate = edge_tts.Communicate(text, voice)

    audio_stream = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])

    audio_stream.seek(0)
    return Response(content=audio_stream.read(), media_type="audio/mpeg")