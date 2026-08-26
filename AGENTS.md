# Repository instructions

- Use TypeScript and Playwright Test for browser automation.
- Put user-facing sanity checks in `tests/sanity` and reusable page objects in `src/pages`.
- Import `test` and `expect` from `src/fixtures/test-fixtures.ts` when custom fixtures are needed.
- Prefer accessible, user-facing locators: `getByRole`, `getByLabel`, and `getByTestId`.
- Avoid CSS/XPath selectors, fixed sleeps, test ordering, and shared mutable state.
- Never log credentials, tokens, cookies, or values entered into password fields.
- Keep tests independent and use Playwright auto-waiting assertions.
- Run `npm run typecheck` and the narrowest relevant test before reporting completion.
- Preserve unrelated changes and do not commit `.env`, reports, traces, videos, or browser state.
