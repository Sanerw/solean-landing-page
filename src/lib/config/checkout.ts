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

/**
 * The Mixpanel identity the order was placed by, so a purchase can be joined back to the
 * person who walked the funnel. **Nothing reads it yet**, and that is the point: its consumer
 * is the deferred Shopify `orders/paid` webhook, and an order placed before that exists still
 * carries the key, so the import can reach it retroactively.
 *
 * Underscored like the anamnesis key, which is Shopify's convention for an attribute the
 * customer should not see: theirs is plumbing for RxScale, this one is plumbing for us, and
 * neither belongs on somebody's order confirmation.
 */
export const MIXPANEL_ATTRIBUTE_KEY = '_mixpanel_distinct_id';
