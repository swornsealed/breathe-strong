# Training-level safety and quality refinement

Status: **built on the working branch, not yet published.** Tests: `node tests/check-safety.js` plus the six earlier suites.

Nothing here has been reviewed by a clinician or an exercise professional. Section 6 lists what should be.

## 1. Health screening

Ten yes/no questions, repeated every 12 weeks and whenever the user chooses. The themes follow common adult
pre-exercise screening (heart condition, exertional chest pain, dizziness or fainting, uncontrolled blood pressure,
breathlessness on light effort, joint or back problem, recent surgery or cardiac event, asthma or lung condition,
diabetes control, any other medical limit). The wording is our own and is not a validated instrument.

| State | When | What the app does |
|---|---|---|
| **No concerns identified** (`clear`) | Every answer is no | Nothing is held. The result says it is not a medical clearance |
| **Medical assessment required** (`assess`) | Any yes | The affected sessions are **held**: they cannot be opened or marked done. They are not offered at Foundation instead. Stored levels are left untouched |
| **Training with restrictions** (`restricted`) | The user records that a clinician assessed him and advised limits | Only what he ticks is left out: strength sessions, all cardio, intervals, overhead/shrug/neck lifts, the breathing trainer |
| **Clinician advice recorded** (`approved`) | The user records that a clinician assessed him and advised no limits | Everything reopens |

- **What is held while assessment is pending.** Any yes other than the joint question: strength, cardio, intervals and the
  breathing trainer (in and out). Joint question only: strength and intervals; easy steady cardio and the breathing
  trainer stay open. Always open: the tongue and throat routine, the evening wind-down, logging.
- **Urgent-care wording.** The hold screen, the level screen, Today and the result all say: chest pain or pressure,
  fainting, or severe breathlessness that doesn't settle with rest means stop and call emergency services (000 in
  Australia). If the yes was to chest pain, dizziness or fainting, breathlessness or a recent event, the user is also told
  to book promptly rather than wait for a routine visit.
- **Participant-reported advice.** The form needs a tick that "this is what a doctor or qualified clinician told me
  after assessing me". Every screen that shows the outcome says it is the user's own record, that Breathe Strong
  cannot verify it, and that it is not a medical clearance. "Not assessed yet, or advised not to exercise" keeps the hold.
- **Restart, not restore.** When advice to train is first recorded, the affected stored levels drop to Foundation (logged
  in the level history as "restart after health check"). The earlier level is kept for the record only and is never
  restored automatically. Moving up is blocked until a fresh fitness check is taken, the recommendation from that check
  is Foundation, and from there the normal one-level-at-a-time step-up applies.
- **Repeat checks.** The same yes answers a clinician has already advised on do not put the plan back on hold. A new
  yes does.
- **Earlier saved data.** The first release stored `{flag, gpOk}`. Flagged and not confirmed becomes `assess`; flagged
  and confirmed becomes `approved` with levels left as they are; not flagged becomes `clear`. Nothing is deleted.
- **Record.** Each health check and each recorded outcome is appended to `screenLog`.

## 2. Level transitions

- Down: immediate, any time.
- Up: **one level at a time**. Foundation cannot go straight to Advanced. Needs the four readiness ticks. Not available
  while an assessment is pending, before the post-assessment fitness check, or while another step-up for the same
  track is running. "Use the recommended level" also moves up only one level.
- Staged over about four weeks, in two 14-day steps:

| | Step 1 | Step 2 | Then |
|---|---|---|---|
| Strength | New level's exercise list. Previous level's sets, reps, effort and rest. Foundation → Standard keeps two sessions a week in weeks 1–13 | New level's reps. Previous level's set count, effort and rest | Full level |
| Cardio | Minutes halfway between the two levels (nearest 5). No intervals unless the previous level already had them, and then at the previous rounds | New minutes. Interval rounds reduced: the previous level's count, or two fewer than the new level's (minimum 3) | Full level |

- Either step can be extended by two weeks, as often as wanted. "Back to (previous level)" is immediate.
- Starting resistance: for any lift that is new, a load he could lift for five or more reps beyond the target, built up
  over the next few sessions. Existing lifts keep their loads.
- Recorded weights and completed sessions are never altered. Load suggestions are paused during a step-up.
- Pain and symptom guidance is shown on every step-up session.

## 3. Breath-hold exercises

Switched off by one constant (`BH=false`) pending clinical review:
- the breath-hold walk after Advanced intervals (Advanced Thursdays are now plain intervals, same rounds);
- the BOLT breath-hold test in the weekly check, and its tile on Progress.

Stored hold counts and BOLT results are kept and still exported. The brace cue "never hold your breath for more than
one rep" stays.

## 4. Weekly training times

Strength-session estimates were too short. They now allow a 5-minute warm-up, each set with its rest, accessory work,
5 minutes of neck holds and changeover time.

| Strength session | Before | Now |
|---|---|---|
| Foundation, 1 / 2 / 3 sets | 25 / 30 / 35 | 25 / 30 / 40 |
| Standard, 2 / 3 / 4 sets | 40 / 45 / 50 | 45 / 55 / 60 |
| Advanced, 3 / 4 / 4–5 sets | 50 / 55 / 60 | 60 / 70 / 80 |

Weekly hours, everything included (36 minutes a day of airway, breathing and evening work is about 4.2 hours of it):

| Level | Full week, range over the year | Minimum week |
|---|---|---|
| Foundation | 6.4 to 8.4 | 6.4 to 7.6 |
| Standard | 8.1 to 9.4 | 7.5 to 8.4 |
| Advanced | 9.2 to 10.7 | 8.2 to 9.4 |

The website said 6–8, 8–9 and 9–10. It now says about 6½ to 8½, 8 to 9½ and 9 to 11, and gives the Minimum-week figure.

## 5. Tests

`tests/check-safety.js` (new) and updated `check-levels.js`, `check-plan.js`, `check-year.js`. The plan snapshot is
unchanged except for the one intended difference: an Advanced interval day no longer lists breath-hold walks.

## 6. For professional review

| # | Item |
|---|---|
| S1 | The ten screening questions and whether a validated tool should replace them |
| S2 | The scope rule: which answers hold which sessions, and the joint-only exception |
| S3 | Whether the breathing trainer should be held on every non-joint yes |
| S4 | Urgent-care wording and the list of answers treated as prompt |
| S5 | Relying on participant-reported advice, and whether written clearance should be asked for |
| S6 | Restarting at Foundation after assessment: right for every case? |
| S7 | Carrying earlier advice forward when the same answers recur at the 12-week repeat |
| S8 | Step-up rules: two 14-day steps, the cardio halfway rule, the reduced interval rounds |
| S9 | Starting-resistance instruction (five or more reps in reserve on new lifts) |
| S10 | Breath-hold walks and the BOLT test: reinstate, modify or remove for good |
| S11 | The session-length estimates behind the weekly hours |
