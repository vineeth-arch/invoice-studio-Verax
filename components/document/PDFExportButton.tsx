"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/hooks/useToast";
import { downloadPdf } from "@/lib/utils/pdf";

interface PDFExportButtonProps {
  previewRef: React.RefObject<HTMLDivElement>;
  filename: string;
  className?: string;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export function PDFExportButton({ previewRef, filename, className, onGeneratingChange }: PDFExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleExport = async () => {
    const element = previewRef.current;
    if (!element) return;

    setLoading(true);
    onGeneratingChange?.(true);

    try {
      await downloadPdf(element, filename);
    } catch (error) {
      console.error("PDF generation failed", error);
      addToast("Failed to generate PDF. Please try again.", "error");
    } finally {
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
