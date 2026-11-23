<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { currentTenant, applyTheme } from '$lib/stores/tenant';
	import { cartCount } from '$lib/stores/cart';
	import { fetchTenantConfig } from '$lib/api';

	let { children } = $props();

	onMount(async () => {
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
	<title>{$currentTenant.name} | Order Online & Dine-In</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
	<!-- Dynamic Top Navigation -->
	<header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
		<div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
			<a href="/" class="flex items-center gap-3">
				{#if $currentTenant.branding.logo_url}
					<img
						src={$currentTenant.branding.logo_url}
						alt={$currentTenant.name}
						class="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-200"
					/>
				{/if}
				<div>
					<h1 class="font-bold text-lg leading-tight tracking-tight text-slate-900">
						{$currentTenant.name}
					</h1>
					<p class="text-xs text-slate-500 font-medium">{$currentTenant.address}</p>
				</div>
			</a>

			<!-- Navigation Links & Roles -->
			<nav class="flex items-center gap-2 sm:gap-3 text-sm font-medium">
				<a
					href="/kds"
					class="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition border border-amber-200"
				>
					👨‍🍳 Chef KDS
				</a>
				<a
					href="/driver"
					class="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200"
				>
					🛵 Driver GPS
				</a>
				<div class="relative inline-flex items-center">
					<span class="px-3 py-1.5 rounded-full bg-rose-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
						🛒 Cart <span class="bg-white/20 px-1.5 py-0.5 rounded-full">{$cartCount}</span>
					</span>
				</div>
			</nav>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
		{@render children()}
	</main>

	<!-- Minimal Footer -->
	<footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
		<p>© {new Date().getFullYear()} {$currentTenant.name}. Powered by <span class="font-semibold text-rose-600">Resto Platform</span>.</p>
	</footer>
</div>
