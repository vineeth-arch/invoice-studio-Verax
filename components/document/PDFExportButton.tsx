"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/hooks/useToast";
import { sanitizeFileName } from "@/lib/utils/numbering";

interface PDFExportButtonProps {
  previewRef: React.RefObject<HTMLDivElement>;
  filename: string;
  className?: string;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export function PDFExportButton({ previewRef, filename, className, onGeneratingChange }: PDFExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const isIOSDevice = () => {
    if (typeof window === "undefined") return false;

    return /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  };

  const handleExport = async () => {
    const element = previewRef.current;
    if (!element) return;

    setLoading(true);
    onGeneratingChange?.(true);
    element.classList.add("pdf-generating");
    const originalTransform = element.style.transform;
    const originalWidth = element.style.width;
    const originalBoxShadow = element.style.boxShadow;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const fileName = `${sanitizeFileName(filename)}.pdf`;
      const options = {
        margin: [0, 0, 0, 0],
        filename: fileName,
        enableLinks: false,
        image: {
          type: "jpeg",
          quality: 0.95,
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 794,
          width: 794,
          ignoreElements: (node: Element) => node.classList.contains("no-print"),
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: {
          mode: ["css", "legacy"],
        },
      } as const;

      element.style.transform = "none";
      element.style.width = "794px";
      element.style.boxShadow = "none";

      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

      const worker = html2pdf().set(options as never).from(element);

      if (isIOSDevice()) {
        const blobUrl = await worker.toPdf().output("bloburl");
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      } else {
        await worker.save();
      }
    } catch (error) {
      console.error("PDF generation failed", error);
      addToast("Failed to generate PDF. Please try again.", "error");
    } finally {
      element.classList.remove("pdf-generating");
      element.style.transform = originalTransform;
      element.style.width = originalWidth;
      element.style.boxShadow = originalBoxShadow;
      onGeneratingChange?.(false);
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} loading={loading} className={className}>
      {!loading && <Download className="h-4 w-4" />}
      {loading ? "Generating..." : "Download PDF"}
    </Button>
  );
}
