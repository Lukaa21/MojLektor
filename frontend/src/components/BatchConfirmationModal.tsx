"use client";

import { motion } from "framer-motion";
import "./BatchConfirmationModal.css";

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
      className="batch-modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="batch-modal-container"
      >
        <div className="batch-modal-header">
          <h3 className="batch-modal-title">Potvrda grupnog vraćanja</h3>
          <span className="batch-modal-count">
            Instanci: {instances.length}
          </span>
        </div>

        <div className="batch-modal-list">
          {instances.map((instance) => {
            const included = selectedIds.has(instance.changeId);
            return (
              <div
                key={instance.changeId}
                className={`batch-modal-item${included ? " included" : " excluded"}`}
              >
                <button
                  type="button"
                  onClick={() => onToggleExclude(instance.changeId)}
                  className="batch-modal-item-btn"
                  aria-label={`Isključi instancu ${instance.changeId}`}
                >
                  X
                </button>
                <p className="batch-modal-item-text">
                  ... {instance.before}{" "}
                  <span className="batch-modal-item-modified">
                    {instance.modified}
                  </span>{" "}
                  {instance.after} ...
                </p>
              </div>
            );
          })}
        </div>

        <div className="batch-modal-footer">
          <button type="button" onClick={onCancel} className="btn-secondary batch-modal-footer-btn">
            Otkaži
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!selectedIds.size}
            className="btn-primary batch-modal-footer-btn"
          >
            Potvrdi vraćanje
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BatchConfirmationModal;
