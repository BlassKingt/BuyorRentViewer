import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, ArrowRight, CaretDown, Check, Flask, HouseLine, Info, Minus, Plus, ShieldCheck, Sparkle, X } from '@phosphor-icons/react';
import { comparisonMonths, defaults, rentalIncome, scanSensitivity, simulate, taxPolicy, validate, type Scenario } from './model';
import { NumberField } from './NumberField';
import { AssetChart } from './AssetChart';
import './styles.css';

type NumericKey = { [K in keyof Scenario]: Scenario[K] extends number | null ? K : never }[keyof Scenario];
type Module = 'loan' | 'fund' | 'costs';
const n = (v: number, digits = 0) => v.toLocaleString('zh-CN', { maximumFractionDigits: digits });
const money = (v: number) => `${n(v)} 元`;
const signed = (v: number, digits = 0) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${n(Math.abs(v), digits)}`;
const term = (s: Scenario) => `${s.years ? `${s.years} 年` : ''}${s.additionalMonths ? ` ${s.additionalMonths} 个月` : ''}`.trim();

export function HousingCalculator() {
  const [s, setS] = useState<Scenario>({ ...defaults });
  const [drafts, setDrafts] = useState<Partial<Record<NumericKey, string>>>({});
  const [rateOpen, setRateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Module[]>([]);
  const [assistant, setAssistant] = useState(true);
  const [motion, setMotion] = useState(true);
  const notes = useRef<HTMLDetailsElement>(null);
  const monthlyHintId = useId();
  const effective = useMemo(() => {
    const next = { ...s };
    for (const [key, draft] of Object.entries(drafts)) if (draft.trim() === '' || !Number.isFinite(Number(draft))) next[key as NumericKey] = NaN;
    return next;
  }, [s, drafts]);
  const errors = useMemo(() => validate(effective), [effective]);
  const result = useMemo(() => errors.length ? null : simulate(effective), [effective, errors]);
  const scan = useMemo(() => result ? scanSensitivity(effective) : [], [effective, result]);
  const months = comparisonMonths(s);
  const contributions = result ? [...result.contributions].sort((a, b) => b.amount - a.amount) : [];
  const positive = contributions.find(row => row.amount > .005);
  const negative = [...contributions].reverse().find(row => row.amount < -.005);
  const yieldFields = effective.rentalInput === 'net' ? [effective.rentalNetMonthly] : [effective.rentalGrossMonthly, effective.rentalMonthsPerYear, effective.rentalAnnualCosts];
  const yieldValid = yieldFields.every(Number.isFinite) && effective.price > 0 && Number.isFinite(effective.price) && (effective.rentalInput === 'net' || (effective.rentalGrossMonthly >= 0 && effective.rentalMonthsPerYear >= 0 && effective.rentalMonthsPerYear <= 12 && effective.rentalAnnualCosts >= 0));
  const rentalNet = yieldValid ? rentalIncome(effective) : null;
  function edit<K extends keyof Scenario>(key: K, value: Scenario[K]) { setS(old => ({ ...old, [key]: value })); }
  function preset(values: Partial<Scenario>) {
    setS(old => ({ ...old, ...values }));
    setDrafts(old => { const next = { ...old }; for (const key of Object.keys(values)) delete next[key as NumericKey]; return next; });
  }
  function field(key: NumericKey, label: string, unit: string, max: number, step = 1, scale = 1, hint?: string, min = 0) {
    return <NumberField key={key} label={label} value={s[key]} unit={unit} max={max} min={min} step={step} scale={scale} hint={hint}
      draft={drafts[key]} onDraftChange={draft => setDrafts(old => ({ ...old, [key]: draft }))}
      onBegin={() => {}} onValidity={() => {}} onChange={value => edit(key, value)} />;
  }
  function segments<T extends string>(label: string, current: T, values: readonly (readonly [T, string])[], change: (value: T) => void) {
    return <div className="hc-segments" role="group" aria-label={label}>{values.map(([value, title]) => <button key={value} aria-pressed={value === current} onClick={() => change(value)}>{title}</button>)}</div>;
  }
  const rentalFields = <>
    {segments('出租收入填写方式', s.rentalInput, [['net', '直接填净额'], ['details', '按明细估算']], value => edit('rentalInput', value))}
    {s.rentalInput === 'net' ? field('rentalNetMonthly', '出租月净收入', '元/月', 20000, 100, 1, '已扣空置、出租运营费用，尚未扣房贷；可以为负。', -20000) : <>
      {field('rentalGrossMonthly', '挂牌月租', '元/月', 20000, 100)}
      {field('rentalMonthsPerYear', '每年出租月数', '个月', 12, .5)}
      {field('rentalAnnualCosts', '年度出租费用', '元/年', 30000, 100, 1, '出租管理、维修等；不要再填进额外持有费用。')}
    </>}
    <p className="hc-yield">{rentalNet === null ? '收益率暂不可用' : <>平均月净收入 <strong>{money(rentalNet)}</strong> · 净租金收益率 <strong>{n(rentalNet * 12 / s.price * 100, 2)}%</strong></>}</p>
  </>;
  function module(key: Module, title: string, body: ReactNode) {
    if (!s[key]) return null;
    const closed = collapsed.includes(key);
    return <section className="hc-module" key={key}>
      <div className="hc-module-heading"><h3><Check size={16} />{title}</h3><div className="hc-module-actions">
        <button aria-label={`${closed ? '展开' : '收起'}${title}`} aria-expanded={!closed} onClick={() => setCollapsed(old => closed ? old.filter(x => x !== key) : [...old, key])}>{closed ? <Plus /> : <Minus />}</button>
        <button aria-label={`不考虑${title}`} onClick={() => edit(key, false)}><X /></button>
      </div></div>{!closed && <div className="hc-module-body">{body}</div>}
    </section>;
  }
  return <div className="hc-app" data-motion={motion ? 'on' : 'off'}>
    <div className="hc-shell">
      <header className="hc-header"><a className="hc-brand" href="#"><span className="hc-brand-mark"><HouseLine size={24} weight="duotone" /></span><span>买或租<small>HOUSING LAB</small></span></a>
        <div className="hc-header-right"><span className="hc-local"><span />本地计算 · 无需登录</span><a href="#model-scope">计算说明 <ArrowUpRight size={14} /></a></div>
      </header>
      <main>
        <section className="hc-intro">
          <div className="hc-intro-copy"><p className="hc-eyebrow"><span>01 / 生活决策实验室</span><Flask size={15} /></p><h1>把住房选择，<br /><em>算明白。</em></h1><p className="hc-intro-desc">一套房，两条生活路径。<br />从自己的数字出发，看清时间、现金与选择。</p><div className="hc-badges"><span><ShieldCheck size={13} />数据留在你的浏览器</span><span>上海税费情景 · {taxPolicy.date}</span></div></div>
          {assistant && <div className="hc-hero-art"><div className="hc-orbit hc-orbit-one" /><div className="hc-orbit hc-orbit-two" /><span className="hc-art-index">RESEARCH ASSISTANT / 01</span><div className="hc-portrait"><img className="hc-hero-image" src={`${import.meta.env.BASE_URL}mascot/researcher-v1.png`} alt="戴眼镜、手持研究平板的原创住房研究员" fetchPriority="high" /></div><div className="hc-art-tag"><Sparkle size={14} weight="fill" />把假设展开，把账算清。</div><span className="hc-art-cross">+</span></div>}
        </section>
        <div className="hc-workspace">
          <div className="hc-parameters">
            <section className="hc-workbench"><div className="hc-section-title"><h2><span>01</span>设置你的情景</h2><span>即时计算</span></div>
              {segments('房屋用途', s.purpose, [['own', '自己住'], ['rental', '出租，自己另租']], value => edit('purpose', value))}
              <p className="hc-mode-note">{s.purpose === 'own' ? '比较买来自己住，与继续租房的财务结果。' : '比较买入后出租，与保留房款。两边共同的居住开销抵消。'}</p>
              {field('price', '房屋总价', '万元', 1000, 10, 10000)}
              {s.purpose === 'own' ? <>{field('rent', '每月房租（住房开销）', '元/月', 20000, 100)}<details className="hc-yield-detail"><summary>看看这套房的出租收益率</summary><div className="hc-detail-body">{rentalFields}<p className="hc-help">仅作参考，自住方案不会加入这笔出租收入。</p></div></details></> : <div className="hc-rental-inputs">{rentalFields}</div>}
              <div className="hc-disclosure"><button aria-expanded={rateOpen} onClick={() => setRateOpen(!rateOpen)}><span>闲置资金年化收益率 <strong>{s.returnRate}%</strong></span><CaretDown className={rateOpen ? 'hc-rotate' : ''} /></button>{rateOpen && <div className="hc-detail-body">{field('returnRate', '资金年化收益率', '%', 10, .1, 1, '用于普通现金余额，按月复利；试算假设，不承诺收益。')}</div>}</div>
              <div className="hc-assumption-box"><div><span className="hc-small-label">比较期</span><strong>{term(s)}</strong><button aria-expanded={timeOpen} onClick={() => setTimeOpen(!timeOpen)}>调整比较期 <CaretDown size={13} /></button></div>
                {timeOpen && <div className="hc-detail-body"><div className="hc-presets">{[[2, '满 2 年'], [5, '满 5 年'], [10, '10 年']] .map(([value, title]) => <button key={value} onClick={() => preset({ years: Number(value), additionalMonths: 0 })}>{title}</button>)}</div>{field('years', '比较年数', '年', 60, 1)}{field('additionalMonths', '额外月数', '个月', 11, 1, 1, '0–11 个整月；比较期与还贷期限相互独立。')}</div>}
                <div className="hc-exit-default"><span>{s.sell ? '期末出售' : '继续持有'}</span><span>{s.saleChange === 0 ? '房价不变' : `总涨跌 ${signed(s.saleChange)}%`}{s.sell ? ` · 出售费用 ${s.saleFeeRate}%` : ' · 账面估值'}</span></div>
                <button className="hc-link-button" aria-expanded={exitOpen} onClick={() => setExitOpen(!exitOpen)}>调整期末安排与税费 <ArrowRight size={14} /></button>
              </div>
              {exitOpen && <section className="hc-exit-details"><h3>期末安排</h3>{segments('期末是否出售', s.sell ? 'sell' : 'hold', [['sell', '假设出售'], ['hold', '继续持有']], v => edit('sell', v === 'sell'))}
                {field('saleChange', '期末房价总涨跌幅', '%', 100, 1, 1, '整个比较期的总变化，不是年涨幅。中途房价不预测。', -100)}
                {s.sell && <>{field('saleFeeRate', '出售费用比例', '%', 5, .1, 1, '按成交价计算；默认 1% 为中介等费用示例，可改为 0。')}{field('saleCost', '其他出售费用', '元', 100000, 1000, 1, '额外固定支出，与上述比例费用同时计算。')}
                  <p className="hc-small-label">出售税额</p>{segments('税额计算模式', s.taxMode, [['auto', '上海自动估算'], ['manual', '手动总税额']], value => edit('taxMode', value))}
                  {s.taxMode === 'manual' ? <>{field('manualTax', '手动总税额', '元', 300000, 1000)}<p className="hc-help">此数替代自动估算税额；适合其他地区或特殊情形。</p></> : <>
                    <p className="hc-small-label">满五唯一等全部个税免税条件</p>{segments('满五唯一个税条件', s.exemption, [['unknown', '不确定'], ['confirmed', '确认全部免税条件'], ['not-eligible', '不符合']], value => edit('exemption', value))}
                    {field('taxDeductible', '明确可扣除额', '元', 500000, 1000, 1, '仅填符合规定且有凭证的扣除；不自动认定装修、利息。')}
                    {field('vatSurchargeRate', '增值税附加综合比例', '%', 20, 1, 1, '占增值税额，默认 12% 为保守试算，非统一税率。符合当地减半条件时可改 6%；优惠至 2027 年，不自动延续。')}
                  </>}
                  {result && <dl className="hc-tax-breakdown">{s.taxMode === 'manual' ? <><dt>手动总税额（覆盖自动）</dt><dd>{money(result.sale.tax.total)}</dd></> : <><dt>增值税</dt><dd>{money(result.sale.tax.vat)}</dd><dt>增值税附加</dt><dd>{money(result.sale.tax.surcharge)}</dd><dt>个人所得税</dt><dd>{money(result.sale.tax.incomeTax)}</dd></>}</dl>}
                </>}
              </section>}
              <p className="hc-policy-status"><Info size={14} />{months < 24 ? '未满 2 年：自动模式估算增值税。' : months < 60 ? '已满 2 年：自动模式免增值税，尚未满五。' : '已满 2 年及 5 年：个税免税仍需确认全部条件。'}</p>
              <details className="hc-policy"><summary>满二、满五与出售资格有什么区别？</summary><div className="hc-detail-body"><p>满 24 个月按当前快照免增值税；满 60 个月且确认全部适用条件才按满五唯一个税免税估算。默认不确定，按未确认免税处理。未免税时按有原值凭证的正差额 20% 估算个税。</p><p>这些是税费条件，不代表满足限售规定、保证可以出售或保证成交。{taxPolicy.note} 这里不提供完整交易税务服务。</p><p>{taxPolicy.location} · 政策快照 {taxPolicy.date}</p>{taxPolicy.sources.map((url, i) => <a href={url} target="_blank" rel="noreferrer" key={url}>{['财政部、税务总局增值税公告', '不足两年住房出售税费', '上海2026住房交易税费概览'][i]} <ArrowUpRight size={12} /></a>)}</div></details>
            </section>
            <section className="hc-more"><div className="hc-section-title"><h2><span>02</span>再贴近真实一点</h2><Plus size={17} /></div><p className="hc-help">需要时再加入。移除后保留已填内容。</p><div className="hc-add-factors">{([['loan', '房贷'], ['fund', '公积金'], ['costs', '额外费用']] as const).filter(([key]) => !s[key]).map(([key, label]) => <button key={key} onClick={() => { edit(key, true); setCollapsed(old => old.filter(k => k !== key)); }}><Plus size={14} />加入{label}</button>)}</div>
              {module('loan', '房贷', <><p className="hc-help">单笔等额本息贷款；不模拟组合贷，余额不等于可贷额度。现金首付不含公积金。</p>{field('down', '现金首付', '万元', s.price / 10000, 1, 10000)}<div className="hc-presets"><button onClick={() => preset({ loanRate: 3 })}>商贷 3%</button><button onClick={() => preset({ loanRate: 2.6 })}>公积金贷款 2.6%</button></div>{field('loanRate', '贷款年利率', '%', 8, .05, 1, '预设仅为试算值，最终以实际审批利率为准。')}{field('loanYears', '贷款期限', '年', 60, 1, 1, '默认 15 年；比较期可以早于或晚于贷款还清。', 1)}{result && <p className="hc-mini-result">首月月供 <strong>{money(result.firstPayment)}</strong> · 本期利息 {money(result.interestPaid)}</p>}</>)}
              {module('costs', '额外费用', <><p className="hc-help">默认 0 表示未填；不代表已经覆盖全部购房交易税费。</p>{field('upfrontCost', '一次性购房费用', '万元', 50, .5, 10000, '买入税费、中介、装修等额外支出，合计仅计一次。')}{field('annualCost', '每年额外持有费用', '元/年', 30000, 500, 1, '避免重复计入出租净收入已扣除的费用。')}</>)}
              {module('fund', '公积金', <><p className="hc-help">提取与贷款资格须自行确认；此处不自动判断地区资格或最高额度。</p>{field('fundBalance', '当前公积金余额', '万元', 50, .5, 10000)}{field('fundMonthly', '每月缴存总额', '元', 10000, 50, 1, '个人与单位合计；两条路径缴存相同。')}{field('fundRate', '公积金账户年收益率', '%', 5, .1)}{segments('买房公积金用途', s.fundUse, [['keep', '留在账户'], ['monthly', '抵扣月供'], ['once', '一次性投入']], value => edit('fundUse', value))}
                {s.fundUse === 'once' && <>{field('fundOnce', '计划一次性投入', '万元', 50, .5, 10000)}{field('fundMonth', '投入时间', '月后', 720, 1, 1, '0 为买入时；之后用于提前还本金并重算月供，贷款期限不变。')}<label className="hc-check"><input type="checkbox" checked={s.fundAlsoMonthly} aria-describedby={monthlyHintId} onChange={e => edit('fundAlsoMonthly', e.target.checked)} />同时从首月按月抵扣</label><p className="hc-help" id={monthlyHintId}>勾选后从第 1 个月开始按月抵扣，即使一次性投入在未来；一次性投入之前的月度提取可能减少届时的可用余额。</p>{result && <p className="hc-fund-note">本期实际一次性投入 {money(result.onceUsed)}。{s.fundMonth > months ? '安排在比较期之后，本期不执行。' : '受账户余额和剩余债务/可投入房款约束。'}</p>}</>}
                {(s.fundUse === 'monthly' || s.fundUse === 'once' && s.fundAlsoMonthly) && <>{!s.loan && <p className="hc-help">全款方案没有月供可抵扣。</p>}{field('fundLimit', '每月最多抵扣', '元', 15000, 50, 1, '替代现金月供，不额外提前还本金。')}</>}
                <label className="hc-check"><input type="checkbox" checked={s.rentFund} disabled={s.purpose === 'rental'} onChange={e => edit('rentFund', e.target.checked)} />租房方案也提取公积金付房租</label><p className="hc-help">{s.purpose === 'rental' ? '出租用途下，共同居住开销抵消，不模拟租房提取。' : '勾选即表示你已确认相应提取资格；仅作模拟。'}</p>{s.rentFund && s.purpose === 'own' && field('rentFundLimit', '每月租房提取上限', '元', 10000, 50)}
              </>)}
              {!s.costs && <p className="hc-unfilled">购入与持有额外费用：0 元 · 未填</p>}
            </section>
          </div>
          <aside className="hc-results" aria-label="计算结果">
            <div className="hc-results-top"><span className="hc-live-dot" />情景观察结果<span className="hc-result-kind">{term(s)} · {months} 个月</span></div>
            {!result ? <div className="hc-error" role="alert"><Info size={30} /><h2>补全参数后查看结果</h2><p>输入不能为空，且须符合相应范围。折叠的启用项目也参与校验。</p><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div> : <>
              <div className="hc-verdict"><p>{Math.abs(result.difference) < .5 ? '两条路径的净资产基本持平' : `${result.difference > 0 ? '买房' : '保留房款'}方案的期末净资产更多`}</p><div className={`hc-difference ${result.difference < 0 ? 'hc-rent-color' : ''}`}><strong>{n(Math.abs(result.difference))}</strong><span>元</span><span className="hc-difference-arrow">{result.difference >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}</span></div><p className="hc-verdict-caption">{s.sell ? '假设成交后的净资产' : '继续持有的账面净资产'} · 含受限公积金（如启用）</p></div>
              <div className="hc-end-values"><div><span><i className="hc-buy-dot" />买房方案</span><strong>{n(result.end.buy / 10000, 2)}<small>万元</small></strong></div><div><span><i className="hc-rent-dot" />保留房款方案</span><strong>{n(result.end.rent / 10000, 2)}<small>万元</small></strong></div></div>
              <AssetChart result={result} months={months} sold={s.sell} />
              <details className="hc-result-assets"><summary>钱分别在哪里？<CaretDown size={13} /></summary><div className="hc-detail-body"><div className="hc-asset-header"><span>资产分类</span><span>买房</span><span>保留房款</span></div>{[['普通现金', result.end.buyCash, result.end.rentCash], ['受限公积金', result.end.buyFund, result.end.rentFund], ...(!s.sell ? [['未出售房屋净值', result.propertyDifference, 0]] : [])].map(([label, buy, rent]) => <div className="hc-asset-row" key={label}><span>{label}</span><span>{money(Number(buy))}</span><span>{money(Number(rent))}</span></div>)}<p className="hc-help">现金差 {signed(result.cashDifference)} 元 + 公积金差 {signed(result.fundDifference)} 元{s.sell ? '' : ` + 房屋净值 ${n(result.propertyDifference)} 元`} = 总净资产差 {signed(result.difference)} 元。</p></div></details>
              {s.sell ? <div className="hc-sale-summary"><span>假设卖房净回款</span><strong>{money(result.sale.netProceeds)}</strong><p>成交 {money(result.sale.price)} − 贷款 {money(result.sale.remainingLoan)} − 费用 {money(result.sale.fees)} − 税额 {money(result.sale.tax.total)}</p></div> : <p className="hc-inline-note">房屋尚未出售，房屋净值仍是非现金资产。</p>}
              <div className="hc-teaser"><span className="hc-mini-kicker">这笔账的两面</span><p>{positive ? <><span className="hc-buy-color">{positive.label}</span> +{money(positive.amount)}</> : '当前没有正向账目项'}<br />{negative ? <><span className="hc-rent-color">{negative.label}</span> −{money(Math.abs(negative.amount))}</> : '当前没有负向账目项'}</p></div>
              <details className="hc-analysis-panel"><summary><span><span className="hc-panel-index">A</span>账目贡献</span><Plus size={16} /></summary><div className="hc-detail-body"><p className="hc-help">按账面金额排序。正数支持买房，负数支持保留房款；这是收益与费用的对账，不是参数的因果重要性。</p><div className="hc-contributions">{contributions.map(row => <div className="hc-contribution-row" key={row.key}><span>{row.label}<i className={row.amount >= 0 ? 'hc-positive-track' : 'hc-negative-track'} style={{ width: `${Math.max(0, Math.abs(row.amount) / Math.max(1, ...contributions.map(x => Math.abs(x.amount))) * 100)}%` }} /></span><strong className={row.amount > 0 ? 'hc-buy-color' : row.amount < 0 ? 'hc-rent-color' : ''}>{row.amount > 0 ? '+' : ''}{row.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元</strong></div>)}</div><div className="hc-contribution-total"><span>合计 = 差额</span><strong>{signed(result.difference, 2)} 元</strong></div><p className="hc-help">账目以未四舍五入金额求和；显示分值可能有尾差。本金偿还与公积金转移不计为损益。</p></div></details>
              <details className="hc-analysis-panel hc-scan"><summary><span><span className="hc-panel-index">B</span>参数扫描</span><Plus size={16} /></summary><div className="hc-detail-body"><p className="hc-help">每次只改一个参数，固定其他条件；按两端差额的影响跨度排名，不是贡献份额或预测概率。房价与租金 ±10%，收益率 ±0.5 个百分点，期末房价变化 ±10 个百分点。买入房价扫描固定期末总涨跌幅百分比，因此期末房价也随买入价同比变化；它不是固定未来售价的议价测试。下方为实际范围。</p>{scan.map((row, index) => <div className="hc-scan-row" key={row.key}><div><span>{index + 1}. {row.label}</span><strong>跨度 {money(row.span)}</strong></div><p>{n(row.low, 2)}–{n(row.high, 2)} {row.key === 'returnRate' || row.key === 'saleChange' ? '%' : row.key === 'price' ? '元' : '元/月'}{row.clipped ? ' · 已裁剪至合法范围' : ''}</p><div className="hc-scan-track"><i style={{ width: `${row.span / Math.max(1, ...scan.map(x => x.span)) * 100}%` }} /></div><small>低端差额 {signed(row.lowDifference)} 元 → 高端差额 {signed(row.highDifference)} 元</small></div>)}</div></details>
            </>}
            <div className="hc-assistant-controls"><button onClick={() => setAssistant(!assistant)}>{assistant ? '隐藏研究助手' : '显示研究助手'}</button>{assistant && <button onClick={() => setMotion(!motion)}>{motion ? '关闭角色动画' : '开启角色动画'}</button>}</div>
            {assistant && <div className="hc-assistant"><img src={`${import.meta.env.BASE_URL}mascot/researcher-chibi-v1.png`} alt="Q 版住房研究助手" loading="eager" /><div><span className="hc-mini-kicker">研究手记 / LOCAL NOTES</span><p>{result ? '把数字当作问题的起点。也看看：哪些假设最影响你的选择？' : '先补全参数，我们再看这笔账。'}</p><button onClick={() => { if (notes.current) { notes.current.open = true; notes.current.scrollIntoView({ behavior: motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto', block: 'center' }); } }}>查看分析手记 <ArrowRight size={14} /></button></div></div>}
            <details ref={notes} className="hc-notes"><summary>当前情景分析手记</summary><div className="hc-detail-body">{result ? <><p>{term(s)}后，在这些假设下，{result.difference >= 0 ? '买房' : '保留房款'}方案总净资产多 {money(Math.abs(result.difference))}。{positive ? `最大正项是${positive.label}，${money(positive.amount)}。` : '没有正向账目项。'}{negative ? `最大负项是${negative.label}，${money(Math.abs(negative.amount))}。` : '没有负向账目项。'}</p><p>普通现金差为 {signed(result.cashDifference)} 元，受限公积金差为 {signed(result.fundDifference)} 元。{s.sell ? '本结果以能够按假定价格成交为前提。' : '房屋净值并未变成现金。'} 居住体验、流动性偏好与市场风险仍需另行考虑。</p></> : <p>参数尚未补全，暂不生成结论。</p>}<p className="hc-help">根据当前模型生成的固定规则说明；没有使用 AI 服务。</p></div></details>
          </aside>
        </div>
        <details className="hc-method" id="model-scope"><summary><span><Flask size={19} />模型与计算边界</span><Plus size={17} /></summary><div className="hc-method-body"><h2>给选择提供一把尺。</h2><p>买房和保留房款使用相同起始普通现金、相同公积金与相同每月外部预算；外部预算下限为零。普通现金按月复利，公积金单独计息。所有金额为名义金额，未扣通胀。自住以住房租金作替代开销；出租以扣空置与运营费用后的收入计入，双方共同居住开销抵消。</p><p>贷款为单笔等额本息。公积金提取只在账户余额和可用债务/房款范围内模拟，无法判断真实提取或贷款资格。中途房屋按购入价记录，期末才应用总涨跌假设。出售先扣剩余贷款、税费与出售费用；净回款进入普通现金，不重复扣债务。</p><p>账目贡献总和等于总净资产差。参数扫描是当前指定范围内逐项重算。没有房价或利率预测。已包含所填现金投资收益率对应的机会成本，不应再重复扣除；未纳入居住体验等非财务因素及其他未建模因素。税费仅限所示上海政策情景，需核对实际交易日期、地点、取得方式、凭证及完整条件。</p></div></details>
      </main>
      <footer className="hc-footer"><span>买或租 · HOUSING LAB <span className="hc-footer-dot">/</span> 让选择，有据可依。</span><span>本地财务模拟 · 不上传输入 · 不构成投资或税务建议</span></footer>
    </div>
  </div>;
}


