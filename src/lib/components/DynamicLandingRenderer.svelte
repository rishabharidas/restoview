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

	let containerEl = $state<HTMLElement | null>(null);
	let mountedWidgetSlot = $state<HTMLElement | null>(null);
	let hasMountedIntoPlaceholder = $state(false);

	// Check if custom HTML is active
	let isCustom = $derived(
		Boolean(customHtml && customHtml.trim().length > 15 && $currentTenant.branding.landing_mode === 'CUSTOM_HTML')
	);

	function scanAndAttach() {
		if (!containerEl || !isCustom) return;

		// 1. Look for placeholder tags in custom HTML
		const target = containerEl.querySelector<HTMLElement>(
			'[data-resto-widget="actions"], [data-resto-widget="action-gateway"], #resto-action-widget'
		);

		if (target) {
			mountedWidgetSlot = target;
			hasMountedIntoPlaceholder = true;
		} else {
			hasMountedIntoPlaceholder = false;
			mountedWidgetSlot = null;
		}

		// 2. Attach global click listeners for custom HTML action triggers
		const bookButtons = containerEl.querySelectorAll('[data-resto-action="book"]');
		bookButtons.forEach((btn) => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				if (onOpenBooking) onOpenBooking();
			});
		});

		const locationButtons = containerEl.querySelectorAll('[data-resto-action="locate"]');
		locationButtons.forEach((btn) => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				if (onDetectLocation) onDetectLocation();
			});
		});
	}

	onMount(() => {
		scanAndAttach();
	});

	$effect(() => {
		if (customHtml) {
			setTimeout(scanAndAttach, 50);
		}
	});
</script>

<div class="dynamic-landing-wrapper w-full">
	{#if isCustom}
		<!-- 🎨 Multi-Tenant Custom HTML CMS Mode -->
		<div class="custom-cms-container space-y-6">
			<div bind:this={containerEl} class="tenant-custom-html">
				{@html customHtml}
			</div>

			<!-- If the custom HTML did NOT provide an explicit widget placeholder tag, show the widget here -->
			{#if !hasMountedIntoPlaceholder}
				<div class="p-4 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold uppercase tracking-wider text-amber-400">Resto Service Hub</span>
						<span class="text-[11px] text-zinc-400">Order Online • Dine-In • Reservations</span>
					</div>
					<RestoActionWidget
						{tableToken}
						{onOpenBooking}
						{onDetectLocation}
						{isLocating}
						{detectedAddress}
					/>
				</div>
			{/if}
		</div>
	{:else}
		<!-- 🌟 Built-in Default Hero Section with Integrated Resto Action Widget -->
		<section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6 sm:p-10 lg:p-12 shadow-2xl border border-zinc-800">
			<!-- Graphite & Amber Ambient Glow -->
			<div class="absolute -top-24 -right-24 w-96 h-96 bg-zinc-700/20 rounded-full blur-3xl pointer-events-none"></div>
			<div class="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

			<div class="relative z-10 max-w-4xl space-y-5">
				<!-- Badges & Achievements -->
				<div class="flex flex-wrap items-center gap-2">
					<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 backdrop-blur-md">
						⭐ 4.9 Rating (1,450+ Diners)
					</span>
					<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800/90 text-zinc-300 border border-zinc-700 backdrop-blur-md">
						🏆 Top Culinary Destination 2026
					</span>
					<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
						🌿 100% Fresh Daily Produce
					</span>
				</div>

				<!-- Main Headline (strictly preserved for vitest check) -->
				<h2 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
					Delicious Food, Delivered Fast.
				</h2>

				<p class="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl">
					Welcome to <strong class="text-white">{$currentTenant.name}</strong>. Experience artisanal gastronomy perfected over 25 years. Whether dining at your table, reserving an intimate evening, or ordering gourmet cuisine at home, we deliver precision flavor with real-time GPS tracking.
				</p>

				<!-- 🚀 The Resto Action Widget (Forwarding to Booking, Table Scanner, Online Ordering) -->
				<div class="pt-2">
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
