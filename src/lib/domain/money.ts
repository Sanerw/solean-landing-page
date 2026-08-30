export interface Money {
	amount: number;
	currency: 'EUR';
}

/** Amounts are integer minor units, so a euro figure never meets a float. */
export function eur(cents: number): Money {
	return { amount: Math.round(cents), currency: 'EUR' };
}
