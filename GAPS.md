# Gap Analysis — GST Invoice Studio
Date: 2026-04-29

## Features Planned But Not Yet Implemented

### Public Cloud-Backed Share Links
Status: Needs fixing
Effort: Medium
Depends on: Supabase public-share design, RLS-safe read path, share-token indexing
Description: `/share/[shareToken]` works only from local browser storage or for the signed-in owner because `getByShareToken()` depends on authenticated repository access. That means WhatsApp shares and the “View Invoice” CTA in emailed invoices are not truly public cloud-backed links yet.

### Razorpay Payment Link Embed
Status: Partially built
Effort: Medium
Depends on: Razorpay integration design, frontend payment UX, optional webhook work
Description: A generic `paymentLink` field exists in bank details, but there is no Razorpay-specific embed, checkout button, or branded payment-link flow.

### Recurring / Retainer Invoice Scheduling
Status: Not started
Effort: High
Depends on: Scheduling model, recurrence UI, background jobs or client-side reminders
Description: Draft auto-save and numbering exist, but there is no recurrence engine, schedule manager, or retainer invoice generator.

### Expense Recording with Billable Tagging
Status: Not started
Effort: High
Depends on: New expense data model, storage tables, UI, and reporting
Description: The codebase has no expense ledger, upload flow, or ability to mark an expense as billable to a client or project.

### Proforma to Tax Invoice Conversion
Status: Partially built
Effort: Medium
Depends on: Conversion mapping, action buttons, numbering policy
Description: Proforma invoices exist as a document type, but there is no dedicated conversion action equivalent to the PO-to-invoice flow.

### Automated Payment Reminders
Status: Not started
Effort: High
Depends on: Supabase auth, reminder scheduler, email or messaging transport
Description: Aging and payment status tracking exist, but there is no reminder engine for upcoming or overdue invoices.

### CA / Accountant Read-Only Access
Status: Not started
Effort: High
Depends on: Supabase auth roles, invitation flow, RLS policy changes
Description: Authentication is currently single-owner and there is no concept of delegated read-only access.

### Multi-GSTIN / Multi-Entity Support
Status: Not started
Effort: High
Depends on: Company-profile refactor, entity switching UI, schema changes
Description: The app is designed around one active company profile and one numbering context at a time.

### Data Export (Excel / CSV Full Export)
Status: Partially built
Effort: Medium
Depends on: Export packaging for all models
Description: Aging and GSTR-1 reports export data, but there is no one-click export of all invoices, POs, clients, services, settings, and company profile data.

### GST Liability Monthly Summary
Status: Not started
Effort: Medium
Depends on: Tax summarization logic, report UI, filing assumptions
Description: The code can calculate invoice taxes and generate GSTR-1 CSVs, but there is no month-wise liability dashboard.

### UAE VAT Invoice Mode
Status: Not started
Effort: High
Depends on: Multi-country tax abstraction, currency support, template branching
Description: The current calculations, labels, and exports are India/GST-specific.

### WhatsApp Business API Integration
Status: Partially built
Effort: Medium
Depends on: Backend integration, template approval, messaging auth
Description: The app supports `wa.me` sharing only. It does not integrate with the official WhatsApp Business API.

### Client Portal
Status: Partially built
Effort: High
Depends on: Public/shared access model, client auth, portal UI
Description: A shared-document page exists, but there is no client-scoped portal or account area for viewing invoice history.

### Razorpay Webhook Auto-Payment Update
Status: Not started
Effort: High
Depends on: Razorpay integration, secure webhook route, payment reconciliation
Description: Payment status and received values are still entered manually.

### Mobile PWA
Status: Not started
Effort: Medium
Depends on: Manifest, service worker, install UX, offline strategy
Description: The app is responsive but has no PWA install or offline-app packaging.

### Quotation / Estimate Tool
Status: Partially built
Effort: Medium
Depends on: Dedicated quote workflow, lifecycle states, template language
Description: Proforma invoices cover part of the use case, but there is no separate quotation module.

### Project-Based Billing Grouping
Status: Partially built
Effort: Medium
Depends on: Project model, grouping UI, reporting
Description: Project description fields exist on invoices and POs, but there is no project-based grouping or billing dashboard.

### Retainer Management Dashboard
Status: Not started
Effort: High
Depends on: Recurrence engine, project/contract model, reporting
Description: No retainer-specific overview or utilization tracking is present.

### Vendor Bill Tracking (AP Side)
Status: Not started
Effort: High
Depends on: AP data model, payable workflow, vendor bill UI
Description: Purchase orders exist, but the codebase does not track incoming vendor bills or payable status.

### Tally / Zoho Books Export
Status: Not started
Effort: Medium
Depends on: Export mapping, target-format specs, reconciliation rules
Description: No accounting-system export format is implemented.

## Routes Referenced But Not Created

None found in the scanned route and navigation references. Sidebar, dashboard actions, inline links, redirects, and editor actions all resolve to existing pages or route handlers.

## Components Referenced But Incomplete

No actively imported component in the current route flow looked partially stubbed or half-built.

Legacy unused components do remain:

- `components/ui/HsnSacCombobox.tsx` still references `@/data/sac-codes.json`, which is not part of the scanned active code path.
- `components/document/BrandedA4Template.tsx` and `components/document/DesignInnsaeitDocumentShell.tsx` appear to be alternate document shells that are not used by the current invoice or PO preview flow.

## Known Issues Found in Code

- Debug logging is still committed in `components/invoice/sections/BuyerDetailsSection.tsx` and `components/invoice/sections/LineItemsSection.tsx`, including `console.log` output of saved clients and services.
- `lib/defaults/companyProfile.ts` contains hardcoded live-looking business data, including GSTIN, PAN, bank account details, dates, email, phone number, and Mumbai address. This should be user-provided data or a safer blank seed.
- Shared-document access is not truly public. `invoicesRepository.getByShareToken()` and `purchaseOrdersRepository.getByShareToken()` require authenticated cloud context and otherwise fall back to local browser data only.
- GSTR-1 warnings are overly broad in `app/(app)/reports/gstr1/page.tsx`: invoices without buyer GSTIN are warned even when they are valid B2C invoices, which can create false warnings.
- Saved clients and saved services are read directly from `localStorage` once on mount in several form sections instead of using the shared hooks. Open forms do not live-refresh those lists after catalogue changes elsewhere in the app.
- `components/document/BrandedA4Template.tsx` hardcodes a misspelled brand name, `Design Innsait`.
- `components/ui/HsnSacCombobox.tsx` is stale dead code that points at a non-active SAC source and could break if reused without cleanup.

## Data Model Gaps

- `SavedService` in `lib/types/service.ts` has no `updatedAt` field, while the Supabase `services` table stores `updated_at`. The repository currently discards that value when mapping back into the app type.
- The company profile type includes defaults such as `defaultSignatoryName`, `defaultSignatureImageBase64`, `defaultTermsAndConditions`, `defaultDeclaration`, `defaultInvoicePrefix`, and `defaultPOPrefix`, but those values are not represented in the Supabase profile row model and therefore do not round-trip through cloud sync.

## Supabase Gaps

- The `profiles` table in `supabase/schema.sql` does not have columns for `defaultSignatoryName`, `defaultSignatureImageBase64`, `defaultTermsAndConditions`, `defaultDeclaration`, `defaultInvoicePrefix`, or `defaultPOPrefix`, even though the UI and company profile type use them.
- The `profiles` table has `logo_url` and `signature_url` columns, but `companyProfileRepository` writes both as `null`, so logo and signature assets are effectively local-only.
- Invoice and purchase-order image assets are intentionally stripped before cloud save and then restored from local storage, so cloud sync is incomplete for `logoImageBase64`, QR images, and signature images.
- There is no dedicated public-share table or public `share_token` column for `invoices` or `purchase_orders`. Cloud share lookup currently loads owner-scoped rows and filters the `full_data` JSON client-side.
- There is no Supabase persistence layer for `di_email_settings`, so sender configuration is browser-local even when the user is signed in.
