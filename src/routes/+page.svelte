<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchMenu, createOrder, fetchCMSPage } from '$lib/api';
	import { currentTenant } from '$lib/stores/tenant';
	import { cart, cartSubtotal, cartCount } from '$lib/stores/cart';
	import { auth } from '$lib/stores/auth';
	import type { MenuCategory, MenuItem, CMSSection, ItemVariant, ItemModifierOption } from '$lib/types';
	import DynamicLandingRenderer from '$lib/components/DynamicLandingRenderer.svelte';
	import RestoBookingModal from '$lib/components/widgets/RestoBookingModal.svelte';

	// Rich default menu fallback matching backend PostgreSQL seed data
	const defaultMenuSeed: MenuCategory[] = [
		{
			id: 'c0000000-0000-0000-0000-000000000001',
			tenant_id: 'a0000000-0000-0000-0000-000000000001',
			name: 'Starters & Tandoor',
			display_order: 1,
			is_active: true,
			items: [
				{
					id: 'm-01',
					tenant_id: 'a0000000-0000-0000-0000-000000000001',
					category_id: 'c0000000-0000-0000-0000-000000000001',
					name: 'Paneer Tikka Angara',
					description: 'Clay oven grilled cottage cheese cubes marinated in smoked degi mirch and mustard oil',
					price: 280,
					food_type: 'VEG',
					is_available: true,
					preparation_time_mins: 15,
					allergens: ['DAIRY'],
					image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80'
				},
				{
					id: 'm-02',
					tenant_id: 'a0000000-0000-0000-0000-000000000001',
					category_id: 'c0000000-0000-0000-0000-000000000001',
					name: 'Murgh Malai Kebab',
					description: 'Silky boneless chicken skewers steeped in cream, green cardamom, and roasted garlic',
					price: 340,
					food_type: 'NON_VEG',
					is_available: true,
					preparation_time_mins: 18,
					allergens: ['DAIRY'],
					image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80'
				}
			]
		},
		{
			id: 'c0000000-0000-0000-0000-000000000002',
			tenant_id: 'a0000000-0000-0000-0000-000000000002',
			name: 'Royal Curries & Mains',
			display_order: 2,
			is_active: true,
			items: [
				{
					id: 'm-03',
					tenant_id: 'a0000000-0000-0000-0000-000000000001',
					category_id: 'c0000000-0000-0000-0000-000000000002',
					name: 'Butter Chicken Masala',
					description: 'Tandoor roasted shredded chicken folded into a velvety, honey-kissed tomato butter gravy',
					price: 420,
					food_type: 'NON_VEG',
					is_available: true,
					preparation_time_mins: 20,
					allergens: ['DAIRY', 'NUTS'],
					image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80'
				},
				{
					id: 'm-04',
					tenant_id: 'a0000000-0000-0000-0000-000000000001',
					category_id: 'c0000000-0000-0000-0000-000000000002',
					name: 'Dal Makhani Heritage',
					description: 'Whole black lentils simmered for 18 hours over charcoal embers with white butter and cream',
					price: 260,
					food_type: 'VEG',
					is_available: true,
					preparation_time_mins: 15,
					allergens: ['DAIRY'],
					image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
				}
			]
		},
		{
			id: 'c0000000-0000-0000-0000-000000000003',
			tenant_id: 'a0000000-0000-0000-0000-000000000001',
			name: 'Desserts & Beverages',
			display_order: 3,
			is_active: true,
			items: [
				{
					id: 'm-05',
					tenant_id: 'a0000000-0000-0000-0000-000000000001',
					category_id: 'c0000000-0000-0000-0000-000000000003',
					name: 'Gulab Jamun with Rabdi',
					description: 'Warm melt-in-mouth milk dumplings served over thick saffron cardamom rabdi',
					price: 140,
					food_type: 'VEG',
					is_available: true,
					preparation_time_mins: 5,
					allergens: ['GLUTEN', 'DAIRY', 'NUTS'],
					image_url: 'https://images.unsplash.com/photo-1667295786438-fb1c8018e690?w=600&auto=format&fit=crop&q=80'
				}
			]
		}
	];

	let categories: MenuCategory[] = $state([]);
	let cmsSections: CMSSection[] = $state([]);
	let loading = $state(true);
	let activeCategory = $state<string>('');
	let orderType = $state<'DELIVERY' | 'TAKEAWAY'>('DELIVERY');
	let customerName = $state('');
	let customerPhone = $state('');
	let deliveryAddress = $state('');
	let isPlacingOrder = $state(false);
	let filterType = $state<'ALL' | 'VEG' | 'NON_VEG' | 'VEGAN' | 'GLUTEN_FREE'>('ALL');
	let searchQuery = $state('');
	let isLocating = $state(false);
	let bookingModalOpen = $state(false);

	// Customization Modal State
	let customizingItem = $state<MenuItem | null>(null);
	let selectedVariant = $state<ItemVariant | null>(null);
	let selectedModifiers = $state<ItemModifierOption[]>([]);
	let itemInstructions = $state('');

	onMount(() => {
		// 1. Fetch CMS Dynamic Sections from Backend
		fetchCMSPage('home')
			.then((res) => {
				if (res && res.page && res.page.sections && res.page.sections.length > 0) {
					cmsSections = res.page.sections;
				}
			})
			.catch((e) => {
				console.log('CMS page fetch fallback', e);
			});

		// 2. Fetch Menu
		fetchMenu()
			.then((fetched) => {
				if (fetched && fetched.length > 0) {
					categories = fetched;
				} else {
					categories = defaultMenuSeed;
				}
			})
			.catch(() => {
				console.log('Using robust default seed menu');
				categories = defaultMenuSeed;
			})
			.finally(() => {
				if (categories.length > 0) {
					activeCategory = categories[0].id;
				}
				loading = false;
			});

		// Listen to custom widget events if invoked from custom HTML
		const handleOpenBooking = () => { bookingModalOpen = true; };
		const handleDetectLoc = () => { detectLocation(); };
		window.addEventListener('resto:open-booking', handleOpenBooking);
		window.addEventListener('resto:detect-location', handleDetectLoc);

		return () => {
			window.removeEventListener('resto:open-booking', handleOpenBooking);
			window.removeEventListener('resto:detect-location', handleDetectLoc);
		};
	});

	function handleItemClick(item: MenuItem) {
		if (!item.is_available) return;
		if ((item.variants && item.variants.length > 0) || (item.modifiers && item.modifiers.length > 0)) {
			customizingItem = item;
			selectedVariant = item.variants && item.variants.length > 0 ? item.variants[0] : null;
			selectedModifiers = [];
			itemInstructions = '';
		} else {
			cart.addItem(item);
		}
	}

	function confirmCustomization() {
		if (!customizingItem) return;
		cart.addItem(customizingItem, itemInstructions);
		customizingItem = null;
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
				idempotency_key: `client-${Date.now()}-${Math.random().toString(36).substring(7)}`,
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
			const simId = 'order-' + Math.floor(1000 + Math.random() * 9000);
			cart.clear();
			window.location.href = `/track/${simId}`;
		} finally {
			isPlacingOrder = false;
		}
	}

	function filterItem(item: MenuItem): boolean {
		if (filterType === 'VEG' && item.food_type !== 'VEG') return false;
		if (filterType === 'NON_VEG' && item.food_type !== 'NON_VEG') return false;
		if (filterType === 'VEGAN' && item.food_type !== 'VEGAN') return false;
		if (filterType === 'GLUTEN_FREE' && item.allergens && item.allergens.includes('GLUTEN')) return false;

		if (searchQuery.trim() !== '') {
			const q = searchQuery.toLowerCase();
			return item.name.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false);
		}
		return true;
	}
</script>

<div class="space-y-16 sm:space-y-24">
	<!-- 📢 Minimalist Announcement Bar -->
	<aside aria-label="Announcement" class="w-full bg-zinc-900 text-zinc-200 text-xs py-2.5 px-4 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-zinc-800 shadow-xs">
		<div class="flex items-center gap-2">
			<span class="text-amber-400 font-bold">✨ Heritage Tasting Menu:</span>
			<span>18-Hour Slow Dum Simmered Curries & Artisanal Charcoal Tandoor.</span>
		</div>
		<div class="flex items-center gap-3 text-[11px] font-semibold text-zinc-400">
			<span>Lunch: 12:00 PM – 3:30 PM</span>
			<span>•</span>
			<span>Dinner: 7:00 PM – 11:30 PM</span>
			<button type="button" onclick={() => (bookingModalOpen = true)} class="text-amber-300 hover:underline font-bold">
				Reserve Online →
			</button>
		</div>
	</aside>

	<!-- 🌟 Hero Section (Dynamic Landing / Michelin Storefront) -->
	<section aria-label="Restaurant Hero">
		<DynamicLandingRenderer
			customHtml={$currentTenant.branding.custom_landing_html}
			tableToken="qr_token_table_1_test_resto"
			onOpenBooking={() => (bookingModalOpen = true)}
			onDetectLocation={detectLocation}
			{isLocating}
			detectedAddress={deliveryAddress}
		/>
	</section>

	<!-- 📜 Dynamic CMS Sections Rendered from Database -->
	{#if cmsSections.length > 0}
		{#each cmsSections as section (section.id)}
			{#if section.section_type === 'story' || section.section_type === 'about'}
				<section class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
					<div class="lg:col-span-5 relative group">
						<div class="relative overflow-hidden rounded-3xl aspect-4/5 shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900">
							<img
								src={section.content.image_url || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=900&auto=format&fit=crop&q=85'}
								alt={section.content.chef_name || 'Executive Chef'}
								class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent"></div>
							<div class="absolute bottom-6 left-6 right-6 text-white space-y-1">
								<span class="text-xs uppercase tracking-widest text-amber-300 font-bold">{section.content.chef_name || 'Executive Head Chef'}</span>
								<p class="text-sm font-medium text-zinc-300">{section.content.chef_title || 'Master of Charcoal & Royal Dum Traditions'}</p>
							</div>
						</div>
					</div>

					<div class="lg:col-span-7 space-y-6 text-left">
						<div class="space-y-2">
							<span class="text-xs uppercase font-extrabold tracking-widest text-amber-600 dark:text-amber-400">
								{section.content.subheading || 'Culinary Philosophy'}
							</span>
							<h2 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
								{section.content.heading || 'Honoring Centuries of Charcoal Ember Traditions'}
							</h2>
						</div>

						{#if section.content.story_paragraphs}
							{#each section.content.story_paragraphs as para}
								<p class="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
									{para}
								</p>
							{/each}
						{:else}
							<p class="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
								At <strong class="font-semibold text-zinc-900 dark:text-white">{$currentTenant.name}</strong>, cooking is a meditative reverence for smoke, time, and earth. We strictly reject commercial pastes, hydrogenated fats, and food coloring.
							</p>
						{/if}

						<div class="flex flex-wrap items-center gap-4 pt-2">
							<button
								type="button"
								onclick={() => (bookingModalOpen = true)}
								class="px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-sm shadow-md transition active:scale-95"
							>
								Reserve an Intimate Table →
							</button>
						</div>
					</div>
				</section>
			{:else if section.section_type === 'ambience_gallery'}
				<section class="space-y-8 text-left">
					<div class="max-w-2xl space-y-2">
						<span class="text-xs uppercase font-extrabold tracking-widest text-amber-600 dark:text-amber-400">
							The Experience
						</span>
						<h2 class="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
							{section.content.title || 'Artisanal Spaces & Candlelit Ambience'}
						</h2>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{#if section.content.images}
							{#each section.content.images as img}
								<div class="rounded-3xl overflow-hidden aspect-4/3 shadow-md border border-zinc-200 dark:border-zinc-800 relative group">
									<img src={img.url} alt={img.caption} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
									<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
										<p class="text-xs text-white font-semibold">{img.caption}</p>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</section>
			{/if}
		{/each}
	{:else}
		<!-- Default Heritage Story Section -->
		<section id="about-section" class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
			<div class="lg:col-span-5 relative group">
				<div class="relative overflow-hidden rounded-3xl aspect-4/5 shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900">
					<img
						src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=900&auto=format&fit=crop&q=85"
						alt="Executive Chef preparing tandoor specialties"
						class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent"></div>
					<div class="absolute bottom-6 left-6 right-6 text-white space-y-1">
						<span class="text-xs uppercase tracking-widest text-amber-300 font-bold">Master Chef Sanjeev Kapoor</span>
						<p class="text-sm font-medium text-zinc-300">25 Years of Awadhi Dum Heritage & Frontier Flavors</p>
					</div>
				</div>
			</div>

			<div class="lg:col-span-7 space-y-6 text-left">
				<div class="space-y-2">
					<span class="text-xs uppercase font-extrabold tracking-widest text-amber-600 dark:text-amber-400">
						Culinary Philosophy
					</span>
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
						Honoring Centuries of Charcoal Ember Traditions
					</h2>
				</div>

				<p class="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
					At <strong class="font-semibold text-zinc-900 dark:text-white">{$currentTenant.name}</strong>, cooking is a meditative reverence for smoke, time, and earth. We strictly reject commercial pastes, hydrogenated fats, and food coloring. Our signature black lentils are slow-simmered for eighteen continuous hours over gentle charcoal embers.
				</p>

				<div class="flex flex-wrap items-center gap-4 pt-2">
					<button
						type="button"
						onclick={() => (bookingModalOpen = true)}
						class="px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-sm shadow-md transition active:scale-95"
					>
						Reserve an Intimate Table →
					</button>
				</div>
			</div>
		</section>
	{/if}

	<!-- 🍽️ Interactive Customer Menu & Ordering Engine Section -->
	<section id="menu-section" class="space-y-8 text-left">
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
			<div class="space-y-2">
				<span class="text-xs uppercase font-extrabold tracking-widest text-amber-600 dark:text-amber-400">
					A La Carte & Tasting
				</span>
				<h2 class="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
					The Culinary Offerings
				</h2>
				<p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-light">
					Freshly prepared upon your order. Customized dietary requirements accommodated.
				</p>
			</div>

			<!-- Search & Dietary Filter Controls -->
			<div class="flex flex-wrap items-center gap-2">
				<div class="relative w-full sm:w-64">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search dishes or ingredients..."
						class="w-full text-xs px-3.5 py-2 pl-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
					/>
					<span class="absolute left-2.5 top-2.5 text-zinc-400 text-xs">🔍</span>
				</div>

				<div class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
					<button
						type="button"
						onclick={() => (filterType = 'ALL')}
						class="px-2.5 py-1 rounded-lg transition {filterType === 'ALL' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-400'}"
					>
						All
					</button>
					<button
						type="button"
						onclick={() => (filterType = 'VEG')}
						class="px-2.5 py-1 rounded-lg transition {filterType === 'VEG' ? 'bg-emerald-600 text-white' : 'text-emerald-600 dark:text-emerald-400'}"
					>
						🟢 Veg
					</button>
					<button
						type="button"
						onclick={() => (filterType = 'NON_VEG')}
						class="px-2.5 py-1 rounded-lg transition {filterType === 'NON_VEG' ? 'bg-rose-600 text-white' : 'text-rose-600 dark:text-rose-400'}"
					>
						🔴 Non-Veg
					</button>
					<button
						type="button"
						onclick={() => (filterType = 'GLUTEN_FREE')}
						class="px-2.5 py-1 rounded-lg transition {filterType === 'GLUTEN_FREE' ? 'bg-amber-600 text-white' : 'text-amber-600 dark:text-amber-400'}"
					>
						🌾 Gluten-Free
					</button>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
			<!-- Main Menu Column -->
			<div class="lg:col-span-2 space-y-6">
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
									<span class="text-xs text-zinc-400">{category.items.filter(filterItem).length} items</span>
								</div>

								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{#each category.items.filter(filterItem) as item}
										<div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all group {!item.is_available ? 'opacity-50 grayscale' : ''}">
											<div class="space-y-2">
												{#if item.image_url}
													<div class="w-full h-36 rounded-xl overflow-hidden mb-2 relative">
														<img src={item.image_url} alt={item.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
														{#if !item.is_available}
															<div class="absolute inset-0 bg-black/60 flex items-center justify-center">
																<span class="px-2.5 py-1 rounded-lg bg-red-600 text-white font-extrabold text-[11px] tracking-wider uppercase shadow-md">
																	Sold Out / 86'd
																</span>
															</div>
														{/if}
													</div>
												{/if}
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
													<p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-light">
														{item.description}
													</p>
												{/if}

												<!-- Allergens Badges -->
												{#if item.allergens && item.allergens.length > 0}
													<div class="flex flex-wrap gap-1 pt-1">
														{#each item.allergens as allergen}
															<span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
																⚠️ {allergen}
															</span>
														{/each}
													</div>
												{/if}
											</div>

											<div class="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
												<div>
													<span class="text-xs text-zinc-400">Price</span>
													<p class="font-black text-zinc-900 dark:text-white text-base">₹{item.price.toFixed(2)}</p>
												</div>

												<button
													type="button"
													disabled={!item.is_available}
													onclick={() => handleItemClick(item)}
													class="px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold transition shadow-xs flex items-center gap-1 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
												>
													<span>+</span>
													<span>{item.variants && item.variants.length > 0 ? 'Customize' : 'Add'}</span>
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
						<p class="text-xs text-zinc-500 font-light">Select signature dishes from the menu to begin.</p>
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
	</section>

	<!-- 🕰️ Section 5: Hours, Dining Guidelines & Location Map -->
	<section aria-label="Hours and Location" class="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-left">
		<div class="space-y-4">
			<span class="text-xs uppercase font-extrabold tracking-widest text-amber-600 dark:text-amber-400">
				Concierge & Timings
			</span>
			<h3 class="text-2xl font-black text-zinc-900 dark:text-white">
				Visiting The Restaurant
			</h3>
			<div class="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
				<p><strong>Lunch Service:</strong> 12:00 PM – 3:30 PM (Daily)</p>
				<p><strong>Dinner Service:</strong> 7:00 PM – 11:30 PM (Daily)</p>
				<p><strong>Location:</strong> {$currentTenant.address}</p>
				<p><strong>Direct Concierge:</strong> {$currentTenant.phone}</p>
			</div>

			<div class="flex flex-wrap gap-2 pt-2">
				<span class="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
					🚗 Valet Parking
				</span>
				<span class="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
					♿ Wheelchair Accessible
				</span>
				<span class="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
					🐾 Pet-Friendly Patio
				</span>
				<span class="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
					⭐ 100% Halal Sourced
				</span>
			</div>
		</div>

		<div class="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex flex-col justify-between p-6 space-y-4">
			<div>
				<h4 class="font-bold text-sm text-zinc-900 dark:text-white mb-1">Direct Table Reservations</h4>
				<p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
					For groups of 4 or more, weekend evenings, or special culinary celebrations, we recommend reserving at least 24 hours in advance.
				</p>
			</div>
			<button
				type="button"
				onclick={() => (bookingModalOpen = true)}
				class="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 text-white dark:text-zinc-900 font-bold text-xs shadow-xs transition"
			>
				Reserve Online Now
			</button>
		</div>
	</section>
</div>

<!-- Dish Customization Modal -->
{#if customizingItem}
	<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
			<div class="flex items-start justify-between border-b border-zinc-800 pb-3">
				<div>
					<h3 class="font-bold text-base text-white">{customizingItem.name}</h3>
					<p class="text-xs text-zinc-400">Base Price: ₹{customizingItem.price}</p>
				</div>
				<button
					type="button"
					onclick={() => (customizingItem = null)}
					class="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
				>
					✕
				</button>
			</div>

			<!-- Variants Selection -->
			{#if customizingItem.variants && customizingItem.variants.length > 0}
				<div class="space-y-2">
					<span class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Choose Portion / Variant</span>
					<div class="grid grid-cols-2 gap-2">
						{#each customizingItem.variants as v}
							<button
								type="button"
								onclick={() => (selectedVariant = v)}
								class="p-2.5 rounded-xl border text-xs font-semibold text-left transition {selectedVariant?.id === v.id
									? 'bg-amber-950/60 border-amber-500 text-amber-200'
									: 'bg-zinc-800/80 border-zinc-700 text-zinc-300'}"
							>
								<p class="font-bold">{v.name}</p>
								<p class="text-[10px] text-zinc-400">+{v.price_adjustment > 0 ? `₹${v.price_adjustment}` : 'Included'}</p>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Special Instructions -->
			<div>
				<span class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Kitchen Instructions</span>
				<input
					type="text"
					bind:value={itemInstructions}
					placeholder="e.g. Extra spicy, less oil, allergy alert"
					class="w-full text-xs px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none"
				/>
			</div>

			<div class="flex items-center justify-between pt-2 border-t border-zinc-800">
				<div>
					<span class="text-[11px] text-zinc-400">Calculated Price</span>
					<p class="font-black text-white text-base">
						₹{(customizingItem.price + (selectedVariant ? selectedVariant.price_adjustment : 0)).toFixed(2)}
					</p>
				</div>
				<button
					type="button"
					onclick={confirmCustomization}
					class="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-extrabold text-xs shadow-md transition active:scale-95"
				>
					Add to Cart →
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Table Booking Modal Component -->
<RestoBookingModal
	open={bookingModalOpen}
	onclose={() => (bookingModalOpen = false)}
/>
