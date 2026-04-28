"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { cn } from "@/lib/utils/cn";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

interface A4PreviewWrapperProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const A4PreviewWrapper = forwardRef<HTMLDivElement, A4PreviewWrapperProps>(
  ({ children, className, noPadding = false }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(1);
    const pageRef = useRef<HTMLDivElement | null>(null);
    const [pageHeight, setPageHeight] = useState(A4_HEIGHT_PX);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const available = entry.contentRect.width;
        setScale(Math.min(1, available / A4_WIDTH_PX));
      });
      observer.observe(container);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const page = pageRef.current;
      if (!page) return;

      const updateHeight = () => {
        setPageHeight(Math.max(A4_HEIGHT_PX, page.scrollHeight));
      };

      updateHeight();
      const observer = new ResizeObserver(updateHeight);
      observer.observe(page);
      return () => observer.disconnect();
    }, [children]);

    const setRefs = (node: HTMLDivElement | null) => {
      pageRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    return (
      <div ref={containerRef} className={cn("w-full overflow-hidden", className)}>
        {/* Compensate for transform scale not affecting layout flow */}
        <div style={{ height: pageHeight * scale }}>
          <div
            ref={setRefs}
            className={`a4-print-area bg-white shadow-lg${noPadding ? " di-document-wrapper" : ""}`}
            style={{
              width: A4_WIDTH_PX,
              minHeight: A4_HEIGHT_PX,
              height: "auto",
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              padding: noPadding ? "0" : "60px 53px",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
A4PreviewWrapper.displayName = "A4PreviewWrapper";
