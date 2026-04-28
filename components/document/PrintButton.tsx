"use client";

import { useCallback } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PrintButtonProps {
  contentRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export function PrintButton({ contentRef, className }: PrintButtonProps) {
  const handlePrint = useCallback(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;
    // Reset scale for print
    const origTransform = el.style.transform;
    el.style.transform = "none";
    window.print();
    setTimeout(() => {
      el.style.transform = origTransform;
    }, 500);
  }, [contentRef]);

  return (
    <Button variant="secondary" onClick={handlePrint} className={className}>
      <Printer className="h-4 w-4" />
      Print
    </Button>
  );
}
