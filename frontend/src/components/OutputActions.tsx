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
  const [activeFormat, setActiveFormat] = useState<"txt" | "pdf" | "docx">("txt");
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
      setError(null);
    } catch {
      setError("Greška pri generisanju DOCX fajla.");
    }
  };

  const handleSave = () => {
    if (activeFormat === "txt") exportTxt();
    else if (activeFormat === "pdf") void exportPdf();
    else void exportDocx();
  };

  return (
    <div className="export-footer">
      <div className="export-options">
        <span className="export-label">Format</span>
        <button
          type="button"
          className={`format-btn${activeFormat === "txt" ? " active" : ""}`}
          onClick={() => setActiveFormat("txt")}
        >
          TXT
        </button>
        <button
          type="button"
          className={`format-btn${activeFormat === "pdf" ? " active" : ""}`}
          onClick={() => setActiveFormat("pdf")}
        >
          PDF
        </button>
        <button
          type="button"
          className={`format-btn${activeFormat === "docx" ? " active" : ""}`}
          onClick={() => setActiveFormat("docx")}
        >
          DOCX
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          type="button"
          className="btn-save-minimal"
          onClick={copyText}
          disabled={!hasText}
        >
          {copied ? "Kopirano ✓" : "📋 Kopiraj"}
        </button>
        <button
          type="button"
          className="btn-save-minimal"
          onClick={handleSave}
          disabled={!hasText}
        >
          ↓ Sačuvaj
        </button>
      </div>

      {error && (
        <p style={{ color: "var(--error)", fontSize: 13, marginTop: 8 }}>{error}</p>
      )}
    </div>
  );
};

export default OutputActions;
