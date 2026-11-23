<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolveTableQR, fetchMenu, createOrder } from '$lib/api';
	import { currentTenant } from '$lib/stores/tenant';
	import { cart, cartSubtotal, cartCount } from '$lib/stores/cart';
	import type { RestaurantTable, MenuCategory, MenuItem } from '$lib/types';

	let tableToken = $derived(page.params.token || '');
	let table = $state<RestaurantTable | null>(null);
	let categories = $state<MenuCategory[]>([]);
	let loading = $state(true);
	let errorMsg = $state('');
	let activeCategory = $state<string>('');
	let customerName = $state('');
	let customerPhone = $state('');
	let isPlacingOrder = $state(false);

	onMount(async () => {
		if (!tableToken) {
			errorMsg = 'Missing table QR token';
			loading = false;
			return;
		}
		try {
			table = await resolveTableQR(tableToken);
			categories = await fetchMenu();
			if (categories.length > 0) {
				activeCategory = categories[0].id;
			}
		} catch (err: any) {
			errorMsg = err.message || 'Invalid or expired QR code';
		} finally {
			loading = false;
		}
	});

	async function handleDineInOrder() {
		if (!table || $cart.length === 0) return;
		if (!customerName || !customerPhone) {
			alert('Please provide your name and phone number so the server can verify your table.');
			return;
		}

		isPlacingOrder = true;
		try {
			const res = await createOrder({
				order_type: 'DINE_IN',
				table_id: table.id,
				customer_name: customerName,
				customer_phone: customerPhone,
				items: $cart.map((c) => ({
					item_id: c.item.id,
					quantity: c.quantity,
					special_instructions: c.instructions
				}))
			});

			cart.clear();
			window.location.href = res.tracking_url;
		} catch (err: any) {
			alert(err.message || 'Failed to place dine-in order');
		} finally {
			isPlacingOrder = false;
		}
	}
</script>

<div class="space-y-6 max-w-4xl mx-auto">
	{#if loading}
		<div class="text-center py-20 text-slate-400">Verifying table QR token...</div>
	{:else if errorMsg}
		<div class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
			<h3 class="text-lg font-bold">Table QR Error</h3>
			<p class="text-sm mt-1">{errorMsg}</p>
			<a href="/" class="inline-block mt-4 text-xs font-semibold text-rose-600 underline">Return to Main Menu</a>
		</div>
	{:else if table}
		<!-- Table Header Banner -->
		<div class="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-2">
					<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white uppercase tracking-wider">
						Dine-In QR Order
					</span>
					<span class="text-xs text-slate-400">Capacity: {table.capacity} Persons</span>
				</div>
				<h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
					Table {table.table_number}
				</h2>
				<p class="text-xs text-slate-400">{$currentTenant.name}</p>
			</div>

			<div class="bg-white/10 px-4 py-2 rounded-xl text-right">
				<p class="text-xs text-slate-300">Status</p>
				<p class="font-bold text-sm text-emerald-400">🟢 Active Session</p>
			</div>
		</div>

		<!-- Menu & Cart Layout -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
			<!-- Menu Items -->
			<div class="lg:col-span-2 space-y-4">
				<!-- Category Tabs -->
				<div class="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
					{#each categories as cat}
						<button
							type="button"
							onclick={() => (activeCategory = cat.id)}
							class="px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap {activeCategory === cat.id ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
						>
							{cat.name}
						</button>
					{/each}
				</div>

				<!-- Items Grid -->
				{#each categories as cat}
					{#if activeCategory === '' || activeCategory === cat.id}
						<div class="space-y-3">
							<h3 class="font-bold text-lg text-slate-900">{cat.name}</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{#each cat.items as item}
									<div class="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
										<div>
											<span class="text-[10px] font-bold px-1.5 py-0.5 rounded {item.food_type === 'VEG' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}">
												{item.food_type}
											</span>
											<h4 class="font-bold text-sm text-slate-900 mt-1">{item.name}</h4>
											{#if item.description}
												<p class="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
											{/if}
										</div>

										<div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
											<span class="font-bold text-sm text-slate-900">₹{item.price.toFixed(2)}</span>
											<button
												type="button"
												onclick={() => cart.addItem(item)}
												class="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
											>
												+ Add
											</button>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<!-- Cart for Table -->
			<div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 sticky top-20">
				<h3 class="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
					Order for Table {table.table_number}
				</h3>

				{#if $cart.length === 0}
					<div class="text-center py-6 text-slate-400 text-xs">
						No items selected yet.<br />Add dishes from the menu!
					</div>
				{:else}
					<div class="space-y-2 max-h-56 overflow-y-auto">
						{#each $cart as cartItem}
							<div class="flex items-center justify-between text-xs py-1 border-b border-slate-50">
								<div>
									<p class="font-medium text-slate-800">{cartItem.item.name}</p>
									<p class="text-[10px] text-slate-400">₹{cartItem.item.price} × {cartItem.quantity}</p>
								</div>
								<div class="flex items-center gap-1.5">
									<button type="button" onclick={() => cart.removeItem(cartItem.item.id)} class="w-5 h-5 rounded bg-slate-100 font-bold">-</button>
									<span class="w-4 text-center font-bold">{cartItem.quantity}</span>
									<button type="button" onclick={() => cart.addItem(cartItem.item)} class="w-5 h-5 rounded bg-slate-100 font-bold">+</button>
								</div>
							</div>
						{/each}
					</div>

					<div class="space-y-2 pt-2 border-t border-slate-100">
						<input
							type="text"
							bind:value={customerName}
							placeholder="Your Name *"
							class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
						/>
						<input
							type="tel"
							bind:value={customerPhone}
							placeholder="Phone Number *"
							class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
						/>
					</div>

					<div class="pt-2 border-t border-slate-100 text-xs flex justify-between font-bold text-sm">
						<span>Total (incl. GST)</span>
						<span>₹{($cartSubtotal * 1.05).toFixed(2)}</span>
					</div>

					<button
						type="button"
						onclick={handleDineInOrder}
						disabled={isPlacingOrder}
						class="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow hover:bg-black transition disabled:opacity-50"
					>
						{isPlacingOrder ? 'Routing to Kitchen...' : 'Send Order to Kitchen'}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
