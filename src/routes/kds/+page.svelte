<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentTenant } from '$lib/stores/tenant';
	import { fetchOrders, updateOrderStatus, updateOrderItemStatus, toggleItemAvailability, fetchMenu, createWebSocketConnection } from '$lib/api';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import type { Order, OrderStatus, MenuItem } from '$lib/types';

	let selectedStation = $state<'ALL' | 'GRILL' | 'MAIN_KITCHEN' | 'BAKERY' | 'BEVERAGES' | 'DESSERTS' | 'EXPO'>('ALL');
	let outOfStockDrawer = $state(false);
	let delayModalOpen = $state(false);
	let delayOrder = $state<Order | null>(null);
	let delayNote = $state('');

	let menuItems = $state<MenuItem[]>([]);
	let activeOrders = $state<Order[]>([]);
	let loading = $state(true);
	let ws: WebSocket | null = null;

	async function loadOrders() {
		try {
			const fetched = await fetchOrders({
				active: true,
				station: selectedStation === 'ALL' ? undefined : selectedStation
			});
			activeOrders = fetched;
		} catch (e) {
			console.log('Using local KDS state fallback', e);
		} finally {
			loading = false;
		}
	}

	async function loadMenuItems() {
		try {
			const categories = await fetchMenu();
			const items: MenuItem[] = [];
			categories.forEach((c) => items.push(...c.items));
			menuItems = items;
		} catch (e) {
			console.log('Failed to fetch menu items for 86ing drawer', e);
		}
	}

	onMount(() => {
		loadOrders();
		loadMenuItems();

		// Real-time WebSocket connection to tenant room
		ws = createWebSocketConnection([`tenant:${$currentTenant.id}`], (msg) => {
			if (msg.event === 'NEW_ORDER') {
				loadOrders();
			} else if (msg.event === 'ORDER_STATUS_UPDATED') {
				activeOrders = activeOrders.map((o) =>
					o.id === msg.payload.order_id ? { ...o, status: msg.payload.status } : o
				);
			} else if (msg.event === 'ORDER_ITEM_STATUS_UPDATED') {
				loadOrders();
			} else if (msg.event === 'ITEM_AVAILABILITY_CHANGED') {
				menuItems = menuItems.map((it) =>
					it.id === msg.payload.item_id ? { ...it, is_available: msg.payload.is_available } : it
				);
			}
		});

		// Refresh elapsed timers every 30 seconds
		const interval = setInterval(() => {
			activeOrders = [...activeOrders];
		}, 30000);

		return () => clearInterval(interval);
	});

	onDestroy(() => {
		if (ws) ws.close();
	});

	function getElapsedMinutes(createdAtStr: string): number {
		const created = new Date(createdAtStr).getTime();
		const now = Date.now();
		return Math.max(0, Math.floor((now - created) / 60000));
	}

	async function advanceOrderStatus(order: Order, nextStatus: OrderStatus) {
		try {
			await updateOrderStatus(order.id, nextStatus);
			activeOrders = activeOrders.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o));
		} catch (e: any) {
			alert('Failed to update status: ' + e.message);
		}
	}

	async function handleItemStatusToggle(order: Order, item: any) {
		const nextStatus = item.item_status === 'READY_TO_SERVE' ? 'IN_COOKING' : 'READY_TO_SERVE';
		try {
			await updateOrderItemStatus(order.id, item.id, nextStatus);
			loadOrders();
		} catch (e: any) {
			alert('Failed to update item status: ' + e.message);
		}
	}

	async function handleToggleStock(item: MenuItem) {
		const newStatus = !item.is_available;
		try {
			await toggleItemAvailability(item.id, newStatus);
			menuItems = menuItems.map((it) => (it.id === item.id ? { ...it, is_available: newStatus } : it));
		} catch (e: any) {
			alert('Failed to toggle availability: ' + e.message);
		}
	}

	async function submitDelayNote() {
		if (!delayOrder) return;
		try {
			await updateOrderStatus(delayOrder.id, delayOrder.status, delayNote);
			delayModalOpen = false;
			delayNote = '';
			delayOrder = null;
			loadOrders();
		} catch (e: any) {
			alert('Failed to add delay note: ' + e.message);
		}
	}

	function areAllItemsReady(order: Order): boolean {
		if (!order.items || order.items.length === 0) return false;
		return order.items.every((it) => it.item_status === 'READY_TO_SERVE' || it.item_status === 'SERVED' || it.item_status === 'COMPLETED');
	}
</script>

<AuthGuard requiredRole="CHEF" roleTitle="Kitchen Display System" icon="👨‍🍳">
	<div class="space-y-6">
		<!-- KDS Top Navigation & Station Switcher -->
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-3xl text-white shadow-xl">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-xl">
					👨‍🍳
				</div>
				<div>
					<h1 class="text-lg font-black tracking-tight flex items-center gap-2">
						Kitchen Display System (KDS)
						<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold animate-pulse">
							LIVE DISPATCH
						</span>
					</h1>
					<p class="text-xs text-zinc-400">Station routing, item-level prep check-offs, and 86'ing drawer</p>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<!-- Station Filter Tabs -->
				<div class="flex items-center gap-1 bg-zinc-800 p-1 rounded-2xl border border-zinc-700 text-xs font-bold">
					{#each ['ALL', 'GRILL', 'MAIN_KITCHEN', 'BAKERY', 'BEVERAGES', 'DESSERTS', 'EXPO'] as station}
						<button
							type="button"
							onclick={() => { selectedStation = station as any; loadOrders(); }}
							class="px-3 py-1.5 rounded-xl transition {selectedStation === station ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'}"
						>
							{station}
						</button>
					{/each}
				</div>

				<!-- 86'ing Out-of-Stock Drawer Trigger -->
				<button
					type="button"
					onclick={() => (outOfStockDrawer = true)}
					class="px-4 py-2 rounded-2xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm active:scale-95"
				>
					<span>🚫</span>
					<span>86'ing Stock</span>
				</button>
			</div>
		</div>

		<!-- KDS Orders Grid -->
		{#if loading}
			<div class="py-24 text-center text-zinc-400 space-y-3">
				<div class="animate-spin w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full mx-auto"></div>
				<p class="text-sm">Connecting to kitchen order pipeline...</p>
			</div>
		{:else if activeOrders.length === 0}
			<div class="py-24 text-center bg-zinc-900/60 border border-zinc-800 rounded-3xl text-zinc-400 space-y-3">
				<span class="text-4xl block">🛎️</span>
				<h3 class="text-base font-bold text-white">All Kitchen Stations Clear</h3>
				<p class="text-xs text-zinc-500">Incoming dine-in, takeaway, and delivery orders will appear instantly.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each activeOrders as order (order.id)}
					{@const elapsed = getElapsedMinutes(order.created_at)}
					{@const allReady = areAllItemsReady(order)}

					<div class="bg-zinc-900 border rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all {allReady ? 'border-emerald-500/80 bg-emerald-950/20' : elapsed > 20 ? 'border-red-600/80 bg-red-950/20 animate-pulse' : 'border-zinc-800'}">
						<!-- Ticket Header -->
						<div class="space-y-3 border-b border-zinc-800 pb-3">
							<div class="flex items-center justify-between">
								<span class="text-lg font-black text-white tracking-tight">#{order.order_number}</span>
								<!-- Elapsed Timer Badge -->
								<span class="text-xs font-black px-2.5 py-1 rounded-xl border {elapsed < 10 ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : elapsed < 20 ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-red-950 text-red-200 border-red-700 animate-bounce'}">
									⏱️ {elapsed}m
								</span>
							</div>

							<div class="flex items-center justify-between text-xs text-zinc-400">
								<span class="font-bold text-zinc-300">
									{order.order_type === 'DINE_IN' ? `🍽️ Table ${order.table_number || 'Floor'}` : order.order_type === 'DELIVERY' ? '🛵 Home Delivery' : '🥡 Takeaway'}
								</span>
								<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
									{order.status}
								</span>
							</div>

							{#if allReady}
								<div class="p-2 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs text-center uppercase tracking-wider shadow-md">
									✨ All Items Ready for Pass / Server
								</div>
							{/if}
						</div>

						<!-- Items List with Item-Level Check-Off -->
						<div class="space-y-2.5 flex-1 max-h-72 overflow-y-auto pr-1">
							{#if order.items}
								{#each order.items as item (item.id)}
									<button
										type="button"
										onclick={() => handleItemStatusToggle(order, item)}
										class="w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 active:scale-98 {item.item_status === 'READY_TO_SERVE'
											? 'bg-emerald-950/50 border-emerald-700 text-emerald-200'
											: 'bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:border-zinc-500'}"
									>
										<!-- Checkbox Indicator -->
										<div class="w-5 h-5 rounded-lg border flex items-center justify-center text-xs mt-0.5 shrink-0 {item.item_status === 'READY_TO_SERVE' ? 'bg-emerald-500 border-emerald-400 text-zinc-950 font-black' : 'border-zinc-600 bg-zinc-900'}">
											{item.item_status === 'READY_TO_SERVE' ? '✓' : ''}
										</div>

										<div class="flex-1 space-y-1">
											<div class="flex items-center justify-between">
												<span class="font-extrabold text-sm {item.item_status === 'READY_TO_SERVE' ? 'line-through text-emerald-400' : 'text-white'}">
													{item.quantity}x {item.item_name || item.name || 'Dish'}
												</span>
												<span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-zinc-700 text-zinc-300">
													{item.assigned_station || 'MAIN'}
												</span>
											</div>

											{#if item.special_instructions}
												<p class="text-[11px] text-amber-300 font-medium">
													⚠️ Note: {item.special_instructions}
												</p>
											{/if}
											{#if item.kitchen_notes}
												<p class="text-[11px] text-zinc-400 italic">
													Chef: {item.kitchen_notes}
												</p>
											{/if}
										</div>
									</button>
								{/each}
							{/if}
						</div>

						<!-- KDS Footer Progression Controls -->
						<div class="pt-3 border-t border-zinc-800 space-y-2">
							<div class="grid grid-cols-2 gap-2 text-xs font-bold">
								{#if order.status === 'PLACED'}
									<button
										type="button"
										onclick={() => advanceOrderStatus(order, 'CHEF_ACCEPTED')}
										class="col-span-2 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-md transition active:scale-95"
									>
										Accept Order →
									</button>
								{:else if order.status === 'CHEF_ACCEPTED'}
									<button
										type="button"
										onclick={() => advanceOrderStatus(order, 'IN_COOKING')}
										class="col-span-2 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white shadow-md transition active:scale-95"
									>
										Start Cooking 🔥
									</button>
								{:else if order.status === 'IN_COOKING' || order.status === 'BEING_PREPARED'}
									<button
										type="button"
										onclick={() => advanceOrderStatus(order, 'READY_TO_SERVE')}
										class="col-span-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md transition active:scale-95"
									>
										Mark All Ready ✓
									</button>
								{:else if order.status === 'READY_TO_SERVE'}
									<button
										type="button"
										onclick={() => advanceOrderStatus(order, 'SERVED')}
										class="col-span-2 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 shadow-md transition active:scale-95"
									>
										Dispatch / Handed to Server →
									</button>
								{/if}
							</div>

							<button
								type="button"
								onclick={() => { delayOrder = order; delayModalOpen = true; }}
								class="w-full py-1.5 text-[11px] text-zinc-400 hover:text-white transition text-center"
							>
								+ Add Kitchen Delay Note
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- 🚫 86'ing Real-Time Availability Side Drawer -->
		{#if outOfStockDrawer}
			<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-end">
				<div class="w-full max-w-md bg-zinc-900 border-l border-zinc-800 text-zinc-100 h-full p-6 space-y-6 flex flex-col justify-between shadow-2xl">
					<div class="space-y-4">
						<div class="flex items-center justify-between border-b border-zinc-800 pb-4">
							<div class="flex items-center gap-2">
								<span class="text-2xl">🚫</span>
								<div>
									<h3 class="font-black text-lg text-white">86'ing Stock Drawer</h3>
									<p class="text-xs text-zinc-400">Instantly take items off the customer menu</p>
								</div>
							</div>
							<button
								type="button"
								onclick={() => (outOfStockDrawer = false)}
								class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
							>
								✕
							</button>
						</div>

						<!-- Items List with Toggle Switch -->
						<div class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
							{#each menuItems as item}
								<div class="p-3 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-between">
									<div class="space-y-0.5">
										<p class="font-bold text-sm text-white">{item.name}</p>
										<p class="text-xs text-zinc-400">₹{item.price} • {item.kitchen_station || 'MAIN'}</p>
									</div>

									<button
										type="button"
										onclick={() => handleToggleStock(item)}
										class="px-3 py-1.5 rounded-xl font-extrabold text-xs transition {item.is_available
											? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
											: 'bg-red-950 text-red-300 border border-red-700 hover:bg-red-900'}"
									>
										{item.is_available ? 'Available' : "86'd (Off)"}
									</button>
								</div>
							{/each}
						</div>
					</div>

					<button
						type="button"
						onclick={() => (outOfStockDrawer = false)}
						class="w-full py-3 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-900 font-extrabold text-sm shadow-md transition"
					>
						Done
					</button>
				</div>
			</div>
		{/if}

		<!-- Delay Note Modal -->
		{#if delayModalOpen && delayOrder}
			<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
				<div class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
					<h3 class="font-bold text-base text-white">Add Delay Note for #{delayOrder.order_number}</h3>
					<textarea
						bind:value={delayNote}
						placeholder="e.g. Tandoor prep takes 8 extra minutes, clay oven re-stoking..."
						rows="3"
						class="w-full text-xs p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none"
					></textarea>
					<div class="flex items-center justify-end gap-2">
						<button
							type="button"
							onclick={() => { delayModalOpen = false; delayOrder = null; }}
							class="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
						>
							Cancel
						</button>
						<button
							type="button"
							onclick={submitDelayNote}
							class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs"
						>
							Save Note
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</AuthGuard>
