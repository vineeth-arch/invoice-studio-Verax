"use client";

import Link from "next/link";
import { useState, useMemo, useRef, useId, useEffect } from "react";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { useCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useSavedClients } from "@/lib/hooks/useSavedClients";

// ── VeRAX Physical Depth token palette ──
const V = {
  base: "#dde3ea",
  baseDark: "#c8d0da",
  baseMid: "#d0d8e2",
  baseLight: "#edf1f6",
  accent: "#1c3d5a",
  accentMid: "#2a5278",
  accentGlow: "rgba(28,61,90,0.35)",
  amber: "#c47d1a",
  amberGlow: "rgba(196,125,26,0.4)",
  paid: "#2d6a4f",
  paidGlow: "rgba(45,106,79,0.45)",
  overdue: "#c4540a",
  overdueGlow: "rgba(196,84,10,0.45)",
  draft: "#5a6a7e",
  draftGlow: "rgba(90,106,126,0.4)",
  text: "#1a2230",
  textMid: "#3a4a5c",
  muted: "#6b7a90",
  mutedLight: "#8a9ab0",
  raised: "6px 6px 16px rgba(163,177,198,0.85), -6px -6px 16px rgba(255,255,255,0.95)",
  raisedLg: "10px 10px 28px rgba(163,177,198,0.85), -10px -10px 28px rgba(255,255,255,0.95)",
  soft: "3px 3px 8px rgba(163,177,198,0.85), -3px -3px 8px rgba(255,255,255,0.95)",
  inset: "inset 4px 4px 10px rgba(163,177,198,0.85), inset -4px -4px 10px rgba(255,255,255,0.95)",
  insetSm: "inset 2px 2px 6px rgba(163,177,198,0.85), inset -2px -2px 6px rgba(255,255,255,0.95)",
  knob: "6px 6px 14px rgba(163,177,198,0.85), -6px -6px 14px rgba(255,255,255,0.95), inset 1px 1px 3px rgba(255,255,255,0.85), inset -1px -1px 2px rgba(163,177,198,0.6)",
  gauge: "4px 4px 12px rgba(163,177,198,0.85), -4px -4px 12px rgba(255,255,255,0.95), inset 2px 2px 6px rgba(163,177,198,0.6), inset -2px -2px 6px rgba(255,255,255,0.7)",
  F: "var(--font-instrument-sans, 'Instrument Sans', system-ui, sans-serif)",
  M: "'DM Mono', 'JetBrains Mono', monospace",
};

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

function computeTrend(spark: number[]): { trend: string; trendUp: boolean } {
  if (spark.length < 2) return { trend: "0%", trendUp: true };
  const prev = spark[spark.length - 2];
  const curr = spark[spark.length - 1];
  if (prev === 0 && curr === 0) return { trend: "—", trendUp: true };
  if (prev === 0) return { trend: "new", trendUp: true };
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return { trend: `${Math.abs(Math.round(pct))}%`, trendUp: pct >= 0 };
}

function useCountUp(target: number, duration = 800, delay = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    timeout = setTimeout(() => {
      const start = performance.now();
      function tick(now: number) {
        const p = Math.min((now - start) / duration, 1);
        setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) raf.current = requestAnimationFrame(tick);
      }
      raf.current = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf.current); };
  }, [target, duration, delay]);
  return value;
}

// ── Neumorphic groove separator: dark line + light line = engraved rule ──
function Groove({ margin = "16px 0" }: { margin?: string }) {
  return (
    <div aria-hidden="true" style={{ margin }}>
      <div style={{ height: 1, background: "rgba(163,177,198,0.55)" }} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.85)" }} />
    </div>
  );
}

// ── LED digit group with separator dot ──
function LedDigits({ n, digits = 5 }: { n: number; digits?: number }) {
  const s = String(n).padStart(digits, "0");
  const groups = digits === 5 ? [s.slice(0, 2), s.slice(2)] : [s];
  return (
    <>
      {groups.map((part, gi) => (
        <span key={gi}>
          {gi > 0 && (
            <span style={{ opacity: 0.3, margin: "0 2px", letterSpacing: 0 }}>·</span>
          )}
          {part}
        </span>
      ))}
    </>
  );
}

// ── Sparkline ──
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const uid = useId();
  const id = `sg-${uid.replace(/:/g, "")}`;
  if (data.length < 2) return null;
  const W = 100, H = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - 4 - ((v - min) / range) * (H - 8),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true"
      style={{ width: "100%", height: 28, display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Analog Gauge ──
function AnalogGauge({
  value, max = 100, color, label, valueLabel,
}: { value: number; max?: number; color: string; label: string; valueLabel: string }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const cx = 100, cy = 96, r = 72;
  const gaugeId = label.replace(/\s+/g, "");

  function arcEndXY(p: number, radius: number) {
    const a = Math.PI * (1 - p);
    return [cx + radius * Math.cos(a), cy - radius * Math.sin(a)];
  }

  function fillArc(p: number) {
    if (p <= 0) return null;
    const [ex, ey] = arcEndXY(p, r);
    const laf = p > 0.5 ? 1 : 0;
    return `M ${cx - r} ${cy} A ${r} ${r} 0 ${laf} 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
  }

  const [displayPct, setDisplayPct] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplayPct(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  const needleAngle = -90 + displayPct * 180;

  const ticks = Array.from({ length: 19 }, (_, i) => {
    const a = Math.PI * (1 - i / 18);
    const isMajor = i % 3 === 0;
    const len = isMajor ? 9 : 5;
    const x1 = cx + r * Math.cos(a), y1 = cy - r * Math.sin(a);
    const x2 = cx + (r - len) * Math.cos(a), y2 = cy - (r - len) * Math.sin(a);
    const lx = cx + (r - 18) * Math.cos(a), ly = cy - (r - 18) * Math.sin(a);
    return { x1, y1, x2, y2, lx, ly, isMajor, pctLabel: Math.round((i / 18) * 100) };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ font: `600 9px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.12em", color: V.muted, textAlign: "center" }}>
        {label}
      </span>
      <div style={{ boxShadow: V.gauge, borderRadius: "50% 50% 0 0 / 60% 60% 0 0", padding: "4px 4px 0" }}>
        <svg viewBox="0 0 200 108" width={170} height={92}
          role="img" aria-label={`${label}: ${valueLabel}`}>
          <title>{label}: {valueLabel}</title>
          <defs>
            <radialGradient id={`gf${gaugeId}`} cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#d8e2ea" />
              <stop offset="60%" stopColor="#bdc9d8" />
              <stop offset="100%" stopColor="#a8b8cc" />
            </radialGradient>
            <linearGradient id={`gl${gaugeId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <path d={`M ${cx - r - 10} ${cy} A ${r + 10} ${r + 10} 0 1 0 ${cx + r + 10} ${cy}`}
            fill="none" stroke={`url(#gf${gaugeId})`} strokeWidth={14} />
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy}`}
            fill="none" stroke={V.baseDark} strokeWidth={8} strokeLinecap="round" />
          {fillArc(pct) && (
            <path d={fillArc(pct)!} fill="none"
              stroke={`url(#gl${gaugeId})`} strokeWidth={8} strokeLinecap="round" />
          )}
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} Z`}
            fill={`url(#gf${gaugeId})`} opacity={0.12} />
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={V.muted} strokeWidth={t.isMajor ? 1.5 : 0.8} />
          ))}
          {[0, 9, 18].map((i) => {
            const t = ticks[i];
            return (
              <text key={i} x={t.lx} y={t.ly + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize={6.5} fill={V.muted} fontFamily={V.M}>
                {t.pctLabel}
              </text>
            );
          })}
          <path d={`M ${cx - r - 4} ${cy} A ${r + 4} ${r + 4} 0 0 1 ${cx + 2} ${cy - r - 2}`}
            fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeLinecap="round" />
          <g style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <line x1={cx} y1={cy} x2={cx} y2={cy - 60}
              stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          </g>
          <circle cx={cx} cy={cy} r={5.5} fill={color} />
          <circle cx={cx} cy={cy} r={2.5} fill={V.baseLight} />
        </svg>
      </div>
      <div style={{ font: `700 18px/1 ${V.M}`, color, marginTop: 2 }}>{valueLabel}</div>
    </div>
  );
}

// ── Bar Chart with hover tooltips ──
function BarChart({ data }: { data: { month: string; value: number; isCurrent: boolean }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const W = 520, H = 210, chartH = 170, left = 50;
  const slotW = (W - left - 8) / data.length;
  const barW = Math.min(22, slotW * 0.55);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}
      role="img" aria-label="Monthly revenue bar chart">
      <title>Monthly Revenue — last 12 months</title>
      <defs>
        <linearGradient id="bgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={V.accent} />
          <stop offset="100%" stopColor={V.accentMid} />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((f) => {
        const y = chartH - f * chartH + 8;
        return (
          <g key={f}>
            <line x1={left - 4} y1={y} x2={W - 4} y2={y}
              stroke="rgba(163,177,198,0.28)" strokeWidth={1} strokeDasharray="4,4" />
            <text x={left - 8} y={y + 1} textAnchor="end" dominantBaseline="middle"
              fontSize={8} fill={V.muted} fontFamily={V.M}>
              {(maxVal * f / 100000).toFixed(0)}L
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const barH = Math.max((d.value / maxVal) * chartH, 2);
        const x = left + i * slotW + (slotW - barW) / 2;
        const y = chartH - barH + 8;
        const isHov = hovered === i;
        const tipW = 72;
        const tipX = Math.min(Math.max(x + barW / 2 - tipW / 2, left), W - tipW - 4);
        return (
          <g key={d.month}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "default" }}>
            {/* Invisible hit area */}
            <rect x={x - 4} y={8} width={barW + 8} height={chartH} fill="transparent" />
            <rect x={x} y={y} width={barW} height={barH} rx={3}
              fill={d.isCurrent ? V.amber : "url(#bgrad)"}
              opacity={isHov ? 0.8 : 1} />
            <rect x={x} y={y} width={barW} height={2} rx={1} fill="rgba(255,255,255,0.22)" />
            {d.isCurrent && d.value > 0 && !isHov && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                fontSize={7.5} fill={V.amber} fontFamily={V.M} fontWeight={700}>
                {fmtINR(d.value)}
              </text>
            )}
            {/* Neumorphic raised tooltip on hover */}
            {isHov && d.value > 0 && (
              <g>
                <rect x={tipX} y={y - 26} width={tipW} height={19} rx={5}
                  fill={V.base}
                  style={{ filter: "drop-shadow(2px 2px 5px rgba(163,177,198,0.8)) drop-shadow(-2px -2px 5px rgba(255,255,255,0.9))" }} />
                <text x={tipX + tipW / 2} y={y - 13} textAnchor="middle"
                  fontSize={8} fill={V.accent} fontFamily={V.M} fontWeight={700}>
                  {fmtINR(d.value)}
                </text>
              </g>
            )}
            <text x={x + barW / 2} y={chartH + 22} textAnchor="middle"
              fontSize={8} fill={isHov ? V.accent : V.muted} fontFamily={V.M}>
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart ──
function DonutChart({ paid, overdue, draft, total }: {
  paid: number; overdue: number; draft: number; total: number;
}) {
  const cx = 80, cy = 80, r = 62, ir = 38;
  const safeTotal = total || 1;
  const gap = 0.008;
  const pP = paid / safeTotal;
  const oP = overdue / safeTotal;

  function seg(startP: number, endP: number) {
    const s = startP * 2 * Math.PI - Math.PI / 2;
    const e = endP * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const ix1 = cx + ir * Math.cos(s), iy1 = cy + ir * Math.sin(s);
    const ix2 = cx + ir * Math.cos(e), iy2 = cy + ir * Math.sin(e);
    const laf = endP - startP > 0.5 ? 1 : 0;
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${laf} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${ix2.toFixed(2)} ${iy2.toFixed(2)} A${ir} ${ir} 0 ${laf} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)}Z`;
  }

  return (
    <svg viewBox="0 0 160 180" width={160} height={180}
      role="img" aria-label={`Invoice status: ${paid} paid, ${overdue} overdue, ${draft} draft`}>
      <title>Invoice Status: {paid} paid, {overdue} overdue, {draft} draft</title>
      {total > 0 ? (
        <>
          {paid > 0 && <path d={seg(0, Math.max(pP - gap, 0))} fill={V.paid} />}
          {overdue > 0 && <path d={seg(pP, Math.max(pP + oP - gap, pP))} fill={V.overdue} />}
          {draft > 0 && <path d={seg(pP + oP, 1)} fill={V.draft} />}
        </>
      ) : (
        <circle cx={cx} cy={cy} r={r} fill={V.draft} />
      )}
      <circle cx={cx} cy={cy} r={ir - 1} fill={V.base} />
      <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle"
        fontSize={20} fontWeight={700} fill={V.paid} fontFamily={V.M}>
        {total > 0 ? `${Math.round(pP * 100)}%` : "—"}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle"
        fontSize={8} fill={V.muted} fontFamily={V.F} fontWeight={600}>
        PAID
      </text>
      {[
        { color: V.paid, label: "PAID", count: paid },
        { color: V.overdue, label: "OVERDUE", count: overdue },
        { color: V.draft, label: "DRAFT", count: draft },
      ].map((item, i) => (
        <g key={item.label} transform={`translate(0,${134 + i * 16})`}>
          <circle cx={8} cy={6} r={4} fill={item.color} />
          <text x={18} y={10} fontSize={9} fill={V.muted} fontFamily={V.F} fontWeight={600}>
            {item.label}
          </text>
          <text x={152} y={10} textAnchor="end" fontSize={9} fill={V.textMid} fontFamily={V.M}>
            {String(item.count).padStart(2, "0")}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Fuel Gauge — pct label positioned above the fill endpoint ──
function FuelGauge({ label, amount, pct }: { label: string; amount: string; pct: number }) {
  const fp = Math.min(Math.max(pct, 0), 1);
  const pctLabel = `${Math.round(fp * 100)}%`;
  const tipLeft = Math.min(fp * 100, 95);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ font: `400 12px/1 ${V.F}`, color: V.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{label}</span>
        <span style={{ font: `500 11px/1 ${V.M}`, color: V.muted }}>{amount}</span>
      </div>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: V.baseMid, boxShadow: V.insetSm }}>
        {fp > 0 && (
          <div style={{
            position: "absolute", top: 0, left: 0, height: "100%",
            width: `${fp * 100}%`, borderRadius: 5, minWidth: 10,
            background: fp > 0.75
              ? `linear-gradient(90deg, ${V.paid}, ${V.overdue})`
              : `linear-gradient(90deg, ${V.paid}, ${V.amber})`,
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "5px 5px 0 0", background: "rgba(255,255,255,0.28)" }} />
          </div>
        )}
        {fp > 0.05 && (
          <div style={{
            position: "absolute", top: -2, left: `calc(${fp * 100}% - 7px)`,
            width: 14, height: 14, borderRadius: "50%",
            background: V.base, boxShadow: V.soft,
          }} />
        )}
      </div>
      {/* Pct label tracks the fill endpoint */}
      <div style={{ position: "relative", height: 14, marginTop: 3 }}>
        <span style={{
          position: "absolute", left: `${tipLeft}%`,
          transform: "translateX(-50%)",
          font: `500 10px/1 ${V.M}`, color: V.muted, whiteSpace: "nowrap",
        }}>{pctLabel}</span>
      </div>
    </div>
  );
}

// ── Status Dot — colour + shape + sr label (colour never sole differentiator) ──
function StatusDot({ color, glow, label }: { color: string; glow: string; label: string }) {
  return (
    <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
      <div className="vx-dot-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: color, "--dot-glow": glow } as React.CSSProperties}>
        <div style={{ position: "absolute", top: 1, left: 1.5, width: 2.5, height: 2.5, borderRadius: "50%", background: "rgba(255,255,255,0.7)" }} />
      </div>
      <span style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
        {label}
      </span>
    </div>
  );
}

// ── Toggle Switch — button natively handles Space/Enter; no onKeyDown needed ──
function ToggleSwitch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <span style={{ font: `600 11px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.1em", color: V.muted }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        aria-pressed={on}
        aria-label={label}
        className="vx-toggle"
        style={{
          position: "relative", width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
          background: on ? "rgba(28,61,90,0.12)" : V.base,
          boxShadow: V.inset, transition: "background 0.2s",
        }}
      >
        <div style={{
          position: "absolute", top: 3, width: 22, height: 22, borderRadius: "50%",
          background: V.base,
          left: on ? "calc(100% - 25px)" : "3px",
          transition: "left 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: on
            ? `3px 3px 8px rgba(163,177,198,0.85), -3px -3px 8px rgba(255,255,255,0.95), 0 0 8px ${V.accentGlow}`
            : V.soft,
        }} />
      </button>
    </div>
  );
}

// ── KPI Card — shadow transitions on hover/press ──
function KPICard({ label, value, sub, color, spark, trend, trendUp, goodWhenUp = true, index = 0 }: {
  label: string; value: string; sub: string; color: string;
  spark: number[]; trend: string; trendUp: boolean; goodWhenUp?: boolean; index?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const shadow = isPressed ? V.inset : isHovered ? V.raisedLg : V.raised;
  const isGood = goodWhenUp ? trendUp : !trendUp;
  return (
    <div
      className={`vx-kpi-${index}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{ background: V.base, borderRadius: 16, padding: 24, boxShadow: shadow, display: "flex", flexDirection: "column", transition: "box-shadow 0.15s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ font: `600 10px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.12em", color: V.muted }}>{label}</span>
        <span style={{ font: `600 10px/1 ${V.F}`, color: trend === "—" ? V.muted : isGood ? V.paid : V.overdue }}>
          {trend !== "—" && (trendUp ? "▲ " : "▼ ")}{trend}
        </span>
      </div>
      <div style={{ font: `700 38px/1 ${V.M}`, color, marginTop: 8, letterSpacing: -1 }}>{value}</div>
      <div style={{ font: `400 11px/1 ${V.F}`, color: V.mutedLight, marginTop: 6 }}>{sub}</div>
      <div style={{ height: 2, borderRadius: 1, background: V.baseDark, boxShadow: "inset 1px 1px 2px rgba(163,177,198,0.8), inset -1px -1px 2px rgba(255,255,255,0.9)", margin: "12px 0" }} />
      <Sparkline data={spark} color={color} />
    </div>
  );
}

// ── Knob Display — drag up/down to adjust value ──
function KnobDisplay({ label, value: initialValue, min, max, color }: {
  label: string; value: number; min: number; max: number; color: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startY: number; startVal: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startVal: value };
    setIsDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const delta = dragRef.current.startY - e.clientY;
    const range = max - min;
    const newVal = Math.round(
      Math.min(max, Math.max(min, dragRef.current.startVal + (delta / 80) * range))
    );
    setValue(newVal);
  }

  function handlePointerUp() {
    dragRef.current = null;
    setIsDragging(false);
  }

  const angleDeg = -140 + ((value - min) / (max - min)) * 280;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <span style={{ font: `600 9px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.12em", color: V.muted }}>{label}</span>
      <div
        role="slider"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowRight") setValue((v) => Math.min(max, v + 1));
          if (e.key === "ArrowDown" || e.key === "ArrowLeft") setValue((v) => Math.max(min, v - 1));
        }}
        className="vx-knob"
        style={{
          width: 64, height: 64, borderRadius: "50%",
          boxShadow: V.knob, position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, rgba(163,177,198,0.2) 50%, rgba(130,150,170,0.4) 100%)",
          cursor: "ns-resize", touchAction: "none", userSelect: "none",
        }}>
        <div style={{ position: "absolute", inset: 7, borderRadius: "50%", boxShadow: V.insetSm }} />
        <div style={{ position: "absolute", width: 3, height: 20, borderRadius: 2, background: color, top: 7, left: "calc(50% - 1.5px)", transformOrigin: "50% calc(100% + 10px)", transform: `rotate(${angleDeg}deg)`, transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </div>
      <div style={{ font: `600 14px/1 ${V.M}`, color }}>{value}</div>
    </div>
  );
}

// ── LED Display ──
function LEDDisplay({ total, paid, outstanding, draft }: {
  total: number; paid: number; outstanding: number; draft: number;
}) {
  const animTotal = useCountUp(total, 900, 200);
  const animPaid = useCountUp(paid, 700, 350);
  const animOutstanding = useCountUp(outstanding, 700, 450);
  const animDraft = useCountUp(draft, 700, 550);
  return (
    <div style={{ background: V.base, borderRadius: 16, padding: 24, boxShadow: V.raised }}>
      <div style={{ font: `600 10px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.12em", color: V.muted, marginBottom: 16 }}>
        Total Invoices
      </div>
      <div style={{
        background: "#141414", borderRadius: 6, padding: "14px 18px", marginBottom: 12,
        boxShadow: "inset 2px 2px 8px rgba(0,0,0,0.8), inset -1px -1px 4px rgba(255,255,255,0.04)",
        backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 1px, rgba(255,255,255,0.018) 1px, rgba(255,255,255,0.018) 2px)",
      }}>
        <div style={{ font: `700 38px/1 ${V.M}`, color: "#f0a030", letterSpacing: 6, textShadow: "0 0 8px rgba(240,160,48,0.7), 0 0 16px rgba(240,160,48,0.3)" }}>
          <LedDigits n={animTotal} digits={5} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "PAID", v: animPaid, c: "#3da870" },
          { label: "OPEN", v: animOutstanding, c: "#f0a030" },
          { label: "DRAFT", v: animDraft, c: "#6080a0" },
        ].map(({ label, v, c }) => (
          <div key={label} style={{ background: "#141414", borderRadius: 4, padding: "8px 6px", textAlign: "center", boxShadow: "inset 1px 1px 4px rgba(0,0,0,0.7)" }}>
            <div style={{ font: `700 18px/1 ${V.M}`, color: c, textShadow: `0 0 6px ${c}80` }}>
              <LedDigits n={v} digits={3} />
            </div>
            <div style={{ font: `600 7px/1 ${V.F}`, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════
export default function DashboardPage() {
  const { invoices, loading: invLoading } = useInvoices();
  const { purchaseOrders, loading: poLoading } = usePurchaseOrders();
  const { profile } = useCompanyProfile();
  const { clients } = useSavedClients();

  const [toggles, setToggles] = useState({
    autoGST: true, recurring: false, notifications: true, autoSend: false,
  });

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // ── Memoised derived invoice sets ──
  const finalInvoices = useMemo(
    () => invoices.filter((i) => i.status === "FINAL" || i.status === "PAID"),
    [invoices]
  );
  const paidInvoices = useMemo(
    () => invoices.filter((i) => i.status === "PAID"),
    [invoices]
  );
  const draftInvoices = useMemo(
    () => invoices.filter((i) => i.status === "DRAFT"),
    [invoices]
  );
  const outstandingInvoices = useMemo(
    () => invoices.filter((i) => i.status === "FINAL" && i.paymentStatus !== "Paid"),
    [invoices]
  );
  const overdueInvoices = useMemo(
    () => invoices.filter((i) => i.paymentStatus === "Overdue"),
    [invoices]
  );

  const mtdFinal = useMemo(
    () => finalInvoices.filter((i) => {
      const d = new Date(i.invoiceDate);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }),
    [finalInvoices, thisMonth, thisYear]
  );

  const revenueMTD = useMemo(
    () => mtdFinal.reduce((s, i) => s + i.totals.grandTotal, 0),
    [mtdFinal]
  );
  const paidMTDCount = useMemo(
    () => mtdFinal.filter((i) => i.status === "PAID").length,
    [mtdFinal]
  );
  const outstandingAmt = useMemo(
    () => outstandingInvoices.reduce((s, i) => s + i.totals.grandTotal, 0),
    [outstandingInvoices]
  );

  // ── 6-month sparklines ──
  const revSpark = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1);
    const mo = d.getMonth(), yr = d.getFullYear();
    return finalInvoices
      .filter((inv) => { const id = new Date(inv.invoiceDate); return id.getMonth() === mo && id.getFullYear() === yr; })
      .reduce((s, inv) => s + inv.totals.grandTotal, 0);
  }), [finalInvoices, thisMonth, thisYear]);

  const outSpark = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1);
    const mo = d.getMonth(), yr = d.getFullYear();
    return outstandingInvoices
      .filter((inv) => { const id = new Date(inv.invoiceDate); return id.getMonth() === mo && id.getFullYear() === yr; })
      .reduce((s, inv) => s + inv.totals.grandTotal, 0);
  }), [outstandingInvoices, thisMonth, thisYear]);

  const paidCountSpark = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1);
    const mo = d.getMonth(), yr = d.getFullYear();
    return paidInvoices
      .filter((inv) => { const id = new Date(inv.invoiceDate); return id.getMonth() === mo && id.getFullYear() === yr; })
      .length;
  }), [paidInvoices, thisMonth, thisYear]);

  // ── 12-month bar chart ──
  const monthlyData = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 11 + i, 1);
    const mo = d.getMonth(), yr = d.getFullYear();
    const val = finalInvoices
      .filter((inv) => { const id = new Date(inv.invoiceDate); return id.getMonth() === mo && id.getFullYear() === yr; })
      .reduce((s, inv) => s + inv.totals.grandTotal, 0);
    return {
      month: d.toLocaleString("en-IN", { month: "short" }),
      value: val,
      isCurrent: mo === thisMonth && yr === thisYear,
    };
  }), [finalInvoices, thisMonth, thisYear]);

  // ── Gauge values ──
  const revenueTarget = 200000;
  const revVsTarget = (revenueMTD / revenueTarget) * 100;
  const collectionRate = finalInvoices.length > 0
    ? (paidInvoices.length / finalInvoices.length) * 100 : 0;

  // ── Client fuel gauges ──
  const clientTotals = useMemo(() => clients
    .map((c) => ({
      name: c.name,
      total: finalInvoices
        .filter((i) => i.buyer.name === c.name)
        .reduce((s, i) => s + i.totals.grandTotal, 0),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3),
    [clients, finalInvoices]
  );
  const maxClientTotal = Math.max(...clientTotals.map((c) => c.total), 1);

  // ── Recent invoices ──
  const recentInvoices = useMemo(() =>
    [...invoices].sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate)).slice(0, 6),
    [invoices]
  );

  // ── PO counts ──
  const poUnderApproval = useMemo(
    () => purchaseOrders.filter((p) => p.poStatus === "Under Approval").length,
    [purchaseOrders]
  );
  const poApproved = useMemo(
    () => purchaseOrders.filter((p) => p.poStatus === "Approved").length,
    [purchaseOrders]
  );

  // ── Real trend values from sparklines ──
  const { trend: revTrend, trendUp: revTrendUp } = computeTrend(revSpark);
  const { trend: outTrend, trendUp: outTrendUp } = computeTrend(outSpark);
  const { trend: paidTrend, trendUp: paidTrendUp } = computeTrend(paidCountSpark);

  function invStatusStyle(inv: (typeof invoices)[0]) {
    if (inv.status === "PAID") return { color: V.paid, glow: V.paidGlow, label: "Paid" };
    if (inv.paymentStatus === "Overdue") return { color: V.overdue, glow: V.overdueGlow, label: "Overdue" };
    if (inv.status === "DRAFT") return { color: V.draft, glow: V.draftGlow, label: "Draft" };
    return { color: V.amber, glow: V.amberGlow, label: "Outstanding" };
  }

  if (invLoading || poLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: V.base }}>
        <span style={{ font: `400 13px/1 ${V.M}`, color: V.muted }}>Initialising instruments…</span>
      </div>
    );
  }

  return (
    <div style={{ background: V.base, minHeight: "100vh", padding: "28px 28px 56px", fontFamily: V.F }}>

      {/* ── Responsive grid + focus-visible styles ── */}
      <style>{`
        .vx-grid-kpi  { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:24px; }
        .vx-grid-row2 { display:grid; grid-template-columns:minmax(280px,360px) 1fr; gap:20px; margin-bottom:24px; }
        .vx-grid-row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-bottom:24px; }
        .vx-grid-row4 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; }
        .vx-toggle:focus-visible { outline:2px solid ${V.accent}; outline-offset:3px; border-radius:14px; }
        .vx-knob:focus-visible   { outline:2px solid ${V.accent}; outline-offset:4px; border-radius:50%; }
        .vx-link:focus-visible   { outline:2px solid ${V.accent}; outline-offset:2px; border-radius:4px; }
        @media (max-width:1279px) {
          .vx-grid-kpi  { grid-template-columns:repeat(2,1fr); }
          .vx-grid-row2 { grid-template-columns:1fr; }
          .vx-grid-row3 { grid-template-columns:1fr 1fr; }
          .vx-grid-row4 { grid-template-columns:1fr 1fr; }
        }
        @media (max-width:767px) {
          .vx-grid-kpi  { grid-template-columns:1fr 1fr; }
          .vx-grid-row2,.vx-grid-row3,.vx-grid-row4 { grid-template-columns:1fr; }
        }
        @media (max-width:479px) {
          .vx-grid-kpi { grid-template-columns:1fr; }
        }
        @keyframes vx-kpi-up {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .vx-kpi-0 { animation:vx-kpi-up 0.4s cubic-bezier(0.23,1,0.32,1) both; animation-delay:0ms; }
        .vx-kpi-1 { animation:vx-kpi-up 0.4s cubic-bezier(0.23,1,0.32,1) both; animation-delay:65ms; }
        .vx-kpi-2 { animation:vx-kpi-up 0.4s cubic-bezier(0.23,1,0.32,1) both; animation-delay:130ms; }
        .vx-kpi-3 { animation:vx-kpi-up 0.4s cubic-bezier(0.23,1,0.32,1) both; animation-delay:195ms; }
        @keyframes vx-dot-pulse {
          0%,100% { box-shadow:0 0 4px var(--dot-glow); }
          50%     { box-shadow:0 0 10px var(--dot-glow), 0 0 16px var(--dot-glow); }
        }
        .vx-dot-pulse { animation:vx-dot-pulse 2s ease-in-out infinite; }
        @media (prefers-reduced-motion:reduce) {
          .vx-kpi-0,.vx-kpi-1,.vx-kpi-2,.vx-kpi-3 { animation:none; opacity:1; transform:none; }
          .vx-dot-pulse { animation:none; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ font: `700 28px/1.1 ${V.F}`, color: V.text, letterSpacing: -0.5, margin: 0 }}>
            {profile?.companyName ?? "Dashboard"}
          </h1>
          <span style={{ font: `400 11px/1 ${V.M}`, color: V.muted }}>
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <div style={{ font: `400 13px/1 ${V.F}`, color: V.muted, marginTop: 4 }}>
          Instrument Panel · Financial Overview
        </div>
      </div>

      {/* ── ROW 1: KPI Cards ── */}
      <div className="vx-grid-kpi">
        <KPICard index={0}
          label="Revenue · MTD" value={fmtINR(revenueMTD)} sub="this month"
          color={V.accent} spark={revSpark} trend={revTrend} trendUp={revTrendUp} />
        <KPICard index={1}
          label="Outstanding" value={fmtINR(outstandingAmt)} sub={`${outstandingInvoices.length} pending`}
          color={V.overdue} spark={outSpark} trend={outTrend} trendUp={outTrendUp} goodWhenUp={false} />
        <KPICard index={2}
          label="Paid · This Month" value={String(paidMTDCount).padStart(3, "0")} sub="invoices collected"
          color={V.paid} spark={paidCountSpark} trend={paidTrend} trendUp={paidTrendUp} />
        <KPICard index={3}
          label="Profit Margin" value="68%" sub="estimated"
          color={V.amber} spark={[60, 63, 65, 67, 66, 68]} trend="—" trendUp />
      </div>

      {/* ── ROW 2: Gauge Cluster + Bar Chart ── */}
      <div className="vx-grid-row2">
        <div style={{ background: V.base, borderRadius: 16, padding: "28px 20px", boxShadow: V.raised }}>
          <div style={{ font: `600 10px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.12em", color: V.muted, marginBottom: 24 }}>
            Instrument Panel
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", gap: 8 }}>
            <AnalogGauge value={revVsTarget} label="Rev vs Target" valueLabel={`${Math.round(Math.min(revVsTarget, 100))}%`} color={V.accent} />
            <AnalogGauge value={collectionRate} label="Collection Rate" valueLabel={`${Math.round(collectionRate)}%`} color={V.overdue} />
            <AnalogGauge value={68} label="Profit %" valueLabel="68%" color={V.amber} />
          </div>
        </div>

        {/* Bar chart — cockpit screen inset */}
        <div style={{
          background: V.baseMid, borderRadius: 16, padding: 24,
          boxShadow: V.inset,
          backgroundImage: "repeating-linear-gradient(180deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 2px)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ font: `600 13px/1 ${V.F}`, color: V.text }}>Monthly Revenue</span>
            <div style={{ display: "flex", gap: 8 }}>
              {[thisYear - 1, thisYear].map((y) => (
                <span key={y} style={{
                  font: `500 11px/1 ${V.M}`, padding: "3px 10px", borderRadius: 8, cursor: "default",
                  color: y === thisYear ? V.accent : V.muted,
                  background: V.base,
                  // Active year = pressed inset; inactive = raised soft
                  boxShadow: y === thisYear ? V.insetSm : V.soft,
                }}>{y}</span>
              ))}
            </div>
          </div>
          <BarChart data={monthlyData} />
        </div>
      </div>

      {/* ── ROW 3: Donut + Fuel Gauges + Invoice List ── */}
      <div className="vx-grid-row3">
        <div style={{ background: V.base, borderRadius: 16, padding: 24, boxShadow: V.raised, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ font: `600 10px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.12em", color: V.muted, marginBottom: 12, alignSelf: "flex-start" }}>
            Invoice Status
          </div>
          <DonutChart
            paid={paidInvoices.length}
            overdue={overdueInvoices.length}
            draft={draftInvoices.length}
            total={invoices.length}
          />
        </div>

        <div style={{ background: V.base, borderRadius: 16, padding: 24, boxShadow: V.raised }}>
          <div style={{ font: `600 10px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.12em", color: V.muted, marginBottom: 20 }}>
            Client Utilisation
          </div>
          {clientTotals.length > 0 ? (
            clientTotals.map((c) => (
              <FuelGauge key={c.name} label={c.name} amount={fmtINR(c.total)} pct={c.total / maxClientTotal} />
            ))
          ) : (
            <div style={{ font: `400 12px/1.6 ${V.F}`, color: V.muted, textAlign: "center", paddingTop: 36 }}>
              No client invoice data yet.
              <br />
              <Link href="/invoice/new" className="vx-link" style={{ color: V.accent, textDecoration: "none", fontWeight: 600 }}>
                Create an invoice →
              </Link>
            </div>
          )}
        </div>

        {/* Invoice list — inset container */}
        <div style={{ background: V.baseMid, borderRadius: 16, overflow: "hidden", boxShadow: V.inset }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 10px" }}>
            <span style={{ font: `600 13px/1 ${V.F}`, color: V.text }}>Recent Invoices</span>
            <Link href="/documents" className="vx-link" style={{ font: `600 11px/1 ${V.F}`, color: V.accent, textDecoration: "none" }}>
              View All →
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center", font: `400 12px/1 ${V.F}`, color: V.muted }}>No invoices yet.</div>
          ) : (
            recentInvoices.map((inv, idx) => {
              const sc = invStatusStyle(inv);
              return (
                <Link key={inv.id} href={`/invoice/${inv.id}/edit`} className="vx-link" style={{ textDecoration: "none", display: "block" }}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "11px 20px",
                      transition: "background 0.12s ease-out",
                      // Neumorphic groove separator: dark rule on top, light rule below
                      ...(idx > 0 ? { boxShadow: "inset 0 1px 0 rgba(163,177,198,0.45), inset 0 2px 0 rgba(255,255,255,0.5)" } : {}),
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.09)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <StatusDot color={sc.color} glow={sc.glow} label={sc.label} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: `500 11px/1 ${V.M}`, color: V.accent }}>{inv.invoiceNumber}</div>
                      <div style={{ font: `400 12px/1 ${V.F}`, color: V.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{inv.buyer.name}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ font: `600 12px/1 ${V.M}`, color: sc.color }}>{fmtINR(inv.totals.grandTotal)}</div>
                      <div style={{ font: `400 10px/1 ${V.F}`, color: V.muted, marginTop: 2 }}>
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* ── ROW 4: Knob Cluster + LED Counter + Toggle Panel ── */}
      <div className="vx-grid-row4">
        <div style={{ background: V.base, borderRadius: 16, padding: 28, boxShadow: V.raised }}>
          <div style={{ font: `600 10px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.12em", color: V.muted, marginBottom: 24 }}>
            Adjustments
          </div>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <KnobDisplay label="GST %" value={18} min={0} max={28} color={V.accent} />
            <KnobDisplay label="Discount %" value={0} min={0} max={30} color={V.amber} />
            <KnobDisplay label="Margin" value={60} min={0} max={100} color={V.paid} />
          </div>
          <Groove margin="24px 0 12px" />
          {/* PO counts in mini LED enclosures */}
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {[
              { label: "Pending POs", v: poUnderApproval, c: V.amber, cHex: "#c47d1a" },
              { label: "Approved POs", v: poApproved, c: V.paid, cHex: "#2d6a4f" },
            ].map(({ label, v, c, cHex }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{
                  display: "inline-block",
                  background: "#161616", borderRadius: 4, padding: "5px 12px", marginBottom: 5,
                  boxShadow: "inset 1px 1px 4px rgba(0,0,0,0.75), inset -1px -1px 2px rgba(255,255,255,0.03)",
                }}>
                  <div style={{ font: `700 22px/1 ${V.M}`, color: c, textShadow: `0 0 8px ${cHex}80` }}>{v}</div>
                </div>
                <div style={{ font: `600 9px/1 ${V.F}`, color: V.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <LEDDisplay
          total={invoices.length}
          paid={paidInvoices.length}
          outstanding={outstandingInvoices.length}
          draft={draftInvoices.length}
        />

        <div style={{ background: V.base, borderRadius: 16, padding: 24, boxShadow: V.raised }}>
          <div style={{ font: `600 10px/1 ${V.F}`, textTransform: "uppercase", letterSpacing: "0.12em", color: V.muted, marginBottom: 20 }}>
            Controls
          </div>
          <ToggleSwitch label="Auto-GST" on={toggles.autoGST} onChange={(v) => setToggles((t) => ({ ...t, autoGST: v }))} />
          <ToggleSwitch label="Recurring" on={toggles.recurring} onChange={(v) => setToggles((t) => ({ ...t, recurring: v }))} />
          <ToggleSwitch label="Notifications" on={toggles.notifications} onChange={(v) => setToggles((t) => ({ ...t, notifications: v }))} />
          <ToggleSwitch label="Auto-send" on={toggles.autoSend} onChange={(v) => setToggles((t) => ({ ...t, autoSend: v }))} />
          <Groove />
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/invoice/new" className="vx-link" style={{ flex: 1, textDecoration: "none" }}>
              <div style={{
                textAlign: "center", padding: "10px 8px", borderRadius: 10,
                font: `600 11px/1 ${V.F}`, color: V.baseLight, background: V.accent,
                boxShadow: `4px 4px 12px rgba(10,20,35,0.45), -2px -2px 8px rgba(55,85,115,0.3)`,
                cursor: "pointer",
              }}>
                + Invoice
              </div>
            </Link>
            <Link href="/purchase-order/new" className="vx-link" style={{ flex: 1, textDecoration: "none" }}>
              <div style={{
                textAlign: "center", padding: "10px 8px", borderRadius: 10,
                font: `600 11px/1 ${V.F}`, color: V.textMid,
                background: V.base, boxShadow: V.soft, cursor: "pointer",
              }}>
                + PO
              </div>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
