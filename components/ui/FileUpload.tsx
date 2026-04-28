"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FileUploadProps {
  value?: string;
  onChange: (base64: string | undefined) => void;
  accept?: string;
  label?: string;
  maxSizeKB?: number;
  className?: string;
}

export function FileUpload({
  value,
  onChange,
  accept = "image/png,image/jpeg,image/webp",
  label = "Upload image",
  maxSizeKB = 500,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeKB * 1024) {
      setError(`Image should be under ${maxSizeKB}KB for best performance.`);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Compress if image and over 300KB
      if (file.size > 300 * 1024 && file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = (h / w) * maxDim; w = maxDim; }
            else { w = (w / h) * maxDim; h = maxDim; }
          }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
          onChange(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = result;
      } else {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Uploaded" className="h-16 w-auto rounded border border-slate-200 object-contain" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 text-white p-0.5 hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          <Upload className="h-4 w-4" />
          {label}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-amber-600">{error}</p>}
    </div>
  );
}
