# ClearShield — Project Context for Claude Code

## What this product is
ClearShield is a B2B SaaS platform that helps companies in the plumbing/water industry manage, match, and produce audit-ready certification proof for lead-free compliance — specifically SDWA Section 1417 and NSF/ANSI 372 (and related standards like NSF/ANSI 61).

Core value proposition: ClearShield is a compliance documentation layer, not an order management, inventory, or invoicing system. It exists to answer two questions fast: "is this SKU compliant?" and "show me proof." It is explicitly NOT trying to replace whatever order/ERP/invoicing system a customer already uses.

## Target market
- Primary ICP (first 10–15 customers): small-to-mid brass distributors.
- Secondary: small/mid manufacturers and importers (higher liability exposure under SDWA 1417 — manufacturers/importers carry primary legal liability, distributors carry secondary exposure, especially private-labelers).
- Future: plumbing wholesalers, larger retailers.
- Utilities are explicitly NOT a near-term target — different use case (vendor verification vs. self-management), longer sales cycles, deprioritized for now.

## Standing scope rules (do not violate without an explicit new decision)

1. ClearShield does not manage outbound orders, shipments, or invoicing. Distributors already run that through QuickBooks, an ERP, or their own process. Do not build order/shipment entities or transactional enforcement against them. If real enforcement is ever needed later, the correct shape is a small API/webhook a customer's existing system can call — not an internal order system. This is a "build only if a paying customer asks" item, not a roadmap commitment.
2. Compliance status flags are soft indicators, not hard gates, on SKU creation/editing. A SKU can always be added/edited/linked to a PO regardless of compliance status. Only the status display (red/green) reflects whether it's backed by valid documentation.
3. Issuing bodies are NOT limited to NSF. Certifications may come from NSF, IAPMO, CSA Group, UL, or Bureau Veritas. Don't build anything that assumes NSF is the only certifying body.
4. Self-certifications are a distinct, valid state — not missing data. A manufacturer self-certification has no third-party issuing body by design. This should be visibly flagged as its own risk tier ("self-certified, no third-party verification"), never treated as a null/error/incomplete state.

## Schema reference
Database schema is finalized as `ClearShield_Schema_v2` — 13 tables across four domains: Core Product, Identity & Access, Session Tracking, and Audit & Activity. Always check current schema conventions before adding new tables or relationships rather than assuming a pattern.

## Today's Build Session

### Build order
1. Cert document schema changes (foundation for everything below)
2. Compliance status flag, red/green (quick win, high demo impact)
3. Search + entity pages + selection mechanism (most complex — do with remaining time)
4. One-click audit export (depends on #3 being in place)
5. Expiration alerting (fast-follow if time remains)

### 1. Cert Document Schema Changes
Goal: A single SKU can have multiple linked compliance documents, each independently tagged by type and issuing body.

Fields to add/modify on the cert/document record:
- `document_type` (enum): `third_party_certificate`, `manufacturer_self_certification`, `mill_test_report`, `other`
- `issuing_body` (enum, nullable): `NSF`, `IAPMO`, `CSA_Group`, `UL`, `Bureau_Veritas`, `other`, `null`
  - `null` is valid and expected when `document_type = manufacturer_self_certification`. Flag this visibly in the UI as "self-certified, no third-party verification" — see standing scope rule #4 above.
- Relationship change: a SKU should support one-to-many documents, not one cert per SKU. Confirm against `ClearShield_Schema_v2` how SKU/batch/PO relationships are currently modeled before implementing.

Migration note: existing single-cert-per-SKU data needs a migration path — default `document_type = third_party_certificate` and prompt a backfill of `issuing_body` where unknown, rather than leaving it null silently (null should mean "self-cert," not "we don't know").

### 2. Compliance Status Flag on SKUs (Red / Green)
Goal: Every SKU has a clear, visible compliance status. Per standing scope rule #2, this is a soft indicator only — never blocks SKU creation/editing.

Two states:
- 🟢 Sellable — at least one valid (non-expired) qualifying compliance document attached.
- 🔴 Not sellable / pending documentation — no qualifying document attached, or all attached documents expired.

Implementation:
- Add a computed/derived `compliance_status` field on the SKU, driven by linked documents (Section 1).
- Surface prominently and consistently: SKU detail view, search results, gap dashboard, anywhere a SKU appears in a list.
- Clear messaging on why a SKU is red (no document attached vs. expired on [date]).
- This is the highest-impact demo moment — make red/green states clean and unambiguous at a glance.

### 3. Global Search + Entity Pages + Persistent Selection ("Audit List")
Goal: Let a user find SKUs, customers, or POs, filter meaningfully, and build a cross-entity selection to export now or save for later.

Structure:
- Separate pages per entity: Products/SKUs, Customers, Purchase Orders — each with entity-appropriate filters.
  - SKU filters: issuing body, document type, expiration status (expired / expiring soon / valid), manufacturer/supplier, product category.
  - Customer filters: active/inactive, region (scope based on available data).
  - PO filters: date range, manufacturer/supplier, associated SKUs.
- Global search bar (persistent in header/nav): categorized matches across all three entities as the user types, each result clickable and routing to the relevant entity page.

Selection / "Audit List" mechanism:
- Checkbox on each row (SKU, customer, PO) adds it to a persistent selection — shopping-cart pattern, survives navigation across entity pages within a session.
- Visible, persistent selection indicator (badge/counter) present on every page.
- Two actions from the selection view:
  - Export now — triggers the audit export (Section 4) for the current selection, then optionally clears.
  - Save as list — prompts for a name (e.g. "Q2 Audit – Acme Plumbing"), persists separately from live selection state.
- Saved lists viewable from a dedicated "Saved Lists" view: name, date created, item count, with re-open/edit/re-export/delete.

Data model implication: likely needs a new `audit_lists` table plus a join table (`audit_list_items`) referencing SKU/customer/PO IDs generically (polymorphic association or nullable FKs, per existing schema conventions) — confirm against `ClearShield_Schema_v2` before implementing.

### 4. One-Click Audit Export
Goal: Generate a timestamped, clean compliance packet for a given selection (ties directly into Section 3).

- Input: a list of SKU IDs (or POs, or customers).
- Output: for each SKU — current compliance status, all linked documents (type + issuing body + expiration), relevant PO/sourcing history.
- Format: confirm with Caleb whether PDF (hand-to-inspector) or CSV/spreadsheet (internal use) is the priority to build first.
- Triggerable both from a single SKU's detail view and from the multi-select audit list (Section 3).

### 5. Expiration Alerting
Goal: Proactive notification, not just dashboard-only visibility.

- 30/60/90-day expiration warnings on compliance documents, surfaced without requiring the user to check the dashboard manually.
- Lower priority — fast-follow if session time is tight.