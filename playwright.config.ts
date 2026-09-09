import { defineConfig, devices } from '@playwright/test';
import {
	CONSENT_DENIED_STATE,
	FIXTURE_MIXPANEL_TOKEN,
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
		// A German browser, because the site now reads `Accept-Language` and Chromium's own
		// default is `en-US`. Without this every bare path, which is to say every German
		// address the suite asserts, would answer 307 to its `/en` twin. The German specs
		// navigate as the market does; the English ones by the prefix, which outranks the
		// header for a visitor who has chosen nothing.
		locale: 'de-DE',
		storageState: CONSENT_DENIED_STATE,
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
			// The build, not the server, is what this waits for. It takes about 25 seconds on an
			// idle machine and several minutes on a busy one, because `enhanced:img` encodes
			// every panel source to avif, webp and jpeg at each width in its ladder and that
			// work is CPU bound. At 120s a developer with a dev server already running failed
			// the whole run before a single test executed, which reads as a broken suite rather
			// than a slow one. The headroom costs nothing when the build is quick.
			timeout: 300_000,
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
				PUBLIC_SANITY_API_HOST: FIXTURE_SANITY_API_HOST,
				// A fixture token, so the consent banner exists to be tested. Nothing reaches
				// Mixpanel: the suite runs declined and the analytics spec intercepts the host.
				PUBLIC_MIXPANEL_TOKEN: FIXTURE_MIXPANEL_TOKEN,
				// Blank on purpose, and load-bearing. `.env` is still read for anything this block
				// does not override, so without these lines every run would enrol its walked-through
				// addresses as real people on the real Customer.io workspace. Both have to be
				// blanked: the client treats a half-configured pair as unconfigured, but leaving one
				// set would make that an accident rather than the intent. An unconfigured deployment
				// is what the reminder spec asserts against.
				CUSTOMERIO_SITE_ID: '',
				CUSTOMERIO_TRACK_API_KEY: ''
			}
		}
	]
});
