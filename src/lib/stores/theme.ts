import { writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark' | 'system';

function createThemeStore() {
	const initialMode: ThemeMode =
		typeof window !== 'undefined'
			? (localStorage.getItem('resto_theme') as ThemeMode) || 'system'
			: 'system';

	const { subscribe, set: _set, update } = writable<ThemeMode>(initialMode);

	function applyThemeToDOM(mode: ThemeMode) {
		if (typeof document === 'undefined') return;

		const root = document.documentElement;
		const isDark =
			mode === 'dark' ||
			(mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		if (isDark) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
	}

	return {
		subscribe,
		set: (mode: ThemeMode) => {
			if (typeof window !== 'undefined') {
				localStorage.setItem('resto_theme', mode);
			}
			applyThemeToDOM(mode);
			_set(mode);
		},
		init: () => {
			if (typeof window === 'undefined') return;
			const saved = (localStorage.getItem('resto_theme') as ThemeMode) || 'system';
			applyThemeToDOM(saved);
			_set(saved);

			// Listen for OS theme changes
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			mediaQuery.addEventListener('change', () => {
				const current = (localStorage.getItem('resto_theme') as ThemeMode) || 'system';
				if (current === 'system') {
					applyThemeToDOM('system');
				}
			});
		},
		toggle: () => {
			update((current) => {
				let next: ThemeMode;
				if (current === 'light') next = 'dark';
				else if (current === 'dark') next = 'system';
				else next = 'light';

				if (typeof window !== 'undefined') {
					localStorage.setItem('resto_theme', next);
				}
				applyThemeToDOM(next);
				return next;
			});
		}
	};
}

export const theme = createThemeStore();
