"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type ResultDisplayProps = {
  processedText: string;
  cardCount: number;
};

export const ResultDisplay = ({ processedText, cardCount }: ResultDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(processedText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

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
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          {copied ? "Kopirano" : "Kopiraj"}
        </button>
      </div>
      <textarea
        readOnly
        value={processedText}
        className="min-h-[200px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900"
        aria-label="Procesirani tekst"
      />
    </motion.section>
  );
};
