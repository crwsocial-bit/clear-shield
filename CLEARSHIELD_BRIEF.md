# ClearShield — Project Brief

## What Is ClearShield?

ClearShield is a SaaS compliance documentation tool for waterworks and brass parts distributors who sell NSF/ANSI 372 lead-free certified components. It solves a specific, high-stakes problem: these distributors have no clean system for tracking certification documentation across their product catalog, leaving them exposed to significant regulatory liability.

## The Problem

The EPA Lead Free Rule has been enforceable since September 2023. Civil penalties up to $71,545/day. Distributors are named liable parties. Most manage certifications with spreadsheets or nothing at all. No purpose-built software exists for the distributor tier.

## Target Customer

Owners and operations managers at small-to-mid-size waterworks and brass parts distributors. The founder previously sold NSF/ANSI 372 certified brass parts — this is domain expertise, not an outside guess.

## Core Features (MVP only — do not build beyond this without discussion)

- **CSV Import** — bulk upload SKUs with certification data
- **Certification Logging** — track NSF/ANSI 372 cert status per SKU (cert number, issuing body, expiration)
- **Audit-Ready Report Generation** — one-click formatted compliance report export
- **Dashboard** — certification coverage, expiring certs, catalog gaps
- **User Auth** — secure login per distributor account via Supabase Auth

## Tech Stack

React (Vite) · Supabase · Vercel · Stripe · GitHub · Tailwind CSS

## Business Model

Setup fee ($3K–$10K) + annual license, tiered by monthly order volume. ~11–15 customers replaces founder's current employment income.

## Build Schedule

10-day off-rotations. Claude writes all code. Founder deploys and tests.

## How to Work in Claude Code Sessions

- Always read this brief at the start of a session
- State the specific feature being built before writing any code
- Keep scope to MVP features only
- Write production-quality code — this will have real paying customers
- Give step-by-step deployment instructions the founder can follow
