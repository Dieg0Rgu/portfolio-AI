"use client";

import React from "react";
import { TrendingUp, Zap } from "lucide-react";
import { TokenSavings } from "@/types";

interface SavingsCardProps {
  savings?: TokenSavings;
  t: Record<string, string>;
}

export const SavingsCard: React.FC<SavingsCardProps> = ({ savings, t }) => {
  if (!savings) {
    return (
      <div className="bento-card p-5 flex flex-col justify-between h-full bg-bento-panel/70 border-dashed border-bento-border/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-bento-muted flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-bento-emerald" />
            {t.tokenSavings}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-bento-emerald/10 text-bento-mint font-mono">
            {t.optimizedTokensBadge}
          </span>
        </div>
        <div className="my-6 text-center">
          <p className="text-3xl font-bold font-mono text-bento-muted/50">--%</p>
          <p className="text-xs text-bento-muted mt-1">{t.noTokensYet}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-bento-border/30 text-center">
          <div>
            <p className="text-[10px] text-bento-muted uppercase">{t.tokensSaved}</p>
            <p className="text-xs font-mono font-bold text-bento-muted/50">0</p>
          </div>
          <div>
            <p className="text-[10px] text-bento-muted uppercase">{t.costSavedPer1k}</p>
            <p className="text-xs font-mono font-bold text-bento-muted/50">$0.00</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    porcentaje_ahorro,
    tokens_ahorrados,
    costo_ahorrado_usd_1k,
    iteraciones_ahorradas,
  } = savings;

  return (
    <div className="bento-card p-5 flex flex-col justify-between h-full bg-gradient-to-br from-bento-panel to-[#061813] border-bento-border shadow-bento">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase text-bento-muted flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-bento-emerald" />
          {t.tokenSavings}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bento-emerald/15 text-bento-mint border border-bento-emerald/30 font-mono font-semibold">
          {t.optimizedTokensBadge}
        </span>
      </div>

      <div className="my-4 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold font-mono text-bento-mint tracking-tight">
              +{porcentaje_ahorro}%
            </span>
          </div>
          <p className="text-[11px] text-bento-muted mt-0.5">
            {t.optimizedCostText}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-bento-emerald/10 border border-bento-emerald/20 text-bento-emerald">
          <Zap className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-bento-border/50 text-center">
        <div className="p-2 rounded-lg bg-black/20 border border-bento-border/30">
          <p className="text-[10px] text-bento-muted uppercase tracking-wider">{t.tokensSaved}</p>
          <p className="text-sm font-mono font-bold text-bento-text mt-0.5">
            {tokens_ahorrados.toLocaleString()}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-black/20 border border-bento-border/30">
          <p className="text-[10px] text-bento-muted uppercase tracking-wider">{t.costSavedPer1k}</p>
          <p className="text-sm font-mono font-bold text-bento-mint mt-0.5">
            ${costo_ahorrado_usd_1k.toFixed(4)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-black/20 border border-bento-border/30">
          <p className="text-[10px] text-bento-muted uppercase tracking-wider">{t.turnsLabel}</p>
          <p className="text-sm font-mono font-bold text-bento-text mt-0.5">
            {iteraciones_ahorradas}
          </p>
        </div>
      </div>
    </div>
  );
};
