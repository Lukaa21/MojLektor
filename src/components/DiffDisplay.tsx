"use client";

import { motion } from "framer-motion";
import { OutputActions } from "./OutputActions";

type DiffOp =
  | { type: "unchanged"; value: string }
  | { type: "deleted"; value: string }
  | { type: "added"; value: string }
  | { type: "modified"; original: string; edited: string };

type DiffDisplayProps = {
  original: string;
  edited: string;
  diff: DiffOp[];
  cardCount: number;
};

const leftStyle = "min-h-[200px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900";
const rightStyle = leftStyle;

export const DiffDisplay = ({ original, edited, diff, cardCount }: DiffDisplayProps) => {
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
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Kartice: {cardCount}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Original</h3>
          <div className={leftStyle} aria-label="Originalni tekst">
            {diff.map((op, idx) => {
              if (op.type === "unchanged") return <span key={idx}>{op.value} </span>;
              if (op.type === "deleted") return <span key={idx} className="text-red-700 line-through">{op.value} </span>;
              if (op.type === "added") return <span key={idx} className="text-green-700"> </span>;
              return <span key={idx} className="text-red-700 line-through">{op.original} </span>;
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Izmijenjeno</h3>
          <div className={rightStyle} aria-label="Izmijenjeni tekst">
            {diff.map((op, idx) => {
              if (op.type === "unchanged") return <span key={idx}>{op.value} </span>;
              if (op.type === "deleted") return <span key={idx} className="text-red-400"> </span>;
              if (op.type === "added") return <span key={idx} className="text-green-700 font-semibold">{op.value} </span>;
              return <span key={idx} className="text-green-700 font-semibold">{op.edited} </span>;
            })}
          </div>
        </section>
      </div>

      <OutputActions outputText={edited} />
    </motion.section>
  );
};

export default DiffDisplay;
