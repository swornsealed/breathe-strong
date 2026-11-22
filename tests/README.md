# Tests

Needs Node and Playwright with Chromium. Run from the repository root.

- `node tests/check-plan.js` compares the plan the app produces for every day of weeks 1 to 30,
  in each equipment mode, with the recorded snapshot in `tests/golden/plan-v1.json`.
- `node tests/check-plan.js --write` re-records the snapshot. Only do this when a change to the
  plan is intended and approved.

The tests never modify `index.html`. See the comments in `harness.js`.
