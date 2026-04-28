"use client";

import type { ReactNode } from "react";

const BRAND_NAME = "Design Innsait";
const BRAND_SUBTITLE = "Graphic Design Services";
const BRAND_PURPLE = "#3110A6";
const BRAND_TEAL = "#1DF2D2";

interface InfoBlock {
  label: string;
  title?: string;
  lines: string[];
}

interface TableItem {
  id: string;
  index: number;
  description: string;
  details?: string;
  amount: string;
}

interface MetaRow {
  label: string;
  value: string;
}

interface SectionBlock {
  title: string;
  content: ReactNode;
}

interface BrandedA4TemplateProps {
  documentTitle: string;
  documentNumber?: string;
  dateLabel?: string;
  leftBlock: InfoBlock;
  middleBlock: InfoBlock;
  rightMeta?: MetaRow[];
  items: TableItem[];
  totalLabel: string;
  totalValue: string;
  amountInWords?: string;
  sections: SectionBlock[];
  closingNote: string;
  footerText: string;
}

function BrandMark() {
  return (
    <div className="flex items-start gap-3 text-right">
      <div className="relative mt-1 h-[54px] w-[36px] shrink-0">
        <div className="absolute inset-0 rounded-full border-[6px]" style={{ borderColor: BRAND_TEAL }} />
        <div className="absolute left-[11px] top-[11px] h-[14px] w-[14px] rounded-full border-[4px]" style={{ borderColor: BRAND_TEAL }} />
        <div className="absolute left-[14px] top-[-2px] h-[56px] w-[8px] rounded-full" style={{ backgroundColor: BRAND_TEAL }} />
      </div>
      <div className="text-left text-[32px] font-semibold leading-[0.92] tracking-[-0.04em]" style={{ color: BRAND_TEAL }}>
        <div>{BRAND_NAME.split(" ")[0]}</div>
        <div>{BRAND_NAME.split(" ").slice(1).join(" ")}</div>
      </div>
    </div>
  );
}

function HeaderBand({ documentTitle }: { documentTitle: string }) {
  return (
    <div
      className="flex items-start justify-between px-[48px] py-[26px] text-white"
      style={{
        background: "linear-gradient(180deg, #3A12BA 0%, #2D0B97 100%)",
      }}
    >
      <div>
        <div className="text-[82px] font-semibold leading-[0.9] tracking-[-0.06em]">{documentTitle}</div>
        <div className="mt-1 text-[18px] font-normal tracking-[-0.01em] text-white/90">—{BRAND_SUBTITLE}</div>
      </div>
      <BrandMark />
    </div>
  );
}

function FooterBand({ footerText }: { footerText: string }) {
  return (
    <div
      className="relative flex items-center gap-4 overflow-hidden px-[44px] py-[18px] text-white"
      style={{ background: BRAND_PURPLE }}
    >
      <div className="absolute inset-0">
        <div className="absolute left-[84px] top-0 h-full w-[34px] -skew-x-6 bg-white/6" />
        <div className="absolute left-[196px] top-0 h-full w-[42px] -skew-x-6 bg-white/7" />
        <div className="absolute left-[470px] top-0 h-full w-[40px] -skew-x-6 bg-white/7" />
      </div>
      <div className="relative flex items-center gap-4">
        <div className="flex items-center gap-3 text-[34px] font-semibold leading-none text-[#1DF2D2]">
          <span>*</span>
          <span>*</span>
          <span>*</span>
        </div>
        <div className="h-px w-[330px] bg-white/70" />
      </div>
      <div className="relative ml-auto text-[16px] font-semibold tracking-[-0.01em]">{footerText}</div>
    </div>
  );
}

function InfoColumn({ label, title, lines }: InfoBlock) {
  return (
    <div>
      <div className="mb-2 text-[18px] font-semibold text-[#2D2D2D]">{label}</div>
      {title ? <div className="text-[16px] font-semibold leading-tight text-[#2D2D2D]">{title}</div> : null}
      <div className="mt-1 space-y-0.5 text-[12px] leading-[1.28] text-[#454545]">
        {lines.filter(Boolean).map((line) => (
          <div key={`${label}-${line}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, content }: SectionBlock) {
  return (
    <div className="print-keep-together">
      <div className="text-[16px] font-semibold text-[#2D2D2D]">{title}</div>
      <div className="mt-1 border-t border-[#C9C9C9]" />
      <div className="mt-3 text-[12px] leading-[1.45] text-[#505050]">{content}</div>
    </div>
  );
}

export function BrandedA4Template({
  documentTitle,
  documentNumber,
  dateLabel,
  leftBlock,
  middleBlock,
  rightMeta = [],
  items,
  totalLabel,
  totalValue,
  amountInWords,
  sections,
  closingNote,
  footerText,
}: BrandedA4TemplateProps) {
  return (
    <div className="flex min-h-[1123px] flex-col overflow-hidden bg-white text-[#2E2E2E]">
      <HeaderBand documentTitle={documentTitle} />

      <div className="flex flex-1">
        <div className="w-[54px] shrink-0">
          <div className="flex h-full flex-col items-center pt-[86px]">
            <div
              className="text-[24px] font-normal tracking-[0.02em]"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: BRAND_PURPLE }}
            >
              {documentNumber || "No. - 0000"}
            </div>
            <div className="mt-[46px] h-[79%] w-px bg-[#BFBFBF]" />
          </div>
        </div>

        <div className="flex-1 px-[34px] py-[34px]">
          <div className="grid grid-cols-[1.25fr_1.2fr_0.85fr] gap-8">
            <InfoColumn {...leftBlock} />
            <InfoColumn {...middleBlock} />
            <div>
              <div className="mb-2 text-[18px] font-semibold text-[#2D2D2D]">Date:</div>
              <div className="space-y-1 text-[12px] leading-[1.28] text-[#454545]">
                <div className="text-[16px] font-semibold text-[#2D2D2D]">{dateLabel || "-"}</div>
                {rightMeta.map((item) => (
                  <div key={`${item.label}-${item.value}`}>
                    <span className="font-semibold text-[#2D2D2D]">{item.label}:</span> {item.value}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-[34px] border-t border-[#BFBFBF]" />

          <div className="mt-4 grid grid-cols-[64px_1fr_140px] border-b border-[#CFCFCF] pb-4 text-[18px] font-semibold text-[#2D2D2D]">
            <div>Sr.No</div>
            <div>Description</div>
            <div className="text-right">Total Cost</div>
          </div>

          <div className="min-h-[240px] border-b border-[#CFCFCF] py-5">
            {items.length > 0 ? (
              items.map((item, index) => (
                <div
                  key={item.id}
                  className={`grid grid-cols-[64px_1fr_140px] gap-4 ${index > 0 ? "mt-4 border-t border-[#EFEFEF] pt-4" : ""}`}
                >
                  <div className="text-center text-[16px] font-semibold text-[#555555]">{item.index}</div>
                  <div>
                    <div className="text-[16px] font-semibold leading-[1.3] text-[#4A4A4A]">{item.description}</div>
                    {item.details ? <div className="mt-1 text-[11px] text-[#6A6A6A]">{item.details}</div> : null}
                  </div>
                  <div className="text-right text-[16px] text-[#404040]">{item.amount}</div>
                </div>
              ))
            ) : (
              <div className="pt-2 text-[14px] italic text-[#8E8E8E]">No line items yet.</div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-[1fr_140px] gap-4">
            <div className="pt-1 text-[11px] uppercase tracking-[0.08em] text-[#777777]">{amountInWords}</div>
            <div className="grid grid-cols-[1fr_auto] items-start gap-3">
              <div className="text-right text-[20px] font-semibold text-[#2D2D2D]">{totalLabel}</div>
              <div className="text-right text-[16px] text-[#404040]">{totalValue}</div>
            </div>
          </div>

          <div className="mt-[52px] space-y-[34px]">
            {sections.map((section) => (
              <Section key={section.title} {...section} />
            ))}
          </div>

          <div className="mt-[70px] text-[18px] font-semibold text-[#555555]">{closingNote}</div>
        </div>
      </div>

      <FooterBand footerText={footerText} />
    </div>
  );
}
