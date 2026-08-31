/** Shared by the Playwright config and the specs, so the harness and the app agree. */
export const FIXTURE_PORT = 4319;
export const FIXTURE_UID = 'fixture-questionnaire';
export const FIXTURE_IDENTIFIER = 'FIXTURE: trimmed MedQ recommender';
export const FIXTURE_PAGES = 11;
export const FIXTURE_ELEMENTS = 15;

/**
 * The private checkout configuration the preview server runs with. Not secrets: the fixture
 * only checks that the app sends the key it was configured with, and pointing the base URL at
 * the fixture is what keeps the harness from creating a real Shopify cart.
 */
export const FIXTURE_API_KEY = 'fixture-api-key';
export const FIXTURE_SHOP = 'fixture-shop';
export const FIXTURE_SKU = 'fixture-sku';
