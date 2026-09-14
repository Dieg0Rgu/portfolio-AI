"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Languages,
  Copy,
  Check,
  Trash2,
  Cpu,
  BarChart3,
  AlertCircle,
  Clock,
  Send,
  RefreshCw,
  FileCode,
  FileText,
  Table,
  ListOrdered,
  Code2,
  Eye,
  Terminal,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Layers,
} from "lucide-react";
import { AnalysisResponse, HistoryItem, Language } from "@/types";
import { translations } from "@/lib/i18n";
import { showToast, confirmAction, showErrorAlert } from "@/lib/alerts";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:4000/api/prompt";
const DIRECT_AI_URL = "http://localhost:8000/api";

const OUTPUT_FORMATS = [
  { id: "Markdown", label: "Markdown", icon: FileText, desc: "Encabezados, listas y negritas" },
  { id: "JSON", label: "JSON", icon: FileCode, desc: "Estructura estricta clave-valor" },
  { id: "Texto Estructurado", label: "Estructurado", icon: ListOrdered, desc: "Paso a paso numerado" },
  { id: "Código", label: "Código", icon: Code2, desc: "Script o sintaxis técnica" },
  { id: "Tabla", label: "Tabla", icon: Table, desc: "Formato tabular comparativo" },
] as const;

export default function BentoDashboard() {
  const [lang, setLang] = useState<Language>("es");
  const [promptInput, setPromptInput] = useState("");
  const [outputFormat, setOutputFormat] = useState<string>("Markdown");
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
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

  // 1. Cargar preferencias e historial de LocalStorage al montar
  useEffect(() => {
    const savedLang = localStorage.getItem("ai_optimizer_lang") as Language;
    if (savedLang === "es" || savedLang === "en") {
      setLang(savedLang);
    }
    const savedHistory = localStorage.getItem("prompt_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        setHistory([]);
      }
    }

    // Comprobar salud del Gateway NestJS
    fetch(`${GATEWAY_URL}/health`)
      .then((res) => res.ok)
      .then((active) => setIsGatewayActive(active))
      .catch(() => setIsGatewayActive(false));

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 2. Guardar idioma al cambiar
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("ai_optimizer_lang", newLang);
    showToast(newLang === "es" ? "Idioma cambiado a Español" : "Language switched to English", "info");
  };

  // 3. Ejecutar análisis del prompt
  const handleAnalyze = async (iter: number = 1, textToAnalyze: string = promptInput) => {
    const trimmed = textToAnalyze.trim();
    if (!trimmed) {
      showErrorAlert(lang === "es" ? "Campo vacío" : "Empty field", lang === "es" ? "Por favor ingresa un prompt para evaluar." : "Please enter a prompt to evaluate.");
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();

    try {
      const endpoint = isGatewayActive ? `${GATEWAY_URL}/analyze` : `${DIRECT_AI_URL}/analyze`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          iteration: iter,
          target_lang: lang,
          output_format: outputFormat,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || `Error del servidor (${res.status})`);
      }

      const data: AnalysisResponse = await res.json();
      const elapsed = Math.round(performance.now() - startTime);
      setLastLatency(elapsed);
      setAnalysis(data);
      setIteration(iter);

      // Guardar en Historial
      const newEntry: HistoryItem = {
        ...data,
        id: Date.now(),
        date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        durationMs: elapsed,
      };

      const updatedHistory = [newEntry, ...history.slice(0, 14)];
      setHistory(updatedHistory);
      localStorage.setItem("prompt_history", JSON.stringify(updatedHistory));

      showToast(lang === "es" ? "¡Análisis completado con éxito!" : "Analysis completed successfully!", "success");
    } catch (err: any) {
      showErrorAlert(lang === "es" ? "Fallo en el análisis" : "Analysis failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Traducir el prompt optimizado
  const handleTranslateOptimized = async () => {
    if (!analysis?.prompt_mejorado) return;
    const target = lang === "es" ? "en" : "es";
    setIsTranslating(true);

    try {
      const endpoint = isGatewayActive ? `${GATEWAY_URL}/translate` : `${DIRECT_AI_URL}/translate`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: analysis.prompt_mejorado,
          target_lang: target,
          source_lang: "auto",
        }),
      });

      if (!res.ok) throw new Error("Error en el servicio de traducción");
      const data = await res.json();
      setAnalysis({
        ...analysis,
        prompt_mejorado: data.translated_text,
      });
      showToast(t.transSuccess, "success");
    } catch (err: any) {
      showErrorAlert(lang === "es" ? "Error al traducir" : "Translation error", err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  // 5. Reproducción Neural de Voz (Edge-TTS en backend con fallback a Web Speech API)
  const handlePlayAudio = async () => {
    const textToSpeak = analysis?.prompt_mejorado || promptInput;
    if (!textToSpeak.trim()) return;

    // Si ya está reproduciendo, detener
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
      return;
    }

    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    setIsAudioLoading(true);

    try {
      // 1. Intentar con el servicio neural de Edge-TTS del backend (alta calidad de audio MP3)
      const endpoint = isGatewayActive ? `${GATEWAY_URL}/tts` : `${DIRECT_AI_URL}/tts`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          lang: lang,
        }),
      });

      if (!response.ok) {
        throw new Error("Fallo en el servicio TTS neural");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

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
    } catch (err) {
      console.warn("Fallo en TTS remoto, intentando fallback con Web Speech API...", err);
      // Fallback local a Web Speech API
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
          showErrorAlert("Audio", "No se pudo reproducir el audio.");
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setIsAudioLoading(false);
        setIsPlayingAudio(false);
        showErrorAlert("Audio", "No se pudo reproducir el audio.");
      }
    }
  };

  // 6. Copiar prompt mejorado al portapapeles
  const handleCopy = () => {
    if (!analysis?.prompt_mejorado) return;
    navigator.clipboard.writeText(analysis.prompt_mejorado);
    setCopied(true);
    showToast(t.copySuccess, "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // 7. Limpiar Historial con confirmación SweetAlert2
  const handleClearHistory = async () => {
    const confirmed = await confirmAction(t.confirmClearTitle, t.confirmClearText, t.confirmClearBtn, t.cancelBtn);
    if (confirmed) {
      localStorage.removeItem("prompt_history");
      setHistory([]);
      showToast(t.historyCleared, "success");
    }
  };

  // 8. Renderizador inteligente de contenido formateado (Markdown / JSON / Tablas)
  const renderFormattedContent = (content: string) => {
    if (!content) {
      return <span className="text-[#5b8377] italic">{t.waitingPrompt}</span>;
    }

    // Comprobar si es JSON
    const trimmed = content.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        return (
          <div className="rounded-xl bg-[#040c09] p-4 border border-[#10b981]/25 font-mono text-xs overflow-x-auto text-emerald-300">
            <pre>{JSON.stringify(parsed, null, 2)}</pre>
          </div>
        );
      } catch {
        // No era JSON válido, continuar con formateo de texto
      }
    }

    // Formateo de líneas estilo Markdown
    const lines = content.split("\n");
    return (
      <div className="space-y-2 text-xs md:text-sm font-mono text-[#e3f3ee] leading-relaxed">
        {lines.map((line, idx) => {
          const l = line.trim();
          if (!l) return <div key={idx} className="h-2" />;

          // Encabezados Markdown
          if (l.startsWith("### ")) {
            return (
              <h4 key={idx} className="text-sm font-bold text-emerald-300 pt-2 border-b border-[#10b981]/20 pb-1">
                {l.replace("### ", "")}
              </h4>
            );
          }
          if (l.startsWith("## ")) {
            return (
              <h3 key={idx} className="text-base font-bold text-white pt-2 text-[#34d399] border-b border-[#10b981]/30 pb-1">
                {l.replace("## ", "")}
              </h3>
            );
          }
          if (l.startsWith("# ")) {
            return (
              <h2 key={idx} className="text-lg font-extrabold text-white pt-3">
                {l.replace("# ", "")}
              </h2>
            );
          }

          // Listas
          if (l.startsWith("- ") || l.startsWith("* ")) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#10b981] font-bold">•</span>
                <span>{l.substring(2)}</span>
              </div>
            );
          }

          // Líneas numeradas
          const matchNum = l.match(/^(\d+\.)\s+(.*)/);
          if (matchNum) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#34d399] font-bold">{matchNum[1]}</span>
                <span>{matchNum[2]}</span>
              </div>
            );
          }

          // Bloque de código en línea o regular
          return <p key={idx} className="text-[#d8eae4]">{l}</p>;
        })}
      </div>
    );
  };

  const metricsKeys = [
    { key: "claridad", label: t.clarity },
    { key: "especificidad", label: t.specificity },
    { key: "objetividad", label: t.objectivity },
    { key: "veracidad", label: t.truthfulness },
    { key: "contexto", label: t.context },
    { key: "coherencia", label: t.coherence },
    { key: "calidad_general", label: t.overallQuality },
  ] as const;

  return (
    <main className="min-h-screen bg-[#040c0a] text-[#e3f3ee] p-4 md:p-8 flex justify-center selection:bg-[#10b981] selection:text-[#040c0a]">
      <div className="w-full max-w-7xl space-y-6">

        {/* ============================================================================== */}
        {/* HEADER BENTO TILE                                                               */}
        {/* ============================================================================== */}
        <header className="rounded-2xl bg-[#091a15]/90 border border-[#10b981]/20 p-5 md:p-6 shadow-bento backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981]">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white font-mono">
                {t.appTitle}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-[#739b90] pl-11">
              {t.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
            {/* Engine status pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#05130f] border border-[#10b981]/25 text-xs text-[#34d399] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              <span>{isGatewayActive ? "NestJS Gateway: ON" : "Python AI: Direct"}</span>
            </div>

            {/* Language Switcher Pill (ES / EN) */}
            <div className="flex items-center p-1 rounded-xl bg-[#05130f] border border-[#10b981]/20">
              <button
                onClick={() => handleLanguageChange("es")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  lang === "es"
                    ? "bg-[#10b981] text-[#040c0a] shadow-sm font-bold"
                    : "text-[#739b90] hover:text-white"
                }`}
              >
                ES
              </button>
              <button
                onClick={() => handleLanguageChange("en")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  lang === "en"
                    ? "bg-[#10b981] text-[#040c0a] shadow-sm font-bold"
                    : "text-[#739b90] hover:text-white"
                }`}
              >
                EN
              </button>
            </div>

            {/* Clear History Button */}
            <button
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="p-2 rounded-xl bg-[#05130f] border border-[#10b981]/20 text-[#739b90] hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={t.btnClearHistory}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ============================================================================== */}
        {/* BENTO GRID MAIN CONTAINER                                                      */}
        {/* ============================================================================== */}
        <div className="grid grid-cols-12 gap-5 md:gap-6">

          {/* -------------------------------------------------------------------------- */}
          {/* TILE 1: INPUT & ACTIONS PANEL (Col-12 lg:Col-8)                             */}
          {/* -------------------------------------------------------------------------- */}
          <section className="col-span-12 lg:col-span-8 rounded-2xl bg-[#0a1c17] border border-[#10b981]/20 p-5 md:p-6 shadow-bento flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#10b981] uppercase font-semibold">
                  <Cpu className="w-4 h-4" />
                  <span>{t.tilePromptInput}</span>
                </div>
                <div className="text-xs font-mono text-[#5b8377]">
                  {promptInput.length} chars | {promptInput.trim() ? promptInput.trim().split(/\s+/).length : 0} words
                </div>
              </div>

              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={t.promptPlaceholder}
                rows={4}
                className="w-full rounded-xl bg-[#05120e] border border-[#10b981]/25 text-[#e3f3ee] placeholder-[#466a61] p-4 text-sm font-mono focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all resize-none shadow-inner"
              />

              {/* Selector de Formato de Salida Esperado */}
              <div className="mt-3.5 pt-3 border-t border-[#10b981]/15">
                <div className="text-[11px] font-mono text-[#739b90] uppercase mb-2 flex items-center gap-1.5 font-semibold">
                  <FileCode className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>{t.expectedFormat}:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {OUTPUT_FORMATS.map((fmt) => {
                    const Icon = fmt.icon;
                    const isActive = outputFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setOutputFormat(fmt.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                          isActive
                            ? "bg-[#10b981] text-[#040c0a] font-bold border-[#10b981] shadow-sm shadow-[#10b981]/30"
                            : "bg-[#061410] text-[#739b90] border-[#10b981]/20 hover:border-[#10b981]/50 hover:text-white"
                        }`}
                        title={fmt.desc}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{fmt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#10b981]/15 mt-4">
              <button
                onClick={() => handleAnalyze(1, promptInput)}
                disabled={isLoading || !promptInput.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#34d399] text-[#040c0a] font-semibold text-sm transition-all shadow-md shadow-[#10b981]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isLoading ? t.btnAnalyzing : t.btnAnalyze}</span>
              </button>

              <button
                onClick={() => handleAnalyze(iteration + 1, analysis?.prompt_mejorado || promptInput)}
                disabled={isLoading || !analysis}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#061511] border border-[#10b981]/30 hover:border-[#10b981] text-[#34d399] font-medium text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t.btnIterate} ({t.iterationLabel} {iteration + 1})</span>
              </button>

              <button
                onClick={handlePlayAudio}
                disabled={isAudioLoading || (!promptInput && !analysis?.prompt_mejorado)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium ${
                  isPlayingAudio
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : "bg-[#061511] border-[#10b981]/30 hover:border-[#10b981] text-[#34d399]"
                }`}
                title="Reproducir síntesis de voz neural (Edge-TTS)"
              >
                {isAudioLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isPlayingAudio ? (
                  <VolumeX className="w-4 h-4 animate-pulse text-amber-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span>
                  {isAudioLoading
                    ? t.btnAudioLoading
                    : isPlayingAudio
                    ? t.btnAudioPlaying
                    : t.btnAudio}
                </span>
              </button>
            </div>
          </section>

          {/* -------------------------------------------------------------------------- */}
          {/* TILE 2: TOKEN METRICS PANEL (Col-12 lg:Col-4)                               */}
          {/* -------------------------------------------------------------------------- */}
          <section className="col-span-12 lg:col-span-4 rounded-2xl bg-[#0a1c17] border border-[#10b981]/20 p-5 md:p-6 shadow-bento flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#10b981] uppercase font-semibold">
                <Zap className="w-4 h-4" />
                <span>{t.tileTokenMetrics}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                cl100k_base
              </span>
            </div>

            {analysis?.tokens ? (
              <div className="space-y-3.5 my-auto">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-[#061410] border border-[#10b981]/20 p-2.5 text-center">
                    <div className="text-[11px] font-mono text-[#739b90] uppercase">{t.inputTokens}</div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">
                      {analysis.tokens.input_tokens}
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#061410] border border-[#10b981]/20 p-2.5 text-center">
                    <div className="text-[11px] font-mono text-[#739b90] uppercase">{t.outputTokens}</div>
                    <div className="text-xl font-bold font-mono text-[#34d399] mt-0.5">
                      {analysis.tokens.output_tokens}
                    </div>
                  </div>

                  <div className="col-span-2 rounded-xl bg-gradient-to-r from-[#061410] to-[#0a231b] border border-[#10b981]/30 p-2.5 px-3 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-[#739b90] uppercase">{t.totalTokens}</div>
                      <div className="text-2xl font-extrabold font-mono text-emerald-400">
                        {analysis.tokens.total_tokens}
                      </div>
                    </div>
                    {lastLatency && (
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-[#739b90] uppercase">{t.latency}</div>
                        <div className="text-xs font-mono text-white mt-0.5 flex items-center gap-1 justify-end">
                          <Clock className="w-3.5 h-3.5 text-[#10b981]" />
                          <span>{(lastLatency / 1000).toFixed(2)}s</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tarjeta de Ahorro y Eficiencia Estimada */}
                {analysis?.ahorro && (
                  <div className="rounded-xl bg-[#051410] border border-[#10b981]/25 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#34d399] uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5 text-[#10b981]" />
                        <span>{t.tokenSavings}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        +{analysis.ahorro.porcentaje_ahorro}% {t.savingPercentage}
                      </span>
                    </div>

                    {/* Comparativa visual tokens optimizados vs sin optimizar */}
                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between text-[#739b90]">
                        <span>{t.unoptimizedEstimate}:</span>
                        <span className="text-red-400/90 font-bold line-through">{analysis.ahorro.tokens_sin_optimizar_estimados} tok</span>
                      </div>
                      <div className="flex justify-between text-[#9fc1b8]">
                        <span>Tokens Optimizados:</span>
                        <span className="text-emerald-300 font-bold">{analysis.ahorro.tokens_optimizados} tok</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#05130f] overflow-hidden border border-[#10b981]/20 flex">
                        <div 
                          className="h-full bg-emerald-500 rounded-l-full" 
                          style={{ width: `${Math.max(10, 100 - analysis.ahorro.porcentaje_ahorro)}%` }} 
                          title="Tokens consumidos con prompt optimizado"
                        />
                        <div 
                          className="h-full bg-emerald-300/30 rounded-r-full" 
                          style={{ width: `${analysis.ahorro.porcentaje_ahorro}%` }} 
                          title="Tokens ahorrados por prompt engineering"
                        />
                      </div>
                    </div>

                    {/* Tarjetas de Ahorro en Dinero y Turnos */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-0.5">
                      <div className="rounded-lg bg-[#071914] border border-[#10b981]/20 p-2 flex flex-col justify-between">
                        <span className="text-[10px] text-[#739b90] uppercase">{t.costSavedPer1k}</span>
                        <span className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-[#10b981]" />
                          ${analysis.ahorro.costo_ahorrado_usd_1k.toFixed(2)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-[#071914] border border-[#10b981]/20 p-2 flex flex-col justify-between">
                        <span className="text-[10px] text-[#739b90] uppercase">{t.iterationsAvoided}</span>
                        <span className="text-sm font-bold text-[#34d399] mt-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                          ~{analysis.ahorro.iteraciones_ahorradas} turnos
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="my-auto py-8 text-center text-xs font-mono text-[#5b8377] border border-dashed border-[#10b981]/20 rounded-xl p-4">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#10b981]" />
                {t.noTokensYet}
              </div>
            )}
          </section>

          {/* -------------------------------------------------------------------------- */}
          {/* TILE 3: QUALITY SCORES (Col-12 lg:Col-7)                                    */}
          {/* -------------------------------------------------------------------------- */}
          <section className="col-span-12 lg:col-span-7 rounded-2xl bg-[#0a1c17] border border-[#10b981]/20 p-5 md:p-6 shadow-bento">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#10b981] uppercase font-semibold">
                <BarChart3 className="w-4 h-4" />
                <span>{t.tileQualityScores}</span>
              </div>
              {analysis?.scores?.calidad_general !== undefined && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40">
                  {analysis.scores.calidad_general} / 100
                </span>
              )}
            </div>

            <div className="space-y-3">
              {metricsKeys.map(({ key, label }) => {
                const val = analysis?.scores ? (analysis.scores as any)[key] ?? 0 : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#9fc1b8]">{label}</span>
                      <span className="font-bold text-white">{val}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#05130f] overflow-hidden border border-[#10b981]/15">
                      <div
                        className="h-full bg-gradient-to-r from-[#059669] to-[#10b981] rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(Math.max(val, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* -------------------------------------------------------------------------- */}
          {/* TILE 4: STRUCTURAL DIAGNOSTICS & BADGES (Col-12 lg:Col-5)                   */}
          {/* -------------------------------------------------------------------------- */}
          <section className="col-span-12 lg:col-span-5 rounded-2xl bg-[#0a1c17] border border-[#10b981]/20 p-5 md:p-6 shadow-bento flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#10b981] uppercase font-semibold mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>{t.tileDiagnostics}</span>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-1 gap-2.5 mb-4">
                <div className="p-2.5 rounded-xl bg-[#061410] border border-[#10b981]/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#739b90]">{t.roleDetected}:</span>
                  <span className="font-bold text-white">{analysis?.rol_detectado || "-"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#061410] border border-[#10b981]/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#739b90]">{t.promptType}:</span>
                  <span className="font-bold text-[#34d399]">{analysis?.tipo_prompt || "-"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#061410] border border-[#10b981]/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#739b90]">{t.languageDetected}:</span>
                  <span className="font-bold text-white">{analysis?.idioma || "-"}</span>
                </div>
                {analysis?.formato_salida && (
                  <div className="p-2.5 rounded-xl bg-[#061410] border border-[#10b981]/20 flex items-center justify-between text-xs font-mono">
                    <span className="text-[#739b90]">{t.expectedFormat}:</span>
                    <span className="font-bold text-emerald-300">{analysis.formato_salida}</span>
                  </div>
                )}
              </div>

              {/* Flaws Check */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-[#739b90] uppercase">{t.flawsDetected}:</div>
                {analysis?.fallas ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className={`p-2 rounded-lg border ${analysis.fallas.ambiguedad ? "bg-red-950/20 border-red-500/30 text-red-300" : "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"}`}>
                      {analysis.fallas.ambiguedad ? "✕ " : "✓ "} {t.ambiguity}
                    </div>
                    <div className={`p-2 rounded-lg border ${analysis.fallas.falta_contexto ? "bg-red-950/20 border-red-500/30 text-red-300" : "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"}`}>
                      {analysis.fallas.falta_contexto ? "✕ " : "✓ "} {t.lackContext}
                    </div>
                    <div className={`p-2 rounded-lg border ${analysis.fallas.falta_objetivo ? "bg-red-950/20 border-red-500/30 text-red-300" : "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"}`}>
                      {analysis.fallas.falta_objetivo ? "✕ " : "✓ "} {t.lackObjective}
                    </div>
                    <div className={`p-2 rounded-lg border ${analysis.fallas.falta_restricciones ? "bg-red-950/20 border-red-500/30 text-red-300" : "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"}`}>
                      {analysis.fallas.falta_restricciones ? "✕ " : "✓ "} {t.lackConstraints}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-[#5b8377] italic">{t.waitingPrompt}</div>
                )}
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------------------------- */}
          {/* TILE 5: OPTIMIZED PROMPT & SUGGESTIONS (Col-12)                             */}
          {/* -------------------------------------------------------------------------- */}
          <section className="col-span-12 rounded-2xl bg-[#0a1c17] border border-[#10b981]/30 p-5 md:p-6 shadow-bentoGlow grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono tracking-wider text-[#34d399] uppercase font-semibold">
                      <Sparkles className="w-4 h-4 text-[#10b981]" />
                      <span>{t.tileOptimized}</span>
                    </div>
                    {analysis?.formato_salida && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                        {analysis.formato_salida}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle: Formatted vs Raw */}
                    <div className="flex items-center p-0.5 rounded-lg bg-[#061410] border border-[#10b981]/25">
                      <button
                        type="button"
                        onClick={() => setViewMode("formatted")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                          viewMode === "formatted"
                            ? "bg-[#10b981] text-[#040c0a] font-bold"
                            : "text-[#739b90] hover:text-white"
                        }`}
                        title={t.viewFormatted}
                      >
                        <Eye className="w-3 h-3" />
                        <span>{t.viewFormatted}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("raw")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                          viewMode === "raw"
                            ? "bg-[#10b981] text-[#040c0a] font-bold"
                            : "text-[#739b90] hover:text-white"
                        }`}
                        title={t.viewRaw}
                      >
                        <Terminal className="w-3 h-3" />
                        <span>{t.viewRaw}</span>
                      </button>
                    </div>

                    {/* Translate Button */}
                    <button
                      onClick={handleTranslateOptimized}
                      disabled={isTranslating || !analysis?.prompt_mejorado}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#061511] border border-[#10b981]/30 text-xs font-mono text-[#34d399] hover:bg-[#10b981]/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      <span>{isTranslating ? t.btnTranslating : t.btnTranslate}</span>
                    </button>

                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      disabled={!analysis?.prompt_mejorado}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981] text-[#040c0a] text-xs font-mono font-semibold hover:bg-[#34d399] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? t.btnCopied : t.btnCopy}</span>
                    </button>
                  </div>
                </div>

                {/* Display Container with Formatted vs Raw view */}
                <div className="rounded-xl bg-[#05120e] border border-[#10b981]/25 p-4 text-sm font-mono min-h-[140px] max-h-[360px] overflow-y-auto">
                  {analysis?.prompt_mejorado ? (
                    viewMode === "formatted" ? (
                      renderFormattedContent(analysis.prompt_mejorado)
                    ) : (
                      <pre className="text-xs text-[#e3f3ee] whitespace-pre-wrap selection:bg-[#10b981]">
                        {analysis.prompt_mejorado}
                      </pre>
                    )
                  ) : (
                    <span className="text-[#5b8377] italic">{t.waitingPrompt}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl bg-[#061410] border border-[#10b981]/25 p-4 md:p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                {/* Header de Recomendaciones */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono tracking-wider text-[#10b981] uppercase font-semibold">
                    <Lightbulb className="w-4 h-4 text-[#10b981]" />
                    <span>{t.tileSuggestions}</span>
                  </div>
                  {analysis?.detalles_mejora?.tecnicas_aplicadas && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                      {analysis.detalles_mejora.tecnicas_aplicadas.length} Técnicas
                    </span>
                  )}
                </div>

                {/* Resumen de Sugerencia */}
                <div className="p-3 rounded-xl bg-[#081e18] border border-[#10b981]/20">
                  <p className="text-xs font-mono text-[#d1ece4] leading-relaxed">
                    {analysis?.sugerencias || t.waitingPrompt}
                  </p>
                </div>

                {analysis?.detalles_mejora ? (
                  <div className="space-y-3">
                    {/* Técnicas de Prompt Engineering aplicadas */}
                    <div>
                      <div className="text-[11px] font-mono text-[#739b90] uppercase mb-1.5 flex items-center gap-1 font-semibold">
                        <Layers className="w-3.5 h-3.5 text-[#10b981]" />
                        <span>{t.techniquesApplied}:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.detalles_mejora.tecnicas_aplicadas.map((tec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#0c2820] text-emerald-300 border border-[#10b981]/30 font-medium"
                          >
                            #{tec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Mejoras Estructurales Clave */}
                    {analysis.detalles_mejora.mejoras_clave && analysis.detalles_mejora.mejoras_clave.length > 0 && (
                      <div className="pt-2 border-t border-[#10b981]/15">
                        <div className="text-[11px] font-mono text-[#739b90] uppercase mb-1.5 font-semibold">
                          {t.keyImprovements}:
                        </div>
                        <ul className="space-y-1.5 text-xs font-mono text-[#c5e4db]">
                          {analysis.detalles_mejora.mejoras_clave.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Impacto Estimado */}
                    {analysis.detalles_mejora.impacto_estimado && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-[#10b981]/30 flex items-start gap-2">
                        <Zap className="w-4 h-4 text-[#10b981] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#34d399] font-bold block">
                            {t.estimatedImpact}
                          </span>
                          <p className="text-xs font-mono text-[#e3f3ee]">
                            {analysis.detalles_mejora.impacto_estimado}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Próxima Acción Recomendada */}
                    {analysis.detalles_mejora.proxima_accion && (
                      <div className="p-2.5 rounded-lg bg-[#040f0c] border border-[#10b981]/20 flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-[#34d399] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#739b90] font-bold block">
                            {t.nextAction}
                          </span>
                          <p className="text-xs font-mono text-[#a5cbbf]">
                            {analysis.detalles_mejora.proxima_accion}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Puntos Críticos si hay fallas */}
              {analysis?.fallas?.detalles && analysis.fallas.detalles.length > 0 && (
                <div className="pt-3 border-t border-[#10b981]/15">
                  <div className="text-[11px] font-mono text-[#739b90] uppercase mb-1.5 font-semibold">
                    {t.criticalPoints}:
                  </div>
                  <ul className="text-xs font-mono text-red-300/90 list-disc list-inside space-y-1">
                    {analysis.fallas.detalles.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* -------------------------------------------------------------------------- */}
          {/* TILE 6: RECENT HISTORY PANEL (Col-12)                                       */}
          {/* -------------------------------------------------------------------------- */}
          <section className="col-span-12 rounded-2xl bg-[#0a1c17] border border-[#10b981]/20 p-5 md:p-6 shadow-bento">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#10b981] uppercase font-semibold">
                <Clock className="w-4 h-4" />
                <span>{t.tileHistory} ({history.length})</span>
              </div>
              <span className="text-xs font-mono text-[#5b8377]">
                LocalStorage Cache
              </span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-[#5b8377]">
                {t.emptyHistory}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setAnalysis(item);
                      setPromptInput(item.prompt_original);
                    }}
                    className="group p-3.5 rounded-xl bg-[#061410] border border-[#10b981]/15 hover:border-[#10b981]/50 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                        <span className="text-[#34d399] font-bold">[{item.date}]</span>
                        <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981]">
                          Score: {item.scores.calidad_general}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-white font-medium truncate mb-1">
                        {item.rol_detectado} ({item.tipo_prompt})
                      </div>
                      <p className="text-xs font-mono text-[#739b90] line-clamp-2">
                        &quot;{item.prompt_original}&quot;
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#10b981]/10 flex items-center justify-between text-[10px] font-mono text-[#5b8377]">
                      <span>{item.tokens ? `${item.tokens.total_tokens} tokens` : "N/A"}</span>
                      {item.ahorro && (
                        <span className="text-emerald-400 font-semibold">+{item.ahorro.porcentaje_ahorro}% ahorro</span>
                      )}
                      <span className="group-hover:text-[#10b981] transition-colors">Cargar &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}
