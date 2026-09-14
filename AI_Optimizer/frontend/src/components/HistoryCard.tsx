"use client";

import React from "react";
import { Clock, Trash2, ArrowRight } from "lucide-react";
import { HistoryItem } from "@/types";

interface HistoryCardProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  t: Record<string, string>;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  history,
  onSelect,
  onClear,
  t,
}) => {
  return (
    <div className="bento-card p-5 flex flex-col justify-between h-full bg-bento-panel border-bento-border shadow-bento">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-bento-border/50 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-bento-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-bento-emerald" />
              {t.tileHistory}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#050e0c] text-bento-muted border border-bento-border">
              {history.length}
            </span>
          </div>

          {history.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-[11px] font-mono text-red-400 hover:text-red-300 transition-colors px-2 py-0.5 rounded hover:bg-red-500/10"
              title="Limpiar historial de prompts"
            >
              <Trash2 className="w-3 h-3" />
              <span>{t.btnClearHistory}</span>
            </button>
          )}
        </div>

        {/* History List */}
        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
          {history.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-bento-muted/50 italic text-xs">
              {t.emptyHistory}
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className="p-3 rounded-xl bg-[#050e0c] border border-bento-border/60 hover:border-bento-mint/60 hover:bg-[#071612] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-bento-muted mb-1">
                  <span>{item.date}</span>
                  <div className="flex items-center gap-1.5">
                    {item.ahorro && (
                      <span className="text-bento-mint font-semibold">
                        +{item.ahorro.porcentaje_ahorro}% {t.historySavingsBadge}
                      </span>
                    )}
                    <span className="px-1.5 py-0.2 rounded bg-bento-emerald/10 text-bento-mint border border-bento-emerald/20">
                      {item.scores ? `${item.scores.calidad_general}/10` : ""}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-mono text-bento-text line-clamp-2 group-hover:text-white transition-colors">
                  {item.prompt_original}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-bento-border/20 text-[10px] text-bento-muted">
                  <span className="font-mono">{item.rol_detectado}</span>
                  <span className="flex items-center gap-0.5 text-bento-mint opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.historyLoadBtn}
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-bento-border/30 text-[10px] text-bento-muted font-mono flex items-center justify-between">
        <span>{t.cacheLabel}</span>
        <span>Local & Isolated</span>
      </div>
    </div>
  );
};
