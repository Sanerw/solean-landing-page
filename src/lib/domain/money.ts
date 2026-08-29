export interface Money {
	amount: number;
	currency: 'EUR';
}

/** Amounts are integer minor units, so the pricing engine never meets a float. */
export function eur(cents: number): Money {
	return { amount: Math.round(cents), currency: 'EUR' };
}

/** Renders `€144.00`, the presentation used throughout the design reference. */
export function formatMoney({ amount }: Money): string {
	const sign = amount < 0 ? '-' : '';
	const absolute = Math.abs(amount);
	const euros = Math.trunc(absolute / 100);
	const cents = absolute % 100;

	return `${sign}€${euros}.${String(cents).padStart(2, '0')}`;
}
