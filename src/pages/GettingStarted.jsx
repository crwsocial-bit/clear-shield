import { Link } from 'react-router-dom'

function Callout({ children, type = 'info' }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    tip: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
  }
  const icons = {
    info: (
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tip: (
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  }
  return (
    <div className={`flex gap-3 border rounded-xl px-4 py-3.5 text-sm leading-relaxed my-4 ${styles[type]}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  )
}

function UILabel({ children }) {
  return (
    <span className="inline-flex items-center bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg font-mono">
      {children}
    </span>
  )
}

function StepHeader({ n, title }) {
  return (
    <div className="flex items-start gap-5 mb-6">
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 text-sm font-bold flex items-center justify-center shadow-sm">
        {String(n).padStart(2, '0')}
      </div>
      <h2 className="text-2xl font-bold text-slate-900 leading-tight pt-2">{title}</h2>
    </div>
  )
}

function Divider() {
  return <hr className="border-slate-100 my-12" />
}

export default function GettingStarted() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-6 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
            Getting Started
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
          Your First 30 Minutes with ClearShield
        </h1>
        <p className="text-slate-500 text-base leading-relaxed">
          This guide walks you through the four core workflows in ClearShield. Follow these steps
          in order and you'll have your catalog imported, your first certs attached, and a real
          audit export in your hands — all within a single afternoon.
        </p>
      </div>

      {/* Table of contents */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-12">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          In this guide
        </p>
        <ol className="space-y-2">
          {[
            'Add your first product',
            'Attach compliance documents to a SKU',
            'Read your compliance dashboard',
            'Build an audit list and export',
          ].map((t, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="text-emerald-500 font-bold text-sm">{i + 1}.</span>
              <span className="text-slate-700 text-sm font-medium">{t}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Step 1 ──────────────────────────────────────────────────────────── */}
      <div>
        <StepHeader n={1} title="Add Your First Product" />

        <p className="text-slate-600 text-base leading-relaxed mb-4">
          Products in ClearShield are SKUs — the individual part numbers in your catalog. You can
          add them one at a time or import your entire catalog in bulk via CSV.
        </p>

        <h3 className="font-semibold text-slate-900 text-base mb-3">Option A — Bulk CSV Import (recommended)</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-3">
          If you already have your product catalog in a spreadsheet, bulk import is the fastest
          path. ClearShield accepts any CSV with a column for your SKU or part number.
        </p>
        <ol className="space-y-2 mb-4">
          {[
            <>Navigate to <UILabel>Products</UILabel> in the top navigation.</>,
            <>Click <UILabel>Import CSV</UILabel> in the top-right corner.</>,
            <>Upload your CSV file. ClearShield will show you a column mapping preview.</>,
            <>Map your columns to the expected fields: <UILabel>sku</UILabel>, <UILabel>description</UILabel>, <UILabel>manufacturer</UILabel>, <UILabel>part_number</UILabel>. Only SKU is required.</>,
            <>Click <UILabel>Import</UILabel>. Your products will appear in the list immediately.</>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        <Callout type="tip">
          Your CSV doesn't need to be perfectly formatted. ClearShield handles extra columns,
          irregular headers, and partial data — just make sure there's a column with your SKU or
          part number in it.
        </Callout>

        <h3 className="font-semibold text-slate-900 text-base mb-3 mt-6">Option B — Add a single product</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-3">
          To add a single product manually:
        </p>
        <ol className="space-y-2">
          {[
            <>Navigate to <UILabel>Products</UILabel>.</>,
            <>Click <UILabel>Add Product</UILabel>.</>,
            <>Fill in the SKU (required) and any other details you have: description, manufacturer, part number, product category, and cert scope.</>,
            <>Click <UILabel>Save</UILabel>. The product is now in your catalog with a <span className="font-semibold text-red-600">Not Compliant</span> status until you attach a cert document.</>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <Divider />

      {/* ── Step 2 ──────────────────────────────────────────────────────────── */}
      <div>
        <StepHeader n={2} title="Attach Compliance Documents to a SKU" />

        <p className="text-slate-600 text-base leading-relaxed mb-4">
          Once a product exists in your catalog, you need to attach its compliance documentation.
          A single SKU can have multiple documents — for example, a third-party NSF cert plus a
          manufacturer self-certification. ClearShield tracks each one independently.
        </p>

        <ol className="space-y-2 mb-6">
          {[
            <>From the <UILabel>Products</UILabel> page, find the SKU you want to update and click on it to open the product detail panel.</>,
            <>Scroll to the <UILabel>Compliance Documents</UILabel> section and click <UILabel>Add Document</UILabel>.</>,
            <>Choose a <strong>Document Type</strong>:<br />
              <ul className="mt-2 space-y-1 ml-4 text-slate-500">
                <li><span className="font-medium text-slate-700">Third-Party Certificate</span> — issued by NSF, IAPMO, CSA Group, UL, or Bureau Veritas</li>
                <li><span className="font-medium text-slate-700">Manufacturer Self-Certification</span> — a letter or declaration from the manufacturer (no third-party issuing body)</li>
                <li><span className="font-medium text-slate-700">Mill Test Report</span> — material composition report from a mill</li>
                <li><span className="font-medium text-slate-700">Other</span> — any other supporting document</li>
              </ul>
            </>,
            <>If the document type is a third-party cert, select the <strong>Issuing Body</strong> (NSF International, IAPMO, CSA Group, UL, or Bureau Veritas).</>,
            <>Set the <strong>Expiration Date</strong>. Most NSF/ANSI 372 certs renew annually — use the cert's listed expiration, not the issue date.</>,
            <>Click <UILabel>Save</UILabel>. The SKU's status will immediately update to <span className="font-semibold text-emerald-600">Compliant</span> if the cert is not expired.</>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        <Callout type="warning">
          Self-certifications are valid compliance documents, but they carry a different legal risk
          profile than third-party certs. ClearShield flags them visibly as "self-certified, no
          third-party verification" — treat them accordingly when preparing for an audit.
        </Callout>

        <Callout type="info">
          <strong>Backfilling existing certs:</strong> If you imported a catalog that previously
          had a single cert per SKU, those documents default to type "third-party certificate."
          Open each product and confirm the issuing body and expiration date — don't leave them
          blank, as a null issuing body signals a self-certification, not missing data.
        </Callout>
      </div>

      <Divider />

      {/* ── Step 3 ──────────────────────────────────────────────────────────── */}
      <div>
        <StepHeader n={3} title="Read Your Compliance Dashboard" />

        <p className="text-slate-600 text-base leading-relaxed mb-4">
          The Dashboard is the first thing you see when you log in. It gives you a real-time
          compliance snapshot across your entire catalog — no filtering, no searching required.
        </p>

        <div className="space-y-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="font-semibold text-slate-900 text-sm">Total SKUs</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              The total number of products in your catalog. This is your baseline.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-900 text-sm">Compliant</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              SKUs with at least one valid, non-expired qualifying compliance document. These are
              safe to ship. The percentage shown is your catalog's overall compliance rate.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="font-semibold text-slate-900 text-sm">Expiring Soon</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              SKUs that are still sellable, but have a cert expiring within 90 days. Click this
              card to see the list sorted by expiration date — these need attention before they
              flip to red.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="font-semibold text-slate-900 text-sm">Not Compliant</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              SKUs with an expired cert or no cert on file at all. Click this card to drill
              down — it separates expired certs (cert existed, now lapsed) from missing certs
              (no documentation attached). These two sub-groups need different remediation.
            </p>
          </div>
        </div>

        <Callout type="tip">
          Compliance status is a soft indicator — it affects what's displayed on the dashboard and
          in search results, but it never blocks you from editing or shipping a SKU. The status
          reflects documentation state, not a hard system gate.
        </Callout>
      </div>

      <Divider />

      {/* ── Step 4 ──────────────────────────────────────────────────────────── */}
      <div>
        <StepHeader n={4} title="Build an Audit List and Export" />

        <p className="text-slate-600 text-base leading-relaxed mb-4">
          When an inspector asks for compliance proof — or a customer requests documentation for
          the SKUs on a purchase order — you build an audit list and export it as a complete
          compliance packet in seconds.
        </p>

        <h3 className="font-semibold text-slate-900 text-base mb-3">Building a list</h3>
        <ol className="space-y-2 mb-6">
          {[
            <>Navigate to <UILabel>Products</UILabel>, <UILabel>Companies</UILabel>, or <UILabel>Audit Lists</UILabel>.</>,
            <>Use the checkboxes on the left side of each row to select the SKUs, customers, or purchase orders you want in your export.</>,
            <>As you check items, a counter appears in the top navigation bar showing how many items are in your current list. This persists as you navigate between pages — you can mix SKUs from Products and customers from Companies in the same list.</>,
            <>When your selection is ready, click the <UILabel>List</UILabel> badge in the navbar to open the audit list panel.</>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        <h3 className="font-semibold text-slate-900 text-base mb-3">Exporting</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-3">
          From the audit list panel, you have two options:
        </p>
        <div className="space-y-3 mb-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="font-semibold text-slate-900 text-sm mb-1">Export Now</p>
            <p className="text-slate-500 text-sm leading-relaxed">
              Generates a timestamped compliance packet for your current selection. For each SKU,
              the export includes: current compliance status, all attached documents with type,
              issuing body, and expiration date, and relevant sourcing history. Use this when an
              inspector is in front of you.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="font-semibold text-slate-900 text-sm mb-1">Save as List</p>
            <p className="text-slate-500 text-sm leading-relaxed">
              Saves your selection under a name (e.g. "Q2 Audit — Acme Plumbing"). Saved lists
              appear in the <UILabel>Audit Lists</UILabel> page, where you can re-open, re-export,
              or delete them at any time. Use this for recurring customers or scheduled audits.
            </p>
          </div>
        </div>

        <Callout type="tip">
          You can also trigger a single-SKU export directly from the product detail panel, without
          building a list first. This is useful for quick one-off documentation requests.
        </Callout>
      </div>

      <Divider />

      {/* Footer nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <p className="text-slate-500 text-sm">
          Questions? Reach out at{' '}
          <a href="mailto:support@clearshield.app" className="text-blue-600 hover:underline">
            support@clearshield.app
          </a>
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          Go to Dashboard &rarr;
        </Link>
      </div>
    </div>
  )
}
