import { writable, derived } from 'svelte/store';
import type { MenuItem } from '../types';

export interface CartItem {
	item: MenuItem;
	quantity: number;
	instructions: string;
}

function createCartStore() {
	const { subscribe, set, update } = writable<CartItem[]>([]);

	return {
		subscribe,
		addItem: (item: MenuItem, instructions = '') => {
			update((items) => {
				const existing = items.find((i) => i.item.id === item.id);
				if (existing) {
					return items.map((i) =>
						i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
					);
				}
				return [...items, { item, quantity: 1, instructions }];
			});
		},
		removeItem: (itemId: string) => {
			update((items) => {
				const existing = items.find((i) => i.item.id === itemId);
				if (existing && existing.quantity > 1) {
					return items.map((i) =>
						i.item.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
					);
				}
				return items.filter((i) => i.item.id !== itemId);
			});
		},
		clear: () => set([])
	};
}

export const cart = createCartStore();

export const cartCount = derived(cart, ($cart) =>
	$cart.reduce((sum, item) => sum + item.quantity, 0)
);

export const cartSubtotal = derived(cart, ($cart) =>
	$cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0)
);
