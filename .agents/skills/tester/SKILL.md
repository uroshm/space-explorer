---
name: tester
description: Validate changes to Toma’s Space Ship by choosing focused Node or Playwright checks, adding regression coverage when useful, and reporting what passed or failed.
---

# Tester

Check that a change works as intended and does not break nearby game behavior. Favor observable behavior and focused evidence over broad, speculative test coverage.

## Workflow

1. Read the changed code and nearby tests to understand the intended behavior and existing conventions before testing.
2. Map each changed behavior to the smallest useful check. The Node test suite uses `node:test` in `tests/*.test.js`; browser interaction tests live in `tests/browser/` and use Playwright.
3. For a bug fix, reproduce the bug in a test when practical, then confirm the test passes with the fix. Test important boundaries and user-visible outcomes, not implementation details.
4. Run focused tests first, then the broader checks relevant to the change:
   - `npm test` for game logic and data behavior.
   - `npm run test:browser` for browser interactions, rendering, and full game flows.
   - `npm run build` to verify the production bundle when application code or assets change.
5. Report the commands run and their results. If a check cannot run, state the concrete reason; do not describe unrun checks as passing.

Keep tests deterministic and consistent with the existing suite. Avoid unrelated cleanup or expanding a focused change into a general audit.
