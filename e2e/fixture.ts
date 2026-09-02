/** Shared by the Playwright config and the specs, so the harness and the app agree. */
export const FIXTURE_PORT = 4319;
export const FIXTURE_UID = 'fixture-questionnaire';
export const FIXTURE_IDENTIFIER = 'FIXTURE: trimmed MedQ recommender';
export const FIXTURE_PAGES = 11;
export const FIXTURE_ELEMENTS = 15;

/**
 * The checkout configuration the preview server runs with. Pointing the store domain at the
 * fixture is what keeps the harness from creating a cart in the real shop.
 */
export const FIXTURE_STORE_DOMAIN = `http://localhost:${FIXTURE_PORT}`;
export const FIXTURE_VARIANT_ID = '49703576666445';

/** The prescription-only listing, which the fixture recommendation offers beside the plan. */
export const FIXTURE_PRESCRIPTION_VARIANT_ID = '48233241215309';

/**
 * The shop RxScale keys the recommendation by. The storefront hostname rather than the
 * myshopify domain, which is what the live service accepts; here it is the fixture itself.
 */
export const FIXTURE_SHOP_IDENTIFIER = `localhost:${FIXTURE_PORT}`;

/**
 * The app reads Sanity through the fixture during a browser run, so the suite is deterministic
 * and puts no traffic on the Content Lake. Regenerate the response with
 * `node scripts/generate-sanity-fixture.mjs` when the article query or the article changes.
 */
export const FIXTURE_SANITY_API_HOST = `http://localhost:${FIXTURE_PORT}`;

/**
 * Analytics during a browser run. The token is a fixture one and every request to Mixpanel is
 * intercepted by `analytics.spec.ts`, so a run sends nothing to the real service, but the app
 * still has to believe it is configured or the consent banner would never render.
 */
export const FIXTURE_MIXPANEL_TOKEN = 'fixture-mixpanel-token';

/**
 * The whole suite runs with analytics already declined. The consent banner is fixed to the
 * bottom of the viewport and would sit over the Continue button every other spec presses, and
 * a declined visitor is also the one state in which no spec can accidentally reach Mixpanel.
 * `analytics.spec.ts` clears this for itself, because the banner is what it is about.
 */
export const CONSENT_DENIED_STATE = {
	cookies: [
		{
			name: 'solean_analytics_consent',
			value: 'denied',
			domain: 'localhost',
			path: '/',
			expires: -1,
			httpOnly: false,
			secure: false,
			sameSite: 'Lax' as const
		}
	],
	origins: []
};
