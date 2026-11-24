<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentTenant } from '$lib/stores/tenant';
	import {
		fetchTables,
		fetchMenu,
		createOrder,
		appendItemsToOrder,
		transferTable,
		mergeTables,
		updateOrderStatus,
		createWebSocketConnection
	} from '$lib/api';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import type { TableOverview, MenuCategory, MenuItem, TableBellAlert } from '$lib/types';

	let tables = $state<TableOverview[]>([]);
	let menuCategories = $state<MenuCategory[]>([]);
	let loading = $state(true);
	let selectedTable = $state<TableOverview | null>(null);

	// Service Call Bell Alerts
	let activeAlerts = $state<TableBellAlert[]>([]);

	// Modals
	let addDishesModalOpen = $state(false);
	let transferModalOpen = $state(false);
	let mergeModalOpen = $state(false);
	let billingModalOpen = $state(false);

	// Action States
	let transferTargetTableId = $state<string>('');
	let mergeSourceTableIds = $state<string[]>([]);
	let selectedPaymentMethod = $state<'CASH' | 'UPI' | 'CARD'>('UPI');
	let isSubmitting = $state(false);

	// Dishes to append
	let selectedCategory = $state<string>('');
	let appendingItems = $state<{ item: MenuItem; quantity: number; notes: string }[]>([]);

	let ws: WebSocket | null = null;

	async function loadTables() {
		try {
			tables = await fetchTables();
		} catch (e) {
			console.log('Tables load fallback', e);
		} finally {
			loading = false;
		}
	}

	async function loadMenu() {
		try {
			menuCategories = await fetchMenu();
			if (menuCategories.length > 0) {
				selectedCategory = menuCategories[0].id;
			}
		} catch (e) {
			console.log('Menu load error', e);
		}
	}

	onMount(() => {
		loadTables();
		loadMenu();

		ws = createWebSocketConnection([`tenant:${$currentTenant.id}`], (msg) => {
			if (msg.event === 'TABLE_BELL_RING') {
				activeAlerts = [msg.payload, ...activeAlerts];
			} else if (
				msg.event === 'NEW_ORDER' ||
				msg.event === 'ORDER_STATUS_UPDATED' ||
				msg.event === 'ORDER_ITEMS_APPENDED' ||
				msg.event === 'TABLE_TRANSFERRED' ||
				msg.event === 'TABLES_MERGED'
			) {
				loadTables();
			}
		});

		const interval = setInterval(loadTables, 20000);
		return () => clearInterval(interval);
	});

	onDestroy(() => {
		if (ws) ws.close();
	});

	function dismissAlert(alertId: string) {
		activeAlerts = activeAlerts.filter((a) => a.id !== alertId);
	}

	function openTableDetails(table: TableOverview) {
		selectedTable = table;
	}

	function openAddDishes(table: TableOverview) {
		selectedTable = table;
		appendingItems = [];
		addDishesModalOpen = true;
	}

	function addItemToAppend(item: MenuItem) {
		const existing = appendingItems.find((i) => i.item.id === item.id);
		if (existing) {
			existing.quantity += 1;
		} else {
			appendingItems = [...appendingItems, { item, quantity: 1, notes: '' }];
		}
	}

	async function submitAppendDishes() {
		if (!selectedTable || appendingItems.length === 0) return;
		isSubmitting = true;
		try {
			if (selectedTable.active_order_id) {
				// Append to active order
				await appendItemsToOrder(
					selectedTable.id,
					appendingItems.map((ai) => ({
						item_id: ai.item.id,
						quantity: ai.quantity,
						special_instructions: ai.notes
					}))
				);
			} else {
				// Create new dine-in table order
				await createOrder({
					order_type: 'DINE_IN',
					table_id: selectedTable.id,
					customer_name: `Table ${selectedTable.table_number}`,
					customer_phone: 'Staff POS Order',
					items: appendingItems.map((ai) => ({
						item_id: ai.item.id,
						quantity: ai.quantity,
						special_instructions: ai.notes
					}))
				});
			}
			addDishesModalOpen = false;
			appendingItems = [];
			await loadTables();
		} catch (e: any) {
			alert('Failed to place order items: ' + e.message);
		} finally {
			isSubmitting = false;
		}
	}

	async function submitTransfer() {
		if (!selectedTable || !transferTargetTableId) return;
		isSubmitting = true;
		try {
			await transferTable(selectedTable.id, transferTargetTableId);
			transferModalOpen = false;
			transferTargetTableId = '';
			selectedTable = null;
			await loadTables();
		} catch (e: any) {
			alert('Transfer failed: ' + e.message);
		} finally {
			isSubmitting = false;
		}
	}

	async function submitMerge() {
		if (!selectedTable || mergeSourceTableIds.length === 0) return;
		isSubmitting = true;
		try {
			await mergeTables(mergeSourceTableIds, selectedTable.id);
			mergeModalOpen = false;
			mergeSourceTableIds = [];
			selectedTable = null;
			await loadTables();
		} catch (e: any) {
			alert('Merge failed: ' + e.message);
		} finally {
			isSubmitting = false;
		}
	}

	async function settleBill() {
		if (!selectedTable || !selectedTable.active_order_id) return;
		isSubmitting = true;
		try {
			await updateOrderStatus(
				selectedTable.active_order_id,
				'COMPLETED',
				`Settled via ${selectedPaymentMethod} at Waiter POS`
			);
			billingModalOpen = false;
			selectedTable = null;
			await loadTables();
		} catch (e: any) {
			alert('Failed to complete order settlement: ' + e.message);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<AuthGuard requiredRole="WAITER" roleTitle="Waiter Handheld POS" icon="🛎️">
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-3xl text-white shadow-xl">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-xl">
					🛎️
				</div>
				<div>
					<h1 class="text-lg font-black tracking-tight flex items-center gap-2">
						Waiter Handheld POS & Table Floor
						<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
							ONLINE
						</span>
					</h1>
					<p class="text-xs text-zinc-400">Rapid order taking, dish appending, table transfer & bill settlements</p>
				</div>
			</div>

			<div class="flex items-center gap-3 text-xs">
				<span class="flex items-center gap-1.5 font-semibold text-emerald-400">
					<span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
				</span>
				<span class="flex items-center gap-1.5 font-semibold text-amber-400">
					<span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Occupied
				</span>
			</div>
		</div>

		<!-- Live Service Call Bell Alerts -->
		{#if activeAlerts.length > 0}
			<div class="space-y-2">
				{#each activeAlerts as alert (alert.id)}
					<div class="bg-amber-950/80 border border-amber-600/80 rounded-2xl p-3.5 flex items-center justify-between text-amber-200 text-xs shadow-lg animate-pulse">
						<div class="flex items-center gap-2.5">
							<span class="text-xl">🔔</span>
							<div>
								<span class="font-extrabold text-white text-sm">Table {alert.table_number}:</span>
								<span class="font-semibold text-amber-300 ml-1">{alert.action_label}</span>
								{#if alert.customer_name}
									<span class="text-zinc-400 text-[11px] ml-2">({alert.customer_name})</span>
								{/if}
							</div>
						</div>
						<button
							type="button"
							onclick={() => dismissAlert(alert.id)}
							class="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-[11px] transition shadow-xs"
						>
							Acknowledge ✓
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Floor Plan Table Grid -->
		{#if loading}
			<div class="py-24 text-center text-zinc-400 space-y-3">
				<div class="animate-spin w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full mx-auto"></div>
				<p class="text-sm">Connecting to restaurant floor plan...</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
				{#each tables as table (table.id)}
					{@const isOccupied = table.status === 'OCCUPIED'}
					<div class="rounded-3xl border p-4 flex flex-col justify-between space-y-3 shadow-md transition-all text-left group {isOccupied ? 'bg-amber-950/20 border-amber-800/80' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}">
						<div class="flex items-start justify-between">
							<div>
								<span class="font-black text-lg text-white">Table {table.table_number}</span>
								<p class="text-[11px] text-zinc-400">Seats {table.capacity} guests</p>
							</div>
							<span class="text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase border {isOccupied ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-emerald-950 text-emerald-400 border-emerald-800'}">
								{table.status}
							</span>
						</div>

						{#if isOccupied}
							<div class="space-y-1 py-1 border-t border-b border-zinc-800 text-xs">
								<div class="flex justify-between text-zinc-400">
									<span>Order</span>
									<span class="font-bold text-white">#{table.active_order_number || 'ACTIVE'}</span>
								</div>
								<div class="flex justify-between text-zinc-400">
									<span>Dining Time</span>
									<span class="font-bold text-amber-300">{table.elapsed_minutes || 0}m</span>
								</div>
								<div class="flex justify-between text-zinc-400">
									<span>Bill Total</span>
									<span class="font-black text-white">₹{(table.active_order_total || 0).toFixed(2)}</span>
								</div>
							</div>
						{:else}
							<div class="py-4 text-center text-zinc-500 text-xs italic">
								Ready for guests
							</div>
						{/if}

						<!-- Quick Actions -->
						<div class="space-y-1.5 pt-1">
							<button
								type="button"
								onclick={() => openAddDishes(table)}
								class="w-full py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1 active:scale-95 {isOccupied ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}"
							>
								<span>+</span>
								<span>{isOccupied ? 'Add Dishes' : 'Take Order'}</span>
							</button>

							{#if isOccupied}
								<div class="grid grid-cols-2 gap-1 text-[11px] font-semibold">
									<button
										type="button"
										onclick={() => { selectedTable = table; transferModalOpen = true; }}
										class="py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-center transition"
									>
										⇄ Transfer
									</button>
									<button
										type="button"
										onclick={() => { selectedTable = table; billingModalOpen = true; }}
										class="py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-center transition"
									>
										Settle Bill
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- + Add / Append Dishes Modal -->
		{#if addDishesModalOpen && selectedTable}
			<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
				<div class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col justify-between">
					<div class="flex items-start justify-between border-b border-zinc-800 pb-3">
						<div>
							<h3 class="font-black text-lg text-white">
								{selectedTable.status === 'OCCUPIED' ? 'Append Dishes to' : 'Open Table & Order for'} Table {selectedTable.table_number}
							</h3>
							<p class="text-xs text-zinc-400">Tap menu items to add directly to kitchen pipeline</p>
						</div>
						<button
							type="button"
							onclick={() => { addDishesModalOpen = false; appendingItems = []; }}
							class="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
						>
							✕
						</button>
					</div>

					<!-- Category Tabs -->
					<div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800 text-xs font-bold">
						{#each menuCategories as cat}
							<button
								type="button"
								onclick={() => (selectedCategory = cat.id)}
								class="px-3 py-1.5 rounded-xl whitespace-nowrap transition {selectedCategory === cat.id ? 'bg-amber-400 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-300'}"
							>
								{cat.name}
							</button>
						{/each}
					</div>

					<!-- Items List -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
						{#each menuCategories.find((c) => c.id === selectedCategory)?.items || [] as item}
							<button
								type="button"
								disabled={!item.is_available}
								onclick={() => addItemToAppend(item)}
								class="p-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:border-amber-400 text-left flex items-center justify-between transition disabled:opacity-40"
							>
								<div>
									<p class="font-bold text-xs text-white">{item.name}</p>
									<p class="text-[10px] text-zinc-400">₹{item.price}</p>
								</div>
								<span class="text-xs font-bold px-2 py-1 rounded bg-zinc-700 text-amber-300">+ Add</span>
							</button>
						{/each}
					</div>

					<!-- Staged Append List -->
					{#if appendingItems.length > 0}
						<div class="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700 space-y-2">
							<span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Round of Dishes to Send:</span>
							<div class="space-y-1.5 max-h-28 overflow-y-auto pr-1">
								{#each appendingItems as ai}
									<div class="flex items-center justify-between text-xs">
										<span class="font-semibold text-white">{ai.quantity}x {ai.item.name}</span>
										<span class="text-zinc-300">₹{ai.item.price * ai.quantity}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
						<button
							type="button"
							onclick={() => { addDishesModalOpen = false; appendingItems = []; }}
							class="px-4 py-2 text-xs text-zinc-400 hover:text-white"
						>
							Cancel
						</button>
						<button
							type="button"
							disabled={appendingItems.length === 0 || isSubmitting}
							onclick={submitAppendDishes}
							class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md transition disabled:opacity-50"
						>
							{isSubmitting ? 'Transmitting...' : 'Send Order to Kitchen →'}
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Transfer Table Modal -->
		{#if transferModalOpen && selectedTable}
			<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
				<div class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
					<h3 class="font-bold text-base text-white">Transfer Table {selectedTable.table_number}</h3>
					<p class="text-xs text-zinc-400">Select an available table to move this active order to:</p>

					<select
						bind:value={transferTargetTableId}
						class="w-full text-xs p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
					>
						<option value="">Select Destination Table</option>
						{#each tables.filter((t) => t.status === 'AVAILABLE' && t.id !== selectedTable?.id) as t}
							<option value={t.id}>Table {t.table_number} (Capacity: {t.capacity})</option>
						{/each}
					</select>

					<div class="flex items-center justify-end gap-2 pt-2">
						<button
							type="button"
							onclick={() => { transferModalOpen = false; selectedTable = null; }}
							class="px-4 py-2 text-xs text-zinc-400 hover:text-white"
						>
							Cancel
						</button>
						<button
							type="button"
							disabled={!transferTargetTableId || isSubmitting}
							onclick={submitTransfer}
							class="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs shadow-sm transition disabled:opacity-50"
						>
							{isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Settle Bill Modal -->
		{#if billingModalOpen && selectedTable}
			<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
				<div class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
					<div class="space-y-1">
						<h3 class="font-bold text-base text-white">Settle Bill for Table {selectedTable.table_number}</h3>
						<p class="text-xs text-zinc-400">Order #{selectedTable.active_order_number}</p>
					</div>

					<div class="p-4 rounded-2xl bg-zinc-800 border border-zinc-700 text-center space-y-1">
						<span class="text-xs text-zinc-400 uppercase tracking-wider font-bold">Total Amount Due</span>
						<p class="text-2xl font-black text-white">₹{(selectedTable.active_order_total || 0).toFixed(2)}</p>
					</div>

					<div class="space-y-2">
						<span class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Payment Mode</span>
						<div class="grid grid-cols-3 gap-2 text-xs font-bold">
							{#each ['UPI', 'CASH', 'CARD'] as method}
								<button
									type="button"
									onclick={() => (selectedPaymentMethod = method as any)}
									class="py-2.5 rounded-xl border transition {selectedPaymentMethod === method ? 'bg-amber-400 border-amber-400 text-zinc-950 shadow-xs' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}"
								>
									{method}
								</button>
							{/each}
						</div>
					</div>

					<div class="flex items-center justify-end gap-2 pt-2">
						<button
							type="button"
							onclick={() => { billingModalOpen = false; selectedTable = null; }}
							class="px-4 py-2 text-xs text-zinc-400 hover:text-white"
						>
							Cancel
						</button>
						<button
							type="button"
							disabled={isSubmitting}
							onclick={settleBill}
							class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md transition disabled:opacity-50"
						>
							{isSubmitting ? 'Settling...' : 'Complete & Free Table ✓'}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</AuthGuard>
