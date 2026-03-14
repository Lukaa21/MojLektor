"use client";

import { motion } from "framer-motion";

type BatchInstance = {
  changeId: string;
  before: string;
  modified: string;
  after: string;
};

type BatchConfirmationModalProps = {
  open: boolean;
  instances: BatchInstance[];
  selectedIds: Set<string>;
  onToggleExclude: (changeId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export const BatchConfirmationModal = ({
  open,
  instances,
  selectedIds,
  onToggleExclude,
  onConfirm,
  onCancel,
}: BatchConfirmationModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(26, 26, 24, 0.35)",
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: "100%",
          maxWidth: 640,
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Potvrda grupnog vraćanja</h3>
          <span style={{ fontSize: 12, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Instanci: {instances.length}
          </span>
        </div>

        <div style={{ maxHeight: "55vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {instances.map((instance) => {
            const included = selectedIds.has(instance.changeId);
            return (
              <div
                key={instance.changeId}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  background: included ? "var(--bg-subtle)" : "var(--bg-card)",
                  fontSize: 14,
                  color: included ? "var(--text-main)" : "var(--text-ghost)",
                }}
              >
                <button
                  type="button"
                  onClick={() => onToggleExclude(instance.changeId)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "1px solid var(--border-light)",
                    background: "var(--bg-card)",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label={`Isključi instancu ${instance.changeId}`}
                >
                  X
                </button>
                <p style={{ lineHeight: 1.6 }}>
                  ... {instance.before}{" "}
                  <span
                    style={{
                      background: "var(--success-bg)",
                      color: "var(--success)",
                      padding: "0 4px",
                      borderRadius: 2,
                    }}
                  >
                    {instance.modified}
                  </span>{" "}
                  {instance.after} ...
                </p>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onCancel} className="btn-secondary" style={{ padding: "8px 20px", fontSize: 13 }}>
            Otkaži
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!selectedIds.size}
            className="btn-primary"
            style={{ padding: "8px 20px", fontSize: 13 }}
          >
            Potvrdi vraćanje
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BatchConfirmationModal;
