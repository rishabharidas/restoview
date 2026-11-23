<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { getOrder, createWebSocketConnection } from '$lib/api';
	import type { Order, OrderStatus, DriverLocation } from '$lib/types';

	let orderId = $derived(page.params.orderId || '');
	let order = $state<Order | null>(null);
	let loading = $state(true);
	let errorMsg = $state('');
	let ws = $state<WebSocket | null>(null);
	let driverLoc = $state<DriverLocation | null>(null);

	const pipelineSteps: { key: OrderStatus; label: string; icon: string }[] = [
		{ key: 'PLACED', label: 'Placed', icon: '📝' },
		{ key: 'WAITER_CONFIRMED', label: 'Confirmed', icon: '👨‍💼' },
		{ key: 'CHEF_ACCEPTED', label: 'Kitchen Queued', icon: '📋' },
		{ key: 'IN_COOKING', label: 'Cooking', icon: '🍳' },
		{ key: 'BEING_PREPARED', label: 'Prep & Sides', icon: '🥣' },
		{ key: 'PLATING', label: 'Plating', icon: '🍽️' },
		{ key: 'READY_TO_SERVE', label: 'Ready', icon: '🔔' },
		{ key: 'SERVED', label: 'Served', icon: '✨' }
	];

	function getStepIndex(status: OrderStatus): number {
		if (status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') return 7;
		const idx = pipelineSteps.findIndex((s) => s.key === status);
		return idx !== -1 ? idx : 0;
	}

	onMount(async () => {
		if (!orderId) {
			errorMsg = 'Missing order ID';
			loading = false;
			return;
		}
		try {
			order = await getOrder(orderId);
		} catch (e: any) {
			errorMsg = e.message || 'Could not fetch order';
		} finally {
			loading = false;
		}

		// Connect to WebSocket for real-time live updates
		ws = createWebSocketConnection([`order:${orderId}`], (msg) => {
			if (msg.event === 'ORDER_STATUS_UPDATED') {
				if (order) {
					order = { ...order, status: msg.payload.status };
				}
			} else if (msg.event === 'DRIVER_LOCATION_STREAM') {
				driverLoc = msg.payload;
			}
		});
	});

	onDestroy(() => {
		if (ws) ws.close();
	});
</script>

<div class="max-w-3xl mx-auto space-y-6">
	{#if loading}
		<div class="text-center py-20 text-slate-400">Loading order tracker...</div>
	{:else if errorMsg}
		<div class="p-6 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-3xl text-center border border-red-200 dark:border-red-800">
			<h3 class="font-bold text-lg">Order Not Found</h3>
			<p class="text-xs mt-1">{errorMsg}</p>
		</div>
	{:else if order}
		<!-- Status Summary Banner -->
		<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
						{order.order_type}
					</span>
					<h2 class="text-2xl font-black text-slate-900 dark:text-white mt-1">
						Order #{order.order_number}
					</h2>
				</div>
				<div class="text-right">
					<p class="text-xs text-slate-400">Live Status</p>
					<span class="inline-block mt-0.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
						{order.status.replace(/_/g, ' ')}
					</span>
				</div>
			</div>

			<!-- Granular Pipeline Visualizer -->
			<div class="pt-4 border-t border-slate-100 dark:border-slate-800">
				<p class="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 tracking-wide uppercase">Food Preparation Pipeline</p>
				<div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
					{#each pipelineSteps as step, idx}
						{@const currentIdx = getStepIndex(order.status)}
						{@const isDone = idx < currentIdx}
						{@const isCurrent = idx === currentIdx}
						<div class="flex flex-col items-center text-center">
							<div
								class="w-10 h-10 rounded-full flex items-center justify-center text-base mb-1.5 transition-all {isDone ? 'bg-emerald-500 text-white shadow-xs' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900 scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}"
							>
								{isDone ? '✓' : step.icon}
							</div>
							<span class="text-[10px] font-semibold leading-tight {isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' : isDone ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}">
								{step.label}
							</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Live Delivery Map (If Delivery Order) -->
		{#if order.order_type === 'DELIVERY'}
			<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
				<div class="flex items-center justify-between">
					<h3 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
						📍 Live Delivery Partner Tracker
					</h3>
					<span class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
						<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Streaming GPS
					</span>
				</div>

				<div class="h-56 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden flex items-center justify-center">
					<!-- Visual Mock Map Grid -->
					<div class="absolute inset-0 opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]"></div>

					{#if driverLoc}
						<div class="text-center z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
							<p class="text-2xl animate-bounce">🛵</p>
							<p class="font-bold text-xs text-slate-900 dark:text-white mt-1">Delivery Partner En Route</p>
							<p class="text-[10px] text-slate-500 dark:text-slate-400">Lat: {driverLoc.latitude.toFixed(4)}, Lng: {driverLoc.longitude.toFixed(4)}</p>
							<p class="text-[10px] text-slate-500 dark:text-slate-400">Speed: {driverLoc.speed.toFixed(1)} km/h • Heading: {driverLoc.heading}°</p>
						</div>
					{:else}
						<div class="text-center z-10 text-slate-400 text-xs">
							<p class="text-2xl mb-1">🛵</p>
							Waiting for driver GPS signal...<br />Live route will display as driver moves.
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Order Details & Receipt Items -->
		<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
			<h3 class="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
				Items in this Order
			</h3>
			{#if order.items}
				<div class="space-y-2.5">
					{#each order.items as item}
						<div class="flex justify-between items-center text-xs text-slate-700 dark:text-slate-300 py-1 border-b border-slate-50 dark:border-slate-800/50">
							<div>
								<span class="font-bold text-slate-900 dark:text-white">{item.quantity}×</span> {item.name || 'Menu Item'}
							</div>
							<span class="font-bold text-slate-900 dark:text-white">₹{item.item_total.toFixed(2)}</span>
						</div>
					{/each}
				</div>
			{/if}

			<div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
				<div class="flex justify-between">
					<span>Subtotal</span>
					<span>₹{order.subtotal.toFixed(2)}</span>
				</div>
				<div class="flex justify-between">
					<span>Taxes (GST 5%)</span>
					<span>₹{order.tax_amount.toFixed(2)}</span>
				</div>
				{#if order.delivery_fee > 0}
					<div class="flex justify-between">
						<span>Delivery Fee</span>
						<span>₹{order.delivery_fee.toFixed(2)}</span>
					</div>
				{/if}
				<div class="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
					<span>Total Paid / Payable</span>
					<span class="text-blue-600 dark:text-blue-400">₹{order.total_amount.toFixed(2)}</span>
				</div>
			</div>
		</div>
	{/if}
</div>
