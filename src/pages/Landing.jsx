import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// ─── Animated background for hero ────────────────────────────────────────────

function HeroOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(ellipse, #10b981 0%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'orb-float 14s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.09]"
        style={{
          background: 'radial-gradient(ellipse, #3b82f6 0%, transparent 65%)',
          filter: 'blur(70px)',
          animation: 'orb-float 18s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(ellipse, #10b981 0%, transparent 65%)',
          filter: 'blur(40px)',
          animation: 'orb-float 11s ease-in-out infinite 3s',
        }}
      />
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/98 backdrop-blur-md shadow-2xl shadow-black/30 border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div>
          <span className="text-white text-xl font-bold tracking-tight">ClearShield</span>
          <span className="hidden sm:inline ml-3 text-slate-500 text-xs font-medium tracking-wide">
            Compliance made clear.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-900/30"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen bg-slate-900 flex items-center pt-16">
      <HeroOrbs />

      {/* Fine grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-6 py-32 md:py-40">
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">
              NSF/ANSI 372 · EPA Lead-Free Rule · SDWA 1417
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold text-white leading-[1.08] tracking-tight mb-8">
            One Non-Compliant SKU Can
            <br className="hidden md:block" />
            <span className="text-emerald-400"> Shut Your Business Down.</span>
            <br className="hidden md:block" />
            ClearShield Makes Sure
            <br className="hidden md:block" />
            That Never Happens.
          </h1>

          <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-2xl mb-10">
            The only compliance management platform built exclusively for lead-free brass parts
            distributors. Know exactly which SKUs are sellable, which certs are expiring, and prove
            it in seconds — not hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white text-base font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-emerald-900/40 hover:shadow-emerald-900/60 hover:-translate-y-0.5"
            >
              Start Free &rarr;
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white text-base font-medium px-8 py-3.5 rounded-xl transition-colors"
            >
              See How It Works &darr;
            </a>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-slate-600 text-xs font-medium uppercase tracking-widest">
              Accepted Issuing Bodies
            </span>
            {['NSF International', 'IAPMO', 'CSA Group', 'UL', 'Bureau Veritas'].map((b) => (
              <span key={b} className="text-slate-400 text-sm font-medium">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Pain section ─────────────────────────────────────────────────────────────

const painCards = [
  {
    title: 'Expired certs hiding in your catalog',
    body: 'Your team added a cert in 2022 and moved on. It expired in 2023. You have no idea. That SKU is still listed as sellable — until an auditor or a customer flags it. By then, the damage is done.',
  },
  {
    title: 'Audit day is a fire drill',
    body: "An inspector asks for compliance documentation on 40 SKUs. Someone runs to find the filing cabinet. Someone else digs through email threads. Hours disappear. Nothing looks controlled — because it isn't.",
  },
  {
    title: 'Self-certifications are a liability trap',
    body: "A manufacturer sends you a letter saying their product is lead-free. You file it and treat it as a cert. Without clear categorization, self-certifications and third-party certs look identical — but they carry very different legal weight.",
  },
]

function PainSection() {
  return (
    <section className="py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-5">
            The Problem With How Things Are Done Today.
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Most brass distributors manage lead-free compliance with a mix of spreadsheets,
            shared drives, and tribal knowledge. It's a ticking liability — and every passing
            quarter that catalog is getting harder to audit.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {painCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl border border-slate-200 p-8 relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-2xl" />
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-5">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="text-slate-900 font-semibold text-base mb-3">{card.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Solution section ─────────────────────────────────────────────────────────

function SolutionSection() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            ClearShield Changes Everything.
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            ClearShield is not a generic document manager. It's a purpose-built compliance layer
            for lead-free brass parts — with a data model, workflow, and status logic designed
            specifically for SDWA 1417, NSF/ANSI 372, and the issuing bodies that certify under
            those standards. Every feature exists to answer one of two questions: is this SKU
            compliant right now, and can you prove it on demand?
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-slate-900 rounded-2xl p-10 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl" />
          <svg
            className="w-10 h-10 text-emerald-500/20 mb-6"
            fill="currentColor"
            viewBox="0 0 32 32"
          >
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>
          <blockquote className="text-white text-xl md:text-2xl font-medium leading-relaxed">
            You open your dashboard and you know, in under 10 seconds, exactly how many of your
            SKUs are sellable, how many certs are expiring, and which products you should not be
            shipping today.
          </blockquote>
          <p className="mt-6 text-slate-500 text-sm font-medium">
            The 10-second compliance check — built into every morning.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Features section ─────────────────────────────────────────────────────────

const features = [
  {
    icon: '🟢',
    title: 'Red/Green Sellable Status',
    body: 'Every SKU gets an instant visual signal. Green means a valid cert is on file. Red means expired or missing. No guessing, no interpretation — one glance tells the whole story.',
  },
  {
    icon: '📄',
    title: 'Multi-Document Cert Tracking Per SKU',
    body: 'One SKU can carry multiple compliance documents from different issuing bodies — third-party certs, manufacturer self-certifications, and mill test reports, each independently tracked.',
  },
  {
    icon: '⏰',
    title: 'Expiration Alerts Before It\'s Too Late',
    body: '30, 60, and 90-day warnings surface expiring certs automatically. Know what needs renewal before gaps form in your catalog — without anyone having to check manually.',
  },
  {
    icon: '📋',
    title: 'One-Click Audit Exports',
    body: 'When an inspector walks in, generate a complete, timestamped compliance packet in seconds. Every cert, every issuing body, every expiration date — clean and ready to hand over.',
  },
  {
    icon: '🔍',
    title: 'Global Search + Audit Lists',
    body: 'Search across SKUs, customers, and purchase orders. Add any selection to a named audit list, save it, and re-export whenever needed — the exact proof package each auditor requires.',
  },
  {
    icon: '📥',
    title: 'CSV Bulk Import',
    body: 'Get your entire existing product catalog into ClearShield in minutes. Map your columns, review the preview, and import — no manual data entry, no spreadsheet gymnastics.',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need. Nothing You Don't.
          </h2>
          <p className="text-slate-600 text-lg">
            Built narrow and deep for one industry, one regulation, one job — not a platform that
            tries to do everything for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-slate-200 p-8 hover:border-emerald-200 hover:shadow-md transition-all group"
            >
              <span className="text-3xl mb-5 block">{f.icon}</span>
              <h3 className="text-slate-900 font-semibold text-base mb-3 group-hover:text-emerald-700 transition-colors">
                {f.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

const steps = [
  {
    n: '01',
    title: 'Import Your Catalog',
    body: 'Upload a CSV with your existing SKUs. ClearShield maps your columns and loads your entire product list in minutes — no manual entry required.',
  },
  {
    n: '02',
    title: 'Attach Your Compliance Docs',
    body: 'For each SKU, attach the relevant cert documents — third-party certificates, self-certifications, or mill test reports. Set the issuing body and expiration date.',
  },
  {
    n: '03',
    title: 'Watch Your Dashboard',
    body: 'Your compliance dashboard shows the full picture instantly: sellable, expiring soon, and not sellable — with a drill-down into every problem SKU.',
  },
  {
    n: '04',
    title: 'Stay Ahead of Audits',
    body: 'Get expiration alerts before gaps form. Build audit lists on demand. Export a complete compliance packet whenever a customer or inspector asks for proof.',
  },
]

function HowItWorksSection() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Up and Running in Minutes.
          </h2>
          <p className="text-slate-600 text-lg">
            No lengthy implementation. No consultant required. Most customers have their first
            catalog imported and certs attached within a single afternoon.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line on desktop */}
          <div
            className="hidden md:block absolute top-8 left-0 right-0 h-px bg-slate-200 mx-16"
            aria-hidden="true"
          />

          <div className="grid md:grid-cols-4 gap-8 md:gap-6 relative">
            {steps.map((step, i) => (
              <div key={step.n} className="relative">
                <div className="flex md:flex-col items-start gap-4 md:gap-0">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg md:mb-6">
                      <span className="text-emerald-400 text-sm font-bold tracking-wide">
                        {step.n}
                      </span>
                    </div>
                  </div>
                  <div className="md:pt-0 pt-1">
                    <h3 className="text-slate-900 font-semibold text-base mb-2">{step.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Who it's for ─────────────────────────────────────────────────────────────

const issuingBodies = [
  'NSF International',
  'IAPMO',
  'CSA Group',
  'UL',
  'Bureau Veritas',
  'Manufacturer Self-Certification',
]

function WhoForSection() {
  return (
    <section className="py-28 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Built For You.</h2>
          <p className="text-slate-300 text-lg leading-relaxed mb-12">
            ClearShield is purpose-built for small-to-mid-sized brass parts distributors navigating
            SDWA Section 1417 and NSF/ANSI 372. If you're sourcing lead-free brass fittings,
            valves, or fixtures and reselling them — to plumbing contractors, utilities, or OEMs —
            ClearShield is your compliance infrastructure. Not an add-on to a bigger platform. Not
            a generic doc manager. The thing built for exactly this.
          </p>

          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-5">
              Accepted Certification Types &amp; Issuing Bodies
            </p>
            <div className="flex flex-wrap gap-3">
              {issuingBodies.map((b) => (
                <span
                  key={b}
                  className="bg-white/5 border border-white/10 text-slate-300 text-sm font-medium px-4 py-2 rounded-xl"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Starter',
    price: 'Pricing TBD',
    tagline: 'For small distributors getting started.',
    features: [
      'Up to 500 SKUs',
      'Unlimited cert documents',
      'Red/Green compliance dashboard',
      'CSV bulk import',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: 'Pricing TBD',
    tagline: 'For distributors who need full audit readiness.',
    badge: 'Most Popular',
    features: [
      'Unlimited SKUs',
      'Everything in Starter',
      '30/60/90-day expiration alerts',
      'One-click audit exports',
      'Audit lists & saved lists',
      'Priority support',
    ],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    tagline: 'For large distributors and manufacturers.',
    features: [
      'Everything in Professional',
      'Multi-user access',
      'Custom issuing body configuration',
      'API access (coming soon)',
      'Dedicated onboarding',
      'SLA guarantee',
    ],
    cta: 'Contact Us',
    highlighted: false,
  },
]

function PricingSection() {
  return (
    <section className="py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing.
          </h2>
          <p className="text-slate-600 text-lg">
            No setup fees. No annual contracts required. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? 'bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-900/20 scale-105'
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-emerald-900/30">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3
                  className={`font-bold text-xl mb-1 ${
                    plan.highlighted ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-4 ${
                    plan.highlighted ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {plan.tagline}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    plan.highlighted ? 'text-emerald-400' : 'text-slate-900'
                  }`}
                >
                  {plan.price}
                </p>
              </div>

              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <svg
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        plan.highlighted ? 'text-emerald-400' : 'text-emerald-500'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      className={`text-sm ${
                        plan.highlighted ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/30 hover:-translate-y-0.5'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Closing CTA ──────────────────────────────────────────────────────────────

function ClosingCTA() {
  return (
    <section className="py-28 bg-slate-900 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, #10b981 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 max-w-3xl mx-auto">
          Your Competitors Are Already One Audit Away From a Problem.
          <span className="text-emerald-400"> Make Sure You Aren't.</span>
        </h2>
        <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
          Get your catalog compliant-tracked in an afternoon. No contract. No credit card required
          to start.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center bg-emerald-500 hover:bg-emerald-400 text-white text-base font-semibold px-10 py-4 rounded-xl transition-all shadow-2xl shadow-emerald-900/40 hover:-translate-y-0.5"
        >
          Get Started Free &rarr;
        </Link>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-14">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <span className="text-white font-bold text-lg">ClearShield</span>
          <p className="text-slate-500 text-sm mt-1">
            Compliance visibility for lead-free brass distributors.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Link to="/login" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            Sign In
          </Link>
          <Link to="/privacy" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            Terms
          </Link>
          <span className="text-slate-600 text-sm">
            &copy; 2025 ClearShield. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}

// ─── Landing page ─────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <Hero />
      <PainSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <WhoForSection />
      <PricingSection />
      <ClosingCTA />
      <Footer />
    </div>
  )
}
