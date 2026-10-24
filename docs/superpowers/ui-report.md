# Task 2 — complete V2 application UI

Implemented the approved light Housing Lab interface named 买或租 in the existing calculator project. React components consume the reviewed monthly model directly. No model, model unit test, dependency, Git, parent-project or deployment changes were made by the UI implementation agent.

## Files

- `src/HousingCalculator.tsx`: full progressive parameter workbench, purpose and rental-input controls, explicit monthly comparison period, loan/fund/cost modules, exit and conditional tax settings, policy sources, results, asset categories, contribution ledger, parameter scans and local deterministic research notes.
- `src/AssetChart.tsx`: integer-month selection, final-month sampling, one-month and 23-month horizons, clearly labelled one-time terminal valuation/sale adjustment.
- `src/styles.css`: scoped `hc-` light laboratory design, responsive two-column/stacked layouts, original character presentation, animation opt-out and reduced-motion support.
- `index.html`: 买或租 title, local-simulation description and light theme metadata.
- `tests/browser.spec.ts`: replaces obsolete optional-time tests with eight V2 integration scenarios. Expanded desktop screenshot explicitly resets scroll to the top before capture.
- Existing `src/NumberField.tsx` was retained; draft values remain in parent state across collapse and mode switches.
- Integrated existing final assets `public/mascot/researcher-v1.png` and `researcher-chibi-v1.png` through `import.meta.env.BASE_URL`. No images were regenerated or edited.

## Model API and correctness boundaries

- Uses `defaults`, `Scenario`, `validate`, `simulate`, `comparisonMonths`, `rentalIncome`, `scanSensitivity` and `taxPolicy` from `src/model.ts`.
- Blank numeric drafts become non-finite values only in the effective calculation scenario. Model validation ignores inactive fields and blocks active invalid fields even when their module is collapsed. Stored drafts are preserved. A shortcut clears only the fields it explicitly updates.
- Self-use optional rental estimation uses the separate remembered rental fields and never increases self-use cash flow. Invalid optional estimation renders unavailable; switching into that active rental input path correctly blocks results.
- Outputs use model total net assets, with ordinary cash, restricted provident funds and retained property equity separately available in the asset breakdown. Selling displays conditional post-sale wealth and a single model-provided net-proceeds deduction; `Point.debt` is not subtracted again.
- Chart selects `result.points[integerMonth]`. Intermediate points are book values; its dashed terminal segment is expressly labelled as the one-time price/sale-fee/tax assumption, not a forecast market jump.
- Contribution rows sort signed actual ledger amounts and expose `合计 = 差额`; displayed row amounts use cents. The sum uses the model result and may have rounding tails, explained beside the table. Parameter scan ranges, endpoint differences and rankings all come from model re-simulation; units and percentage-point changes are explicit.
- Automatic tax settings distinguish unknown, confirmed and ineligible conditions; zero tax is not labelled as confirmed exemption. Manual tax replaces automatic estimates. Policy remains the agreed 2026-10-20 Shanghai snapshot, with links, conditional surcharge assumptions and sale-eligibility limitations.
- Assistant notes are deterministic text from the current scenario, not an AI service. Invalid results produce no stale conclusion. Both characters can be hidden/restored, animation can be disabled, and reduced motion also disables animation and smooth note scrolling.

## Verification evidence

Working directory for all commands: `D:\01work\workspace\10House_calculator\calculator`.

1. RED on old UI, 2026-10-20: `npm run test:browser -- --grep 'explicit five year'` — one expected failure, because the old UI did not provide the V2 headline/purpose contract.
2. Initial integrated run found four failures: three test locator mismatches (headline whitespace and nested summary titles), and a genuine 3px mobile overflow from a rotated decorative orbit. Locators were corrected to their accessible/summary structure; orbit width was reduced. No financial assumptions were weakened to make tests pass.
3. Recovered complete prior run output: `npm run test:browser` — **8 passed (32.3s)**, 2026-10-20. This was recovered from the original command session, not inferred solely from `.last-run.json`.
4. Fresh final verification, 2026-10-21: `npm test` — **42 passed**, one test file; duration 349ms.
5. Fresh final verification: `npm run build` — TypeScript and Vite successful; generated JS 285.26kB / gzip 89.37kB, CSS 23.28kB / gzip 5.60kB.
6. Fresh final verification after the screenshot scroll adjustment: `npm run test:browser` — **8 passed (27.3s)** in Microsoft Edge against the reusable local Vite server at `http://127.0.0.1:5173`.

Browser scenarios cover independent own/rental inputs and negative net income; rental details and optional estimation; 23/24/60-month policy transitions, manual tax, holding and one-month chart; active collapsed blank drafts, targeted presets and keyboard slider; funds, costs, contribution rows and scans; complete image loading, same-page notes, hide/show and motion controls; axe base/expanded WCAG 2 A/AA and 2.1 AA; 390px mobile, reduced motion and expanded-state horizontal overflow. Both axe passes reported zero violations. Resource checks reported no HTTP errors; chart boundary checks reported no page errors.

## Screenshots and visual review

Fresh browser suite produced:

- `D:\01work\workspace\10House_calculator\calculator\test-results\v2-desktop.png` — 1440px desktop default.
- `D:\01work\workspace\10House_calculator\calculator\test-results\v2-desktop-expanded.png` — desktop exit/tax, loan, fund, ledger and scan expanded.
- `D:\01work\workspace\10House_calculator\calculator\test-results\v2-mobile.png` — 390px mobile default.
- `D:\01work\workspace\10House_calculator\calculator\test-results\v2-mobile-expanded.png` — mobile fund/exit/scan expanded.

UI agent inspected desktop default, desktop expanded and mobile default raster captures. First desktop screen includes the hero, two primary inputs, visible defaults and result/chart. Mobile content stacks without horizontal overflow. Expanded content stays in the document; there is no floating assistant or fixed overlay obstructing inputs.

## Limits and handoff

Task 2 implementation and technical checks are complete, pending the controller's fresh independent UI/whole-project review. No unresolved implementation blocker is known. This is a local static simulation, not validation of actual tax eligibility, loan approval, transaction liquidity or investment outcomes. No public deployment or Hub-project verification was performed. UI state persists during interactions but is not saved across a page reload; long-term storage was outside the approved scope.

## Final-review correction wave — 2026-10-21

Addressed the single P2, two P3 and non-blocking wording observation in `docs/superpowers/final-review.md`, without changing model arithmetic or styles.

- Changed the one-off provident option from `之后继续按月抵扣` to `同时从首月按月抵扣`. A `useId`-linked accessible hint explicitly says withdrawals start in month 1, before a future one-off date, and may reduce the balance available for that payment. The reviewed first-month withdrawal behavior is preserved.
- Corrected policy link labels to `不足两年住房出售税费` and `上海2026住房交易税费概览`; link targets are unchanged.
- Explained that the purchase-price scan fixes the total percentage price change, so absolute terminal value moves with purchase price; this is not a negotiation comparison at fixed future resale price.
- Clarified that the entered cash investment yield opportunity cost is already included and must not be deducted twice; housing experience and other unmodelled factors are excluded.
- Appended only two matching semantic notes to README, as authorized by the controller.

Added one focused browser regression: enable loan/fund, select one-off month 24, compare 12 months, enable the simultaneous monthly checkbox, verify its accessible timing/running-balance explanation, and verify actual one-off use remains 0 because its date is outside the horizon.

Exact verification commands, same calculator working directory:

1. RED: `npm run test:browser -- --grep 'future one-off provident'` — **1 failed**, expected missing corrected checkbox label; 30.7s. This ran before the production wording change.
2. GREEN: same targeted command — **1 passed (5.3s)**.
3. `npm test` — **42 passed**, one file; duration 375ms.
4. `npm run build` — TypeScript/Vite passed; JS 285.75kB / gzip 89.58kB, CSS unchanged at 23.28kB / gzip 5.60kB.
5. `npm run test:browser` — **9 passed (36.4s)**, including the new regression and existing base/expanded axe, image-loading, monthly chart and 390px/reduced-motion checks. Four screenshot paths above were regenerated by this run.

Current final browser count is **9**, superseding the earlier 8-test milestone. No model, unit-test, style, dependency or deployment changes were made in this correction wave. Ready for the controller's targeted re-review; technical verification does not itself change the independent review verdict.
