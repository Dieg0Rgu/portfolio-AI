"use client";

import React from "react";
import { Lightbulb, CheckCircle2, AlertCircle } from "lucide-react";
import { PromptImprovementDetails, PromptFlaws } from "@/types";

interface ImprovementDetailsCardProps {
  detalles?: PromptImprovementDetails;
  sugerencias?: string;
  fallas?: PromptFlaws;
  t: Record<string, string>;
}

export const ImprovementDetailsCard: React.FC<ImprovementDetailsCardProps> = ({
  detalles,
  sugerencias,
  fallas,
  t,
}) => {
  return (
    <div className="bento-card p-5 flex flex-col justify-between h-full bg-bento-panel border-bento-border shadow-bento">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-bento-border/50 mb-3">
          <span className="text-xs font-mono uppercase text-bento-muted flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-bento-emerald" />
            {t.tileSuggestions}
          </span>
          {detalles?.tecnicas_aplicadas && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bento-emerald/10 text-bento-mint border border-bento-emerald/20">
              {detalles.tecnicas_aplicadas.length} {t.techniquesBadge}
            </span>
          )}
        </div>

        {/* Flaws Identified Badge Row */}
        {fallas && fallas.detalles && fallas.detalles.length > 0 && (
          <div className="mb-3 p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs">
            <p className="text-[11px] font-mono uppercase text-amber-400 font-semibold mb-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {t.flawsDetected}
            </p>
            <ul className="space-y-1 text-amber-200/90 text-xs pl-2">
              {fallas.detalles.map((f, idx) => (
                <li key={idx} className="list-disc list-inside">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Applied Techniques Pills */}
        {detalles?.tecnicas_aplicadas && detalles.tecnicas_aplicadas.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-mono uppercase text-bento-muted mb-1.5">
              {t.techniquesApplied}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {detalles.tecnicas_aplicadas.map((tec, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-bento-emerald/10 text-bento-mint border border-bento-emerald/20 text-[10px] font-mono"
                >
                  {tec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Suggestions / Strategic Guidance */}
        {sugerencias && (
          <div className="mb-3 p-3 rounded-xl bg-[#050e0c] border border-bento-border/60 text-xs leading-relaxed">
            <p className="text-[10px] font-mono uppercase text-bento-mint font-semibold mb-1 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-bento-emerald" />
              {t.strategicGuidance || t.tileSuggestions}
            </p>
            <p className="text-bento-text/90 whitespace-pre-line">{sugerencias}</p>
          </div>
        )}

        {/* Key Improvements */}
        {detalles?.mejoras_clave && detalles.mejoras_clave.length > 0 && (
          <div className="space-y-1.5 mb-3">
            <p className="text-[10px] font-mono uppercase text-bento-muted mb-1">
              {t.keyImprovements}
            </p>
            {detalles.mejoras_clave.map((m, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-bento-text">
                <CheckCircle2 className="w-3.5 h-3.5 text-bento-emerald shrink-0 mt-0.5" />
                <span>{m}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Impact & Next Action Footer */}
      {detalles && (
        <div className="mt-3 pt-3 border-t border-bento-border/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {detalles.impacto_estimado && (
            <div className="p-2 rounded-lg bg-[#050e0c] border border-bento-border/30">
              <span className="text-[10px] text-bento-muted uppercase font-mono block">
                {t.estimatedImpact}
              </span>
              <span className="text-bento-mint font-medium mt-0.5 block line-clamp-2">
                {detalles.impacto_estimado}
              </span>
            </div>
          )}
          {detalles.proxima_accion && (
            <div className="p-2 rounded-lg bg-[#050e0c] border border-bento-border/30">
              <span className="text-[10px] text-bento-muted uppercase font-mono block">
                {t.nextAction}
              </span>
              <span className="text-bento-text font-medium mt-0.5 block line-clamp-2">
                {detalles.proxima_accion}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
