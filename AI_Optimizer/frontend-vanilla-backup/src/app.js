const API_URL = "http://localhost:8000/api";

// Estado de la aplicación
let currentOriginal = "";
let currentImproved = "";
let iterationCount = 1;
let currentAudio = null;

const metrics = [
  "claridad",
  "especificidad",
  "objetividad",
  "veracidad",
  "contexto",
  "coherencia",
  "calidad_general"
];

// Nodos del DOM
const promptInput = document.getElementById("promptInput");
const btnAnalyze = document.getElementById("btnAnalyze");
const btnImprove = document.getElementById("btnImprove");
const btnAudio = document.getElementById("btnAudio");
const metricsContainer = document.getElementById("metricsContainer");
const roleBadge = document.getElementById("roleBadge");
const typeBadge = document.getElementById("typeBadge");
const langBadge = document.getElementById("langBadge");
const suggestionText = document.getElementById("suggestionText");
const historyList = document.getElementById("historyList");
const btnClearHistory = document.getElementById("btnClearHistory");

// 1. Inicializar barras de progreso
metricsContainer.innerHTML = metrics.map(m => `
  <div class="metric-bar">
    <div class="metric-header">
      <span>${m.replace('_', ' ').toUpperCase()}</span>
      <span id="val-${m}">0</span>
    </div>
    <div class="bar-track">
      <div class="bar-fill" id="bar-${m}"></div>
    </div>
  </div>
`).join("");

// 2. Control de estado de carga en la UI
function setLoading(isLoading, statusText = "Procesando...") {
  btnAnalyze.disabled = isLoading;
  btnImprove.disabled = isLoading || !currentImproved;
  btnAudio.disabled = isLoading || (!currentImproved && !currentOriginal);

  if (isLoading) {
    suggestionText.innerText = statusText;
  }
}

// 3. Ejecución de análisis contra FastAPI
async function runAnalysis(promptText, iteration) {
  setLoading(true, `Analizando prompt (Iteración ${iteration})...`);

  try {
    const res = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: promptText,
        iteration: iteration,
        target_lang: "es"
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Error del servidor (${res.status})`);
    }

    const data = await res.json();
    updateUI(data);
    saveToHistory(data);
  } catch (err) {
    alert(`Fallo en el análisis: ${err.message}`);
    suggestionText.innerText = "Ocurrió un error al procesar el análisis.";
  } finally {
    setLoading(false);
  }
}

// 4. Actualización reactiva del dashboard
function updateUI(data) {
  currentOriginal = data.prompt_original;
  currentImproved = data.prompt_mejorado;

  // Actualizar métricas visuales
  for (const metric of metrics) {
    const val = data.scores[metric] ?? 0;
    const bar = document.getElementById(`bar-${metric}`);
    const label = document.getElementById(`val-${metric}`);

    if (bar && label) {
      bar.style.width = `${Math.min(Math.max(val, 0), 100)}%`;
      label.innerText = val;
    }
  }

  // Actualizar metadatos
  roleBadge.innerHTML = `Rol detectado: <strong>${data.rol_detectado}</strong>`;
  typeBadge.innerHTML = `Tipo de prompt: <strong>${data.tipo_prompt}</strong>`;
  langBadge.innerHTML = `Idioma: <strong>${data.idioma}</strong>`;

  // Mostrar sugerencias y prompt optimizado
  suggestionText.innerHTML = `
    <strong>Sugerencia:</strong> ${data.sugerencias}<br><br>
    <strong>Prompt Optimizado:</strong> <em>"${data.prompt_mejorado}"</em>
  `;

  // Colocar el prompt mejorado en el textarea para permitir edición directa
  promptInput.value = data.prompt_mejorado;
}

// 5. Gestión del Historial (LocalStorage)
function saveToHistory(item) {
  const history = JSON.parse(localStorage.getItem("prompt_history") || "[]");
  
  // Evitar duplicar el elemento idéntico consecutivo
  const newEntry = {
    id: Date.now(),
    date: new Date().toLocaleTimeString(),
    ...item
  };

  history.unshift(newEntry);
  localStorage.setItem("prompt_history", JSON.stringify(history.slice(0, 15)));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("prompt_history") || "[]");
  
  if (btnClearHistory) {
    btnClearHistory.disabled = history.length === 0;
  }

  if (!historyList) return;

  if (history.length === 0) {
    historyList.innerHTML = `<li style="color: var(--text-muted); list-style: none;">Sin análisis previos.</li>`;
    return;
  }

  historyList.innerHTML = history.map(item => `
    <li class="history-item" data-id="${item.id}" style="cursor: pointer; margin-bottom: 0.5rem;">
      <span style="color: var(--accent-color);">[${item.date}]</span>
      <strong>${item.rol_detectado}</strong> (${item.tipo_prompt}): 
      "${item.prompt_original.substring(0, 35)}..." 
      <span style="color: var(--accent-color);">Score: ${item.scores.calidad_general}</span>
      <span style="color: var(--accent-color); margin-left: 0.5rem;">Detalles: ${Object.entries(item.scores).map(([k,v])=>`${k}:${v}`).join(', ')}</span>
    </li>
  `).join("");

  // Cargar registro al hacer clic en el historial
  historyList.querySelectorAll(".history-item").forEach(el => {
    el.addEventListener("click", () => {
      const selectedId = Number(el.dataset.id);
      const selected = history.find(h => h.id === selectedId);
      if (selected) {
        updateUI(selected);
      }
    });
  });
}

/// Función mejorada para reproducir el prompt usando el endpoint /api/tts del backend (FastTTS)
async function playTTS(text) {
  // Desactivar botón mientras se carga y reproduce
  btnAudio.disabled = true;
  btnAudio.innerText = "Reproduciendo...";

  try {
    const response = await fetch(`${API_URL}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      throw new Error(`Error al obtener audio (status ${response.status})`);
    }

    // El backend devuelve audio/mpeg, crear Blob y reproducir
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    // Restaurar UI al terminar
    audio.onended = () => {
      btnAudio.disabled = false;
      btnAudio.innerText = "Escuchar Prompt";
      URL.revokeObjectURL(audioUrl);
    };
    audio.onerror = () => {
      btnAudio.disabled = false;
      btnAudio.innerText = "Escuchar Prompt";
      alert("Error al reproducir el audio.");
      URL.revokeObjectURL(audioUrl);
    };

    audio.play();
  } catch (err) {
    btnAudio.disabled = false;
    btnAudio.innerText = "Escuchar Prompt";
    alert(err.message);
  }
}

// 7. Event Listeners
btnAnalyze.addEventListener("click", () => {
  const text = promptInput.value.trim();
  if (!text) return;
  iterationCount = 1;
  runAnalysis(text, iterationCount);
});

btnImprove.addEventListener("click", () => {
  // Tomar el texto del input por si el usuario lo editó manualmente
  const textToIterate = promptInput.value.trim() || currentImproved;
  if (!textToIterate) return;
  iterationCount++;
  runAnalysis(textToIterate, iterationCount);
});

btnAudio.addEventListener("click", () => {
  const textToRead = promptInput.value.trim() || currentImproved || currentOriginal;
  if (textToRead) {
    playTTS(textToRead);
  }
});

if (btnClearHistory) {
  btnClearHistory.addEventListener("click", () => {
    localStorage.removeItem("prompt_history");
    renderHistory();
  });
}

// Render inicial
renderHistory();