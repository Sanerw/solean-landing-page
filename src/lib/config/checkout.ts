/**
 * The parts of the checkout that are Solean's choice rather than RxScale's, and are not
 * secret. The key, the shop and the SKU are private and live in the server environment.
 */

/** Shopify's country code for the buyer. Assumed, not derived: this build ships to Germany. */
export const CHECKOUT_COUNTRY_CODE = 'DE';

/** The model's own name for the question that collects the buyer's e-mail. */
export const EMAIL_QUESTION_NAME = 'EMail';
