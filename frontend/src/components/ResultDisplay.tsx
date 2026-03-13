"use client";

import { motion } from "framer-motion";
import { OutputActions } from "./OutputActions";

type ResultDisplayProps = {
  processedText: string;
  cardCount: number;
};

export const ResultDisplay = ({ processedText, cardCount }: ResultDisplayProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Rezultat</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Kartice: {cardCount}
          </p>
        </div>
      </div>
      <textarea
        readOnly
        value={processedText}
        className="min-h-[200px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900"
        aria-label="Procesirani tekst"
      />
      <OutputActions outputText={processedText} />
    </motion.section>
  );
};
