// Training-level safety: health screening states, staged level changes and the breath-hold switch-off.
//   node tests/check-safety.js            add --shots to save screenshots into tests/shots/
// 1. Health screening: no concerns / medical assessment required / training with restrictions / participant-reported clinician advice.
// 2. Moving up a level: one level at a time, in two fortnight steps, extendable and reversible, without touching logged weights.
// 3. Breath-hold walks and the BOLT breath-hold test are not offered at any level or week, and stored results are kept.
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
const NO = { heart: 'no', chest: 'no', dizzy: 'no', bp: 'no', breath: 'no', joint: 'no', recent: 'no', lung: 'no', sugar: 'no', limit: 'no' };
const screen = async (app, a) => { await app.ev('CKD=' + JSON.stringify(Object.assign({}, NO, a)) + ";V={s:'check',k:'screen'};render()"); await app.page.click('[data-act=cksave]'); return text(app); };
const advice = async (app, kind, avoid, confirm) => {
  await app.ev("go('clearance')"); await app.page.check(`input[name=clk][value=${kind}]`);
  for (const k of ['s', 'c', 'int', 'oh', 'b']) await app.page.setChecked('#av_' + k, (avoid || []).includes(k));
  if (confirm !== false) await app.page.check('#clok'); await app.page.click('[data-act=clsave]'); await app.page.waitForTimeout(50); };
const TOP = { days: '3', lift: 'reg', away: 'now', push: '20', plank: '70', walk: 'yes', steady: 'yes', sore: 'day', limits: 'no', hours: 'hi' };
const WEEK = `[0,1,2,3,4,5,6].map(d=>{const t=addD(TODAY(),d-((pd(TODAY()).getDay()+6)%7)),p=dayPlan(t);return p.m.k}).join()`;
const dayInfo = `(()=>{const d=dayPlan(TODAY());return info(d.m,d.p,d.row)})()`;

(async () => {
  // ================= 1. health screening =================
  let app = await open({ equip: 'gym', level: { s: 'A', c: 'A' } });
  await at(app, 9 * 7);                                                           // week 10, Monday: a strength day
  let t = await screen(app, {}); has(t, 'No concerns identified'); has(t, 'not a medical clearance');
  assert.deepStrictEqual(await app.ev('[S.screen.state,flagged(),held("s"),held("c"),held("b")]'), ['clear', false, false, false, false]);
  await app.ev("go('workout',{x:'A'})"); t = await text(app); has(t, 'Trap-bar'); ok('no concerns: nothing is held and the wording is not a clearance');

  t = await screen(app, { chest: 'yes' }); has(t, 'Medical assessment needed before training'); has(t, '000'); has(t, 'strength sessions, cardio sessions, the breathing trainer');
  assert.deepStrictEqual(await app.ev('[S.screen.state,S.screen.scope,S.screen.urgent,lvRaw("s"),lvOf("s"),lvOf("c"),emstOn()]'), ['assess', ['s', 'c', 'b'], true, 'A', 'A', 'A', false]);
  assert.deepStrictEqual(await app.ev(`(i=>[i.held,i.t])(${dayInfo})`), [true, 'Strength on hold']);
  await app.ev("go('today')"); t = await text(app); has(t, 'on hold: strength, cardio, breathing trainer'); has(t, 'Medical assessment needed before you train');
  await app.ev("go('workout',{x:'A'})"); t = await text(app); has(t, 'This session is on hold'); has(t, 'call emergency services (000 in Australia)'); has(t, 'looked at promptly'); hasnt(t, 'Trap-bar'); hasnt(t, 'Foundation');
  await shot(app, 'safety-hold', true);
  await app.ev("go('day')"); await app.page.click('[data-act=main]'); t = await text(app); has(t, 'This session is on hold');
  await app.ev("go('imt')"); t = await text(app); has(t, 'This session is on hold');
  await app.ev("go('routine')"); t = await text(app); hasnt(t, 'on hold');   // airway routine carries on
  await at(app, 9 * 7 + 1); await app.ev("go('cardio')"); t = await text(app); has(t, 'This session is on hold'); assert.strictEqual(await app.ev(`${dayInfo}.t`), 'Cardio on hold');
  await at(app, 9 * 7 + 6); await app.ev("go('cardio')"); t = await text(app); has(t, 'Rest + mobility');      // a rest day is not held
  await at(app, 9 * 7); await app.ev("go('level')"); t = await text(app); has(t, 'Medical assessment needed before you train'); has(t, 'record the advice');
  await app.page.click('[data-act=lvset][data-v="s:S"]'); await app.page.click('[data-act=lvset][data-v="s:A"]'); assert.strictEqual(await app.ev('V.up||null'), null, 'no moving up while an assessment is pending');
  await app.ev("S.profile.level.s='A';S.levelLog=[]");
  ok('a “yes” holds strength, cardio and the breathing trainer outright (not at a lower level), with urgent-care wording; the airway routine and rest days carry on');

  await advice(app, 'no'); assert.deepStrictEqual(await app.ev('[S.screen.state,S.screen.out.kind,held("s")]'), ['assess', 'no', true]);
  await advice(app, 'none', [], false); assert.strictEqual(await app.ev('S.screen.state'), 'assess', 'advice is not recorded without the confirmation tick');
  await advice(app, 'restr', []); assert.strictEqual(await app.ev('S.screen.state'), 'assess', 'restrictions need at least one item');
  await advice(app, 'none'); t = await text(app);
  assert.deepStrictEqual(await app.ev('[S.screen.state,S.screen.reassess,S.screen.prev,S.profile.level,held("s"),held("c"),held("b"),S.levelLog.map(l=>l.k+l.from+l.to+":"+l.why)]'),
    ['approved', true, { s: 'A', c: 'A' }, { s: 'F', c: 'F' }, false, false, false, ['sAF:restart after health check', 'cAF:restart after health check']]);
  has(t, 'You reported that your clinician advised no restrictions'); has(t, 'restart at Foundation'); has(t, 'not restored automatically'); has(t, 'can’t verify it'); await shot(app, 'safety-approved', true);
  assert.strictEqual(await app.ev('S.profile.trans.s||null'), null);
  await app.page.click('[data-act=lvset][data-v="s:S"]'); assert.strictEqual(await app.ev('V.up||null'), null, 'no moving up before the fitness check is redone');
  await app.ev('CKD=' + JSON.stringify(TOP) + ";V={s:'check',k:'fitness'};render()"); await app.page.click('[data-act=cksave]'); t = await text(app);
  has(t, 'Recommended training level: Foundation');
  assert.deepStrictEqual(await app.ev('[S.profile.level,S.screen.reassess,S.profile.rec.s+S.profile.rec.c]'), [{ s: 'F', c: 'F' }, false, 'FF']);
  await app.ev("go('level')"); await app.page.click('[data-act=lvset][data-v="s:A"]'); assert.deepStrictEqual(await app.ev('[V.up.to,V.up.far]'), ['S', true]); t = await text(app); has(t, 'One level at a time: Standard comes first');
  await app.ev('V.up=null');
  ok('participant-reported clinician advice: needs a confirmation, restarts both levels at Foundation, never restores the earlier level, and requires a fresh fitness check before moving up one level at a time');

  t = await screen(app, { chest: 'yes' }); has(t, 'Nothing new since your clinician’s advice'); assert.deepStrictEqual(await app.ev('[S.screen.state,held("s")]'), ['approved', false]);
  t = await screen(app, { chest: 'yes', dizzy: 'yes' }); has(t, 'Medical assessment needed'); assert.deepStrictEqual(await app.ev('[S.screen.state,held("s")]'), ['assess', true]);
  ok('repeating the same answers does not hold the plan again; a new “yes” does');

  // restrictions
  await advice(app, 'restr', ['int', 'oh']); assert.deepStrictEqual(await app.ev('[S.screen.state,S.screen.out.avoid,held("s"),held("c")]'), ['restricted', ['int', 'oh'], false, false]);
  await app.ev("S.screen.reassess=false;S.profile.level={s:'A',c:'A'};S.profile.trans={};W=null"); await at(app, 11 * 7 + 3);      // week 12, Thursday
  assert.strictEqual(await app.ev('dayPlan(TODAY()).m.k'), 'z2', 'intervals are left out when the clinician advised against them');
  await at(app, 11 * 7); await app.ev("go('workout',{x:dayPlan(TODAY()).m.x})"); await app.ev("W=null;go('workout',{x:'A'})"); t = await text(app); hasnt(t, 'overhead press'); hasnt(t, 'shrugs'); has(t, 'Trap-bar');
  await app.ev("go('level')"); t = await text(app); has(t, 'Training with restrictions'); has(t, 'intervals and other hard efforts'); await shot(app, 'safety-restricted', true);
  await advice(app, 'restr', ['s', 'b']); await app.ev("go('workout',{x:'A'})"); t = await text(app); has(t, 'Left out on your clinician’s advice'); assert.deepStrictEqual(await app.ev('[held("s"),held("b"),held("c"),emstOn()]'), [true, true, false, false]);
  ok('training with restrictions: the items the participant was told to avoid are left out, the rest of the plan runs');

  // joint-only answers hold strength and intervals, not steady cardio or the breathing trainer
  await app.ev("S.screen=null;S.profile.level={s:'A',c:'A'};W=null"); t = await screen(app, { joint: 'yes' }); has(t, 'easy steady cardio');
  assert.deepStrictEqual(await app.ev('[S.screen.scope,S.screen.urgent,held("s"),held("c"),held("b")]'), [['s'], false, true, false, false]);
  await at(app, 11 * 7 + 3); assert.strictEqual(await app.ev('dayPlan(TODAY()).m.k'), 'z2'); await app.ev("go('cardio')"); t = await text(app); has(t, 'Zone 2 cardio');
  await advice(app, 'none'); assert.deepStrictEqual(await app.ev('S.profile.level'), { s: 'F', c: 'A' }); ok('a joint-only “yes” holds strength and intervals only, and only strength restarts at Foundation');
  for (const w of [1, 14, 27, 40, 52]) { await at(app, (w - 1) * 7 + 2); for (const tb of ['plan', 'log', 'progress', 'retest', 'today', 'day', 'level', 'settings', 'clearance', 'report']) await app.ev("go('" + tb + "')"); }
  assert.deepStrictEqual(app.errors, []); await app.close();

  // saved data from the first release of levels
  const base = { v: 3, at: 1, health: null, nights: {}, done: {}, sessions: [{ date: '2026-02-02', type: 'WA', ex: [{ n: 'Trap-bar deadlift', sc: '4 × 6–8', sets: [{ kg: '100', reps: '8' }] }] }], weekly: { w3: { bolt: 22, neck: 42 } }, imtLevel: 4, imtEasy: 0, goals: [], reviews: {}, levelLog: [], rx: 2,
    checks: { screen: [{ date: '2026-02-01', a: Object.assign({}, NO, { heart: 'yes' }) }] }, profile: { start: '2026-01-05', scoreSrc: 'snorelab', path: 'snorer', equip: 'gym', imt: 'yes', level: { s: 'A', c: 'S' }, trans: { s: { from: 'S', until: '2026-03-20' } } } };
  for (const [old, want] of [[{ date: '2026-02-01', flag: true, gpOk: false }, ['assess', true, 'A', 'S']], [{ date: '2026-02-01', flag: true, gpOk: true, gpDate: '2026-02-10' }, ['approved', false, 'A', 'S']], [{ date: '2026-02-01', flag: false, gpOk: false }, ['clear', false, 'A', 'S']]]) {
    app = await open(null, null, { rawState: JSON.stringify(Object.assign({}, base, { screen: old })) }); await at(app, 9 * 7);
    assert.deepStrictEqual(await app.ev('[S.screen.state,held("s"),lvRaw("s"),lvRaw("c")]'), want, 'upgrade of ' + JSON.stringify(old));
    assert.deepStrictEqual(await app.ev('[S.sessions[0].ex[0].sets[0].kg,S.weekly.w3.bolt,S.profile.trans.s.e2,trPh("s")]'), ['100', 22, '2026-03-20', 2]);
    for (const tb of ['today', 'day', 'level', 'plan', 'log', 'progress']) await app.ev("go('" + tb + "')"); assert.deepStrictEqual(app.errors, []); await app.close(); }
  ok('saved health checks and step-ups from the earlier version upgrade into the new states with levels, logs and weights intact');

  // ================= 2. staged level changes =================
  app = await open({ equip: 'gym', level: { s: 'S', c: 'S' } }); await at(app, 9 * 7);       // week 10, Monday
  await app.ev(`S.sessions.push({date:'2026-03-02',type:'WA',ex:[{n:'Trap-bar deadlift',sc:'3 × 8–10',log:true,sets:[{kg:'90',reps:'10'},{kg:'90',reps:'9'}]}]})`);
  const before = await app.ev('JSON.stringify(S.sessions)');
  const up = async k => { await app.ev("go('level')"); await app.page.click(`[data-act=lvset][data-v="${k}"]`); for (let i = 0; i < 4; i++) await app.page.check('#rd' + i); await app.page.click('[data-act=lvup]'); };
  await up('s:A'); assert.deepStrictEqual(await app.ev('[S.profile.level.s,S.profile.trans.s,trPh("s")]'), ['A', { from: 'S', to: 'A', start: '2026-03-09', e1: '2026-03-22', e2: '2026-04-05' }, 1]);
  t = await text(app); has(t, 'Stepping up from Standard: step 1 of 2'); has(t, 'Two more weeks here'); has(t, 'Back to Standard');
  await app.page.click('[data-act=lvset][data-v="s:A"]'); assert.strictEqual(await app.ev('V.up||null'), null);
  await app.ev("W=null;go('workout',{x:'A'})"); t = await text(app); has(t, 'step 1 of 2'); has(t, '3 × 8–10'); has(t, 'stop each set with 2–3 reps left'); has(t, 'Starting loads'); has(t, 'Nothing in your log is changed'); has(t, 'Chest symptoms, dizziness'); hasnt(t, '4–6'); await shot(app, 'safety-step1', true);
  assert.strictEqual(await app.ev(`${dayInfo}.s`), '7 exercises · 3 × 8–10');
  await at(app, 9 * 7 + 14); await app.ev("W=null;go('workout',{x:dayPlan(TODAY()).m.x})"); t = await text(app); has(t, 'step 2 of 2'); has(t, '3 × 4–6'); has(t, 'stop each set with 2–3 reps left'); hasnt(t, '4–5 × 4–6');
  await at(app, 9 * 7 + 28); await app.ev("W=null;go('workout',{x:dayPlan(TODAY()).m.x})"); t = await text(app); hasnt(t, 'Stepping up'); has(t, '4–5 × 4–6'); has(t, 'stop each set with 1–2 reps left');
  assert.strictEqual(await app.ev('JSON.stringify(S.sessions)'), before, 'logged sessions and weights must not change');
  ok('strength Standard → Advanced: step 1 keeps the previous sets, reps and effort; step 2 brings the new reps at the previous set count; then the full level. Logged weights untouched');

  await at(app, 9 * 7 + 3); await app.ev("go('level')"); await app.page.click('[data-act=trext][data-v=s]'); assert.deepStrictEqual(await app.ev('[S.profile.trans.s.e1,S.profile.trans.s.e2,S.profile.trans.s.ext]'), ['2026-04-05', '2026-04-19', 1]);
  await at(app, 9 * 7 + 20); assert.strictEqual(await app.ev('trPh("s")'), 1); await app.ev("go('level')"); await app.page.click('[data-act=trback][data-v=s]');
  assert.deepStrictEqual(await app.ev('[S.profile.level.s,S.profile.trans.s||null,S.levelLog[S.levelLog.length-1].why]'), ['S', null, 'went back during step-up']); ok('a step can be extended by two weeks, and going back to the previous level is immediate');

  // Foundation → Standard keeps two sessions a week in step 1
  await app.ev("S.profile.level={s:'F',c:'F'};S.profile.trans={};S.levelLog=[];W=null"); await at(app, 6 * 7);                 // week 7, Monday
  await app.ev("go('level')"); await app.page.click('[data-act=lvset][data-v="s:A"]'); assert.strictEqual(await app.ev('V.up.to'), 'S', 'Foundation cannot jump to Advanced'); await app.ev('V.up=null');
  await up('s:S'); assert.strictEqual(await app.ev(WEEK), 'w,z2,rest,z2,w,z2long,rest');
  await app.ev("W=null;go('workout',{x:'A'})"); t = await text(app); has(t, 'Standing overhead press'); has(t, '2 × 10–12'); has(t, 'stop each set with 3–4 reps left'); assert.strictEqual(await app.ev('W.ex.length'), 7);
  await app.ev("W=null;go('workout',{x:'B'})"); t = await text(app); has(t, 'Goblet squat'); hasnt(t, 'Sit-to-stand');
  await at(app, 6 * 7 + 14); assert.strictEqual(await app.ev(WEEK), 'w,z2,w,z2,w,z2long,rest'); await app.ev("W=null;go('workout',{x:dayPlan(TODAY()).m.x})"); t = await text(app); has(t, '2 × 8–10'); has(t, 'step 2 of 2');
  await at(app, 6 * 7 + 28); await app.ev("W=null;go('workout',{x:dayPlan(TODAY()).m.x})"); t = await text(app); has(t, '3 × 8–10'); has(t, 'stop each set with 2–3 reps left');
  ok('strength Foundation → Standard: one level only, new exercise list at Foundation sets and two sessions a week first, then the new reps, then the full level');

  // cardio
  const cw = `(()=>{const o=[];for(const d of [1,3,5]){const t=addD(TODAY(),d-((pd(TODAY()).getDay()+6)%7)),p=dayPlan(t),i=info(p.m,p.p,p.row);o.push(p.m.k==='int'?'int '+parseInt(i.s):String(i.rng||i.min))}return o.join()})()`;
  await app.ev("S.profile.level={s:'S',c:'F'};S.profile.trans={};W=null"); await at(app, 9 * 7); assert.strictEqual(await app.ev(cw), '25–30,25–30,35');
  await up('c:S'); assert.strictEqual(await app.ev(cw), '35,30,40', 'step 1: minutes halfway, no intervals');
  await at(app, 9 * 7 + 1); await app.ev("go('cardio')"); t = await text(app); has(t, 'Stepping up to Standard cardio: step 1 of 2');
  await at(app, 9 * 7 + 14); assert.strictEqual(await app.ev(cw), '40,int 4,45', 'step 2: new minutes, fewer rounds');
  await at(app, 9 * 7 + 17); await app.ev("N=null;go('cardio')"); t = await text(app); has(t, '4 rounds'); has(t, 'step 2 of 2');
  await at(app, 9 * 7 + 28); assert.strictEqual(await app.ev(cw), '40,int 6,45');
  await up('c:A'); const a1 = await app.ev(cw); assert.ok(/^\d+,int 6,\d+$/.test(a1), 'Standard → Advanced step 1 keeps the Standard interval rounds: ' + a1);
  await at(app, 9 * 7 + 42); assert.ok(/,int 6,/.test(await app.ev(cw))); await at(app, 9 * 7 + 56); assert.ok(/,int 8,/.test(await app.ev(cw)));
  ok('cardio steps up by duration first and intensity second: no new intervals in step 1, fewer rounds in step 2');

  // load suggestions pause during a step-up
  await app.ev("S.profile.level={s:'S',c:'S'};S.profile.trans={};S.sessions=[];W=null"); await at(app, 29 * 7);
  await app.ev("go('workout',{x:dayPlan(TODAY()).m.x})"); const first = await app.ev('[W.ex[0].n,W.ex[0].sc]');
  await app.ev(`for(const d of ['2026-07-20','2026-07-22'])S.sessions.push({date:d,type:'W',ex:[{n:${JSON.stringify(first[0])},sc:${JSON.stringify(first[1])},log:true,sets:[{kg:'80',reps:'12'},{kg:'80',reps:'12'},{kg:'80',reps:'12'}]}]});W=null;render()`);
  t = await text(app); has(t, 'Top of the range two sessions running');
  await up('s:A'); await app.ev("W=null;go('workout',{x:dayPlan(TODAY()).m.x})"); t = await text(app); hasnt(t, 'Top of the range'); has(t, 'step 1 of 2');
  ok('load suggestions are paused while a step-up is running');
  assert.deepStrictEqual(app.errors, []); await app.close();

  // ================= 3. breath-hold work is off =================
  app = await open({ equip: 'gym', level: { s: 'A', c: 'A' } });
  const sweep = `(()=>{const bad=[],t0=pd(S.profile.start).getTime()+12*36e5;for(const lv of 'FSA'){S.profile.level={s:lv,c:lv};S.profile.intOK=true;for(let n=0;n<53*7;n++){window.__bsNow=t0+n*864e5;const d=dayPlan(TODAY()),i=info(d.m,d.p,d.row);
    if(/breath-hold|holds/i.test(i.t+' '+i.s))bad.push([lv,n,i.t,i.s]);if(d.m.k==='int'){if(intRx(d.row.wk).H!==0)bad.push([lv,n,'H']);N=null;V={s:'cardio'};const h=cardio();if(/breath-hold|pinch your nose/i.test(h))bad.push([lv,n,'screen']);N.ph='holds';if(!/Intervals done/.test(cardio()))bad.push([lv,n,'end']);N=null}}}V={s:'today'};return JSON.stringify(bad.slice(0,5))})()`;
  assert.strictEqual(await app.ev(sweep), '[]'); ok('no breath-hold walk at any level in any of 53 weeks, on the plan or the interval screen');
  await app.ev("S.profile.level={s:'A',c:'A'};S.weekly.w10={bolt:25,neck:42,waist:100}"); await at(app, 9 * 7 + 3);
  assert.strictEqual(await app.ev(`${dayInfo}.t`), 'Intervals'); await app.ev("N=null;go('cardio')"); t = await text(app); has(t, 'rounds of 30 s hard'); hasnt(t, 'breath-hold');
  await app.ev("go('log')"); t = await text(app); hasnt(t, 'BOLT'); has(t, 'Neck (cm)'); assert.strictEqual(await app.page.locator('#bolt').count(), 0);
  await app.page.fill('#neck', '41.5'); await app.page.click('[data-act=saveweek]'); assert.deepStrictEqual(await app.ev('[S.weekly.w10.bolt,S.weekly.w10.neck]'), [25, 41.5]);
  await app.ev("go('progress')"); t = await text(app); hasnt(t, 'BOLT'); hasnt(t, 'breath-hold');
  ok('the BOLT breath-hold test is no longer asked for or shown, and results already saved are kept');
  assert.deepStrictEqual(app.errors, []); await app.close();
  app = await open({ equip: 'gym' }, null, { year52: false }); await at(app, 4 * 7 + 3);
  assert.deepStrictEqual(await app.ev(`[${dayInfo}.t,held("s"),flagged()]`), ['Intervals', false, false]); await app.ev("N=null;go('cardio')"); t = await text(app); hasnt(t, 'breath-hold'); await app.ev("go('log')"); t = await text(app); hasnt(t, 'BOLT');
  assert.deepStrictEqual(app.errors, []); await app.close(); ok('the original 24-week fallback also has no breath-hold work');
  console.log('PASS: training-level safety');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
