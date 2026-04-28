import React from "react";

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
}

export function DesignInnsaeitDocumentShell({
  title,
  subtitle,
  statusBadge,
  children,
  footerEmail = "vineeth@designinnsaeit.com",
  footerPhone = "+91-8655482753",
  footerTagline = "Design Innsaeit | Brand Identity, Packaging Design & Creative Consultancy",
}: DesignInnsaeitDocumentShellProps) {
  return (
    <div
      className="di-document"
      style={{
        fontFamily: '"Inter", Arial, sans-serif',
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        backgroundColor: "#ffffff",
      }}
    >
      {/* ── Purple Header Band ── */}
      <div
        style={{
          backgroundColor: BRAND_PURPLE,
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "72px",
        }}
      >
        {/* Left: title + subtitle + badge */}
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

        {/* Right: logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/design-innsaeit-logo-white.png"
          alt="Design Innsaeit"
          crossOrigin="anonymous"
          style={{ height: "44px", width: "auto", objectFit: "contain" }}
          onError={(e) => {
            // Fallback: try the primary logo
            const img = e.currentTarget;
            if (!img.dataset.fallback) {
              img.dataset.fallback = "1";
              img.src = "/design-innsaeit-logo.png";
            }
          }}
        />
      </div>

      {/* ── White Document Body ── */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          padding: "24px 32px",
        }}
      >
        {children}
      </div>

      {/* ── Purple Footer Band ── */}
      <div
        style={{
          backgroundColor: BRAND_PURPLE,
          padding: "10px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            {footerEmail}
            {footerPhone && (
              <span style={{ marginLeft: "12px" }}>{footerPhone}</span>
            )}
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
