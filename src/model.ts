/** Units: yuan, years, annual percentage points. Pure monthly scenario accounting. */
export type FundUse = 'keep' | 'monthly' | 'once';
export interface Scenario {
  price: number;
  rent: number;
  purpose: 'own' | 'rental';
  rentalInput: 'net' | 'details';
  rentalNetMonthly: number;
  rentalGrossMonthly: number;
  rentalMonthsPerYear: number;
  rentalAnnualCosts: number;
  returnRate: number;
  /** Legacy compatibility only: the horizon is always explicit. */
  time: boolean;
  years: number;
  additionalMonths: number;
  loan: boolean;
  down: number;
  loanRate: number | null;
  loanYears: number;
  costs: boolean;
  upfrontCost: number;
  annualCost: number;
  sell: boolean;
  saleChange: number;
  saleFeeRate: number;
  saleCost: number;
  taxMode: 'auto' | 'manual';
  manualTax: number;
  exemption: 'unknown' | 'confirmed' | 'not-eligible';
  taxDeductible: number;
  vatSurchargeRate: number;
  fund: boolean;
  fundBalance: number;
  fundMonthly: number;
  fundRate: number;
  fundUse: FundUse;
  fundLimit: number;
  fundOnce: number;
  fundMonth: number;
  fundAlsoMonthly: boolean;
  /** User-specified qualification assumption, only used in own occupation mode. */
  rentFund: boolean;
  rentFundLimit: number;
}

export const defaults: Scenario = {
  price: 3_000_000, rent: 4500, purpose: 'own',
  rentalInput: 'net', rentalNetMonthly: 4500, rentalGrossMonthly: 5000,
  rentalMonthsPerYear: 11, rentalAnnualCosts: 1000,
  returnRate: 1.5, time: true, years: 5, additionalMonths: 0,
  loan: false, down: 600_000, loanRate: 3, loanYears: 15,
  costs: false, upfrontCost: 0, annualCost: 0,
  sell: true, saleChange: 0, saleFeeRate: 1, saleCost: 0,
  taxMode: 'auto', manualTax: 0, exemption: 'unknown', taxDeductible: 0, vatSurchargeRate: 12,
  fund: false, fundBalance: 80_000, fundMonthly: 2000, fundRate: 1.5,
  fundUse: 'keep', fundLimit: 2000, fundOnce: 80_000, fundMonth: 0,
  fundAlsoMonthly: false, rentFund: false, rentFundLimit: 2000,
};

export const isLongTerm = (_s: Scenario) => true;
export const comparisonMonths = (s: Scenario) => s.years * 12 + s.additionalMonths;
export const comparisonYears = (s: Scenario) => comparisonMonths(s) / 12;
/** Net after vacancy and rental operating costs, before mortgage and separate property upkeep. */
export function rentalIncome(s: Scenario): number {
  return s.rentalInput === 'details'
    ? (s.rentalGrossMonthly * s.rentalMonthsPerYear - s.rentalAnnualCosts) / 12
    : s.rentalNetMonthly;
}
export function annualComparison(s: Scenario) {
  const buy = (s.purpose === 'rental' ? rentalIncome(s) : s.rent) * 12;
  const rent = s.price * s.returnRate / 100;
  return { buy, rent, difference: buy - rent };
}

export function validate(s: Scenario): string[] {
  const errors: string[] = [];
  const number = (key: keyof Scenario, label: string, min = 0, max = Infinity) => {
    const value = s[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
      errors.push(`${label}须填写有效数值（${min} 至 ${Number.isFinite(max) ? max : '合理上限'}）。`);
  };
  const choice = (value: string, allowed: string[], label: string) => {
    if (!allowed.includes(value)) errors.push(`${label}选项无效。`);
  };
  number('price', '房价', Number.MIN_VALUE);
  number('returnRate', '资金收益率', 0, 100);
  choice(s.purpose, ['own', 'rental'], '房屋用途');
  if (s.purpose === 'own') number('rent', '住房月租');
  if (s.purpose === 'rental') {
    choice(s.rentalInput, ['net', 'details'], '出租收入');
    if (s.rentalInput === 'net') number('rentalNetMonthly', '出租月净收入', -Infinity);
    if (s.rentalInput === 'details') {
      number('rentalGrossMonthly', '挂牌月租'); number('rentalMonthsPerYear', '每年出租月数', 0, 12);
      number('rentalAnnualCosts', '年度出租费用');
    }
  }
  if (!Number.isInteger(s.years) || s.years < 0 || s.years > 60 ||
      !Number.isInteger(s.additionalMonths) || s.additionalMonths < 0 || s.additionalMonths > 11 ||
      comparisonMonths(s) < 1 || comparisonMonths(s) > 720)
    errors.push('比较期支持 1 至 720 个月；年数及余月须为整数。');
  number('saleChange', '期末房价总涨跌幅', -100);
  if (s.loan) {
    number('down', '现金首付', 0, s.price); number('loanRate', '贷款年利率', 0, 100);
    if (!Number.isInteger(s.loanYears) || s.loanYears < 1 || s.loanYears > 60)
      errors.push('贷款期限支持 1 至 60 年的整数。');
  }
  if (s.costs) { number('upfrontCost', '买入额外费用'); number('annualCost', '年度持有费用'); }
  if (s.sell) {
    number('saleFeeRate', '出售费用比例', 0, 100); number('saleCost', '其他出售费用');
    choice(s.taxMode, ['auto', 'manual'], '税额模式');
    if (s.taxMode === 'manual') number('manualTax', '手动总税额');
    else {
      choice(s.exemption, ['unknown', 'confirmed', 'not-eligible'], '满五唯一条件');
      number('taxDeductible', '明确可扣除额'); number('vatSurchargeRate', '增值税附加综合比例', 0, 100);
    }
  }
  if (s.fund) {
    number('fundBalance', '公积金余额'); number('fundMonthly', '每月缴存'); number('fundRate', '公积金收益率', 0, 100);
    choice(s.fundUse, ['keep', 'monthly', 'once'], '公积金用途');
    if (s.fundUse === 'monthly' || (s.fundUse === 'once' && s.fundAlsoMonthly)) number('fundLimit', '月供提取上限');
    if (s.rentFund && s.purpose === 'own') number('rentFundLimit', '租房提取上限');
    if (s.fundUse === 'once') {
      number('fundOnce', '一次性投入金额');
      if (!Number.isInteger(s.fundMonth) || s.fundMonth < 0 || s.fundMonth > 720)
        errors.push('投入时间支持 0 至 720 个月的整数；0 表示购房时。');
    }
  }
  return errors;
}

export function payment(principal: number, rate: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const r = rate / 1200;
  return r === 0 ? principal / months : principal * r / (1 - (1 + r) ** -months);
}

export const taxPolicy = {
  date: '2026-10-20', location: '上海个人普通购入住房',
  note: '按政策快照估算未来情景，不预测政策或确认出售资格；附加比例默认12%为保守试算，并非统一税率，不自动延续2027年到期优惠。',
  sources: [
    'https://fgk.chinatax.gov.cn/zcfgk/c102416/c5246356/content.html',
    'https://shanghai.chinatax.gov.cn/xwdt/ztzl/grsx/fwjy/csfclsx/202411/t474236.html',
    'https://www.shanghai.gov.cn/nw17239/20260423/db84274a588149309032977a3df7f916.html',
  ],
} as const;
export interface TaxEstimate {
  mode: 'auto' | 'manual' | 'not-sold';
  vat: number;
  surcharge: number;
  incomeTax: number;
  manual: number;
  total: number;
  taxableGain: number;
  vatExempt: boolean;
  exemptionStatus: 'confirmed' | 'unconfirmed' | 'not-eligible' | 'too-short' | 'manual' | 'not-sold';
}
export function estimateTax(s: Scenario, months = comparisonMonths(s)): TaxEstimate {
  const base: TaxEstimate = { mode: s.taxMode, vat: 0, surcharge: 0, incomeTax: 0, manual: 0, total: 0,
    taxableGain: 0, vatExempt: months >= 24, exemptionStatus: 'manual' };
  if (s.taxMode === 'manual') return { ...base, manual: s.manualTax, total: s.manualTax };
  const price = s.price * (1 + s.saleChange / 100);
  const vat = months < 24 ? price / 1.03 * .03 : 0;
  const surcharge = vat * s.vatSurchargeRate / 100;
  const taxableGain = Math.max(0, price - vat - s.price - s.taxDeductible - surcharge);
  const exempt = months >= 60 && s.exemption === 'confirmed';
  const incomeTax = exempt ? 0 : taxableGain * .2;
  const exemptionStatus = months < 60 ? 'too-short' : s.exemption === 'unknown' ? 'unconfirmed' : s.exemption;
  return { ...base, vat, surcharge, incomeTax, taxableGain, total: vat + surcharge + incomeTax, exemptionStatus };
}

export interface Point {
  month: number;
  buy: number;
  rent: number;
  buyCash: number;
  rentCash: number;
  buyFund: number;
  rentFund: number;
  /** Mortgage balance immediately before a possible final sale. */
  debt: number;
  propertyValue: number;
  buyBook: number;
}
export interface Ledger {
  cashInterestBuy: number;
  cashInterestRent: number;
  fundInterestBuy: number;
  fundInterestRent: number;
  housingSavings: number;
  rentalIncome: number;
  upfrontCosts: number;
  holdingCosts: number;
  sellingCosts: number;
  propertyChange: number;
  /** Total external cash added to each scenario (fund deposits are separate and equal). */
  externalBudget: number;
}
export interface Contribution { key: string; label: string; amount: number }
export interface SaleEstimate {
  executed: boolean;
  price: number;
  remainingLoan: number;
  fees: number;
  tax: TaxEstimate;
  netProceeds: number;
}
export interface Simulation {
  points: Point[];
  end: Point;
  difference: number;
  totalDifference: number;
  cashDifference: number;
  liquidDifference: number;
  fundDifference: number;
  propertyDifference: number;
  initialCash: number;
  initialLoan: number;
  firstPayment: number;
  firstCashPayment: number;
  interestPaid: number;
  principalPaid: number;
  buyWithdrawn: number;
  rentWithdrawn: number;
  onceUsed: number;
  sale: SaleEstimate;
  ledger: Ledger;
  contributions: Contribution[];
}

export function simulate(s: Scenario): Simulation {
  const errors = validate(s);
  if (errors.length) throw new Error(errors.join(' '));
  const months = comparisonMonths(s);
  const cashRate = (1 + s.returnRate / 100) ** (1 / 12) - 1;
  const fundRate = s.fund ? (1 + s.fundRate / 100) ** (1 / 12) - 1 : 0;
  const loanRate = s.loan ? s.loanRate! / 1200 : 0;
  const contribution = s.fund ? s.fundMonthly : 0;
  const income = s.purpose === 'rental' ? rentalIncome(s) : 0;
  const housingRent = s.purpose === 'own' ? s.rent : 0;
  let buyFund = s.fund ? s.fundBalance : 0;
  let rentFund = buyFund;
  const upfront = s.costs ? s.upfrontCost : 0;
  const upkeep = s.costs ? s.annualCost / 12 : 0;
  let onceUsed = s.fund && s.fundUse === 'once' && s.fundMonth === 0
    ? Math.min(s.fundOnce, buyFund, s.price - (s.loan ? s.down : 0)) : 0;
  buyFund -= onceUsed;
  const down = s.loan ? s.down : s.price - onceUsed;
  let debt = s.loan ? Math.max(0, s.price - down - onceUsed) : 0;
  const initialLoan = debt;
  const initialCash = down + upfront;
  let buyCash = 0, rentCash = initialCash;
  let monthlyPayment = payment(debt, s.loan ? s.loanRate! : 0, s.loanYears * 12);
  let interestPaid = 0, principalPaid = 0, buyWithdrawn = onceUsed, rentWithdrawn = 0;
  let firstPayment = 0, firstCashPayment = 0;
  const ledger: Ledger = { cashInterestBuy: 0, cashInterestRent: 0, fundInterestBuy: 0, fundInterestRent: 0,
    housingSavings: 0, rentalIncome: 0, upfrontCosts: upfront, holdingCosts: 0,
    sellingCosts: 0, propertyChange: s.price * s.saleChange / 100, externalBudget: 0 };
  const snapshot = (month: number): Point => {
    // Only the selected endpoint is revalued: intermediate prices are not predictions.
    const propertyValue = s.price + (month === months ? ledger.propertyChange : 0);
    const buyBook = propertyValue - debt + buyCash + buyFund;
    return { month, buy: buyBook, rent: rentCash + rentFund, buyCash, rentCash, buyFund, rentFund, debt, propertyValue, buyBook };
  };
  const points: Point[] = [snapshot(0)];
  for (let month = 1; month <= months; month++) {
    const buyCashInterest = buyCash * cashRate, rentCashInterest = rentCash * cashRate;
    const buyFundInterest = buyFund * fundRate, rentFundInterest = rentFund * fundRate;
    ledger.cashInterestBuy += buyCashInterest; ledger.cashInterestRent += rentCashInterest;
    ledger.fundInterestBuy += buyFundInterest; ledger.fundInterestRent += rentFundInterest;
    buyCash += buyCashInterest; rentCash += rentCashInterest;
    buyFund += buyFundInterest + contribution; rentFund += rentFundInterest + contribution;
    const interest = debt * loanRate;
    const due = debt > 0 ? Math.min(monthlyPayment, debt + interest) : 0;
    const principal = Math.max(0, due - interest);
    debt = Math.max(0, debt - principal);
    if (debt < 1e-7) debt = 0;
    interestPaid += interest; principalPaid += principal;
    const useMonthly = s.fund && (s.fundUse === 'monthly' || (s.fundUse === 'once' && s.fundAlsoMonthly));
    const buyUse = useMonthly ? Math.min(buyFund, due, s.fundLimit) : 0;
    const rentUse = s.fund && s.rentFund && s.purpose === 'own' ? Math.min(rentFund, housingRent, s.rentFundLimit) : 0;
    buyFund -= buyUse; rentFund -= rentUse;
    buyWithdrawn += buyUse; rentWithdrawn += rentUse;
    if (s.fund && s.fundUse === 'once' && s.fundMonth === month) {
      const extra = Math.min(buyFund, debt, s.fundOnce);
      debt -= extra; buyFund -= extra; onceUsed += extra; buyWithdrawn += extra;
      monthlyPayment = payment(debt, s.loan ? s.loanRate! : 0, Math.max(0, s.loanYears * 12 - month));
    }
    const buyExpense = due - buyUse + upkeep - income;
    const rentExpense = housingRent - rentUse;
    // Equal external resources; excess rental income never becomes a negative wage budget.
    const budget = Math.max(0, buyExpense, rentExpense);
    buyCash += budget - buyExpense; rentCash += budget - rentExpense;
    ledger.externalBudget += budget; ledger.housingSavings += housingRent;
    ledger.rentalIncome += income; ledger.holdingCosts += upkeep;
    if (month === 1) { firstPayment = due; firstCashPayment = buyExpense; }
    points.push(snapshot(month));
  }
  const end = points[points.length - 1];
  const tax: TaxEstimate = s.sell ? estimateTax(s, months) : { mode: 'not-sold', vat: 0, surcharge: 0, incomeTax: 0,
    manual: 0, total: 0, taxableGain: 0, vatExempt: months >= 24, exemptionStatus: 'not-sold' };
  const fees = s.sell ? end.propertyValue * s.saleFeeRate / 100 + s.saleCost : 0;
  const sale: SaleEstimate = { executed: s.sell, price: end.propertyValue, remainingLoan: debt,
    fees, tax, netProceeds: end.propertyValue - debt - fees - tax.total };
  ledger.sellingCosts = fees + tax.total;
  if (s.sell) {
    end.buyCash += sale.netProceeds;
    end.buy = end.buyCash + end.buyFund;
    end.propertyValue = 0;
  }
  const contributions: Contribution[] = [
    { key: 'housing', label: '住房开销差', amount: ledger.housingSavings },
    { key: 'rental', label: '出租净收入', amount: ledger.rentalIncome },
    { key: 'property', label: '房价变化', amount: ledger.propertyChange },
    { key: 'interest', label: '贷款利息', amount: -interestPaid },
    { key: 'upfront', label: '买入费用', amount: -ledger.upfrontCosts },
    { key: 'holding', label: '持有费用', amount: -ledger.holdingCosts },
    { key: 'selling', label: '卖出税费及费用', amount: -ledger.sellingCosts },
    { key: 'cash', label: '现金收益差', amount: ledger.cashInterestBuy - ledger.cashInterestRent },
    { key: 'fund', label: '公积金收益差', amount: ledger.fundInterestBuy - ledger.fundInterestRent },
  ];
  return { points, end, difference: end.buy - end.rent, totalDifference: end.buy - end.rent,
    cashDifference: end.buyCash - end.rentCash, liquidDifference: end.buyCash - end.rentCash,
    fundDifference: end.buyFund - end.rentFund, propertyDifference: s.sell ? 0 : end.propertyValue - debt,
    initialCash, initialLoan, firstPayment, firstCashPayment, interestPaid, principalPaid,
    buyWithdrawn, rentWithdrawn, onceUsed, sale, ledger, contributions };
}

export type ScanKey = 'price' | 'rent' | 'rentalNetMonthly' | 'rentalGrossMonthly' | 'returnRate' | 'saleChange';
export interface Sensitivity {
  key: ScanKey;
  label: string;
  low: number;
  high: number;
  clipped: boolean;
  lowDifference: number;
  highDifference: number;
  span: number;
}
/** One-factor endpoint scans, ranked only within these tested bounds; not causal attribution. */
export function scanSensitivity(s: Scenario): Sensitivity[] {
  const errors = validate(s);
  if (errors.length) throw new Error(errors.join(' '));
  const rentKey = s.purpose === 'own' ? 'rent' : s.rentalInput === 'details' ? 'rentalGrossMonthly' : 'rentalNetMonthly';
  const ranges: { key: ScanKey; label: string; low: number; high: number; min: number; max: number }[] = [
    { key: 'price', label: '买入房价 ±10%', low: s.price * .9, high: s.price * 1.1, min: s.loan ? Math.max(Number.MIN_VALUE, s.down) : Number.MIN_VALUE, max: Infinity },
    { key: rentKey, label: s.purpose === 'own' ? '住房月租 ±10%' : s.rentalInput === 'details' ? '挂牌月租 ±10%' : '出租月净收入 ±10%', low: Math.min(s[rentKey] * .9, s[rentKey] * 1.1), high: Math.max(s[rentKey] * .9, s[rentKey] * 1.1), min: rentKey === 'rentalNetMonthly' ? -Infinity : 0, max: Infinity },
    { key: 'returnRate', label: '资金年收益 ±0.5个百分点', low: s.returnRate - .5, high: s.returnRate + .5, min: 0, max: 100 },
    { key: 'saleChange', label: '期末房价总涨跌 ±10个百分点', low: s.saleChange - 10, high: s.saleChange + 10, min: -100, max: Infinity },
  ];
  return ranges.map(range => {
    const low = Math.max(range.min, Math.min(range.max, range.low));
    const high = Math.max(range.min, Math.min(range.max, range.high));
    const lowDifference = simulate({ ...s, [range.key]: low }).difference;
    const highDifference = simulate({ ...s, [range.key]: high }).difference;
    return { key: range.key, label: range.label, low, high, clipped: low !== range.low || high !== range.high,
      lowDifference, highDifference, span: Math.abs(highDifference - lowDifference) };
  }).sort((a, b) => b.span - a.span);
}
