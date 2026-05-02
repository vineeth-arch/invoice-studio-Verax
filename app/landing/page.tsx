"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── VeRAX Physical Depth tokens ──
const V = {
  base: "#dde3ea",
  baseDark: "#c8d0da",
  baseMid: "#d0d8e2",
  baseLight: "#edf1f6",
  accent: "#1c3d5a",
  accentMid: "#2a5278",
  amber: "#c47d1a",
  paid: "#2d6a4f",
  overdue: "#c4540a",
  text: "#1a2230",
  textMid: "#3a4a5c",
  muted: "#6b7a90",
  mutedLight: "#8a9ab0",
  raised: "6px 6px 16px rgba(163,177,198,0.85), -6px -6px 16px rgba(255,255,255,0.95)",
  raisedLg: "10px 10px 28px rgba(163,177,198,0.85), -10px -10px 28px rgba(255,255,255,0.95)",
  soft: "3px 3px 8px rgba(163,177,198,0.85), -3px -3px 8px rgba(255,255,255,0.95)",
  inset: "inset 4px 4px 10px rgba(163,177,198,0.85), inset -4px -4px 10px rgba(255,255,255,0.95)",
  insetSm: "inset 2px 2px 6px rgba(163,177,198,0.85), inset -2px -2px 6px rgba(255,255,255,0.95)",
  gauge: "4px 4px 12px rgba(163,177,198,0.85), -4px -4px 12px rgba(255,255,255,0.95), inset 2px 2px 6px rgba(163,177,198,0.6), inset -2px -2px 6px rgba(255,255,255,0.7)",
  F: "var(--font-instrument-sans,'Instrument Sans',system-ui,sans-serif)",
  O: "'Outfit',system-ui,sans-serif",
  M: "'DM Mono','JetBrains Mono',monospace",
};

// ── Mini analog gauge (hero panel) ──
function MiniGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const pct = Math.min(Math.max(value / 100, 0), 1);
  const cx = 60, cy = 56, r = 42;
  const a = Math.PI * (1 - pct);
  const ex = cx + r * Math.cos(a), ey = cy - r * Math.sin(a);
  const laf = pct > 0.5 ? 1 : 0;
  const nx = cx + 26 * Math.cos(a), ny = cy - 26 * Math.sin(a);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ boxShadow: V.gauge, borderRadius: "50% 50% 0 0 / 58% 58% 0 0", padding: "3px 3px 0" }}>
        <svg viewBox="0 0 120 68" width={96} height={55} role="img" aria-label={`${label}: ${value}%`}>
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy}`}
            fill="none" stroke={V.baseDark} strokeWidth={6} strokeLinecap="round" />
          {pct > 0 && (
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${laf} 0 ${ex.toFixed(1)} ${ey.toFixed(1)}`}
              fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.9} />
          )}
          <path d={`M ${cx - r - 4} ${cy} A ${r + 4} ${r + 4} 0 0 1 ${cx + 4} ${cy - r}`}
            fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={cx} y1={cy} x2={nx.toFixed(1)} y2={ny.toFixed(1)}
            stroke={color} strokeWidth={2} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={4} fill={color} />
          <circle cx={cx} cy={cy} r={1.5} fill={V.baseLight} />
        </svg>
      </div>
      <span style={{ font: `700 16px/1 ${V.M}`, color }}>{value}%</span>
      <span style={{ font: `500 8px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.12em", color: V.muted }}>{label}</span>
    </div>
  );
}

// ── Mini LED display ──
function MiniLED({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{
      background: "#141414", borderRadius: 5, padding: "8px 12px", textAlign: "center",
      boxShadow: "inset 2px 2px 6px rgba(0,0,0,0.75), inset -1px -1px 3px rgba(255,255,255,0.03)",
      backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 1px, rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px)",
    }}>
      <div style={{ font: `700 20px/1 ${V.M}`, color, letterSpacing: 4, textShadow: `0 0 8px ${color}90` }}>{value}</div>
      <div style={{ font: `600 6px/1 ${V.F}`, color: "#444", textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>{label}</div>
    </div>
  );
}

// ── Infinite marquee ──
function Marquee() {
  const items = [
    "GST Compliant", "Auto-Calculate 18%", "Professional PDF Invoices",
    "GSTIN Validation", "INR Native — en-IN Locale", "PO Management",
    "Payment Status Tracking", "Overdue Alerts", "Ledger-Grade Accuracy",
    "Month-to-Date KPIs", "Collection Rate", "Profit Margin Gauge",
  ];
  const track = [...items, ...items].join("  ·  ") + "  ·  ";
  return (
    <div style={{ overflow: "hidden", background: V.accent, padding: "13px 0" }}>
      <style>{`
        @keyframes vx-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .vx-marquee-track { display: flex; white-space: nowrap; animation: vx-marquee 38s linear infinite; }
        .vx-marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="vx-marquee-track">
        {[track, track].map((t, i) => (
          <span key={i} style={{ font: `500 11.5px/1 ${V.F}`, color: "rgba(237,241,246,0.75)", letterSpacing: "0.05em" }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Scrubbing text reveal (GSAP ScrollTrigger + word split) ──
function ScrubText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const words = "Every invoice issued in under 90 seconds. Zero GST calculation errors. Financial health legible at a glance without opening a spreadsheet.".split(" ");

  useEffect(() => {
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;

    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        const spans = containerRef.current!.querySelectorAll<HTMLSpanElement>(".vx-word");
        gsap.fromTo(
          spans,
          { opacity: 0.07, y: 10 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.06,
            ease: "power2.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 75%",
              end: "bottom 55%",
              scrub: 1.2,
            },
          }
        );
      });
    }).catch(() => {
      // Fallback: IntersectionObserver
      const spans = containerRef.current?.querySelectorAll<HTMLSpanElement>(".vx-word");
      if (!spans) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            spans.forEach((s, i) => {
              setTimeout(() => { s.style.opacity = "1"; s.style.transform = "translateY(0)"; }, i * 55);
            });
          }
        },
        { threshold: 0.2 }
      );
      if (containerRef.current) io.observe(containerRef.current);
    });
  }, []);

  return (
    <div ref={containerRef} style={{ padding: "100px 40px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
      <style>{`.vx-word { opacity: 0.07; display: inline-block; margin-right: 0.25em; transition: opacity 0.4s ease-out, transform 0.4s ease-out; transform: translateY(8px); }`}</style>
      <p style={{ font: `700 clamp(1.9rem, 3.8vw, 3.2rem)/1.22 ${V.O}`, color: V.text, letterSpacing: "-0.02em" }}>
        {words.map((w, i) => <span key={i} className="vx-word">{w}</span>)}
      </p>
    </div>
  );
}

// ── Horizontal accordion (3 feature slices) ──
function AccordionPanel() {
  const [active, setActive] = useState(0);

  const panels = [
    {
      title: "Tax Invoicing",
      sub: "GST-compliant invoices in under 90 seconds",
      body: "Generate IGST, CGST, and SGST invoices automatically. Every calculation is locked to the en-IN locale — lakhs, crores, rupee symbol, zero rounding errors. Send PDF on completion.",
      color: V.accent,
      img: "invoice",
    },
    {
      title: "GST Management",
      sub: "18% calculated. Always. Automatically.",
      body: "Track your GST liability month by month. Know your net ITC position and the exact amount due before filing. The instrument panel surfaces it — no spreadsheet required.",
      color: V.amber,
      img: "accounting",
    },
    {
      title: "Purchase Orders",
      sub: "POs that stay in sync with your invoices",
      body: "Raise and approve purchase orders tied to vendor GSTIN numbers. When the invoice arrives, reconciliation is automatic. Approval status tracked on the panel.",
      color: V.paid,
      img: "design",
    },
  ];

  return (
    <div style={{ display: "flex", height: 380, borderRadius: 20, overflow: "hidden", boxShadow: V.raisedLg }}>
      {panels.map((p, i) => (
        <div
          key={p.title}
          role="button"
          tabIndex={0}
          aria-expanded={active === i}
          onClick={() => setActive(i)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActive(i)}
          style={{
            flex: active === i ? 4 : 1,
            transition: "flex 0.5s cubic-bezier(0.4,0,0.2,1)",
            cursor: active === i ? "default" : "pointer",
            background: V.base,
            position: "relative",
            overflow: "hidden",
            borderRight: i < 2 ? "1px solid rgba(163,177,198,0.45)" : "none",
            outline: "none",
          }}
        >
          {/* Background image overlay */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(https://picsum.photos/seed/${p.img}/800/500)`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: active === i ? 0.07 : 0.04,
            filter: "grayscale(100%) contrast(120%)",
            transition: "opacity 0.5s",
          }} />

          {/* Collapsed label — vertical */}
          <div style={{
            position: "absolute",
            left: "50%", top: "50%",
            transform: "translateX(-50%) translateY(-50%) rotate(-90deg)",
            whiteSpace: "nowrap",
            font: `700 12px/1 ${V.F}`,
            color: p.color,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            opacity: active === i ? 0 : 1,
            transition: "opacity 0.2s",
            pointerEvents: "none",
          }}>
            {p.title}
          </div>

          {/* Expanded content */}
          <div style={{
            position: "absolute", inset: 0, padding: "36px 36px 32px",
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            opacity: active === i ? 1 : 0,
            transition: `opacity ${active === i ? "0.35s" : "0.1s"}`,
            transitionDelay: active === i ? "0.22s" : "0s",
            pointerEvents: active === i ? "auto" : "none",
          }}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: p.color, marginBottom: 18 }} />
            <h3 style={{ font: `800 26px/1.1 ${V.O}`, color: V.text, marginBottom: 8, letterSpacing: "-0.02em" }}>{p.title}</h3>
            <div style={{ font: `600 13px/1 ${V.F}`, color: p.color, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.sub}</div>
            <p style={{ font: `400 14px/1.65 ${V.F}`, color: V.muted, maxWidth: 400 }}>{p.body}</p>
          </div>

          {/* Bottom color accent strip */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: active === i ? 3 : 2,
            background: p.color,
            opacity: active === i ? 1 : 0.3,
            transition: "height 0.3s, opacity 0.3s",
          }} />
        </div>
      ))}
    </div>
  );
}

// ── Bento card — GSAP card stacking trigger ──
function BentoCard({ title, body, color, colSpan, children, index }: {
  title: string; body: string; color: string; colSpan: number;
  children?: React.ReactNode; index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        gsap.from(ref.current!, {
          y: 60, opacity: 0, scale: 0.97,
          duration: 0.65, ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 88%",
            toggleActions: "play none none none",
          },
          delay: index * 0.09,
        });
      });
    }).catch(() => {});
  }, [index]);

  return (
    <div
      ref={ref}
      style={{
        gridColumn: `span ${colSpan}`,
        background: V.base,
        borderRadius: 18,
        padding: 28,
        boxShadow: V.raised,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 230,
        transition: "box-shadow 0.18s ease-out",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = V.raisedLg; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = V.raised; }}
    >
      <div style={{ width: 28, height: 3, borderRadius: 2, background: color }} />
      <h3 style={{ font: `700 19px/1.2 ${V.O}`, color: V.text, letterSpacing: "-0.01em" }}>{title}</h3>
      <p style={{ font: `400 13px/1.65 ${V.F}`, color: V.muted, flex: 1 }}>{body}</p>
      {children}
    </div>
  );
}

// ── Bento grid — mathematically tight, zero empty cells ──
// 3-column grid: col-span-2 + col-span-1 = row 1 (3 cells)
//                col-span-1 + col-span-2 = row 2 (3 cells)   total = 6 / 6
function BentoGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
      <BentoCard
        index={0}
        title="Instrument Panel"
        body="Revenue, collection rate, and profit margin displayed as analog gauges with bezels, needles, and ticks. Not bar charts."
        color={V.accent}
        colSpan={2}
      >
        <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 4 }}>
          <MiniGauge value={72} color={V.accent} label="Rev vs Target" />
          <MiniGauge value={88} color={V.paid} label="Collection" />
          <MiniGauge value={68} color={V.amber} label="Margin" />
        </div>
      </BentoCard>

      <BentoCard
        index={1}
        title="Live Invoice Counter"
        body="LED panel tallies every invoice in real time — paid, open, and draft. Like a ticker."
        color={V.amber}
        colSpan={1}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <MiniLED value="00·027" label="Total Invoices" color="#f0a030" />
          <div style={{ display: "flex", gap: 8 }}>
            <MiniLED value="019" label="Paid" color="#3da870" />
            <MiniLED value="008" label="Open" color="#f0a030" />
          </div>
        </div>
      </BentoCard>

      <BentoCard
        index={2}
        title="Client Utilisation"
        body="Horizontal fuel gauges show each client's invoiced amount. Concentration risk visible at a glance — no pivot table needed."
        color={V.paid}
        colSpan={1}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
          {[
            { name: "Aether Studios", pct: 0.92, c: V.paid },
            { name: "FORM Mumbai", pct: 0.61, c: V.amber },
            { name: "Blank Canvas", pct: 0.34, c: V.muted },
          ].map((cl) => (
            <div key={cl.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ font: `400 11px/1 ${V.F}`, color: V.textMid }}>{cl.name}</span>
                <span style={{ font: `500 10px/1 ${V.M}`, color: V.muted }}>{Math.round(cl.pct * 100)}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: V.baseMid, boxShadow: V.insetSm, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, width: `${cl.pct * 100}%`, borderRadius: 4, background: `linear-gradient(90deg, ${cl.c}, ${V.amber})`, opacity: 0.85 }} />
              </div>
            </div>
          ))}
        </div>
      </BentoCard>

      <BentoCard
        index={3}
        title="GST Controls"
        body="Rotary knobs for GST rate, discount, and target margin. Drag to adjust — invoices recalculate instantly. Analog feel, digital precision."
        color={V.overdue}
        colSpan={2}
      >
        <div style={{ display: "flex", justifyContent: "space-around", gap: 16, paddingTop: 8 }}>
          {[
            { label: "GST %", v: 18, max: 28, c: V.accent },
            { label: "Discount %", v: 5, max: 30, c: V.amber },
            { label: "Margin %", v: 60, max: 100, c: V.paid },
          ].map(({ label, v, max, c }) => {
            const angle = -140 + (v / max) * 280;
            return (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, rgba(163,177,198,0.2) 50%, rgba(130,150,170,0.4) 100%)", boxShadow: "6px 6px 14px rgba(163,177,198,0.85), -6px -6px 14px rgba(255,255,255,0.95), inset 1px 1px 3px rgba(255,255,255,0.85), inset -1px -1px 2px rgba(163,177,198,0.6)" }}>
                  <div style={{ position: "absolute", inset: 6, borderRadius: "50%", boxShadow: V.insetSm }} />
                  <div style={{ position: "absolute", width: 3, height: 16, borderRadius: 2, background: c, top: 5, left: "calc(50% - 1.5px)", transformOrigin: "50% calc(100% + 9px)", transform: `rotate(${angle}deg)` }} />
                </div>
                <span style={{ font: `600 12px/1 ${V.M}`, color: c }}>{v}</span>
                <span style={{ font: `500 8px/1 ${V.F}`, color: V.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
              </div>
            );
          })}
        </div>
      </BentoCard>
    </div>
  );
}

// ════════════════════════════════════════════════════
// LANDING PAGE
// ════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <main style={{ background: V.base, minHeight: "100vh", overflowX: "hidden", fontFamily: V.F }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; }

        .vx-nav {
          position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
          z-index: 100; display: flex; align-items: center; gap: 4px;
          padding: 10px 16px; border-radius: 40px;
          background: rgba(221,227,234,0.9);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: ${V.raised};
          white-space: nowrap;
        }
        .vx-nav-link {
          font: 500 13px/1 ${V.F}; color: ${V.muted};
          text-decoration: none; padding: 6px 14px; border-radius: 24px;
          transition: color 0.15s, background 0.15s;
        }
        .vx-nav-link:hover { color: ${V.accent}; background: rgba(28,61,90,0.06); }
        .vx-nav-divider { width: 1px; height: 20px; background: rgba(163,177,198,0.5); margin: 0 4px; }
        .vx-nav-cta {
          font: 600 12px/1 ${V.F}; color: ${V.baseLight};
          background: ${V.accent}; text-decoration: none;
          padding: 9px 20px; border-radius: 24px;
          box-shadow: 3px 3px 8px rgba(10,20,35,0.35), -1px -1px 4px rgba(55,85,115,0.2);
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .vx-nav-cta:hover {
          box-shadow: 4px 4px 14px rgba(10,20,35,0.45), -2px -2px 8px rgba(55,85,115,0.25);
          transform: translateY(-1px);
        }
        .vx-nav-cta:active { transform: translateY(0); }

        .vx-section { max-width: 1240px; margin: 0 auto; padding: 80px 40px; }
        @media (max-width: 768px) { .vx-section { padding: 56px 24px; } }

        .vx-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
          max-width: 1240px;
          margin: 0 auto;
          padding: 152px 40px 96px;
        }
        @media (max-width: 960px) {
          .vx-hero-grid { grid-template-columns: 1fr; padding: 136px 24px 72px; gap: 48px; }
          .vx-hero-panel { display: none; }
        }

        .vx-h1 {
          font-family: ${V.O};
          font-size: clamp(2.6rem, 4.8vw, 4rem);
          font-weight: 800;
          line-height: 1.1;
          color: ${V.text};
          letter-spacing: -0.03em;
          max-width: 540px;
        }
        .vx-section-eyebrow {
          font: 600 10.5px/1 ${V.F};
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: ${V.muted};
          margin-bottom: 14px;
          display: block;
        }
        .vx-section-h2 {
          font-family: ${V.O};
          font-size: clamp(1.9rem, 3.5vw, 2.9rem);
          font-weight: 700;
          color: ${V.text};
          letter-spacing: -0.025em;
          line-height: 1.15;
          margin-bottom: 14px;
        }

        .vx-btn-primary {
          font: 600 14px/1 ${V.F}; color: ${V.baseLight};
          background: ${V.accent}; text-decoration: none;
          padding: 15px 30px; border-radius: 12px; display: inline-block;
          box-shadow: 4px 4px 12px rgba(10,20,35,0.4), -2px -2px 8px rgba(55,85,115,0.2);
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .vx-btn-primary:hover {
          box-shadow: 5px 5px 18px rgba(10,20,35,0.5), -3px -3px 10px rgba(55,85,115,0.25);
          transform: translateY(-1px);
        }
        .vx-btn-secondary {
          font: 600 14px/1 ${V.F}; color: ${V.textMid};
          background: ${V.base}; text-decoration: none;
          padding: 15px 30px; border-radius: 12px; display: inline-block;
          box-shadow: ${V.soft};
          transition: box-shadow 0.15s;
        }
        .vx-btn-secondary:hover { box-shadow: ${V.raised}; }
      `}</style>

      {/* ── Navigation — floating neumorphic pill ── */}
      <nav className="vx-nav" aria-label="Main navigation">
        <span style={{ font: `800 15px/1 ${V.O}`, color: V.accent, padding: "0 8px 0 4px" }}>VeRAX</span>
        <div className="vx-nav-divider" aria-hidden="true" />
        <a href="#features" className="vx-nav-link">Features</a>
        <a href="#how-it-works" className="vx-nav-link">How it works</a>
        <a href="#cta" className="vx-nav-link">Pricing</a>
        <div className="vx-nav-divider" aria-hidden="true" />
        <Link href="/dashboard" className="vx-nav-cta">Open Studio</Link>
      </nav>

      {/* ══════════════════════════════════════════ */}
      {/* ATTENTION — Hero: Artistic Asymmetry       */}
      {/* ══════════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        {/* Ambient radial blooms */}
        <div aria-hidden="true" style={{ position: "absolute", width: 700, height: 700, top: -120, right: -200, borderRadius: "50%", background: "radial-gradient(circle, rgba(28,61,90,0.07) 0%, transparent 68%)", pointerEvents: "none" }} />
        <div aria-hidden="true" style={{ position: "absolute", width: 500, height: 500, bottom: -100, left: -120, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,125,26,0.07) 0%, transparent 68%)", pointerEvents: "none" }} />

        <div className="vx-hero-grid">
          {/* Left: copy + CTAs */}
          <div>
            <span className="vx-section-eyebrow">GST Invoice Studio · Made for India</span>
            <h1 className="vx-h1">
              GST billing that reads like a{" "}
              <span style={{ color: V.accent, display: "inline" }}>precision instrument.</span>
            </h1>
            <p style={{ font: `400 16px/1.72 ${V.F}`, color: V.muted, margin: "22px 0 38px", maxWidth: 460 }}>
              For boutique creative studios. Issue compliant invoices in under 90 seconds, track GST liabilities, manage purchase orders — all from a single instrument panel.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="vx-btn-primary">Start Free</Link>
              <a href="#features" className="vx-btn-secondary">See the panel →</a>
            </div>

            {/* Social proof strip */}
            <div style={{ display: "flex", gap: 28, marginTop: 44, paddingTop: 28, borderTop: "1px solid rgba(163,177,198,0.4)" }}>
              {[
                { v: "90s", l: "To issue an invoice" },
                { v: "0", l: "GST calculation errors" },
                { v: "18%", l: "GST auto-applied" },
              ].map(({ v, l }) => (
                <div key={l}>
                  <div style={{ font: `700 22px/1 ${V.M}`, color: V.accent }}>{v}</div>
                  <div style={{ font: `400 11px/1.4 ${V.F}`, color: V.muted, marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mini instrument panel */}
          <div className="vx-hero-panel" style={{ background: V.base, borderRadius: 22, padding: "28px 24px 24px", boxShadow: V.raisedLg }}>
            <div style={{ font: `600 9px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.15em", color: V.muted, marginBottom: 22 }}>
              Instrument Panel
            </div>

            {/* Gauge cluster */}
            <div style={{ display: "flex", justifyContent: "space-around", gap: 8, marginBottom: 22 }}>
              <MiniGauge value={72} color={V.accent} label="Rev vs Target" />
              <MiniGauge value={88} color={V.paid} label="Collection Rate" />
              <MiniGauge value={68} color={V.amber} label="Profit %" />
            </div>

            {/* Cockpit bar chart (inset screen) */}
            <div style={{
              background: V.baseMid, borderRadius: 11, padding: "14px 16px", marginBottom: 16,
              boxShadow: V.inset,
              backgroundImage: "repeating-linear-gradient(180deg, rgba(0,0,0,0.022) 0px, rgba(0,0,0,0.022) 1px, transparent 1px, transparent 2px)",
            }}>
              <div style={{ font: `600 9px/1 ${V.F}`, color: V.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
                Monthly Revenue
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}>
                {[18, 32, 25, 44, 36, 52, 40, 60, 46, 68, 50, 78].map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`, borderRadius: "2px 2px 0 0",
                    background: i === 11 ? V.amber : V.accent,
                    opacity: i === 11 ? 1 : 0.45,
                    minHeight: 2,
                  }} />
                ))}
              </div>
            </div>

            {/* LED row */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><MiniLED value="00·027" label="Total" color="#f0a030" /></div>
              <div style={{ flex: 1 }}><MiniLED value="019" label="Paid" color="#3da870" /></div>
              <div style={{ flex: 1 }}><MiniLED value="008" label="Open" color="#f0a030" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <Marquee />

      {/* ══════════════════════════════════════════ */}
      {/* INTEREST — Bento Grid                      */}
      {/* ══════════════════════════════════════════ */}
      <section id="features" className="vx-section">
        <span className="vx-section-eyebrow">Built for the studio</span>
        <h2 className="vx-section-h2">Every number on its own gauge.</h2>
        <p style={{ font: `400 15px/1.72 ${V.F}`, color: V.muted, maxWidth: 500, marginBottom: 48 }}>
          Financial data presented as instrument readings. Not SaaS metric tiles. The difference is felt, not explained.
        </p>
        <BentoGrid />
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* DESIRE — Scrubbing text + Accordions       */}
      {/* ══════════════════════════════════════════ */}
      <ScrubText />

      <section id="how-it-works" className="vx-section" style={{ paddingTop: 32 }}>
        <span className="vx-section-eyebrow">What&rsquo;s inside</span>
        <h2 className="vx-section-h2" style={{ marginBottom: 40 }}>Three instruments. One panel.</h2>
        <AccordionPanel />
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* ACTION — CTA                               */}
      {/* ══════════════════════════════════════════ */}
      <section id="cta" style={{ background: V.accent, padding: "108px 40px", marginTop: 80 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <span style={{ font: `600 10px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(237,241,246,0.4)", display: "block", marginBottom: 22 }}>
            Start reading your finances
          </span>
          <h2 style={{ font: `800 clamp(2.4rem, 5vw, 3.9rem)/1.08 ${V.O}`, color: V.baseLight, letterSpacing: "-0.03em", marginBottom: 20 }}>
            Your studio&rsquo;s financial instrument. Ready to read.
          </h2>
          <p style={{ font: `400 16px/1.7 ${V.F}`, color: "rgba(237,241,246,0.58)", marginBottom: 44, maxWidth: 460, margin: "0 auto 44px" }}>
            Issue your first GST invoice in under 90 seconds. Indian-first numerals. No spreadsheets. No configuration.
          </p>
          <Link href="/dashboard" style={{
            font: `600 15px/1 ${V.F}`, color: V.accent,
            background: V.baseLight, textDecoration: "none",
            padding: "17px 40px", borderRadius: 14, display: "inline-block",
            boxShadow: "0 4px 28px rgba(0,0,0,0.22), 0 1px 8px rgba(0,0,0,0.1)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 36px rgba(0,0,0,0.28)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 28px rgba(0,0,0,0.22), 0 1px 8px rgba(0,0,0,0.1)"; }}
          >
            Open Studio — Free
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: V.base, padding: "36px 40px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ font: `800 16px/1 ${V.O}`, color: V.accent }}>VeRAX</span>
            <span style={{ font: `400 12px/1 ${V.F}`, color: V.muted, marginLeft: 12 }}>GST Invoice Studio</span>
          </div>
          <span style={{ font: `400 12px/1 ${V.F}`, color: V.mutedLight }}>Built for Indian creative studios · INR · GST · en-IN</span>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" style={{ font: `400 12px/1 ${V.F}`, color: V.muted, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
