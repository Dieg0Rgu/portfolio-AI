"use client";

import React from "react";
import { Sparkles, Languages } from "lucide-react";
import { Language } from "@/types";

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  isGatewayActive: boolean | null;
  lastLatency: number | null;
  t: Record<string, string>;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  isGatewayActive,
  lastLatency,
  t,
}) => {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-bento-border/50">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-bento-panel border border-bento-border shadow-bento text-bento-emerald flex items-center justify-center">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-bento-text">
              {t.appTitle}
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-bento-emerald/10 text-bento-mint border border-bento-emerald/20">
              v2.5 Bento
            </span>
          </div>
          <p className="text-xs text-bento-muted mt-0.5">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Gateway indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bento-panel border border-bento-border text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isGatewayActive === true
                  ? "bg-bento-emerald shadow-[0_0_8px_#10b981]"
                  : isGatewayActive === false
                  ? "bg-amber-400"
                  : "bg-gray-500 animate-ping"
              }`}
            />
            <span className="text-bento-muted text-[11px]">
              {isGatewayActive === true ? t.gatewayActive : t.gatewayDirect}
            </span>
          </div>
          {lastLatency !== null && (
            <span className="text-[10px] text-bento-muted/70 pl-1 border-l border-bento-border">
              {lastLatency}ms
            </span>
          )}
        </div>

        {/* Language switcher */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bento-panel border border-bento-border hover:border-bento-borderHover text-xs font-medium text-bento-text transition-colors shadow-sm"
          title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
        >
          <Languages className="w-3.5 h-3.5 text-bento-mint" />
          <span className="font-mono uppercase text-bento-mint">{lang}</span>
        </button>
      </div>
    </header>
  );
};
