# Task 1 — monthly financial model

Implemented `src/model.ts` and `tests/model.test.ts`; no UI or browser tests edited. No commit or deployment.

## Verification

- RED: `npm test`, 2026-10-20 21:07 local — 16 failed, 23 passed. Failures showed the old one-year/time-toggle horizon and missing rental, tax, ledger and sensitivity behavior.
- GREEN: `npm test`, 21:09 local — 42 passed, one test file.
- `npm run build` — TypeScript and Vite passed against the previous UI.

## Exact inputs and defaults

Existing Scenario keys remain. `time` is retained for compatibility but ignored: `years` (integer 0..60) plus `additionalMonths` (integer 0..11) always determines the horizon, constrained to 1..720 total months. Default five years and zero extra months.

New fields:

| Field | Type | Default |
|---|---|---|
| purpose | own / rental | own |
| rentalInput | net / details | net |
| rentalNetMonthly | yuan, signed operating net before mortgage | 4500 |
| rentalGrossMonthly | yuan | 5000 |
| rentalMonthsPerYear | 0..12, fractional allowed | 11 |
| rentalAnnualCosts | yuan | 1000 |
| additionalMonths | integer | 0 |
| saleChange | total terminal percentage change, minimum -100 | 0 |
| saleFeeRate | sale price percentage, 0..100 | 1 |
| taxMode | auto / manual | auto |
| manualTax | total yuan, replaces auto taxes | 0 |
| exemption | unknown / confirmed / not-eligible | unknown |
| taxDeductible | explicitly eligible tax deduction, yuan | 0 |
| vatSurchargeRate | percentage of VAT, 0..100 | 12 |

`sell=true` by default and is independent of `costs`; sale fields remain active even when the extra purchase/upkeep cost module is off. `saleCost` is additional fixed selling expense, default zero. `saleFeeRate` and `saleCost` both apply once. `saleChange` is also active for continuing-hold book valuation. Tax/fee fields are inactive when holding.

Other defaults retained: return 1.5%; loan off, commercial test rate 3%, fifteen years; provident account off with remembered 80000 opening balance, 2000 monthly deposit and 1.5% interest. A provident loan selection can set `loanRate=2.6`; no loan-kind or combination-loan abstraction was added.

## Exports

- `defaults`, `Scenario`, `validate(s): string[]`, `simulate(s): Simulation`, `payment(principal, annualRate, months)`.
- `comparisonMonths(s)`; `comparisonYears(s)` returns months/12. Legacy `isLongTerm(s)` always returns true.
- `rentalIncome(s)`: signed average monthly operating net, direct input or `(gross * annualMonths - annualCosts) / 12`.
- `annualComparison(s)`: legacy simplified annual headline, using the active purpose; excludes debt, costs, taxes and exit.
- `estimateTax(s, months?)`: `{mode, vat, surcharge, incomeTax, manual, total, taxableGain, vatExempt, exemptionStatus}`. Automatic mode: VAT before month24, PIT exemption only at month60 with all conditions confirmed. Unknown confirmation remains conservative. Manual mode returns zero auto components and the entered total. Standalone caller should validate the active tax fields first; simulation always validates.
- `taxPolicy`: date, location, note and three source URLs from the agreed spec. Twelve percent surcharge is an explicit trial assumption, not a uniform tax rate or an assumed extension of the 2027 relief.
- `scanSensitivity(s): Sensitivity[]`: four sorted rows `{key,label,low,high,clipped,lowDifference,highDifference,span}`. Keys: price; rent (own), rentalNetMonthly (net rental), or rentalGrossMonthly (detailed rental); returnRate; saleChange. Tests recompute both endpoints using simulate. Return bounds clip to 0..100, property change to -100, price lower bound to the cash down payment when loan is enabled. Signed rental net bounds are sorted. `span=abs(highDifference-lowDifference)` is an endpoint impact comparison within the shown range, not a contribution or prediction.

## Simulation outputs

All prior fields remain. Additional fields:

- `sale`: `{executed, price, remainingLoan, fees, tax, netProceeds}`. Price is terminal assumed property value. Net proceeds are price minus remaining loan, taxes and selling fees. If `executed=false`, fees/taxes are zero and `netProceeds` is unsold equity, not cash received: UI must only label it as sale proceeds when executed.
- `contributions`: nine `{key,label,amount}` rows for housing savings, rental net, property change, mortgage interest, upfront/holding/selling costs, cash interest difference and provident interest difference. Sum equals total difference. Principal repayment, ordinary deposits and transfers are excluded.
- `ledger`: cashInterestBuy, cashInterestRent, fundInterestBuy, fundInterestRent, housingSavings, rentalIncome, upfrontCosts, holdingCosts, sellingCosts, propertyChange, externalBudget. `externalBudget` is the equal total ordinary cash added to each path, excluding equal provident deposits. Its monthly floor is zero.
- `cashDifference` and alias `liquidDifference`: final ordinary cash difference. `fundDifference`: restricted account difference. `propertyDifference`: unsold net property equity, zero after a sale. `difference` and alias `totalDifference`: total net asset difference. Identity: total = cash + restricted fund + retained property equity.
- Point adds `propertyValue` and `buyBook`. Intermediate property values remain purchase price; only the chosen endpoint is revalued. No predicted intermediate price path. `buyBook` is net assets before final sale fees/taxes; `buy` is the selected result, after liquidation at the terminal point when selling. Final buyCash includes sale receipts; propertyValue becomes zero after sale. Point.debt retains the mortgage balance immediately before the possible terminal sale for chart/report compatibility; use sale.remainingLoan as the exit deduction, never subtract it again from final buy.

## Cash-flow assumptions

Own occupation uses `rent` as the alternative housing expense. Rental mode uses target rental net income and cancels common living expenses, so `rent` does not affect the result. `rentFund` only applies in own occupation mode after the user supplies that qualification assumption. It never infers eligibility. Separate annualCost is property upkeep and must exclude operating costs already inside rental net income.

Opening balances earn monthly interest; equal external deposits occur at month end. A delayed provident one-off payment follows that month's scheduled mortgage payment and re-amortizes the remaining balance for the remaining loan term. Early one-off transfers are bounded by eligible debt/equity and account balance. The horizon can extend beyond loan maturity. Negative operating income and negative sale proceeds remain visible.

Input validation rejects nonfinite active fields and ignores inactive paths. The tax result is a conditional estimate under the policy snapshot; it does not determine actual sale eligibility, full transaction taxes, future policy or deductibility of unconfirmed costs.
