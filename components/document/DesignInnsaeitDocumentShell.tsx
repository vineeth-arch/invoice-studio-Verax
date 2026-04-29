import React from "react";
import { cn } from "@/lib/utils/cn";

const BRAND_PURPLE = "#2828b0";
const BRAND_TEAL = "#00e5cc";

interface DesignInnsaeitDocumentShellProps {
  title: string;
  subtitle: string;
  statusBadge?: React.ReactNode;
  children: React.ReactNode;
  footerEmail?: string;
  footerPhone?: string;
  footerTagline?: string;
  documentClassName?: string;
}

export function DesignInnsaeitDocumentShell({
  title,
  subtitle,
  statusBadge,
  children,
  footerEmail = "vineeth@designinnsaeit.com",
  footerPhone = "+91-8655482753",
  footerTagline = "Design Innsaeit | Brand Identity, Packaging Design & Creative Consultancy",
  documentClassName,
}: DesignInnsaeitDocumentShellProps) {
  const footerContact = [footerEmail, footerPhone].filter(Boolean).join(" | ");

  return (
    <div
      className={cn("di-document", documentClassName)}
      style={{
        fontFamily: '"Inter", Arial, sans-serif',
        display: "flex",
        flexDirection: "column",
        minHeight: "297mm",
        backgroundColor: "#ffffff",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="di-document-header"
        style={{
          backgroundColor: BRAND_PURPLE,
          width: "100%",
          marginLeft: 0,
          marginRight: 0,
          padding: "20px 24px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "72px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: BRAND_TEAL,
              marginTop: "3px",
              letterSpacing: "0.3px",
            }}
          >
            {subtitle}
          </div>
          {statusBadge && (
            <div style={{ marginTop: "6px" }}>{statusBadge}</div>
          )}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="Design Innsaeit"
          crossOrigin="anonymous"
          style={{ height: "44px", width: "auto", objectFit: "contain" }}
        />
      </div>

      <div
        className="di-document-shell-body"
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>

      <div
        className="di-document-footer"
        style={{
          backgroundColor: BRAND_PURPLE,
          width: "100%",
          marginLeft: 0,
          marginRight: 0,
          padding: "12px 24px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {["★", "★", "★"].map((s, i) => (
            <span key={i} style={{ color: BRAND_TEAL, fontSize: "10px" }}>
              {s}
            </span>
          ))}
          <div
            style={{
              width: "120px",
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.3)",
              marginLeft: "6px",
            }}
          />
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "9px",
              color: "rgba(255,255,255,0.9)",
              fontWeight: 500,
            }}
          >
            {footerContact}
          </div>
          {footerTagline && (
            <div
              style={{
                fontSize: "8px",
                color: "rgba(255,255,255,0.6)",
                marginTop: "2px",
              }}
            >
              {footerTagline}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
