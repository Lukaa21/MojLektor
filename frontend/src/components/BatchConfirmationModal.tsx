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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/35 px-4" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-lg"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">Potvrda grupnog vraćanja</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Instanci: {instances.length}</p>
        </div>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {instances.map((instance) => {
            const included = selectedIds.has(instance.changeId);
            return (
              <div
                key={instance.changeId}
                className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                  included
                    ? "border-slate-200 bg-slate-50 text-slate-700"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleExclude(instance.changeId)}
                  className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label={`Isključi instancu ${instance.changeId}`}
                >
                  X
                </button>
                <p className="leading-6">
                  ... {instance.before} <span className="rounded-md bg-green-100 px-1 text-green-700">{instance.modified}</span> {instance.after} ...
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Otkaži
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!selectedIds.size}
            className="cursor-pointer rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Potvrdi vraćanje
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BatchConfirmationModal;
