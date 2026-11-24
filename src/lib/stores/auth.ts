import { writable, derived } from 'svelte/store';
import type { StaffRole, StaffUser } from '$lib/types';
import { loginStaff, logoutStaff } from '$lib/api';

export const DEMO_CREDENTIALS: Record<StaffRole, { username: string; password: string }> = {
	GUEST: { username: '', password: '' },
	WAITER: { username: '+919876543212', password: 'DemoPass123!' },
	CHEF: { username: '+919876543211', password: 'DemoPass123!' },
	DRIVER: { username: '+919876543213', password: 'DemoPass123!' },
	ADMIN: { username: '+919876543210', password: 'DemoPass123!' }
};

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

		loginWithCredentials: async (username: string, password: string, tenantSlug = 'test-resto'): Promise<StaffUser> => {
			try {
				const { token, user } = await loginStaff(username, password, tenantSlug);
				const role = (user.role || 'WAITER').toUpperCase() as StaffRole;
				const staffUser: StaffUser = {
					id: user.id,
					name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.role,
					role: role,
					username: username,
					title: `${user.role} Station`
				};
				if (typeof window !== 'undefined') {
					localStorage.setItem('resto_jwt_token', token);
					localStorage.setItem('resto_staff_session', JSON.stringify(staffUser));
				}
				userStore.set(staffUser);
				loginModalStore.set(false);
				return staffUser;
			} catch (err) {
				console.error('API login failed', err);
				throw err;
			}
		},

		loginAsRole: async (role: StaffRole, tenantSlug = 'test-resto') => {
			if (role === 'GUEST') {
				if (typeof window !== 'undefined') {
					localStorage.removeItem('resto_jwt_token');
					localStorage.removeItem('resto_staff_session');
				}
				userStore.set(null);
				return;
			}

			const creds = DEMO_CREDENTIALS[role];
			if (creds && creds.username) {
				try {
					const { token, user } = await loginStaff(creds.username, creds.password, tenantSlug);
					const staffUser: StaffUser = {
						id: user.id,
						name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || role,
						role: role,
						username: creds.username,
						title: DEMO_STAFF_ACCOUNTS[role]?.title || `${role} Staff`
					};
					if (typeof window !== 'undefined') {
						localStorage.setItem('resto_jwt_token', token);
						localStorage.setItem('resto_staff_session', JSON.stringify(staffUser));
					}
					userStore.set(staffUser);
					loginModalStore.set(false);
					return;
				} catch (e) {
					console.warn('API login failed, using local mock session fallback for development', e);
				}
			}

			// Local fallback
			const staff = DEMO_STAFF_ACCOUNTS[role];
			if (staff) {
				if (typeof window !== 'undefined') {
					localStorage.setItem('resto_staff_session', JSON.stringify(staff));
				}
				userStore.set(staff);
				loginModalStore.set(false);
			}
		},

		logout: async () => {
			await logoutStaff();
			if (typeof window !== 'undefined') {
				localStorage.removeItem('resto_jwt_token');
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
