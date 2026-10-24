# Independent final review / Task 2 gate

Reviewed 2026-10-21. Initial verdict: **Spec: CHANGES REQUIRED. Quality: CHANGES REQUIRED.** One important explanation defect must be corrected before final acceptance; no critical defect or financial double-counting was found.

## Actionable findings

### P2 — Monthly provident deductions start before the promised “afterwards”

Location: `src/HousingCalculator.tsx:114`, compared with `src/model.ts:279-280`.

In the one-off provident option, the checkbox says `之后继续按月抵扣`, immediately after the future one-off month input. This implies that monthly withdrawals begin after that one-off payment. The model actually enables withdrawals from the first month whenever this checkbox is selected. This changes ordinary cash versus restricted balance before the one-off date and can reduce the balance available for that payment.

Reproduction: use the defaults, enable the loan and provident modules, select one-off use, set the one-off month to 24, enable the checkbox, and compare one year. An independent direct model invocation returned `onceUsed = 0` and `buyWithdrawn = 24000`; the first month already withdrew 2000. The one-off date is outside this horizon, so “afterwards” cannot explain those withdrawals.

Smallest correction: preserve the reviewed accounting behavior, label this as simultaneous monthly deductions beginning in month 1, and explain that they can reduce the balance available for the later one-off payment. Align the README/model explanation. Add a focused regression assertion for this timing contract.

### P3 — Policy source label points to a different kind of page

Location: `src/HousingCalculator.tsx:108`.

The third source is labelled `上海：六税两费减半政策` but opens the broad [Shanghai 2026 housing transaction tax overview](https://www.shanghai.gov.cn/nw17239/20260423/db84274a588149309032977a3df7f916.html). The existing second source, [Shanghai Tax: sale of housing purchased less than two years ago](https://shanghai.chinatax.gov.cn/xwdt/ztzl/grsx/fwjy/csfclsx/202411/t474236.html), is the page that explicitly states the 2023–2027 surcharge reduction. Both pages were read live during this review.

Correction: label the second and third links according to their actual scope. This is a source-navigation defect, not a tax arithmetic defect; no additional source is necessary.

### P3 — Purchase-price scan does not disclose its linked terminal price

Location: `src/HousingCalculator.tsx:131`, `src/model.ts:346`.

The scan says that other conditions are fixed and labels this row `买入房价 ±10%`. Because `saleChange` is fixed, changing the purchase price also changes the absolute terminal valuation/sale price. With the default zero price change, the low/high purchase cases also assume low/high resale prices of 2.7/3.3 million yuan. A reader can otherwise interpret this as a purchase negotiation test at the same future sale price.

Correction: explicitly say that this scan holds the total percentage price change fixed, so terminal value moves with purchase price. Keep the existing calculation.

## Non-blocking wording observation

`src/HousingCalculator.tsx:138` says `不计全部机会成本与生活体验`. Cash investment returns are already included in both paths. Clarifying that the model includes the stated cash-return opportunity cost while excluding nonfinancial experience and other unmodelled factors would avoid users adding another opportunity-cost deduction. This is not evidence that the current arithmetic double-counts costs.

## Scope and evidence

Read the agreed design, UI brief, model and UI implementation reports, prior model review, source and test diffs, current components/model, tests, README, REVIEW, character provenance, Vite setup and entry HTML. Source inspection found no financial-data network transmission, analytics, external fonts, or remote mascot dependencies. Relative Vite base and BASE_URL mascot references support static subdirectory deployment. Public deployment and Hub integration remain unverified and are correctly disclosed.

The UI report records fresh 42 passing unit tests, successful TypeScript/Vite production build, and 8 passing Edge browser tests in 27.3 seconds, including axe base/expanded checks and 390px/reduced-motion coverage. These passing suites were inspected rather than redundantly rerun. The controller separately inspected current desktop/mobile screenshots. This review independently executed only the concrete provident timing reproduction above and live checks of the three linked policy sources.

No further actionable issues were found in active/inactive invalid drafts, collapsed module validation, separate self-use/rental inputs, optional rental-yield isolation, manual tax replacement, conditional exemption labels, 1/23-month chart indexing and endpoint sampling, explicit book-value/final-sale discontinuity, restricted provident asset labels, negative sale proceeds, contribution reconciliation, legal scan clipping, assistant hiding/motion controls, or local assets.

The default zero income tax is correctly treated as zero taxable gain at an unchanged sale price, not confirmed exemption. Sale proceeds deduct remaining debt only once; holding equity is kept separate from ordinary cash. The model review's independent 500-scenario reconciliation remains applicable because this UI implementation did not modify model arithmetic.

Technical checks and this review do not establish user acceptance of the generated character or visual direction. A targeted re-review of the correction is required to change the gate verdict.

## Final targeted re-review — 2026-10-21

**Final verdict: Spec PASS; Quality PASS. This supersedes the initial CHANGES REQUIRED verdict above.** All reported findings are resolved. No remaining actionable finding was identified in the correction wave.

Reviewed `review/final-fix-source-diff.txt`, `review/final-fix-tests-diff.txt`, the UI report's correction-wave evidence, and the final two README notes. This was a scoped re-review; previously passing broad checks were not repeated.

- P2 resolved: `同时从首月按月抵扣` now states the actual start time. Its associated visible/accessibility description explicitly covers a future one-off date and the possible reduction of available balance. `useId` creates a stable description association without altering calculation or selection behavior. README gives the same timing contract. The new browser regression recreates the 24-month one-off/12-month comparison case, checks the corrected accessible description, and confirms that the one-off itself remains outside the horizon.
- Policy-source P3 resolved: the two labels now describe the actual less-than-two-year tax guidance and Shanghai 2026 tax overview. Previously verified URLs are unchanged.
- Scan P3 resolved: the scan and README explicitly state that the terminal percentage change remains fixed, so absolute terminal price changes with the purchase price. The calculation is unchanged.
- Opportunity-cost observation resolved: the method note and README say that the entered cash investment-return opportunity cost is included and must not be deducted again, while nonfinancial/unmodelled factors remain excluded.

The correction is limited to UI explanations, the accessible hint, one focused browser regression and matching documentation. No model arithmetic or styles changed. The implementation report and controller confirm a passing targeted RED/GREEN sequence, 42 passing unit tests (375ms), successful TypeScript/Vite build, and all 9 browser tests passing (36.4s), including the existing accessibility, asset, monthly-chart and mobile checks. These are fresh correction-wave results, not the earlier eight-test milestone.

The approved local implementation is ready for delivery and user visual/interaction acceptance. Public deployment and Hub integration remain outside this completed scope.
