# AI Optimizer – README

## Overview
AI Optimizer is a lightweight web‑based console that helps you **analyse, improve and vocalise prompts** for large language models. 
- The backend (Python FastAPI) receives a prompt, runs a multi‑stage inference pipeline (Groq → Gemini → Ollama fallback) and returns a structured JSON with role detection, prompt type, language, flaw flags, a set of quality scores and an optimized prompt.
- The frontend (Next.js + React‑compatible vanilla JS) displays the results as a responsive dashboard, stores each analysis in **Local Storage** (last 15 entries) and lets you listen to the prompt via **Fast‑TTS** (edge‑tts). 

## Technologies

| Layer | Tech | Role |
|------|------|------|
| **Backend** | Python 3.12 | Language runtime |
| | FastAPI ≥0.110 | Web framework / async API |
| | uvicorn ≥0.28 | ASGI server |
| | pydantic ≥2.6 | Data validation & models |
| | httpx ≥0.27 | Async HTTP client (used for Ollama) |
| | **Groq SDK** ≥0.11 | Primary LLM provider (fastest) |
| | **Google‑GenAI SDK** ≥1.0 | Backup LLM provider (Gemini) |
| | **edge‑tts** ≥6.1.12 | Server‑side text‑to‑speech (FastTTS) |
| | tiktoken ≥0.7 | Token counting for scoring |
| | deep‑translator ≥1.11 | Optional multilingual translation |
| **Frontend** | Node ≥20 | Runtime for tooling |
| | Next.js 14.x | React‑based framework (pages, routing) |
| | React 18.x + React‑DOM | UI library |
| | TypeScript 5.x | Static typing for source files |
| | Tailwind 3.x + PostCSS | Utility‑first CSS framework |
| | lucide‑react | Icon set |
| | sweetalert2 | User‑friendly alerts |
| | autoprefixer | CSS vendor‑prefixing |
| **API‑Gateway** (NestJS) | TypeScript | Thin proxy exposing the same FastAPI endpoints (`/api/analyze`, `/api/translate`, `/api/tts`) |
| | class‑validator | DTO validation |
| | axios | HTTP client for gateway → microservice |

## Repository Structure

```
AI_Optimizer/
├─ backend/               # Python microservice
│   ├─ main.py            # FastAPI app, inference pipeline
│   ├─ schemas.py         # Pydantic request/response models
│   ├─ requirements.txt
│   └─ test_*.py          # Unit/E2E tests
├─ api-gateway/           # NestJS gateway (optional)
│   └─ src/prompt/…       # Controllers, services, DTOs
├─ frontend/              # Next.js front‑end
│   ├─ src/app.js         # Vanilla JS UI logic (metrics, history, TTS)
│   ├─ src/styles.css
│   ├─ package.json
│   └─ tsconfig.json
└─ .env                   # Environment variables (API keys, ports)
```

## Setup & Scripts

### Prerequisites
- **Python 3.12+** (venv recommended)
- **Node 20+** and **npm**
- API keys for the LLM providers (Groq, Gemini) placed in `.env`:

```dotenv
GROQ_API_KEYS=sk-XXXXX,sk-YYYYY
GEMINI_API_KEY=AIzaSy…
```

### Backend

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate   # on Windows: venv\Scripts\activate

# Install deps
pip install -r backend/requirements.txt

# Run the FastAPI service (default port 8000)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Optional (run the test suite):**

```bash
pytest backend/    # requires pytest (included in dev deps)
./test_e2e_integration.sh
```

### Frontend

```bash
cd frontend
npm install               # installs next, react, tailwind, etc.
npm run dev               # starts Next dev server on http://localhost:3000
```

**Production build**:

```bash
npm run build   # creates .next
npm start       # serves the compiled app
```

### API‑Gateway (if you prefer to use the NestJS proxy)

```bash
cd api-gateway
npm install
npm run start:dev   # proxies to the FastAPI microservice
```

## Core Workflow (Console UI)

1. **Enter a prompt** in the textarea.
2. Click **“Analizar Prompt”** – the frontend POSTs to `/api/analyze`.
3. The backend runs the inference pipeline and returns:
   - Detected role, prompt type, language
   - `fallas` (boolean flags for ambiguity, missing context/objective, etc.)
   - **Scores** (`claridad`, `especificidad`, `objetividad`, `veracidad`, `contexto`, `coherencia`, `calidad_general`) – each 0‑100.
   - Optimized prompt and short suggestions.
4. The UI updates **metric bars** and badge rows, populates the **Suggestion** box, and **stores** the whole response in **Local Storage** (`prompt_history`). Only the 15 most recent entries are kept.
5. **Iterate** – edit the optimized prompt (or keep it) and press **“Seguir Mejorando”** to start a new analysis (iteration counter increments).
6. **Listen** – click **“Escuchar Prompt”**. The client sends the text to `/api/tts`; the backend uses `edge‑tts` to synthesize speech (Spanish / English voices) and streams an MP3 back. The frontend plays it via an `Audio` element, disabling the button during playback.
7. **History** – recent analyses appear below the console. Clicking an entry loads that result back into the UI for quick reference.

### Scoring Explained

| Metric | Meaning |
|--------|---------|
| **claridad** | How clearly the prompt communicates its goal. |
| **especificidad** | Level of detail / concrete instructions. |
| **objetividad** | Absence of subjective bias that could mislead the model. |
| **veracidad** | Truthfulness of any factual claims in the prompt. |
| **contexto** | Presence of necessary background information. |
| **coherencia** | Logical flow and internal consistency. |
| **calidad_general** | Weighted aggregate – the primary “overall” score shown in the history list. |

Higher scores indicate a **well‑crafted**, consistent prompt; lower scores flag areas to improve (e.g., missing context → low `contexto`). The back‑end computes these values from the LLM’s self‑assessment and from token‑usage heuristics (see `PromptScores` in `backend/schemas.py`).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEYS` | Yes (or `GROQ_API_KEY`) | Comma‑separated Groq API keys (auto‑rotated by the backend). |
| `GEMINI_API_KEY` | Optional | Google Gemini API key (fallback when Groq is throttled). |
| `OLLAMA_BASE_URL` | Optional | URL of a local Ollama server (fallback when cloud providers fail). |
| `OLLAMA_MODEL` | Optional | Model name for Ollama (default `qwen2.5:3b`). |
| `AI_SERVICE_URL` | Optional (gateway) | Base URL the NestJS gateway uses to reach the FastAPI microservice (default `http://127.0.0.1:8000`). |

## Development Tips

- **Hot‑reloading**: `uvicorn --reload` for backend, `npm run dev` for frontend.
- **Debugging TTS**: Open the Network tab; the `/api/tts` request returns a binary `audio/mpeg` payload – verify the `Content-Type` header and that the response body has non‑zero length.
- **Extending Scores**: Add new fields to `PromptScores` (Python) and to the corresponding TypeScript interfaces in `api‑gateway/src/prompt/dto/...` if you need extra metrics. Remember to update `frontend/src/app.js` to render them.
- **Running the gateway**: The gateway forwards all `/api/*` routes to the Python service, handling DTO validation and returning raw bytes for TTS (`responseType: 'arraybuffer'`).

## License

This project is open‑source and provided **as‑is**. Feel free to fork, adapt, and contribute improvements.

---

**Quick Start (one‑liner)**

```bash
# Backend
python -m venv venv && source venv/bin/activate && pip install -r backend/requirements.txt && uvicorn backend.main:app --reload &

# Frontend
cd frontend && npm install && npm run dev
```

Open `http://localhost:3000` and start analysing prompts!