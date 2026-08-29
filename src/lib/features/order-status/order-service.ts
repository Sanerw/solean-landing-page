import type { OrderStatus } from '$lib/domain';

/** Each of the six presented states is reachable directly, without walking the funnel. */
const SEEDED_ORDERS = new Map<string, OrderStatus>([
	['mock-review', 'review-in-progress'],
	['mock-approved', 'approved'],
	['mock-declined', 'declined'],
	['mock-info-required', 'more-information-required'],
	['mock-prescription-issued', 'prescription-issued'],
	['mock-dispatched', 'dispatched']
]);

export interface OrderService {
	getStatus(orderId: string): OrderStatus | null;
	listSeededOrderIds(): string[];
}

class MockOrderService implements OrderService {
	getStatus(orderId: string): OrderStatus | null {
		return SEEDED_ORDERS.get(orderId) ?? null;
	}

	listSeededOrderIds(): string[] {
		return [...SEEDED_ORDERS.keys()];
	}
}

export const orderService: OrderService = new MockOrderService();
