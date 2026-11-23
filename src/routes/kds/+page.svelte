<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentTenant } from '$lib/stores/tenant';
	import { updateOrderStatus, createWebSocketConnection } from '$lib/api';
	import type { Order, OrderStatus } from '$lib/types';

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
			created_at: new Date(Date.now() - 8 * 60000).toISOString(),
			items: [
				{ id: '1', item_id: '1', name: 'Paneer Tikka', quantity: 1, unit_price: 280, item_total: 280, item_status: 'IN_COOKING' },
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
			created_at: new Date(Date.now() - 2 * 60000).toISOString(),
			items: [
				{ id: '3', item_id: '3', name: 'Butter Chicken Masala', quantity: 1, unit_price: 420, item_total: 420, item_status: 'PLACED' }
			]
		}
	]);

	let ws: WebSocket | null = null;

	onMount(() => {
		// Listen for live new orders or status changes across the tenant
		ws = createWebSocketConnection([`tenant:${$currentTenant.id}`], (msg) => {
			if (msg.event === 'NEW_ORDER') {
				// Refresh or append order
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
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
		<div>
			<h2 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
				👨‍🍳 Kitchen Display System (KDS)
				<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
					LIVE
				</span>
			</h2>
			<p class="text-xs text-slate-500">Real-time station order queue for {$currentTenant.name}</p>
		</div>

		<div class="flex items-center gap-2 text-xs">
			<span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
			<span class="text-slate-600 font-medium">Realtime WebSocket Connected</span>
		</div>
	</div>

	<!-- KDS Order Cards Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
		{#each activeOrders as order}
			<div class="bg-white rounded-2xl border-2 {order.status === 'PLACED' ? 'border-rose-400' : order.status === 'IN_COOKING' ? 'border-amber-400' : 'border-slate-200'} p-5 shadow-sm flex flex-col justify-between space-y-4">
				<div>
					<div class="flex items-center justify-between">
						<span class="font-black text-lg text-slate-900">#{order.order_number}</span>
						<span class="text-xs px-2.5 py-0.5 rounded-full font-bold {order.order_type === 'DINE_IN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
							{order.order_type}
						</span>
					</div>

					<div class="mt-1 flex items-center justify-between text-xs text-slate-400">
						<span>⏱️ Received 5m ago</span>
						<span class="font-bold text-slate-700">{order.status.replace(/_/g, ' ')}</span>
					</div>

					<!-- Items List -->
					<div class="mt-4 space-y-2 border-t border-slate-100 pt-3">
						{#if order.items}
							{#each order.items as item}
								<div class="flex justify-between items-center text-xs font-semibold text-slate-800">
									<span><span class="text-rose-600 font-black">{item.quantity}×</span> {item.name}</span>
									<span class="text-[10px] text-slate-400">Station 1</span>
								</div>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Kitchen Pipeline Action Buttons -->
				<div class="space-y-1.5 pt-3 border-t border-slate-100">
					{#if order.status === 'PLACED'}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'CHEF_ACCEPTED')}
							class="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
						>
							Accept Ticket
						</button>
					{:else if order.status === 'CHEF_ACCEPTED'}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'IN_COOKING')}
							class="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition"
						>
							Start Cooking 🍳
						</button>
					{:else if order.status === 'IN_COOKING'}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'BEING_PREPARED')}
							class="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition"
						>
							Prepare Sides & Garnish 🥣
						</button>
					{:else if order.status === 'BEING_PREPARED'}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'PLATING')}
							class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
						>
							Food Plating 🍽️
						</button>
					{:else if order.status === 'PLATING'}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'READY_TO_SERVE')}
							class="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
						>
							Ready to Serve 🔔
						</button>
					{:else}
						<button
							type="button"
							onclick={() => advanceStatus(order, 'SERVED')}
							class="w-full py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition"
						>
							Mark Served / Picked Up ✓
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
