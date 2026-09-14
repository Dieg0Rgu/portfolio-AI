import os
import sys

# Asegurar que el directorio de backend esté en sys.path independientemente del CWD
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import json
import re
import time
import asyncio
import httpx
import traceback
import edge_tts
import io
from dotenv import load_dotenv

# Asegurar carga de .env desde el directorio raíz del proyecto y backend
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from schemas import (
    PromptAnalysisRequest,
    AnalysisResponse,
    TranslationRequest,
    TranslationResponse,
    TTSRequest,
)
from groq import AsyncGroq
from google import genai
from google.genai import types
import tiktoken
from deep_translator import GoogleTranslator

TOKEN_ENCODER = tiktoken.get_encoding("cl100k_base")

def calculate_token_usage(prompt_text: str, completion_text: str) -> dict:
    """Calcula el consumo de tokens usando la codificación cl100k_base."""
    input_tokens = len(TOKEN_ENCODER.encode(prompt_text))
    output_tokens = len(TOKEN_ENCODER.encode(completion_text))
    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
    }

def calculate_token_savings(input_tokens: int, output_tokens: int) -> dict:
    """Calcula el ahorro estimado de tokens, iteraciones y coste frente a un ciclo de prompt ambiguo o sin estructurar."""
    tokens_optimizados = max(1, input_tokens + output_tokens)
    # Un prompt ambiguo / sin optimizar suele requerir ~3.2 iteraciones y respuestas redundantes con relleno
    tokens_sin_optimizar = max(tokens_optimizados + 120, int((input_tokens + 650) * 3.2))
    tokens_ahorrados = max(0, tokens_sin_optimizar - tokens_optimizados)
    porcentaje = int(round((tokens_ahorrados / tokens_sin_optimizar) * 100)) if tokens_sin_optimizar > 0 else 0
    # Coste estimado $3.00 USD por 1M tokens (promedio blended de modelos de frontera)
    costo_1k = round((tokens_ahorrados * 1000 / 1_000_000) * 3.0, 4)
    return {
        "tokens_sin_optimizar_estimados": tokens_sin_optimizar,
        "tokens_optimizados": tokens_optimizados,
        "tokens_ahorrados": tokens_ahorrados,
        "porcentaje_ahorro": porcentaje,
        "costo_ahorrado_usd_1k": costo_1k,
        "iteraciones_ahorradas": 2,
    }

GROQ_MODEL = "openai/gpt-oss-20b"
GEMINI_MODEL = "gemini-3.6-flash"
MAX_GRACE_TIME = 2.5   # si Groq no responde en este lapso, se lanza el respaldo Gemini
MAX_ANALYSIS_TIME = 25.0  # deadline total del bloque cloud: nunca superar este tiempo


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


def get_gemini_api_keys() -> list[str]:
    """Devuelve todas las claves de Gemini válidas encontradas en el entorno."""
    keys: list[str] = []
    for var in ("GEMINI_API_KEYS", "GEMINI_API_KEY", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2"):
        raw = os.getenv(var)
        if not raw:
            continue
        for part in re.split(r"[,\s]+", raw):
            part = part.strip().strip('"').strip("'")
            if part and part not in keys:
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

SYSTEM_PROMPT = """Eres un experto en Prompt Engineering y lingüística aplicada para modelos de lenguaje avanzados.
Tu tarea es analizar exhaustivamente el prompt de entrada, diagnosticar sus carencias estructurales, calcular métricas de calidad y producir una versión altamente optimizada y lista para producción en formato JSON estrictamente válido.

Reglas lingüísticas y de contenido:
1. "idioma": Detecta si el prompt original está en "Español" o "Inglés".
2. "prompt_mejorado", "sugerencias" y "detalles_mejora": Deben redactarse exactamente en el MISMO idioma detectado en el prompt original.
3. "tipo_prompt": Debe ser estrictamente uno de los siguientes valores: "Zero-Shot", "Few-Shot" o "Chain-of-Thought".
4. "formato_salida": Respeta el formato solicitado o deduce el más adecuado: "Markdown", "JSON", "Texto Estructurado", "Código" o "Tabla".
5. "prompt_mejorado" NUNCA debe ser una plantilla genérica corta ni un resumen superficial. Debe ser un prompt profesional, completo y estructurado con claridad meridiana usando secciones delimitadas:
   - # ROL Y EXPERTOS: Define con precisión quién es la IA y su estándar de ejecución.
   - # CONTEXTO Y OBJETIVO: Contexto situacional y meta principal.
   - # DIRECTIVAS PASO A PASO: Instrucciones detalladas de cómo abordar la tarea.
   - # RESTRICCIONES Y CASOS BORDE: Qué evitar, límites de extensión y prohibiciones estrictas.
   - # ESQUEMA O FORMATO DE RESPUESTA: La estructura visual/sintáctica exacta en que debe responder según "formato_salida":
     * Si "formato_salida" es "Tabla": DEBES modelar explícitamente una plantilla de tabla Markdown con columnas delimitadas por pipes (| Columna 1 | Columna 2 |) y divisores (|---|---|).
     * Si "formato_salida" es "Código": DEBES ordenar la entrega en bloques de código delimitados (```lenguaje ... ```) o funciones técnicas.
     * Si "formato_salida" es "JSON": DEBES definir el esquema estricto de claves y valores JSON entre llaves { ... }.
     * Si "formato_salida" es "Texto Estructurado": DEBES estructurar la respuesta en pasos numerados secuenciales (1. 2. 3.).
     * Si "formato_salida" es "Markdown": DEBES estructurar con encabezados jerárquicos (#, ##), listas y negritas.

Estructura JSON requerida:
{
  "rol_detectado": "Rol identificado o deducido (ej. Consultor Estratégico en IA, Desarrollador Senior Fullstack)",
  "tipo_prompt": "Zero-Shot" | "Few-Shot" | "Chain-of-Thought",
  "idioma": "Español" | "Inglés",
  "formato_salida": "Markdown" | "JSON" | "Texto Estructurado" | "Código" | "Tabla",
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
  "prompt_mejorado": "Texto estructurado profesional y completo con # ROL, # CONTEXTO, # DIRECTIVAS, # RESTRICCIONES y # FORMATO",
  "sugerencias": "Recomendación estratégica sobre cómo iterar y evaluar este prompt",
  "detalles_mejora": {
    "tecnicas_aplicadas": ["Role Prompting", "Delimitadores Estructurales", "Restricción Negativa"],
    "mejoras_clave": [
      "Se asignó un rol técnico delimitado con marco de referencia.",
      "Se agregaron directivas paso a paso y criterios de validación.",
      "Se fijaron restricciones explícitas de formato y tono."
    ],
    "impacto_estimado": "Reduce divagaciones y alucinaciones en un 65%, garantizando una respuesta directa al objetivo en 1 sola iteración.",
    "proxima_accion": "Probar en entorno de ejecución con temperatura recomendada entre 0.2 y 0.4 para máxima fidelidad."
  }
}

Devuelve ÚNICAMENTE el objeto JSON plano sin delimitadores Markdown de bloque de código ni texto adicional."""

DEFAULT_FALLBACK = {
    "rol_detectado": "Especialista en Prompt Engineering",
    "tipo_prompt": "Zero-Shot",
    "idioma": "Español",
    "fallas": {
        "ambiguedad": True,
        "falta_contexto": True,
        "falta_objetivo": True,
        "falta_restricciones": True,
        "detalles": ["El prompt original carece de contexto suficiente, restricciones operativas y formato de salida delimitado."]
    },
    "scores": {
        "claridad": 45,
        "especificidad": 35,
        "objetividad": 50,
        "veracidad": 50,
        "contexto": 30,
        "coherencia": 60,
        "calidad_general": 42
    },
    "sugerencias": "Define claramente el público objetivo, el formato de salida requerido y añade restricciones negativas para evitar respuestas genéricas.",
    "detalles_mejora": {
        "tecnicas_aplicadas": ["Role Prompting", "Delimitadores Markdown", "Directivas Estructuradas", "Restricciones Negativas"],
        "mejoras_clave": [
            "Se definió un rol y marco de referencia técnico.",
            "Se incorporaron secciones claras con directivas paso a paso.",
            "Se fijó un formato de respuesta delimitado para evitar redundancia."
        ],
        "impacto_estimado": "Reduce la necesidad de repreguntas en más del 70% y maximiza la precisión en la primera llamada.",
        "proxima_accion": "Ajustar la temperatura a 0.3 e incorporar ejemplos concretos de Few-Shot si se requiere un formato rígido."
    }
}


def sanitize_and_parse_json(raw_text: str, original_prompt: str, expected_format: str = "Markdown") -> dict:
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
        "formato_salida": str(data.get("formato_salida", expected_format)),
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

    # Procesar detalles de mejora enriquecidos
    detalles_raw = data.get("detalles_mejora")
    if isinstance(detalles_raw, dict):
        tecnicas = detalles_raw.get("tecnicas_aplicadas")
        mejoras = detalles_raw.get("mejoras_clave")
        result["detalles_mejora"] = {
            "tecnicas_aplicadas": [str(x) for x in tecnicas] if isinstance(tecnicas, list) and tecnicas else DEFAULT_FALLBACK["detalles_mejora"]["tecnicas_aplicadas"],
            "mejoras_clave": [str(x) for x in mejoras] if isinstance(mejoras, list) and mejoras else DEFAULT_FALLBACK["detalles_mejora"]["mejoras_clave"],
            "impacto_estimado": str(detalles_raw.get("impacto_estimado", DEFAULT_FALLBACK["detalles_mejora"]["impacto_estimado"])),
            "proxima_accion": str(detalles_raw.get("proxima_accion", DEFAULT_FALLBACK["detalles_mejora"]["proxima_accion"])),
        }
    else:
        result["detalles_mejora"] = DEFAULT_FALLBACK["detalles_mejora"]

    return result


async def call_gemini(user_message: str, original_prompt: str) -> str | None:
    """Ejecuta la inferencia con Gemini forzando salida JSON (cliente async)."""
    keys = get_gemini_api_keys()
    if not keys:
        return None

    for idx, gemini_key in enumerate(keys):
        client = genai.Client(api_key=gemini_key)
        try:
            print(f"[NIVEL 2]: Intentando Gemini (Key #{idx + 1}, {GEMINI_MODEL})...")
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=user_message,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.2,
                        max_output_tokens=3000,
                        response_mime_type="application/json",
                    ),
                ),
                timeout=MAX_ANALYSIS_TIME,
            )
            print("[RESPALDO]: Inferencia completada con Gemini.")
            return sanitize_and_parse_json(response.text, original_prompt)
        except Exception as e:
            print(f"[AVISO]: Gemini Key #{idx + 1} falló: {type(e).__name__}: {e}")
            continue
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
                    max_tokens=4096,
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
    gemini_keys = get_gemini_api_keys()

    if not groq_keys and not gemini_keys:
        return None
    if not groq_keys:
        return await asyncio.wait_for(call_gemini(user_message, original_prompt), MAX_ANALYSIS_TIME)

    deadline = time.monotonic() + MAX_ANALYSIS_TIME
    groq_task = asyncio.create_task(call_groq(user_message, original_prompt))
    gemini_task = None

    def _start_gemini():
        nonlocal gemini_task
        if gemini_task is None and gemini_keys:
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


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_prompt(payload: PromptAnalysisRequest):
    fmt = payload.output_format or "Markdown"
    user_message = f"Prompt original a evaluar: \"{payload.prompt}\"\nIteración: {payload.iteration}\nFormato de salida esperado para el resultado: {fmt}"

    # NIVEL 1 y 2: GROQ y GEMINI en paralelo (respuesta del más rápido)
    result = await _first_success(user_message, payload.prompt)
    if result:
        result["formato_salida"] = fmt
        tokens_info = calculate_token_usage(payload.prompt, result.get("prompt_mejorado", ""))
        result["tokens"] = tokens_info
        result["ahorro"] = calculate_token_savings(tokens_info["input_tokens"], tokens_info["output_tokens"])
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
            parsed = sanitize_and_parse_json(raw_response, payload.prompt, fmt)
            parsed["formato_salida"] = fmt
            tokens_info = calculate_token_usage(payload.prompt, parsed.get("prompt_mejorado", ""))
            parsed["tokens"] = tokens_info
            parsed["ahorro"] = calculate_token_savings(tokens_info["input_tokens"], tokens_info["output_tokens"])
            return parsed
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Fallaron todos los niveles de inferencia (Groq, Gemini y Ollama): {str(e)}"
            )


@app.post("/api/translate", response_model=TranslationResponse)
async def translate_text(payload: TranslationRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="El texto a traducir no puede estar vacío.")

    # 1. Intentar con GoogleTranslator (deep-translator)
    try:
        source = payload.source_lang if payload.source_lang != "auto" else "auto"
        translated = GoogleTranslator(source=source, target=payload.target_lang).translate(text)
        if translated:
            return TranslationResponse(
                translated_text=translated,
                source_lang=payload.source_lang,
                target_lang=payload.target_lang,
            )
    except Exception as e:
        print(f"[AVISO]: GoogleTranslator falló ({type(e).__name__}: {e}), pasando a respaldo con LLM...")

    # 2. Respaldo resiliente con Groq / Gemini
    target_name = "English" if payload.target_lang == "en" else "Spanish"
    sys_trans = f"You are a professional translator. Translate the following text into {target_name}. Output ONLY the translated text without commentary."

    # Respaldo con Groq
    for key in get_groq_api_keys():
        try:
            client = AsyncGroq(api_key=key, timeout=10.0)
            res = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": sys_trans},
                    {"role": "user", "content": text}
                ],
                model=GROQ_MODEL,
                temperature=0.2,
                max_tokens=600,
            )
            trans_text = res.choices[0].message.content.strip()
            if trans_text:
                return TranslationResponse(
                    translated_text=trans_text,
                    source_lang=payload.source_lang,
                    target_lang=payload.target_lang,
                )
        except Exception as groq_err:
            print(f"[AVISO]: Traducción con Groq falló: {groq_err}")

    # Respaldo con Gemini
    for key in get_gemini_api_keys():
        try:
            client = genai.Client(api_key=key)
            res = await client.aio.models.generate_content(
                model=GEMINI_MODEL,
                contents=text,
                config=types.GenerateContentConfig(
                    system_instruction=sys_trans,
                    temperature=0.2,
                    max_output_tokens=600,
                )
            )
            trans_text = res.text.strip()
            if trans_text:
                return TranslationResponse(
                    translated_text=trans_text,
                    source_lang=payload.source_lang,
                    target_lang=payload.target_lang,
                )
        except Exception as gem_err:
            print(f"[AVISO]: Traducción con Gemini falló: {gem_err}")

    raise HTTPException(status_code=500, detail="No se pudo traducir el texto con ningún proveedor.")


@app.post("/api/tts")
async def text_to_speech(payload: TTSRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío.")

    if payload.voice:
        voice = payload.voice
    elif payload.lang == "en":
        voice = "en-US-ChristopherNeural"
    else:
        voice = "es-ES-AlvaroNeural"

    try:
        communicate = edge_tts.Communicate(text, voice)
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])

        audio_stream.seek(0)
        return Response(
            content=audio_stream.read(),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )
    except Exception as e:
        print(f"[ERROR]: edge-tts falló ({type(e).__name__}: {e})")
        raise HTTPException(status_code=500, detail=f"Error generando síntesis de voz: {str(e)}")