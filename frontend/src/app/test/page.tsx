"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { ServiceType } from "../../../../src/core/models";
import DiffDisplay from "../../components/DiffDisplay";
import { ErrorMessage } from "../../components/Error";
import { Header } from "../../components/Header";
import { Loader } from "../../components/Loader";
import { SelectInput } from "../../components/SelectInput";
import { TextInput } from "../../components/TextInput";
import { demoTexts, type DemoTextTypeKey } from "../../data/demoTexts";
import {
  processDemoCorrectionRequest,
  type CorrectionRequestInput,
} from "../../lib/correctionRequest";
import type { DiffOp, ReversibleChange, ReversibleToken } from "../../lib/api";

const serviceOptions = [
  { value: "LEKTURA", label: "Lektura" },
  { value: "KOREKTURA", label: "Korektura" },
  { value: "BOTH", label: "Lektura + Korektura" },
];

const textTypeOptions = [
  { value: "akademski rad", label: "Akademski rad" },
  { value: "clanak", label: "Članak" },
];

const languageOptions = [{ value: "srpski", label: "Srpski" }];

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
    <div className="min-h-screen bg-[color:var(--background)]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-12">
        <Header
          title="MojLektor"
          subtitle="Automatizovana lektura i korektura za tekstove sa balkanskog govornog područja. Fokus na čitljivosti, jasnoći i urednom akademskom stilu."
        />

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[2fr_1fr]"
        >
          <div className="flex flex-col gap-5">
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Demo režim – testirajte funkcionalnost bez obrade stvarnog teksta.
            </p>
            <TextInput
              id="rawTextDemo"
              label="Tekst za obradu"
              value={rawText}
              disabled
              onChange={() => undefined}
              placeholder="Demo tekst je učitan automatski na osnovu odabrane vrste teksta..."
            />
            {error ? <ErrorMessage message={error} /> : null}
            {isProcessing ? <Loader label="Obrada u toku..." /> : null}
          </div>

          <div className="flex flex-col gap-5">
            <SelectInput
              id="serviceTypeDemo"
              label="Usluga"
              value={serviceType}
              options={serviceOptions}
              onChange={(value) => setServiceType(value as ServiceType)}
            />
            <SelectInput
              id="textTypeDemo"
              label="Vrsta teksta"
              value={textType}
              options={textTypeOptions}
              onChange={(value) => setTextType(value)}
            />
            <SelectInput
              id="languageDemo"
              label="Jezik"
              value="srpski"
              options={languageOptions}
              disabled
              onChange={() => undefined}
            />
            <div className="mt-auto grid gap-3">
              <button
                type="button"
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Pokreni
              </button>
            </div>
          </div>
        </motion.section>

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
      </main>
    </div>
  );
}
