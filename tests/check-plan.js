// Regression test for the training plan.
//   node tests/check-plan.js           compare the app against the golden snapshot
//   node tests/check-plan.js --write   re-record the snapshot (only when a plan change is intended and approved)
// The snapshot covers every day of weeks 1 to 30 for each equipment mode and for a lower starting fitness.
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

async function record() {
  const payloads = [], index = new Map(), days = {};
  for (const [name, profile, checks] of VARIANTS) {
    const app = await open(profile, checks); days[name] = [];
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

(async () => {
  const now = await record();
  if (process.argv.includes('--write')) { fs.writeFileSync(GOLDEN, JSON.stringify(now, null, 1) + '\n'); console.log('Snapshot written:', now.payloads.length, 'distinct day plans,', Object.keys(now.days).length, 'variants'); return; }
  const old = JSON.parse(fs.readFileSync(GOLDEN, 'utf8')); let bad = 0;
  for (const v of Object.keys(old.days)) for (let n = 0; n < old.days[v].length; n++) {
    const a = old.days[v][n], b = (now.days[v] || [])[n];
    const A = JSON.stringify([a[0], old.payloads[a[1]]]), B = b ? JSON.stringify([b[0], now.payloads[b[1]]]) : 'missing';
    if (A !== B) { if (bad++ < 5) console.log('DIFF', v, 'day', n + 1, '(week ' + a[0] + ')\n  was', A.slice(0, 400), '\n  now', B.slice(0, 400)); }
  }
  console.log(bad ? 'FAIL: ' + bad + ' day plans changed' : 'PASS: all ' + Object.values(old.days).reduce((x, d) => x + d.length, 0) + ' day plans match the snapshot');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
