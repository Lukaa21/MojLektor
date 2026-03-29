"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { DiffOp, ReversibleChange, ReversibleToken } from "../lib/api";
import BatchConfirmationModal from "./BatchConfirmationModal";
import { OutputActions } from "./OutputActions";
import "./DiffDisplay.css";

type DiffDisplayProps = {
  original: string;
  edited: string;
  diff: DiffOp[];
  changes: ReversibleChange[];
  tokens: ReversibleToken[];
  cardCount: number;
};

type BatchInstance = {
  changeId: string;
  before: string;
  modified: string;
  after: string;
};

const buildContextPreview = (baselineText: string, change: ReversibleChange): BatchInstance => {
  const beforeWords = baselineText
    .slice(0, change.startIndex)
    .split(/\s+/)
    .filter(Boolean)
    .slice(-5)
    .join(" ");

  const afterWords = baselineText
    .slice(change.endIndex)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(" ");

  return {
    changeId: change.id,
    before: beforeWords,
    modified: change.modified.trim() || "[prazno]",
    after: afterWords,
  };
};

export const DiffDisplay = ({ original, edited, diff, changes, tokens, cardCount }: DiffDisplayProps) => {
  const [tokenState, setTokenState] = useState<ReversibleToken[]>([]);
  const [changeState, setChangeState] = useState<ReversibleChange[]>([]);
  const [previewIds, setPreviewIds] = useState<Set<string>>(new Set());
  const [batchInstances, setBatchInstances] = useState<BatchInstance[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [showClean, setShowClean] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const skipClickChangeRef = useRef<string | null>(null);

  useEffect(() => {
    const fallbackToken: ReversibleToken = {
      id: "token_static_result",
      text: edited,
      startIndex: 0,
      endIndex: edited.length,
      status: "static",
    };

    setTokenState(tokens.length ? tokens : [fallbackToken]);
    setChangeState(changes);
    setPreviewIds(new Set());
    setBatchInstances([]);
    setSelectedBatchIds(new Set());
    setBatchOpen(false);
  }, [edited, changes, tokens]);

  const changeLookup = useMemo(() => {
    const map = new Map<string, ReversibleChange>();
    changeState.forEach((change) => map.set(change.id, change));
    return map;
  }, [changeState]);

  const renderedText = useMemo(
    () => tokenState.map((token) => token.text).join(""),
    [tokenState]
  );

  const applyReverts = (ids: Set<string>) => {
    setChangeState((prev) =>
      prev.map((change) =>
        ids.has(change.id) && change.status === "active"
          ? { ...change, status: "reverted" }
          : change
      )
    );

    setTokenState((prev) =>
      prev.map((token) => {
        if (!token.changeId || !ids.has(token.changeId) || token.status !== "active") {
          return token;
        }

        const change = changeLookup.get(token.changeId);
        if (!change) {
          return token;
        }

        return {
          ...token,
          text: change.original,
          status: "reverted",
        };
      })
    );
  };

  const triggerBatchFlow = (changeId: string) => {
    const baseChange = changeLookup.get(changeId);
    if (!baseChange || baseChange.status !== "active") {
      return;
    }

    const matching = changeState.filter(
      (change) =>
        change.status === "active" &&
        change.groupKey === baseChange.groupKey &&
        change.modified.length > 0
    );

    if (!matching.length) {
      return;
    }

    const ids = new Set(matching.map((change) => change.id));
    setPreviewIds(ids);
    setSelectedBatchIds(new Set(ids));
    setBatchInstances(matching.map((change) => buildContextPreview(edited, change)));
    setBatchOpen(true);
  };

  const handleSingleRevert = (changeId: string) => {
    const change = changeLookup.get(changeId);
    if (!change) {
      return;
    }

    // Ako je već reverted, vrati ga u active (undo)
    if (change.status === "reverted") {
      setChangeState((prev) =>
        prev.map((c) =>
          c.id === changeId ? { ...c, status: "active" } : c
        )
      );

      setTokenState((prev) =>
        prev.map((token) => {
          if (token.changeId !== changeId || token.status !== "reverted") {
            return token;
          }

          const chg = changeLookup.get(changeId);
          if (!chg) {
            return token;
          }

          return {
            ...token,
            text: chg.modified,
            status: "active",
          };
        })
      );
      return;
    }

    // Inače, revertuj kao prije
    if (change.status === "active") {
      applyReverts(new Set([changeId]));
    }
  };

  const handleTokenClick = (event: MouseEvent<HTMLSpanElement>, changeId: string) => {
    if (skipClickChangeRef.current === changeId) {
      skipClickChangeRef.current = null;
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      triggerBatchFlow(changeId);
      return;
    }

    handleSingleRevert(changeId);
  };

  const startLongPress = (changeId: string) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = window.setTimeout(() => {
      skipClickChangeRef.current = changeId;
      triggerBatchFlow(changeId);
    }, 500);
  };

  const stopLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const toggleExclude = (changeId: string) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(changeId)) {
        next.delete(changeId);
      } else {
        next.add(changeId);
      }
      return next;
    });
  };

  const closeBatch = () => {
    setBatchOpen(false);
    setPreviewIds(new Set());
    setBatchInstances([]);
    setSelectedBatchIds(new Set());
  };

  const confirmBatch = () => {
    applyReverts(new Set(selectedBatchIds));
    closeBatch();
  };

  /* Map each non-unchanged diff op to its corresponding change (parallel order) */
  const diffChangeMap = useMemo(() => {
    const map = new Map<number, ReversibleChange>();
    let cIdx = 0;
    diff.forEach((op, opIdx) => {
      if (op.type !== "unchanged" && cIdx < changeState.length) {
        map.set(opIdx, changeState[cIdx]);
        cIdx++;
      }
    });
    return map;
  }, [diff, changeState]);

  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    if (!renderedText.trim()) return;
    try {
      await navigator.clipboard.writeText(renderedText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <motion.section
        className="result-section"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        aria-live="polite"
      >
        <div className="selector-label">Rezultat i korekcije</div>

        <p className="diff-display-hint">
          <span className="diff-display-hint-bold">Hint:</span> Klikni na {" "}
          <span className="diff-display-hint-green">
             zeleni tekst
          </span>
          {" "}da opovrgneš,{" "}
          <span className="diff-display-hint-red">
            crveni tekst
          </span>
          {" "}za undo
        </p>

        <div className="diff-box" style={{ position: "relative", paddingTop: 40 }}>
          {/* Copy button – top-right */}
          <button
            type="button"
            onClick={copyText}
            aria-label={copied ? "Kopirano" : "Kopiraj tekst"}
            className={`diff-display-copy-btn${copied ? " copied" : ""}`}
          >
            {copied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
          </button>

          {/* Clean/Diff toggle button – top-right next to copy */}
          <button
            type="button"
            onClick={() => setShowClean(!showClean)}
            aria-label={showClean ? "Pokaži razlike" : "Pokaži čist tekst"}
            className={`diff-display-toggle-btn${showClean ? " active" : ""}`}
            title={showClean ? "Pokaži razlike" : "Pokaži čist tekst"}
          >
            {showClean ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3"></polyline>
                <polyline points="12 12 20 7.5"></polyline>
                <polyline points="12 12 12 21"></polyline>
                <polyline points="12 12 4 7.5"></polyline>
              </svg>
            )}
          </button>

          {/* Content: Clean or Diff view */}
          {showClean ? (
            <pre className="diff-display-content-pre">
              {renderedText}
            </pre>
          ) : (
            <div className="diff-display-content-div">
              {/* Inline diff content */}
              {diff.map((op, idx) => {
                if (op.type === "unchanged") {
                  return <span key={idx}>{op.value}</span>;
                }

                const change = diffChangeMap.get(idx);
                const isReverted = change?.status === "reverted";
                const isPreview = change ? previewIds.has(change.id) : false;

                if (op.type === "deleted") {
                  return isReverted
                    ? <span
                        key={idx}
                        className={`diff-display-deleted${isReverted ? " reverted" : ""}`}
                        onClick={change ? (e) => handleTokenClick(e, change.id) : undefined}
                      >
                        {op.value}
                      </span>
                    : <del key={idx}>{op.value}</del>;
                }

                if (op.type === "added") {
                  if (isReverted) {
                    return (
                      <span
                        key={idx}
                        className="diff-display-added reverted"
                        onClick={change ? (e) => handleTokenClick(e, change.id) : undefined}
                      >
                        {op.value}
                      </span>
                    );
                  }
                  return (
                    <ins
                      key={idx}
                      className={`diff-display-added${isPreview ? " preview" : ""}`}
                      onClick={change ? (e) => handleTokenClick(e, change.id) : undefined}
                      onPointerDown={change ? () => startLongPress(change.id) : undefined}
                      onPointerUp={stopLongPress}
                      onPointerLeave={stopLongPress}
                    >
                      {op.value}
                    </ins>
                  );
                }

                /* modified */
                if (isReverted) {
                  return (
                    <span
                      key={idx}
                      className="diff-display-modified-original"
                      onClick={(e) => handleTokenClick(e, change.id)}
                    >
                      {op.original}
                    </span>
                  );
                }

                return (
                  <span key={idx}>
                    <del>{op.original}</del>{" "}
                    <ins
                      className={`diff-display-modified${isPreview ? " preview" : ""}`}
                      onClick={change ? (e) => handleTokenClick(e, change.id) : undefined}
                      onPointerDown={change ? () => startLongPress(change.id) : undefined}
                      onPointerUp={stopLongPress}
                      onPointerLeave={stopLongPress}
                    >
                      {op.edited}
                    </ins>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <OutputActions outputText={renderedText} />
      </motion.section>

      <BatchConfirmationModal
        open={batchOpen}
        instances={batchInstances}
        selectedIds={selectedBatchIds}
        onToggleExclude={toggleExclude}
        onConfirm={confirmBatch}
        onCancel={closeBatch}
      />
    </>
  );
};

export default DiffDisplay;
