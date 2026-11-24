// Saved-data upgrade tests: a version 1 record must come through with nothing lost.
//   node tests/check-migrate.js
const assert = require('assert');
const { open, START } = require('./harness');
const same = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), msg);

const V1 = { v: 1, at: 1700000000000, imtLevel: 6, imtEasy: 1, backupAt: '2026-02-01',
  profile: { start: START, scoreSrc: 'snorelab', path: 'retest', equip: 'db', imt: 'yes', quickFlag: null, gpOk: true, watch: 'apple', emst: 'yes' },
  nights: { '2026-01-06': { src: 'snorelab', snore: 31, partner: 6, tired: 5, cpapH: 6.5, ahi: 3.2, seal: 'good', hr: 58, br: 14, ox: 95, tags: ['Training day'], dgap: '3' },
            '2026-03-10': { src: 'snorelab', snore: 22, partner: 4, tired: 3, cpapH: 7, ahi: 2.1, seal: 'good', tags: [] } },
  done: { '2026-01-06': { imt: true, routine: true, main: true, evening: true, ev: { walk: true, calf: true } }, '2026-03-10': { routine: true } },
  sessions: [{ date: '2026-01-05', type: 'WA', ex: [{ n: 'Dumbbell Romanian deadlift', sc: '3 × 8–15, slow lowering', log: true, done: false, sets: [{ kg: '20', reps: '12' }, { kg: '20', reps: '11' }, { kg: '', reps: '' }] }] }],
  weekly: { w1: { bolt: 18, neck: 43, waist: 104, ahi: 3, imt: 4 }, w9: { bolt: 24, neck: 42.5, waist: 101, ahi: 2.4, imt: 6 } },
  checks: { fitness: [{ date: '2026-01-04', a: { push: '9', plank: '35', walk: 'yes' } }], tongue: [{ date: '2026-01-04', a: { secs: '18' } }], alert: [{ date: '2026-01-04', a: { nap: '2', focus: '1', fresh: '2', caff: '1', nod: '0' } }] },
  health: { status: 'moderate', treatment: 'cpap', pressure: '9', tStart: '2024-05-01', clinic: 'Sleep clinic', studies: [{ date: '2024-04-02', type: 'lab', ahi: '22', low: '84', odi: '', notes: 'worse on back' }], appts: [{ date: '2026-07-01', who: 'Sleep clinic', why: 'review' }], qs: ['Could my pressure be reviewed?'] },
  pm: { '2026-01-06': 43.5 } };

function intact(now, was, label) {
  for (const k of Object.keys(was)) if (k !== 'v' && k !== 'at' && k !== 'profile') same(now[k], was[k], label + ': field "' + k + '" changed');
  for (const k of Object.keys(was.profile)) same(now.profile[k], was.profile[k], label + ': profile field "' + k + '" changed');
  assert.strictEqual(now.v, 3, label + ': version should be 3');
  same(now.profile.level, { s: 'A', c: 'A' }, label + ': an existing user must stay on the original plan (Advanced)');
  assert.strictEqual(now.profile.levelPrompt, true, label + ': an existing user should be offered the level check');
  assert.ok(Array.isArray(now.levelLog) && now.screen === null, label + ': level fields missing');
  assert.ok(Array.isArray(now.goals) && now.reviews && typeof now.reviews === 'object', label + ': new fields missing');
}

(async () => {
  const raw = JSON.stringify(V1); let n = 0; const ok = m => { n++; console.log('  ok  ' + m); };

  // 1. phone-only user, mid-program (day 66 = week 10)
  let app = await open(null, null, { rawState: raw, day: 65 });
  intact(JSON.parse(await app.ev('JSON.stringify(S)')), V1, 'load'); ok('version 1 record loads with every field intact');
  assert.strictEqual(await app.ev('weekOf(TODAY())'), 10); ok('the user is still in week 10');
  assert.strictEqual(await app.page.evaluate(() => localStorage.getItem('bs-state-v1-backup')), raw); ok('untouched copy of the version 1 data is kept');
  await app.ev('save()');
  intact(JSON.parse(await app.page.evaluate(() => localStorage.getItem('bs-state'))), V1, 'after save'); ok('nothing is lost when the app saves');
  await app.page.reload(); await app.page.waitForFunction(() => typeof window.__bsEval === 'function');
  intact(JSON.parse(await app.ev('JSON.stringify(S)')), V1, 'after reload');
  assert.strictEqual(await app.page.evaluate(() => localStorage.getItem('bs-state-v1-backup')), raw); ok('reloading keeps the data and does not overwrite the kept copy');
  for (const tab of ['plan', 'log', 'progress', 'retest', 'today']) { await app.page.click('[data-act=tab][data-v=' + tab + ']'); await app.page.waitForTimeout(150); }
  assert.deepStrictEqual(app.errors, []); ok('every tab opens without errors on upgraded data');
  await app.close();

  // 2. user past week 24 (week 40)
  app = await open(null, null, { rawState: raw, day: 39 * 7 });
  intact(JSON.parse(await app.ev('JSON.stringify(S)')), V1, 'week 40');
  assert.strictEqual(await app.ev('weekOf(TODAY())'), 40); assert.strictEqual(await app.ev('stageOf(40).n+"/"+PH[dayPlan(TODAY()).p].n'), 'Thrive/Consolidate'); ok('a user past week 24 keeps his data and lands in the right stage for his week');
  await app.close();

  // 3. brand-new user: no saved data at all
  app = await open(null, null, { rawState: '' });
  const fresh = JSON.parse(await app.ev('JSON.stringify(S)'));
  assert.strictEqual(fresh.v, 3); assert.strictEqual(fresh.profile, null);
  assert.strictEqual(await app.page.evaluate(() => localStorage.getItem('bs-state-v1-backup')), null); ok('a new user starts on version 3 with no leftover copy');
  // 4. cloud record arriving in version 1 form
  await app.ev('adopt({s:' + JSON.stringify(raw) + ',at:' + V1.at + '})');
  intact(JSON.parse(await app.ev('JSON.stringify(S)')), V1, 'cloud'); ok('a version 1 record arriving from the cloud is upgraded with every field intact');
  await app.close();

  // version 2 record (the 52-week release) with the old 'std' week setting
  const V2 = Object.assign({}, V1, { v: 2, goals: [{ t: 'Stairs' }], reviews: { w13: { date: '2026-04-03', qol: 6, goals: [] } }, profile: Object.assign({}, V1.profile, { weekPlan: 'std', cardioMode: 'bike' }) });
  const raw2 = JSON.stringify(V2);
  app = await open(null, null, { rawState: raw2, day: 20 * 7 });
  const up = JSON.parse(await app.ev('JSON.stringify(S)'));
  assert.strictEqual(up.v, 3); same(up.goals, V2.goals); same(up.reviews, V2.reviews); same(up.nights, V2.nights); same(up.sessions, V2.sessions);
  same(up.profile.level, { s: 'A', c: 'A' }); assert.strictEqual(up.profile.weekPlan, 'full'); assert.strictEqual(up.profile.cardioMode, 'bike');
  assert.strictEqual(await app.page.evaluate(() => localStorage.getItem('bs-state-v2-backup')), raw2);
  assert.strictEqual(await app.ev('lvOf("s")+lvOf("c")'), 'AA'); ok('a version 2 record upgrades to version 3 on the original plan, with a kept copy and the week setting carried over');
  await app.close();

  // 5. forward compatibility: fields this version does not know about survive a load and save
  const future = Object.assign({}, V1, { v: 4, goals: [{ t: 'Walk the hill track', r: 4 }], reviews: { w13: { date: '2026-04-05' } }, somethingNew: { keep: [1, 2, 3] } });
  app = await open(null, null, { rawState: JSON.stringify(future) });
  await app.ev('save()');
  const back = JSON.parse(await app.page.evaluate(() => localStorage.getItem('bs-state')));
  same(back.somethingNew, future.somethingNew); same(back.goals, future.goals); same(back.reviews, future.reviews); assert.strictEqual(back.v, 4); ok('unknown newer fields and a newer version number are preserved');
  // 6. restore from a version 1 backup file
  await app.ev('V.restore={data:' + raw + ',date:"x"}');
  intact(JSON.parse(await app.ev('JSON.stringify(migrate(Object.assign(blank(),V.restore.data)))')), V1, 'restore'); ok('a version 1 backup file restores with every field intact');
  await app.close();
  console.log('PASS: saved-data upgrade, ' + n + ' checks');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
