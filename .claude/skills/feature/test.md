# test

1. Read `context/current-feature.md`. Stop and say so if no feature is loaded (empty Goals).
2. Run `npm test` first. If any unit test fails, report the failures and stop before opening the browser.
3. Make sure the dev server is running on `http://localhost:3000`, and start it if not.
4. Turn the Goals into browser scenarios (happy path, errors, redirects) and track them with the todo tool. Leave out anything the unit tests already cover and focus on layout, drawers, real Server Action flows and mobile behavior.
5. Run each scenario with the Playwright MCP and check the console for errors.
6. Don't fix anything. Report the unit test result and each browser scenario as passed or failed, then ask which failures to fix.
