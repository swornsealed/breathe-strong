// Weeks 25 to 52 against the specification in docs/52-week/program-plan.md, section 2.4.
// The expected values below are written out independently of the app's own week table.
//   node tests/check-year.js
const assert = require('assert'), fs = require('fs'), path = require('path');
const { open } = require('./harness');
const LITE = ', lighter week: about 90% of your recent load';
const between = (w, a, b) => w >= a && w <= b;
const SPEC = w => {
  const lite = [26, 39, 52].includes(w);
  const phase = w <= 26 ? 'Progression' : w <= 30 ? 'Rebuild' : w <= 39 ? 'Progression' : w <= 43 ? 'Consolidate' : 'Maintain';
  const heavy = '4–5 × 4–6', mid = '4 × 6–8', hold = '3 × 5–8, hold your loads';
  let main, chin, goblet;
  if (between(w, 27, 30) || between(w, 40, 43)) { main = mid; chin = mid; goblet = '4 × 8'; }
  else if (w >= 44) { main = chin = goblet = hold; }
  else { main = heavy + ', add small loads'; chin = heavy; goblet = mid; }
  if (lite) { const cut = s => '3 ×' + s.split('×')[1].split(',')[0] + LITE; main = cut(main); chin = cut(chin); goblet = cut(goblet); }
  const sat = lite || w === 25 ? 45 : between(w, 27, 30) ? 50 : between(w, 31, 34) ? 55 : 60;
  return { phase, main, chin, goblet, sat, lite };
};
const DAY = `(()=>{const t=TODAY(),d=dayPlan(t),i=info(d.m,d.p,d.row);const o={phaseName:PH[d.p].n,kind:d.m.k,x:d.m.x||'',title:i.t,sub:i.s,min:i.min,out:emstSets(),airway:myMoves(d.p).map(m=>[m.k,m.reps,m.hold,m.rest].join('/'))};
 if(d.m.k==='w'){W=null;V={s:'workout',x:d.m.x};workout();o.ex=W.ex.map(e=>[e.n,e.sc]);W=null;V={s:'today'}}return JSON.stringify({week:d.w,o})})()`;
const week = async (app, w) => { const out = []; for (let d = 0; d < 7; d++) { await app.setDay((w - 1) * 7 + d); out.push(JSON.parse(await app.ev(DAY)).o); } return out; };

(async () => {
  const golden = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', 'plan-v1.json'), 'utf8'));
  let app = await open({ equip: 'gym' }, null, { year52: true });

  // weeks 1-24 must be untouched by switching the new weeks on
  const GDAY = fs.readFileSync(path.join(__dirname, 'check-plan.js'), 'utf8').match(/const DAY = `([\s\S]*?)`;/)[1];
  for (let n = 0; n < 24 * 7; n++) { await app.setDay(n); const r = JSON.parse(await app.ev(GDAY)); const g = golden.days.gym[n];
    assert.deepStrictEqual([r.week, r.o], [g[0], golden.payloads[g[1]]], 'week ' + g[0] + ' day ' + (n % 7 + 1) + ' changed when weeks 25-52 are on'); }
  console.log('  ok  weeks 1-24 are identical with the new weeks switched on');

  const week8 = (await week(app, 8))[0].airway;
  for (let w = 25; w <= 52; w++) {
    const s = SPEC(w), d = await week(app, w), tag = 'week ' + w + ': ';
    assert.deepStrictEqual(d.map(x => x.kind), ['w', 'z2', 'w', s.lite ? 'z2' : 'int', 'w', 'z2long', 'rest'], tag + 'weekly pattern');
    assert.deepStrictEqual([d[0].x, d[2].x, d[4].x], w % 2 ? ['A', 'B', 'A'] : ['B', 'A', 'B'], tag + 'A and B order');
    const A = d.find(x => x.x === 'A').ex, B = d.find(x => x.x === 'B').ex;
    d.forEach(x => assert.strictEqual(x.phaseName, s.phase, tag + 'phase name'));
    assert.strictEqual(A[0][1], s.main, tag + 'deadlift'); assert.strictEqual(A[1][1], s.main, tag + 'press'); assert.strictEqual(B[0][1], s.main, tag + 'bench');
    assert.strictEqual(B[1][1], s.chin, tag + 'chin-ups'); assert.strictEqual(B[2][1], s.goblet, tag + 'goblet squat');
    assert.strictEqual(A[3][1], '4 × 40 m', tag + 'carry'); assert.strictEqual(B[5][1], '3 × 45 s', tag + 'plank');
    assert.strictEqual(d[1].min, 45, tag + 'Tuesday minutes'); assert.strictEqual(d[5].min, s.sat, tag + 'Saturday minutes');
    if (s.lite) assert.strictEqual(d[3].min, 45, tag + 'Thursday steady'); else assert.strictEqual(d[3].sub, '8 × 30 s hard / 90 s easy, then 8 holds', tag + 'intervals');
    d.forEach(x => { assert.deepStrictEqual(x.airway, week8, tag + 'airway dose must stay at the week-6 level'); assert.strictEqual(x.out, 5, tag + 'breathing-out sets'); });
  }
  console.log('  ok  weeks 25-52 match the specification: phases, lift schemes, lighter weeks, cardio minutes');
  console.log('  ok  airway and breathing doses are held constant from week 25 to 52');

  const after = await week(app, 60);
  assert.strictEqual(after[0].phaseName, 'Maintain'); assert.strictEqual(after[5].min, 60);
  console.log('  ok  after week 52 the plan continues on the Maintain block');

  // Minimum week: only offered in weeks 44-51
  await app.ev("S.profile.weekPlan='min'");
  for (const w of [44, 51]) { const d = await week(app, w); assert.deepStrictEqual(d.map(x => x.kind + x.x), ['wA', 'z2', 'rest', 'rest', 'wB', 'z2long', 'rest'], 'week ' + w + ' Minimum pattern'); }
  for (const w of [10, 30, 43, 52]) { const d = await week(app, w); assert.strictEqual(d.filter(x => x.kind === 'w').length, 3, 'week ' + w + ' must ignore the Minimum setting'); }
  console.log('  ok  the Minimum week applies in weeks 44-51 only');
  assert.deepStrictEqual(app.errors, []); await app.close();

  // home equipment in a lighter week
  app = await open({ equip: 'bw' }, null, { year52: true });
  const bw = (await week(app, 26)).find(x => x.x === 'A').ex;
  assert.strictEqual(bw[0][1], '3 × 8–15, slow lowering (lighter week)'); await app.close();
  console.log('  ok  bodyweight users get three sets in a lighter week');

  // switched off: week 25 onward is exactly the old behaviour
  app = await open({ equip: 'gym' }, null, { year52: false });
  const off = await week(app, 30); assert.strictEqual(off[0].phaseName, 'Maintenance'); assert.strictEqual(off[5].min, 45); await app.close();
  console.log('  ok  with the switch off, week 25 onward is unchanged');
  console.log('PASS: weeks 25-52');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
