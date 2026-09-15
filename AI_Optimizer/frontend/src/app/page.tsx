"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileCode,
  FileText,
  Table,
  ListOrdered,
  Code2,
} from "lucide-react";
import {
  AnalysisResponse,
  HistoryItem,
  Language,
  OutputFormat,
  ViewMode,
  OutputFormatOption,
} from "@/types";
import { translations, showToast, confirmAction, showErrorAlert } from "@/lib";
import {
  Header,
  PromptInputCard,
  SavingsCard,
  MetricsCard,
  ResultCard,
  ImprovementDetailsCard,
  HistoryCard,
} from "@/components";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:4000/api/prompt";
const DIRECT_AI_URL = "http://localhost:8000/api";

export default function BentoDashboard() {
  const [lang, setLang] = useState<Language>("es");
  const [promptInput, setPromptInput] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("Markdown");
  const [viewMode, setViewMode] = useState<ViewMode>("formatted");
  const [iteration, setIteration] = useState(1);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [isGatewayActive, setIsGatewayActive] = useState<boolean | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = translations[lang];

  const outputFormats: OutputFormatOption[] = [
    {
      id: "Markdown",
      label: "Markdown",
      icon: FileText,
      description: t.descMarkdown,
    },
    {
      id: "JSON",
      label: "JSON",
      icon: FileCode,
      description: t.descJson,
    },
    {
      id: "Texto Estructurado",
      label: t.formatStructuredLabel,
      icon: ListOrdered,
      description: t.descStructured,
    },
    {
      id: "Código",
      label: t.formatCodeLabel,
      icon: Code2,
      description: t.descCode,
    },
    {
      id: "Tabla",
      label: t.formatTableLabel,
      icon: Table,
      description: t.descTable,
    },
  ];

  // 1. Cargar historial y estado al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prompt_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
      const savedLang = localStorage.getItem("preferred_lang") as Language;
      if (savedLang === "es" || savedLang === "en") {
        setLang(savedLang);
      }
    } catch {
      // Manejo seguro en caso de SSR o cuotas de localStorage
    }

    // Comprobar salud del Gateway NestJS
    checkGatewayHealth();
  }, []);

  const checkGatewayHealth = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/health", {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      setIsGatewayActive(res.ok);
    } catch {
      setIsGatewayActive(false);
    }
  };

  const handleToggleLang = () => {
    const nextLang: Language = lang === "es" ? "en" : "es";
    setLang(nextLang);
    localStorage.setItem("preferred_lang", nextLang);
  };

  // 2. Ejecutar análisis y optimización
  const handleAnalyze = async (textOverride?: string, isIterate: boolean = false) => {
    const textToAnalyze = textOverride || promptInput.trim();
    if (!textToAnalyze) {
      showToast(t.emptyFieldTitle, "warning");
      return;
    }

    setIsLoading(true);
    const start = performance.now();
    const currentIter = isIterate ? iteration + 1 : 1;

    try {
      let targetUrl = `${GATEWAY_URL}/analyze`;
      let res: Response;

      try {
        res = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: textToAnalyze,
            output_format: outputFormat,
            formato_salida: outputFormat,
            iteration: currentIter,
            target_lang: lang,
          }),
        });
      } catch {
        // Fallback a FastAPI directo si Gateway falla
        targetUrl = `${DIRECT_AI_URL}/analyze`;
        setIsGatewayActive(false);
        res = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: textToAnalyze,
            output_format: outputFormat,
            formato_salida: outputFormat,
            iteration: currentIter,
            target_lang: lang,
          }),
        });
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data: AnalysisResponse = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setLastLatency(elapsed);

      setAnalysis(data);
      setIteration(currentIter);

      // Guardar en historial
      const newItem: HistoryItem = {
        id: Date.now(),
        date: new Date().toLocaleTimeString(),
        durationMs: elapsed,
        ...data,
      };

      const updatedHistory = [newItem, ...history.slice(0, 19)];
      setHistory(updatedHistory);
      try {
        localStorage.setItem("prompt_history", JSON.stringify(updatedHistory));
      } catch {
        // Ignorar error si excede cuota
      }

      showToast(t.analysisSuccessToast, "success");
    } catch (err: any) {
      console.error("Error optimizando prompt:", err);
      showErrorAlert(
        t.analysisFailedToast,
        `${err.message || "Error de conexión con el backend."}`,
        t.understoodBtn
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleIterate = () => {
    if (analysis?.prompt_mejorado) {
      setPromptInput(analysis.prompt_mejorado);
      handleAnalyze(analysis.prompt_mejorado, true);
    }
  };

  // 3. Traducir Prompt Input
  const handleTranslate = async () => {
    if (!promptInput.trim()) return;

    setIsTranslating(true);
    const targetLang = lang === "es" ? "en" : "es";

    try {
      let targetUrl = `${GATEWAY_URL}/translate`;
      let res: Response;

      try {
        res = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: promptInput.trim(),
            target_lang: targetLang,
          }),
        });
      } catch {
        targetUrl = `${DIRECT_AI_URL}/translate`;
        res = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: promptInput.trim(),
            target_lang: targetLang,
          }),
        });
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.translated_text) {
        setPromptInput(data.translated_text);
        showToast(
          targetLang === "en" ? "Traducido al inglés" : "Translated to Spanish",
          "success"
        );
      }
    } catch (err: any) {
      console.error("Error al traducir:", err);
      showErrorAlert(t.transErrorTitle, t.transServiceError, t.understoodBtn);
    } finally {
      setIsTranslating(false);
    }
  };

  // 4. Reproductor TTS
  const handleAudioPlayback = async () => {
    const textToSpeak = analysis?.prompt_mejorado || promptInput;
    if (!textToSpeak) return;

    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsAudioLoading(true);

    try {
      const response = await fetch(`${DIRECT_AI_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak }),
      });

      if (!response.ok) {
        throw new Error(`TTS failed with code ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlayingAudio(true);
        setIsAudioLoading(false);
      };

      audio.onended = () => {
        setIsPlayingAudio(false);
        setIsAudioLoading(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        setIsAudioLoading(false);
      };

      await audio.play();
    } catch {
      // Fallback a Web Speech API
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = lang === "en" ? "en-US" : "es-ES";
        utterance.rate = 1.0;
        utterance.onstart = () => {
          setIsPlayingAudio(true);
          setIsAudioLoading(false);
        };
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => {
          setIsPlayingAudio(false);
          setIsAudioLoading(false);
          showErrorAlert(t.audioTitle, t.audioErrorText, t.understoodBtn);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setIsAudioLoading(false);
        setIsPlayingAudio(false);
        showErrorAlert(t.audioTitle, t.audioErrorText, t.understoodBtn);
      }
    }
  };

  // 5. Copiar prompt mejorado
  const handleCopy = () => {
    if (!analysis?.prompt_mejorado) return;
    navigator.clipboard.writeText(analysis.prompt_mejorado);
    setCopied(true);
    showToast(t.copySuccess, "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // 6. Limpiar Historial
  const handleClearHistory = async () => {
    const confirmed = await confirmAction(
      t.confirmClearTitle,
      t.confirmClearText,
      t.confirmClearBtn,
      t.cancelBtn
    );
    if (confirmed) {
      localStorage.removeItem("prompt_history");
      setHistory([]);
      showToast(t.historyCleared, "success");
    }
  };

  // 7. Seleccionar elemento del historial
  const handleSelectHistory = (item: HistoryItem) => {
    setAnalysis(item);
    setPromptInput(item.prompt_original);
    showToast(t.historyLoadBtn, "info");
  };

  return (
    <main className="min-h-screen bg-[#040c0a] text-bento-text p-4 sm:p-6 lg:p-8 flex justify-center selection:bg-bento-emerald selection:text-[#040c0a]">
      <div className="w-full max-w-7xl space-y-6">
        {/* Header Modular */}
        <Header
          lang={lang}
          onToggleLang={handleToggleLang}
          isGatewayActive={isGatewayActive}
          lastLatency={lastLatency}
          t={t}
        />

        {/* Bento Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Tile 1: Editor y entrada de prompt (7 cols) */}
          <div className="md:col-span-7">
            <PromptInputCard
              promptInput={promptInput}
              setPromptInput={setPromptInput}
              outputFormat={outputFormat}
              setOutputFormat={setOutputFormat}
              outputFormats={outputFormats}
              isLoading={isLoading}
              isTranslating={isTranslating}
              onAnalyze={() => handleAnalyze()}
              onIterate={handleIterate}
              onTranslate={handleTranslate}
              hasResult={Boolean(analysis?.prompt_mejorado)}
              t={t}
            />
          </div>

          {/* Tile 2: Métricas de ahorro y eficiencia (5 cols) */}
          <div className="md:col-span-5">
            <SavingsCard savings={analysis?.ahorro} t={t} />
          </div>

          {/* Tile 3: Diagnóstico de calidad y métricas (5 cols) */}
          <div className="md:col-span-5">
            <MetricsCard
              scores={analysis?.scores}
              rol={analysis?.rol_detectado}
              tipoPrompt={analysis?.tipo_prompt}
              idioma={analysis?.idioma}
              t={t}
            />
          </div>

          {/* Tile 4: Resultado optimizado, código y TTS (7 cols) */}
          <div className="md:col-span-7">
            <ResultCard
              promptMejorado={analysis?.prompt_mejorado}
              outputFormat={analysis?.formato_salida || outputFormat}
              viewMode={viewMode}
              setViewMode={setViewMode}
              copied={copied}
              onCopy={handleCopy}
              isPlayingAudio={isPlayingAudio}
              isAudioLoading={isAudioLoading}
              onAudioPlayback={handleAudioPlayback}
              t={t}
            />
          </div>

          {/* Tile 5: Técnicas aplicadas y recomendaciones (7 cols) */}
          <div className="md:col-span-7">
            <ImprovementDetailsCard
              detalles={analysis?.detalles_mejora}
              sugerencias={analysis?.sugerencias}
              fallas={analysis?.fallas}
              t={t}
            />
          </div>

          {/* Tile 6: Historial de iteraciones (5 cols) */}
          <div className="md:col-span-5">
            <HistoryCard
              history={history}
              onSelect={handleSelectHistory}
              onClear={handleClearHistory}
              t={t}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
