# Playwright Automation Template

A reusable Playwright Test and TypeScript starter for UI automation. It is intentionally small, runs successfully immediately after setup, and can be extended with project-specific page objects, fixtures, and tests.

## Included

- TypeScript with strict type-checking
- Chromium, Firefox, and WebKit projects
- Page Object Model example
- A custom fixture that is used by the example test
- Sanity-test folder and npm scripts
- Environment-specific configuration without committed secrets
- Traces, screenshots, and videos on failure
- GitHub Actions with type-checking and HTML report artifacts
- `AGENTS.md` instructions for coding agents

## Create a project from this template

1. Select **Use this template** on GitHub and create a new repository.
2. Clone the new repository and enter its directory.
3. Install dependencies and browsers:

```bash
npm ci
npx playwright install
```

4. Create your local environment file:

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

5. Set `E2E_BASE_URL` in `.env`, then replace the example page object and test with your application flows.

The checked-in defaults use `https://example.com`, so a fresh clone and CI run are green without credentials.

## Environment configuration

```dotenv
E2E_BASE_URL=https://example.com
E2E_USERNAME=
E2E_PASSWORD=
```

Do not commit `.env` or environment-specific files. The template deliberately uses `E2E_USERNAME` instead of `USERNAME`, which is already a Windows environment variable.

To load a named file such as `.env.staging`:

PowerShell:

```powershell
$env:TEST_ENV = 'staging'
npm test
```

macOS/Linux:

```bash
TEST_ENV=staging npm test
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Run all tests in all configured browsers |
| `npm run test:sanity` | Run tests under `tests/sanity` |
| `npm run test:chromium` | Run all tests in Chromium |
| `npm run test:headed` | Run Chromium with a visible browser |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run test:debug` | Debug with Playwright Inspector |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm run check` | Type-check and run the sanity suite |
| `npm run report` | Open the last HTML report |

## Structure

```text
src/
  fixtures/       Custom Playwright fixtures
  pages/          Reusable page objects
  utils/          Environment and shared utilities
tests/
  sanity/         Fast checks of critical user-visible behavior
.github/workflows/playwright.yml
AGENTS.md
playwright.config.ts
```

## Adding a page and test

1. Create a page object under `src/pages`.
2. Add it to `src/fixtures/test-fixtures.ts` when multiple tests need it.
3. Write an independent test under the appropriate `tests` folder.
4. Prefer `getByRole`, `getByLabel`, or `getByTestId` locators.
5. Run `npm run typecheck` and the relevant tests before committing.

Playwright already provides auto-waiting, traces, and detailed HTML reports. Avoid fixed sleeps and wrapper methods that merely duplicate `locator.click()` or `locator.fill()`.

## CI

The included workflow runs on pushes and pull requests to `main`. It installs dependencies and browsers, type-checks the repository, runs the complete test suite, and uploads the HTML report even when tests fail.
