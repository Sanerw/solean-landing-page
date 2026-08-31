/**
 * The parts of the checkout that are Solean's choice rather than the shop's. The store domain
 * and the variant vary per deployment and live in the server environment; nothing on this
 * path is secret.
 */

/** Shopify's country code for the buyer. Assumed, not derived: this build ships to Germany. */
export const CHECKOUT_COUNTRY_CODE = 'DE';

/** The model's own name for the question that collects the buyer's e-mail. */
export const EMAIL_QUESTION_NAME = 'EMail';

/**
 * The order attribute RxScale reads the anamnesis off. Compared character for character and
 * case-sensitively at their end, and a mismatch is ignored without a word, so this is one
 * constant and is never assembled from parts.
 */
export const ANAMNESIS_ATTRIBUTE_KEY = '_anamnesis_uid';
