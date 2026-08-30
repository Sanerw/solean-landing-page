export interface Money {
	amount: number;
	currency: 'EUR';
}

/** Amounts are integer minor units, so a euro figure never meets a float. */
export function eur(cents: number): Money {
	return { amount: Math.round(cents), currency: 'EUR' };
}

/**
 * The reference writes prices as `144.00 EUR`, so that is the shape here too. A negative
 * amount keeps its sign, because the discount line is read as a subtraction.
 */
export function formatEur(money: Money): string {
	return `${(money.amount / 100).toFixed(2)} ${money.currency}`;
}
