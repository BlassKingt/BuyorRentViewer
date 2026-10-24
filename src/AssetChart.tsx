import { useState } from 'react';
import type { Simulation } from './model';
const wan = (v: number) => `${(v / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 2 })} 万`;

export function AssetChart({ result, months, sold }: { result: Simulation; months: number; sold: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const month = Math.max(0, Math.min(selected ?? months, months));
  const stride = Math.max(1, Math.floor(months / 60));
  const sample = result.points.filter(p => p.month % stride === 0 || p.month === months || p.month === months - 1);
  const values = sample.flatMap(p => [p.buy, p.rent, p.buyBook]);
  const low = Math.min(0, ...values), high = Math.max(10000, ...values);
  const pad = (high - low) * .12, bottom = low < 0 ? low - pad : 0, top = high + pad;
  const x = (m: number) => 58 + m / months * 464;
  const y = (value: number) => 196 - (value - bottom) / (top - bottom) * 172;
  const path = (key: 'buy' | 'rent', points = sample) => points.map((p, i) => `${i ? 'L' : 'M'}${x(p.month)},${y(p[key])}`).join(' ');
  const point = result.points[month];
  const previous = result.points[months - 1];
  return <div className="hc-asset-chart">
    <div className="hc-chart-legend"><span><i className="hc-buy-dot" />买房</span><span><i className="hc-rent-dot" />保留房款</span><span>单位 / 万元</span></div>
    <svg viewBox="0 0 550 228" role="img" aria-label={`${months} 个月净资产曲线；买房期末 ${wan(result.end.buy)}，保留房款 ${wan(result.end.rent)}。期末含一次性估值及出售调整。`} onPointerDown={e => { const box = e.currentTarget.getBoundingClientRect(); setSelected(Math.max(0, Math.min(months, Math.round(((e.clientX - box.left) / box.width * 550 - 58) / 464 * months)))); }}>
      {[0, 1, 2, 3].map(i => { const value = bottom + (top - bottom) * i / 3; return <g key={i}><line x1="58" x2="522" y1={y(value)} y2={y(value)} className="hc-gridline" /><text x="47" y={y(value) + 4} textAnchor="end">{(value / 10000).toFixed(0)}</text></g>; })}
      <path d={path('rent')} className="hc-rent-line" /><path d={path('buy', sample.filter(p => p.month < months))} className="hc-buy-line" />
      <path d={`M${x(previous.month)},${y(previous.buy)}L${x(months)},${y(result.end.buy)}`} className="hc-exit-line" />
      <line x1={x(month)} x2={x(month)} y1="18" y2="196" className="hc-cursor-line" />
      <circle cx={x(month)} cy={y(point.buy)} r="4" className="hc-buy-point" /><circle cx={x(month)} cy={y(point.rent)} r="4" className="hc-rent-point" />
      <text x="58" y="222">现在</text><text x="522" y="222" textAnchor="end">第 {months} 个月</text>
    </svg>
    <div className="hc-chart-reading"><span>{month === 0 ? '购房时' : `第 ${month} 个月`}</span><span>买 {wan(point.buy)}</span><span>留 {wan(point.rent)}</span></div>
    <input className="hc-range hc-month-scrub" type="range" min="0" max={months} step="1" value={month} aria-label="查看曲线月份" onChange={e => setSelected(Number(e.target.value))} />
    <p className="hc-chart-note">中途为购入价账面值；虚线终点一次计入期末房价假设{sold ? '及出售税费' : ''}，不代表市场突然涨跌。</p>
  </div>;
}
