# Guía de Puesta en Marcha: Backend FastAPI + n8n

Esta guía explica cómo arrancar el microservicio analítico financiero en FastAPI junto con **n8n** mediante Docker Compose, y cómo automatizar el envío de reportes por correo electrónico.

---

## 1. Estructura de la Solución

- **FastAPI (`http://localhost:8000`):** Microservicio que descarga datos de Yahoo Finance con `yfinance`, calcula estadísticas (`current`, `max`, `min`, `mean`) y genera las gráficas de evolución en formato PNG y Base64.
- **n8n (`http://localhost:5678`):** Orquestador visual que programa la ejecución (Cron / Webhook), consume el API de FastAPI y gestiona el envío de correos mediante su nodo nativo de Gmail o SMTP.
- **Red Docker interna (`assistant-net`):** Permite que n8n se comunique con el backend directamente usando `http://email_assistant:8000/analyse` sin exponer credenciales externamente.

---

## 2. Iniciar los Servicios con Docker Compose

Asegúrate de tener tu archivo `.env` configurado (puedes tomar como base `.env.example`). Luego ejecuta:

```bash
# Levantar el backend y n8n en segundo plano
docker compose up -d
```

### Verificar que los servicios están activos:
- **FastAPI Docs (Swagger UI):** Abre en tu navegador [http://localhost:8000/docs](http://localhost:8000/docs)
- **n8n Automator:** Abre en tu navegador [http://localhost:5678](http://localhost:5678)

---

## 3. Importar el Flujo en n8n

Ya dejamos creado un flujo listo para usar en el archivo [`n8n_workflow.json`](./n8n_workflow.json).

1. Abre n8n en [http://localhost:5678](http://localhost:5678).
2. Completa la configuración inicial de tu usuario en n8n.
3. En el menú superior o lateral, haz clic en **Workflows** -> **Add Workflow**.
4. Haz clic en el botón de opciones `...` (arriba a la derecha) y selecciona **Import from File**.
5. Selecciona el archivo `n8n_workflow.json` de este proyecto.

---

## 4. Descripción de los Nodos del Flujo

```
[Disparador Cron] ──► [Configuración Parámetros] ──► [HTTP Request a FastAPI] ──► [Formateador HTML] ──► [Nodo Gmail / SMTP]
```

1. **Disparador Programado:** Configurado por defecto para ejecutarse de lunes a viernes a las 18:00 (cierre del mercado bursátil). Puedes cambiarlo por un *Webhook* o disparador manual para pruebas.
2. **Configuración Parámetros:** Define la acción a consultar (ej. `AAPL`, `MSFT`, `NVDA`), el periodo (`6mo`) y el correo del destinatario.
3. **HTTP Request (`POST /analyse`):**
   - URL: `http://email_assistant:8000/analyse`
   - Encabezado: `X-API-Key: my_secure_api_key_123`
   - Envía el JSON con `{ "ticker": "AAPL", "period": "6mo", "include_charts": true }`.
4. **Formateador HTML y Datos (Code Node):**
   - Extrae los valores calculados y la gráfica en Base64 (`close_chart_base64`).
   - Construye un correo HTML moderno con tarjetas de métricas y la gráfica incrustada directamente (`data:image/png;base64,...`).
5. **Enviar Correo (Gmail / SMTP):**
   - Si usas Gmail: Conecta tu cuenta con OAuth2 en n8n con solo un clic.
   - Si usas SMTP: Añade las credenciales de tu servidor de correo.

---

## 5. Pruebas Locales del Backend sin Docker

Si deseas probar el backend directamente en tu terminal:

```bash
# Activar entorno virtual
source venv/bin/activate

# Iniciar el servidor FastAPI
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Hacer una petición de prueba con `curl`:

```bash
curl -X POST "http://localhost:8000/analyse" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: my_secure_api_key_123" \
     -d '{"ticker": "AAPL", "period": "1mo", "include_charts": true}'
```
