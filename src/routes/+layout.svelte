<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { currentTenant, applyTheme } from '$lib/stores/tenant';
	import { cartCount } from '$lib/stores/cart';
	import { theme } from '$lib/stores/theme';
	import { fetchTenantConfig } from '$lib/api';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { children } = $props();

	onMount(async () => {
		// Initialize theme from system or saved preference
		theme.init();

		try {
			const tenant = await fetchTenantConfig();
			currentTenant.set(tenant);
			applyTheme(tenant);
		} catch (e) {
			console.log('Using default tenant config');
			applyTheme($currentTenant);
		}
	});
</script>

<svelte:head>
	<title>{$currentTenant.name} | Premium Dining & Realtime Ordering</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
	<!-- Dynamic Top Navigation with Role Switcher & Glassmorphism -->
	<header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
		<div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
			<!-- Brand Identity -->
			<a href="/" class="flex items-center gap-3 group">
				{#if $currentTenant.branding.logo_url}
					<img
						src={$currentTenant.branding.logo_url}
						alt={$currentTenant.name}
						class="w-10 h-10 rounded-full object-cover shadow-xs border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform"
					/>
				{/if}
				<div>
					<div class="flex items-center gap-2">
						<h1 class="font-bold text-base sm:text-lg leading-tight tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
							{$currentTenant.name}
						</h1>
						<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
							Verified
						</span>
					</div>
					<p class="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
						{$currentTenant.address}
					</p>
				</div>
			</a>

			<!-- Role Portal Switcher (Quick Access for Chef, Waiter, Driver, Admin) -->
			<nav class="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold">
				<a
					href="/"
					class="px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
					title="Customer Showcase & Menu"
				>
					🍽️ <span class="hidden md:inline">Guest Menu</span>
				</a>
				<a
					href="/waiter"
					class="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition border border-emerald-200 dark:border-emerald-800"
					title="Waiter POS & Floor Plan"
				>
					🛎️ <span class="hidden md:inline">Waiter POS</span>
				</a>
				<a
					href="/kds"
					class="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition border border-amber-200 dark:border-amber-800"
					title="Kitchen Display System"
				>
					👨‍🍳 <span class="hidden md:inline">Chef KDS</span>
				</a>
				<a
					href="/driver"
					class="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition border border-indigo-200 dark:border-indigo-800"
					title="Driver GPS Live Tracking"
				>
					🛵 <span class="hidden md:inline">Driver</span>
				</a>
				<a
					href="/admin"
					class="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition border border-purple-200 dark:border-purple-800"
					title="Manager & Admin Dashboard"
				>
					📊 <span class="hidden md:inline">Admin</span>
				</a>

				<!-- Theme Switcher (System / Dark / Light) -->
				<div class="ml-1">
					<ThemeToggle />
				</div>

				<!-- Cart Button -->
				<a
					href="/#cart-drawer"
					class="ml-1 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition active:scale-95"
				>
					<span>🛒</span>
					<span class="bg-white/20 px-1.5 py-0.5 rounded-full">{$cartCount}</span>
				</a>
			</nav>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
		{@render children()}
	</main>

	<!-- Polished Footer with Multi-Role Portals & Copyright -->
	<footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4 text-xs text-slate-500 dark:text-slate-400 mt-12 transition-colors">
		<div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
			<div class="space-y-1 text-center md:text-left">
				<p class="font-bold text-slate-800 dark:text-slate-200 text-sm">{$currentTenant.name}</p>
				<p>{$currentTenant.address} • Call: {$currentTenant.phone}</p>
				<p>© {new Date().getFullYear()} Resto Operating System. Enterprise Multi-Tenant Platform.</p>
			</div>

			<!-- Role Shortcuts in Footer -->
			<div class="flex flex-wrap items-center justify-center gap-4 text-xs">
				<a href="/table/qr_token_table_1_test_resto" class="hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">Table 1 QR Menu</a>
				<a href="/table/qr-print" class="hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">Print QR Stands</a>
				<a href="/waiter" class="hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">Waiter Station</a>
				<a href="/kds" class="hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">Chef KDS</a>
				<a href="/driver" class="hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">Driver Portal</a>
				<a href="/admin" class="hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">Admin & Sales</a>
			</div>
		</div>
	</footer>
</div>
