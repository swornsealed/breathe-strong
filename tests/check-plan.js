// Regression test for the training plan.
//   node tests/check-plan.js           compare the app against the golden snapshot
//   node tests/check-plan.js --write   re-record the snapshot (only when a plan change is intended and approved)
// The snapshot was recorded from the original 24-week app and covers every day of weeks 1 to 30
// for each equipment mode and for a lower starting fitness.
const fs = require('fs'), path = require('path');
const { open } = require('./harness');
const GOLDEN = path.join(__dirname, 'golden', 'plan-v1.json');
const WEEKS = 30;
const LOWFIT = { fitness: [{ date: '2026-01-01', a: { push: '5', plank: '20', walk: 'no' } }] };
const VARIANTS = [
  ['gym', { equip: 'gym' }], ['dumbbells', { equip: 'db' }], ['household', { equip: 'home' }], ['bodyweight', { equip: 'bw' }],
  ['gym-cpap-path', { equip: 'gym', path: 'retest' }],
  ['gym-low-fitness', { equip: 'gym' }, LOWFIT], ['bodyweight-low-fitness', { equip: 'bw' }, LOWFIT],
];
const DAY = `(()=>{const t=TODAY(),d=dayPlan(t),i=info(d.m,d.p,d.row);
 const o={phase:d.p,phaseName:PH[d.p].n,weekday:d.wd,session:d.m,title:i.t,sub:i.s,min:i.min,dayLabel:i.day,breathOutSets:emstSets(),
  airway:myMoves(d.p).map(m=>[m.k,m.reps,m.hold,m.rest].join('/'))};
 if(d.m.k==='w'){W=null;V={s:'workout',x:d.m.x};workout();o.exercises=W.ex.map(e=>[e.n,e.sc,e.tip||'',e.log?e.sets.length+' logged sets':'tick']);W=null;V={s:'today'}}
 return JSON.stringify({week:d.w,o})})()`;

async function record(legacy) {
  const payloads = [], index = new Map(), days = {};
  for (const [name, profile, checks] of VARIANTS) {
    const app = await open(profile, checks, legacy ? { year52: false } : {}); days[name] = [];
    for (let n = 0; n < WEEKS * 7; n++) {
      await app.setDay(n);
      const { week, o } = JSON.parse(await app.ev(DAY));
      const key = JSON.stringify(o);
      if (!index.has(key)) { index.set(key, payloads.length); payloads.push(o); }
      days[name].push([week, index.get(key)]);
    }
    if (app.errors.length) throw new Error(name + ': page errors: ' + app.errors.join('; '));
    await app.close();
  }
  return { note: 'Plan for every day of weeks 1-' + WEEKS + '. days[variant][dayIndex] = [week, payload index].', weeks: WEEKS, payloads, days };
}

// Strength-session minutes were a flat 50 in the original app and are now estimated from the set count,
// so they are left out of the comparison. Everything that is prescribed (exercises, sets, reps, cardio) is compared.
const norm = o => { const c = Object.assign({}, o); if (c.session && c.session.k === 'w') delete c.min; return c; };

(async () => {
  if (process.argv.includes('--write')) { const now = await record(true); fs.writeFileSync(GOLDEN, JSON.stringify(now, null, 1) + '\n'); console.log('Snapshot written:', now.payloads.length, 'distinct day plans,', Object.keys(now.days).length, 'variants'); return; }
  const old = JSON.parse(fs.readFileSync(GOLDEN, 'utf8')); let bad = 0, n = 0;
  // 1. the program as released: weeks 1-24 must be exactly the original plan
  // 2. the original 24-week behaviour (fallback switch): all 30 recorded weeks must match
  for (const [label, now, upto] of [['released program, weeks 1-24', await record(false), 24 * 7], ['original behaviour, weeks 1-30', await record(true), 30 * 7]]) {
    for (const v of Object.keys(old.days)) for (let d = 0; d < upto; d++) { n++;
      const a = old.days[v][d], b = (now.days[v] || [])[d];
      const A = JSON.stringify([a[0], norm(old.payloads[a[1]])]), B = b ? JSON.stringify([b[0], norm(now.payloads[b[1]])]) : 'missing';
      if (A !== B) { if (bad++ < 5) console.log('DIFF', label, v, 'day', d + 1, '(week ' + a[0] + ')\n  was', A.slice(0, 400), '\n  now', B.slice(0, 400)); } }
  }
  console.log(bad ? 'FAIL: ' + bad + ' day plans changed' : 'PASS: all ' + n + ' day plans match the snapshot (weeks 1-24 as released; weeks 1-30 in original mode)');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
