// Training levels: Foundation, Standard, Advanced.
//   node tests/check-levels.js            add --shots to save screenshots into tests/shots/
// 1. Every combination of strength level, cardio level, equipment, week plan and week resolves to a usable session.
// 2. Foundation and Standard match docs/three-levels/training-levels-plan.md (expected values written out here independently).
// 3. Airway and breathing work do not depend on level.
// 4. New-user assessment and level changes behave as designed. Health screening and the staged step-up are in check-safety.js.
const assert = require('assert'), fs = require('fs'), path = require('path');
const { open } = require('./harness');
const SHOTS = process.argv.includes('--shots') ? path.join(__dirname, 'shots') : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const ok = m => console.log('  ok  ' + m);
const text = async app => (await app.page.innerText('#view')).replace(/\s+/g, ' ');
const has = (t, s) => assert.ok(t.toLowerCase().includes(s.toLowerCase()), 'expected text: "' + s + '"');
const hasnt = (t, s) => assert.ok(!t.toLowerCase().includes(s.toLowerCase()), 'unexpected text: "' + s + '"');
const shot = async (app, name, full) => { if (SHOTS) await app.page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full }); };
const at = async (app, n) => { await app.setDay(n); await app.ev("V={s:'today'};W=null;N=null;render()"); };
const LITE = w => w === 26 || w === 39 || w === 52;
// ---- expected values, from the plan document ----
const LIFT = {
  F: w => w <= 2 ? [2, 1, '12–15'] : w <= 5 ? [2, 2, '12–15'] : w <= 13 ? [2, 2, '10–12'] : w <= 17 ? [3, 2, '10–12'] : w <= 25 ? [3, 3, '10–12'] : LITE(w) ? [3, 2, '10–12'] : w <= 30 ? [3, 2, '12–15'] : w <= 38 ? [3, 3, '10–12'] : w <= 43 ? [3, 3, '10–12'] : [3, 2, '10–12'],
  S: w => w <= 2 ? [3, 2, '10–12'] : w <= 5 ? [3, 3, '10–12'] : w <= 13 ? [3, 3, '8–10'] : w <= 25 ? [3, 4, '8–10'] : LITE(w) ? [3, 3, '8–10'] : w <= 30 ? [3, 3, '10–12'] : w <= 38 ? [3, 4, '8–10'] : w <= 43 ? [3, 3, '10–12'] : [3, 3, '8–10'],
};
const CARDIO = { // [Tuesday, Thursday, Saturday]; a range is 'lo–hi'; intervals are 'int N'
  F: w => w <= 2 ? ['10–15', '10–15', 20] : w <= 5 ? ['15–20', '15–20', 25] : w <= 8 ? ['20–25', '20–25', 30] : w <= 13 ? ['25–30', '25–30', 35] : LITE(w) ? [30, 30, 30] : w <= 25 ? [30, 30, 40] : w <= 38 ? [30, 30, 45] : ['30–35', '30–35', 45],
  S: w => w <= 2 ? [25, 25, 35] : w <= 5 ? [30, 30, 40] : LITE(w) ? [40, 30, 40] : w <= 8 ? [35, 'int 4', 45] : w <= 30 ? [40, 'int 6', 45] : [40, 'int 6', 50],
};
// weekly hours including the daily airway, breathing and evening work. Full week, then Minimum week.
const HOURS = { F: [6.3, 8.5], S: [8.0, 9.5], A: [9.0, 10.75] }, HOURS_MIN = { F: [6.3, 7.7], S: [7.4, 8.5], A: [8.2, 9.4] };
const SWEEP = `(()=>{const out={bad:[],weeks:{}},t0=pd(S.profile.start).getTime()+12*36e5;
 const chk=(v,ctx,lab)=>{if(v==null||(typeof v==='number'&&!isFinite(v))||/undefined|NaN|null/.test(String(v)))out.bad.push(ctx.concat([lab,String(v)]))};
 for(const plan of ['full','min'])for(let w=1;w<=53;w++){let mins=0,ws=0,cs=0;const days=[];
  for(let d=0;d<7;d++){window.__bsNow=t0+((w-1)*7+d)*864e5;S.profile.weekPlan=plan;const t=TODAY(),dp=dayPlan(t),i=info(dp.m,dp.p,dp.row),ctx=[plan,w,d];
   chk(i.t,ctx,'title');chk(i.s,ctx,'sub');chk(i.min,ctx,'min');chk(i.day,ctx,'day');if(!(i.min>=10&&i.min<=80))out.bad.push(ctx.concat(['minutes out of range',i.min]));mins+=i.min;let ex=null;
   if(dp.m.k==='w'){ws++;W=null;V={s:'workout',x:dp.m.x};chk(workout(),ctx,'workout screen');ex=W.ex.map(e=>[e.n,e.sc,e.sets.length]);
    W.ex.forEach(e=>{chk(e.n,ctx,'name');chk(e.sc,ctx,'scheme');if(!/^\\d+(–\\d+)? × \\d|^\\d+ min$/.test(e.sc))out.bad.push(ctx.concat(['bad scheme',e.sc]));if(e.log&&(e.sets.length<1||e.sets.length>5))out.bad.push(ctx.concat(['set rows',e.sets.length]))});W=null}
   else if(dp.m.k!=='rest'){cs++;N=null;V={s:'cardio'};chk(cardio(),ctx,'cardio screen');N=null}
   V={s:'today'};days.push({k:dp.m.k,x:dp.m.x||'',min:i.min,rng:i.rng||null,sub:i.s,ex})}
  if(plan==='full')out.weeks[w]={mins,ws,cs,days};else out.weeks['m'+w]={ws,cs,mins,pattern:days.map(x=>x.k+x.x).join(',')}}
 S.profile.weekPlan='full';return JSON.stringify(out)})()`;

(async () => {
  // ---------- 1 and 2: the full matrix ----------
  let app = await open({ equip: 'gym' }); let combos = 0; const hours = { F: [], S: [], A: [] }, hoursMin = { F: [], S: [], A: [] };
  for (const s of 'FSA') for (const c of 'FSA') for (const eq of ['gym', 'db', 'home', 'bw']) {
    await app.ev(`S.profile.level={s:'${s}',c:'${c}'};S.profile.equip='${eq}';S.profile.trans={};S.profile.intOK=false;W=null`);
    const r = JSON.parse(await app.ev(SWEEP)); combos++;
    assert.deepStrictEqual(r.bad.slice(0, 5), [], `problems at strength ${s}, cardio ${c}, ${eq}`);
    for (let w = 1; w <= 53; w++) {
      const wk = r.weeks[w], tag = `strength ${s} cardio ${c} ${eq} week ${w}: `, ww = Math.min(w, 53);
      assert.strictEqual(r.weeks['m' + w].pattern, 'wA,z2,rest,rest,wB,z2long,rest', tag + 'Minimum week pattern');
      if (s !== 'A') {
        const e = LIFT[s](ww); assert.strictEqual(wk.ws, e[0], tag + 'strength sessions a week');
        const A = wk.days.find(d => d.x === 'A').ex, B = wk.days.find(d => d.x === 'B').ex, reps = eq === 'gym' ? e[2] : '8–15';
        assert.ok(A[0][1].startsWith(e[1] + ' × ' + reps), tag + 'hinge scheme: ' + A[0][1]); assert.strictEqual(A[0][2], e[1], tag + 'logged set rows');
        assert.ok(B[0][1].startsWith(e[1] + ' × ' + reps), tag + 'push scheme: ' + B[0][1]);
        if (LITE(ww)) assert.ok(/lighter week/.test(A[0][1]), tag + 'lighter week label');
        const names = A.map(x => x[0]).concat(B.map(x => x[0]));
        if (s === 'F') { assert.strictEqual(A.length, 4, tag + 'Foundation workout A has 4 exercises'); assert.ok(!names.some(n => /overhead|press$|shrug|Y-raise|neck extension|Hand-resisted|Pike/i.test(n) && !/floor press|Bench press/i.test(n)), tag + 'left-out exercises: ' + names.join(', ')); assert.ok(names.includes('Sit-to-stand or goblet squat'), tag + 'sit-to-stand'); }
        else assert.strictEqual(A.length, 7, tag + 'Standard workout A has 7 exercises');
      } else assert.strictEqual(wk.ws, 3, tag + 'Advanced has 3 strength sessions');
      if (c !== 'A') {
        const e = CARDIO[c](ww), d = wk.days, tue = d[1], thu = d[3], sat = d[5], show = x => x.k === 'int' ? 'int ' + parseInt(x.sub) : (x.rng || x.min);
        assert.strictEqual(String(show(tue)), String(e[0]), tag + 'Tuesday cardio'); assert.strictEqual(String(show(sat)), String(e[2]), tag + 'Saturday cardio');
        if (!(s === 'F' && ww <= 13 && false)) assert.strictEqual(String(show(thu)), String(e[1]), tag + 'Thursday cardio');
        if (c === 'F') assert.ok(!d.some(x => x.k === 'int'), tag + 'no intervals at Foundation unless switched on');
        assert.ok(!d.some(x => /hold/.test(x.sub) && x.k === 'int'), tag + 'no breath-hold walks below Advanced');
      }
      if (s === c && eq === 'gym' && w <= 52) { hours[s].push((wk.mins + 36 * 7) / 60); hoursMin[s].push((r.weeks['m' + w].mins + 36 * 7) / 60); }
    }
  }
  for (const k of 'FSA') { const lo = Math.min(...hours[k]), hi = Math.max(...hours[k]); assert.ok(lo >= HOURS[k][0] && hi <= HOURS[k][1], `weekly hours for ${k}: ${lo.toFixed(1)} to ${hi.toFixed(1)}`); }
  for (const k of 'FSA') { const lo = Math.min(...hoursMin[k]), hi = Math.max(...hoursMin[k]); console.log('      ' + k + ' weekly hours: Full ' + Math.min(...hours[k]).toFixed(1) + ' to ' + Math.max(...hours[k]).toFixed(1) + ', Minimum ' + lo.toFixed(1) + ' to ' + hi.toFixed(1)); assert.ok(lo >= HOURS_MIN[k][0] && hi <= HOURS_MIN[k][1], `Minimum-week hours for ${k}: ${lo.toFixed(1)} to ${hi.toFixed(1)}`); }
  const avg = (k, a, b) => (hours[k].slice(a - 1, b).reduce((x, y) => x + y, 0) / (b - a + 1)).toFixed(1);
  ok(combos + ' combinations of strength level, cardio level and equipment × 53 weeks × full and minimum weeks: every session resolves, no blanks, valid sets and reps');
  ok('Foundation and Standard match the plan document for sessions, sets, reps, exercise list and cardio minutes');
  console.log('      weekly hours (Awaken, Build, Reclaim, Thrive):', 'FSA'.split('').map(k => ({ F: 'Foundation', S: 'Standard', A: 'Advanced' }[k] + ' ' + [avg(k, 1, 13), avg(k, 14, 26), avg(k, 27, 39), avg(k, 40, 52)].join(', '))).join(' | '));

  // ---------- 3: airway and breathing do not depend on level ----------
  const core = `JSON.stringify([myMoves(dayPlan(TODAY()).p).map(m=>[m.k,m.reps,m.hold]),emstSets(),S.imtLevel])`;
  for (const day of [3, 40, 200, 330]) { await app.setDay(day); const seen = new Set(); for (const l of 'FSA') { await app.ev(`S.profile.level={s:'${l}',c:'${l}'}`); seen.add(await app.ev(core)); } assert.strictEqual(seen.size, 1, 'airway or breathing work changed with level on day ' + day); }
  ok('the tongue and throat routine, breathing-out sets and trainer level are identical at every level');

  // cardio activity text at every level
  await app.setDay(8); for (const l of 'FSA') for (const m of ['walk', 'bike', 'pool', 'machine', 'seated']) { await app.ev(`S.profile.level={s:'${l}',c:'${l}'};S.profile.cardioMode='${m}';N=null;go('cardio')`); const t = await text(app); has(t, 'Your choice:'); hasnt(t, 'undefined'); }
  ok('all five cardio activities display at every level');
  assert.deepStrictEqual(app.errors, []); await app.close();

  // ---------- 4a: a new user ----------
  app = await open(null, null, { rawState: '' });
  for (const [n, v] of [['path', 'snorer'], ['quick', 'no'], ['equip', 'db'], ['imtq', 'yes'], ['src', 'snorelab']]) await app.page.evaluate(([n, v]) => { const e = document.querySelector(`input[name=${n}][value=${v}]`); if (e) e.click(); }, [n, v]);
  await app.page.click('[data-act=setup][data-v=go]'); await app.page.waitForTimeout(200);
  assert.deepStrictEqual(await app.ev('[S.profile.level,S.profile.levelNew,S.v]'), [{ s: 'F', c: 'F' }, true, 3]);
  let t = await text(app); has(t, 'Set your training level'); has(t, 'Training level: FOUNDATION'); await shot(app, 'level-new-user-today');
  await app.page.click('[data-act=ck][data-v=screen]'); t = await text(app); has(t, 'heart condition'); has(t, 'not a medical clearance');
  await app.ev("Object.assign(CKD,{heart:'no',chest:'no',dizzy:'no',bp:'no',breath:'no',joint:'no',recent:'no',lung:'no',sugar:'no',limit:'no'})");
  await app.page.click('[data-act=cksave]'); t = await text(app); has(t, 'No concerns identified'); has(t, 'Next: fitness check');
  await app.page.click('[data-act=ck][data-v=fitness]'); t = await text(app); has(t, 'Strength training in the last 6 months'); has(t, 'How many hours a week');
  await app.ev("Object.assign(CKD,{days:'1',lift:'some',away:'mid',push:'10',plank:'35',walk:'no',steady:'no',sore:'day',limits:'no',hours:'mid'})");
  await app.page.click('[data-act=cksave]'); t = await text(app); has(t, 'Recommended training level: Standard strength, Foundation cardio');
  assert.deepStrictEqual(await app.ev('[S.profile.level,S.profile.levelNew,S.levelLog.map(l=>l.k+l.from+l.to+":"+l.why)]'), [{ s: 'S', c: 'F' }, false, ['sFS:starting assessment', 'cFF:starting assessment']]);
  await app.ev("go('today')"); t = await text(app); has(t, 'Training level: strength STANDARD · cardio FOUNDATION'); hasnt(t, 'Set your training level');
  ok('a new user starts on Foundation, takes the health check and fitness check, and gets separate strength and cardio levels with reasons');
  // recommendation rules
  const rec = a => app.ev('JSON.stringify(recommend(' + JSON.stringify(a) + '))').then(JSON.parse);
  const top = { days: '3', lift: 'reg', away: 'now', push: '20', plank: '70', walk: 'yes', steady: 'yes', sore: 'day' };
  assert.deepStrictEqual((await rec(top)).s + (await rec(top)).c, 'AA');
  assert.deepStrictEqual((r => r.s + r.c)(await rec(Object.assign({}, top, { sore: 'days' }))), 'SS', 'slow recovery caps one level lower');
  assert.deepStrictEqual((r => r.s + r.c)(await rec(Object.assign({}, top, { away: 'long' }))), 'SS', 'a long break caps one level lower');
  assert.deepStrictEqual((r => r.s + r.c)(await rec({})), 'FF', 'missing answers give Foundation');
  assert.deepStrictEqual((r => r.s + r.c)(await rec({ lift: 'reg', push: '20', plank: '70', walk: 'no' })), 'AF', 'a strong lifter with poor cardio gets Advanced strength and Foundation cardio');
  ok('recommendation rules: transparent, cautious with missing answers, and strength and cardio judged separately');
  assert.deepStrictEqual(app.errors, []); await app.close();

  // ---------- 4b: an existing user changes level ----------
  app = await open({ equip: 'gym', path: 'retest' });
  await at(app, 9 * 7); t = await text(app);                               // week 10, Monday
  has(t, 'Three training levels are here'); has(t, 'Training level: ADVANCED'); await shot(app, 'level-existing-user-today');
  await app.ev("go('settings')"); t = await text(app); has(t, 'Training level: Advanced');
  await app.page.click('[data-act=go][data-v=level]'); t = await text(app);
  for (const x of ['Foundation', 'Start where you are.', 'Standard', 'Build on what you have.', 'Advanced', 'Challenge your capabilities.', 'What stays the same', 'breathing-trainer level', 'No level is better than another']) has(t, x);
  await shot(app, 'level-screen', true);
  await app.page.click('[data-act=lvset][data-v="s:S"]'); await app.page.waitForTimeout(100);
  assert.deepStrictEqual(await app.ev('[S.profile.level.s,S.profile.trans.s||null,S.levelLog.length,S.levelLog[0].why]'), ['S', null, 1, 'chosen']); ok('moving down is immediate, with no questions');
  await app.ev("go('workout',{x:'A'})"); t = await text(app); has(t, '3 × 8–10'); has(t, 'stop each set with 2–3 reps left'); has(t, 'Week 10 · Progression · Standard'); await shot(app, 'level-standard-workout');
  await app.page.click('[data-act=easier]'); assert.deepStrictEqual(await app.ev('W.ex.filter(e=>e.log&&e.n!=="Dumbbell shrugs").map(e=>e.sets.length)'), [2, 2, 2]); t = await text(app); has(t, 'Eased for today'); ok('“Make today easier” drops a set from each lift for that session');
  await app.ev("W=null;go('level')"); await app.page.click('[data-act=lvset][data-v="s:A"]'); t = await text(app); has(t, 'Moving up to Advanced strength'); has(t, 'about four weeks, in two steps');
  await app.page.click('[data-act=lvup]'); assert.strictEqual(await app.ev('S.profile.level.s'), 'S', 'moving up without the readiness ticks must not change the level');
  for (let i = 0; i < 4; i++) await app.page.check('#rd' + i);
  await app.page.click('[data-act=lvup]'); assert.deepStrictEqual(await app.ev('[S.profile.level.s,S.profile.trans.s.from,S.profile.trans.s.e2,S.levelLog[1].why]'), ['A', 'S', '2026-04-05', 'readiness check']);
  await app.ev("W=null;go('workout',{x:'A'})"); t = await text(app); has(t, '3 × 8–10'); has(t, 'step 1 of 2'); hasnt(t, '4–6');
  await at(app, 9 * 7 + 14); await app.ev("W=null;go('workout',{x:dayPlan(TODAY()).m.x})"); t = await text(app); has(t, '3 × 4–6, add small loads'); has(t, 'step 2 of 2'); hasnt(t, '4–5 × 4–6');
  await at(app, 9 * 7 + 28); await app.ev("W=null;go('workout',{x:dayPlan(TODAY()).m.x})"); t = await text(app); has(t, '4–5 × 4–6');
  ok('moving up needs the readiness check, then two fortnight steps (new exercise list, then new reps) before the full prescription');
  // completed sessions keep the scheme they were done at
  await app.ev("W=null;go('workout',{x:'A'})"); await app.page.click('[data-act=finish]');
  assert.ok(/4–5 × 4–6/.test(await app.ev('S.sessions[S.sessions.length-1].ex[0].sc'))); await app.ev("S.profile.level.s='F';W=null");
  assert.ok(/4–5 × 4–6/.test(await app.ev('S.sessions[S.sessions.length-1].ex[0].sc'))); ok('a completed session keeps the prescription it was done at when the level changes later');

  await app.ev("S.profile.level={s:'A',c:'A'};S.profile.trans={};W=null"); // health screening has its own suite: tests/check-safety.js

  // Foundation: two sessions in Awaken, optional gentle intervals from week 14
  await app.ev("S.profile.level={s:'F',c:'F'};W=null"); await app.setDay(5 * 7);
  assert.strictEqual(await app.ev("[0,1,2,3,4,5,6].map(d=>{window.__bsNow+=d?864e5:0;return dayPlan(TODAY()).m.k}).join()"), 'w,z2,rest,z2,w,z2long,rest');
  await at(app, 19 * 7 + 3); assert.strictEqual(await app.ev('dayPlan(TODAY()).m.k'), 'z2'); await app.ev("go('level')"); t = await text(app); has(t, 'Add gentle intervals on Thursdays'); has(t, 'Include overhead press');
  await app.page.check('#lvint'); assert.strictEqual(await app.ev('dayPlan(TODAY()).m.k'), 'int');
  await app.ev("N=null;go('cardio')"); t = await text(app); has(t, '4 rounds of 30 s brisk and 2 min easy'); await app.ev("N.ph='holds';render()"); t = await text(app); has(t, 'Intervals done'); hasnt(t, 'Breath-hold');
  await app.ev("go('level')"); await app.page.check('#lvover'); await app.ev("W=null;go('workout',{x:'A'})"); t = await text(app); has(t, 'Standing overhead press');
  ok('Foundation: two strength sessions a week in Awaken, gentle intervals only when switched on, no breath-hold walks, and left-out lifts can be added back');
  await app.ev("go('report')"); assert.ok((await app.page.inputValue('#copytext')).includes('training level Foundation'));
  for (const w of [1, 14, 27, 40, 52, 60]) { await at(app, (w - 1) * 7 + 2); for (const tb of ['plan', 'log', 'progress', 'retest', 'today', 'day', 'level', 'settings']) await app.ev("go('" + tb + "')"); await app.ev("go('stage',{k:'reclaim'})"); }
  assert.deepStrictEqual(app.errors, []); await app.close(); ok('every screen opens without errors at Foundation across all stages');

  // legacy fallback ignores levels
  app = await open({ equip: 'gym' }, null, { year52: false }); await app.ev("S.profile.level={s:'F',c:'F'}");
  assert.strictEqual(await app.ev('lvOf("s")+lvOf("c")'), 'AA'); await app.close(); ok('the original 24-week fallback ignores levels');
  console.log('PASS: training levels');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
