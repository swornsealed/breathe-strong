# Tests

Needs Node and Playwright with Chromium. Run from the repository root.

- `node tests/check-plan.js` compares the plan the app produces for every day of weeks 1 to 30,
  in each equipment mode, with the recorded snapshot in `tests/golden/plan-v1.json`.
- `node tests/check-plan.js --write` re-records the snapshot. Only do this when a change to the
  plan is intended and approved.

- `node tests/check-migrate.js` loads version 1 saved data (phone-only, cloud, backup file, a user
  past week 24) and confirms every field survives the upgrade to version 2.
- `node tests/check-year.js` switches on weeks 25 to 52 and checks them against section 2.4 of
  `docs/52-week/program-plan.md`, and confirms weeks 1 to 24 are unaffected.

Weeks 25 to 52 are off by default. To try them in a browser, run
`localStorage.setItem('bs-year52','1')` in the console and reload; remove the key to switch back.

The tests never modify `index.html`. See the comments in `harness.js`.
