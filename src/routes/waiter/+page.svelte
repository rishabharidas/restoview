<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentTenant } from '$lib/stores/tenant';
	import { createWebSocketConnection } from '$lib/api';
	import AuthGuard from '$lib/components/AuthGuard.svelte';

	interface TableState {
		number: string;
		qrToken: string;
		capacity: number;
		status: 'AVAILABLE' | 'ORDERING' | 'SERVED' | 'BILL_REQUESTED';
		activeOrderNumber?: string;
		activeOrderTotal?: number;
		guestCount?: number;
		seatedTime?: string;
	}

	interface ServiceAlert {
		id: string;
		tableNumber: string;
		action: string;
		customerName?: string;
		time: string;
	}

	let tables: TableState[] = $state([
		{
			number: 'T-01',
			qrToken: 'qr_token_table_1_test_resto',
			capacity: 4,
			status: 'ORDERING',
			activeOrderNumber: 'RSP-101',
			activeOrderTotal: 567,
			guestCount: 2,
			seatedTime: '12 mins ago'
		},
		{
			number: 'T-02',
			qrToken: 'qr_token_table_2_test_resto',
			capacity: 2,
			status: 'AVAILABLE'
		},
		{
			number: 'T-03',
			qrToken: 'qr_token_table_3_test_resto',
			capacity: 6,
			status: 'BILL_REQUESTED',
			activeOrderNumber: 'RSP-098',
			activeOrderTotal: 1240,
			guestCount: 5,
			seatedTime: '45 mins ago'
		},
		{
			number: 'T-04',
			qrToken: 'qr_token_table_4_test_resto',
			capacity: 4,
			status: 'SERVED',
			activeOrderNumber: 'RSP-104',
			activeOrderTotal: 840,
			guestCount: 3,
			seatedTime: '28 mins ago'
		},
		{
			number: 'T-05',
			qrToken: 'qr_token_table_5_test_resto',
			capacity: 4,
			status: 'AVAILABLE'
		},
		{
			number: 'T-06',
			qrToken: 'qr_token_table_6_test_resto',
			capacity: 8,
			status: 'AVAILABLE'
		}
	]);

	let serviceAlerts: ServiceAlert[] = $state([
		{
			id: 'alt-1',
			tableNumber: 'T-03',
			action: 'BILL_REQUEST',
			customerName: 'Rohit',
			time: 'Just now'
		},
		{
			id: 'alt-2',
			tableNumber: 'T-01',
			action: 'WATER_REQUEST',
			customerName: 'Ananya',
			time: '3 mins ago'
		}
	]);

	let selectedTable = $state<TableState | null>(null);
	let billingModalOpen = $state(false);
	let paymentMethod = $state<'CASH' | 'UPI' | 'CARD'>('UPI');
	let isSettling = $state(false);
	let ws: WebSocket | null = null;

	onMount(() => {
		// Listen for live digital table service bells and status changes
		ws = createWebSocketConnection([`tenant:${$currentTenant.id}`], (msg) => {
			if (msg.event === 'TABLE_BELL_RING') {
				const payload = msg.payload;
				serviceAlerts = [
					{
						id: 'alt-' + Date.now(),
						tableNumber: payload.table_number || 'T-01',
						action: payload.action || 'CALL_SERVER',
						customerName: payload.customer_name || 'Guest',
						time: 'Just now'
					},
					...serviceAlerts
				];

				// Update table state
				if (payload.action === 'BILL_REQUEST') {
					tables = tables.map((t) =>
						t.number === payload.table_number ? { ...t, status: 'BILL_REQUESTED' } : t
					);
				}
			}
		});
	});

	onDestroy(() => {
		if (ws) ws.close();
	});

	function dismissAlert(id: string) {
		serviceAlerts = serviceAlerts.filter((a) => a.id !== id);
	}

	function openBilling(table: TableState) {
		selectedTable = table;
		billingModalOpen = true;
	}

	function settleBill() {
		if (!selectedTable) return;
		isSettling = true;

		setTimeout(() => {
			// Mark table as available
			tables = tables.map((t) =>
				t.number === selectedTable?.number
					? { ...t, status: 'AVAILABLE', activeOrderNumber: undefined, activeOrderTotal: undefined, guestCount: undefined }
					: t
			);
			billingModalOpen = false;
			selectedTable = null;
			isSettling = false;
			alert('Payment recorded! Table is now Available.');
		}, 600);
	}

	function markTableOccupied(table: TableState) {
		tables = tables.map((t) =>
			t.number === table.number
				? {
						...t,
						status: 'ORDERING',
						guestCount: 2,
						seatedTime: 'Just seated',
						activeOrderNumber: 'RSP-' + Math.floor(100 + Math.random() * 900),
						activeOrderTotal: 0
					}
				: t
		);
	}
</script>

<AuthGuard requiredRole="WAITER" roleTitle="Waiter Station" icon="🛎️">
<div class="space-y-6">
	<!-- Waiter Header & Floor Overview -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
		<div>
			<div class="flex items-center gap-2">
				<h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
					🛎️ Waiter Floor Station & POS
				</h2>
				<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
					Shift Active
				</span>
			</div>
			<p class="text-xs text-slate-500 dark:text-slate-400">
				Manage table seating, track dining orders, attend customer calls, and settle bills.
			</p>
		</div>

		<!-- Floor Status Pills -->
		<div class="flex items-center gap-2 text-xs font-semibold flex-wrap">
			<span class="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
				🟢 Available: {tables.filter((t) => t.status === 'AVAILABLE').length}
			</span>
			<span class="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
				🟡 Dining: {tables.filter((t) => t.status === 'ORDERING' || t.status === 'SERVED').length}
			</span>
			<span class="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
				🔴 Bill Due: {tables.filter((t) => t.status === 'BILL_REQUESTED').length}
			</span>
		</div>
	</div>

	<!-- Live Digital Service Bell Drawer -->
	{#if serviceAlerts.length > 0}
		<section class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 space-y-3">
			<div class="flex items-center justify-between">
				<h3 class="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
					🔔 Active Table Calls ({serviceAlerts.length})
				</h3>
				<span class="text-[11px] text-amber-600 dark:text-amber-400">Real-time alerts from diners' phones</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
				{#each serviceAlerts as alert}
					<div class="bg-white dark:bg-slate-900 rounded-xl p-3 border border-amber-300 dark:border-amber-700/60 shadow-xs flex items-center justify-between gap-3">
						<div class="space-y-0.5">
							<div class="flex items-center gap-1.5">
								<span class="font-black text-sm text-slate-900 dark:text-white">{alert.tableNumber}</span>
								<span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold {alert.action === 'BILL_REQUEST' ? 'bg-rose-100 text-rose-700' : alert.action === 'WATER_REQUEST' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}">
									{alert.action === 'BILL_REQUEST' ? '💳 Bill Request' : alert.action === 'WATER_REQUEST' ? '💧 Water' : '🙋 Call Server'}
								</span>
							</div>
							<p class="text-[11px] text-slate-500 dark:text-slate-400">{alert.customerName} • {alert.time}</p>
						</div>

						<button
							type="button"
							onclick={() => dismissAlert(alert.id)}
							class="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
						>
							✓ Attended
						</button>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 🪑 Table Grid Layout (Visual Floor Plan) -->
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="text-base font-bold text-slate-900 dark:text-white">Restaurant Floor (Main Dining Room)</h3>
			<a
				href="/table/qr-print"
				class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
			>
				🖨️ Print Acrylic Stands
			</a>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each tables as table}
				<div class="bg-white dark:bg-slate-900 rounded-2xl border {table.status === 'BILL_REQUESTED'
					? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/20 shadow-md'
					: table.status === 'ORDERING'
					? 'border-amber-300 dark:border-amber-700 shadow-xs'
					: table.status === 'SERVED'
					? 'border-blue-300 dark:border-blue-700 shadow-xs'
					: 'border-slate-200 dark:border-slate-800'} p-5 flex flex-col justify-between space-y-4 transition-all">
					<!-- Top Row: Table Number & Status Badge -->
					<div class="flex items-start justify-between">
						<div>
							<div class="flex items-center gap-2">
								<span class="text-xl font-black text-slate-900 dark:text-white">{table.number}</span>
								<span class="text-xs text-slate-400 font-medium">({table.capacity} Seats)</span>
							</div>
							{#if table.seatedTime}
								<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">⏱️ Seated: {table.seatedTime}</p>
							{/if}
						</div>

						<!-- Status Badge -->
						<span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full {table.status === 'AVAILABLE'
							? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
							: table.status === 'ORDERING'
							? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
							: table.status === 'SERVED'
							? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
							: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'}">
							{table.status.replace('_', ' ')}
						</span>
					</div>

					<!-- Middle: Order Details if Occupied -->
					{#if table.status !== 'AVAILABLE'}
						<div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1 text-xs">
							<div class="flex justify-between text-slate-600 dark:text-slate-300">
								<span>Order: <strong>{table.activeOrderNumber}</strong></span>
								<span>Guests: <strong>{table.guestCount}</strong></span>
							</div>
							<div class="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
								<span>Current Bill</span>
								<span class="text-blue-600 dark:text-blue-400">₹{table.activeOrderTotal?.toFixed(2)}</span>
							</div>
						</div>
					{:else}
						<div class="py-4 text-center text-xs text-slate-400">
							Table is cleaned & ready for new guests.
						</div>
					{/if}

					<!-- Bottom Row Actions -->
					<div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
						{#if table.status === 'AVAILABLE'}
							<button
								type="button"
								onclick={() => markTableOccupied(table)}
								class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
							>
								+ Seat Guests
							</button>
							<a
								href="/table/{table.qrToken}"
								class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
								title="Open QR Table Menu"
							>
								📱 Menu
							</a>
						{:else}
							<a
								href="/table/{table.qrToken}"
								class="flex-1 py-2 text-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
							>
								View / Punch Items
							</a>
							<button
								type="button"
								onclick={() => openBilling(table)}
								class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
							>
								💳 Settle Bill
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>

<!-- 💳 Bill Settlement & Checkout Modal -->
{#if billingModalOpen && selectedTable}
	<div class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 shadow-2xl space-y-4">
			<div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
				<div>
					<h3 class="font-black text-lg text-slate-900 dark:text-white">Table {selectedTable.number} Checkout</h3>
					<p class="text-xs text-slate-400">Order: {selectedTable.activeOrderNumber}</p>
				</div>
				<button
					type="button"
					onclick={() => (billingModalOpen = false)}
					class="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs"
				>
					✕
				</button>
			</div>

			<!-- Bill Summary -->
			<div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
				<div class="flex justify-between text-slate-600 dark:text-slate-300">
					<span>Food Subtotal</span>
					<span>₹{selectedTable.activeOrderTotal?.toFixed(2)}</span>
				</div>
				<div class="flex justify-between text-slate-600 dark:text-slate-300">
					<span>GST (5%)</span>
					<span>₹{((selectedTable.activeOrderTotal || 0) * 0.05).toFixed(2)}</span>
				</div>
				<div class="flex justify-between font-black text-base text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
					<span>Total Payable</span>
					<span class="text-blue-600 dark:text-blue-400">
						₹{((selectedTable.activeOrderTotal || 0) * 1.05).toFixed(2)}
					</span>
				</div>
			</div>

			<!-- Payment Method Selector -->
			<div class="space-y-1.5">
				<span class="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Payment Mode</span>
				<div class="grid grid-cols-3 gap-2 text-xs font-bold">
					<button
						type="button"
						onclick={() => (paymentMethod = 'UPI')}
						class="py-2.5 rounded-xl border text-center transition {paymentMethod === 'UPI' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}"
					>
						📲 UPI QR
					</button>
					<button
						type="button"
						onclick={() => (paymentMethod = 'CASH')}
						class="py-2.5 rounded-xl border text-center transition {paymentMethod === 'CASH' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}"
					>
						💵 Cash
					</button>
					<button
						type="button"
						onclick={() => (paymentMethod = 'CARD')}
						class="py-2.5 rounded-xl border text-center transition {paymentMethod === 'CARD' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}"
					>
						💳 Card POS
					</button>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="pt-2 flex items-center gap-2">
				<button
					type="button"
					onclick={settleBill}
					disabled={isSettling}
					class="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition disabled:opacity-50"
				>
					{isSettling ? 'Recording Settlement...' : '✓ Complete & Clear Table'}
				</button>
			</div>
		</div>
	</div>
{/if}
</AuthGuard>
