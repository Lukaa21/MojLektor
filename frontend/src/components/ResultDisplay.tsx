"use client";

import { motion } from "framer-motion";
import { OutputActions } from "./OutputActions";
import "./ResultDisplay.css";

type ResultDisplayProps = {
  processedText: string;
  cardCount: number;
};

export const ResultDisplay = ({ processedText, cardCount }: ResultDisplayProps) => {
  return (
    <motion.section
      className="result-display-section"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      aria-live="polite"
    >
      <div className="result-display-header">
        <div>
          <h2 className="result-display-title">
            Rezultat
          </h2>
          <p className="result-display-subtitle">
            Kartice: {cardCount}
          </p>
        </div>
      </div>
      <div className="diff-box">
        <textarea
          readOnly
          value={processedText}
          className="result-display-textarea"
          aria-label="Procesirani tekst"
        />
      </div>
      <OutputActions outputText={processedText} />
    </motion.section>
  );
};
