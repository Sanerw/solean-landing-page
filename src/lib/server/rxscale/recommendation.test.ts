import { describe, expect, it } from 'vitest';
import { toRecommendedPlans } from './recommendation';

/**
 * The mapper decides what a person may buy, so the cases here are the ones where being
 * wrong costs something: an unselectable dose reaching the screen, or a listing from
 * another shop lending its variant id to this one.
 */

const SHOP = 'mygina.myshopify.com';

function offer(overrides: Record<string, unknown> = {}) {
	return {
		product: { uid: 'product-1', display_name: 'Mounjaro®' },
		shop_data: { title: 'Mounjaro®', featuredImage: { url: 'https://cdn/img.png' } },
		skus: [
			{
				selectable: true,
				pre_selected: true,
				shop_data: { displayName: 'Mounjaro® - 2.5 mg' },
				sku: {
					display_name: '2.5 mg',
					digital: false,
					therapy_duration: 30,
					shop_skus: [{ price: 29900, shop: { identifier: SHOP }, shop_variation_id: '111' }]
				}
			}
		],
		...overrides
	};
}

describe('toRecommendedPlans', () => {
	it('reads the variant, price and dose of a selectable offer', () => {
		const [plan] = toRecommendedPlans([offer()], SHOP);

		expect(plan.name).toBe('Mounjaro®');
		expect(plan.image).toBe('https://cdn/img.png');
		expect(plan.prescriptionOnly).toBe(false);
		expect(plan.options).toEqual([
			{
				variantId: '111',
				label: '2.5 mg',
				price: { amount: 29900, currency: 'EUR' },
				therapyDays: 30,
				preSelected: true
			}
		]);
	});

	it('drops a dose RxScale did not mark selectable', () => {
		const refused = offer({
			skus: [{ ...offer().skus[0], selectable: false }]
		});

		expect(toRecommendedPlans([refused], SHOP)).toEqual([]);
	});

	it('ignores a listing that belongs to another shop', () => {
		const elsewhere = offer({
			skus: [
				{
					...offer().skus[0],
					sku: {
						...offer().skus[0].sku,
						shop_skus: [
							{ price: 100, shop: { identifier: 'other.myshopify.com' }, shop_variation_id: '999' }
						]
					}
				}
			]
		});

		expect(toRecommendedPlans([elsewhere], SHOP)).toEqual([]);
	});

	it('marks a digital sku as prescription only', () => {
		const prescription = offer({
			skus: [
				{
					...offer().skus[0],
					sku: { ...offer().skus[0].sku, digital: true, display_name: '2.5 mg digital' }
				}
			]
		});

		expect(toRecommendedPlans([prescription], SHOP)[0].prescriptionOnly).toBe(true);
	});

	// Shopify's placeholder for a product with no variants. Rendered, it would sit under a
	// heading already saying the product's name.
	it('leaves out a label that names no dose', () => {
		const single = offer({
			skus: [
				{
					...offer().skus[0],
					shop_data: { displayName: 'Mounjaro® - Default Title' },
					sku: { ...offer().skus[0].sku, display_name: 'Default Title' }
				}
			]
		});

		expect(toRecommendedPlans([single], SHOP)[0].options[0].label).toBe('');
	});

	// Live listings carry the duration as a number, as a numeric string, or not at all, and
	// the screen only says "30-day treatment" when RxScale actually recorded one.
	it('reads a therapy duration however the listing states it, and nothing when it does not', () => {
		const withDuration = (therapy_duration: unknown) =>
			offer({
				skus: [
					{
						...offer().skus[0],
						sku: { ...offer().skus[0].sku, therapy_duration }
					}
				]
			});

		expect(toRecommendedPlans([withDuration('28')], SHOP)[0].options[0].therapyDays).toBe(28);
		expect(toRecommendedPlans([withDuration(null)], SHOP)[0].options[0].therapyDays).toBeNull();
		expect(toRecommendedPlans([withDuration('a month')], SHOP)[0].options[0].therapyDays).toBeNull();
		expect(toRecommendedPlans([withDuration(0)], SHOP)[0].options[0].therapyDays).toBeNull();
	});

	it('takes an empty recommendation as an answer, not a failure', () => {
		expect(toRecommendedPlans([], SHOP)).toEqual([]);
	});

	// The store domain may carry a scheme so the harness can point it at the fixture.
	it('compares the shop bare of its scheme', () => {
		expect(toRecommendedPlans([offer()], `https://${SHOP}/`)).toHaveLength(1);
	});
});
