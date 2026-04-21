import { chromium } from 'playwright';
import fs from 'fs/promises';

const OUT = '.claude/reviews/screenshots';
await fs.mkdir(OUT, { recursive: true });

const targets = [
  { name: 'echocity-offers-mobile', url: 'https://echocity.vsedomatut.com/offers', vp: { width: 390, height: 844 } },
  { name: 'echocity-offers-desktop', url: 'https://echocity.vsedomatut.com/offers', vp: { width: 1440, height: 900 } },
  { name: 'echocity-root', url: 'https://echocity.vsedomatut.com/', vp: { width: 390, height: 844 } },
  { name: 'biglion-mobile', url: 'https://www.biglion.ru/', vp: { width: 390, height: 844 } },
  { name: 'biglion-desktop', url: 'https://www.biglion.ru/', vp: { width: 1440, height: 900 } },
  { name: 'frendi-mobile', url: 'https://frendi.ru/', vp: { width: 390, height: 844 } },
  { name: 'kuponator-mobile', url: 'https://kuponator.ru/', vp: { width: 390, height: 844 } },
];

const browser = await chromium.launch();
const results = [];
for (const t of targets) {
  const ctx = await browser.newContext({ viewport: t.vp, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1' });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(t.url, { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const out = `${OUT}/${t.name}.png`;
    await page.screenshot({ path: out, fullPage: true });
    results.push({ name: t.name, status: resp?.status(), url: t.url, file: out });
    console.log(`OK ${t.name} status=${resp?.status()}`);
  } catch (e) {
    console.log(`FAIL ${t.name}: ${e.message}`);
    results.push({ name: t.name, error: e.message, url: t.url });
  } finally {
    await ctx.close();
  }
}
await browser.close();
await fs.writeFile(`${OUT}/_results.json`, JSON.stringify(results, null, 2));
console.log('DONE');
