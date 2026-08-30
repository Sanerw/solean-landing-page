import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	reporter: 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		// Kept for a failure only: a trace per passing run is a lot of disk for no information.
		trace: 'retain-on-failure'
	},
	// Chromium alone. The prototype makes no cross-browser claim, and two more engines would
	// triple the download and the run for coverage nothing currently depends on.
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		// The production build, not `vite dev`. Journey state is client-owned and hydration
		// sensitive, so the preview output is the surface worth asserting against.
		command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
