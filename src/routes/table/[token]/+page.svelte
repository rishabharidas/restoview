<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import {
		resolveTableQR,
		fetchMenu,
		createOrder,
		ringTableBell,
		getTableCart,
		syncTableCart,
		createWebSocketConnection
	} from '$lib/api';
	import { currentTenant } from '$lib/stores/tenant';
	import type {
		RestaurantTable,
		MenuCategory,
		MenuItem,
		TableBellAction,
		MultiplayerCartItem,
		TableSession
	} from '$lib/types';

	let tableToken = $derived(page.params.token || '');
	let table = $state<RestaurantTable | null>(null);
	let categories = $state<MenuCategory[]>([]);
	let loading = $state(true);
	let errorMsg = $state('');
	let activeCategory = $state<string>('');
	let customerName = $state('');
	let customerPhone = $state('');
	let isPlacingOrder = $state(false);

	// Milestone 2: Multiplayer Shared Cart State
	let sharedCart = $state<MultiplayerCartItem[]>([]);
	let ws = $state<WebSocket | null>(null);

	// Milestone 2: Digital Bell Alert Feedback
	let bellStatus = $state<{ active: boolean; message: string; type: string } | null>(null);
	let bellLoading = $state(false);

	// Milestone 2: Item Modifier Modal
	let selectedItemForModal = $state<MenuItem | null>(null);
	let selectedVariant = $state('Regular');
	let selectedSpice = $state('Medium');
	let selectedAddons = $state<string[]>([]);
	let specialNote = $state('');

	const cartTotal = $derived(
		sharedCart.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)
	);

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

			// Load shared table cart
			if (table) {
				const session = await getTableCart(table.id);
				if (session && session.items) {
					sharedCart = session.items;
				}

				// Join table real-time room for multiplayer sync
				ws = createWebSocketConnection([`table:${table.id}`], (msg) => {
					if (msg.event === 'MULTIPLAYER_CART_UPDATED') {
						const updatedSession = msg.payload as TableSession;
						if (updatedSession && updatedSession.items) {
							sharedCart = updatedSession.items;
						}
					}
				});
			}
		} catch (err: any) {
			errorMsg = err.message || 'Invalid or expired QR code';
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		if (ws) ws.close();
	});

	// Trigger Digital Server Bell
	async function handleRingBell(action: TableBellAction) {
		if (!table) return;
		bellLoading = true;
		try {
			const res = await ringTableBell(table.id, action, table.table_number, customerName);
			bellStatus = { active: true, message: res.message, type: action };
			setTimeout(() => {
				bellStatus = null;
			}, 5000);
		} catch (e: any) {
			alert('Could not alert server: ' + e.message);
		} finally {
			bellLoading = false;
		}
	}

	// Open Modifier Modal
	function openItemModal(item: MenuItem) {
		selectedItemForModal = item;
		selectedVariant = 'Regular';
		selectedSpice = 'Medium';
		selectedAddons = [];
		specialNote = '';
	}

	// Add item to Multiplayer Cart & sync with table
	async function handleAddConfiguredItem() {
		if (!table || !selectedItemForModal) return;
		const dinerName = customerName.trim() || 'Guest';

		let price = selectedItemForModal.price;
		if (selectedVariant === 'Full') price += 120;
		if (selectedAddons.includes('Extra Cheese')) price += 40;
		if (selectedAddons.includes('Butter Tossed')) price += 30;

		const newItem: MultiplayerCartItem = {
			id: `${selectedItemForModal.id}-${Date.now()}`,
			item_id: selectedItemForModal.id,
			item_name: selectedItemForModal.name,
			quantity: 1,
			unit_price: price,
			selected_variant: `${selectedVariant} • ${selectedSpice} Spice`,
			selected_addons: selectedAddons,
			special_instructions: specialNote,
			added_by_name: dinerName,
			added_at: new Date().toISOString()
		};

		const updatedItems = [...sharedCart, newItem];
		sharedCart = updatedItems;
		selectedItemForModal = null;

		// Broadcast to all diners at Table
		await syncTableCart(table.id, {
			table_id: table.id,
			table_number: table.table_number,
			items: updatedItems
		});
	}

	async function removeSharedItem(cartItemId: string) {
		if (!table) return;
		const updated = sharedCart.filter((i) => i.id !== cartItemId);
		sharedCart = updated;
		await syncTableCart(table.id, {
			table_id: table.id,
			table_number: table.table_number,
			items: updated
		});
	}

	async function handleDineInOrder() {
		if (!table || sharedCart.length === 0) return;
		if (!customerName || !customerPhone) {
			alert('Please provide your name and phone number so the server can verify your table order.');
			return;
		}

		isPlacingOrder = true;
		try {
			const res = await createOrder({
				order_type: 'DINE_IN',
				table_id: table.id,
				customer_name: customerName,
				customer_phone: customerPhone,
				items: sharedCart.map((c) => ({
					item_id: c.item_id,
					quantity: c.quantity,
					special_instructions: `${c.selected_variant || ''} ${c.special_instructions || ''}`
				}))
			});

			// Clear shared cart
			sharedCart = [];
			await syncTableCart(table.id, {
				table_id: table.id,
				table_number: table.table_number,
				items: []
			});

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
		<div class="text-center py-20 text-slate-400">Verifying Table QR session...</div>
	{:else if errorMsg}
		<div class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
			<h3 class="text-lg font-bold">QR Token Error</h3>
			<p class="text-sm mt-1">{errorMsg}</p>
			<a href="/" class="inline-block mt-4 text-xs font-semibold text-rose-600 underline">Return to Main Menu</a>
		</div>
	{:else if table}
		<!-- Table Header Banner with Digital Service Bell -->
		<div class="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<div class="flex items-center gap-2">
						<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white uppercase tracking-wider">
							Dine-In Session
						</span>
						<span class="text-xs text-slate-400">Capacity: {table.capacity} Guests</span>
					</div>
					<h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
						Table {table.table_number}
					</h2>
					<p class="text-xs text-slate-400">{$currentTenant.name}</p>
				</div>

				<!-- Live Table Bell Action Buttons -->
				<div class="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onclick={() => handleRingBell('CALL_WAITER')}
						disabled={bellLoading}
						class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10 active:scale-95"
					>
						🙋 Call Server
					</button>
					<button
						type="button"
						onclick={() => handleRingBell('REQUEST_WATER')}
						disabled={bellLoading}
						class="px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-xs font-bold transition flex items-center gap-1.5 border border-blue-400/20 active:scale-95"
					>
						💧 Water Refill
					</button>
					<button
						type="button"
						onclick={() => handleRingBell('REQUEST_BILL')}
						disabled={bellLoading}
						class="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition flex items-center gap-1.5 border border-amber-400/20 active:scale-95"
					>
						🧾 Request Bill
					</button>
				</div>
			</div>

			<!-- Live Toast Alert for Bell -->
			{#if bellStatus}
				<div class="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
					<span>🔔 {bellStatus.message} — A server has been alerted to your table!</span>
					<button type="button" onclick={() => (bellStatus = null)} class="text-emerald-300 hover:text-white">✕</button>
				</div>
			{/if}
		</div>

		<!-- Menu & Multiplayer Cart Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
			<!-- Menu Items -->
			<div class="lg:col-span-2 space-y-4">
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

				{#each categories as cat}
					{#if activeCategory === '' || activeCategory === cat.id}
						<div class="space-y-3">
							<h3 class="font-bold text-lg text-slate-900">{cat.name}</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{#each cat.items as item}
									<div class="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-slate-300 transition">
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
												onclick={() => openItemModal(item)}
												class="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition active:scale-95 shadow-sm"
											>
												+ Customize & Add
											</button>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<!-- Multiplayer Shared Table Cart -->
			<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 sticky top-20">
				<div class="flex items-center justify-between border-b border-slate-100 pb-2">
					<div>
						<h3 class="font-bold text-base text-slate-900 flex items-center gap-1.5">
							👥 Shared Table Cart
						</h3>
						<p class="text-[10px] text-slate-400">Live synchronized across Table {table.table_number}</p>
					</div>
					<span class="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold">
						{sharedCart.length} items
					</span>
				</div>

				{#if sharedCart.length === 0}
					<div class="text-center py-8 text-slate-400 text-xs">
						No items selected yet.<br />Anyone at Table {table.table_number} can add dishes!
					</div>
				{:else}
					<div class="space-y-3 max-h-64 overflow-y-auto pr-1">
						{#each sharedCart as it}
							<div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
								<div class="flex justify-between items-start">
									<div>
										<p class="font-bold text-slate-900">{it.item_name}</p>
										{#if it.selected_variant}
											<p class="text-[10px] text-slate-500">{it.selected_variant}</p>
										{/if}
									</div>
									<button type="button" onclick={() => removeSharedItem(it.id)} class="text-slate-400 hover:text-red-600 text-sm">✕</button>
								</div>

								<div class="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px]">
									<span class="text-slate-500">Added by <strong class="text-rose-600 font-bold">{it.added_by_name}</strong></span>
									<span class="font-bold text-slate-800">₹{it.unit_price.toFixed(2)}</span>
								</div>
							</div>
						{/each}
					</div>

					<div class="space-y-2 pt-2 border-t border-slate-100">
						<input
							type="text"
							bind:value={customerName}
							placeholder="Your Name (e.g. Arun) *"
							class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
						/>
						<input
							type="tel"
							bind:value={customerPhone}
							placeholder="WhatsApp Number (for bill & receipt) *"
							class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
						/>
					</div>

					<div class="pt-2 border-t border-slate-100 text-xs flex justify-between font-bold text-sm">
						<span>Table Total (incl. GST)</span>
						<span>₹{(cartTotal * 1.05).toFixed(2)}</span>
					</div>

					<button
						type="button"
						onclick={handleDineInOrder}
						disabled={isPlacingOrder}
						class="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow hover:bg-black transition disabled:opacity-50 active:scale-98"
					>
						{isPlacingOrder ? 'Routing to Kitchen...' : `Confirm & Send Table ${table.table_number} Order`}
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Customization / Modifier Modal -->
	{#if selectedItemForModal}
		<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
			<div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
				<div class="flex justify-between items-start border-b border-slate-100 pb-3">
					<div>
						<h3 class="font-bold text-lg text-slate-900">{selectedItemForModal.name}</h3>
						<p class="text-xs text-slate-500">Base Price: ₹{selectedItemForModal.price.toFixed(2)}</p>
					</div>
					<button type="button" onclick={() => (selectedItemForModal = null)} class="text-slate-400 hover:text-slate-600">✕</button>
				</div>

				<!-- Portion Size Options -->
				<div class="space-y-1.5">
					<label class="block text-xs font-bold text-slate-700">Portion Size</label>
					<div class="grid grid-cols-2 gap-2 text-xs">
						<button
							type="button"
							onclick={() => (selectedVariant = 'Regular')}
							class="p-2.5 rounded-xl border text-center font-semibold {selectedVariant === 'Regular' ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-slate-200'}"
						>
							Regular (+₹0)
						</button>
						<button
							type="button"
							onclick={() => (selectedVariant = 'Full')}
							class="p-2.5 rounded-xl border text-center font-semibold {selectedVariant === 'Full' ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-slate-200'}"
						>
							Large / Full (+₹120)
						</button>
					</div>
				</div>

				<!-- Spice Level -->
				<div class="space-y-1.5">
					<label class="block text-xs font-bold text-slate-700">Spice Preference</label>
					<div class="grid grid-cols-3 gap-2 text-xs">
						{#each ['Mild', 'Medium', 'Extra Spicy'] as sp}
							<button
								type="button"
								onclick={() => (selectedSpice = sp)}
								class="p-2 rounded-xl border text-center font-semibold {selectedSpice === sp ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200'}"
							>
								{sp}
							</button>
						{/each}
					</div>
				</div>

				<!-- Special Instructions -->
				<div class="space-y-1">
					<label class="block text-xs font-bold text-slate-700">Chef Instructions</label>
					<input
						type="text"
						bind:value={specialNote}
						placeholder="e.g. Less oil, no onion garnish"
						class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
					/>
				</div>

				<button
					type="button"
					onclick={handleAddConfiguredItem}
					class="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
				>
					Add to Table Cart
				</button>
			</div>
		</div>
	{/if}
</div>
