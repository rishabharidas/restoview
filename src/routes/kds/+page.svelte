<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentTenant } from '$lib/stores/tenant';
	import { updateOrderStatus, createWebSocketConnection } from '$lib/api';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import type { Order, OrderStatus } from '$lib/types';

	let selectedStation = $state<'ALL' | 'GRILL' | 'CURRY' | 'BAR' | 'EXPO'>('ALL');
	let outOfStockDrawer = $state(false);

	let itemsStock = $state([
		{ name: 'Paneer Tikka', category: 'Starters', available: true },
		{ name: 'Butter Chicken Masala', category: 'Main Course', available: true },
		{ name: 'Dal Makhani', category: 'Main Course', available: true },
		{ name: 'Garlic Naan', category: 'Breads', available: true },
		{ name: 'Tandoori Roti', category: 'Breads', available: true },
		{ name: 'Mango Lassi', category: 'Beverages', available: true }
	]);

	let activeOrders = $state<Order[]>([
		{
			id: 'demo-order-1',
			tenant_id: 'a0000000-0000-0000-0000-000000000001',
			outlet_id: 'b0000000-0000-0000-0000-000000000001',
			order_number: 'RSP-101',
			order_type: 'DINE_IN',
			status: 'CHEF_ACCEPTED',
			subtotal: 540,
			tax_amount: 27,
			delivery_fee: 0,
			total_amount: 567,
			payment_status: 'PAID',
			created_at: new Date(Date.now() - 14 * 60000).toISOString(),
			items: [
				{ id: '1', item_id: '1', name: 'Paneer Tikka', quantity: 2, unit_price: 280, item_total: 560, item_status: 'IN_COOKING' },
				{ id: '2', item_id: '2', name: 'Dal Makhani', quantity: 1, unit_price: 260, item_total: 260, item_status: 'PLACED' }
			]
		},
		{
			id: 'demo-order-2',
			tenant_id: 'a0000000-0000-0000-0000-000000000001',
			outlet_id: 'b0000000-0000-0000-0000-000000000001',
			order_number: 'RSP-102',
			order_type: 'DELIVERY',
			status: 'PLACED',
			subtotal: 420,
			tax_amount: 21,
			delivery_fee: 40,
			total_amount: 481,
			payment_status: 'PENDING',
			created_at: new Date(Date.now() - 4 * 60000).toISOString(),
			items: [
				{ id: '3', item_id: '3', name: 'Butter Chicken Masala', quantity: 1, unit_price: 420, item_total: 420, item_status: 'PLACED' },
				{ id: '4', item_id: '4', name: 'Garlic Naan', quantity: 2, unit_price: 70, item_total: 140, item_status: 'PLACED' }
			]
		},
		{
			id: 'demo-order-3',
			tenant_id: 'a0000000-0000-0000-0000-000000000001',
			outlet_id: 'b0000000-0000-0000-0000-000000000001',
			order_number: 'RSP-103',
			order_type: 'DINE_IN',
			status: 'IN_COOKING',
			subtotal: 620,
			tax_amount: 31,
			delivery_fee: 0,
			total_amount: 651,
			payment_status: 'PAID',
			created_at: new Date(Date.now() - 21 * 60000).toISOString(),
			items: [
				{ id: '5', item_id: '5', name: 'Tandoori Roti', quantity: 4, unit_price: 40, item_total: 160, item_status: 'IN_COOKING' },
				{ id: '6', item_id: '6', name: 'Paneer Tikka', quantity: 1, unit_price: 280, item_total: 280, item_status: 'IN_COOKING' }
			]
		}
	]);

	let ws: WebSocket | null = null;

	onMount(() => {
		ws = createWebSocketConnection([`tenant:${$currentTenant.id}`], (msg) => {
			if (msg.event === 'NEW_ORDER') {
				console.log('New Order arrived in KDS:', msg.payload);
			} else if (msg.event === 'ORDER_STATUS_UPDATED') {
				activeOrders = activeOrders.map((o) =>
					o.id === msg.payload.order_id ? { ...o, status: msg.payload.status } : o
				);
			}
		});
	});

	onDestroy(() => {
		if (ws) ws.close();
	});

	async function advanceStatus(order: Order, nextStatus: OrderStatus) {
		try {
			await updateOrderStatus(order.id, nextStatus);
			activeOrders = activeOrders.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o));
		} catch (e: any) {
			alert('Failed to update status: ' + e.message);
		}
	}

	function toggle86(name: string) {
		itemsStock = itemsStock.map((it) => (it.name === name ? { ...it, available: !it.available } : it));
	}

	function getElapsedMinutes(isoDate: string): number {
		const diff = Date.now() - new Date(isoDate).getTime();
		return Math.floor(diff / 60000);
	}
</script>

<AuthGuard requiredRole="CHEF" roleTitle="Kitchen KDS" icon="👨‍🍳">
<div class="space-y-6">
	<!-- KDS Header & Station Controls -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
		<div>
			<div class="flex items-center gap-2">
				<h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
					👨‍🍳 Kitchen Display System (KDS)
				</h2>
				<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
					<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
					LIVE SOCKET
				</span>
			</div>
			<p class="text-xs text-slate-500 dark:text-slate-400">
				High-speed station routing, ticket aging timers, and granular preparation pipeline.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<!-- 1-Tap 86 Button -->
			<button
				type="button"
				onclick={() => (outOfStockDrawer = !outOfStockDrawer)}
				class="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition flex items-center gap-1.5"
			>
				<span>🚫</span>
				<span>1-Tap 86 (Out-of-Stock)</span>
			</button>
		</div>
	</div>

	<!-- 86'ing / Out-of-Stock Inventory Quick Drawer -->
	{#if outOfStockDrawer}
		<section class="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
			<div class="flex items-center justify-between">
				<h3 class="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
					📦 Instant Out-of-Stock (86) Controls — Toggling will immediately reflect on Table QR and Online Menus
				</h3>
				<button type="button" onclick={() => (outOfStockDrawer = false)} class="text-xs text-slate-400">✕</button>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each itemsStock as item}
					<button
						type="button"
						onclick={() => toggle86(item.name)}
						class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 {item.available
							? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
							: 'bg-rose-600 text-white shadow-xs line-through'}"
					>
						<span>{item.available ? '🟢' : '🔴'}</span>
						<span>{item.name}</span>
						<span class="text-[10px] opacity-75">{item.available ? '(In Stock)' : '(86ed)'}</span>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Station Routing Filter Tabs -->
	<div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
		<button
			type="button"
			onclick={() => (selectedStation = 'ALL')}
			class="px-3.5 py-1.5 rounded-xl transition {selectedStation === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}"
		>
			All Stations ({activeOrders.length})
		</button>
		<button
			type="button"
			onclick={() => (selectedStation = 'GRILL')}
			class="px-3.5 py-1.5 rounded-xl transition {selectedStation === 'GRILL' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}"
		>
			🔥 Tandoor & Grill
		</button>
		<button
			type="button"
			onclick={() => (selectedStation = 'CURRY')}
			class="px-3.5 py-1.5 rounded-xl transition {selectedStation === 'CURRY' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}"
		>
			🍲 Curry & Wok
		</button>
		<button
			type="button"
			onclick={() => (selectedStation = 'BAR')}
			class="px-3.5 py-1.5 rounded-xl transition {selectedStation === 'BAR' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}"
		>
			🍸 Drinks & Bar
		</button>
		<button
			type="button"
			onclick={() => (selectedStation = 'EXPO')}
			class="px-3.5 py-1.5 rounded-xl transition {selectedStation === 'EXPO' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}"
		>
			🛎️ Expeditor Pass
		</button>
	</div>

	<!-- KDS Order Cards Grid with Aging Timers -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
		{#each activeOrders as order}
			{@const elapsed = getElapsedMinutes(order.created_at)}
			<div class="bg-white dark:bg-slate-900 rounded-3xl border-2 {elapsed >= 20 ? 'border-rose-500 shadow-rose-500/10' : elapsed >= 10 ? 'border-amber-400 shadow-amber-400/10' : 'border-emerald-400 shadow-emerald-400/10'} p-5 shadow-md flex flex-col justify-between space-y-4 transition-all">
				<div>
					<!-- Card Header: Order Number, Type & Aging Timer -->
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="font-black text-xl text-slate-900 dark:text-white">#{order.order_number}</span>
							<span class="text-[10px] font-bold px-2 py-0.5 rounded-full {order.order_type === 'DINE_IN' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'}">
								{order.order_type === 'DINE_IN' ? '🍽️ Dine-In Table' : '🛵 Delivery'}
							</span>
						</div>

						<!-- Color-coded Aging Timer -->
						<span class="text-xs font-black px-2.5 py-1 rounded-xl {elapsed >= 20 ? 'bg-rose-600 text-white animate-pulse' : elapsed >= 10 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'}">
							⏱️ {elapsed}m
						</span>
					</div>

					<!-- Current Status Badge -->
					<div class="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
						<span class="font-bold uppercase tracking-wider text-[11px] text-blue-600 dark:text-blue-400">
							{order.status.replace(/_/g, ' ')}
						</span>
						<span>Total: ₹{order.total_amount}</span>
					</div>

					<!-- Dishes / Kitchen Items List -->
					<div class="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
						{#if order.items}
							{#each order.items as item}
								<div class="flex justify-between items-center text-xs font-semibold py-1 border-b border-slate-50 dark:border-slate-800/50">
									<span class="text-slate-900 dark:text-slate-100">
										<span class="text-blue-600 dark:text-blue-400 font-black text-sm">{item.quantity}×</span>
										{item.name}
									</span>
									<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
										Station 1
									</span>
								</div>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Kitchen Pipeline Progression Buttons -->
				<div class="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
					{#if order.status === 'PLACED'}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'CHEF_ACCEPTED')}
							class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
						>
							Accept Ticket →
						</button>
					{:else if order.status === 'CHEF_ACCEPTED'}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'IN_COOKING')}
							class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition"
						>
							Start Cooking 🍳
						</button>
					{:else if order.status === 'IN_COOKING'}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'BEING_PREPARED')}
							class="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition"
						>
							Assemble Sides & Garnish 🥣
						</button>
					{:else if order.status === 'BEING_PREPARED'}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'PLATING')}
							class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
						>
							Food Plating 🍽️
						</button>
					{:else if order.status === 'PLATING'}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'READY_TO_SERVE')}
							class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
						>
							Pass to Waiter / Ready 🔔
						</button>
					{:else}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'SERVED')}
							class="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-black text-white font-bold text-xs shadow-xs transition"
						>
							Mark Complete ✓
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
</AuthGuard>
