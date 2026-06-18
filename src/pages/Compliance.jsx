const LAST_REVIEWED = 'June 2026'

const CERT_BODIES = [
  { name: 'NSF International',        url: 'https://www.nsf.org',              note: 'Developed the NSF/ANSI 372 standard; maintains certified product listings' },
  { name: 'CSA Group',                url: 'https://www.csagroup.org',          note: 'Accredited third-party certifier for NSF/ANSI 372' },
  { name: 'IAPMO',                    url: 'https://www.iapmo.org',             note: 'Accredited by ANSI; certifies plumbing and mechanical products' },
  { name: 'UL (Underwriters Labs)',   url: 'https://www.ul.com',               note: 'Accredited third-party certifier; issues UL certification marks' },
  { name: 'Bureau Veritas',           url: 'https://www.bureauveritas.com',     note: 'International accredited testing and certification body' },
]

const OFFICIAL_LINKS = [
  { label: 'EPA — Lead in Drinking Water',                url: 'https://www.epa.gov/ground-water-and-drinking-water/lead-drinking-water-regulation' },
  { label: 'Safe Drinking Water Act Section 1417 (Text)', url: 'https://www.epa.gov/sdwa/section-1417-prohibition-lead-pipes-solder-and-flux' },
  { label: 'NSF/ANSI 372 Standard Overview',             url: 'https://www.nsf.org/knowledge-library/nsf-ansi-372-drinking-water-lead-content' },
  { label: 'NSF Certified Product Listings',             url: 'https://info.nsf.org/Certified/PwMaterials/' },
  { label: 'ANSI — Drinking Water Standards',            url: 'https://www.ansi.org' },
]

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <p className="text-sm font-medium text-gray-500 w-44 shrink-0">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}

export default function Compliance() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compliance Reference</h1>
        <p className="text-gray-500 text-sm mt-1">NSF/ANSI 372 &amp; EPA Lead-Free Rule — quick reference for distributors</p>
      </div>

      {/* Disclaimer banner */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-sm text-yellow-800">
        <span className="font-semibold">For reference only.</span> This page summarizes requirements as of{' '}
        <span className="font-medium">{LAST_REVIEWED}</span>. Regulations may change. Always verify current requirements
        against the official sources linked at the bottom of this page. This is not legal advice.
      </div>

      <div className="space-y-5">

        {/* The Rule */}
        <Section title="The EPA Lead-Free Rule">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Section 1417 of the Safe Drinking Water Act (SDWA), as amended by the{' '}
            <span className="font-medium">Reduction of Lead in Drinking Water Act</span>, prohibits the introduction
            into commerce of any pipe, pipe fitting, plumbing fitting, or fixture that is not "lead-free" and is
            intended to convey or dispense water for human consumption.
          </p>
          <div className="divide-y divide-gray-50">
            <Row label="Enforceable since"     value="September 2023" />
            <Row label="Civil penalty exposure" value="Up to $71,545 per day per violation" />
            <Row label="Liable parties"         value="Manufacturers, importers, wholesalers, distributors, and retailers" />
            <Row label="Applies to"             value="Pipes, pipe fittings, plumbing fittings, and fixtures used to convey or dispense water for human consumption" />
            <Row label="Exemptions"             value="Products used exclusively for non-potable services (irrigation, industrial, fire protection)" />
          </div>
        </Section>

        {/* NSF/ANSI 372 Standard */}
        <Section title="NSF/ANSI 372 — Drinking Water System Components: Lead Content">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            NSF/ANSI 372 is the industry standard that defines how "lead-free" is measured and tested for
            wetted-surface components. Products certified to this standard satisfy the material requirements of the EPA Lead-Free Rule.
          </p>
          <div className="divide-y divide-gray-50">
            <Row label="Lead content limit"    value='≤0.25% weighted average lead content across all wetted surfaces' />
            <Row label="Prior limit (pre-2014)" value="≤8.0% — the 2011 federal amendment reduced this to 0.25%" />
            <Row label="Measurement basis"     value="Weighted average of lead content across all wetted surface components, not total product weight" />
            <Row label="Testing requirement"   value="Third-party testing and certification by an ANSI-accredited certification body" />
            <Row label="Certification mark"    value="Product must bear the certification body's mark and be listed in their certified product directory" />
            <Row label="Standard scope"        value="Covers metallic and non-metallic components including brass, bronze, copper alloys, and polymeric fittings" />
          </div>
        </Section>

        {/* Annual renewal model */}
        <Section title="How NSF/ANSI 372 Certification Works — Annual Renewal Model">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            NSF/ANSI 372 certification is <span className="font-medium">not a one-time event</span>. It is valid for
            one year and must be actively renewed by the manufacturer on an annual basis. The certification body
            maintains ongoing oversight throughout the year through the following mechanisms:
          </p>
          <ul className="space-y-2.5 mb-5">
            {[
              { item: 'Annual facility audits',     detail: 'Inspectors review manufacturing plants and confirm material formulations match what was originally certified.' },
              { item: 'Periodic retesting',          detail: 'Products are pulled from the production line and retested to verify the 0.25% weighted average lead limit is still met.' },
              { item: 'Unannounced inspections',     detail: 'NSF inspectors may visit a manufacturer\'s facility without advance notice at any point during the certification year.' },
              { item: 'Change reviews',              detail: 'Any changes to manufacturing processes, material suppliers, or product design must be reviewed and approved before the change is made.' },
            ].map(({ item, detail }) => (
              <li key={item} className="flex gap-3 text-sm">
                <span className="text-blue-500 mt-0.5 shrink-0">→</span>
                <span><span className="font-medium text-gray-900">{item}</span> — <span className="text-gray-600">{detail}</span></span>
              </li>
            ))}
          </ul>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
            <span className="font-semibold">Think of it like a driver's license.</span> The manufacturer must renew
            their "license" every year to prove they are still operating safely. As long as their license was valid on
            the day they manufactured and sold you the product, that product is legally compliant.
          </div>
        </Section>

        {/* Who is responsible */}
        <Section title="Who Is Responsible for Certification — Manufacturer vs. Distributor">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Manufacturer's responsibility</p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {[
                  'Obtain initial NSF/ANSI 372 certification',
                  'Pay renewal fees and pass audits every year',
                  'Maintain consistent materials and processes',
                  'Notify the cert body of any product changes',
                  'Ensure their listing stays active in the cert body\'s public directory',
                ].map((t, i) => <li key={i} className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>{t}</li>)}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Distributor's responsibility</p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {[
                  'Verify the manufacturer\'s cert is active at time of purchase',
                  'Retain cert documentation for every SKU in your catalog',
                  'Monitor cert renewal dates and re-verify annually',
                  'Stop selling any product whose cert lapses or is revoked',
                  'Produce documentation upon request from customers or regulators',
                ].map((t, i) => <li key={i} className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>{t}</li>)}
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            <span className="font-medium text-gray-800">Important: </span>
            Once you purchase a certified product, that product does not need to be re-certified by you.
            Your obligation is to verify the manufacturer's certification was active on the date of manufacture/sale,
            and to monitor their ongoing renewal status.
          </p>
        </Section>

        {/* What a valid cert must show */}
        <Section title="What a Valid Certification Must Include">
          <p className="text-sm text-gray-700 mb-4">
            When reviewing a certificate of compliance from a manufacturer, confirm it includes all of the following:
          </p>
          <ul className="space-y-2.5">
            {[
              { item: 'Certification number', detail: 'Unique identifier traceable in the certification body\'s public directory' },
              { item: 'Issuing body',          detail: 'Name of the ANSI-accredited certification organization (NSF, CSA, IAPMO, UL, etc.)' },
              { item: 'Product scope',         detail: 'Specific product(s) or product family covered — must match the SKU being sold' },
              { item: 'Standard certified to', detail: 'Must reference NSF/ANSI 372 explicitly' },
              { item: 'Issue date',            detail: 'Date the certification was granted or last renewed' },
              { item: 'Renewal date',          detail: 'The date by which the manufacturer must renew — verify the cert is active, not lapsed' },
              { item: 'Manufacturer name',     detail: 'Must match the manufacturer of record for the product you are distributing' },
            ].map(({ item, detail }) => (
              <li key={item} className="flex gap-3 text-sm">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                <span><span className="font-medium text-gray-900">{item}</span> — <span className="text-gray-600">{detail}</span></span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Distributor obligations */}
        <Section title="Distributor Obligations">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Distributors are explicitly named as liable parties under SDWA Section 1417. Key obligations include:
          </p>
          <ul className="space-y-2.5">
            {[
              'Only purchase and resell products that are certified lead-free by an ANSI-accredited certification body.',
              'Obtain and retain a copy of the certification documentation for every SKU in your catalog.',
              'Confirm certifications are current at time of each sale — an expired cert does not satisfy the rule.',
              'Do not sell products whose certification has lapsed, been suspended, or revoked.',
              'Be prepared to produce certification documentation upon request from customers, utilities, or regulators.',
              'If a manufacturer withdraws or loses certification, remove the product from sale immediately.',
            ].map((text, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-blue-500 mt-0.5 shrink-0">→</span>
                <span className="text-gray-700">{text}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Accepted certification bodies */}
        <Section title="ANSI-Accredited Certification Bodies">
          <p className="text-sm text-gray-600 mb-4">
            Only certifications issued by ANSI-accredited bodies are accepted under NSF/ANSI 372.
          </p>
          <div className="divide-y divide-gray-50">
            {CERT_BODIES.map(({ name, url, note }) => (
              <div key={name} className="py-2.5 flex gap-4">
                <div className="w-44 shrink-0">
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline">{name}</a>
                </div>
                <p className="text-sm text-gray-600">{note}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Official sources */}
        <Section title="Official Sources">
          <p className="text-sm text-gray-600 mb-4">
            Always use these sources to verify current requirements, check certified product listings, or confirm a certificate is valid.
          </p>
          <ul className="space-y-2.5">
            {OFFICIAL_LINKS.map(({ label, url }) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1.5">
                  {label}
                  <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </Section>

      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Last reviewed: {LAST_REVIEWED} · ClearShield does not provide legal advice · Verify all requirements with official sources
      </p>
    </div>
  )
}
