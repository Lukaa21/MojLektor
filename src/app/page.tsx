"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  postJson,
  type EstimateResponse,
  type ProcessResponse,
  type Language,
  type ServiceType,
} from "../lib/api";
import DiffDisplay from "../components/DiffDisplay";
import { EstimateDisplay } from "../components/EstimateDisplay";
import { ErrorMessage } from "../components/Error";
import { Header } from "../components/Header";
import { Loader } from "../components/Loader";
import { ResultDisplay } from "../components/ResultDisplay";
import { SelectInput } from "../components/SelectInput";
import { TextInput } from "../components/TextInput";

const serviceOptions = [
  { value: "LEKTURA", label: "Lektura" },
  { value: "KOREKTURA", label: "Korektura" },
  { value: "BOTH", label: "Lektura + Korektura" },
];

const textTypeOptions = [
  { value: "", label: "Odaberite vrstu teksta", disabled: true },
  { value: "akademski rad", label: "Akademski rad" },
  { value: "clanak", label: "Clanak" },
  { value: "zvanicni dokument", label: "Zvanicni dokument" },
  { value: "knjiga", label: "Knjiga / rukopis" },
];

const languageOptions = [
  { value: "", label: "Odaberite jezik", disabled: true },
  { value: "crnogorski", label: "Crnogorski" },
  { value: "srpski", label: "Srpski" },
  { value: "hrvatski", label: "Hrvatski" },
  { value: "bosanski", label: "Bosanski" },
];

export default function Home() {
  const [rawText, setRawText] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("LEKTURA");
  const [textType, setTextType] = useState("");
  const [language, setLanguage] = useState<Language | "">("");
  const [processedText, setProcessedText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [diffOps, setDiffOps] = useState<Array<unknown> | null>(null);
  const [cardCount, setCardCount] = useState(0);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedText = useMemo(() => rawText.trim(), [rawText]);

  const validateInput = () => {
    if (!trimmedText) {
      return "Unesite tekst prije slanja.";
    }

    if (!textType) {
      return "Odaberite vrstu teksta.";
    }

    if (!language) {
      return "Odaberite jezik.";
    }

    return null;
  };

  const handleProcess = async () => {
    setError(null);
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setProcessedText("");

    try {
      const data = await postJson<ProcessResponse>("/api/process", {
        rawText: trimmedText,
        serviceType,
        textType,
        language,
      });

      setOriginalText(data.original);
      setProcessedText(data.edited);
      setDiffOps(data.diff ?? null);
      setCardCount(data.cardCount);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Greska u obradi.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEstimate = async () => {
    setError(null);
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsEstimating(true);
    setEstimate(null);

    try {
      const data = await postJson<EstimateResponse>("/api/estimate", {
        rawText: trimmedText,
        serviceType,
        textType,
        language,
      });
      setEstimate(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Greska u procjeni.";
      setError(message);
    } finally {
      setIsEstimating(false);
    }
  };

  const isBusy = isProcessing || isEstimating;

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-12">
        <Header
          title="MojLektor"
          subtitle="Automatizovana lektura i korektura za tekstove sa balkanskog govornog podrucja. Fokus na citljivost, jasnocu i uredan akademski stil."
        />

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[2fr_1fr]"
        >
          <div className="flex flex-col gap-5">
            <TextInput
              id="rawText"
              label="Tekst za obradu"
              value={rawText}
              onChange={setRawText}
              placeholder="Zalijepite tekst koji zelite da obradite..."
            />
            {error ? <ErrorMessage message={error} /> : null}
            {isProcessing ? <Loader label="Obrada u toku..." /> : null}
            {isEstimating ? <Loader label="Procjena u toku..." /> : null}
          </div>

          <div className="flex flex-col gap-5">
            <SelectInput
              id="serviceType"
              label="Usluga"
              value={serviceType}
              options={serviceOptions}
              onChange={(value) => setServiceType(value as ServiceType)}
            />
            <SelectInput
              id="textType"
              label="Vrsta teksta"
              value={textType}
              options={textTypeOptions}
              onChange={setTextType}
            />
            <SelectInput
              id="language"
              label="Jezik"
              value={language}
              options={languageOptions}
              onChange={(value) => setLanguage(value as Language)}
            />
            <div className="mt-auto grid gap-3">
              <button
                type="button"
                onClick={handleProcess}
                disabled={isBusy}
                className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Posalji na obradu
              </button>
              <button
                type="button"
                onClick={handleEstimate}
                disabled={isBusy}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Procijeni cijenu
              </button>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Obrada se izvrsava sekvencijalno po karticama. Rezultat zadrzava
              originalni redoslijed.
            </p>
          </div>
        </motion.section>

        {estimate ? (
          <EstimateDisplay
            cardCount={estimate.cardCount}
            perCard={estimate.priceBreakdown.perCard}
            subtotal={estimate.priceBreakdown.subtotal}
            totalPrice={estimate.totalPrice}
          />
        ) : null}
        {diffOps ? (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - diff shape is dynamic from backend
          <DiffDisplay original={originalText} edited={processedText} diff={diffOps} cardCount={cardCount} />
        ) : processedText ? (
          <ResultDisplay processedText={processedText} cardCount={cardCount} />
        ) : null}
      </main>
    </div>
  );
}
