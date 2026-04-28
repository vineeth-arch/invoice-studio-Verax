"use client";

import type { ReactNode } from "react";

interface BrandedLineItem {
  id: string;
  description: string;
  meta?: string;
  amount: string;
}

interface DetailSection {
  title: string;
  lines: string[];
}

interface PartyBlock {
  label: string;
  title?: string;
  lines: string[];
}

interface BrandedDocumentTemplateProps {
  accent: string;
  accentAlt: string;
  title: string;
  subtitle: string;
  companyName: string;
  logoImageBase64?: string;
  documentNumber?: string;
  date?: string;
  toBlock: PartyBlock;
  fromBlock: PartyBlock;
  items: BrandedLineItem[];
  summaryLabel: string;
  summaryAmount: string;
  sections: DetailSection[];
  amountInWords?: string;
  notes?: ReactNode;
  footerContact?: string;
  closingNote?: string;
}

function LogoBadge({
  logoImageBase64,
  companyName,
}: {
  logoImageBase64?: string;
  companyName: string;
}) {
  if (logoImageBase64) {
    return (
      <div className="flex items-center justify-end gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoImageBase64} alt={companyName} className="max-h-[84px] max-w-[170px] object-contain" />
      </div>
    );
  }

  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex items-center gap-3 text-white">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/35 text-2xl font-semibold">
        {initials || "DI"}
      </div>
      <div className="max-w-[180px] text-right text-[26px] font-semibold leading-[1.05]">
        {companyName || "Design Innsaeit"}
      </div>
    </div>
  );
}

function PartySection({ label, title, lines }: PartyBlock) {
  const visibleLines = lines.filter(Boolean);

  return (
    <div>
      <div className="mb-3 text-[21px] font-semibold text-[#2f2f2f]">{label}</div>
      {title ? <div className="text-[18px] font-semibold leading-tight text-[#2f2f2f]">{title}</div> : null}
      <div className="mt-1 space-y-0.5 text-[14px] leading-[1.25] text-[#3d3d3d]">
        {visibleLines.map((line) => (
          <div key={`${label}-${line}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}

export function BrandedDocumentTemplate({
  accent,
  accentAlt,
  title,
  subtitle,
  companyName,
  logoImageBase64,
  documentNumber,
  date,
  toBlock,
  fromBlock,
  items,
  summaryLabel,
  summaryAmount,
  sections,
  amountInWords,
  notes,
  footerContact,
  closingNote = "Thank you for your business!",
}: BrandedDocumentTemplateProps) {
  return (
    <div className="flex min-h-[1123px] flex-col overflow-hidden bg-white text-[#2e2e2e]">
      <div className="px-[64px] py-[44px] text-white" style={{ backgroundColor: accent }}>
        <div className="flex items-start justify-between gap-8">
          <div>
            <div className="text-[88px] font-semibold leading-[0.9] tracking-[-0.05em]">{title}</div>
            <div className="mt-2 text-[24px] font-normal leading-none tracking-[-0.02em]">{subtitle}</div>
          </div>
          <LogoBadge logoImageBase64={logoImageBase64} companyName={companyName} />
        </div>
      </div>

      <div className="flex flex-1">
        <div className="w-[46px] shrink-0 border-r border-[#bcbcbc]">
          <div
            className="pt-[52px] text-center text-[24px] font-normal tracking-[0.02em]"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: accent }}
          >
            {documentNumber || "No. -"}
          </div>
        </div>

        <div className="flex-1 px-[56px] pb-[36px] pt-[42px]">
          <div className="grid grid-cols-[1.45fr_1.4fr_0.8fr] gap-8">
            <PartySection {...toBlock} />
            <PartySection {...fromBlock} />
            <div>
              <div className="mb-3 text-[21px] font-semibold text-[#2f2f2f]">Date:</div>
              <div className="text-[18px] font-semibold leading-tight text-[#2f2f2f]">{date || "-"}</div>
            </div>
          </div>

          <div className="mt-[42px] border-t border-[#b9b9b9]" />

          <div className="mt-4 grid grid-cols-[76px_1fr_160px] border-b border-[#c8c8c8] pb-4 text-[19px] font-semibold text-[#2f2f2f]">
            <div>Sr.No</div>
            <div>Description</div>
            <div className="text-right">Total Cost</div>
          </div>

          <div className="min-h-[158px] border-b border-[#c8c8c8] py-5">
            {items.length > 0 ? (
              items.map((item, index) => (
                <div
                  key={item.id}
                  className={`grid grid-cols-[76px_1fr_160px] gap-4 ${index > 0 ? "mt-4 border-t border-[#ececec] pt-4" : ""}`}
                >
                  <div className="pt-0.5 text-center text-[18px] font-semibold text-[#545454]">{index + 1}</div>
                  <div>
                    <div className="text-[18px] font-semibold leading-[1.25] text-[#4c4c4c]">{item.description}</div>
                    {item.meta ? <div className="mt-1 text-[12px] leading-[1.35] text-[#6a6a6a]">{item.meta}</div> : null}
                  </div>
                  <div className="pt-0.5 text-right text-[18px] leading-[1.25] text-[#3c3c3c]">{item.amount}</div>
                </div>
              ))
            ) : (
              <div className="text-[16px] italic text-[#8a8a8a]">No line items yet.</div>
            )}
          </div>

          <div className="grid grid-cols-[1fr_160px] items-start gap-4 pt-3">
            <div>
              {amountInWords ? (
                <div className="text-[12px] uppercase tracking-[0.08em] text-[#757575]">{amountInWords}</div>
              ) : null}
            </div>
            <div className="grid grid-cols-[1fr_auto] items-start gap-4">
              <div className="text-right text-[24px] font-semibold text-[#2f2f2f]">{summaryLabel}</div>
              <div className="text-right text-[18px] leading-[1.35] text-[#3c3c3c]">{summaryAmount}</div>
            </div>
          </div>

          <div className="mt-[58px] space-y-[44px]">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="text-[21px] font-semibold text-[#2f2f2f]">{section.title}</div>
                <div className="mt-1 border-t border-[#c8c8c8]" />
                <div className="mt-3 space-y-0.5 text-[14px] font-semibold leading-[1.35] text-[#555555]">
                  {section.lines.filter(Boolean).map((line) => (
                    <div key={`${section.title}-${line}`}>{line}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {notes ? <div className="mt-10 text-[13px] leading-[1.45] text-[#4a4a4a]">{notes}</div> : null}

          <div className="mt-[72px] text-[20px] font-semibold text-[#555555]">{closingNote}</div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-8 px-[64px] py-[18px] text-white" style={{ backgroundColor: accentAlt }}>
        <div className="flex items-center gap-3 text-[36px] font-semibold leading-none">
          <span>*</span>
          <span>*</span>
          <span>*</span>
        </div>
        <div className="h-px flex-1 bg-white/70" />
        <div className="text-[16px] font-semibold tracking-[-0.01em]">{footerContact || companyName}</div>
      </div>
    </div>
  );
}
