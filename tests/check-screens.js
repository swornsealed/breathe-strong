// Screen tests for stage navigation, the full-year calendar, cardio choice, the Minimum week,
// recovery guidance and load suggestions. Also confirms the default (switch off) screens are as before.
//   node tests/check-screens.js            add --shots to save screenshots into tests/shots/
const assert = require('assert'), fs = require('fs'), path = require('path');
const { open } = require('./harness');
const SHOTS = process.argv.includes('--shots') ? path.join(__dirname, 'shots') : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const text = async app => (await app.page.innerText('#view')).replace(/\s+/g, ' ');
const at = async (app, n) => { await app.setDay(n); await app.ev("V={s:'today'};W=null;render()"); };
const tab = async (app, t) => { await app.ev("go('" + t + "')"); await app.page.waitForTimeout(60); }; // same call the tab bar makes
const shot = async (app, name) => { if (SHOTS) await app.page.screenshot({ path: path.join(SHOTS, name + '.png') }); };
const has = (t, s, m) => assert.ok(t.toLowerCase().includes(s.toLowerCase()), (m || 'expected text') + ': "' + s + '"');
const hasnt = (t, s, m) => assert.ok(!t.toLowerCase().includes(s.toLowerCase()), (m || 'unexpected text') + ': "' + s + '"');
const ok = m => console.log('  ok  ' + m);
const session = (date, n, sc, reps) => ({ date, type: 'WA', ex: [{ n, sc, log: true, done: false, sets: reps.map(r => ({ kg: '60', reps: String(r) })) }] });

(async () => {
  // ---------- switch off: screens as before ----------
  let app = await open({ equip: 'gym' }, null, { year52: false });
  await at(app, 9 * 7 + 1); let t = await text(app);
  has(t, 'Week 10 of 24'); has(t, 'Progression phase'); hasnt(t, 'stage'); has(t, 'Retest around week 24');
  await tab(app, 'plan'); t = await text(app); has(t, 'wk 9–24'); hasnt(t, 'Awaken'); hasnt(t, 'Recovery and when to ease off');
  await app.ev("go('settings')"); t = await text(app); hasnt(t, 'Cardio'); hasnt(t, 'Minimum week');
  await at(app, 45 * 7); t = await text(app); has(t, 'Maintenance phase');
  assert.strictEqual((await app.page.innerText('#view h1')).toLowerCase(), 'week 46', 'past week 24 the header must not say "of 24"');
  assert.deepStrictEqual(app.errors, []); await app.close(); ok('switch off: Today, Plan and Settings are unchanged, and "Week 46 of 24" is fixed');

  // ---------- switch on ----------
  app = await open({ equip: 'gym', path: 'retest' }, null, { year52: true });
  await at(app, 29 * 7); t = await text(app);                                   // week 30, Monday
  has(t, 'Week 30 of 52'); has(t, 'Reclaim stage · Rebuild phase'); has(t, 'Review at week 39'); has(t, 'Keep using your CPAP'); await shot(app, 'today-week30');
  await tab(app, 'plan'); t = await text(app);
  for (const s of ['Awaken', 'wk 1–13', 'Build', 'wk 14–26', 'Reclaim', 'wk 27–39', 'Thrive', 'wk 40–52', 'Recovery and when to ease off']) has(t, s);
  await shot(app, 'plan-week30'); ok('Today and Plan show the stage, week of 52 and the four-stage bar');

  await app.page.click('[data-act=stage][data-v=reclaim]'); await app.page.waitForTimeout(120); t = await text(app);
  has(t, 'Stage 3 of 4'); for (let w = 27; w <= 39; w++) has(t, 'Week ' + w); hasnt(t, 'Week 26'); hasnt(t, 'Week 40');
  has(t, 'Week 30 · now'); has(t, 'Week 39 ★ review'); has(t, '3 sets, lighter week'); has(t, 'Saturday 60 min'); await shot(app, 'stage-reclaim');
  await app.page.click('[data-act=week][data-v="35"]'); await app.page.waitForTimeout(120);
  assert.strictEqual(await app.ev('V.s+"|"+V.cd'), 'plan|2026-08-31'); t = await text(app); has(t, 'August 2026');
  ok('stage screen lists its 13 weeks and a week opens on the calendar');

  // calendar and milestones cover the year
  assert.strictEqual(await app.ev("msOn(addD(S.profile.start,182)).map(m=>m.t).join()"), 'Reclaim stage starts');
  assert.strictEqual(await app.ev("msOn(addD(S.profile.start,363)).map(m=>m.t).join()"), 'One year · review');
  assert.ok(!(await app.ev("msOn(addD(S.profile.start,167)).map(m=>m.s).join()")).includes('book your repeat sleep study'), 'day 167 wording should be softened');
  ok('milestones cover the year and the week-24 wording no longer tells everyone to book a study');

  // cardio choice
  await at(app, 29 * 7 + 1); await app.ev("go('cardio')"); t = await text(app); has(t, 'Your choice: Walking'); has(t, '3 × 10 minutes');
  await app.ev("go('settings')"); t = await text(app); has(t, 'Cardio'); has(t, 'Full week'); has(t, 'Minimum week');
  await app.page.check('input[name=cardioq][value=pool]'); await app.page.click('[data-act=saveplan]'); await app.page.waitForTimeout(150);
  assert.strictEqual(await app.ev('S.profile.cardioMode'), 'pool');
  await app.ev("go('cardio')"); t = await text(app); has(t, 'Your choice: Pool'); has(t, 'It counts the same'); await shot(app, 'cardio-pool');
  ok('cardio activity can be chosen in Settings and split sessions are offered');

  // lighter week
  await at(app, 25 * 7); await app.ev("go('workout',{x:dayPlan(TODAY()).m.x})"); t = await text(app);
  has(t, 'Lighter week.'); has(t, 'about 90% of your recent load'); await shot(app, 'workout-lighter-week26');
  await tab(app, 'today'); t = await text(app); has(t, 'lighter review week'); ok('lighter weeks are flagged on Today and in the workout');

  // Minimum week
  await at(app, 44 * 7 + 2); await app.ev("go('settings')"); t = await text(app); has(t, 'Minimum week');       // week 45, Wednesday
  await app.page.check('input[name=weekq][value=min]'); await app.page.click('[data-act=saveplan]'); await app.page.waitForTimeout(150);
  assert.strictEqual(await app.ev('dayPlan(TODAY()).m.k'), 'rest');
  await tab(app, 'plan'); t = await text(app); has(t, 'Your week: Minimum week'); await shot(app, 'plan-minimum-week45');
  ok('the Minimum week can be chosen in Settings and changes the schedule');
  assert.deepStrictEqual(app.errors, []); await app.close();

  // load suggestions: only from week 27, only with the switch on, never in a lighter week
  const seed = 'S.sessions=' + JSON.stringify([session('2026-07-01', 'Trap-bar deadlift', '4 × 6–8', [8, 8, 8, 8]), session('2026-07-03', 'Trap-bar deadlift', '4 × 6–8', [8, 8, 8, 8]),
    session('2026-07-01', 'Standing overhead press', '4 × 6–8', [5, 5, 6, 5]), session('2026-07-03', 'Standing overhead press', '4 × 6–8', [5, 6, 5, 5]),
    session('2026-07-01', 'Barbell or dumbbell row', '4 × 6–8', [8, 8, 8, 8]), session('2026-07-03', 'Barbell or dumbbell row', '4 × 6–8', [7, 8, 7, 6])]) + ';';
  const wo = async (app, n) => { await app.setDay(n); await app.ev(seed + "W=null;go('workout',{x:'A'})"); return text(app); };
  app = await open({ equip: 'gym' }, null, { year52: true });
  t = await wo(app, 27 * 7); has(t, 'Top of the range two sessions running'); has(t, 'Under the range two sessions running');
  assert.strictEqual((t.match(/two sessions running/g) || []).length, 2, 'the row (mixed results) must get no suggestion'); has(t, 'Your call'); await shot(app, 'workout-suggestions-week28');
  t = await wo(app, 19 * 7); hasnt(t, 'two sessions running', 'no suggestions before week 27');
  t = await wo(app, 38 * 7); hasnt(t, 'two sessions running', 'no suggestions in a lighter week');
  assert.deepStrictEqual(app.errors, []); await app.close();
  app = await open({ equip: 'gym' }, null, { year52: false });
  t = await wo(app, 27 * 7); hasnt(t, 'two sessions running', 'no suggestions with the switch off'); await app.close();
  ok('load suggestions appear only from week 27, with the switch on, outside lighter weeks, and leave the decision to the user');

  // wording for a year-long program: welcome, set-up, Health tab, clinician summary, CSV
  app = await open(null, null, { rawState: '' });
  t = await text(app); has(t, 'I’ve started snoring'); has(t, 'A 12-month program to reduce snoring'); has(t, 'The same 12-month program, with a review every 13 weeks'); hasnt(t, '6-month');
  await app.close();
  app = await open({ equip: 'gym', path: 'retest' });
  await at(app, 20 * 7); await tab(app, 'retest'); t = await text(app);
  for (const s of ['Road to reassessment · 12 months', 'Your 12-month road', 'Weeks 1–52', 'Weeks 13, 26 and 39', 'Ask your doctor whether repeat sleep testing is appropriate', 'Your doctor makes that call, with testing']) has(t, s);
  hasnt(t, 'Week 22'); hasnt(t, '6-month');
  await tab(app, 'report'); const sum = await app.page.inputValue('#copytext'); assert.ok(sum.includes('12-month airway and fitness training program') && sum.includes('ask whether repeat sleep testing is appropriate') && !sum.includes('plan a repeat sleep study'));
  assert.ok((await app.ev('csv()')).split('\n')[0].endsWith(',tags,sleep_quality'));
  assert.deepStrictEqual(app.errors, []); await app.close();
  ok('welcome, set-up, Health tab, clinician summary and CSV describe a 12-month program');

  // every tab and the new screen in each stage, no errors
  app = await open({ equip: 'bw', path: 'retest' }, null, { year52: true });
  for (const w of [1, 13, 14, 26, 27, 39, 40, 44, 52, 60]) { await at(app, (w - 1) * 7 + 2); for (const tb of ['plan', 'log', 'progress', 'retest', 'today', 'day']) await tab(app, tb);
    await app.ev("go('stage',{k:'thrive'})"); await app.ev("go('settings')"); await app.ev("go('cardio')"); }
  t = await (async () => { await at(app, 59 * 7); return text(app); })(); has(t, 'Year complete'); assert.strictEqual((await app.page.innerText('#view h1')).toLowerCase(), 'week 60');
  assert.deepStrictEqual(app.errors, []); await app.close(); ok('all tabs open without errors in every stage, and after week 52');
  console.log('PASS: screens');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
