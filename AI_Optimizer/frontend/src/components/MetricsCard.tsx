"use client";

import React from "react";
import { BarChart3, ShieldCheck, Tag, Globe2 } from "lucide-react";
import { PromptScores, MetricKey } from "@/types";

interface MetricsCardProps {
  scores?: PromptScores;
  rol?: string;
  tipoPrompt?: string;
  idioma?: string;
  t: Record<string, string>;
}

const METRIC_KEYS: { key: MetricKey; labelKey: string }[] = [
  { key: "claridad", labelKey: "clarity" },
  { key: "especificidad", labelKey: "specificity" },
  { key: "objetividad", labelKey: "objectivity" },
  { key: "veracidad", labelKey: "truthfulness" },
  { key: "contexto", labelKey: "context" },
  { key: "coherencia", labelKey: "coherence" },
  { key: "calidad_general", labelKey: "overallQuality" },
];

export const MetricsCard: React.FC<MetricsCardProps> = ({
  scores,
  rol,
  tipoPrompt,
  idioma,
  t,
}) => {
  return (
    <div className="bento-card p-5 flex flex-col justify-between h-full bg-bento-panel border-bento-border shadow-bento">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase text-bento-muted flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-bento-emerald" />
            {t.tileQualityScores}
          </span>
          {scores && (
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-bento-emerald/15 text-bento-mint border border-bento-emerald/30">
              {scores.calidad_general}/10
            </span>
          )}
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {rol && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#050e0c] border border-bento-border text-[11px] text-bento-text">
              <ShieldCheck className="w-3 h-3 text-bento-mint" />
              <span className="text-bento-muted font-mono">{t.roleDetected}:</span>
              <strong className="font-medium text-bento-mint">{rol}</strong>
            </span>
          )}
          {tipoPrompt && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#050e0c] border border-bento-border text-[11px] text-bento-text">
              <Tag className="w-3 h-3 text-bento-emerald" />
              <span className="text-bento-muted font-mono">{t.promptType}:</span>
              <strong className="font-medium">{tipoPrompt}</strong>
            </span>
          )}
          {idioma && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#050e0c] border border-bento-border text-[11px] text-bento-text">
              <Globe2 className="w-3 h-3 text-bento-emerald" />
              <span className="text-bento-muted font-mono">{t.languageDetected}:</span>
              <strong className="font-medium">{idioma}</strong>
            </span>
          )}
        </div>

        {/* Metrics List */}
        <div className="space-y-2.5">
          {METRIC_KEYS.map(({ key, labelKey }) => {
            const val = scores ? scores[key] : 0;
            const percentage = Math.min(Math.max((val / 10) * 100, 0), 100);
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-bento-muted">
                    {t[labelKey] || key.replace("_", " ")}
                  </span>
                  <span className="font-mono text-xs font-semibold text-bento-text">
                    {scores ? `${val}/10` : "-"}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#050e0c] rounded-full overflow-hidden border border-bento-border/20">
                  <div
                    className="h-full bg-gradient-to-r from-bento-emerald to-bento-mint rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
