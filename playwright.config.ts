import { defineConfig, devices } from '@playwright/test';
import {
	FIXTURE_PORT,
	FIXTURE_PRESCRIPTION_VARIANT_ID,
	FIXTURE_SANITY_API_HOST,
	FIXTURE_SHOP_IDENTIFIER,
	FIXTURE_STORE_DOMAIN,
	FIXTURE_UID,
	FIXTURE_VARIANT_ID
} from './e2e/fixture';

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
	webServer: [
		// The questionnaire model comes from the fixture, never the live RxScale API: the run
		// must be deterministic and must not put traffic on someone else's production service.
		{
			command: 'node e2e/fixture-server.mjs',
			url: `http://localhost:${FIXTURE_PORT}/api/v2/anamnesis/questionnaires/${FIXTURE_UID}`,
			reuseExistingServer: !process.env.CI,
			env: {
				FIXTURE_PORT: String(FIXTURE_PORT),
				FIXTURE_QUESTIONNAIRE_UID: FIXTURE_UID,
				FIXTURE_VARIANT_ID,
				FIXTURE_PRESCRIPTION_VARIANT_ID
			}
		},
		{
			// The production build, not `vite dev`. Journey state is client-owned and hydration
			// sensitive, so the preview output is the surface worth asserting against.
			command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
			url: `http://localhost:${PORT}`,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				PUBLIC_RXSCALE_API_BASE_URL: `http://localhost:${FIXTURE_PORT}`,
				PUBLIC_RXSCALE_QUESTIONNAIRE_UID: FIXTURE_UID,
				// The checkout handoff, pointed at the same fixture. Without this the endpoint
				// would either refuse for want of configuration or, worse, create a cart in the
				// real shop.
				PUBLIC_SHOPIFY_STORE_DOMAIN: FIXTURE_STORE_DOMAIN,
				SHOPIFY_VARIANT_ID: FIXTURE_VARIANT_ID,
				// The recommendation, served by the same fixture. Without a shop identifier the
				// call is not made at all and every plan would come from the fallback.
				PUBLIC_RXSCALE_SHOP_IDENTIFIER: FIXTURE_SHOP_IDENTIFIER,
				// The Learn article's content. Without this the run would read the live Content
				// Lake, and an editorial change in the Studio could turn the suite red.
				PUBLIC_SANITY_API_HOST: FIXTURE_SANITY_API_HOST
			}
		}
	]
});
