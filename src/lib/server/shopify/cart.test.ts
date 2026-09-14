import { describe, expect, it } from 'vitest';
import {
	ANAMNESIS_ATTRIBUTE_KEY,
	CHECKOUT_COUNTRY_CODE,
	MIXPANEL_ATTRIBUTE_KEY
} from '$lib/config/checkout';
import { buildCartInput, safeDistinctId, type CartRequest } from './cart';

/**
 * The rules that make an order reviewable, asserted against the input the shop is actually
 * sent. `project-overview.md` has named this builder as in-scope coverage since feature 9 and
 * it had none until feature 29c touched it.
 */
const REQUEST: CartRequest = {
	anamnesisUid: 'anam-1234',
	email: 'jonas@example.com',
	variantId: '49703544684877'
};

function built(request: Partial<CartRequest> = {}) {
	const input = buildCartInput({ ...REQUEST, ...request });
	if ('ok' in input) throw new Error(`expected a cart, got ${input.reason}`);

	return input;
}

describe('buildCartInput', () => {
	it('refuses without an anamnesis, because the order could not be reviewed', () => {
		// The one refusal that is the point of the whole attribute: RxScale reads the record off
		// the order, so a cart without one produces a purchase no doctor can match to answers.
		expect(buildCartInput({ ...REQUEST, anamnesisUid: '   ' })).toEqual({
			ok: false,
			reason: 'missing-anamnesis'
		});
	});

	it('refuses without a variant, because there is nothing to buy', () => {
		expect(buildCartInput({ ...REQUEST, variantId: '' })).toEqual({
			ok: false,
			reason: 'not-configured'
		});
	});

	it('carries the anamnesis on the order and never on a line', () => {
		const input = built();

		// RxScale resolves from the line to its group to the order, so the order level is what
		// reaches the components a bundle expands into. A line property would have to be
		// repeated for each of them and would miss the ones this app never sees.
		expect(input.attributes).toContainEqual({
			key: ANAMNESIS_ATTRIBUTE_KEY,
			value: 'anam-1234'
		});
		expect(input.lines).toEqual([
			{ merchandiseId: expect.stringContaining('49703544684877'), quantity: 1 }
		]);
		expect(JSON.stringify(input.lines)).not.toContain(ANAMNESIS_ATTRIBUTE_KEY);
	});

	it('names the variant as a Shopify gid, and leaves one that already is', () => {
		expect(built().lines[0]?.merchandiseId).toBe(
			'gid://shopify/ProductVariant/49703544684877'
		);
		expect(built({ variantId: 'gid://shopify/ProductVariant/1' }).lines[0]?.merchandiseId).toBe(
			'gid://shopify/ProductVariant/1'
		);
	});

	it('prefills the e-mail when there is one, and is complete without it', () => {
		expect(built().buyerIdentity).toEqual({
			countryCode: CHECKOUT_COUNTRY_CODE,
			email: 'jonas@example.com'
		});

		// Shopify collects an address at checkout, so an answer set with no e-mail is an order
		// without a prefill rather than an order that cannot be placed.
		expect(built({ email: '  ' }).buyerIdentity).toEqual({
			countryCode: CHECKOUT_COUNTRY_CODE
		});
	});

	it('carries the analytics identity beside the anamnesis, on the order', () => {
		const input = built({ mixpanelDistinctId: 'jonas@example.com' });

		expect(input.attributes).toEqual([
			{ key: ANAMNESIS_ATTRIBUTE_KEY, value: 'anam-1234' },
			{ key: MIXPANEL_ATTRIBUTE_KEY, value: 'jonas@example.com' }
		]);
		expect(JSON.stringify(input.lines)).not.toContain(MIXPANEL_ATTRIBUTE_KEY);
	});

	it('omits the identity rather than sending an empty one', () => {
		// A visitor who declined analytics has no distinct id, and a deployment with no token
		// never had one. Both are ordinary states, and an empty attribute would be a join key
		// that matches nothing while looking like one that does.
		for (const distinctId of [undefined, '', '   ']) {
			const keys = built({ mixpanelDistinctId: distinctId }).attributes.map((a) => a.key);

			expect(keys).toEqual([ANAMNESIS_ATTRIBUTE_KEY]);
		}
	});

	it('sends exactly two attributes and no third', () => {
		// The assertion is the whole set rather than the absence of a known-bad key, so a field
		// added to `CartRequest` later fails here instead of reaching the shop.
		expect(built({ mixpanelDistinctId: 'jonas@example.com' }).attributes).toHaveLength(2);
	});
});

describe('safeDistinctId', () => {
	it('keeps an ordinary identity, trimmed', () => {
		expect(safeDistinctId('  jonas@example.com ')).toBe('jonas@example.com');
		expect(safeDistinctId('$device:6dbb1f0e-3b4a-4a37-9d1e-2f1c0b6a5d44')).toBe(
			'$device:6dbb1f0e-3b4a-4a37-9d1e-2f1c0b6a5d44'
		);
	});

	it('drops nothing-at-all rather than sending an empty attribute', () => {
		expect(safeDistinctId('')).toBeUndefined();
		expect(safeDistinctId('   ')).toBeUndefined();
	});

	it('drops a value long enough to be somebody filling an order attribute', () => {
		expect(safeDistinctId('a'.repeat(100))).toBe('a'.repeat(100));
		expect(safeDistinctId('a'.repeat(101))).toBeUndefined();
	});

	it('drops a control character rather than carrying it into an order', () => {
		// It would be read back by whatever parses the attribute later, so it is refused here
		// rather than escaped somewhere downstream.
		for (const value of ['jonas\u0000@example.com', 'jonas\nexample', 'jonas\u007f']) {
			expect(safeDistinctId(value)).toBeUndefined();
		}
	});

	it('never throws, whatever it is handed', () => {
		// Its caller is the checkout click. Every failure mode here has to end in a missing
		// attribute, never in a refused order.
		expect(() => safeDistinctId('\u0001'.repeat(500))).not.toThrow();
	});
});
