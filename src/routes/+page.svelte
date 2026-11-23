<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchMenu, createOrder } from '$lib/api';
	import { currentTenant } from '$lib/stores/tenant';
	import { cart, cartSubtotal, cartCount } from '$lib/stores/cart';
	import { auth } from '$lib/stores/auth';
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
	let isLocating = $state(false);

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

	function detectLocation() {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser.');
			return;
		}
		isLocating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				deliveryAddress = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)} (Current GPS Location)`;
				isLocating = false;
			},
			(err) => {
				alert('Could not detect location: ' + err.message);
				isLocating = false;
			}
		);
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

<div class="space-y-10">
	<!-- 🌟 Hero Section: Premium Dark Grey / Charcoal Showcase -->
	<section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6 sm:p-10 lg:p-12 shadow-2xl border border-zinc-800">
		<!-- Subtle Graphite Ambient Glow -->
		<div class="absolute -top-24 -right-24 w-96 h-96 bg-zinc-700/20 rounded-full blur-3xl pointer-events-none"></div>
		<div class="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

		<div class="relative z-10 max-w-3xl space-y-4">
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

			<!-- Main Headline (matches test assertion) -->
			<h2 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
				Delicious Food, Delivered Fast.
			</h2>

			<p class="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl">
				Welcome to <strong class="text-white">{$currentTenant.name}</strong>. Experience artisanal gastronomy prepared by world-class chefs. Whether dining at your table or enjoying gourmet delivery at home, savor precision flavor with instant live GPS tracking.
			</p>

			<!-- 🚀 Dual Experience Fast Gateway: Dine-In QR vs Home Delivery -->
			<div class="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
				<!-- Card 1: Dine-In Service -->
				<div class="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 border border-zinc-800 hover:border-amber-400/50 transition-all group">
					<div class="flex items-center gap-3 mb-2">
						<span class="text-2xl p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-400/20">🍽️</span>
						<div>
							<h3 class="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Dine-In Table Service</h3>
							<p class="text-xs text-zinc-400">Seated at a restaurant table?</p>
						</div>
					</div>
					<p class="text-xs text-zinc-400 mb-3 leading-relaxed">
						Scan the acrylic stand or open Table 1 directly to order with multiplayer shared cart and digital waiter call.
					</p>
					<div class="flex items-center gap-2">
						<a
							href="/table/qr_token_table_1_test_resto"
							class="flex-1 text-center px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-xs transition shadow-sm active:scale-95"
						>
							Open Table 1 Menu →
						</a>
						<a
							href="/table/qr-print"
							class="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition border border-zinc-700"
							title="View & Print Acrylic Stand QR codes"
						>
							🖨️ QR Stands
						</a>
					</div>
				</div>

				<!-- Card 2: Home Delivery Service -->
				<div class="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all group">
					<div class="flex items-center gap-3 mb-2">
						<span class="text-2xl p-2 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700">🛵</span>
						<div>
							<h3 class="font-bold text-sm text-white group-hover:text-zinc-200 transition-colors">Doorstep Delivery</h3>
							<p class="text-xs text-zinc-400">Craving chef specialties at home?</p>
						</div>
					</div>
					<p class="text-xs text-zinc-400 mb-3 leading-relaxed">
						Order below with zero app installation. Get real-time WhatsApp updates & live driver map tracking.
					</p>
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={detectLocation}
							class="flex-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition shadow-sm flex items-center justify-center gap-1 active:scale-95"
						>
							<span>📍</span>
							<span>{isLocating ? 'Detecting...' : 'Detect My Location'}</span>
						</button>
						<a
							href="#menu-section"
							class="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition border border-zinc-700"
						>
							Browse Dishes ↓
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 🏅 Restaurant Pillars / Achievements Showcase (Dark Grey Cards) -->
	<section class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
		<div class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3 transition hover:border-zinc-400 dark:hover:border-zinc-700">
			<span class="text-2xl p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">🔥</span>
			<div>
				<h4 class="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">Clay Tandoor</h4>
				<p class="text-[11px] text-zinc-500 dark:text-zinc-400">Authentic charcoal roast</p>
			</div>
		</div>

		<div class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3 transition hover:border-zinc-400 dark:hover:border-zinc-700">
			<span class="text-2xl p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">🌱</span>
			<div>
				<h4 class="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">Farm Fresh</h4>
				<p class="text-[11px] text-zinc-500 dark:text-zinc-400">Zero artificial colors</p>
			</div>
		</div>

		<div class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3 transition hover:border-zinc-400 dark:hover:border-zinc-700">
			<span class="text-2xl p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">⚡</span>
			<div>
				<h4 class="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">30 Min Delivery</h4>
				<p class="text-[11px] text-zinc-500 dark:text-zinc-400">Insulated thermal boxes</p>
			</div>
		</div>

		<div class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3 transition hover:border-zinc-400 dark:hover:border-zinc-700">
			<span class="text-2xl p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">🧼</span>
			<div>
				<h4 class="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">5-Star Hygiene</h4>
				<p class="text-[11px] text-zinc-500 dark:text-zinc-400">Certified kitchen safety</p>
			</div>
		</div>
	</section>

	<!-- 🍽️ Menu & Live Ordering Grid -->
	<div id="menu-section" class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
		<!-- Menu List (Left 2 Columns) -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Order Mode Toggle (Delivery vs Takeaway) -->
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
				<div class="flex items-center gap-2">
					<span class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Order Mode:</span>
					<div class="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
						<button
							type="button"
							onclick={() => (orderType = 'DELIVERY')}
							class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 {orderType === 'DELIVERY'
								? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
								: 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'}"
						>
							🛵 Home Delivery
						</button>
						<button
							type="button"
							onclick={() => (orderType = 'TAKEAWAY')}
							class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 {orderType === 'TAKEAWAY'
								? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
								: 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'}"
						>
							🛍️ Takeaway / Pickup
						</button>
					</div>
				</div>

				<!-- Veg / Non-Veg Filters -->
				<div class="flex items-center gap-1.5">
					<button
						type="button"
						onclick={() => (filterType = 'ALL')}
						class="px-2.5 py-1 text-xs font-semibold rounded-lg border transition {filterType === 'ALL'
							? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
							: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'}"
					>
						All
					</button>
					<button
						type="button"
						onclick={() => (filterType = 'VEG')}
						class="px-2.5 py-1 text-xs font-semibold rounded-lg border transition {filterType === 'VEG'
							? 'bg-emerald-600 text-white border-emerald-600'
							: 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'}"
					>
						🟢 Veg
					</button>
					<button
						type="button"
						onclick={() => (filterType = 'NON_VEG')}
						class="px-2.5 py-1 text-xs font-semibold rounded-lg border transition {filterType === 'NON_VEG'
							? 'bg-rose-600 text-white border-rose-600'
							: 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'}"
					>
						🔴 Non-Veg
					</button>
				</div>
			</div>

			<!-- Category Tabs -->
			<div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800">
				{#each categories as cat}
					<button
						type="button"
						onclick={() => (activeCategory = cat.id)}
						class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap {activeCategory === cat.id
							? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
							: 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'}"
					>
						{cat.name}
					</button>
				{/each}
			</div>

			<!-- Dishes List -->
			{#if loading}
				<div class="text-center py-16 text-zinc-400 space-y-3">
					<div class="animate-spin w-8 h-8 border-3 border-zinc-700 border-t-transparent rounded-full mx-auto"></div>
					<p class="text-sm">Loading handcrafted menu...</p>
				</div>
			{:else}
				{#each categories as category}
					{#if activeCategory === '' || activeCategory === category.id}
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<h3 class="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight">{category.name}</h3>
								<span class="text-xs text-zinc-400">{category.items.length} choices</span>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{#each category.items.filter((it) => filterType === 'ALL' || it.food_type === filterType) as item}
									<div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all group">
										<div class="space-y-2">
											<div class="flex items-center justify-between">
												<span class="text-[10px] px-2 py-0.5 rounded-full font-bold {item.food_type === 'VEG'
													? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
													: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800'}">
													{item.food_type === 'VEG' ? '🟢 Pure Veg' : '🔴 Non-Veg'}
												</span>
												<span class="text-xs text-zinc-400 font-medium flex items-center gap-1">
													⏱️ {item.preparation_time_mins}m
												</span>
											</div>

											<h4 class="font-bold text-base text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
												{item.name}
											</h4>

											{#if item.description}
												<p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
													{item.description}
												</p>
											{/if}
										</div>

										<div class="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
											<div>
												<span class="text-xs text-zinc-400">Price</span>
												<p class="font-black text-zinc-900 dark:text-white text-base">₹{item.price.toFixed(2)}</p>
											</div>

											<button
												type="button"
												onclick={() => handleAddToCart(item)}
												class="px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold transition shadow-xs flex items-center gap-1 active:scale-95"
											>
												<span>+</span>
												<span>Add</span>
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
		<div id="cart-drawer" class="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm space-y-5 sticky top-20 transition-colors">
			<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
				<div>
					<h3 class="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
						🛒 Your Tray
						<span class="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
							{$cartCount} items
						</span>
					</h3>
					<p class="text-[11px] text-zinc-400">Direct order to kitchen</p>
				</div>
				{#if $cart.length > 0}
					<button
						type="button"
						onclick={() => cart.clear()}
						class="text-xs text-zinc-400 hover:text-rose-600 transition"
					>
						Clear
					</button>
				{/if}
			</div>

			<!-- Cart Items List -->
			{#if $cart.length === 0}
				<div class="py-10 text-center text-zinc-400 text-sm space-y-2">
					<span class="text-3xl block">🍲</span>
					<p>Your cart is empty.</p>
					<p class="text-xs text-zinc-500">Pick signature dishes from the menu to get started!</p>
				</div>
			{:else}
				<div class="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-zinc-100 dark:divide-zinc-800">
					{#each $cart as cartItem}
						<div class="flex items-center justify-between text-sm pt-2">
							<div class="flex-1 pr-2">
								<p class="font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">{cartItem.item.name}</p>
								<p class="text-xs text-zinc-400">₹{cartItem.item.price} each</p>
							</div>
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={() => cart.removeItem(cartItem.item.id)}
									class="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
								>
									-
								</button>
								<span class="text-xs font-bold w-4 text-center">{cartItem.quantity}</span>
								<button
									type="button"
									onclick={() => cart.addItem(cartItem.item)}
									class="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
								>
									+
								</button>
							</div>
						</div>
					{/each}
				</div>

				<!-- Customer Details Form -->
				<div class="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
					<div>
						<span class="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Your Name</span>
						<input
							type="text"
							bind:value={customerName}
							placeholder="e.g. Arun Sharma"
							class="w-full text-xs px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500"
						/>
					</div>

					<div>
						<span class="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">WhatsApp / Phone</span>
						<input
							type="tel"
							bind:value={customerPhone}
							placeholder="+91 98765 43210 (For Live Status)"
							class="w-full text-xs px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500"
						/>
					</div>

					{#if orderType === 'DELIVERY'}
						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Delivery Address</span>
								<button type="button" onclick={detectLocation} class="text-[10px] text-zinc-600 dark:text-zinc-300 hover:underline">
									📍 Auto-Detect
								</button>
							</div>
							<textarea
								bind:value={deliveryAddress}
								placeholder="Building, street, landmark, floor..."
								rows="2"
								class="w-full text-xs px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500"
							></textarea>
						</div>
					{/if}
				</div>

				<!-- Totals & Bill Breakdown -->
				<div class="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800">
					<div class="flex justify-between">
						<span>Subtotal</span>
						<span class="font-semibold text-zinc-800 dark:text-zinc-200">₹{$cartSubtotal.toFixed(2)}</span>
					</div>
					<div class="flex justify-between">
						<span>GST ({$currentTenant.settings.tax_gst_percentage}%)</span>
						<span class="font-semibold text-zinc-800 dark:text-zinc-200">₹{($cartSubtotal * ($currentTenant.settings.tax_gst_percentage / 100)).toFixed(2)}</span>
					</div>
					{#if orderType === 'DELIVERY'}
						<div class="flex justify-between">
							<span>Express Delivery Fee</span>
							<span class="font-semibold text-zinc-800 dark:text-zinc-200">₹40.00</span>
						</div>
					{/if}
					<div class="flex justify-between font-bold text-base text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-700">
						<span>Total Due</span>
						<span class="text-zinc-900 dark:text-white font-black">
							₹{($cartSubtotal * (1 + $currentTenant.settings.tax_gst_percentage / 100) + (orderType === 'DELIVERY' ? 40 : 0)).toFixed(2)}
						</span>
					</div>
				</div>

				<button
					type="button"
					onclick={handleCheckout}
					disabled={isPlacingOrder}
					class="w-full py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-extrabold text-sm shadow-md transition disabled:opacity-50 active:scale-98 flex items-center justify-center gap-2"
				>
					{#if isPlacingOrder}
						<div class="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full"></div>
						<span>Transmitting to Kitchen...</span>
					{:else}
						<span>Confirm & Place Order →</span>
					{/if}
				</button>
			{/if}
		</div>
	</div>
</div>
