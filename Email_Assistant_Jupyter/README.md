# Email Assistant & Financial Analysis Microservice

Asistente automatizado para análisis bursátil y distribución programada de reportes por correo electrónico.

Este proyecto evolucionó desde notebooks interactivos de Jupyter hacia una arquitectura moderna de microservicios con **FastAPI**, orquestación mediante **n8n** y despliegue contenerizado con **Docker Compose**.

---

## 🏛️ Arquitectura del Sistema

```
┌────────────────────────────────┐
│   Disparador n8n (Cron/Hook)   │
└───────────────┬────────────────┘
                │ HTTP POST /analyse
                ▼
┌────────────────────────────────────────────────────────┐
│            FastAPI Backend (:8000)                     │
│  ┌──────────────────┐        ┌──────────────────────┐  │
│  │  Yahoo Finance   │───────►│ pandas (Estadísticas)│  │
│  └──────────────────┘        └──────────┬───────────┘  │
│                                         │              │
│  ┌──────────────────┐        ┌──────────▼───────────┐  │
│  │ Matplotlib (PNG) │◄───────│  Base64 Charts Gen   │  │
│  └──────────────────┘        └──────────────────────┘  │
└───────────────────────┬────────────────────────────────┘
                        │ Retorno JSON + Gráficas Base64
                        ▼
┌────────────────────────────────────────────────────────┐
│             n8n / aiosmtplib (Envío de Correo)         │
│             Plantilla HTML + Gráficas Incrustadas      │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Tecnologías

| Capa | Tecnología | Propósito |
|---|---|---|
| **API Backend** | Python 3.12 + FastAPI | Microservicio REST asíncrono de alto rendimiento. |
| **Validación** | Pydantic v2 + Pydantic-Settings | Esquemas tipados de entrada/salida y variables de entorno. |
| **Datos Bursátiles** | yfinance + pandas | Descarga de históricos de Yahoo Finance y cálculo estadístico. |
| **Gráficos** | Matplotlib (`Agg`) | Generación no bloqueante (`asyncio.to_thread`) de gráficos en PNG/Base64. |
| **Envío de Correo** | aiosmtplib + MIME Multipart | Despacho asíncrono con imágenes incrustadas vía `cid:`. |
| **Orquestación** | n8n | Programación visual de flujos periódicos de notificación. |
| **Contenedores** | Docker & Docker Compose | Empaquetado reproducible y red interna aislada. |

---

## 📁 Estructura del Repositorio

```
Email_Assistant_Jupyter/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py            # Configuración y variables (.env) con pydantic-settings
│   │   ├── email_service.py     # Cliente SMTP asíncrono y plantillas HTML
│   │   ├── main.py              # Aplicación FastAPI, middlewares, seguridad y endpoints
│   │   ├── models.py            # Esquemas Pydantic para requests y responses
│   │   ├── stock_service.py     # Lógica financiera, pandas, yfinance y matplotlib
│   │   └── static/              # Directorio de gráficas generadas (.gitkeep)
│   └── tests/
│       ├── __init__.py
│       └── test_backend.py      # Pruebas unitarias de cálculos, esquemas y utilidades
├── Dockerfile                   # Imagen Python 3.12-slim para el microservicio
├── docker-compose.yml           # Orquestación de backend FastAPI y n8n
├── requirements.txt             # Dependencias del proyecto
├── GUIA_N8N.md                  # Manual detallado de importación y configuración en n8n
├── n8n_workflow.json            # Flujo exportado de n8n listo para importar
├── .env.example                 # Plantilla de variables de entorno requeridas
├── project2_windows.ipynb       # Notebook original (versión Windows con PyAutoGUI)
└── project2_linux.ipynb         # Notebook adaptado (versión Linux con Playwright)
```

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

| Variable | Requerido | Descripción |
|---|---|---|
| `API_KEY` | Sí | Clave requerida en el encabezado `X-API-Key` para autenticar peticiones. |
| `SMTP_HOST` | Opcional | Servidor SMTP (ej. `smtp.gmail.com`) si se usa el endpoint `/send`. |
| `SMTP_PORT` | Opcional | Puerto SMTP (por defecto `465` para SSL, `587` para STARTTLS). |
| `SMTP_USER` | Opcional | Correo remitente. |
| `SMTP_PASS` | Opcional | Contraseña de aplicación o token de autenticación. |
| `SMTP_SENDER_NAME`| Opcional | Nombre del remitente que aparece en el correo. |

---

## 🔌 Endpoints de la API

La documentación Swagger interactiva está disponible en `/docs` cuando el servidor está en ejecución.

### 1. `GET /health`
Verificación de estado y salud del microservicio.
- **Respuesta (200 OK):**
  ```json
  { "status": "ok", "version": "1.0.0" }
  ```

### 2. `POST /analyse`
Obtiene las métricas financieras (máximo, mínimo, promedio, actual) y genera las gráficas en Base64.
- **Header:** `X-API-Key: <tu_api_key>`
- **Body:**
  ```json
  {
    "ticker": "AAPL",
    "period": "6mo",
    "include_charts": true
  }
  ```
- **Respuesta (200 OK):**
  ```json
  {
    "ticker": "AAPL",
    "period": "6mo",
    "max": 242.35,
    "min": 210.12,
    "mean": 228.45,
    "current": 235.10,
    "close_chart_path": "close_AAPL.png",
    "high_chart_path": "high_AAPL.png",
    "close_chart_base64": "iVBORw0KGgo...",
    "high_chart_base64": "iVBORw0KGgo..."
  }
  ```

### 3. `POST /send`
Realiza el análisis y envía el reporte formateado en HTML por correo electrónico.
- **Header:** `X-API-Key: <tu_api_key>`
- **Body:**
  ```json
  {
    "ticker": "MSFT",
    "period": "6mo",
    "recipient": "destino@ejemplo.com",
    "subject": "Reporte Bursátil Personalizado",
    "include_charts": true
  }
  ```

---

## 🏃 Modo de Ejecución

### Opción A: Despliegue con Docker Compose (Recomendado)

Inicia tanto la API de FastAPI como la plataforma de automatización n8n en red local:

```bash
docker compose up -d
```

- **FastAPI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **n8n:** [http://localhost:5678](http://localhost:5678)

*(Consulta [`GUIA_N8N.md`](./GUIA_N8N.md) para importar el flujo preconfigurado `n8n_workflow.json`)*.

### Opción B: Ejecución Local en Terminal

```bash
# 1. Crear y activar entorno virtual
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Iniciar el servidor de desarrollo
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🧪 Pruebas Unitarias

Para ejecutar la suite de pruebas del backend:

```bash
PYTHONPATH=. python3 -m unittest discover -s backend/tests -p "test_*.py"
```
