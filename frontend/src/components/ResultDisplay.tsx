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
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-lg)",
        padding: 32,
        marginBottom: 32,
      }}
      aria-live="polite"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 24,
              fontWeight: 400,
              marginBottom: 4,
            }}
          >
            Rezultat
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Kartice: {cardCount}
          </p>
        </div>
      </div>
      <div className="diff-box">
        <textarea
          readOnly
          value={processedText}
          style={{
            width: "100%",
            minHeight: 200,
            border: "none",
            background: "transparent",
            fontFamily: "var(--font-serif)",
            fontSize: 19,
            lineHeight: 1.8,
            color: "var(--text-main)",
            outline: "none",
            resize: "vertical",
          }}
          aria-label="Procesirani tekst"
        />
      </div>
      <OutputActions outputText={processedText} />
    </motion.section>
  );
};
