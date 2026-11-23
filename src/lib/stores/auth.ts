import { writable, derived } from 'svelte/store';
import type { StaffRole, StaffUser } from '$lib/types';

export const DEMO_STAFF_ACCOUNTS: Record<StaffRole, StaffUser> = {
	GUEST: {
		id: 'guest',
		name: 'Guest Diner',
		role: 'GUEST',
		username: 'guest',
		title: 'Customer'
	},
	WAITER: {
		id: 'waiter-1',
		name: 'Pooja Verma',
		role: 'WAITER',
		username: 'waiter_pooja',
		title: 'Floor Staff & POS Captain'
	},
	CHEF: {
		id: 'chef-1',
		name: 'Rajesh Kumar',
		role: 'CHEF',
		username: 'chef_rajesh',
		title: 'Executive Head Chef'
	},
	DRIVER: {
		id: 'driver-1',
		name: 'Amit Patel',
		role: 'DRIVER',
		username: 'driver_amit',
		title: 'Delivery Fleet Partner'
	},
	ADMIN: {
		id: 'admin-1',
		name: 'Anil Mehta',
		role: 'ADMIN',
		username: 'admin_anil',
		title: 'General Manager & Owner'
	}
};

function createAuthStore() {
	let initialUser: StaffUser | null = null;
	if (typeof window !== 'undefined') {
		try {
			const saved = localStorage.getItem('resto_staff_session');
			if (saved) {
				initialUser = JSON.parse(saved);
			}
		} catch (e) {
			console.error('Failed to parse saved session', e);
		}
	}

	const userStore = writable<StaffUser | null>(initialUser);
	const loginModalStore = writable<boolean>(false);

	return {
		subscribe: userStore.subscribe,
		user: userStore,
		loginModalOpen: loginModalStore,

		openLoginModal: () => loginModalStore.set(true),
		closeLoginModal: () => loginModalStore.set(false),

		loginAsRole: (role: StaffRole) => {
			const staff = DEMO_STAFF_ACCOUNTS[role];
			if (staff && role !== 'GUEST') {
				if (typeof window !== 'undefined') {
					localStorage.setItem('resto_staff_session', JSON.stringify(staff));
				}
				userStore.set(staff);
				loginModalStore.set(false);
			} else {
				if (typeof window !== 'undefined') {
					localStorage.removeItem('resto_staff_session');
				}
				userStore.set(null);
			}
		},

		logout: () => {
			if (typeof window !== 'undefined') {
				localStorage.removeItem('resto_staff_session');
				window.location.href = '/';
			}
			userStore.set(null);
		},

		getRoleDestination: (role: StaffRole): string => {
			switch (role) {
				case 'CHEF':
					return '/kds';
				case 'WAITER':
					return '/waiter';
				case 'DRIVER':
					return '/driver';
				case 'ADMIN':
					return '/admin';
				default:
					return '/';
			}
		}
	};
}

export const auth = createAuthStore();

export const isStaff = derived(auth, ($user) => $user !== null && $user.role !== 'GUEST');
