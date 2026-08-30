/**
 * The one treatment the recommendation presents. No recommendation is computed from the
 * answers and the catalogue is never queried: the plan says one configured SKU, and this is
 * where that choice is stated.
 *
 * Feature 13 adds the RxScale SKU uid the checkout call needs. It is a private value and
 * belongs in the server environment, not beside this one.
 */
export const RECOMMENDED_TREATMENT_ID = 'wegovy';
