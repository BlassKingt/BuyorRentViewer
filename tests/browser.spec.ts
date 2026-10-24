import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('explicit five year exit and independent purpose inputs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /把住房选择，\s*算明白。/ })).toBeVisible();
  await expect(page.locator('.hc-result-kind')).toHaveText('5 年 · 60 个月');
  await expect(page.getByRole('spinbutton')).toHaveCount(2);
  await expect(page.getByText('房价不变 · 出售费用 1%')).toBeVisible();
  await page.getByRole('spinbutton', { name: '每月房租（住房开销）', exact: true }).fill('5200');
  await page.getByRole('button', { name: '出租，自己另租', exact: true }).click();
  await page.getByRole('spinbutton', { name: '出租月净收入', exact: true }).fill('-1000');
  await expect(page.locator('.hc-difference')).toBeVisible();
  await page.getByRole('button', { name: '自己住', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '每月房租（住房开销）', exact: true })).toHaveValue('5200');
  await page.getByRole('button', { name: '出租，自己另租', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '出租月净收入', exact: true })).toHaveValue('-1000');
});

test('rental details and optional yield never become self-use cashflow', async ({ page }) => {
  await page.goto('/');
  const before = await page.locator('.hc-difference').textContent();
  await page.getByText('看看这套房的出租收益率', { exact: true }).click();
  await page.getByRole('button', { name: '按明细估算', exact: true }).click();
  await page.getByRole('spinbutton', { name: '挂牌月租', exact: true }).fill('6000');
  await expect(page.locator('.hc-difference')).toHaveText(before!);
  await page.getByRole('spinbutton', { name: '挂牌月租', exact: true }).fill('');
  await expect(page.getByText('收益率暂不可用')).toBeVisible();
  await expect(page.locator('.hc-difference')).toHaveText(before!);
  await page.getByRole('button', { name: '出租，自己另租', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('spinbutton', { name: '挂牌月租', exact: true }).fill('6000');
  await page.getByRole('spinbutton', { name: '每年出租月数', exact: true }).fill('10');
  await page.getByRole('spinbutton', { name: '年度出租费用', exact: true }).fill('1200');
  await expect(page.locator('.hc-yield')).toContainText('4,900');
});

test('month horizons, policy thresholds, exit and manual tax override', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: /调整比较期/ }).click();
  await page.getByRole('spinbutton', { name: '比较年数', exact: true }).fill('1');
  await page.getByRole('spinbutton', { name: '额外月数', exact: true }).fill('11');
  await expect(page.locator('.hc-result-kind')).toHaveText('1 年 11 个月 · 23 个月');
  await expect(page.locator('.hc-policy-status')).toContainText('未满 2 年');
  await page.getByRole('slider', { name: '查看曲线月份' }).fill('23');
  await expect(page.locator('.hc-chart-reading')).toContainText('第 23 个月');
  await page.getByRole('button', { name: '满 2 年', exact: true }).click();
  await expect(page.locator('.hc-policy-status')).toContainText('已满 2 年');
  await page.getByRole('button', { name: '满 5 年', exact: true }).click();
  await page.getByRole('button', { name: /调整期末安排/ }).click();
  await page.getByRole('spinbutton', { name: '期末房价总涨跌幅', exact: true }).fill('10');
  await page.getByRole('button', { name: '确认全部免税条件', exact: true }).click();
  await expect(page.locator('.hc-tax-breakdown')).toContainText('个人所得税0 元');
  await page.getByRole('button', { name: '手动总税额', exact: true }).click();
  await page.getByRole('spinbutton', { name: '手动总税额', exact: true }).fill('12345');
  await expect(page.locator('.hc-tax-breakdown')).toContainText('12,345 元');
  await page.getByRole('button', { name: '继续持有', exact: true }).click();
  await expect(page.locator('.hc-result-assets')).toContainText('未出售房屋净值');
  await page.getByRole('spinbutton', { name: '比较年数', exact: true }).fill('0');
  await page.getByRole('spinbutton', { name: '额外月数', exact: true }).fill('1');
  await expect(page.locator('.hc-difference')).toBeVisible();
  expect(errors).toEqual([]);
});

test('invalid drafts survive collapsed active modules and only targeted presets clear drafts', async ({ page }) => {
  await page.goto('/');
  const rent = page.getByRole('spinbutton', { name: '每月房租（住房开销）', exact: true });
  await rent.fill(''); await expect(page.getByRole('alert')).toContainText('不能为空');
  await expect(page.locator('.hc-difference')).toHaveCount(0);
  await rent.fill('-10'); await expect(page.getByRole('alert')).toBeVisible();
  await rent.fill('5000');
  await page.getByRole('button', { name: '加入房贷', exact: true }).click();
  await page.getByRole('spinbutton', { name: '贷款年利率', exact: true }).fill('');
  await page.getByRole('button', { name: '收起房贷', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: '展开房贷', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '贷款年利率', exact: true })).toHaveValue('');
  await page.getByRole('button', { name: '商贷 3%', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(rent).toHaveValue('5000');
  await page.getByRole('slider', { name: '每月房租（住房开销）滑块' }).focus(); await page.keyboard.press('ArrowRight');
  await expect(rent).toHaveValue('5100');
});

test('funds costs contribution reconciliation and actual parameter scans', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '加入公积金', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '当前公积金余额', exact: true })).toHaveValue('8');
  await page.getByRole('button', { name: '一次性投入', exact: true }).click();
  await expect(page.locator('.hc-fund-note')).toContainText('80,000');
  await page.getByRole('button', { name: '加入额外费用', exact: true }).click();
  await page.getByRole('spinbutton', { name: '一次性购房费用', exact: true }).fill('6');
  await page.locator('.hc-analysis-panel').filter({ hasText: '账目贡献' }).locator('summary').click();
  await expect(page.locator('.hc-contribution-total')).toContainText('合计 = 差额');
  await expect(page.locator('.hc-contribution-row')).toHaveCount(9);
  await page.locator('.hc-scan > summary').click();
  await expect(page.locator('.hc-scan-row')).toHaveCount(4);
  await expect(page.locator('.hc-scan')).toContainText('个百分点');
  await page.getByRole('button', { name: '出租，自己另租', exact: true }).click();
  await expect(page.getByLabel('租房方案也提取公积金付房租')).toBeDisabled();
  await expect(page.locator('.hc-scan')).toContainText('出租月净收入');
});

test('characters complete, same-page notes, hide and motion controls', async ({ page }) => {
  const failures: string[] = []; page.on('response', r => { if (r.status() >= 400) failures.push(r.url()); });
  await page.goto('/');
  const images = page.locator('.hc-app img'); await expect(images).toHaveCount(2);
  for (const img of await images.all()) await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: '关闭角色动画', exact: true }).click();
  await expect(page.locator('.hc-app')).toHaveAttribute('data-motion', 'off');
  await page.getByRole('button', { name: '查看分析手记', exact: true }).click();
  await expect(page.locator('.hc-notes')).toBeVisible();
  await page.getByRole('button', { name: '隐藏研究助手', exact: true }).click();
  await expect(images).toHaveCount(0);
  await page.getByRole('button', { name: '显示研究助手', exact: true }).click();
  await expect(images).toHaveCount(2);
  expect(failures).toEqual([]);
});

test('desktop accessibility base and expanded controls', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'test-results/v2-desktop.png', fullPage: true });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: '加入房贷', exact: true }).click();
  await page.getByRole('button', { name: '加入公积金', exact: true }).click();
  await page.getByRole('button', { name: /调整期末安排/ }).click();
  await page.locator('.hc-analysis-panel').filter({ hasText: '账目贡献' }).locator('summary').click();
  await page.locator('.hc-scan > summary').click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.hc-header')).toBeInViewport();
  await page.screenshot({ path: 'test-results/v2-desktop-expanded.png', fullPage: true });
});

test('390px mobile and reduced motion stay readable with full features', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/v2-mobile.png', fullPage: true });
  await expect(page.locator('.hc-hero-image')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: '加入公积金', exact: true }).click();
  await page.getByRole('button', { name: '一次性投入', exact: true }).click();
  await page.getByRole('button', { name: /调整期末安排/ }).click();
  await page.locator('.hc-scan > summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/v2-mobile-expanded.png', fullPage: true });
});



test('future one-off provident use discloses that simultaneous monthly deductions begin in month one', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '加入房贷', exact: true }).click();
  await page.getByRole('button', { name: '加入公积金', exact: true }).click();
  await page.getByRole('button', { name: '一次性投入', exact: true }).click();
  await page.getByRole('spinbutton', { name: '投入时间', exact: true }).fill('24');
  await page.getByRole('button', { name: /调整比较期/ }).click();
  await page.getByRole('spinbutton', { name: '比较年数', exact: true }).fill('1');
  const monthly = page.getByRole('checkbox', { name: '同时从首月按月抵扣', exact: true });
  await monthly.check();
  await expect(monthly).toHaveAccessibleDescription(/第 1 个月开始.*一次性投入之前.*减少.*可用余额/);
  await expect(page.locator('.hc-result-kind')).toHaveText('1 年 · 12 个月');
  await expect(page.locator('.hc-fund-note')).toContainText('本期实际一次性投入 0 元');
  await expect(page.locator('.hc-fund-note')).toContainText('安排在比较期之后，本期不执行');
});
