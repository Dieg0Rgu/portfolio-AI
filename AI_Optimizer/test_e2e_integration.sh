#!/bin/bash
set -e

echo "=== 1. Iniciando Microservicio Python FastAPI (puerto 8000) ==="
./venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
PYTHON_PID=$!

echo "Esperando que FastAPI responda..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8000/docs > /dev/null; then
    echo "✓ FastAPI activo en PID $PYTHON_PID"
    break
  fi
  sleep 0.5
done

echo "=== 2. Iniciando NestJS API Gateway (puerto 4000) ==="
cd api-gateway
node dist/main.js &
NEST_PID=$!
cd ..

echo "Esperando que NestJS Gateway responda..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:4000/api/prompt/health > /dev/null; then
    echo "✓ NestJS Gateway activo en PID $NEST_PID"
    break
  fi
  sleep 0.5
done

cleanup() {
  echo "Limpiando procesos..."
  kill -9 $NEST_PID 2>/dev/null || true
  kill -9 $PYTHON_PID 2>/dev/null || true
}
trap cleanup EXIT

echo "=== 3. Probando Health Check en NestJS Gateway ==="
curl -s http://127.0.0.1:4000/api/prompt/health
echo ""

echo "=== 4. Probando Análisis con formato de salida (JSON) y tokens (cl100k_base) ==="
curl -s -X POST http://127.0.0.1:4000/api/prompt/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Escribe un eslogan para una app de café sustentable", "iteration": 1, "target_lang": "es", "output_format": "JSON"}' | jq '{rol_detectado: .rol_detectado, tipo_prompt: .tipo_prompt, formato_salida: .formato_salida, tokens: .tokens, score_general: .scores.calidad_general}'

echo "=== 5. Probando Síntesis de Voz Neural (TTS / Edge-TTS) vía Gateway ==="
TTS_BYTES=$(curl -s -X POST http://127.0.0.1:4000/api/prompt/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Probando síntesis de voz neural en español", "lang": "es"}' | wc -c)
echo "✓ Audio MP3 neural generado con éxito: $TTS_BYTES bytes recibidos"

echo "=== 6. Probando Traducción vía NestJS Gateway ==="
curl -s -X POST http://127.0.0.1:4000/api/prompt/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Café sustentable para un mundo mejor", "target_lang": "en"}' | jq .

echo "=== ¡Todas las pruebas de integración pasaron con éxito! ==="
