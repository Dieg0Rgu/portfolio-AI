"use client";

import React from "react";
import {
  FileCode,
  FileText,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RefreshCw,
} from "lucide-react";
import { ViewMode } from "@/types";

interface ResultCardProps {
  promptMejorado?: string;
  outputFormat?: string;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  copied: boolean;
  onCopy: () => void;
  isPlayingAudio: boolean;
  isAudioLoading: boolean;
  onAudioPlayback: () => void;
  t: Record<string, string>;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  promptMejorado,
  outputFormat,
  viewMode,
  setViewMode,
  copied,
  onCopy,
  isPlayingAudio,
  isAudioLoading,
  onAudioPlayback,
  t,
}) => {
  const renderFormattedContent = (content: string) => {
    if (!content) {
      return (
        <div className="h-48 flex items-center justify-center text-bento-muted/50 italic text-sm">
          {t.waitingPrompt}
        </div>
      );
    }

    // Comprobar si es JSON estricto
    const trimmed = content.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return (
          <div className="rounded-xl bg-[#040c09] p-4 border border-bento-emerald/25 font-mono text-xs overflow-x-auto text-emerald-300">
            <pre>{JSON.stringify(parsed, null, 2)}</pre>
          </div>
        );
      } catch {
        // Formato texto / markdown
      }
    }

    // Formateo visual tipo Markdown / Tablas / Bloques
    const renderInline = (text: string) => {
      if (!text.includes("**")) return text;
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };

    const lines = content.split("\n");
    return (
      <div className="space-y-2 text-xs md:text-sm font-mono text-[#e3f3ee] leading-relaxed">
        {lines.map((line, idx) => {
          const l = line.trim();
          if (!l) return <div key={idx} className="h-2" />;

          // Encabezados Markdown (# ROL Y EXPERTOS, # ROLE AND EXPERTS, etc.)
          if (l.startsWith("### ")) {
            return (
              <h4
                key={idx}
                className="text-sm font-bold text-emerald-300 pt-2 border-b border-bento-emerald/20 pb-1"
              >
                {renderInline(l.replace("### ", ""))}
              </h4>
            );
          }
          if (l.startsWith("## ")) {
            return (
              <h3
                key={idx}
                className="text-base font-bold text-bento-mint pt-2 border-b border-bento-emerald/30 pb-1"
              >
                {renderInline(l.replace("## ", ""))}
              </h3>
            );
          }
          if (l.startsWith("# ")) {
            return (
              <h2 key={idx} className="text-lg font-extrabold text-white pt-3 text-bento-mint">
                {renderInline(l.replace("# ", ""))}
              </h2>
            );
          }

          // Listas con viñetas
          if (l.startsWith("- ") || l.startsWith("* ")) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-bento-emerald font-bold">•</span>
                <span>{renderInline(l.substring(2))}</span>
              </div>
            );
          }

          // Líneas numeradas (Texto Estructurado)
          const matchNum = l.match(/^(\d+\.)\s+(.*)/);
          if (matchNum) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-bento-mint font-bold">{matchNum[1]}</span>
                <span>{renderInline(matchNum[2])}</span>
              </div>
            );
          }

          // Filas de Tabla Markdown
          if (l.startsWith("|") && l.endsWith("|")) {
            const isSeparator = /^\|[-:\s|]+\|$/.test(l);
            if (isSeparator) {
              return <div key={idx} className="border-b border-bento-emerald/30 my-1" />;
            }
            const cells = l.split("|").slice(1, -1).map((c) => c.trim());
            return (
              <div
                key={idx}
                className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-[#061712] border border-bento-emerald/15 overflow-x-auto"
              >
                {cells.map((cell, cIdx) => (
                  <div
                    key={cIdx}
                    className="flex-1 text-xs font-mono text-[#d8eae4] border-r border-bento-emerald/10 last:border-r-0 pr-2"
                  >
                    {renderInline(cell)}
                  </div>
                ))}
              </div>
            );
          }

          // Delimitadores de código
          if (l.startsWith("```")) {
            return (
              <div key={idx} className="text-[11px] font-mono text-bento-emerald font-bold pt-1 opacity-70">
                {l}
              </div>
            );
          }

          return <p key={idx} className="text-[#d8eae4]">{renderInline(l)}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="bento-card p-5 flex flex-col justify-between h-full bg-bento-panel border-bento-border shadow-bento">
      <div>
        {/* Header Tile */}
        <div className="flex items-center justify-between pb-3 border-b border-bento-border/50 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-bento-muted flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-bento-emerald" />
              {t.tileOptimized}
            </span>
            {outputFormat && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bento-emerald/10 text-bento-mint border border-bento-emerald/20">
                {outputFormat}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#050e0c] border border-bento-border">
              <button
                onClick={() => setViewMode("formatted")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-all ${
                  viewMode === "formatted"
                    ? "bg-bento-emerald/20 text-bento-mint font-semibold"
                    : "text-bento-muted hover:text-bento-text"
                }`}
                title={t.viewFormatted}
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">{t.viewFormatted}</span>
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-all ${
                  viewMode === "raw"
                    ? "bg-bento-emerald/20 text-bento-mint font-semibold"
                    : "text-bento-muted hover:text-bento-text"
                }`}
                title={t.viewRaw}
              >
                <FileCode className="w-3 h-3" />
                <span className="hidden sm:inline">{t.viewRaw}</span>
              </button>
            </div>

            {/* Audio TTS Player Button */}
            <button
              onClick={onAudioPlayback}
              disabled={!promptMejorado || isAudioLoading}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                isPlayingAudio
                  ? "bg-bento-emerald text-[#040c0a] border-bento-mint font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-[#050e0c] border-bento-border text-bento-muted hover:text-bento-mint hover:border-bento-borderHover"
              }`}
              title={t.audioTooltip}
            >
              {isAudioLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-bento-mint" />
              ) : isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">{t.btnAudioPlaying}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.btnAudio}</span>
                </>
              )}
            </button>

            {/* Copy Button */}
            <button
              onClick={onCopy}
              disabled={!promptMejorado}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#050e0c] border border-bento-border hover:border-bento-borderHover text-xs font-mono text-bento-muted hover:text-bento-mint transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={t.btnCopy}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-bento-mint" />
                  <span className="text-bento-mint hidden sm:inline">{t.btnCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.btnCopy}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="min-h-[220px] max-h-[460px] overflow-y-auto rounded-xl bg-[#050e0c] p-4 border border-bento-border/60">
          {viewMode === "formatted" ? (
            renderFormattedContent(promptMejorado || "")
          ) : (
            <pre className="text-xs md:text-sm font-mono text-bento-mint whitespace-pre-wrap select-all">
              {promptMejorado || t.waitingPrompt}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
