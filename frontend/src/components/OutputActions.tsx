"use client";

import { useState } from "react";

type OutputActionsProps = {
  outputText: string;
  fileBaseName?: string;
};

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const OutputActions = ({
  outputText,
  fileBaseName = "mojlektor-output",
}: OutputActionsProps) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasText = !!outputText?.trim();

  const copyText = async () => {
    if (!hasText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopiranje nije uspjelo. Pokušajte ponovo.");
    }
  };

  const exportTxt = () => {
    try {
      const blob = new Blob(["\uFEFF" + outputText], {
        type: "text/plain;charset=utf-8",
      });
      saveBlob(blob, `${fileBaseName}.txt`);
      setOpen(false);
      setError(null);
    } catch {
      setError("Greška pri čuvanju TXT fajla.");
    }
  };

  const exportPdf = async () => {
    try {
      const pdfMakeModule = await import("pdfmake/build/pdfmake");
      const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
      const pdfMake = (pdfMakeModule as any).default ?? (pdfMakeModule as any);
      const pdfFonts = (pdfFontsModule as any).default ?? (pdfFontsModule as any);

      if (!pdfMake.vfs) {
        pdfMake.vfs = pdfFonts?.pdfMake?.vfs ?? pdfFonts?.vfs;
      }

      pdfMake
        .createPdf({
          pageMargins: [40, 50, 40, 50],
          defaultStyle: {
            font: "Roboto",
            fontSize: 11,
          },
          content: [
            {
              text: outputText,
            },
          ],
        })
        .download(`${fileBaseName}.pdf`);

      setOpen(false);
      setError(null);
    } catch {
      setError("Greška pri generisanju PDF fajla.");
    }
  };

  const exportDocx = async () => {
    try {
      const docxModule = await import("docx");
      const { Document, Packer, Paragraph, TextRun } = docxModule;

      const lines = outputText.split("\n");
      const paragraphs = lines.map(
        (line) =>
          new Paragraph({
            children: [new TextRun(line || "")],
          })
      );

      const doc = new Document({
        sections: [
          {
            children: paragraphs.length ? paragraphs : [new Paragraph("")],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveBlob(blob, `${fileBaseName}.docx`);
      setOpen(false);
      setError(null);
    } catch {
      setError("Greška pri generisanju DOCX fajla.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyText}
          disabled={!hasText}
          className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {copied ? "Kopirano ✓" : "Kopiraj tekst"}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            disabled={!hasText}
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sačuvaj kao
          </button>

          {open && hasText ? (
            <div className="absolute z-10 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={exportTxt}
                className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
              >
                .txt
              </button>
              <button
                type="button"
                onClick={exportPdf}
                className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
              >
                .pdf
              </button>
              <button
                type="button"
                onClick={exportDocx}
                className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
              >
                .docx
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export default OutputActions;
