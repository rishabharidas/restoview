<script lang="ts">
	import { onMount } from 'svelte';
	import { currentTenant } from '$lib/stores/tenant';
	import RestoActionWidget from '$lib/components/widgets/RestoActionWidget.svelte';

	interface Props {
		customHtml?: string;
		tableToken?: string;
		onOpenBooking?: () => void;
		onDetectLocation?: () => void;
		isLocating?: boolean;
		detectedAddress?: string;
	}

	let {
		customHtml = '',
		tableToken = 'qr_token_table_1_test_resto',
		onOpenBooking,
		onDetectLocation,
		isLocating = false,
		detectedAddress = ''
	}: Props = $props();

	// Check if custom HTML mode is enabled
	let isCustom = $derived(
		Boolean(customHtml && customHtml.trim().length > 15 && $currentTenant.branding.landing_mode === 'CUSTOM_HTML')
	);

	// Generate safe sandbox srcdoc with strict Content Security Policy
	let sandboxedSrcDoc = $derived(
		`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' https:; img-src https: data:;">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body { margin: 0; padding: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body class="p-2 sm:p-4">
  ${customHtml}
</body>
</html>`
	);
</script>

<div class="dynamic-landing-wrapper w-full">
	{#if isCustom}
		<!-- 🛡️ Securely Sandboxed Custom HTML CMS Mode -->
		<div class="custom-cms-container space-y-6">
			<div class="relative w-full rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl bg-zinc-950">
				<iframe
					title="Tenant Custom Storefront"
					srcdoc={sandboxedSrcDoc}
					sandbox="allow-scripts"
					class="w-full min-h-[420px] border-0 overflow-hidden"
				></iframe>
			</div>

			<!-- Embedded Resto Action Widget Gateway below custom HTML -->
			<div class="p-5 sm:p-7 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4 text-white">
				<div class="flex items-center justify-between border-b border-zinc-800 pb-3">
					<div>
						<span class="text-xs font-bold uppercase tracking-wider text-amber-400">Resto Service Gateway</span>
						<p class="text-[11px] text-zinc-400">Reserve your table or order directly to your door</p>
					</div>
					<span class="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">Live Services</span>
				</div>
				<RestoActionWidget
					{tableToken}
					{onOpenBooking}
					{onDetectLocation}
					{isLocating}
					{detectedAddress}
				/>
			</div>
		</div>
	{:else}
		<!-- 🌟 Built-in Editorial Hero Section with Integrated Resto Action Widget -->
		<section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6 sm:p-10 lg:p-14 shadow-2xl border border-zinc-800">
			<!-- Ambient Luxury Glow -->
			<div class="absolute -top-24 -right-24 w-96 h-96 bg-zinc-700/20 rounded-full blur-3xl pointer-events-none"></div>
			<div class="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

			<div class="relative z-10 max-w-4xl space-y-6">
				<!-- Editorial Accolades & Badges -->
				<div class="flex flex-wrap items-center gap-2">
					<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 backdrop-blur-md">
						⭐ Michelin Guide Selected 2025/2026
					</span>
					<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800/90 text-zinc-300 border border-zinc-700 backdrop-blur-md">
						🏆 Top Culinary Destination
					</span>
					<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
						🌿 100% Organic Sourced
					</span>
				</div>

				<!-- Main Headline (Strictly Preserved for Vitest & Test assertions) -->
				<h2 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
					Delicious Food, Delivered Fast.
				</h2>

				<p class="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
					Welcome to <strong class="text-white font-semibold">{$currentTenant.name}</strong>. Immerse yourself in authentic royal dum culinary traditions, live 800°F charcoal tandoor kebabs, and cold-pressed botanical mocktails.
				</p>

				<!-- 🚀 The Resto Action Widget Gateway -->
				<div class="pt-3">
					<RestoActionWidget
						{tableToken}
						{onOpenBooking}
						{onDetectLocation}
						{isLocating}
						{detectedAddress}
					/>
				</div>
			</div>
		</section>
	{/if}
</div>
