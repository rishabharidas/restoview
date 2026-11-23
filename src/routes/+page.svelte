<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchMenu, createOrder } from '$lib/api';
	import { currentTenant } from '$lib/stores/tenant';
	import { cart, cartSubtotal, cartCount } from '$lib/stores/cart';
	import type { MenuCategory, MenuItem } from '$lib/types';

	let categories: MenuCategory[] = $state([]);
	let loading = $state(true);
	let activeCategory = $state<string>('');
	let orderType = $state<'DELIVERY' | 'TAKEAWAY'>('DELIVERY');
	let customerName = $state('');
	let customerPhone = $state('');
	let deliveryAddress = $state('');
	let isPlacingOrder = $state(false);
	let filterType = $state<'ALL' | 'VEG' | 'NON_VEG'>('ALL');

	onMount(async () => {
		try {
			categories = await fetchMenu();
			if (categories.length > 0) {
				activeCategory = categories[0].id;
			}
		} catch (err) {
			console.error('Menu load error:', err);
		} finally {
			loading = false;
		}
	});

	function handleAddToCart(item: MenuItem) {
		cart.addItem(item);
	}

	async function handleCheckout() {
		if ($cart.length === 0) return;
		if (!customerName || !customerPhone) {
			alert('Please enter your name and phone number');
			return;
		}
		if (orderType === 'DELIVERY' && !deliveryAddress) {
			alert('Please enter your delivery address');
			return;
		}

		isPlacingOrder = true;
		try {
			const res = await createOrder({
				order_type: orderType,
				customer_name: customerName,
				customer_phone: customerPhone,
				delivery_address: deliveryAddress,
				delivery_lat: 12.9716,
				delivery_lng: 77.5946,
				items: $cart.map((c) => ({
					item_id: c.item.id,
					quantity: c.quantity,
					special_instructions: c.instructions
				}))
			});

			cart.clear();
			window.location.href = res.tracking_url;
		} catch (err: any) {
			alert(err.message || 'Error placing order');
		} finally {
			isPlacingOrder = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Hero Banner & Order Mode Switcher -->
	<section class="rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 text-white p-6 sm:p-8 shadow-md">
		<div class="max-w-2xl">
			<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 mb-3 tracking-wide uppercase">
				Multi-Tenant White-Label Ordering
			</span>
			<h2 class="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
				Delicious Food, Delivered Fast.
			</h2>
			<p class="text-rose-100 text-sm sm:text-base mb-6">
				Order directly from {$currentTenant.name} with real-time GPS tracking and zero app downloads.
			</p>

			<!-- Order Type Toggle -->
			<div class="inline-flex rounded-xl bg-black/20 p-1 backdrop-blur border border-white/10">
				<button
					type="button"
					onclick={() => (orderType = 'DELIVERY')}
					class="px-5 py-2 rounded-lg text-sm font-semibold transition {orderType === 'DELIVERY' ? 'bg-white text-rose-700 shadow-sm' : 'text-white/80 hover:text-white'}"
				>
					🛵 Home Delivery
				</button>
				<button
					type="button"
					onclick={() => (orderType = 'TAKEAWAY')}
					class="px-5 py-2 rounded-lg text-sm font-semibold transition {orderType === 'TAKEAWAY' ? 'bg-white text-rose-700 shadow-sm' : 'text-white/80 hover:text-white'}"
				>
					🛍️ Takeaway / Pickup
				</button>
			</div>
		</div>
	</section>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
		<!-- Menu List (Left 2 Columns) -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Category Tabs & Food Filter -->
			<div class="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 overflow-x-auto">
				<div class="flex gap-2">
					{#each categories as cat}
						<button
							type="button"
							onclick={() => (activeCategory = cat.id)}
							class="px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap {activeCategory === cat.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
						>
							{cat.name}
						</button>
					{/each}
				</div>

				<!-- Veg / Non-Veg Filter -->
				<div class="flex gap-1 shrink-0">
					<button
						type="button"
						onclick={() => (filterType = 'ALL')}
						class="px-2.5 py-1 text-xs rounded-md border {filterType === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600'}"
					>
						All
					</button>
					<button
						type="button"
						onclick={() => (filterType = 'VEG')}
						class="px-2.5 py-1 text-xs rounded-md border {filterType === 'VEG' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-200'}"
					>
						🟢 Veg
					</button>
					<button
						type="button"
						onclick={() => (filterType = 'NON_VEG')}
						class="px-2.5 py-1 text-xs rounded-md border {filterType === 'NON_VEG' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-700 border-rose-200'}"
					>
						🔴 Non-Veg
					</button>
				</div>
			</div>

			<!-- Dishes List -->
			{#if loading}
				<div class="text-center py-12 text-slate-400">Loading restaurant menu...</div>
			{:else}
				{#each categories as category}
					{#if activeCategory === '' || activeCategory === category.id}
						<div class="space-y-4">
							<h3 class="text-xl font-bold text-slate-800 tracking-tight">{category.name}</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{#each category.items.filter((it) => filterType === 'ALL' || it.food_type === filterType) as item}
									<div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
										<div>
											<div class="flex items-center gap-2 mb-1">
												<span class="text-xs px-1.5 py-0.5 rounded font-bold {item.food_type === 'VEG' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}">
													{item.food_type === 'VEG' ? '🟢 VEG' : '🔴 NON-VEG'}
												</span>
												<span class="text-xs text-slate-400">⏱️ {item.preparation_time_mins}m</span>
											</div>
											<h4 class="font-bold text-base text-slate-900">{item.name}</h4>
											{#if item.description}
												<p class="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
											{/if}
										</div>

										<div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
											<span class="font-bold text-slate-900 text-base">₹{item.price.toFixed(2)}</span>
											<button
												type="button"
												onclick={() => handleAddToCart(item)}
												class="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-sm active:scale-95"
											>
												+ Add to Cart
											</button>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			{/if}
		</div>

		<!-- Cart & Checkout Sidebar (Right Column) -->
		<div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-20">
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<h3 class="font-bold text-base text-slate-900 flex items-center gap-2">
					🛒 Your Order <span class="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{$cartCount} items</span>
				</h3>
				{#if $cart.length > 0}
					<button type="button" onclick={() => cart.clear()} class="text-xs text-slate-400 hover:text-rose-600">
						Clear
					</button>
				{/if}
			</div>

			<!-- Cart Items List -->
			{#if $cart.length === 0}
				<div class="py-8 text-center text-slate-400 text-sm">
					Your cart is currently empty.<br />Add dishes from the menu to start!
				</div>
			{:else}
				<div class="space-y-3 max-h-60 overflow-y-auto pr-1">
					{#each $cart as cartItem}
						<div class="flex items-center justify-between text-sm py-1 border-b border-slate-50">
							<div class="flex-1 pr-2">
								<p class="font-medium text-slate-800 leading-tight">{cartItem.item.name}</p>
								<p class="text-xs text-slate-400">₹{cartItem.item.price} each</p>
							</div>
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={() => cart.removeItem(cartItem.item.id)}
									class="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200"
								>
									-
								</button>
								<span class="text-xs font-bold w-4 text-center">{cartItem.quantity}</span>
								<button
									type="button"
									onclick={() => cart.addItem(cartItem.item)}
									class="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200"
								>
									+
								</button>
							</div>
						</div>
					{/each}
				</div>

				<!-- Customer Details Form -->
				<div class="space-y-2 pt-2 border-t border-slate-100">
					<input
						type="text"
						bind:value={customerName}
						placeholder="Your Name *"
						class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500"
					/>
					<input
						type="tel"
						bind:value={customerPhone}
						placeholder="WhatsApp Number (for live updates) *"
						class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500"
					/>
					{#if orderType === 'DELIVERY'}
						<textarea
							bind:value={deliveryAddress}
							placeholder="Delivery Address *"
							rows="2"
							class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500"
						></textarea>
					{/if}
				</div>

				<!-- Totals -->
				<div class="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
					<div class="flex justify-between">
						<span>Subtotal</span>
						<span>₹{$cartSubtotal.toFixed(2)}</span>
					</div>
					<div class="flex justify-between">
						<span>GST (5%)</span>
						<span>₹{($cartSubtotal * 0.05).toFixed(2)}</span>
					</div>
					{#if orderType === 'DELIVERY'}
						<div class="flex justify-between">
							<span>Delivery Fee</span>
							<span>₹40.00</span>
						</div>
					{/if}
					<div class="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
						<span>Total</span>
						<span>₹{($cartSubtotal * 1.05 + (orderType === 'DELIVERY' ? 40 : 0)).toFixed(2)}</span>
					</div>
				</div>

				<button
					type="button"
					onclick={handleCheckout}
					disabled={isPlacingOrder}
					class="w-full py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm shadow hover:bg-rose-700 transition disabled:opacity-50 active:scale-98"
				>
					{isPlacingOrder ? 'Placing Order...' : 'Confirm & Place Order'}
				</button>
			{/if}
		</div>
	</div>
</div>
