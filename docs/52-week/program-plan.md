# Breathe Strong: 52-week program plan

Status: **specification accepted by the owner; build in progress on a branch. The live app is unchanged.**

### Owner decisions recorded
- **Phase labels stay as they are.** Foundation, Build, Strength and Progression keep their names and the
  current layout is kept. The rename suggested in this document is withdrawn.
- **Clinical review is deferred to a later stage** by the owner's decision. Section 4 stays as the list
  to work through. The safeguards built into the app stay regardless: it never tells a user to
  reduce or stop treatment, and it points to a clinician for reassessment.
- **The later stages are also about keeping what has been gained.** Strength and fitness fall away
  quickly when training stops, more so with age, so Reclaim and Thrive are framed as continued
  incremental progress and protection of earlier gains.

### Build progress
- Stage 0 done: test harness and a snapshot of today's plan for weeks 1 to 30 (1,470 day plans).
- Stage 1 done: stage structure and week table for weeks 1 to 24; snapshot still matches exactly.
- Stage 2 done: saved data moves to version 2 by adding fields only (goals, reviews). An untouched
  copy of the version 1 data is kept on the device. 11 upgrade checks pass.
- Stage 3 done: weeks 25 to 52 are in the app, **switched off by default**. With the switch off the
  app behaves exactly as before. With it on, all 28 new weeks match section 2.4.
- Stage 4 done (shown only with the switch on): "Week N of 52" with the stage name, a four-stage bar
  on Plan, a screen per stage listing its 13 weeks, the calendar and milestones extended to the full
  year, and softer wording at week 24.
- Stage 5 done (shown only with the switch on): cardio activity choice in Settings (walking, bike,
  pool, cross-trainer or rower, seated or arm option) with split sessions, the Standard or Minimum
  week choice from week 44, recovery guidance on Plan and in workouts, lighter-week notices, and
  load suggestions from week 27 that leave the decision to the user.
- One fix that applies with the switch off as well: a user past week 24 now sees "Week 46", not
  "Week 46 of 24".
- Stage 6 done (switch on only): goals in the user's own words, a baseline rating, stage reviews at
  weeks 13, 26, 39 and 52 built from his own records, and a nightly sleep-quality rating. Every review
  carries the limits wording and the keep-using-your-treatment notice.
- Stage 7 done (switch on only): "Your year, stage by stage" with each stage's numbers and saved
  reviews, and a history-by-stage section in the clinician summary.
- Remaining before release: clinical review (section 4, deferred by the owner), then switching the
  new weeks on (stage 9), then the website update (stage 10). Billing is separate.
- Known gaps: the CSV export does not yet include the sleep-quality column, and there are no drawings
  for the non-walking cardio options.

Contents
1. [Audit of the existing program](#1-audit-of-the-existing-program)
2. [52-week program specification](#2-52-week-program-specification)
3. [Proposed changes to the application](#3-proposed-changes-to-the-application)
4. [Clinical review requirements](#4-clinical-review-requirements)
5. [Evidence by component](#5-evidence-by-component)
6. [Development and testing plan](#6-development-and-testing-plan)

---

## 1. Audit of the existing program

### 1.1 How weeks and phases work today
- **Weeks are not stored.** The app stores only a start date (`profile.start`). The week number is
  calculated each time as `floor(days since start / 7) + 1`.
- **Phases are a rule, not content.** `phaseOf(week)` returns Foundation (weeks 1–2), Build (3–5),
  Strength (6–8), Progression (9–24) and **Maintenance (week 25 onward)**.
- **The app does not stop at week 24.** From week 25 it keeps serving the Strength-phase sessions,
  labelled "Maintenance", indefinitely. The calendar dots and milestones stop at day 168.
- The existing phases do **not** line up with the new stages. Awaken (weeks 1–13) would span
  Foundation, Build, Strength and the first five weeks of Progression.
- There is a naming clash: the existing weeks 3–5 phase is called "Build", and so is the new
  stage for weeks 14–26.

### 1.2 Weekly schedule (fixed to weekdays)
| Day | Main session | Minutes |
|---|---|---|
| Mon | Strength | 50 |
| Tue | Steady "Zone 2" cardio | 30 / 40 / 45 by phase (20 in weeks 1–2 if the fitness check says he cannot yet walk 30 min) |
| Wed | Strength | 50 |
| Thu | Steady cardio in Foundation; intervals plus breath-hold walk afterwards | 30 |
| Fri | Strength | 50 |
| Sat | Long easy walk, optional loaded backpack (5–10 kg) | 45 |
| Sun | Rest and mobility (foam roller, wall angels) | 15 |

Strength alternates: odd weeks A · B · A, even weeks B · A · B.
Every day, including Sunday: breathing trainer (8 min), airway routine (12 min), evening
wind-down (15 min), morning log (1 min).

### 1.3 Prescription by phase, weeks 1–24
| Weeks | Phase | Main lifts | Carries / plank | Steady cardio | Thursday | Airway routine | Breathing trainer |
|---|---|---|---|---|---|---|---|
| 1–2 | Foundation | 3 × 10–12 | 3 × 30 m / 3 × 30 s | 30 min | Steady 30 | Level 1 (20 reps; head lift 3 × 30 s; slow exhale 2 min) | 5 × 6 in, 3 × 5 out |
| 3–5 | Build | 4 × 6–8 | 3 × 40 m / 3 × 40 s | 40 min | Intervals 6 × 30 s hard / 90 s easy, then 5 breath-hold walks | Level 1 (20 reps; head lift 3 × 60 s; slow exhale 2 min) | 5 × 6 in, 5 × 5 out |
| 6–8 | Strength | 4–5 × 4–6 | 4 × 40 m / 3 × 45 s | 45 min | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 5 × 6 in, 5 × 5 out |
| 9–24 | Progression | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 min | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 5 × 6 in, 5 × 5 out |

Home equipment (dumbbells, household, bodyweight): logged lifts become "N × 8–15, slow lowering",
where N is the set count for the phase.

### 1.4 Exercise inventory
**Workout A: pull and press**
| Exercise (gym) | Dumbbells | Household | Bodyweight | Sets |
|---|---|---|---|---|
| Trap-bar deadlift | Dumbbell Romanian deadlift | Water-jug or backpack deadlift | Single-leg Romanian deadlift | Phase scheme |
| Standing overhead press | Standing dumbbell press | Water-jug press | Pike push-up | Phase scheme |
| Barbell or dumbbell row | One-arm dumbbell row | Backpack or jug row | Table row | Phase scheme |
| Farmer's carry | Dumbbell farmer's carry | Water-jug carry | Loaded backpack walk | 3 × 30 m → 3 × 40 m → 4 × 40 m |
| Dumbbell shrugs | Dumbbell shrugs | Jug shrugs | Prone Y-raises | 3 × 12 |
| Band neck extension + flexion | Hand-resisted neck work | same | same | 2 × 15 each |
| Neck holds + posture | 4-way neck holds, roller, wall angels | same | same | 5 min |

**Workout B: push and pull**
| Exercise (gym) | Dumbbells | Household | Bodyweight | Sets |
|---|---|---|---|---|
| Bench press or weighted push-up | Dumbbell floor press | Push-ups | Push-ups | Phase scheme |
| Chin-ups or lat pulldown | Chest-supported dumbbell row | Table row | Table row | 3 × 8–10 → 4 × 6–8 → 4–5 × 4–6 |
| Goblet squat | Dumbbell goblet squat | Water-jug goblet squat | Split squat | 3 × 10–12 → 4 × 8 → 4 × 6–8 |
| Suitcase carry | One-arm dumbbell carry | One-arm jug carry | Side plank (3 × 30 / 40 / 45 s a side) | 3 × 30 m → 3 × 40 m → 4 × 40 m a side |
| Face pulls | Bent-over reverse fly | Prone T-raises | Prone T-raises | 3 × 15 |
| Plank with chin tuck | same | same | same | 3 × 30 s → 40 s → 45 s |
| Neck holds + posture | same | same | same | 5 min |

**Airway routine (10 moves, daily)**: tongue press, tongue slide, tongue push-down, spoon push,
tongue reach, soft-palate "Ahh", cheek press, Shaker head lift, chin tuck press, pursed-lip exhale.
- Level 1 (weeks 1–5): 20 / 20 / 20 / 10 / 10 / 10 / 20 reps, head lift 3 holds, chin tuck 10, exhale 2 min.
- Level 2 (week 6 on): 40 / 40 / 40 / 15 / 15 / 15 / 30 reps, chin tuck 15, exhale 3 min.
- Personalisation already built: hold times set from the tongue-hold and spoon-push checks; extra
  reps on palate or tongue-base moves from the snore-source check.
- A 13-minute singing session can replace the routine (seven vocal drills).

**Breathing trainer (daily)**: 30 breaths in as 5 sets of 6 with 60 s rests, at a trainer level of
1–12. The app suggests moving up a level after two sessions in a row rated "easy". Then breathing
out: 3 sets of 5 hard breaths in Foundation, 5 sets of 5 after, 30 s rests. Without a trainer:
a drinking straw (in) and pursed lips (out) as a stopgap.

**Evening wind-down**: walk 10–20 min after dinner; calf raises 2 × 20; moved every hour today;
last (alcoholic) drink 3+ hours before bed or none; optional bedtime neck measurement.

### 1.5 Progression and recovery rules today
- Lifts: "stop with 1–2 reps left". The app shows "Last time: kg × reps" but **never tells the user
  when to add load**. "Add small loads" in Progression is a label only.
- Breathing trainer: the only automatic progression prompt in the app (two easy sessions).
- Fitness check adjustments: incline push-ups if under 8 push-ups; 20 s planks if under 30 s;
  20-minute walks in weeks 1–2.
- Recovery: one rest day a week. **There are no lighter weeks anywhere in the 24 weeks.**
- Cardio alternatives: "brisk walk, bike or rower" is mentioned in help text only. There is no
  setting for it and no split-session option.

### 1.6 Tracking features
| Feature | What is stored | Entry |
|---|---|---|
| Nightly log | Snore score (from a separate recorder app), partner rating, daytime tiredness, drinks timing, tags, CPAP hours / events per hour / mask seal / mask-off count, resting heart rate, breathing rate, blood oxygen, breathing disturbances, morning neck size | Manual |
| Session completion | Per day: breathing trainer, airway routine, main session, evening | Tick or finish |
| Strength log | Per session: every set's kg and reps | Manual |
| Weekly check | Breath-hold time, neck, waist, events per hour, trainer level | Manual |
| Checks (eight; seven on the CPAP path) | Sleep risk, daytime energy, nose, snore source, tongue hold, tongue forward, fitness, body measures. Five repeat every 28 days | Manual |
| Health record | Diagnosis, treatment, pressure, sleep studies, appointments, questions | Manual |
| Outputs | Weekly snore chart against baseline, insights and alerts, triggers, clinician summary, CSV copy, backup file | Automatic |

Not tracked today: a sleep-quality rating, functional goals, quality of life, cardio distance or
pace, and stage-level summaries.

### 1.7 Data storage and whether progress can be preserved
- One JSON object: `{v:1, at, profile, nights, done, sessions, weekly, checks, health, pm, imtLevel, imtEasy}`.
- Saved to the browser (`bs-state`) and, with Google sign-in, to one Firestore document per user.
- Everything is keyed by calendar date, not by week number.
- **Result: existing progress can be fully preserved.** Extending the program needs no change to
  any stored record. A user in week 10 today stays in week 10, with the same history.
- The object carries a version field (`v:1`) that is never checked. There is no migration code yet.

### 1.8 Illustrations available for reuse
- 20 exercise drawings, two frames each: chin-up, face pull, farmer's carry, goblet squat, hinge,
  neck, pike push-up, plank, press, prone raise, push-up, reverse fly, row, shrug, side plank,
  single-leg deadlift, split squat, suitcase carry, table row, wall angel.
- 10 airway strips, three frames each, one per airway move.
- A built-in line-figure drawing function for lifts without a picture.
- **There are no drawings for cycling, swimming, rowing, seated options or sit-to-stand.** Any new
  exercise would need new artwork or would ship as text only.

### 1.9 Statements in the app that need review before a paid release
- "In a trial, walking twice a day for a week cut sleep apnoea events by 30%."
- "In one study [alcohol] doubled breathing events in snorers."
- "Snoring changes often start to show around now" (day 55).
- "Some people end up needing less treatment."
- "The muscle that pushes your tongue forward holds your airway open at night."
- Breath-hold walks, with only a brief warning.
- "6 months · retest: book your repeat sleep study" (implies everyone needs one at 24 weeks).

---

## 2. 52-week program specification

### 2.1 Design rules
1. **Weeks 1–24 are unchanged.** Every existing prescription is kept exactly. Only names and the
   stage grouping change, plus one review at week 13 that adds checks but no training change.
2. **Weeks 25–52 use the existing exercise library.** No new exercises are required. Two optional
   joint-friendly swaps are proposed in 2.6 and flagged for review.
3. **Airway and breathing doses are held, not escalated.** The trials behind tongue and throat
   exercises ran for about three months at a steady daily dose. There is no evidence that making
   them harder or longer improves sleep apnoea, so weeks 25–52 keep the week-6 dose.
4. **Later stages progress fitness, monitoring and habits**, which is where a year of training can
   honestly keep moving.
5. **Three lighter weeks** (26, 39, 52) coincide with stage reviews.
6. Nothing in the specification promises an outcome by a given week.

### 2.2 Stages
| Stage | Weeks | Purpose | What changes |
|---|---|---|---|
| Awaken | 1–13 | Technique, baseline, adherence | Existing weeks 1–13 exactly. Review 1 at week 13 |
| Build | 14–26 | Progress conditioning, consolidate airway training | Existing weeks 14–24, then week 25 continues and week 26 is a lighter review week |
| Reclaim | 27–39 | Individualised progression, functional fitness, longer-term monitoring | Load rule switched on, longer weekend session, functional goals tracked, review 3 at week 39 |
| Thrive | 40–52 | Sustainable maintenance, evaluate the year | Consolidate, then a choice of Standard or Minimum week, year-end review at week 52 |

### 2.3 Constant in every week (1–52)
| Component | Prescription | Frequency |
|---|---|---|
| Tongue and throat training | The 10-move airway routine at the level shown in the table; singing swap allowed up to twice a week (existing rule) | Daily, about 12 min |
| Respiratory muscle training | 30 breaths in (5 × 6) at the user's trainer level, then breaths out as shown; raise a level after two easy sessions (existing rule) | Daily, about 8 min |
| Cardiovascular training | Tue steady, Thu steady or intervals, Sat long session; durations in the table; user's own choice of activity (2.6) | 3 days |
| Strength training | Workouts A and B alternating, Mon / Wed / Fri; scheme in the table | 3 days |
| Evening sleep-health routine | Walk 10–20 min after dinner, calf raises 2 × 20, move hourly, no alcohol within 3 hours of bed | Daily, about 15 min |
| Progress tracking | Morning log daily; weekly check; 28-day checks; stage reviews | As shown |
| Recovery and safety | Sunday rest and mobility; stop 1–2 reps short of failure; rules in 2.5 | Weekly |

### 2.4 Week-by-week table
Columns: strength order for Mon · Wed · Fri; main-lift scheme (sets × reps, gym; home versions use
the same set count at 8–15 slow reps); carries (distance) or planks (time); Tuesday steady cardio
minutes; Thursday session; Saturday long session minutes.

| Wk | Stage | Block | Source | Mon·Wed·Fri | Main lifts | Carries / plank | Tue min | Thursday | Sat min | Airway routine | Breathing trainer | Checks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Awaken | Foundation | Existing | A · B · A | 3 × 10–12 | 3 × 30 m / 3 × 30 s | 30 | Steady 30 | 45 | Level 1 (20 reps; head lift 3 × 30 s; slow exhale 2 min) | 30 in (5 × 6) + out 3 × 5 |  |
| 2 | Awaken | Foundation | Existing | B · A · B | 3 × 10–12 | 3 × 30 m / 3 × 30 s | 30 | Steady 30 | 45 | Level 1 (20 reps; head lift 3 × 30 s; slow exhale 2 min) | 30 in (5 × 6) + out 3 × 5 |  |
| 3 | Awaken | Build | Existing | A · B · A | 4 × 6–8 | 3 × 40 m / 3 × 40 s | 40 | Intervals 6 × 30 s hard / 90 s easy, then 5 breath-hold walks | 45 | Level 1 (20 reps; head lift 3 × 60 s; slow exhale 2 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 4 | Awaken | Build | Existing | B · A · B | 4 × 6–8 | 3 × 40 m / 3 × 40 s | 40 | Intervals 6 × 30 s hard / 90 s easy, then 5 breath-hold walks | 45 | Level 1 (20 reps; head lift 3 × 60 s; slow exhale 2 min) | 30 in (5 × 6) + out 5 × 5 | 28-day checks |
| 5 | Awaken | Build | Existing | A · B · A | 4 × 6–8 | 3 × 40 m / 3 × 40 s | 40 | Intervals 6 × 30 s hard / 90 s easy, then 5 breath-hold walks | 45 | Level 1 (20 reps; head lift 3 × 60 s; slow exhale 2 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 6 | Awaken | Strength | Existing | B · A · B | 4–5 × 4–6 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 7 | Awaken | Strength | Existing | A · B · A | 4–5 × 4–6 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 8 | Awaken | Strength | Existing | B · A · B | 4–5 × 4–6 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 | 28-day checks |
| 9 | Awaken | Progression | Existing | A · B · A | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 10 | Awaken | Progression | Existing | B · A · B | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 11 | Awaken | Progression | Existing | A · B · A | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 12 | Awaken | Progression | Existing | B · A · B | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 | 28-day checks |
| 13 | Awaken | Progression | Existing | A · B · A | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 | STAGE REVIEW 1 (checks only; training unchanged) |
| 14 | Build | Progression | Existing | B · A · B | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 15 | Build | Progression | Existing | A · B · A | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 16 | Build | Progression | Existing | B · A · B | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 | 28-day checks |
| 17 | Build | Progression | Existing | A · B · A | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 18 | Build | Progression | Existing | B · A · B | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 19 | Build | Progression | Existing | A · B · A | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 20 | Build | Progression | Existing | B · A · B | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 | 28-day checks |
| 21 | Build | Progression | Existing | A · B · A | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 22 | Build | Progression | Existing | B · A · B | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 23 | Build | Progression | Existing | A · B · A | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 |  |
| 24 | Build | Progression | Existing | B · A · B | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2 (40 reps; head lift 3 × 60 s; slow exhale 3 min) | 30 in (5 × 6) + out 5 × 5 | 28-day checks; existing "6 months" milestone |
| 25 | Build | Progression | NEW | A · B · A | 4–5 × 4–6, add small loads | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 45 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 26 | Build | Review week | NEW | B · A · B | 3 × 4–6 at about 90% of recent working load | 4 × 40 m / 3 × 45 s | 45 | Steady 45 (no intervals) | 45 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | STAGE REVIEW 2 · lighter week |
| 27 | Reclaim | Rebuild | NEW | A · B · A | 4 × 6–8 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 50 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 28 | Reclaim | Rebuild | NEW | B · A · B | 4 × 6–8 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 50 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | 28-day checks |
| 29 | Reclaim | Rebuild | NEW | A · B · A | 4 × 6–8 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 50 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 30 | Reclaim | Rebuild | NEW | B · A · B | 4 × 6–8 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 50 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 31 | Reclaim | Progression II | NEW | A · B · A | 4–5 × 4–6, load rule applies | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 55 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 32 | Reclaim | Progression II | NEW | B · A · B | 4–5 × 4–6, load rule applies | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 55 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | 28-day checks |
| 33 | Reclaim | Progression II | NEW | A · B · A | 4–5 × 4–6, load rule applies | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 55 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 34 | Reclaim | Progression II | NEW | B · A · B | 4–5 × 4–6, load rule applies | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 55 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 35 | Reclaim | Progression II | NEW | A · B · A | 4–5 × 4–6, load rule applies | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 36 | Reclaim | Progression II | NEW | B · A · B | 4–5 × 4–6, load rule applies | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | 28-day checks |
| 37 | Reclaim | Progression II | NEW | A · B · A | 4–5 × 4–6, load rule applies | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 38 | Reclaim | Progression II | NEW | B · A · B | 4–5 × 4–6, load rule applies | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 39 | Reclaim | Review week | NEW | A · B · A | 3 × 4–6 at about 90% of recent working load | 4 × 40 m / 3 × 45 s | 45 | Steady 45 (no intervals) | 45 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | STAGE REVIEW 3 · lighter week |
| 40 | Thrive | Consolidate | NEW | B · A · B | 4 × 6–8 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | 28-day checks |
| 41 | Thrive | Consolidate | NEW | A · B · A | 4 × 6–8 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 42 | Thrive | Consolidate | NEW | B · A · B | 4 × 6–8 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 43 | Thrive | Consolidate | NEW | A · B · A | 4 × 6–8 | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 |  |
| 44 | Thrive | Maintain | NEW | B · A · B | 3 × 5–8, hold loads (adding is optional) | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | 28-day checks; choose Standard or Minimum week |
| 45 | Thrive | Maintain | NEW | A · B · A | 3 × 5–8, hold loads (adding is optional) | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | Standard or Minimum week |
| 46 | Thrive | Maintain | NEW | B · A · B | 3 × 5–8, hold loads (adding is optional) | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | Standard or Minimum week |
| 47 | Thrive | Maintain | NEW | A · B · A | 3 × 5–8, hold loads (adding is optional) | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | Standard or Minimum week |
| 48 | Thrive | Maintain | NEW | B · A · B | 3 × 5–8, hold loads (adding is optional) | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | 28-day checks; choose Standard or Minimum week |
| 49 | Thrive | Maintain | NEW | A · B · A | 3 × 5–8, hold loads (adding is optional) | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | Standard or Minimum week |
| 50 | Thrive | Maintain | NEW | B · A · B | 3 × 5–8, hold loads (adding is optional) | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | Standard or Minimum week |
| 51 | Thrive | Maintain | NEW | A · B · A | 3 × 5–8, hold loads (adding is optional) | 4 × 40 m / 3 × 45 s | 45 | Intervals 8 × 30 s / 90 s, then 8 breath-hold walks | 60 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | Standard or Minimum week |
| 52 | Thrive | Review week | NEW | B · A · B | 3 × 5–8, hold loads | 4 × 40 m / 3 × 45 s | 45 | Steady 45 (no intervals) | 45 | Level 2, dose held (no increase) | 30 in (5 × 6) + out 5 × 5 | YEAR-END REVIEW · lighter week |

"Source: Existing" means the row is what the app prescribes today. "NEW" rows are proposals.

### 2.5 Progression, recovery and safety rules (new rules flagged)
**Load rule for logged lifts (NEW, weeks 27 onward; needs review).**
- Add the smallest available load (about 2.5 kg on barbell lifts, 1–2 kg on dumbbells) when every
  set reached the top of the rep range with 1–2 reps still in hand, in two sessions running.
- Hold the load otherwise.
- Drop 5–10% if he missed the bottom of the range in two sessions running, or if technique slipped.
- Home equipment: progress by slowing the lowering, adding a pause, then adding load.
- The app proposes; the user always decides.

**Lighter weeks (NEW: 26, 39, 52).** Main lifts at 3 sets and about 90% of recent load; intervals
replaced by steady cardio; daily routines unchanged.

**Standard or Minimum week (NEW: weeks 44–51).**
- Standard: the full week as in the table.
- Minimum: two strength sessions (A once, B once), one steady session and one long session, with
  all daily routines unchanged. For men who want a level they can hold for life.

**Recovery guidance shown in the app (NEW wording, needs review).**
- Sore joints, not muscles: swap the exercise or reduce load, and do not push through.
- Unwell, or slept under five hours: do the daily routines and skip or shorten the main session.
- Missed days: resume from today. Never "catch up" by doubling sessions.
- Missed more than two weeks: repeat the previous block's loads for a week.
- Stop and seek medical advice for chest pain, faintness or unusual breathlessness.

### 2.6 Alternatives for beginners and physical limitations
Existing and kept: four equipment tiers, incline push-ups, 20-second planks, 20-minute walks.

Proposed additions (NEW):
| Need | Alternative | Notes |
|---|---|---|
| Walking is hard (knees, hips, back) | Cardio activity setting: walk, bike or recumbent bike, pool, cross-trainer, rower, seated or arm option | Same minutes and effort level. No new artwork needed |
| Cannot sustain a session | Split sessions: for example 3 × 10 min in a day counts as 30 | User's choice, no penalty in adherence |
| Intervals too jarring | Bike, pool or seated intervals; or a second steady session | Stairs, skipping and burpees become clearly optional |
| Breath-hold walk unsuitable | Skip it, or seated slow breathing | See clinical review item C6 |
| Squats painful | Sit-to-stand from a chair, or box squat to a higher seat | New exercise, text only until drawn; needs review |
| Loaded carries painful | Unloaded tall walk, or the existing side plank | |
| Head lift strains the neck | Use the existing chin tuck press only | |
| Loaded backpack on the long session | Always optional | |

### 2.7 Assessment checkpoints
| When | Name | Contents |
|---|---|---|
| Before week 1 | Baseline | Existing checks, 1–2 weeks of snore scores, **new: 1–3 functional goals in his own words and a 0–10 rating for each**, **new: nightly sleep-quality rating 0–10** |
| Week 13 | Review 1 | All repeatable checks, stage summary, goals re-rated |
| Week 26 | Review 2 | As above, plus the half-year summary for his clinician |
| Week 39 | Review 3 | As above |
| Week 52 | Year-end review | As above, plus the year summary |

Each review reports, where the user has entered data:
- Snore score: stage median against baseline, and nights logged.
- Sleep quality and daytime tiredness ratings; the daytime energy check.
- CPAP hours, events per hour and mask seal as entered.
- Adherence: share of planned sessions completed, by component.
- Strength: best logged set per lift against the previous review. Fitness check results.
- Cardio minutes completed.
- Functional goals and a single overall quality-of-life rating (original wording, not a licensed
  questionnaire).

Wording shown with every review:
- These are self-recorded numbers and consumer-device readings. They show trends, not a diagnosis.
- A lower snore score, lower machine readings or feeling better do not show that sleep apnoea has
  improved or resolved.
- If you use CPAP or an oral appliance, keep using it. This review never recommends changing it.
- If your results have changed meaningfully, take the summary to your clinician and ask whether
  reassessment or repeat sleep testing is appropriate.

The existing alerts (see your GP, contact your sleep clinic) stay as they are.

---

## 3. Proposed changes to the application

### 3.1 Data model
- Replace `phaseOf()` and the three-way `pick()` with a 52-entry week table (stage, block, lift
  scheme, tier, cardio minutes, Thursday type, flags for review and lighter weeks).
- Weeks 1–24 of the table reproduce today's output exactly; a regression test enforces this.
- Add `STAGES` (name, first week, last week, purpose).
- Phase names are kept as they are (owner decision). Where a stage and a phase are both shown, the stage is labelled as a stage.
- After week 52: "Year complete", with the choice to continue the Maintain block or start again
  while keeping all history.

### 3.2 Stored data and migration
- Bump `v` from 1 to 2 with a `migrate()` step that only **adds** fields: `goals`, `reviews`,
  `cardioMode`, `weekPlan` (Standard or Minimum), `sleepQ` inside nightly entries.
- Before migrating, copy the untouched state to a `bs-state-v1-backup` key.
- No existing key is renamed, re-keyed or deleted. Cloud documents keep the same shape.
- A newer state opened by an older cached copy of the app must not be damaged: unknown fields are
  already passed through by the current load code, and a test will confirm it.

### 3.3 Screens
| Area | Change |
|---|---|
| Plan | Four-stage bar; tap a stage to see its weeks; week detail view; calendar and adherence dots extended from 168 to 364 days |
| Today / Day | Stage and block name; lighter-week and Minimum-week banners; recovery guidance card |
| Workout | Load suggestion next to "Last time", from week 27 |
| Cardio | Activity setting and split-session logging |
| Log | Sleep-quality rating |
| Progress | Stage summaries, long-term history across the year, adherence by component |
| Reviews | New guided review at weeks 13, 26, 39, 52, built on the existing checks wizard |
| Year-end | Summary screen and an extended clinician summary |
| Milestones | Existing ones kept; stage starts and reviews added; day-167 wording softened |

### 3.4 Membership readiness (no billing work)
- A single `entitled()` check wrapping access to weeks beyond the trial, defaulting to "allowed".
- No payment code, keys or paywall in this project until billing is separately approved.

### 3.5 Code structure and testing
- The app is one 1.1 MB HTML file with its logic inside a closed block, so nothing can be tested
  from outside. Proposal: expose a small read-only test hook (plan for a date, migrate a state) and
  add a `tests/` folder run with Playwright. No build step is introduced.

---

## 4. Clinical review requirements

Everything below should be reviewed by an appropriately qualified clinician (sleep physician,
and an exercise physiologist or physiotherapist) before public or paid release.

| # | Item | Why it needs review |
|---|---|---|
| C1 | Holding airway-exercise dose constant for weeks 25–52 | No trial evidence beyond about three months; maintenance dose is unknown |
| C2 | Whether airway or breathing training may drop below daily in Thrive | Proposed to stay daily; any reduction is a clinical judgement |
| C3 | Breathing trainer protocol: 30 breaths in, level progression, forceful breathing out | Contraindications (uncontrolled blood pressure, hernia, recent eye, ear or chest surgery) are listed in the app; confirm they are complete |
| C4 | Shaker head lift, 3 × 60 s plus quick lifts | Neck strain risk in older men; cervical spine conditions |
| C5 | Neck work under load (band neck work, 4-way holds) | Same |
| C6 | Breath-hold walks after intervals | Deliberate breath-holding in men with sleep apnoea and possible heart disease; the current warning is one line |
| C7 | Heavy lifting at 4–6 reps with bracing in men over 40 | Blood pressure response; screening before starting |
| C8 | New load rule, lighter weeks and return-after-break rule | New progression logic |
| C9 | Longer weekend session, up to 60 min | Progression for older, heavier or deconditioned men |
| C10 | Standard and Minimum maintenance weeks | Whether the Minimum week is enough to hold gains |
| C11 | Interval session for men with joint or cardiac limits | Suitability and alternatives |
| C12 | New alternatives: sit-to-stand, seated cardio, split sessions | Equivalence claims |
| C13 | Pre-exercise screening | The app has a sleep risk check but no exercise-readiness screen |
| C14 | Review wording and thresholds | Must never suggest stopping treatment; when to advise seeing a clinician |
| C15 | Existing alert thresholds (events per hour above 10, oxygen under 92%, energy score 10 or more) | Clinical cut-offs chosen in the app |
| C16 | Evening routine claims and the alcohol and fluid wording | Statements in 1.9 |
| C17 | New self-ratings for sleep quality, goals and quality of life | Not validated instruments; how results are described |
| C18 | All statements listed in 1.9 | Accuracy of evidence claims shown to users |

---

## 5. Evidence by component

| Component | Intended outcome | Evidence | Limits |
|---|---|---|---|
| Tongue and throat exercises | Less snoring; improvement in some sleep apnoea measures | Guimarães 2009 (Am J Respir Crit Care Med 179:962); Ieto 2015 (Chest 148:683); Camacho 2015 meta-analysis (Sleep 38:669); Rueda 2020 Cochrane review (CD013449) | Small trials of about three months; Cochrane rates certainty moderate to very low |
| Exercise training (strength and cardio) | Fitness, daytime sleepiness, sleep apnoea severity | Iftikhar 2014 meta-analysis (Lung 192:175) | Five small studies, 129 people; partial improvement |
| Respiratory muscle training | Sleep quality, blood pressure, breathing-muscle strength | Vranish and Bailey 2016 (Sleep 39:1179) | One small trial; no change in the apnoea–hypopnoea index |
| Evening routine | Habit support; possible effect on overnight fluid shift | Redolfi 2009 (Am J Respir Crit Care Med 179:241), observational | Association only; benefit of these habits unproven |
| Tracking and reviews | Awareness, adherence, informed clinician discussions | None specific to this program | Self-reported and consumer-device data |

- All citations were checked against Crossref and PubMed during the website work.
- Each study tested one method on its own, mostly for two to four months.
- **The combined Breathe Strong program, at 24 or 52 weeks, has not been evaluated in any trial and
  must not be described as clinically validated.**
- No study cited supports continued improvement from months 7 to 12. The later stages are justified
  as fitness progression, maintenance and monitoring.

---

## 6. Development and testing plan

Each stage is a separate, reviewable change. Nothing merges to `main` without approval.

| Stage | Work | Check before moving on |
|---|---|---|
| 0 | Test harness. Record a "golden" snapshot of today's plan for every day of weeks 1–30 in all four equipment modes and both paths | Snapshot reviewed; app unchanged |
| 1 | Week table and stages for weeks 1–24 only | Golden snapshot still matches exactly; only labels differ |
| 2 | State version 2, migration and backup key | Migration tests on saved states: fresh user, mid-program, past week 24, cloud and phone-only; no field lost |
| 3 | Weeks 25–52 content, lighter weeks, Standard and Minimum week, behind an off-by-default switch | Table matches section 2.4; weeks 1–24 still match the snapshot |
| 4 | Stage and week navigation, calendar to 364 days, milestones | Manual and scripted walkthrough at phone widths |
| 5 | Cardio activity setting, split sessions, recovery guidance, load suggestions | Suggestions never appear before week 27; alternatives never reduce adherence scores |
| 6 | Reviews at weeks 13, 26, 39, 52; goals; sleep-quality rating | Review wording matches 2.7; no treatment advice in any branch |
| 7 | Long-term history and year-end summary | Checked against hand-built test data covering 52 weeks |
| 8 | Clinical review of section 4 and sign-off; fixes | Written sign-off recorded |
| 9 | Switch on weeks 25–52 and release | Owner approval |
| 10 | Website: remove "planned" labels, update membership wording | Only after stage 9 |

Regression tests kept permanently:
- Weeks 1–24 plan equals the golden snapshot.
- A version 1 state survives migration with every night, session, check and health record intact.
- A user's current week number is the same before and after the update.
- CPAP users see the "keep using your treatment" notice on every stage and review screen.
- No screen can be reached that tells a user to reduce or stop treatment.

Not in scope until separately approved: billing, paywalls, payment keys, and any change to the
live `main` branch.
