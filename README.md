# GST Invoice Generator
### by Design Innsaeit 

> A professional GST-compliant invoice and purchase order generator built for Indian service businesses, creative studios, consultants, and MSMEs.

## Overview

GST Invoice Generator is a Next.js app for creating GST-ready invoices and purchase orders with Indian numbering, tax calculations, printable A4 templates, and reusable client and service data. It is designed for businesses that need fast document generation, better payment tracking, and optional Supabase-backed cloud sync without making the local-first workflow mandatory.

## Live App

Link: No Vercel deployment URL is committed in this repository.  
Built with: Next.js · Tailwind CSS · html2pdf.js · localStorage (Supabase ready)

## Current Features

### Document Generation

- **Tax Invoice** — GST invoice flow with full totals, payment details, and print/PDF preview.
- **Proforma Invoice** — Pre-billing document with no GST liability watermark and no tax breakup.
- **Bill of Supply** — Alternate invoice type available in the invoice type selector.
- **Export Invoice** — Alternate invoice type available in the invoice type selector.
- **Credit Note** — Linked credit-note flow with original invoice reference and credit reason.
- **Debit Note** — Alternate invoice type available in the invoice type selector.
- **Purchase Order** — Vendor PO with approval status, delivery details, and PO-to-invoice conversion.

### GST Compliance

- **GST mode selection** — Supports CGST + SGST, IGST, No Tax, and Custom tax modes.
- **HSN/SAC code search** — Uses `data/sac-codes.json` for searchable code lookup and GST autofill.
- **Place of supply fields** — Captures place of supply state name and state code on invoices.
- **Reverse charge flag** — Available on non-proforma invoice flows.
- **IRN and e-invoice QR fields** — Supports optional IRN entry and QR image upload.
- **E-way bill field** — Supports optional E-way Bill number entry on taxable invoices.
- **Indian amount-in-words conversion** — Converts totals to INR words using lakh/crore formatting.

### Client & Vendor Management

- **Saved client address book** — Create, edit, delete, and reuse saved buyer records from the Clients page.
- **Quick client save from invoice** — Saves the current invoice buyer directly into the client address book.
- **PO vendor capture** — Stores vendor, delivery, and authorization details inside each purchase order.

### Service Catalogue

- **Saved service templates** — Store reusable service descriptions with SAC code, unit, default rate, and GST%.
- **Catalogue insertion** — Add saved services directly into invoice and PO line items.

### PDF & Printing

- **A4 live preview** — Shows a document preview beside the form editor.
- **PDF download** — Generates PDFs with `html2pdf.js`, `html2canvas`, and jsPDF settings.
- **Print support** — Prints invoice and PO previews with print-specific CSS.

### Document Sharing

- **Invoice share links** — Final invoices can generate a browser-local share token and `/share/[shareToken]` URL.
- **Share link controls** — Supports copy and revoke actions from the invoice editor.

### Dashboard & Reports

- **Dashboard totals** — Shows total invoiced, outstanding, and overdue amounts.
- **Recent documents** — Lists recent invoices and purchase orders on the dashboard.
- **Unified documents view** — Filters invoices and POs by type and status, with duplicate and delete actions.
- **Aging report** — Buckets unpaid invoices into Current, 0-30, 31-60, 61-90, and 90+.
- **Aging CSV export** — Exports the aging report as CSV from the report page.

### Settings & Configuration

- **Company profile** — Stores company identity, GSTIN, contact, bank, QR, logo, and signature defaults.
- **Auto-fill supplier profile** — Prefills the invoice and PO FROM section from saved company profile data.
- **Document numbering** — Configures invoice and PO prefixes, separators, padding, and FY-linked sequences.
- **Display defaults** — Stores default GST mode, date format, and document display toggles.
- **Theme and navigation preferences** — Persists light/dark mode and sidebar collapse state in localStorage.
- **Optional cloud sync** — Enables Supabase magic-link auth and local-to-cloud sync when env vars are set.

## Document Template Features

- **3-column header layout** — Invoice and PO previews use FROM, BILL TO, and DOC DETAILS columns.
- **A4 full-page utilisation** — Preview shells use full-height A4 layout with flexible content expansion.
- **Pinned footer shell** — Header and footer bands stay visually anchored on short documents.
- **Edge-to-edge bleed** — Header and footer strips extend to the left and right page edges.
- **Dark navy chrome** — Both templates use a dark navy header/footer brand strip with white text.
- **Company logo support** — Supplier/company logos can be uploaded and rendered inside templates.
- **Authorized signatory block** — Invoice and PO previews render signature images and signatory names.
- **Amount in words** — Grand totals render in Indian Rupees words automatically.
- **Bank and payment details** — Invoice previews include bank details, UPI ID, payment link, and optional QR.
- **Terms and conditions block** — Invoice and PO previews include notes and terms sections.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| PDF Generation | html2pdf.js + html2canvas + jsPDF |
| Storage | localStorage with optional Supabase sync |
| Email | Not implemented in the current codebase |
| Fonts | Syne · DM Sans · DM Mono · Inter (document templates) |
| Deployment | Vercel-ready; no deployed URL committed in the repo |

## Project Structure

```text
.
├── app/                          # App Router pages and global layout
│   ├── (app)/
│   │   ├── clients/page.tsx      # Saved client address book
│   │   ├── company-profile/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── documents/page.tsx    # Combined invoice + PO listing
│   │   ├── invoice/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── purchase-order/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── reports/aging/page.tsx
│   │   ├── services/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── auth/page.tsx             # Supabase magic-link sign-in
│   ├── share/[shareToken]/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                  # Redirects to /dashboard
│   └── globals.css
├── components/
│   ├── auth/                     # Auth provider and sync status card
│   ├── document/                 # A4 shell, preview wrapper, PDF/print helpers
│   ├── invoice/                  # Invoice editor, preview, and form sections
│   ├── purchase-order/           # PO editor, preview, and form sections
│   ├── layout/                   # App shell and sidebar
│   └── ui/                       # Shared form, modal, badge, toast, and combobox UI
├── lib/
│   ├── defaults/                 # Default company profile seed
│   ├── hooks/                    # React hooks for invoices, POs, clients, settings, etc.
│   ├── repositories/             # Local-first repositories with optional Supabase sync
│   ├── schemas/                  # Zod form schemas
│   ├── storage/                  # localStorage keys, migrations, and persistence helpers
│   ├── supabase/                 # Supabase client and generated DB types
│   ├── types/                    # Shared app types
│   └── utils/                    # Calculations, formatting, numbering, aging, validation
├── data/
│   └── sac-codes.json            # HSN/SAC master used by the combobox
├── public/
│   ├── .gitkeep
│   └── fonts/inter/.gitkeep      # Placeholder for document font assets
├── supabase/
│   └── schema.sql                # Optional cloud schema and RLS policies
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── postcss.config.mjs
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone git@github.com:vineeth-arch/di-GSTIN-Generator.git
cd DI-GSTIN-INVOICE-GENERATOR
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wdjnhtpzlqmsuoqlzypm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ddUAOqJz83J2Kkxbr7IcQg_LV0FvCbD
```

The app runs fully on localStorage without any environment variables. Supabase is an optional enhancement for auth and sync, and no email delivery environment variables are referenced in the current codebase.

## How to Use

### First-Time Setup

1. Open Company Profile and enter your business name, GSTIN, address, contact details, bank details, and optional logo/signature.
2. Open Services and add recurring service templates with SAC codes, default rates, units, and GST percentages.
3. Open Clients and add regular buyers so invoice billing details can be reused from the dropdown.

### Creating an Invoice

1. Go to `/invoice/new` and choose the invoice type you want to create from the Invoice Details section.
2. On a fresh invoice, keep the default company-profile checkbox enabled to auto-fill and lock the supplier section.
3. Select a saved client or enter buyer details manually, including place of supply and optional GSTIN.
4. Add line items manually or insert saved services from the catalogue, then pick the GST mode and tax rates you need.
5. Complete payment, notes, and signature sections, then save as Draft or Save as Final.

### Creating a Purchase Order

1. Go to `/purchase-order/new` and fill the PO number, dates, status, payment terms, and delivery terms.
2. Keep the default company-profile checkbox enabled to auto-fill the PO supplier/FROM section if you want to use your own company details.
3. Enter vendor details, delivery details, line items, totals, commercial terms, and authorization details.
4. Save the PO as Draft or Save as Final to create an editable saved document.

### Converting a PO to Invoice

1. Open a saved purchase order at `/purchase-order/[id]/edit`.
2. Click **Convert to Invoice** in the action bar.
3. Confirm whether the PO should stay **Approved** or be marked **Processed**.
4. The app opens `/invoice/new` with buyer details, line items, PO reference, project description, and notes pre-filled.

### Downloading or Sharing a Document

1. Use **Download PDF** or **Print** from the invoice or PO editor action bar to export the current preview.
2. Final invoices also show a **Share** action that creates a local share link at `/share/[shareToken]`.
3. Copy or revoke that invoice share link from the share modal as needed.

### Tracking Payment Status

1. Open an invoice and expand **Payment Details**.
2. Set the payment status manually or record payment received date, amount received, payment mode, and transaction reference.
3. Enable **TDS Applicable** when needed to track section, rate, deducted amount, and net received values.

## Data Storage

By default, all working data is stored in your browser’s localStorage. This means:

- ✅ No account is required for local-only use.
- ✅ Data stays private to the current browser by default.
- ✅ The full app works without Supabase credentials.
- ⚠️ Data does not sync across devices unless Supabase is configured and you sign in.
- ⚠️ Clearing browser data will erase local documents and settings.

### localStorage Keys Used

| Key | Contents |
|---|---|
| `di_gstin_invoices` | All saved invoices in local mode. |
| `di_gstin_purchase_orders` | All saved purchase orders in local mode. |
| `di_clients` | Saved client address book records. |
| `di_services` | Saved service catalogue entries. |
| `di_company_profile` | Preferred company profile key used for new-form autofill. |
| `di_gstin_company_profile` | Legacy/mirrored company profile storage key. |
| `di_gstin_saved_clients` | Legacy saved-clients key read by the migration layer. |
| `di_gstin_settings` | Document settings such as numbering, defaults, and display options. |
| `di_gstin_schema_version` | Local storage migration version marker. |
| `di_conversion_draft` | Temporary PO/proforma-to-invoice handoff draft. |
| `di_nav_collapsed` | Sidebar collapsed/expanded preference. |
| `di_theme` | Light/dark theme preference. |
| `invoice_conversion_draft` | Legacy invoice conversion draft key kept for compatibility. |
| `invoice_split_ratio` | Stored invoice editor form/preview split-pane ratio. |

## Planned Features

The codebase does not include a formal roadmap file, but the following forward-looking path is explicitly implied by the existing auth flow, repositories, and Supabase schema.

### Cloud Sync & Multi-Device

- **Supabase-backed persistence** — Database tables, repositories, and RLS policies already exist under `supabase/schema.sql`.
- **Magic-link authentication** — `/auth` is wired for Supabase OTP sign-in to unlock cloud sync.
- **Local-to-cloud migration** — The auth status card already exposes a one-click sync of local data into Supabase.

## GST Invoice Compliance Notes

This generator is designed around the core GST invoice fields the code currently captures, including:

- Mandatory supplier and recipient identity fields
- Supplier and recipient GSTIN capture
- HSN/SAC codes per line item
- CGST/SGST and IGST breakup support
- Place of supply state and state code
- Reverse charge declaration
- IRN and e-invoice QR image fields

Note: This tool assists with document generation and tax formatting. Always verify your final documents and filing workflow with your CA or tax advisor.

## Logo and Assets

The current template shell loads the brand logo from:

1. `public/images/logo.png`

This file is committed in the repository. You can also upload a logo directly from the Company Profile page, and that uploaded image is embedded into invoice and PO templates through saved profile data.

## Contributing

This is a private internal tool built by Design Innsaeit. It is not open for public contributions at this time.

## License

Private. All rights reserved.  
© 2026 Design Innsaeit.

## Built By

**Design Innsaeit**  
Brand Identity · Packaging Design · Creative Consultancy

Mumbai, India  
vineeth@designinnsaeit.com
