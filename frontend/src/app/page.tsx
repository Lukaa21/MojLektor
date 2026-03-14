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
import { Loader } from "../components/Loader";
import { ResultDisplay } from "../components/ResultDisplay";

const serviceCards: { value: ServiceType; icon: string; label: string; desc: string }[] = [
  { value: "LEKTURA" as ServiceType, icon: "✎", label: "Lektura", desc: "Gramatika, pravopis i interpunkcija." },
  { value: "KOREKTURA" as ServiceType, icon: "✦", label: "Korektura", desc: "Stilska poboljšanja i jasnoća teksta." },
  { value: "BOTH" as ServiceType, icon: "✯", label: "Kombinovano", desc: "Potpuna obrada i rafiniranje teksta." },
];

const languageChips: { value: Language; label: string }[] = [
  { value: "crnogorski", label: "Crnogorski" },
  { value: "srpski", label: "Srpski" },
  { value: "hrvatski", label: "Hrvatski" },
  { value: "bosanski", label: "Bosanski" },
];

const textTypeChips = [
  { value: "akademski rad", label: "Akademski" },
  { value: "clanak", label: "Novinarski" },
  { value: "knjiga", label: "Književni" },
  { value: "zvanicni dokument", label: "Poslovni" },
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
      <div className="container" style={{ paddingTop: 80, textAlign: "center" }}>
        <Loader label="Provjera prijave..." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="container"
      style={{ paddingTop: 60, paddingBottom: 80 }}
    >
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
          Vratite snagu svojim riječima.
        </h1>
        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 24 }}>
          {["Podrška za 4 jezika", "Reverzibilne izmjene", "Trenutna obrada"].map(
            (feature) => (
              <span
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  color: "var(--text-muted)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--bg-subtle)",
                    color: "var(--accent)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </span>
                {feature}
              </span>
            )
          )}
        </div>
      </section>

      {/* Section 2 — Service type selector */}
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

      {/* Section 3 — Chip selectors */}
      <section style={{ display: "flex", gap: 40, marginBottom: 32, flexWrap: "wrap" }}>
        <div>
          <div className="selector-label">Varijanta jezika</div>
          <div className="chip-group">
            {languageChips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className={`chip${language === chip.value ? " active" : ""}`}
                onClick={() => {
                  setLanguage(chip.value);
                  clearValidationAlertIfResolved("language");
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="selector-label">Tip teksta</div>
          <div className="chip-group">
            {textTypeChips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className={`chip${textType === chip.value ? " active" : ""}`}
                onClick={() => {
                  setTextType(chip.value);
                  clearValidationAlertIfResolved("textType");
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Editor */}
      <section style={{ marginBottom: 32 }}>
        <div className="editor-container">
          <textarea
            value={rawText}
            onChange={(e) => {
              if (file) {
                setFile(null);
                setFileError(null);
                setInputConflictWarning(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }
              setRawText(e.target.value);
              if (e.target.value.trim()) {
                clearValidationAlertIfResolved("text-source");
              }
            }}
            placeholder="Unesite ili nalijepite vaš tekst ovdje..."
          />
          <div
            className="upload-zone"
            onClick={() => {
              if (trimmedText) {
                setInputConflictWarning(conflictMessage);
                return;
              }
              fileInputRef.current?.click();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.docx"
              style={{ display: "none" }}
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                handleFileChange(selected);
              }}
              disabled={!!trimmedText}
            />
            {file ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                📎 {file.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearUploadedFile();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: 16,
                  }}
                >
                  ✕
                </button>
              </span>
            ) : (
              <span>📎 Priložite dokument (.docx, .pdf ili .txt)</span>
            )}
          </div>
        </div>
        {fileError && (
          <p style={{ color: "var(--error)", fontSize: 13, marginTop: 8 }}>{fileError}</p>
        )}
        {inputConflictWarning && (
          <div
            style={{
              marginTop: 8,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid #f0c040",
              background: "#fefbe8",
              fontSize: 14,
              color: "#8a6d00",
            }}
          >
            {inputConflictWarning}
          </div>
        )}
      </section>

      {/* Section 5 — Action buttons */}
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
          className="btn-secondary"
          onClick={handleEstimate}
          disabled={isBusy}
        >
          Procijeni tokene
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleProcess}
          disabled={isBusy}
        >
          Pokreni AI obradu
        </button>
      </section>

      {/* Error / Loader */}
      {error && <ErrorMessage message={error} />}
      {isProcessing && <Loader label="Obrada u toku..." />}
      {isEstimating && <Loader label="Procjena u toku..." />}

      {/* Section 6 — Estimate */}
      {estimate && (
        <EstimateDisplay
          requiredTokens={estimate.requiredTokens}
          currentBalance={estimate.currentBalance}
          canProcess={estimate.canProcess}
          suggestedPackage={estimate.suggestedPackage}
          nextLowerPackage={estimate.nextLowerPackage}
          differenceToLowerPackage={estimate.differenceToLowerPackage}
          serviceType={serviceType}
        />
      )}

      {/* Section 7 — Diff / Result */}
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
    </motion.div>
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
