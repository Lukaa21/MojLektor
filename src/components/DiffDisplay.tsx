"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { DiffOp, ReversibleChange, ReversibleToken } from "../lib/api";
import BatchConfirmationModal from "./BatchConfirmationModal";
import { OutputActions } from "./OutputActions";

type DiffDisplayProps = {
  original: string;
  edited: string;
  diff: DiffOp[];
  changes: ReversibleChange[];
  tokens: ReversibleToken[];
  cardCount: number;
};

const leftStyle = "min-h-[200px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900";
const rightStyle = leftStyle;

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
    if (!change || change.status !== "active") {
      return;
    }

    applyReverts(new Set([changeId]));
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

  return (
    <>
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

        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Klik na zelenu riječ vraća je u originalno stanje.
          <br />
          Ctrl ili Cmd (Mac) + klik vraća sve iste promjene u tekstu.
          <br />
          Na telefonu zadržite pritisak na riječ za vraćanje svih istih promjena.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <section>
            <h3 className="mb-2 text-sm font-medium text-slate-700">Original</h3>
            <div className={leftStyle} aria-label="Originalni tekst">
              {diff.map((op, idx) => {
                if (op.type === "unchanged") return <span key={idx}>{op.value}</span>;
                if (op.type === "deleted") return <span key={idx} className="text-red-700 line-through">{op.value}</span>;
                if (op.type === "added") return <span key={idx} className="text-green-700"> </span>;
                return <span key={idx} className="text-red-700 line-through">{op.original}</span>;
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-slate-700">Izmijenjeno</h3>
            <div className={rightStyle} aria-label="Izmijenjeni tekst">
              {tokenState.map((token) => {
                if (!token.changeId || token.status !== "active") {
                  return <span key={token.id}>{token.text}</span>;
                }

                const preview = previewIds.has(token.changeId);
                return (
                  <span
                    key={token.id}
                    className={`ai-change cursor-pointer rounded-sm text-green-700 font-semibold transition hover:bg-green-50 ${
                      preview ? "ai-batch-preview bg-green-100" : ""
                    }`}
                    data-change-id={token.changeId}
                    data-group-key={token.groupKey}
                    onClick={(event) => handleTokenClick(event, token.changeId as string)}
                    onPointerDown={() => startLongPress(token.changeId as string)}
                    onPointerUp={stopLongPress}
                    onPointerLeave={stopLongPress}
                  >
                    {token.text}
                  </span>
                );
              })}
            </div>
          </section>
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
