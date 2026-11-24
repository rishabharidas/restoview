<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { currentTenant, applyTheme } from '$lib/stores/tenant';
	import { cartCount } from '$lib/stores/cart';
	import { theme } from '$lib/stores/theme';
	import { auth, isStaff } from '$lib/stores/auth';
	import { fetchTenantConfig } from '$lib/api';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import StaffLoginModal from '$lib/components/StaffLoginModal.svelte';

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

<div class="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
	<!-- Dynamic Top Navigation: Adapts based on Guest vs Staff Role -->
	<header class="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-xs">
		<div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
			<!-- Brand Identity & Active Profile -->
			{#if $auth}
				<!-- Staff Logged-In Identity -->
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl shadow-xs">
						{$auth.role === 'CHEF' ? '👨‍🍳' : $auth.role === 'WAITER' ? '🛎️' : $auth.role === 'DRIVER' ? '🛵' : '📊'}
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h1 class="font-bold text-sm sm:text-base leading-tight text-zinc-900 dark:text-white">
								{$auth.name}
							</h1>
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider {$auth.role === 'CHEF' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' : $auth.role === 'WAITER' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : $auth.role === 'DRIVER' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800' : 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800'}">
								{$auth.role}
							</span>
						</div>
						<p class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[200px] sm:max-w-xs">
							{$auth.title} • {$currentTenant.name}
						</p>
					</div>
				</div>
			{:else}
				<!-- Public Guest Identity -->
				<a href="/" class="flex items-center gap-3 group">
					{#if $currentTenant.branding.logo_url}
						<img
							src={$currentTenant.branding.logo_url}
							alt={$currentTenant.name}
							class="w-10 h-10 rounded-2xl object-cover shadow-xs border border-zinc-200 dark:border-zinc-700 group-hover:scale-105 transition-transform"
						/>
					{/if}
					<div>
						<div class="flex items-center gap-2">
							<h1 class="font-bold text-base sm:text-lg leading-tight tracking-tight text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
								{$currentTenant.name}
							</h1>
							<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
								Verified
							</span>
						</div>
						<p class="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[200px] sm:max-w-xs">
							{$currentTenant.address}
						</p>
					</div>
				</a>
			{/if}

			<!-- Action Navigation Items -->
			<nav class="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
				{#if $auth}
					<!-- Staff Navigation Controls -->
					<a
						href={auth.getRoleDestination($auth.role)}
						class="px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold transition shadow-xs"
					>
						Operational Workspace
					</a>

					<a
						href="/"
						class="hidden sm:inline-flex px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
					>
						🍽️ Guest Store
					</a>

					<!-- Theme Switcher -->
					<ThemeToggle />

					<!-- Sign Out Button -->
					<button
						type="button"
						onclick={() => auth.logout()}
						class="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition active:scale-95"
					>
						🚪 Sign Out
					</button>
				{:else}
					<!-- Minimal Guest Navigation -->
					<a
						href="/"
						class="px-2.5 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-bold"
					>
						Home
					</a>

					<a
						href="/#about-section"
						class="hidden sm:inline-flex px-2.5 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-semibold"
					>
						About
					</a>

					<a
						href="/#menu-section"
						class="px-2.5 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-bold"
					>
						Menu
					</a>

					<a
						href="/table/qr_token_table_1_test_resto"
						class="hidden md:inline-flex px-2.5 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
					>
						📱 Dine-In QR
					</a>

					<!-- Theme Switcher -->
					<ThemeToggle />

					<!-- Guest Cart Button -->
					<a
						href="/#cart-drawer"
						class="px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 text-white dark:text-zinc-900 font-bold text-xs shadow-xs flex items-center gap-1.5 transition active:scale-95"
					>
						<span>🛒</span>
						<span class="bg-white/20 dark:bg-zinc-900/20 px-1.5 py-0.5 rounded-full">{$cartCount}</span>
					</a>

					<!-- Staff Login Trigger Button -->
					<button
						type="button"
						onclick={() => auth.openLoginModal()}
						class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 shadow-xs flex items-center gap-1.5 transition active:scale-95"
					>
						<span>🔑</span>
						<span>Staff Login</span>
					</button>
				{/if}
			</nav>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
		{@render children()}
	</main>

	<!-- Polished Dark-Grey Footer -->
	<footer class="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-8 px-4 text-xs text-zinc-500 dark:text-zinc-400 mt-12 transition-colors">
		<div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
			<div class="space-y-1 text-center md:text-left">
				<p class="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{$currentTenant.name}</p>
				<p>{$currentTenant.address} • Call: {$currentTenant.phone}</p>
				<p>© {new Date().getFullYear()} Resto Operating System. Enterprise Multi-Tenant Platform.</p>
			</div>

			<!-- Quick Staff Access from Footer -->
			<div class="flex flex-wrap items-center justify-center gap-4 text-xs">
				<a href="/table/qr_token_table_1_test_resto" class="hover:text-zinc-900 dark:hover:text-white transition font-medium">Table 1 QR Menu</a>
				<a href="/table/qr-print" class="hover:text-zinc-900 dark:hover:text-white transition font-medium">Print QR Stands</a>
				<button
					type="button"
					onclick={() => auth.openLoginModal()}
					class="hover:text-zinc-900 dark:hover:text-white transition font-bold text-zinc-700 dark:text-zinc-300"
				>
					🔑 Staff Portal Login
				</button>
			</div>
		</div>
	</footer>

	<!-- Staff Authentication Modal (Accessible anywhere) -->
	<StaffLoginModal />
</div>
