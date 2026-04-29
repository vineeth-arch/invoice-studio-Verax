# GST Invoice Studio
### by Design Innsaeit

Live URL: https://gstininvoice.designinnsaeit.com

---

## What This Is

GST Invoice Studio is a Next.js web app for Indian service businesses that need GST-ready invoices, purchase orders, and export workflows without the weight of a full ERP. It is built for consultants, studios, freelancers, and MSMEs that want Rule 46-friendly documents, reusable client and service data, quick PDF output, and an optional path from browser-local storage to Supabase-backed cloud sync.

The app is local-first by default, so it works even without auth or backend setup. When Supabase is configured, the same repositories can sync company data, clients, invoices, purchase orders, services, and settings to the cloud using magic-link sign-in.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 App Router + React 18 + TypeScript |
| Styling | Tailwind CSS + custom CSS variables in `app/globals.css` |
| PDF | `html2pdf.js` + `html2canvas` + `jsPDF` |
| Storage | Browser `localStorage` with repository wrappers and optional Supabase sync |
| Auth | Supabase browser client with magic-link OTP authentication |
| Email | Resend route handler at `/api/send-invoice` plus local sender settings |
| Deployment | Vercel-friendly Next.js app on a custom domain |
| Fonts | CSS font variables for DM Sans, Syne, and DM Mono with bundled font assets in `app/fonts/` |

---

## Current Features

### Document Types

- **Tax Invoice**: Full GST invoice workflow with supplier, buyer, line item, totals, payment, and signature sections.
- **Proforma Invoice**: Pre-billing invoice mode with no GST liability and no tax breakup.
- **Bill of Supply**: Alternate invoice type for GST-exempt or composition-friendly billing scenarios.
- **Export Invoice**: Export-oriented invoice mode available in the invoice type selector.
- **Credit Note**: Linked credit-note flow with original invoice lookup and reason capture.
- **Debit Note**: Alternate debit-note document type in the same invoice editor.
- **Purchase Order**: Dedicated PO workflow with approval status, vendor details, delivery block, and authorization sections.

### GST Compliance

- **GST Mode Switching**: Supports `CGST_SGST`, `IGST`, and `NO_TAX` flows with automatic tax math.
- **State and State Code Lookup**: Reusable state/code pairing auto-fills Indian state names and two-digit codes across invoice, PO, company profile, and client forms.
- **GSTIN Validation Input**: Structured GSTIN entry is used across supplier, buyer, vendor, and company profile forms.
- **HSN/SAC Capture**: Invoice and PO line items support HSN/SAC entry and SAC search-assisted selection.
- **Place of Supply Tracking**: Buyer and PO place-of-supply fields capture both state name and state code.
- **Reverse Charge and E-Way Bill Fields**: Non-proforma invoices can capture reverse charge and optional E-way bill numbers.
- **IRN and E-Invoice QR Support**: Optional IRN number and QR image upload are built into invoice details.
- **Indian Amount-in-Words Formatting**: Totals convert to INR words using lakh and crore formatting.
- **GSTR-1 Export Tools**: The reports area includes B2B, B2CS, and HSN-summary CSV exports plus ZIP export.

### Client & Vendor Management

- **Saved Clients Directory**: A dedicated Clients page lets users create, edit, delete, and reuse billing records.
- **Buyer Autofill from Saved Clients**: Invoice buyer fields can be populated from saved client records.
- **Vendor Autofill from Saved Clients**: Purchase order BILL TO details can also be filled from saved client records.
- **Quick Save from Invoice**: The invoice form can save the current buyer back into the client directory.
- **Company Profile Autofill**: Supplier/FROM sections can be locked to the saved company profile for faster document creation.

### Service Catalogue

- **Saved Service Templates**: The Services page stores reusable descriptions, SAC codes, units, default rates, and GST percentages.
- **Add from Catalogue**: Invoice and PO line item sections can insert saved services directly into the form.
- **SAC Code Reference Page**: `/sac-codes` provides a searchable in-app SAC reference library with copy actions and category filters.

### Line Items

- **Manual Line Item Entry**: Users can add unlimited rows with quantity, unit, rate, discount, and GST controls.
- **Live Tax and Total Calculations**: Each line shows computed taxable value and tax totals as the form changes.
- **SAC Search with GST Autofill**: Selecting a SAC result fills the code and applies its default GST rate.
- **PO-to-Invoice Draft Mapping**: Approved final POs can seed a new invoice draft with copied line items and references.

### PDF & Output

- **Live A4 Preview**: Invoice and PO editors render a full document preview beside the form.
- **PDF Download**: Documents export as PDF using browser-side generation utilities.
- **Print View**: Printable document views are available from the action bars.
- **Shared Viewer Download**: The shared document page includes its own PDF download action.

### Sharing & Communication

- **Share Link Generation**: Saved final invoices and approved final POs can generate `/share/[shareToken]` links.
- **WhatsApp Sharing**: Documents can open a pre-filled WhatsApp share message using `wa.me`.
- **Email Invoice Delivery**: Final invoices can open a send modal, generate a PDF, and send via the Resend route.
- **Email Send Logging**: Invoice payloads store `lastEmailedAt` after a successful send.
- **Share Link Revoke and Copy**: Editors include copy and revoke controls for active share links.

### Dashboard & Reports

- **Dashboard KPIs**: The dashboard shows invoiced value, outstanding value, overdue value, unpaid value, and PO status counts.
- **Recent Documents Feed**: Dashboard cards surface recent invoices and purchase orders.
- **Unified Documents Page**: `/documents` merges invoices and POs with filters, duplication, deletion, conversion, and WhatsApp actions.
- **Drafts Workspace**: `/drafts` separates draft invoices and draft purchase orders for fast recovery.
- **Aging Report**: `/reports/aging` groups outstanding invoices into Current, 0-30, 31-60, 61-90, and 90+ buckets.
- **GSTR-1 Summary Screen**: `/reports/gstr1` groups invoices into B2B, B2C Large, B2C Small, Credit Notes, and Export Invoices.

### Workflow Automation

- **Auto-Number Suggestions**: New invoices and POs use configurable numbering with FY-aware sequence generation.
- **Sequence Incrementation on First Save**: Numbering repositories bump invoice and PO counters after first persisted save.
- **Draft Auto-Save**: Open invoice and PO forms auto-save draft state on a timer.
- **Session Recovery**: Unsaved in-progress form data is cached in session storage and can be restored.
- **Keyboard Save Shortcut**: `Ctrl/Cmd + S` triggers a draft save from both editors.
- **PO to Invoice Conversion**: Final approved purchase orders can be marked processed and converted into an invoice draft.

### Data & Storage

- **Local-First Repository Layer**: All repositories save to local storage first, then optionally sync to Supabase.
- **Optional Cloud Sync**: Signed-in users can load and persist invoices, POs, clients, services, settings, and company profile to Supabase.
- **Storage Migrations**: A migration helper normalizes legacy client and service records on app boot.
- **Auth Status and Sync UI**: The sidebar and auth page expose cloud-sync availability and sign-in state.

### UI & Experience

- **Responsive App Shell**: The app uses a sidebar shell on desktop and compact bottom navigation on mobile.
- **Theme Toggle**: Light and dark themes are persisted per browser.
- **Collapsible Sidebar**: Desktop navigation width is remembered in local storage.
- **Toasts and Modals**: Shared feedback and confirmation patterns are used across the app.
- **File Upload Inputs**: Logo, signature, QR, and IRN images can be attached from forms.

---

## Routes & Pages

| Route | Description |
| --- | --- |
| `/` | Redirects the root URL to the dashboard. |
| `/dashboard` | Dashboard with revenue, outstanding, overdue, PO status, recent documents, and quick actions. |
| `/documents` | Unified listing for saved invoices and purchase orders with filters and actions. |
| `/drafts` | Draft recovery page for invoice and purchase-order drafts. |
| `/clients` | Saved client management page. |
| `/services` | Saved service catalogue management page. |
| `/sac-codes` | SAC reference page with live search, category filters, and copy actions. |
| `/company-profile` | Company profile form for business identity, bank details, logo, and defaults. |
| `/settings` | Numbering, document defaults, display options, and email sender settings. |
| `/reports/aging` | Aging report page with bucket totals and CSV export. |
| `/reports/gstr1` | GSTR-1 export page with summaries, warnings, CSV downloads, and ZIP export. |
| `/invoice/new` | New invoice editor. |
| `/invoice/[id]/edit` | Existing invoice editor. |
| `/purchase-order/new` | New purchase-order editor. |
| `/purchase-order/[id]/edit` | Existing purchase-order editor. |
| `/auth` | Supabase magic-link sign-in page. |
| `/auth/callback` | Post-auth redirect route that forwards users back to the dashboard. |
| `/share/[shareToken]` | Shared document viewer for invoices and purchase orders. |
| `/api/send-invoice` | POST API route used by the email invoice flow. |

---

## Data Models

`GSTMode`, `DocumentStatus`, `PaymentStatus`, `POStatus`, and `PaymentMode` are the core status unions that drive tax mode, draft/final state, invoice payment tracking, PO approval flow, and payment instrument selection throughout the UI and repositories.

`Address` stores structured Indian postal details with `line1`, `line2`, `floor`, `unit`, `building`, `road`, `landmark`, `locality`, `district`, `city`, `state`, `stateCode`, `pincode`, and `country`. It is reused in company, invoice, PO, client, shipping, and delivery models.

`ContactInfo` captures optional `email`, `phone`, and `website` values and is embedded in supplier, buyer, vendor, and company records.

`BankDetails` models payment collection information such as `accountName`, `accountNumber`, `bankName`, `branch`, `branchName`, `branchAddress`, `ifscCode`, `micrCode`, `accountOpeningDate`, `upiId`, `paymentLink`, and `upiQrImageBase64`.

`SignatureInfo` represents signatory presentation fields including `signatoryName`, `designation`, and `signatureImageBase64`.

`InvoiceLineItem` represents one invoice row with `description`, `hsnSac`, `quantity`, `unit`, `rate`, `discountPercent`, `gstRate`, and all computed totals such as `gross`, `discountAmount`, `taxableValue`, `cgst`, `sgst`, `igst`, and `lineTotal`.

`InvoiceTotals` stores the calculated document summary for invoices: `subtotal`, `totalDiscount`, `totalTaxableValue`, `totalCGST`, `totalSGST`, `totalIGST`, `cess`, `otherCharges`, `roundOff`, `grandTotal`, and `amountInWords`.

`CreditNoteReference` links a tax invoice to related credit notes through `creditNoteId`, `creditNoteNumber`, `creditNoteDate`, and `creditAmount`.

`SupplierInfo` stores the invoice seller block with `name`, `address`, `gstin`, `stateCode`, `contact`, optional `pan`, and optional `logoImageBase64`.

`BuyerInfo` stores the invoice BILL TO block with `name`, `billingAddress`, optional `gstin`, optional `contact`, and explicit `placeOfSupply` plus `placeOfSupplyCode`.

`ShippingInfo` stores optional ship-to details with `sameAsBilling`, `name`, partial `address`, `contactPerson`, and `contactPhone`.

`Invoice` is the primary billing model. It combines document identity fields such as `documentType`, `invoiceType`, `invoiceNumber`, `invoiceDate`, and `dueDate`; GST fields such as `reverseCharge`, `ewayBillNumber`, `irnNumber`, and `irnQrImageBase64`; nested `supplier`, `buyer`, `shipping`, `lineItems`, and `totals`; payment and TDS tracking fields; sharing fields such as `shareToken` and `lastEmailedAt`; and lifecycle fields such as `status`, `createdAt`, and `updatedAt`.

`POLineItem` is the PO equivalent of an invoice row and stores `description`, optional `hsnSac`, `quantity`, `unit`, `rate`, `discountPercent`, `gstRate`, and computed `gross`, `discountAmount`, `taxableValue`, `taxAmount`, and `lineTotal`.

`POTotals` stores PO-level totals using `subtotal`, `totalDiscount`, `totalTaxableValue`, `totalTax`, `otherCharges`, `roundOff`, `grandTotal`, and `amountInWords`.

`POBuyerInfo` represents the PO FROM block with `name`, `address`, `gstin`, `stateCode`, optional `contact`, and optional `logoImageBase64`.

`POVendorInfo` represents the PO BILL TO block with `name`, `address`, optional `gstin`, optional `contactPerson`, optional `contact`, and optional `vendorCode`.

`PODeliveryInfo` models ship/delivery details with `address`, optional `contactPerson`, `contactPhone`, `instructions`, `modeOfDispatch`, `freightTerms`, and `transportResponsibility`.

`POCommercialTerms` stores commercial clauses including `warrantyTerms`, `inspectionTerms`, `returnPolicy`, `cancellationPolicy`, `notes`, and `termsAndConditions`.

`PurchaseOrder` is the primary procurement document model. It includes identity fields such as `poNumber`, `poDate`, `validUntil`, `deliveryDate`, and `quotationReference`; business fields such as `projectDescription`, `placeOfSupply`, `paymentTerms`, and `deliveryTerms`; nested buyer, vendor, delivery, line item, total, and authorization blocks; sharing state; PO approval status; document status; and timestamps.

`BusinessProfile` is the saved company profile used to prefill documents. It stores company names, GST registration data, `address`, `contact`, optional `logoImageBase64`, optional `bankDetails`, default signatory and signature assets, default terms and declaration text, default prefixes, and `updatedAt`.

`SavedClient` is the reusable buyer/vendor directory model with `name`, flattened address fields, `state`, `stateCode`, `gstin`, `email`, `phone`, `placeOfSupply`, `placeOfSupplyCode`, and timestamps.

`SavedService` is the reusable service catalogue model with `description`, `sacCode`, `unit`, `defaultRate`, `defaultGstPercent`, and `createdAt`.

`NumberingConfig` defines one numbering stream using `prefix`, `separator`, `includeYear`, `paddingLength`, and `currentSequence`.

`DocumentTemplateSettings` stores cross-document settings such as invoice and PO numbering, default GST mode, default currency, date format, default notes, terms, declaration text, display toggles, `storedFinancialYear`, and `updatedAt`.

`EmailSettings` stores the sender configuration saved locally for email delivery: `fromName`, `fromEmail`, and `signature`.

`SACCode` defines the in-app SAC reference records with `code`, `description`, `category`, `defaultGstRate`, and keyword `tags`; `HsnSacCodeEntry` remains as a legacy helper shape for the older combobox component.

Internal helper models such as `GSTSplit`, `RawInvoiceLineItem`, `RawPOLineItem`, `DocumentNumberingState`, `RepositoryResult`, and `InvoiceReferenceOption` support calculations, repository responses, numbering sync, and linked-invoice search.

---

## Storage Architecture

The app uses a local-first repository pattern. Every repository writes to browser storage immediately so the app works offline and without authentication; if Supabase is configured and the user is signed in, that same save then attempts a cloud upsert. Reads follow the reverse pattern: load from cloud when auth is available, then mirror the cloud result back into local storage; otherwise fall back to local storage.

Images are treated differently from structured data. Invoice logos, QR codes, and signatures are intentionally stripped before invoice and PO cloud writes and then merged back in from local storage on reads, which keeps the cloud schema simple but also means image sync is intentionally incomplete today.

### Local Storage Keys

| Key | Purpose |
| --- | --- |
| `di_invoices` | Primary invoice collection. |
| `di_purchase_orders` | Primary purchase-order collection. |
| `di_gstin_company_profile` | Main stored company profile object. |
| `di_company_profile` | Legacy/mirrored company profile key used by form-prefill helpers. |
| `di_clients` | Saved client directory. |
| `di_services` | Saved service catalogue. |
| `di_gstin_settings` | Document settings payload. |
| `di_email_settings` | Local sender details for Resend email delivery. |
| `di_gstin_schema_version` | Local migration version marker. |
| `di_conversion_draft` | Invoice conversion handoff payload. |
| `di_gstin_saved_clients` | Legacy client-storage key still read by migrations. |
| `di_gstin_invoices` | Legacy invoice-storage key still read by storage helpers. |
| `di_gstin_purchase_orders` | Legacy purchase-order key still read by storage helpers. |
| `di_nav_collapsed` | Sidebar collapse preference. |
| `di_theme` | Theme preference. |

### Session Storage Keys

| Key | Purpose |
| --- | --- |
| `di_invoice_wip` | Recoverable unsaved invoice form state. |
| `di_po_wip` | Recoverable unsaved purchase-order form state. |

### Additional Browser Keys

| Key | Purpose |
| --- | --- |
| `invoice_split_ratio` | Persisted invoice editor split-pane width. |
| `po_split_ratio` | Persisted PO editor split-pane width. |
| `invoice_conversion_draft` | Non-prefixed legacy invoice conversion draft key retained for compatibility. |

### Supabase Tables

| Table | Purpose |
| --- | --- |
| `profiles` | Signed-in user company profile. |
| `clients` | Saved client directory rows. |
| `invoices` | Invoice records plus JSON `full_data`. |
| `purchase_orders` | Purchase-order records plus JSON `full_data`. |
| `services` | Saved service catalogue rows. |
| `settings` | Settings JSON payload per user. |
| `document_numbering` | Isolated numbering state per user. |

---

## Getting Started (Local)

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file if you want cloud sync or email delivery.

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

5. Optional verification commands:

```bash
npm run type-check
npm run build
```

---

## Environment Variables

| Variable | What it does | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Enables the browser Supabase client used for auth and cloud sync. | Optional for local-only mode; required for cloud sync. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key used by the browser client. | Optional for local-only mode; required for cloud sync. |
| `RESEND_API_KEY` | Enables `/api/send-invoice` to send invoice emails through Resend. | Optional for core app use; required for email delivery. |

---

## How to Use

### First-Time Setup

Open `/company-profile` and enter your company identity, GSTIN, address, contact details, bank details, and optional logo/signature assets. Then add common clients in `/clients` and common services in `/services` so new documents can be filled much faster.

### Creating an Invoice

Open `/invoice/new`, choose the invoice type, review the suggested document number, and keep the company-profile autofill toggle on if you want the saved supplier block locked in. Fill buyer details, place of supply, line items, payment details, notes, and signature details, then save as draft or finalize the invoice.

### Creating a Purchase Order

Open `/purchase-order/new`, confirm the suggested PO number, and fill the PO details, vendor details, delivery block, line items, commercial terms, and authorization names/signatures. Save it as a draft while negotiating or finalize it when it is ready for approval or processing.

### Converting PO to Invoice

Only final POs marked `Approved` can be converted. From the PO editor or the documents page, trigger conversion to create an invoice draft that carries over the vendor as buyer, PO reference, project description, notes, line items, and place-of-supply details.

### Tracking Payments

In the invoice editor, expand Payment Details to record payment status, received amount, received date, payment mode, and transaction reference. If TDS applies, the form can also capture section, rate, deducted amount, and the effective received value.

### Exporting for GST Returns

Use `/reports/aging` for receivables aging and `/reports/gstr1` for GST-return exports. The GSTR-1 page can filter by Indian financial year and month, show validation warnings, and export B2B, B2CS, HSN-summary, or ZIP bundles.

### Signing In for Cloud Sync

If Supabase env vars are configured, open `/auth` and request a magic link. After sign-in, the repositories can sync company profile data, invoices, POs, clients, services, and settings between local storage and Supabase.

---

## Planned Features

The roadmap below comes from the current project brief, but this README keeps it code-accurate. Email delivery via Resend, TDS tracking, and linked credit-note support already exist in the codebase, so the remaining items from the brief are listed here as the active backlog.

### Immediate Next (Ready to build)

- **Razorpay payment link embed**: A generic payment-link field exists today, but there is no Razorpay-specific embed or checkout experience yet.
- **Recurring / retainer invoice scheduling**: Draft and numbering logic exist, but there is no scheduler or recurrence engine.
- **Expense recording with billable tagging**: No expense capture or billable-cost workflow exists today.
- **Proforma to Tax Invoice conversion**: Proforma documents exist, but there is no one-click conversion flow to a tax invoice.

### Phase 2 (Requires Supabase auth)

- **Automated payment reminders**: No scheduled reminder engine exists yet.
- **CA / accountant read-only access**: The current auth model is single-user and owner-scoped.
- **Multi-GSTIN / multi-entity support**: The app currently assumes one company profile at a time.
- **Data export (Excel / CSV full export)**: Reporting exports exist, but there is no full-dataset export of all business data.
- **GST liability monthly summary**: Aging and GSTR-1 exports exist, but there is no monthly liability summary.

### Phase 3 (MicroSaaS expansion)

- **UAE VAT invoice mode (AED, 5% VAT)**: All tax logic, wording, and exports are currently India/GST-specific.
- **WhatsApp Business API integration**: The app currently uses `wa.me` share links, not the Business API.
- **Client portal (per-client invoice view)**: Shared pages exist, but not a client-authenticated portal.
- **Razorpay webhook auto-payment update**: Payment status is still manually maintained.
- **Mobile PWA**: The app is responsive, but there is no PWA manifest/install path.

### Future (Long term)

- **Quotation / estimate tool**: Proforma is available, but there is no dedicated estimate workflow.
- **Project-based billing grouping**: Project description fields exist, but there is no grouped project billing system.
- **Retainer management dashboard**: No retainer health or schedule dashboard exists yet.
- **Vendor bill tracking (AP side)**: Purchase orders exist, but accounts-payable bill tracking does not.
- **Tally / Zoho Books export**: No accounting-export integrations exist yet.

---

## GST Compliance Notes

The current invoice model and preview templates cover the core data fields typically expected for GST-ready invoices under Rule 46: supplier and recipient details, GSTINs, serial number, issue date, line item descriptions, SAC/HSN capture, quantity, rate, taxable value, tax breakup, place of supply, reverse charge flag, totals, and signatory details. The app also supports alternate document types such as credit notes, debit notes, bills of supply, export invoices, and proforma invoices.

This is still a product-level implementation, not legal advice. Before production use, document wording, tax treatment, and filing outputs should be reviewed by a CA or GST practitioner for your exact business, registration type, and transaction patterns.

---

## Logo & Assets

Static brand assets live in `public/`, with the current checked-in files including `public/images/logo.png` and `public/Header logo.png`. User-uploaded logos, signatures, and QR images are typically stored as base64 payloads inside browser storage and injected into document previews from the company profile or document record.

For new static assets, prefer descriptive lowercase file names such as `logo-primary.png`, `logo-mark.svg`, or `invoice-watermark.png`. Keep long-lived shared assets in `public/images/` so they can be referenced consistently from document templates.

---

## License & Credits

Private project. Design Innsaeit. Mumbai.

---

## Built By

Design Innsaeit  
Brand Identity · Packaging Design · Creative Consultancy  
Mumbai · designinnsaeit.com
