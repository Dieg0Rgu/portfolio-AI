// AI Optimizer - Vanilla / Module UI Logic
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

// Nodos del DOM (inicializados de forma segura)
let promptInput = null;
let btnAnalyze = null;
let btnImprove = null;
let btnAudio = null;
let metricsContainer = null;
let roleBadge = null;
let typeBadge = null;
let langBadge = null;
let suggestionText = null;
let historyList = null;
let btnClearHistory = null;

function initDom() {
  if (typeof document === "undefined") return;

  promptInput = document.getElementById("promptInput");
  btnAnalyze = document.getElementById("btnAnalyze");
  btnImprove = document.getElementById("btnImprove");
  btnAudio = document.getElementById("btnAudio");
  metricsContainer = document.getElementById("metricsContainer");
  roleBadge = document.getElementById("roleBadge");
  typeBadge = document.getElementById("typeBadge");
  langBadge = document.getElementById("langBadge");
  suggestionText = document.getElementById("suggestionText");
  historyList = document.getElementById("historyList");
  btnClearHistory = document.getElementById("btnClearHistory");

  if (metricsContainer) {
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
  }

  if (btnAnalyze && promptInput) {
    btnAnalyze.addEventListener("click", () => {
      const text = promptInput.value.trim();
      if (!text) return;
      iterationCount = 1;
      runAnalysis(text, iterationCount);
    });
  }

  if (btnImprove && promptInput) {
    btnImprove.addEventListener("click", () => {
      const textToIterate = promptInput.value.trim() || currentImproved;
      if (!textToIterate) return;
      iterationCount++;
      runAnalysis(textToIterate, iterationCount);
    });
  }

  if (btnAudio && promptInput) {
    btnAudio.addEventListener("click", () => {
      const textToRead = promptInput.value.trim() || currentImproved || currentOriginal;
      if (textToRead) {
        playTTS(textToRead);
      }
    });
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener("click", () => {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("prompt_history");
      }
      renderHistory();
    });
  }

  renderHistory();
}

// 2. Control de estado de carga en la UI
function setLoading(isLoading, statusText = "Procesando...") {
  if (btnAnalyze) btnAnalyze.disabled = isLoading;
  if (btnImprove) btnImprove.disabled = isLoading || !currentImproved;
  if (btnAudio) btnAudio.disabled = isLoading || (!currentImproved && !currentOriginal);

  if (isLoading && suggestionText) {
    suggestionText.innerText = statusText;
  }
}

// 3. Ejecución de análisis contra FastAPI
async function runAnalysis(promptText, iteration) {
  setLoading(true, `Analizando prompt (Iteración ${iteration})...`);

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText, formato_salida: "Markdown" })
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.statusText}`);
    }

    const data = await response.json();
    currentOriginal = data.prompt_original;
    currentImproved = data.prompt_mejorado;

    updateUI(data);
    saveToHistory(data);
  } catch (error) {
    console.error("Error al procesar:", error);
    if (suggestionText) {
      suggestionText.innerText = `Error: ${error.message}. Asegúrate de que el backend está corriendo en ${API_URL}.`;
    }
  } finally {
    setLoading(false);
  }
}

// 4. Actualización de la interfaz
function updateUI(data) {
  if (roleBadge) roleBadge.innerText = `Rol: ${data.rol_detectado}`;
  if (typeBadge) typeBadge.innerText = `Tipo: ${data.tipo_prompt}`;
  if (langBadge) langBadge.innerText = `Idioma: ${data.idioma}`;

  // Actualizar métricas
  if (data.scores) {
    metrics.forEach(m => {
      const val = data.scores[m] || 0;
      const valEl = document.getElementById(`val-${m}`);
      const barEl = document.getElementById(`bar-${m}`);
      if (valEl) valEl.innerText = val;
      if (barEl) barEl.style.width = `${val * 10}%`;
    });
  }

  // Actualizar sugerencias y prompt optimizado
  let content = `<strong>Sugerencias:</strong><br>${data.sugerencias.replace(/\n/g, '<br>')}`;
  if (data.prompt_mejorado) {
    content += `<br><br><strong>Prompt Optimizado:</strong><br><pre style="white-space: pre-wrap; font-family: monospace; color: var(--accent-mint); background: #080e10; padding: 0.5rem; border-radius: 4px;">${data.prompt_mejorado}</pre>`;
  }
  if (suggestionText) suggestionText.innerHTML = content;

  if (promptInput) {
    promptInput.value = data.prompt_mejorado || data.prompt_original;
  }
  if (btnImprove) btnImprove.disabled = false;
  if (btnAudio) btnAudio.disabled = false;
}

// 5. Historial en LocalStorage
function saveToHistory(data) {
  if (typeof localStorage === "undefined") return;
  const history = JSON.parse(localStorage.getItem("prompt_history") || "[]");
  const newEntry = {
    id: Date.now(),
    date: new Date().toLocaleTimeString(),
    ...data
  };
  history.unshift(newEntry);
  localStorage.setItem("prompt_history", JSON.stringify(history.slice(0, 10)));
  renderHistory();
}

function renderHistory() {
  if (!historyList || typeof localStorage === "undefined") return;
  const history = JSON.parse(localStorage.getItem("prompt_history") || "[]");
  if (history.length === 0) {
    historyList.innerHTML = `<li style="color: var(--text-muted); font-size: 0.8rem;">Sin historial reciente.</li>`;
    return;
  }

  historyList.innerHTML = history.map(item => `
    <li class="history-item" data-id="${item.id}" style="cursor: pointer; margin-bottom: 0.5rem;">
      <span style="color: var(--accent-mint);">[${item.date}]</span>
      <strong>${item.rol_detectado}</strong> (${item.tipo_prompt}): 
      "${item.prompt_original.substring(0, 35)}..." 
      <span style="color: var(--accent-mint);">Score: ${item.scores ? item.scores.calidad_general : '-'}</span>
    </li>
  `).join("");

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

// 6. Reproducción de audio TTS
async function playTTS(text) {
  if (btnAudio) {
    btnAudio.disabled = true;
    btnAudio.innerText = "Reproduciendo...";
  }

  try {
    const response = await fetch(`${API_URL}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      throw new Error(`Error al obtener audio (status ${response.status})`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      if (btnAudio) {
        btnAudio.disabled = false;
        btnAudio.innerText = "Escuchar Prompt";
      }
      URL.revokeObjectURL(audioUrl);
    };
    audio.onerror = () => {
      if (btnAudio) {
        btnAudio.disabled = false;
        btnAudio.innerText = "Escuchar Prompt";
      }
      URL.revokeObjectURL(audioUrl);
    };

    audio.play();
  } catch (err) {
    if (btnAudio) {
      btnAudio.disabled = false;
      btnAudio.innerText = "Escuchar Prompt";
    }
    console.error("Error TTS:", err);
  }
}

// Inicialización automática si el DOM está cargado
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDom);
  } else {
    initDom();
  }
}

// Exportación como módulo ES
export {
  runAnalysis,
  updateUI,
  setLoading,
  saveToHistory,
  renderHistory,
  playTTS,
  initDom
};