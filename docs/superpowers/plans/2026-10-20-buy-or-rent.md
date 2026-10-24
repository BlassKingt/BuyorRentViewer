# Buy or Rent V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Tasks execute sequentially with fresh review.

**Goal:** Deliver the agreed rental/sale calculator, explainable results and original anime assistant.
**Architecture:** Pure monthly TypeScript model returns cash/asset ledger, tax estimate and contributions. React renders progressive controls, scans and policy guidance. Generated local raster assets and CSS provide the mascot.
**Tech Stack:** Existing React, TypeScript, Vite, Vitest, Playwright.
**Spec:** `../specs/2026-10-20-buy-or-rent-design.md`

## Global Constraints
- Scope calculator only; no deployment or remote Git operations.
- Return default1.5%, loan15years, commercial3%, provident2.6%, fund80000/month2000.
- Mode rent expense and target rental income are distinct. Equal initial resources and external monthly budget.
- Default five years with visible exit assumptions, no hidden time switch.
- Tax policy snapshot is conditional, not future policy prediction or sale eligibility.
- Contributions sum to asset difference; cash and provident balances separated.
- Static, local computation, relative assets, scoped CSS, mobile and reduced motion.

## Review Focus
- Month boundaries23/24/59/60: VAT/PIT timing and no floating off-by-one.
- Negative rent/net sale proceeds: no fictitious budget/income or silently clamped losses.
- Invalid hidden/collapsed inputs: inactive ignores, collapsed active blocks stale results.
- Fund uses preserve total wealth and don't confer automatic withdrawal eligibility.
- Contribution ledger and sensitivity use same actual result definition, no double costs.

### Task 1: Pure model and financial validation
Files: src/model.ts, new src/analysis.ts or src/tax.ts if useful, tests/model.test.ts and focused new unit test files.
Interfaces: Preserve Scenario/defaults/simulate/payment/validate exported entrypoints as practical; extend Simulation with explicit ledger, sale/tax breakdown and contribution entries. Export scan function with labelled actual tested bounds and impacts. Report exact final API to Task2.
- [x] Write failing tests for default5yr, rental income with equal living costs cancelling, net/details equivalent, VAT23/24 and PIT59/60 confirmed/not, manualtax override.
- [x] Run vitest and confirm expected failures.
- [x] Implement spec; migrate old optional-time tests to new semantics while preserving old closed-form financial tests with explicit10yr/no-exit settings.
- [x] Add contribution reconciliation across modes/fund/debt/fees/negative proceeds and sensitivity against direct simulate checks.
- [x] Run unit tests; write report with command/output, API and caveats.
- [x] Fresh reviewer reviews model/spec; fix findings before Task2.

### Task 2: Page, character and explainers
Files: src/HousingCalculator.tsx, src/AssetChart.tsx, styles.css, new focused components if useful, public/mascot/*, index.html, tests/browser.spec.ts.
Consumes Task1 model API. Produces working named 买或租 app.
- [x] Write/update browser scenarios for visible5years, mode independent inputs, time policy triggers, manualtax, explanation sum, scan controls, emptyinput recovery, mascot hide/motion, responsive layout.
- [x] Run one targeted test against old UI and see failure.
- [x] Implement progressive controls, readable result/cash/fund breakdown, chart clearly marking book vs exit value, contribution and scan panels and linked policy guide.
- [x] Integrate original halfbody and chibi. Keep local assets, load efficiently, no forced animation.
- [x] Run build and browser scenarios; screenshots1440x1080 and390x844; fix failures.
- [x] Fresh reviewer reviews UI/spec; fix findings.

### Task 3: Final verification and documentation
Files README.md, REVIEW.md, docs/character-assets.md, this plan/ledger.
- [x] Verify npm test, npm run build, npm run test:browser after final edits.
- [x] Inspect actual screenshots and independent model examples.
- [x] Update docs removing superseded one-year/time-off rules, document policy snapshot/limitations and deployment.
- [x] Final independent whole-project review; deliver local URL, character files, test evidence and remaining real limitations.

No Git repository exists: use local before snapshots and diff packages for reviews; do not initialize/publish parent workspace. User explicitly requested immediate execution, so no repeat plan approval gate.

