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

const leftStyle = "diff-box";
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

        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-subtle)",
            color: "var(--text-muted)",
            fontSize: 13,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Klik na zelenu riječ vraća je u originalno stanje.
          <br />
          Ctrl ili Cmd (Mac) + klik vraća sve iste promjene u tekstu.
          <br />
          Na telefonu zadržite pritisak na riječ za vraćanje svih istih promjena.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Original</h3>
            <div className={leftStyle} aria-label="Originalni tekst">
              {diff.map((op, idx) => {
                if (op.type === "unchanged") return <span key={idx}>{op.value}</span>;
                if (op.type === "deleted") return <del key={idx}>{op.value}</del>;
                if (op.type === "added") return <span key={idx}> </span>;
                return <del key={idx}>{op.original}</del>;
              })}
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Izmijenjeno</h3>
            <div className={rightStyle} aria-label="Izmijenjeni tekst">
              {tokenState.map((token) => {
                if (!token.changeId || token.status !== "active") {
                  return <span key={token.id}>{token.text}</span>;
                }

                const preview = previewIds.has(token.changeId);
                return (
                  <ins
                    key={token.id}
                    style={{
                      cursor: "pointer",
                      transition: "background 0.2s",
                      background: preview ? "rgba(45, 90, 39, 0.15)" : undefined,
                    }}
                    data-change-id={token.changeId}
                    data-group-key={token.groupKey}
                    onClick={(event) => handleTokenClick(event, token.changeId as string)}
                    onPointerDown={() => startLongPress(token.changeId as string)}
                    onPointerUp={stopLongPress}
                    onPointerLeave={stopLongPress}
                  >
                    {token.text}
                  </ins>
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
