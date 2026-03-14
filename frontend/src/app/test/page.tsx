"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { ServiceType } from "../../core/models";
import DiffDisplay from "../../components/DiffDisplay";
import { ErrorMessage } from "../../components/Error";
import { Loader } from "../../components/Loader";
import { demoTexts, type DemoTextTypeKey } from "../../data/demoTexts";
import {
  processDemoCorrectionRequest,
  type CorrectionRequestInput,
} from "../../lib/correctionRequest";
import type { DiffOp, ReversibleChange, ReversibleToken } from "../../lib/api";

const serviceCards: { value: ServiceType; icon: string; label: string; desc: string }[] = [
  { value: "LEKTURA" as ServiceType, icon: "✎", label: "Lektura", desc: "Stilska i jezička dorađenost" },
  { value: "KOREKTURA" as ServiceType, icon: "✦", label: "Korektura", desc: "Pravopis, interpunkcija, greške" },
  { value: "BOTH" as ServiceType, icon: "✯", label: "Kombinovano", desc: "Sve u jednom prolazu" },
];

const textTypeChips = [
  { value: "akademski rad", label: "Akademski" },
  { value: "clanak", label: "Novinarski" },
];

const VALIDATION_EMPTY_TEXT = "Unesite tekst prije slanja.";

const mapTextTypeToDemoKey = (textType: string): DemoTextTypeKey =>
  textType === "clanak" ? "clanak" : "akademski";

export default function TestPage() {
  const [serviceType, setServiceType] = useState<ServiceType>("BOTH" as ServiceType);
  const [textType, setTextType] = useState("akademski rad");
  const [rawText, setRawText] = useState(demoTexts.akademski);
  const [processedText, setProcessedText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [diffOps, setDiffOps] = useState<DiffOp[] | null>(null);
  const [reversibleChanges, setReversibleChanges] = useState<ReversibleChange[] | null>(null);
  const [reversibleTokens, setReversibleTokens] = useState<ReversibleToken[] | null>(null);
  const [cardCount, setCardCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedText = useMemo(() => rawText.trim(), [rawText]);

  useEffect(() => {
    const key = mapTextTypeToDemoKey(textType);
    setRawText(demoTexts[key]);
    setProcessedText("");
    setOriginalText("");
    setDiffOps(null);
    setReversibleChanges(null);
    setReversibleTokens(null);
    setCardCount(0);
    setError(null);
  }, [textType]);

  const handleProcess = async () => {
    setError(null);

    if (!trimmedText) {
      setError(VALIDATION_EMPTY_TEXT);
      return;
    }

    setIsProcessing(true);
    setProcessedText("");

    try {
      const input: CorrectionRequestInput = {
        rawText: trimmedText,
        serviceType,
        textType,
        language: "srpski",
      };

      const data = await processDemoCorrectionRequest(input);
      setOriginalText(data.original);
      setProcessedText(data.edited);
      setDiffOps(data.diff ?? null);
      setReversibleChanges(data.changes ?? null);
      setReversibleTokens(data.tokens ?? null);
      setCardCount(data.cardCount);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Greška u demo obradi.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="container"
      style={{ paddingTop: 60, paddingBottom: 80 }}
    >
      {/* Demo banner */}
      <div
        style={{
          padding: "12px 20px",
          borderRadius: "var(--radius-md)",
          background: "var(--accent-soft)",
          color: "var(--accent)",
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        Demo režim – testirajte funkcionalnost bez potrošnje tokena.
      </div>

      {/* Section 1 — Intro */}
      <section style={{ textAlign: "center", marginBottom: "var(--section-gap)" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 42,
            fontWeight: 400,
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          Demo obrada teksta
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
          Odaberite uslugu i vrstu teksta, pa pokrenite obradu.
        </p>
      </section>

      {/* Service cards */}
      <section style={{ marginBottom: 32 }}>
        <div className="selector-label">Vrsta usluge</div>
        <div className="service-grid">
          {serviceCards.map((card) => (
            <button
              key={card.value}
              type="button"
              className={`service-card${serviceType === card.value ? " active" : ""}`}
              onClick={() => setServiceType(card.value)}
            >
              <span className="service-icon">{card.icon}</span>
              <h3>{card.label}</h3>
              <p>{card.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Chip selectors */}
      <section style={{ display: "flex", gap: 40, marginBottom: 32, flexWrap: "wrap" }}>
        <div>
          <div className="selector-label">Tip teksta</div>
          <div className="chip-group">
            {textTypeChips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className={`chip${textType === chip.value ? " active" : ""}`}
                onClick={() => setTextType(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="selector-label">Varijanta jezika</div>
          <div className="chip-group">
            <span
              className="chip active"
              style={{ cursor: "default" }}
            >
              Srpski
            </span>
          </div>
        </div>
      </section>

      {/* Editor (read-only) */}
      <section style={{ marginBottom: 32 }}>
        <div className="editor-container">
          <textarea
            value={rawText}
            readOnly
            style={{ cursor: "default", opacity: 0.8 }}
            placeholder="Demo tekst je učitan automatski..."
          />
        </div>
      </section>

      {/* Action buttons */}
      <section
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 16,
          marginBottom: "var(--section-gap)",
        }}
      >
        <button
          type="button"
          className="btn-primary"
          onClick={handleProcess}
          disabled={isProcessing}
        >
          Pokreni demo obradu
        </button>
      </section>

      {/* Error / Loader */}
      {error && <ErrorMessage message={error} />}
      {isProcessing && <Loader label="Obrada u toku..." />}

      {/* Diff result */}
      {diffOps ? (
        <DiffDisplay
          original={originalText}
          edited={processedText}
          diff={diffOps}
          changes={reversibleChanges ?? []}
          tokens={reversibleTokens ?? []}
          cardCount={cardCount}
        />
      ) : null}
    </motion.div>
  );
}
