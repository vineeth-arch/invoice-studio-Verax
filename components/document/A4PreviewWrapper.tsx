"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

interface A4PreviewWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const A4PreviewWrapper = forwardRef<HTMLDivElement, A4PreviewWrapperProps>(
  ({ children, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

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

    return (
      <div ref={containerRef} className={cn("w-full overflow-hidden", className)}>
        {/* Compensate for transform scale not affecting layout flow */}
        <div style={{ height: A4_HEIGHT_PX * scale }}>
          <div
            ref={ref}
            className="a4-print-area bg-white shadow-lg"
            style={{
              width: A4_WIDTH_PX,
              minHeight: A4_HEIGHT_PX,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              fontFamily: "var(--font-sans)",
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
