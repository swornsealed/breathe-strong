// Test harness for the single-file app. It never edits index.html on disk:
// the page is served from memory with two test-only injections,
//   1. an eval hook placed inside the app's closed block, so tests can read its internals
//   2. a controllable clock, so any program day can be inspected without waiting
// Run from the repository root:  node tests/check-plan.js
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const ANCHOR = '/* ---------- helpers ---------- */';
const START = '2026-01-05'; // a Monday, so program weeks line up with calendar weeks

function appHtml() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (html.split(ANCHOR).length !== 2) throw new Error('Harness anchor not found exactly once in index.html');
  return html.replace(ANCHOR, 'window.__bsEval=s=>eval(s);\n' + ANCHOR);
}

async function open(profile, checks) {
  const html = appHtml();
  const server = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html); });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), route => route.abort()); // no network: fonts, sign-in
  const state = { v: 1, at: 1, health: null, nights: {}, done: {}, sessions: [], weekly: {}, imtLevel: 4, imtEasy: 0,
    checks: checks || {}, profile: Object.assign({ start: START, scoreSrc: 'snorelab', path: 'snorer', equip: 'gym', imt: 'yes', quickFlag: null, gpOk: false }, profile || {}) };
  await ctx.addInitScript(st => {
    const D = Date; window.__bsNow = D.now();
    class F extends D { constructor(...a) { a.length ? super(...a) : super(window.__bsNow); } static now() { return window.__bsNow; } }
    window.Date = F;
    try { if (!localStorage.getItem('bs-state')) { localStorage.setItem('bs-local', '1'); localStorage.setItem('bs-state', JSON.stringify(st)); } } catch (e) {}
  }, state);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:' + server.address().port + '/');
  await page.waitForFunction(() => typeof window.__bsEval === 'function');
  const day0 = new Date(2026, 0, 5, 12).getTime();
  return {
    page, errors,
    ev: code => page.evaluate(c => window.__bsEval(c), code),
    setDay: n => page.evaluate(ms => { window.__bsNow = ms; }, day0 + n * 864e5), // n = days since program start
    close: async () => { await browser.close(); server.close(); },
  };
}
module.exports = { open, START };
