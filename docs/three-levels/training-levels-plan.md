# Breathe Strong: three training levels

Status: **approved by the owner as proposed and built.** All seven decisions in section 13 were accepted.
Professional review (section 11) has not been done and remains open.

### What was built
- Prescription engine with level tables; Advanced reproduces the original program exactly (2,646 day plans match the snapshot).
- Foundation and Standard strength and cardio tables, as specified in sections 4 and 5.
- Health check before exercise, a fuller fitness check, and a recommendation with reasons.
- Training level screen: separate strength and cardio levels, immediate move down, readiness check and a two-week step-up to move up, level history.
- Data version 3: existing users stay on the original plan (Advanced) and are offered the check; new users start on Foundation until assessed.
- Full week and Minimum week, available in any week.
- Session lengths estimated from the set count.
- Tests: `tests/check-levels.js` plus the five earlier suites.

Differences from this document as built:
- Foundation's row substitution for chin-ups applies in the gym; home equipment keeps its existing row versions.
- "Make today easier" drops one set from each lift for that session.
- The repeat health check appears with the other checks every 12 weeks; a new symptom is reported by redoing it.
Covers phases 1 to 3 of the brief: audit, training design, and application architecture.
The ranges below are design ranges. They need exercise and clinical review before public release.

Contents
1. [Audit of the current app](#1-audit-of-the-current-app)
2. [The three levels](#2-the-three-levels)
3. [What changes with level, and what never does](#3-what-changes-with-level-and-what-never-does)
4. [Strength prescription](#4-strength-prescription)
5. [Cardio prescription](#5-cardio-prescription)
6. [52-week comparison matrix](#6-52-week-comparison-matrix)
7. [Weekly time commitment](#7-weekly-time-commitment)
8. [Health screen and starting-level assessment](#8-health-screen-and-starting-level-assessment)
9. [Changing level](#9-changing-level)
10. [Application architecture and migration](#10-application-architecture-and-migration)
11. [Review requirements](#11-review-requirements)
12. [Implementation and testing plan](#12-implementation-and-testing-plan)
13. [Decisions needed from the owner](#13-decisions-needed-from-the-owner)

---

## 1. Audit of the current app

| Area | What exists today |
|---|---|
| Fitness assessment | One "Starting fitness" check: push-ups in a row, plank seconds, "can you walk briskly for 30 minutes?". It makes three small adjustments (incline push-ups under 8, 20-second planks under 30 s, 20-minute walks in weeks 1–2). It does not set a level |
| Health screening | A sleep risk check only. **There is no pre-exercise health screen** |
| 52-week prescription | One prescription for everyone, driven by a per-week table: Foundation, Build, Strength and Progression phases, then Rebuild, Progression, Consolidate and Maintain, with lighter review weeks at 26, 39 and 52 |
| Strength | Workouts A and B, seven exercises each, Mon/Wed/Fri. Main lifts go from 3 × 10–12 to 4–5 × 4–6 by week 6, stopping 1–2 reps short. Every session shows "50 min" regardless of sets |
| Exercise library | 14 exercise slots, each with gym, dumbbell, household and bodyweight versions; 20 drawings |
| Progression rules | Load suggestions from week 27 (two sessions at the top or bottom of the range); breathing-trainer level prompt after two easy sessions |
| Cardio | Tue steady, Thu steady then intervals with breath-hold walks, Sat long session. Activity setting: walking, bike, pool, machine, seated. Split sessions allowed |
| Respiratory trainer | 30 breaths in at a self-set level 1–12, then 3 or 5 sets of 5 breaths out. Not tied to anything else |
| Neck work | Band or hand-resisted neck work 2 × 15 "keep it light", plus 5 minutes of four-way neck holds and posture drills in every session; Shaker head lift and chin tuck press in the airway routine |
| Standard and Minimum week | A setting offered only in weeks 44–51. Minimum is two strength and two cardio sessions. Daily routines are unaffected |
| Data | One JSON record, version 2: profile, nights, done, sessions (each stores the scheme it was done at), weekly, checks, health, goals, reviews. Saved in the browser and optionally to one cloud document per user |
| Tracking and reviews | Nightly log, weekly check, 28-day checks, stage reviews at weeks 13, 26, 39 and 52, year view, clinician summary |
| Maintenance | After week 52 the Maintain block continues |
| Tests | Five suites: plan snapshot, saved-data upgrade, weeks 25–52, screens, reviews |

Conclusions that shape the design:
- **Today's single prescription is an advanced one.** Sets of 4–6 with 1–2 reps in reserve, three 50-minute sessions and three cardio days from week one is a lot for a man returning to exercise.
- **The week table and the saved sessions already separate "which week" from "what was done"**, so a level can be added as one more input without touching history.
- **Airway and breathing work are already independent** of the strength prescription. That stays.

---

## 2. The three levels

| | Foundation | Standard | Advanced |
|---|---|---|---|
| Tagline | Start where you are. | Build on what you have. | Challenge your capabilities. |
| Colour (always with the name in text) | Sage `#7FB7A4` | Amber `#E8B04B` | Orange `#FF5A1F` |
| For | Sedentary men, men returning to exercise, or anyone wanting a gradual start | Reasonably active men with some resistance-training experience | Men who already train strength and cardio regularly |
| Strength sessions a week | 2 in Awaken, 3 from Build | 3 | 3 |
| Strength session length | 25–35 min | 40–50 min | 50–60 min |
| Working sets | 1–3 | 2–4 | 3–5 |
| Repetitions | 10–15 | 8–12 | 4–12 |
| Reps in reserve | 3–4 | 2–3 | 1–3 |
| Rest between sets | 60–90 s, longer if needed | 90 s | 90 s to 3 min |
| Cardio | 10–35 min, bouts can be accumulated | 25–50 min | 30–60 min |
| Intervals | Only after readiness criteria are met | From week 6 | From week 3 |

Rules that hold at every level:
- No maximal lifts and no training to failure.
- Foundation is a complete program, not a waiting room. A man can do all 52 weeks there.
- **Advanced is today's prescription, unchanged.** Standard and Foundation are new.

---

## 3. What changes with level, and what never does

**Changes with level:** strength sets, reps, effort target, rest, session length, exercise selection for a few demanding lifts, cardio minutes, and when intervals start.

**Never changes with level:**
- The tongue and throat routine: same daily dose for everyone (level 1 to week 5, level 2 from week 6).
- Respiratory trainer resistance: set individually by the existing "two easy sessions" rule. Choosing Advanced does not raise it.
- The evening routine and the morning log.
- Neck work: prescribed separately (section 4.4), not scaled by level.
- The program week and stage, the reviews, and all the safety wording.

**Independent settings.** Strength level and cardio level are stored separately. The overall level a man picks sets both, and either can then be adjusted, so an experienced lifter with poor cardio can run Advanced strength with Foundation cardio.

---

## 4. Strength prescription

### 4.1 Session content
One shared exercise library. Each level uses the same slots with the same four equipment versions.

| Slot | Foundation | Standard | Advanced |
|---|---|---|---|
| A1 Hinge (deadlift pattern) | Yes | Yes | Yes |
| A2 Overhead press | Not used (see note) | Yes | Yes |
| A3 Row | Yes | Yes | Yes |
| A4 Carry | Yes, shorter | Yes | Yes |
| A5 Shrug | Not used | Yes | Yes |
| A6 Resisted neck work | Not used | Yes | Yes |
| A7 Neck holds and posture | Yes | Yes | Yes |
| B1 Horizontal push | Yes | Yes | Yes |
| B2 Chin-up or pulldown | Row version only | Yes | Yes |
| B3 Squat | Sit-to-stand or goblet squat | Goblet squat | Goblet squat |
| B4 Suitcase carry or side plank | Yes, shorter | Yes | Yes |
| B5 Face pull or prone raise | Yes | Yes | Yes |
| B6 Plank | Yes | Yes | Yes |
| B7 Neck holds and posture | Yes | Yes | Yes |

Note: Foundation leaves out overhead pressing, shrugs, hanging and resisted neck work to keep sessions to about 30 minutes and to hold back the moves most likely to aggravate shoulders and necks in men returning to training. A man can add any of them back through an exercise override.

### 4.2 Main lifts by block (sets × reps)
| Weeks | Block | Foundation | Standard | Advanced (today) |
|---|---|---|---|---|
| 1–2 | Foundation | 1 × 12–15 | 2 × 10–12 | 3 × 10–12 |
| 3–5 | Build | 2 × 12–15 | 3 × 10–12 | 4 × 6–8 |
| 6–8 | Strength | 2 × 10–12 | 3 × 8–10 | 4–5 × 4–6 |
| 9–13 | Progression | 2 × 10–12 | 3 × 8–10 | 4–5 × 4–6 |
| 14–17 | Progression | 2 × 10–12, third session added | 4 × 8–10 | 4–5 × 4–6 |
| 18–25 | Progression | 3 × 10–12 | 4 × 8–10 | 4–5 × 4–6 |
| 26, 39, 52 | Review (lighter) | 2 sets, lighter | 3 sets, lighter | 3 sets at about 90% |
| 27–30 | Rebuild | 2 × 12–15 | 3 × 10–12 | 4 × 6–8 |
| 31–38 | Progression | 3 × 10–12 | 4 × 8–10 | 4–5 × 4–6 |
| 40–43 | Consolidate | 3 × 10–12 | 3 × 10–12 | 4 × 6–8 |
| 44–51 and after week 52 | Maintain | 2 × 10–12, hold loads | 3 × 8–10, hold loads | 3 × 5–8, hold loads |

Home equipment (dumbbells, household, bodyweight) keeps the level's set count and uses 8–15 slow reps, as today.

### 4.3 Carries, planks and accessories
| | Foundation | Standard | Advanced (today) |
|---|---|---|---|
| Carries | 2 × 20 m, building to 3 × 30 m | 3 × 30 m, building to 3 × 40 m | 3 × 30 m, building to 4 × 40 m |
| Plank | 2 × 20 s, building to 3 × 30 s | 3 × 30 s, building to 3 × 40 s | 3 × 30 s, building to 3 × 45 s |
| Side plank (bodyweight) | 2 × 20 s a side, building to 3 × 30 s | 3 × 30 s, building to 3 × 40 s | 3 × 30 s, building to 3 × 45 s |
| Face pulls, prone raises | 2 × 12 | 3 × 15 | 3 × 15 |
| Shrugs | Not used | 3 × 12 | 3 × 12 |

### 4.4 Neck work (separate from level)
- Every level: 5 minutes of four-way neck holds and posture drills, gentle and pain-free.
- Resisted neck work (band or hand, 2 × 15, light): Standard and Advanced only, as today.
- No level increases neck loading automatically. The app makes no claim that stronger external neck muscles reduce airway obstruction.
- All neck work is listed for review in section 11.

### 4.5 Progression, regression and recovery
| Rule | Detail |
|---|---|
| Progress | Two sessions running with every set at the top of the range and reps still in reserve: add the smallest load available, or slow the lowering on home equipment. Available from week 3 at every level (today it starts at week 27) |
| Hold | Anything else |
| Regress | Two sessions running under the range, or technique slipping: drop the load 5–10% or use an easier version |
| Recovery options | Swap an exercise for joint pain; shorten or skip the main session when unwell or short of sleep; never double up; after two weeks off, a week at earlier loads |
| Stop | Chest pain, faintness or unusual breathlessness: stop and seek medical advice |
| Breathing | Breathe out on the effort. No breath-holding beyond a single rep |

---

## 5. Cardio prescription

Minutes for Tuesday · Thursday · Saturday. The activity is the man's choice (walk, bike, pool, machine, seated), and any session can be split into shorter bouts.

| Weeks | Foundation | Standard | Advanced (today) |
|---|---|---|---|
| 1–2 | 10–15 · 10–15 · 20 | 25 · 25 · 35 | 30 · 30 · 45 |
| 3–5 | 15–20 · 15–20 · 25 | 30 · 30 · 40 | 40 · intervals · 45 |
| 6–8 | 20–25 · 20–25 · 30 | 35 · intervals · 45 | 45 · intervals · 45 |
| 9–13 | 25–30 · 25–30 · 35 | 40 · intervals · 45 | 45 · intervals · 45 |
| 14–25 | 30 · 30 · 40 | 40 · intervals · 45 | 45 · intervals · 45 |
| 27–30 | 30 · 30 · 45 | 40 · intervals · 45 | 45 · intervals · 50 |
| 31–38 | 30 · 30 · 45 | 40 · intervals · 50 | 45 · intervals · 55 then 60 |
| 40–51 | 30–35 · 30–35 · 45 | 40 · intervals · 50 | 45 · intervals · 60 |
| 26, 39, 52 | 30 · 30 · 30 | 40 · 30 · 40 | 45 · 45 · 45 |

Intensity for steady sessions at every level: a pace where he can still hold a conversation.

**Intervals**
| | Foundation | Standard | Advanced (today) |
|---|---|---|---|
| Starts | Optional from week 14, only if ready | Week 6 | Week 3 |
| Structure | 4 × 30 s brisk, 2 min easy | 4 then 6 × 30 s hard, 90 s easy | 6 then 8 × 30 s hard, 90 s easy |
| Readiness criteria | 30 minutes continuous without stopping; at least 80% of cardio sessions done over the last four weeks; no symptoms; health screen clear | Health screen clear | Health screen clear |
| Breath-hold walks afterwards | Not included | Not included | Optional, as today, pending review |

---

## 6. 52-week comparison matrix

Strength is shown as sessions a week × (sets × reps) for the main lifts. Cardio is Tuesday · Thursday · Saturday in minutes, with interval rounds where they apply. Hours are the whole week, including the 36 minutes of daily routines and rest-day mobility.

| Wk | Stage | Block | Foundation strength | Foundation cardio | Hrs | Standard strength | Standard cardio | Hrs | Advanced strength | Advanced cardio | Hrs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Awaken | Foundation | 2 × (1 × 12–15) | 10–15 · 10–15 · 20 | 6.3 | 3 × (2 × 10–12) | 25 · 25 · 35 | 7.9 | 3 × (3 × 10–12) | 30 · 30 · 45 | 8.7 |
| 2 | Awaken | Foundation | 2 × (1 × 12–15) | 10–15 · 10–15 · 20 | 6.3 | 3 × (2 × 10–12) | 25 · 25 · 35 | 7.9 | 3 × (3 × 10–12) | 30 · 30 · 45 | 8.7 |
| 3 | Awaken | Build | 2 × (2 × 12–15) | 15–20 · 15–20 · 25 | 6.7 | 3 × (3 × 10–12) | 30 · 30 · 40 | 8.4 | 3 × (4 × 6–8) | 40 · 6 × 30 s · 45 | 9.1 |
| 4 | Awaken | Build | 2 × (2 × 12–15) | 15–20 · 15–20 · 25 | 6.7 | 3 × (3 × 10–12) | 30 · 30 · 40 | 8.4 | 3 × (4 × 6–8) | 40 · 6 × 30 s · 45 | 9.1 |
| 5 | Awaken | Build | 2 × (2 × 12–15) | 15–20 · 15–20 · 25 | 6.7 | 3 × (3 × 10–12) | 30 · 30 · 40 | 8.4 | 3 × (4 × 6–8) | 40 · 6 × 30 s · 45 | 9.1 |
| 6 | Awaken | Strength | 2 × (2 × 10–12) | 20–25 · 20–25 · 30 | 7.0 | 3 × (3 × 8–10) | 35 · 4 × 30 s · 45 | 8.4 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 7 | Awaken | Strength | 2 × (2 × 10–12) | 20–25 · 20–25 · 30 | 7.0 | 3 × (3 × 8–10) | 35 · 4 × 30 s · 45 | 8.4 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 8 | Awaken | Strength | 2 × (2 × 10–12) | 20–25 · 20–25 · 30 | 7.0 | 3 × (3 × 8–10) | 35 · 4 × 30 s · 45 | 8.4 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 9 | Awaken | Progression | 2 × (2 × 10–12) | 25–30 · 25–30 · 35 | 7.2 | 3 × (3 × 8–10) | 40 · 6 × 30 s · 45 | 8.6 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 10 | Awaken | Progression | 2 × (2 × 10–12) | 25–30 · 25–30 · 35 | 7.2 | 3 × (3 × 8–10) | 40 · 6 × 30 s · 45 | 8.6 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 11 | Awaken | Progression | 2 × (2 × 10–12) | 25–30 · 25–30 · 35 | 7.2 | 3 × (3 × 8–10) | 40 · 6 × 30 s · 45 | 8.6 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 12 | Awaken | Progression | 2 × (2 × 10–12) | 25–30 · 25–30 · 35 | 7.2 | 3 × (3 × 8–10) | 40 · 6 × 30 s · 45 | 8.6 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 13 | Awaken | Progression | 2 × (2 × 10–12) | 25–30 · 25–30 · 35 | 7.2 | 3 × (3 × 8–10) | 40 · 6 × 30 s · 45 | 8.6 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 14 | Build | Progression | 3 × (2 × 10–12) | 30 · 30 · 40 | 7.6 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 15 | Build | Progression | 3 × (2 × 10–12) | 30 · 30 · 40 | 7.6 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 16 | Build | Progression | 3 × (2 × 10–12) | 30 · 30 · 40 | 7.6 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 17 | Build | Progression | 3 × (2 × 10–12) | 30 · 30 · 40 | 7.6 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 18 | Build | Progression | 3 × (3 × 10–12) | 30 · 30 · 40 | 7.9 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 19 | Build | Progression | 3 × (3 × 10–12) | 30 · 30 · 40 | 7.9 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 20 | Build | Progression | 3 × (3 × 10–12) | 30 · 30 · 40 | 7.9 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 21 | Build | Progression | 3 × (3 × 10–12) | 30 · 30 · 40 | 7.9 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 22 | Build | Progression | 3 × (3 × 10–12) | 30 · 30 · 40 | 7.9 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 23 | Build | Progression | 3 × (3 × 10–12) | 30 · 30 · 40 | 7.9 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 24 | Build | Progression | 3 × (3 × 10–12) | 30 · 30 · 40 | 7.9 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 25 | Build | Progression | 3 × (3 × 10–12) | 30 · 30 · 40 | 7.9 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 45 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 45 | 9.4 |
| 26 | Build | Review (lighter) | 3 × (2 × 10–12, lighter) | 30 · 30 · 30 | 7.5 | 3 × (3 × 8–10, lighter) | 40 · 30 · 40 | 8.5 | 3 × (3 × 4–6, lighter) | 45 · 45 · 45 | 9.2 |
| 27 | Reclaim | Rebuild | 3 × (2 × 12–15) | 30 · 30 · 45 | 7.7 | 3 × (3 × 10–12) | 40 · 6 × 30 s · 45 | 8.6 | 3 × (4 × 6–8) | 45 · 8 × 30 s · 50 | 9.3 |
| 28 | Reclaim | Rebuild | 3 × (2 × 12–15) | 30 · 30 · 45 | 7.7 | 3 × (3 × 10–12) | 40 · 6 × 30 s · 45 | 8.6 | 3 × (4 × 6–8) | 45 · 8 × 30 s · 50 | 9.3 |
| 29 | Reclaim | Rebuild | 3 × (2 × 12–15) | 30 · 30 · 45 | 7.7 | 3 × (3 × 10–12) | 40 · 6 × 30 s · 45 | 8.6 | 3 × (4 × 6–8) | 45 · 8 × 30 s · 50 | 9.3 |
| 30 | Reclaim | Rebuild | 3 × (2 × 12–15) | 30 · 30 · 45 | 7.7 | 3 × (3 × 10–12) | 40 · 6 × 30 s · 45 | 8.6 | 3 × (4 × 6–8) | 45 · 8 × 30 s · 50 | 9.3 |
| 31 | Reclaim | Progression | 3 × (3 × 10–12) | 30 · 30 · 45 | 8.0 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 50 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 55 | 9.6 |
| 32 | Reclaim | Progression | 3 × (3 × 10–12) | 30 · 30 · 45 | 8.0 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 50 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 55 | 9.6 |
| 33 | Reclaim | Progression | 3 × (3 × 10–12) | 30 · 30 · 45 | 8.0 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 50 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 55 | 9.6 |
| 34 | Reclaim | Progression | 3 × (3 × 10–12) | 30 · 30 · 45 | 8.0 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 50 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 55 | 9.6 |
| 35 | Reclaim | Progression | 3 × (3 × 10–12) | 30 · 30 · 45 | 8.0 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 50 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 60 | 9.7 |
| 36 | Reclaim | Progression | 3 × (3 × 10–12) | 30 · 30 · 45 | 8.0 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 50 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 60 | 9.7 |
| 37 | Reclaim | Progression | 3 × (3 × 10–12) | 30 · 30 · 45 | 8.0 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 50 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 60 | 9.7 |
| 38 | Reclaim | Progression | 3 × (3 × 10–12) | 30 · 30 · 45 | 8.0 | 3 × (4 × 8–10) | 40 · 6 × 30 s · 50 | 8.9 | 3 × (4–5 × 4–6) | 45 · 8 × 30 s · 60 | 9.7 |
| 39 | Reclaim | Review (lighter) | 3 × (2 × 10–12, lighter) | 30 · 30 · 30 | 7.5 | 3 × (3 × 8–10, lighter) | 40 · 30 · 40 | 8.5 | 3 × (3 × 4–6, lighter) | 45 · 45 · 45 | 9.2 |
| 40 | Thrive | Consolidate | 3 × (3 × 10–12) | 30–35 · 30–35 · 45 | 8.0 | 3 × (3 × 10–12) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (4 × 6–8) | 45 · 8 × 30 s · 60 | 9.4 |
| 41 | Thrive | Consolidate | 3 × (3 × 10–12) | 30–35 · 30–35 · 45 | 8.0 | 3 × (3 × 10–12) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (4 × 6–8) | 45 · 8 × 30 s · 60 | 9.4 |
| 42 | Thrive | Consolidate | 3 × (3 × 10–12) | 30–35 · 30–35 · 45 | 8.0 | 3 × (3 × 10–12) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (4 × 6–8) | 45 · 8 × 30 s · 60 | 9.4 |
| 43 | Thrive | Consolidate | 3 × (3 × 10–12) | 30–35 · 30–35 · 45 | 8.0 | 3 × (3 × 10–12) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (4 × 6–8) | 45 · 8 × 30 s · 60 | 9.4 |
| 44 | Thrive | Maintain | 3 × (2 × 10–12, hold) | 30–35 · 30–35 · 45 | 7.8 | 3 × (3 × 8–10, hold) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (3 × 5–8, hold) | 45 · 8 × 30 s · 60 | 9.2 |
| 45 | Thrive | Maintain | 3 × (2 × 10–12, hold) | 30–35 · 30–35 · 45 | 7.8 | 3 × (3 × 8–10, hold) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (3 × 5–8, hold) | 45 · 8 × 30 s · 60 | 9.2 |
| 46 | Thrive | Maintain | 3 × (2 × 10–12, hold) | 30–35 · 30–35 · 45 | 7.8 | 3 × (3 × 8–10, hold) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (3 × 5–8, hold) | 45 · 8 × 30 s · 60 | 9.2 |
| 47 | Thrive | Maintain | 3 × (2 × 10–12, hold) | 30–35 · 30–35 · 45 | 7.8 | 3 × (3 × 8–10, hold) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (3 × 5–8, hold) | 45 · 8 × 30 s · 60 | 9.2 |
| 48 | Thrive | Maintain | 3 × (2 × 10–12, hold) | 30–35 · 30–35 · 45 | 7.8 | 3 × (3 × 8–10, hold) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (3 × 5–8, hold) | 45 · 8 × 30 s · 60 | 9.2 |
| 49 | Thrive | Maintain | 3 × (2 × 10–12, hold) | 30–35 · 30–35 · 45 | 7.8 | 3 × (3 × 8–10, hold) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (3 × 5–8, hold) | 45 · 8 × 30 s · 60 | 9.2 |
| 50 | Thrive | Maintain | 3 × (2 × 10–12, hold) | 30–35 · 30–35 · 45 | 7.8 | 3 × (3 × 8–10, hold) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (3 × 5–8, hold) | 45 · 8 × 30 s · 60 | 9.2 |
| 51 | Thrive | Maintain | 3 × (2 × 10–12, hold) | 30–35 · 30–35 · 45 | 7.8 | 3 × (3 × 8–10, hold) | 40 · 6 × 30 s · 50 | 8.7 | 3 × (3 × 5–8, hold) | 45 · 8 × 30 s · 60 | 9.2 |
| 52 | Thrive | Review (lighter) | 3 × (2 × 10–12, lighter) | 30 · 30 · 30 | 7.5 | 3 × (3 × 8–10, lighter) | 40 · 30 · 40 | 8.5 | 3 × (3 × 5–8, lighter) | 45 · 45 · 45 | 9.2 |

Every week at every level also has the daily tongue and throat routine, respiratory trainer session, evening routine and morning log, unchanged.

---

## 7. Weekly time commitment

Average hours a week by stage, all sessions included.

| Level | Awaken | Build | Reclaim | Thrive | Range across the year |
|---|---|---|---|---|---|
| Foundation | 6.9 | 7.8 | 7.8 | 7.8 | 6.3 to 8.0 |
| Standard | 8.4 | 8.8 | 8.8 | 8.7 | 7.9 to 8.9 |
| Advanced | 9.3 | 9.4 | 9.5 | 9.3 | 8.7 to 9.7 |

- About 4.2 of those hours at every level are the daily routines (36 minutes a day), which do not vary.
- The website's single "roughly 9 hours a week" would be replaced by these three figures.
- Minimum week (section 10.4) reduces any level further.
- Session lengths are estimates from set counts and rest times. Today's app shows 50 minutes for every strength session; the new figures would replace that.

---

## 8. Health screen and starting-level assessment

### 8.1 Pre-exercise health screen (new, separate, comes first)
Original wording, not a licensed questionnaire. Yes or no:
1. Has a doctor ever said you have a heart condition?
2. Do you get chest pain or tightness when you exert yourself?
3. Do you get dizzy, or have you fainted, in the past year?
4. Is your blood pressure high and not controlled by treatment?
5. Do you get unusually breathless with light effort?
6. Do you have a joint, bone or back problem that exercise could make worse?
7. Have you had surgery, a heart event or a stroke in the past six months?
8. Has a doctor told you to limit your physical activity for any other reason?

Outcome:
- **Any yes:** "See your GP before starting the strength and cardio sessions. Show them this list." The app caps the recommendation at Foundation, holds back intervals and breath-out training, and keeps reminding until he confirms he has been seen. The tongue and throat routine and the morning log stay available.
- **All no:** continue to the assessment.
- The screen is never described as clearance or a diagnosis, and a fitness result never overrides it.
- Repeated every 12 weeks and whenever he reports a new symptom.

### 8.2 Starting-level assessment (extends the existing fitness check)
| Question | Used for |
|---|---|
| Days a week you have been active over the last three months (0, 1–2, 3+) | Both |
| Strength training in the last six months (none, some, twice a week or more) | Strength |
| Time since you last trained regularly (over a year, 3–12 months, under 3 months) | Both |
| Push-ups in a row (existing) | Strength |
| Plank hold in seconds (existing) | Strength |
| Can you walk briskly for 30 minutes without stopping? (existing) | Cardio |
| Can you keep up steady effort for 45 minutes? | Cardio |
| Joint or mobility limits (which) | Exercise swaps, not level |
| How do you recover: sore for a day, or for several? | Caps the level |
| Hours a week you can commit | Suggests Full or Minimum week |
| Equipment (existing) | Equipment mode |

### 8.3 Recommendation rule, shown to the user in plain words
| Level | Strength | Cardio |
|---|---|---|
| Advanced | Strength training twice a week or more for six months, and 15+ push-ups, and a 60 s plank | Active 3+ days a week, and 45 minutes steady |
| Standard | Some strength training in the last six months, or 8+ push-ups and a 30 s plank | Brisk 30-minute walk: yes |
| Foundation | Everything else | Everything else |

- Missing answers count as the cautious answer.
- "Sore for several days" or more than a year away from training caps the recommendation one level lower.
- The app shows the recommendation with the reasons, for example: "Standard strength, Foundation cardio, because you lift regularly but can't yet walk briskly for 30 minutes."
- He can always choose a lower level. Choosing higher needs the readiness check in section 9.

---

## 9. Changing level

- **Down:** immediate, any time, one tap, no questions. Strength and cardio separately.
- **Up:** offered at the four-weekly checks and at each stage review, never automatically. It requires him to confirm:
  - at least three of the last four weeks' sessions completed;
  - sets finished with reps in reserve;
  - no pain, and no symptoms on the health screen;
  - recovering within a day or two.
- **Transition:** two weeks at the new level's exercises and reps with the previous level's set count, then the full prescription.
- **Never used to promote:** age, weeks elapsed, snore score, CPAP readings.
- **Stays put:** the program week and stage, all records. Every completed session already stores the scheme it was done at, and each change is added to a level history.

---

## 10. Application architecture and migration

### 10.1 Configuration
Added to the existing profile, with no second source of truth:

| Field | Meaning |
|---|---|
| `level.strength`, `level.cardio` | `F`, `S` or `A` |
| `level.recommended` | Last recommendation and the answers behind it |
| `level.transitionUntil` | End date of a two-week step-up, if any |
| `weekPlan` | `full` or `min` (today's `std` is read as `full`) |
| `overrides` | Exercise swaps by slot |
| `screen` | Health screen answers and date |
| `levelLog` | Every level change with date, week and reason |
| `rxVersion` | Version of the prescription rules, starting at 2 |

Program week and stage stay derived from the start date. Equipment and cardio activity stay where they are.

### 10.2 Prescription engine
- One function: week + strength level + cardio level + equipment + week plan → the day's session.
- Level tables hold only the numbers in sections 4 and 5. The exercise library is shared and gains a "minimum level" tag on five slots.
- Advanced reproduces today's output exactly; the existing snapshot test enforces it.
- Session length is calculated from sets and rest, replacing the fixed 50 minutes.

### 10.3 Migration (data version 2 to 3)
- Adds fields only. An untouched copy of version 2 data is kept on the device, as was done for version 1.
- **Existing users keep exactly what they have today**, which is the Advanced prescription. Nothing gets harder.
- On first open they see one card: "Breathe Strong now has three training levels. You're on the original plan (Advanced). Take the two-minute check to see if another level suits you better." They can dismiss it.
- New users take the health screen and assessment during set-up. Skipping them starts at Foundation.
- Backup files, restore and cloud records in the older format keep loading.

### 10.4 Full week and Minimum week
- Renamed from Standard and Minimum to **Full week** and **Minimum week**, so "Standard" means only the training level.
- Available from week 1 at every level, not only from week 44.
- Minimum week: two strength and two cardio sessions. The daily airway, breathing and evening routines are never reduced.

### 10.5 Screens
| Screen | Change |
|---|---|
| Set-up | Health screen, then the assessment, then the recommendation with reasons |
| Today | "RECLAIM · Week 28 of 52 · Training level: STANDARD", session length, a "Make today easier" option |
| Workout | Sets, reps, reps-in-reserve target and rest for the level; exercise swap |
| Settings → Training level | Current strength and cardio levels, what each level means, the recommendation, change controls, reassess, what changes and what stays the same |
| Reviews | Optional readiness check at four-weekly checks and stage reviews |

---

## 11. Review requirements

For a qualified exercise professional and a clinician before public release.

| # | Item |
|---|---|
| L1 | The whole of sections 4 and 5: sets, reps, effort targets and session lengths at each level |
| L2 | Foundation's exercise selection, and the choice to leave out overhead pressing, hanging and resisted neck work |
| L3 | Foundation starting at one set, and two sessions a week through Awaken |
| L4 | Advanced: 4–6 rep work at 1–2 reps in reserve for men over 40 (carried over from today) |
| L5 | Health screen wording, what a "yes" restricts, and the 12-week repeat |
| L6 | Recommendation thresholds: 15 push-ups, 60 s plank, 30 and 45 minutes |
| L7 | Readiness criteria for moving up, and the two-week transition |
| L8 | Interval criteria for Foundation, and interval structure at each level |
| L9 | Breath-hold walks: kept only as an option at Advanced. Recommend removal unless a clinician supports them |
| L10 | Neck work at every level: holds, resisted work, Shaker head lift, contraindications |
| L11 | Respiratory trainer protocol and calibration guidance by device |
| L12 | Breathing technique under load, and the symptoms that mean stop |
| L13 | Minimum week from week 1: is two and two enough to progress? |
| L14 | The session-length estimates behind the weekly hours |

No wording in the app or on the website will say that heavier lifting or a stronger neck reduces airway obstruction, and no level, fitness result, snore score or adherence figure will be used to suggest reducing treatment.

---

## 12. Implementation and testing plan

| Stage | Work | Check |
|---|---|---|
| A | Prescription engine with level tables; Advanced only switched on | Existing snapshot still matches exactly |
| B | Standard and Foundation tables | Matrix test: 3 strength levels × 3 cardio levels × 52 weeks × 4 equipment modes × 2 week plans × 5 cardio activities. No missing or undefined values, valid ranges, weekly hours match section 7 |
| C | Data version 3 and migration | Version 1 and 2 records survive; existing users' prescription is byte-for-byte unchanged |
| D | Health screen and assessment in set-up; recommendation | Every answer combination gives a level; any "yes" on the screen caps and restricts |
| E | Training level settings, level change, transition, history | Down is immediate; up needs the check; transition lasts two weeks; history kept |
| F | Today and workout screens, session lengths, Full and Minimum week from week 1 | Screens at phone and desktop widths, every stage and level |
| G | Review and sign-off of section 11 | Recorded |
| H | Switch on and release | Owner approval |
| I | Website: "Three training levels. One mission." section, level selector on the typical week, updated hours, FAQ, membership wording | Only after H |

All five existing test suites stay and must keep passing. No payment work is included.

---

## 13. Decisions needed from the owner

1. **Approve the level tables** in sections 4 and 5, or mark changes.
2. **Advanced = today's program.** Agree that existing testers stay on it unchanged and are offered the check.
3. **Foundation's shorter exercise list** (no overhead press, shrugs, hanging or resisted neck work by default).
4. **Breath-hold walks:** keep as an Advanced option, or remove.
5. **New users who skip the assessment start at Foundation.**
6. **Rename to Full week and Minimum week, available from week 1.**
7. **Professional review** (section 11) before or after the build.
