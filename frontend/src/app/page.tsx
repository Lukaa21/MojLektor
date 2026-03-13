"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  type EstimateResponse,
  type ProcessResponse,
  type Language,
  type ReversibleChange,
  type ReversibleToken,
} from "../lib/api";
import { postJson } from "../lib/api";
import { processCorrectionRequest } from "../lib/correctionRequest";
import { getCurrentUser } from "../lib/auth";
import { useTokenBalance } from "../context/TokenBalanceContext";
import type { ServiceType } from "../core/models";
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
  { value: "clanak", label: "Članak" },
  { value: "zvanicni dokument", label: "Zvanični dokument" },
  { value: "knjiga", label: "Knjiga / rukopis" },
];

const languageOptions = [
  { value: "", label: "Odaberite jezik", disabled: true },
  { value: "crnogorski", label: "Crnogorski" },
  { value: "srpski", label: "Srpski" },
  { value: "hrvatski", label: "Hrvatski" },
  { value: "bosanski", label: "Bosanski" },
];

const VALIDATION_EMPTY_TEXT = "Unesite tekst prije slanja.";
const VALIDATION_TEXT_TYPE = "Odaberite vrstu teksta.";
const VALIDATION_LANGUAGE = "Odaberite jezik.";

export default function Home() {
  const conflictMessage =
    "Možete odabrati ili unos teksta ili upload fajla.";
  const router = useRouter();
  const { setBalance } = useTokenBalance();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("BOTH" as ServiceType);
  const [textType, setTextType] = useState("");
  const [language, setLanguage] = useState<Language | "">("");
  const [processedText, setProcessedText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [diffOps, setDiffOps] = useState<Array<unknown> | null>(null);
  const [reversibleChanges, setReversibleChanges] = useState<ReversibleChange[] | null>(null);
  const [reversibleTokens, setReversibleTokens] = useState<ReversibleToken[] | null>(null);
  const [cardCount, setCardCount] = useState(0);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputConflictWarning, setInputConflictWarning] = useState<string | null>(null);

  const trimmedText = useMemo(() => rawText.trim(), [rawText]);

  const validateInput = () => {
    if (!trimmedText && !file) {
      return VALIDATION_EMPTY_TEXT;
    }

    if (!textType) {
      return VALIDATION_TEXT_TYPE;
    }

    if (!language) {
      return VALIDATION_LANGUAGE;
    }

    return null;
  };

  const clearValidationAlertIfResolved = (
    field: "text-source" | "textType" | "language"
  ) => {
    setError((prev) => {
      if (!prev) {
        return prev;
      }

      if (field === "text-source" && prev === VALIDATION_EMPTY_TEXT) {
        return null;
      }

      if (field === "textType" && prev === VALIDATION_TEXT_TYPE) {
        return null;
      }

      if (field === "language" && prev === VALIDATION_LANGUAGE) {
        return null;
      }

      return prev;
    });
  };

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login?next=/");
          return;
        }
      } finally {
        setIsAuthChecking(false);
      }
    };

    void verifyAuth();
  }, [router]);

  useEffect(() => {
    if (!trimmedText && !file) {
      setInputConflictWarning(null);
    }
  }, [trimmedText, file]);

  const resetTextState = () => {
    setRawText("");
    setOriginalText("");
    setProcessedText("");
    setDiffOps(null);
    setReversibleChanges(null);
    setReversibleTokens(null);
    setEstimate(null);
    setCardCount(0);
    setError(null);
    setFileError(null);
    setInputConflictWarning(null);
  };

  const clearUploadedFile = () => {
    setFile(null);
    resetTextState();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      const data = file
        ? await submitUploadedFile(file, serviceType, textType, language as Language)
        : await processCorrectionRequest({
            rawText: trimmedText,
            serviceType,
            textType,
            language: language as Language,
          });

      setOriginalText(data.original);
      setProcessedText(data.edited);
      setDiffOps(data.diff ?? null);
      setReversibleChanges(data.changes ?? null);
      setReversibleTokens(data.tokens ?? null);
      setCardCount(data.cardCount);
      if (typeof data.remainingBalance === "number") {
        setBalance(data.remainingBalance);
      }
      if (file && data.original) {
        setRawText(data.original);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/");
        return;
      }

      if (err instanceof ApiError && err.status === 402) {
        const requiredTokens = typeof err.details?.requiredTokens === "number"
          ? err.details.requiredTokens
          : trimmedText.length;
        router.push(`/buy-tokens?requiredTokens=${requiredTokens}`);
      }
      const message = err instanceof Error ? err.message : "Greška u obradi.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (nextFile: File | null) => {
    setFileError(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    const allowed = [".txt", ".pdf", ".docx"];
    const ext = nextFile.name.includes(".")
      ? nextFile.name.slice(nextFile.name.lastIndexOf(".")).toLowerCase()
      : "";

    if (!allowed.includes(ext)) {
      setFile(null);
      setFileError("Dozvoljeni tipovi: .txt, .pdf, .docx");
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setFileError("Fajl je prevelik. Maksimalna veličina je 10MB.");
      return;
    }

    resetTextState();
    setFile(nextFile);
    clearValidationAlertIfResolved("text-source");
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
      const data = file
        ? await submitEstimateFromUploadedFile(file, serviceType, textType, language as Language)
        : await postJson<EstimateResponse>("/api/estimate", {
            rawText: trimmedText,
            serviceType,
            textType,
            language,
          });

      if (file && data.rawText) {
        setRawText(data.rawText);
      }
      setEstimate(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/");
        return;
      }

      const message = err instanceof Error ? err.message : "Greška u procjeni.";
      setError(message);
    } finally {
      setIsEstimating(false);
    }
  };

  const isBusy = isProcessing || isEstimating;

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[color:var(--background)]">
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-12">
          <Loader label="Provjera prijave..." />
        </main>
      </div>
    );
  }

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
            <TextInput
              id="rawText"
              label="Tekst za obradu"
              value={rawText}
              onChange={(value) => {
                if (file) {
                  setFile(null);
                  setFileError(null);
                  setInputConflictWarning(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }

                setRawText(value);
                if (value.trim()) {
                  clearValidationAlertIfResolved("text-source");
                }
              }}
              placeholder="Zalijepite tekst koji želite da obradite..."
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="uploadFile" className="text-sm font-medium text-slate-700">
                Ili upload fajl (.txt, .pdf, .docx)
              </label>
              <div className="relative flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  id="uploadFile"
                  type="file"
                  aria-label="Upload fajla"
                  accept=".txt,.pdf,.docx"
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    handleFileChange(selected);
                  }}
                  disabled={!!trimmedText}
                  className="block w-full cursor-pointer text-sm text-slate-700 file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-slate-200 file:bg-white file:px-4 file:py-2 file:text-xs file:font-medium disabled:cursor-not-allowed"
                />
                {trimmedText ? (
                  <button
                    type="button"
                    aria-label="Upozorenje: aktivan je unos teksta"
                    onClick={() => setInputConflictWarning(conflictMessage)}
                    className="absolute left-0 right-9 top-0 h-full cursor-pointer rounded-full bg-transparent"
                  />
                ) : null}
                {file ? (
                  <button
                    type="button"
                    aria-label="Ukloni fajl"
                    onClick={clearUploadedFile}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    x
                  </button>
                ) : null}
              </div>
              {fileError ? <p className="text-xs text-red-600">{fileError}</p> : null}
              {inputConflictWarning ? (
                <div className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                  <span>{inputConflictWarning}</span>
                </div>
              ) : null}
            </div>
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
              onChange={(value) => {
                setTextType(value);
                if (value) {
                  clearValidationAlertIfResolved("textType");
                }
              }}
            />
            <SelectInput
              id="language"
              label="Jezik"
              value={language}
              options={languageOptions}
              onChange={(value) => {
                setLanguage(value as Language);
                if (value) {
                  clearValidationAlertIfResolved("language");
                }
              }}
            />
            <div className="mt-auto grid gap-3">
              <button
                type="button"
                onClick={handleProcess}
                disabled={isBusy}
                className="w-full cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Pošalji na obradu
              </button>
              <button
                type="button"
                onClick={handleEstimate}
                disabled={isBusy}
                className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Procijeni tokene
              </button>
            </div>
          </div>
        </motion.section>

        {estimate ? (
          <EstimateDisplay
            requiredTokens={estimate.requiredTokens}
            currentBalance={estimate.currentBalance}
            canProcess={estimate.canProcess}
            suggestedPackage={estimate.suggestedPackage}
            nextLowerPackage={estimate.nextLowerPackage}
            differenceToLowerPackage={estimate.differenceToLowerPackage}
          />
        ) : null}
        {diffOps ? (
          <DiffDisplay
            original={originalText}
            edited={processedText}
            diff={diffOps as ProcessResponse["diff"]}
            changes={reversibleChanges ?? []}
            tokens={reversibleTokens ?? []}
            cardCount={cardCount}
          />
        ) : processedText ? (
          <ResultDisplay processedText={processedText} cardCount={cardCount} />
        ) : null}
      </main>
    </div>
  );
}

const submitUploadedFile = async (
  file: File,
  serviceType: ServiceType,
  textType: string,
  language: Language
): Promise<ProcessResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("serviceType", serviceType);
  formData.append("textType", textType);
  formData.append("language", language);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as
    | ProcessResponse
    | { error?: { code?: string; message?: string } };

  if (!response.ok) {
    const errorPayload =
      typeof payload === "object" && payload !== null && "error" in payload
        ? payload.error
        : undefined;

    const message =
      errorPayload?.message
        ? errorPayload.message
        : "Neuspješan upload.";

    throw new ApiError(
      message,
      response.status,
      errorPayload?.code,
      payload as unknown as Record<string, unknown>
    );
  }

  return payload as ProcessResponse;
};

const submitEstimateFromUploadedFile = async (
  file: File,
  serviceType: ServiceType,
  textType: string,
  language: Language
): Promise<EstimateResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("serviceType", serviceType);
  formData.append("textType", textType);
  formData.append("language", language);

  const response = await fetch("/api/estimate", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as
    | EstimateResponse
    | { error?: string | { code?: string; message?: string } };

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? typeof payload.error === "string"
          ? payload.error
          : payload.error?.message || "Neuspješna procjena fajla."
        : "Neuspješna procjena fajla.";
    throw new ApiError(
      message,
      response.status,
      undefined,
      payload as unknown as Record<string, unknown>
    );
  }

  return payload as EstimateResponse;
};
