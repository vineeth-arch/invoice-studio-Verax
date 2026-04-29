"use client";

import { sanitizeFileName } from "@/lib/utils/numbering";

function isIOSDevice() {
  if (typeof window === "undefined") return false;

  return /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

function getPdfOptions(filename: string) {
  return {
    margin: [0, 0, 0, 0],
    filename: `${sanitizeFileName(filename)}.pdf`,
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
}

async function withPreparedElement<T>(element: HTMLDivElement, task: () => Promise<T>) {
  element.classList.add("pdf-generating");
  const originalTransform = element.style.transform;
  const originalWidth = element.style.width;
  const originalBoxShadow = element.style.boxShadow;

  try {
    element.style.transform = "none";
    element.style.width = "794px";
    element.style.boxShadow = "none";

    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    return await task();
  } finally {
    element.classList.remove("pdf-generating");
    element.style.transform = originalTransform;
    element.style.width = originalWidth;
    element.style.boxShadow = originalBoxShadow;
  }
}

export async function generatePdfBlob(element: HTMLDivElement, filename: string): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;

  return withPreparedElement(element, async () => {
    const worker = html2pdf().set(getPdfOptions(filename) as never).from(element).toPdf();
    return worker.output("blob");
  });
}

export async function downloadPdf(element: HTMLDivElement, filename: string) {
  const html2pdf = (await import("html2pdf.js")).default;

  await withPreparedElement(element, async () => {
    const worker = html2pdf().set(getPdfOptions(filename) as never).from(element);

    if (isIOSDevice()) {
      const blobUrl = await worker.toPdf().output("bloburl");
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      return;
    }

    await worker.save();
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
}
