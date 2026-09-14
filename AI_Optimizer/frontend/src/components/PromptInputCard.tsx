"use client";

import React from "react";
import {
  Terminal,
  RefreshCw,
  Sparkles,
  Languages,
} from "lucide-react";
import { OutputFormat, OutputFormatOption } from "@/types";

interface PromptInputCardProps {
  promptInput: string;
  setPromptInput: (s: string) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (f: OutputFormat) => void;
  outputFormats: OutputFormatOption[];
  isLoading: boolean;
  isTranslating: boolean;
  onAnalyze: () => void;
  onIterate: () => void;
  onTranslate: () => void;
  hasResult: boolean;
  t: Record<string, string>;
}

export const PromptInputCard: React.FC<PromptInputCardProps> = ({
  promptInput,
  setPromptInput,
  outputFormat,
  setOutputFormat,
  outputFormats,
  isLoading,
  isTranslating,
  onAnalyze,
  onIterate,
  onTranslate,
  hasResult,
  t,
}) => {
  const charCount = promptInput.length;
  const wordCount = promptInput.trim() ? promptInput.trim().split(/\s+/).length : 0;

  return (
    <div className="bento-card p-5 flex flex-col justify-between h-full bg-bento-panel border-bento-border shadow-bento">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase text-bento-muted flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-bento-emerald" />
            {t.tilePromptInput}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onTranslate}
              disabled={!promptInput.trim() || isTranslating || isLoading}
              className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded bg-[#050e0c] border border-bento-border hover:border-bento-borderHover text-bento-muted hover:text-bento-mint transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Translate between Spanish and English"
            >
              <Languages className="w-3 h-3 text-bento-emerald" />
              <span>{isTranslating ? t.btnTranslating : t.btnTranslate}</span>
            </button>
            <span className="text-[11px] font-mono text-bento-muted">
              {charCount} {t.charsLabel} | {wordCount} {t.wordsLabel}
            </span>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={t.promptPlaceholder}
            className="w-full h-36 p-3.5 rounded-xl bg-[#050e0c] border border-bento-border focus:border-bento-mint text-bento-text text-sm font-mono placeholder:text-bento-muted/50 focus:outline-none focus:ring-1 focus:ring-bento-mint/40 transition-all resize-none shadow-inner"
          />
        </div>

        {/* Output Format Selector */}
        <div className="mt-3">
          <p className="text-[11px] font-mono uppercase text-bento-muted mb-2">
            {t.expectedFormat}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {outputFormats.map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = outputFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => setOutputFormat(fmt.id)}
                  type="button"
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                    isSelected
                      ? "bg-bento-emerald/15 border-bento-mint text-bento-mint shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      : "bg-[#050e0c] border-bento-border text-bento-muted hover:text-bento-text hover:border-bento-borderHover"
                  }`}
                  title={fmt.description}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-medium leading-tight">{fmt.label}</span>
                  <span className="text-[9px] text-bento-muted mt-0.5 line-clamp-1">{fmt.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-bento-border/50">
        <button
          onClick={onAnalyze}
          disabled={isLoading || !promptInput.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-bento-emerald to-[#059669] hover:from-bento-mint hover:to-bento-emerald text-[#040c0a] font-semibold text-sm transition-all shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_22px_rgba(16,185,129,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{t.btnAnalyzing}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{t.btnAnalyze}</span>
            </>
          )}
        </button>

        {hasResult && (
          <button
            onClick={onIterate}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#091f19] hover:bg-[#0e2a22] border border-bento-border text-bento-mint font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Optimizar nuevamente sobre el prompt mejorado"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">{t.btnIterate}</span>
          </button>
        )}
      </div>
    </div>
  );
};
