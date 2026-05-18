# Aramco Taleed · Sustainability Diagnostic Prototype

A clickable web prototype of the **Sustainability Diagnostic & Partner Accreditation Platform** based on the Functional Requirements Document (v Draft 1.0, May 2026).

> ⚠️ This is a **UI/UX prototype for client review**. No backend — all data is mocked / stored in `localStorage`.
> The approved design will later be implemented as a **Statamic 6 plugin**.

## 🔗 Live demo

https://moueidat123.github.io/sustainability-diagnostic-prototype/

## 📋 Scope covered

**Phase 1 — Carbon Diagnostic MVP**
- Company profile · Sites · Scope 1 Fuels · Scope 1 Fleet · Scope 2 Electricity
- Emission-factor calculation engine (tCO₂e)
- Site-level & company-level dashboards
- Submission workflow (Draft → Submitted → Under Review → Approved)
- PDF + Excel export

**Phase 2 — Partner Accreditation (preview)**
- Partner categories · Essential / Advanced / Elite tiers
- Stages: Assessment → Offer Development → Go-Live Prep → Market Launch

## 🛠 Stack

React 19 · Vite 8 · TypeScript · TailwindCSS v4 · React Router · Lucide Icons

## 🚀 Local development

```bash
npm install
npm run dev
```

Deployment is automatic via GitHub Actions on every push to `main`.
