// Stage reviews, goals, the sleep-quality rating, the year view and the clinician-summary history.
//   node tests/check-reviews.js            add --shots to save screenshots into tests/shots/
const assert = require('assert'), fs = require('fs'), path = require('path');
const { open } = require('./harness');
const SHOTS = process.argv.includes('--shots') ? path.join(__dirname, 'shots') : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const text = async app => (await app.page.innerText('#view')).replace(/\s+/g, ' ');
const at = async (app, n) => { await app.setDay(n); await app.ev("V={s:'today'};W=null;render()"); };
const go = async (app, s, a) => { await app.ev("go('" + s + "'" + (a ? ',' + JSON.stringify(a) : '') + ')'); await app.page.waitForTimeout(60); };
const slide = (app, id, v) => app.page.evaluate(([id, v]) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, [id, String(v)]);
const shot = async (app, name) => { if (SHOTS) await app.page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true }); };
const has = (t, s) => assert.ok(t.toLowerCase().includes(s.toLowerCase()), 'expected text: "' + s + '"');
const hasnt = (t, s) => assert.ok(!t.toLowerCase().includes(s.toLowerCase()), 'unexpected text: "' + s + '"');
const ok = m => console.log('  ok  ' + m);
const FORBIDDEN = /you (can|could|may|should) (now )?(stop|reduce|come off|cut)|no longer need|safe to stop|stop using your cpap|reduce your (cpap|treatment)/i;
// 89 days of records: snore falls by 1 every 10 days from 40; sleep quality 6, tiredness 5;
// CPAP 6.5 h (3 h every fifth night); all four sessions on even days, airway routine only on odd days.
const SEED = `(()=>{for(let i=0;i<=88;i++){const d=addD(S.profile.start,i);
 S.nights[d]={src:'snorelab',snore:40-Math.floor(i/10),tired:5,sleepQ:6,cpapH:i%5?6.5:3,ahi:3,tags:[]};
 S.done[d]=i%2?{routine:true}:{imt:true,routine:true,main:true,evening:true}}
 const lift=(date,kg,reps)=>({date,type:'WA',ex:[{n:'Trap-bar deadlift',sc:'4–5 × 4–6',log:true,sets:[{kg:String(kg),reps:String(reps)},{kg:String(kg),reps:String(reps)}]}]});
 S.sessions=[lift(addD(S.profile.start,8),70,6),lift(addD(S.profile.start,80),80,5)];save()})()`;

(async () => {
  let app = await open({ equip: 'gym', path: 'retest' }, null, { year52: true });
  await app.ev(SEED);

  await at(app, 80); let t = await text(app); has(t, 'Set your goals'); hasnt(t, 'review is ready');          // week 12
  await at(app, 88); t = await text(app); has(t, 'Awaken review is ready');                                    // week 13
  ok('the stage review is offered from week 13, not before');

  // baseline: goals and quality of life
  await app.page.click('[data-act=review][data-v=base]'); t = await text(app); has(t, 'Baseline'); has(t, 'never recommends changing your treatment');
  await app.page.click('[data-act=goals]'); await app.page.fill('#g0', 'Climb the stairs at work without stopping'); await app.page.fill('#g1', 'Walk the dog for an hour');
  await app.page.click('[data-act=goalsave]'); await app.page.waitForTimeout(80);
  assert.deepStrictEqual(await app.ev('S.goals.map(g=>g.t)'), ['Climb the stairs at work without stopping', 'Walk the dog for an hour']);
  await slide(app, 'rg0', 3); await slide(app, 'rg1', 4); await slide(app, 'rqol', 5); await shot(app, 'review-baseline');
  await app.page.click('[data-act=reviewsave]'); await app.page.waitForTimeout(80);
  let r = await app.ev('S.reviews.base'); assert.strictEqual(r.qol, 5); assert.deepStrictEqual(r.goals.map(g => g.v), [3, 4]);
  t = await text(app); hasnt(t, 'Set your goals'); has(t, 'Awaken review is ready'); ok('goals and a baseline rating can be set and saved');

  // week-13 review: numbers match the seeded records
  await app.page.click('[data-act=review][data-v=w13]'); t = await text(app);
  for (const s of ['Awaken review', 'Weeks 1–13', 'Keep using your CPAP', '36 · baseline 40 · 89 nights', 'Sleep quality 6 / 10', 'Daytime tiredness 5 / 10',
    '71 of 89 nights 4 h+', 'average 5.8 h', '63%', 'airway 89, breathing 45, main 45, evening 45 of 89 days', 'Trap-bar deadlift 80 kg × 5',
    'trends, not a diagnosis', 'do not show that sleep apnoea has improved or gone', 'never recommends changing your treatment', 'repeat sleep testing is appropriate']) has(t, s);
  assert.ok(!FORBIDDEN.test(t), 'review must not suggest reducing or stopping treatment'); await shot(app, 'review-week13');
  await slide(app, 'rg0', 6); await slide(app, 'rqol', 7); await app.page.click('[data-act=reviewsave]'); await app.page.waitForTimeout(80);
  r = await app.ev('S.reviews.w13'); assert.strictEqual(r.qol, 7); assert.strictEqual(r.goals[0].v, 6); assert.strictEqual(r.goals[1].v, 4, 'an untouched goal keeps its earlier rating');
  assert.strictEqual(r.snap.snore, 36); assert.strictEqual(r.snap.pct, 63); assert.strictEqual(r.snap.cpap4, 71);
  t = await text(app); hasnt(t, 'review is ready'); ok('the week-13 review reports the right numbers, carries the safety wording and saves a snapshot');

  // week 26: next review, year view, clinician summary
  await at(app, 25 * 7 + 3); t = await text(app); has(t, 'Build review is ready');
  await go(app, 'progress'); t = await text(app); has(t, 'Your year, stage by stage'); has(t, 'Awaken review'); has(t, 'Saved');
  await app.page.click('[data-act=year]'); t = await text(app);
  for (const s of ['Your year so far', 'Awaken · weeks 1–13', 'Build · weeks 14–26 · now', 'Quality of life 7 / 10', 'Climb the stairs at work without stopping: 6 / 10', 'never recommends changing your treatment', 'fades quickly if you stop']) has(t, s);
  hasnt(t, 'Reclaim · weeks'); assert.ok(!FORBIDDEN.test(t)); await shot(app, 'year-so-far');
  await go(app, 'review', { k: 'w26' }); t = await text(app); has(t, 'Build review'); hasnt(t, 'Best logged sets'); // no lifts were logged in weeks 14-26
  await go(app, 'report'); const rep = await app.page.inputValue('#copytext');
  for (const s of ['Program week 26 of 52', 'PROGRAM HISTORY BY STAGE (self-recorded; trends only, not a measure of sleep apnoea)', '- Awaken (weeks 1-13): snore median 36 over 89 nights · sleep quality 6/10 · tiredness 5/10 · sessions done',
    'CPAP 71/89 nights 4 h+', '- Awaken review (2026-04-03): quality of life 7/10; Climb the stairs at work without stopping 6/10']) assert.ok(rep.includes(s), 'summary should include: ' + s);
  assert.ok(!FORBIDDEN.test(rep)); ok('the year view and the clinician summary show the history by stage');

  // sleep-quality rating in the nightly log
  await go(app, 'log'); assert.ok(await app.page.$('#sleepq'), 'sleep quality slider'); await slide(app, 'sleepq', 8); await app.page.fill('#snore', '30');
  await app.page.click('[data-act=savenight]'); await app.page.waitForTimeout(80);
  assert.strictEqual(await app.ev("S.nights[addD(TODAY(),-1)].sleepQ"), 8); ok('sleep quality can be logged each morning');
  assert.deepStrictEqual(app.errors, []); await app.close();

  // ---------- switch off: none of this appears, and nothing recorded is lost ----------
  app = await open({ equip: 'gym', path: 'retest' }, null, { year52: false });
  await app.ev(SEED); await app.ev("S.goals=[{t:'Kept goal'}];S.reviews={w13:{date:'2026-04-04',qol:7,goals:[]}};save()");
  await at(app, 66); t = await text(app); hasnt(t, 'Set your goals'); hasnt(t, 'review is ready');
  await go(app, 'progress'); t = await text(app); hasnt(t, 'stage by stage');
  await go(app, 'report'); const off = await app.page.inputValue('#copytext'); assert.ok(!off.includes('PROGRAM HISTORY')); assert.ok(off.includes('Program week 10 of 24'));
  await go(app, 'log'); assert.strictEqual(await app.page.$('#sleepq'), null);
  await app.page.click('[data-act=savenight]'); await app.page.waitForTimeout(80);
  assert.strictEqual(await app.ev("S.nights[addD(TODAY(),-1)].sleepQ"), 6, 're-saving a night must keep its sleep-quality rating');
  assert.deepStrictEqual(await app.ev('[S.goals.length,S.reviews.w13.qol]'), [1, 7]);
  assert.deepStrictEqual(app.errors, []); await app.close();
  ok('switch off: no review, goal or sleep-quality screens, and saved reviews, goals and ratings are kept');
  console.log('PASS: reviews');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
