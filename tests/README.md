# Tests

Needs Node and Playwright with Chromium. Run from the repository root.

- `node tests/check-plan.js` compares the plan against the snapshot recorded from the original app in
  `tests/golden/plan-v1.json`: weeks 1 to 24 as released, and weeks 1 to 30 in original mode.
- `node tests/check-plan.js --write` re-records the snapshot. Only do this when a change to the
  plan is intended and approved.

- `node tests/check-migrate.js` loads version 1 saved data (phone-only, cloud, backup file, a user
  past week 24) and confirms every field survives the upgrade to version 2.
- `node tests/check-year.js` switches on weeks 25 to 52 and checks them against section 2.4 of
  `docs/52-week/program-plan.md`, and confirms weeks 1 to 24 are unaffected.

- `node tests/check-screens.js` drives the screens: stage navigation, the full-year calendar and
  milestones, cardio choice, the Minimum week, recovery guidance and load suggestions, and confirms
  the default screens are unchanged. Add `--shots` to save screenshots to `tests/shots/`.

- `node tests/check-reviews.js` covers stage reviews, goals, the sleep-quality rating, the year view
  and the history added to the clinician summary, including a check that no review text suggests
  reducing or stopping treatment.

- `node tests/check-levels.js` covers the three training levels: every combination of strength level,
  cardio level, equipment, week plan and week; Foundation and Standard against
  `docs/three-levels/training-levels-plan.md`; level changes, the two-week step-up, the health check
  and new-user set-up.

The 52-week program is on by default. To see the original 24-week behaviour in a browser, run
`localStorage.setItem('bs-year52','0')` in the console and reload; remove the key to switch back.

The tests never modify `index.html`. See the comments in `harness.js`.
