"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sanitizeFileName } from "@/lib/utils/numbering";

interface PDFExportButtonProps {
  previewRef: React.RefObject<HTMLDivElement>;
  filename: string;
  className?: string;
}

export function PDFExportButton({ previewRef, filename, className }: PDFExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    const element = previewRef.current;
    if (!element) return;
    setLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Reset transform before capture
      const origTransform = element.style.transform;
      const origWidth = element.style.width;
      element.style.transform = "none";
      element.style.width = "794px";

      // Wait one frame for repaint
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        windowWidth: 794,
      });

      // Restore
      element.style.transform = origTransform;
      element.style.width = origWidth;

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (pdfHeight <= 297) {
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      } else {
        // Multi-page: slice into 297mm segments
        const pageHeight = (297 / pdfWidth) * canvas.width;
        let yOffset = 0;
        let pageNum = 0;
        while (yOffset < canvas.height) {
          const pageCanvas = document.createElement("canvas");
          const segHeight = Math.min(canvas.height - yOffset, pageHeight);
          pageCanvas.width = canvas.width;
          pageCanvas.height = segHeight;
          pageCanvas.getContext("2d")!.drawImage(canvas, 0, -yOffset);
          const segImg = pageCanvas.toDataURL("image/jpeg", 0.95);
          if (pageNum > 0) pdf.addPage();
          pdf.addImage(segImg, "JPEG", 0, 0, pdfWidth, (segHeight * pdfWidth) / canvas.width);
          yOffset += pageHeight;
          pageNum++;
        }
      }

      pdf.save(`${sanitizeFileName(filename)}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} loading={loading} className={className}>
      <Download className="h-4 w-4" />
      Download PDF
    </Button>
  );
}
