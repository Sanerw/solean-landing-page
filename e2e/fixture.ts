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
export const FIXTURE_VARIANT_ID = '49703544684877';
