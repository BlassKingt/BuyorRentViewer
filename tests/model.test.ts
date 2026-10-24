import { describe, expect, it } from 'vitest';
import { annualComparison, comparisonYears, defaults, estimateTax, payment, rentalIncome, scanSensitivity, simulate, validate, type Scenario } from '../src/model';

const scenario = (patch: Partial<Scenario> = {}): Scenario => ({ ...defaults, time: true, years: 10, sell: false, saleFeeRate: 0, ...patch });
const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(0.01);

describe('annual learning model', () => {
  it('shows the approved two-input example', () => {
    expect(annualComparison(defaults)).toEqual({ buy: 54000, rent: 45000, difference: 9000 });
  });
  it('shows the actual sensitivity of rent and return', () => {
    expect(annualComparison({ ...defaults, rent: 5000 }).difference).toBe(15000);
    close(annualComparison({ ...defaults, returnRate: 1.6 }).difference, 6000);
  });
});

describe('independent cash-flow checks', () => {
  it('always uses the explicitly selected horizon regardless of legacy time flag', () => {
    for (const patch of [{ loan: true }, { costs: true }, { fund: true }]) {
      const s = scenario({ ...patch, time: false, years: 20 });
      expect(comparisonYears(s)).toBe(20);
      expect(simulate(s).end.month).toBe(240);
      expect(simulate({ ...s, time: true }).end.month).toBe(240);
    }
  });
  it('does not execute a planned prepayment outside the selected horizon', () => {
    const s = scenario({ years: 1, loan: true, fund: true, fundUse: 'once', fundMonth: 24 });
    expect(validate(s)).toHaveLength(0);
    close(simulate(s).onceUsed, 0);
    close(simulate({ ...s, years: 2 }).onceUsed, s.fundOnce);
  });
  it('matches a closed form for all-cash purchase and monthly invested rent savings', () => {
    const s = scenario(); const result = simulate(s);
    const rate = 1.015 ** (1 / 12) - 1;
    close(result.end.buy, s.price + s.rent * ((1 + rate) ** 120 - 1) / rate);
    close(result.end.rent, s.price * 1.015 ** 10);
  });
  it('has equal initial assets before transaction fees, including fund use', () => {
    for (const loan of [false, true]) {
      const r = simulate(scenario({ loan, loanRate: 3, fund: true, fundUse: 'once' }));
      close(r.points[0].buy, r.points[0].rent);
    }
  });
  it('treats zero-rate principal payments as transfers, not costs', () => {
    const s = scenario({ loan: true, loanRate: 0, returnRate: 0, loanYears: 10 });
    const r = simulate(s);
    close(r.difference, s.rent * 120);
    close(r.end.debt, 0);
    close(r.interestPaid, 0);
  });
  it('matches a known mortgage payment and remaining-principal formula', () => {
    const s = scenario({ loan: true, loanRate: 3, loanYears: 30 });
    const p = payment(2_400_000, 3, 360);
    close(p, 10118.496809506943);
    const r = simulate(s);
    close(r.end.debt, 2_400_000 * 1.0025 ** 120 - p * (1.0025 ** 120 - 1) / .0025);
    close(r.principalPaid + r.end.debt, r.initialLoan);
  });
  it('keeps comparing after the loan is paid off', () => {
    const r = simulate(scenario({ loan: true, loanRate: 3, loanYears: 5, years: 10 }));
    close(r.points[60].debt, 0);
    close(r.points[120].debt, 0);
    expect(r.points[120].buyCash).toBeGreaterThan(r.points[60].buyCash);
  });
  it('deducts purchase, upkeep and exit costs exactly once at zero returns', () => {
    const s = scenario({ returnRate: 0, costs: true, upfrontCost: 60000, annualCost: 12000, sell: true, saleCost: 80000 });
    close(simulate(s).difference, s.rent * 120 - 60000 - 120000 - 80000);
  });
  it('deducts selling cost only from the final observation', () => {
    const a = simulate(scenario({ costs: true }));
    const b = simulate(scenario({ costs: true, sell: true, saleCost: 50000 }));
    close(a.points[119].buy, b.points[119].buy);
    close(a.end.buy - b.end.buy, 50000);
  });
  it('treats equal untouched provident accounts as cancelling from the difference', () => {
    const a = simulate(scenario());
    const b = simulate(scenario({ fund: true }));
    close(a.difference, b.difference);
    expect(b.end.buyFund).toBeGreaterThan(defaults.fundBalance + defaults.fundMonthly * 120);
  });
  it('does not change principal repayment when the fund replaces a monthly cash payment', () => {
    const base = scenario({ loan: true, loanRate: 3, fund: true });
    const a = simulate(base);
    const b = simulate({ ...base, fundUse: 'monthly' });
    close(a.end.debt, b.end.debt);
    close(a.interestPaid, b.interestPaid);
    close(a.firstCashPayment - b.firstCashPayment, defaults.fundLimit);
    // With equal fund/cash yields, source-of-payment changes alone cannot create wealth.
    close(a.difference, b.difference);
  });
  it('limits monthly withdrawals to account balance and actual payment', () => {
    const s = scenario({ loan: true, loanRate: 3, fund: true, fundBalance: 100, fundMonthly: 10, fundRate: 0, fundUse: 'monthly', fundLimit: 999999, rentFund: true, rentFundLimit: 999999 });
    const r = simulate(s);
    close(r.buyWithdrawn, 1300); close(r.rentWithdrawn, 1300);
    for (const p of r.points) { expect(p.buyFund).toBeGreaterThanOrEqual(0); expect(p.rentFund).toBeGreaterThanOrEqual(0); }
  });
  it('keeps a pure source transfer neutral at zero yields', () => {
    const base = scenario({ loan: true, loanRate: 0, returnRate: 0, fund: true, fundRate: 0 });
    const a = simulate(base);
    for (const fundUse of ['monthly', 'once'] as const) {
      for (const fundMonth of [0, 12]) {
        const b = simulate({ ...base, fundUse, fundMonth, rentFund: true });
        close(a.difference, b.difference);
      }
    }
  });
  it('reduces initial debt, keeping cash down payment separate from the fund', () => {
    const r = simulate(scenario({ loan: true, loanRate: 3, fund: true, fundUse: 'once' }));
    close(r.initialLoan, 2_320_000); close(r.initialCash, 600000); close(r.onceUsed, 80000);
  });
  it('full-cash upfront fund use reduces required common cash, not total initial wealth', () => {
    const r = simulate(scenario({ fund: true, fundUse: 'once' }));
    close(r.initialCash, 2_920_000); close(r.initialLoan, 0);
    close(r.points[0].buy, 3_000_000); close(r.points[0].rent, 3_000_000);
  });
  it('delayed fund prepayment reduces debt and interest and stays within the loan', () => {
    const s = scenario({ loan: true, loanRate: 3, fund: true });
    const a = simulate(s);
    const b = simulate({ ...s, fundUse: 'once', fundMonth: 12 });
    close(a.points[11].debt, b.points[11].debt);
    close(a.points[12].debt - b.points[12].debt, 80000);
    expect(b.interestPaid).toBeLessThan(a.interestPaid);
  });
  it('does not consume a fund withdrawal when there is no debt to repay', () => {
    const r = simulate(scenario({ fund: true, fundUse: 'once', fundMonth: 12 }));
    close(r.onceUsed, 0); close(r.buyWithdrawn, 0);
  });
  it('withdrawals for rent at equal returns do not create extra assets', () => {
    const s = scenario({ fund: true });
    close(simulate(s).difference, simulate({ ...s, rentFund: true }).difference);
  });
});

describe('model guardrails', () => {
  it('requires an explicit loan rate, but accepts 0%', () => {
    expect(validate(scenario({ loan: true, loanRate: null }))).not.toHaveLength(0);
    expect(validate(scenario({ loan: true, loanRate: 0 }))).toHaveLength(0);
  });
  it('rejects invalid active fields without changing them silently', () => {
    for (const patch of [{ price: 0 }, { rent: -1 }, { returnRate: NaN }, { years: 1.5 }, { years: 61 }, { loan: true, down: 4_000_000 }, { fund: true, fundUse: 'once' as const, fundMonth: 721 }])
      expect(validate(scenario(patch)).length).toBeGreaterThan(0);
  });
  it('ignores inactive inputs', () => {
    expect(validate(scenario({ loan: false, loanRate: null, costs: false, annualCost: -1, fund: false, fundBalance: -1 }))).toHaveLength(0);
    expect(validate(scenario({ fund: true, fundUse: 'keep', fundAlsoMonthly: true, fundLimit: -1 }))).toHaveLength(0);
  });
  it('conserves principal across a deterministic set of loan/fund scenarios', () => {
    for (let i = 1; i <= 24; i++) {
      const r = simulate(scenario({ price: 1_000_000 + i * 10000, down: 250000, loan: true, loanRate: i / 8, loanYears: 5 + i, years: 15, fund: true, fundUse: 'once', fundMonth: i, fundOnce: 10000 * i, fundAlsoMonthly: true }));
      close(r.principalPaid + r.onceUsed + r.end.debt, r.initialLoan);
      expect(r.points.every(p => Number.isFinite(p.buy) && Number.isFinite(p.rent) && p.debt >= 0 && p.buyFund >= 0 && p.rentFund >= 0)).toBe(true);
    }
  });
});

describe('explicit horizon, purpose and sale', () => {
  it('defaults to a five-year sale and separates cash sale receipts from restricted funds', () => {
    const r = simulate(defaults);
    expect(r.end.month).toBe(60);
    close(r.sale.price, 3000000);
    close(r.sale.netProceeds, 2970000);
    close(r.end.buy, r.end.buyCash + r.end.buyFund);
    close(r.cashDifference + r.fundDifference, r.difference);
  });
  it('uses exact monthly horizons and keeps loan maturity independent', () => {
    const r = simulate(scenario({ years: 1, additionalMonths: 11, loan: true, loanYears: 15 }));
    expect(r.end.month).toBe(23);
    expect(r.end.debt).toBeGreaterThan(0);
    close(comparisonYears(scenario({ years: 1, additionalMonths: 11 })), 23 / 12);
  });
  it('cancels common living costs in rental mode and never creates a negative external budget', () => {
    const s = scenario({ purpose: 'rental', years: 1, returnRate: 0, rentalNetMonthly: 10000 });
    const a = simulate(s), b = simulate({ ...s, rent: 1000000, rentFund: true, fund: true, fundRate: 0 });
    close(a.difference, 120000);
    close(b.difference, a.difference);
    close(a.ledger.externalBudget, 0);
    close(a.end.buyCash, 120000);
    close(a.end.rentCash, s.price);
    close(b.rentWithdrawn, 0);
  });
  it('net rental and detailed rental estimate produce equivalent cash flows with costs counted once', () => {
    const s = scenario({ purpose: 'rental', returnRate: 0, costs: true, annualCost: 1200, rentalNetMonthly: 3500 });
    const details = { ...s, rentalInput: 'details' as const, rentalGrossMonthly: 5000, rentalMonthsPerYear: 10, rentalAnnualCosts: 8000 };
    close(rentalIncome(details), 3500);
    close(simulate(s).difference, 408000);
    close(simulate(details).difference, 408000);
    close(simulate({ ...s, purpose: 'own', rentalNetMonthly: 999999 }).difference, 528000);
  });
  it('keeps negative sale proceeds visible and does not deduct principal twice', () => {
    const r = simulate(scenario({ years: 0, additionalMonths: 1, loan: true, down: 0, loanRate: 0, returnRate: 0, sell: true, saleChange: -100, saleCost: 50000, taxMode: 'manual', manualTax: 10000 }));
    close(r.sale.netProceeds, -3043333.3333333335);
    close(r.difference, 4500 - 3000000 - 50000 - 10000);
    expect(r.end.buyCash).toBeLessThan(0);
  });
});

describe('Shanghai sale tax snapshot', () => {
  it.each([[23, 90000, 10800], [24, 0, 0], [59, 0, 0], [60, 0, 0]])('VAT boundary at month %i', (months, vat, surcharge) => {
    const t = estimateTax(scenario({ price: 3000000, saleChange: 3 }), months);
    close(t.vat, vat); close(t.surcharge, surcharge);
  });
  it('requires confirmed full exemption conditions and sixty months', () => {
    const s = scenario({ saleChange: 10, exemption: 'confirmed' });
    close(estimateTax(s, 59).incomeTax, 60000);
    close(estimateTax(s, 60).incomeTax, 0);
    close(estimateTax({ ...s, exemption: 'unknown' }, 60).incomeTax, 60000);
    expect(estimateTax({ ...s, exemption: 'unknown' }, 60).exemptionStatus).toBe('unconfirmed');
  });
  it('subtracts only explicit eligible deductions and surcharge from the income-tax base', () => {
    const s = scenario({ saleChange: 10, costs: true, upfrontCost: 500000, annualCost: 50000, taxDeductible: 10000 });
    const t = estimateTax(s, 23);
    close(t.incomeTax, (3300000 / 1.03 - 3000000 - 10000 - (3300000 / 1.03 * .03 * .12)) * .2);
    close(estimateTax({ ...s, saleChange: -10 }, 23).incomeTax, 0);
  });
  it('manual total replaces automatic taxes instead of stacking on top', () => {
    const s = scenario({ years: 1, sell: true, saleChange: 10, taxMode: 'manual', manualTax: 12345 });
    const r = simulate(s);
    close(r.sale.tax.total, 12345);
    close(r.sale.netProceeds, 3300000 - 12345);
    close(r.sale.tax.vat + r.sale.tax.surcharge + r.sale.tax.incomeTax, 0);
  });
});

describe('contribution and sensitivity evidence', () => {
  it('keeps zero loans and empty fund accounts finite without phantom withdrawals', () => {
    const s = scenario({ years: 0, additionalMonths: 1, loan: true, down: 3000000, loanRate: 0, fund: true, fundBalance: 0, fundMonthly: 0, fundRate: 0, fundUse: 'once', fundAlsoMonthly: true, rentFund: true, returnRate: 0 });
    const r = simulate(s);
    close(r.initialLoan, 0); close(r.firstPayment, 0); close(r.buyWithdrawn, 0); close(r.rentWithdrawn, 0);
    close(r.difference, 4500);
    close(r.totalDifference, r.liquidDifference + r.fundDifference + r.propertyDifference);
  });
  it('preserves a negative operating rental net and reports the positive required budget', () => {
    const s = scenario({ years: 1, purpose: 'rental', returnRate: 0, rentalInput: 'details', rentalGrossMonthly: 1000, rentalMonthsPerYear: 10, rentalAnnualCosts: 22000 });
    const r = simulate(s);
    close(r.difference, -12000); close(r.ledger.externalBudget, 12000);
    close(r.end.buyCash, 0); close(r.end.rentCash, 3012000);
  });
  it('clips the price scan at the independent cash down payment and retains valid endpoints', () => {
    const s = scenario({ loan: true, down: 3000000 });
    const scan = scanSensitivity(s).find(x => x.key === 'price')!;
    expect(scan.low).toBe(3000000); expect(scan.clipped).toBe(true);
    close(scan.lowDifference, simulate(s).difference);
    expect(Number.isFinite(scan.highDifference)).toBe(true);
  });
  it('reconciles the economic ledger without treating principal or fund transfers as returns', () => {
    for (const purpose of ['own', 'rental'] as const) for (const fundUse of ['keep', 'monthly', 'once'] as const) for (const sell of [false, true]) {
      const s = scenario({ purpose, fundUse, sell, years: 2, additionalMonths: 3, loan: true, fund: true, costs: true, upfrontCost: 10000, annualCost: 1200, saleCost: 3000, saleChange: -10, rentalNetMonthly: 10000, fundMonth: 12, fundAlsoMonthly: true, rentFund: true, fundRate: 1, returnRate: 2 });
      const r = simulate(s);
      close(r.contributions.reduce((sum, entry) => sum + entry.amount, 0), r.difference);
      close(r.cashDifference + r.fundDifference + r.propertyDifference, r.difference);
      close(r.ledger.cashInterestBuy - r.ledger.cashInterestRent + r.ledger.fundInterestBuy - r.ledger.fundInterestRent + r.ledger.housingSavings + r.ledger.rentalIncome - r.interestPaid - r.ledger.upfrontCosts - r.ledger.holdingCosts - r.ledger.sellingCosts + r.ledger.propertyChange, r.difference);
    }
  });
  it('scans one input at a time and reports actual clipped bounds ranked by outcome span', () => {
    const s = scenario({ returnRate: .2, saleChange: -99, sell: true, purpose: 'rental', rentalInput: 'details', rentalGrossMonthly: 5000 });
    const scans = scanSensitivity(s);
    expect(scans).toHaveLength(4);
    expect(scans.map(x => x.span)).toEqual([...scans.map(x => x.span)].sort((a, b) => b - a));
    for (const scan of scans) {
      close(scan.lowDifference, simulate({ ...s, [scan.key]: scan.low }).difference);
      close(scan.highDifference, simulate({ ...s, [scan.key]: scan.high }).difference);
      close(scan.span, Math.abs(scan.highDifference - scan.lowDifference));
    }
    expect(scans.find(x => x.key === 'returnRate')?.low).toBe(0);
    expect(scans.find(x => x.key === 'saleChange')?.low).toBe(-100);
    expect(scans.find(x => x.key === 'rentalGrossMonthly')?.low).toBe(4500);
  });
  it('rejects nonfinite active inputs but ignores fields belonging to inactive paths', () => {
    for (const patch of [{ additionalMonths: NaN }, { years: 0, additionalMonths: 0 }, { sell: true, saleChange: Infinity }, { sell: true, manualTax: Infinity, taxMode: 'manual' as const }, { purpose: 'rental' as const, rentalNetMonthly: NaN }, { purpose: 'rental' as const, rentalInput: 'details' as const, rentalMonthsPerYear: 13 }, { sell: true, taxDeductible: Infinity }]) expect(validate(scenario(patch)).length).toBeGreaterThan(0);
    expect(validate(scenario({ purpose: 'rental', rent: NaN, rentalInput: 'net', rentalGrossMonthly: NaN, sell: false, manualTax: NaN, fund: false, fundRate: NaN, loan: false, loanRate: NaN }))).toHaveLength(0);
    const r = simulate(scenario({ purpose: 'rental', rent: NaN, fundRate: NaN, loanRate: NaN }));
    expect(Number.isFinite(r.difference)).toBe(true);
  });
});
