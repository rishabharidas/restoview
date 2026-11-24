<script lang="ts">
	import { onMount } from 'svelte';
	import { currentTenant, applyTheme } from '$lib/stores/tenant';
	import {
		fetchMenu,
		createMenuCategory,
		deleteMenuCategory,
		createMenuItem,
		deleteMenuItem,
		toggleItemAvailability,
		importMenuCSV,
		fetchCMSPage,
		addCMSSection,
		updateCMSSection,
		deleteCMSSection,
		reorderCMSSections,
		updateCMSLandingMode
	} from '$lib/api';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import type { MenuCategory, MenuItem, CMSSection } from '$lib/types';

	// Tab navigation
	let activeTab = $state<'ANALYTICS' | 'MENU' | 'CMS' | 'STAFF' | 'SETTINGS'>('ANALYTICS');

	// Menu Management States
	let categories = $state<MenuCategory[]>([]);
	let menuLoading = $state(false);
	let newCategoryName = $state('');
	let newCategoryModal = $state(false);

	let newItemModal = $state(false);
	let newItemCategoryId = $state('');
	let newItemName = $state('');
	let newItemDescription = $state('');
	let newItemPrice = $state(250);
	let newItemFoodType = $state<'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN'>('VEG');
	let newItemPrepTime = $state(15);
	let newItemStation = $state('MAIN_KITCHEN');
	let newItemAllergens = $state<string[]>([]);
	let isSubmittingMenu = $state(false);

	// CSV Import State
	let csvImportModal = $state(false);
	let csvText = $state('');
	let csvImportResult = $state('');

	// Storefront CMS Dynamic Sections states
	let cmsSections = $state<CMSSection[]>([]);
	let cmsSectionsLoading = $state(false);
	let addSectionModal = $state(false);
	let newSectionType = $state('story');
	let newSectionTitle = $state('');
	let newSectionSubtitle = $state('');
	let newSectionImage = $state('');

	// Custom HTML landing states
	let cmsLandingMode = $state<'DEFAULT' | 'CUSTOM_HTML'>($currentTenant.branding.landing_mode ?? 'DEFAULT');
	let cmsCustomHtml = $state($currentTenant.branding.custom_landing_html ?? '');
	let cmsSaveSuccess = $state(false);

	const cmsTemplates = [
		{
			id: 'luxury_grill',
			name: '👑 Royal Awadhi Charcoal Grill',
			desc: 'Dark ambient luxury with chef credentials and embedded action widget',
			html: `<div class="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-8 sm:p-12 border border-zinc-800 shadow-2xl">
  <div class="max-w-3xl space-y-4">
    <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
      ⭐ Michelin Guide Selected 2025/26
    </span>
    <h1 class="text-4xl sm:text-6xl font-black tracking-tight">The Royal Charcoal Hearth</h1>
    <p class="text-zinc-300 text-sm sm:text-base leading-relaxed">
      Welcome to an unmatched royal feast. Slow-simmered Awadhi dum delicacies, live 800°F clay tandoor kebabs, and cold-pressed botanical refreshments.
    </p>

    <!-- 📌 Embedded Resto Platform Action Widget -->
    <div class="pt-4" data-resto-widget="actions"></div>
  </div>
</div>`
		},
		{
			id: 'italian_bistro',
			name: '🍕 Bella Vista Artisan Ristorante',
			desc: 'Warm stone & vineyard styling with table booking emphasis',
			html: `<div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-zinc-900 to-zinc-950 text-white p-8 sm:p-12 border border-amber-900/40 shadow-2xl">
  <div class="max-w-3xl space-y-4">
    <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
      🌿 100% Imported San Marzano & Sourdough
    </span>
    <h1 class="text-4xl sm:text-6xl font-black tracking-tight">Artisan Woodfired Trattoria</h1>
    <p class="text-zinc-300 text-sm sm:text-base leading-relaxed">
      Hand-stretched 48-hour fermented sourdough pizzas, hand-rolled bronze-cut pastas, and Tuscan reserve pairings.
    </p>

    <!-- 📌 Embedded Resto Platform Action Widget -->
    <div class="pt-4" data-resto-widget="actions"></div>
  </div>
</div>`
		}
	];

	async function loadMenu() {
		menuLoading = true;
		try {
			categories = await fetchMenu();
			if (categories.length > 0 && !newItemCategoryId) {
				newItemCategoryId = categories[0].id;
			}
		} catch (e) {
			console.log('Failed to fetch menu in admin', e);
		} finally {
			menuLoading = false;
		}
	}

	async function loadCMSSections() {
		cmsSectionsLoading = true;
		try {
			const res = await fetchCMSPage('home', true);
			if (res && res.page && res.page.sections) {
				cmsSections = res.page.sections;
			}
		} catch (e) {
			console.log('Failed to fetch CMS sections', e);
		} finally {
			cmsSectionsLoading = false;
		}
	}

	onMount(() => {
		loadMenu();
		loadCMSSections();
	});

	// Category Management
	async function handleAddCategory() {
		if (!newCategoryName.trim()) return;
		try {
			await createMenuCategory({ name: newCategoryName.trim(), display_order: categories.length + 1 });
			newCategoryName = '';
			newCategoryModal = false;
			await loadMenu();
		} catch (e: any) {
			alert('Failed to create category: ' + e.message);
		}
	}

	async function handleDeleteCategory(catId: string) {
		if (!confirm('Are you sure you want to delete this category?')) return;
		try {
			await deleteMenuCategory(catId);
			await loadMenu();
		} catch (e: any) {
			alert('Failed to delete category: ' + e.message);
		}
	}

	// Food Item Management
	async function handleAddMenuItem() {
		if (!newItemName || !newItemCategoryId) {
			alert('Dish name and category are required');
			return;
		}
		isSubmittingMenu = true;
		try {
			await createMenuItem({
				category_id: newItemCategoryId,
				name: newItemName,
				description: newItemDescription,
				price: Number(newItemPrice),
				food_type: newItemFoodType,
				preparation_time_mins: Number(newItemPrepTime),
				kitchen_station: newItemStation,
				assigned_stations: [newItemStation],
				allergens: newItemAllergens,
				is_available: true
			});
			newItemModal = false;
			newItemName = '';
			newItemDescription = '';
			await loadMenu();
		} catch (e: any) {
			alert('Failed to create item: ' + e.message);
		} finally {
			isSubmittingMenu = false;
		}
	}

	async function handleDeleteItem(itemId: string) {
		if (!confirm('Are you sure you want to delete this menu item?')) return;
		try {
			await deleteMenuItem(itemId);
			await loadMenu();
		} catch (e: any) {
			alert('Failed to delete item: ' + e.message);
		}
	}

	async function handleToggleAvailability(item: MenuItem) {
		try {
			await toggleItemAvailability(item.id, !item.is_available);
			await loadMenu();
		} catch (e: any) {
			alert('Failed to toggle availability: ' + e.message);
		}
	}

	// Bulk CSV Import
	async function handleBulkCSVImport() {
		if (!csvText.trim()) return;
		isSubmittingMenu = true;
		try {
			const res = await importMenuCSV(csvText.trim());
			csvImportResult = res.message;
			csvText = '';
			await loadMenu();
			setTimeout(() => {
				csvImportModal = false;
				csvImportResult = '';
			}, 2000);
		} catch (e: any) {
			alert('CSV import failed: ' + e.message);
		} finally {
			isSubmittingMenu = false;
		}
	}

	// Dynamic CMS Sections
	async function handleAddSection() {
		let content: any = {};
		if (newSectionType === 'story') {
			content = {
				heading: newSectionTitle || 'Our Culinary Heritage',
				subheading: newSectionSubtitle || 'ARTISANAL WOODFIRED HERITAGE',
				story_paragraphs: ['Every dish is an homage to timeless recipes stone-ground daily.'],
				chef_name: 'Executive Chef',
				image_url: newSectionImage || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800'
			};
		} else if (newSectionType === 'ambience_gallery') {
			content = {
				title: newSectionTitle || 'Artisanal Ambience & Dining Spaces',
				images: [
					{ url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', caption: 'The Hearth Lounge' },
					{ url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800', caption: 'Courtyard Terrace' }
				]
			};
		}

		try {
			await addCMSSection('home', {
				section_type: newSectionType,
				display_order: cmsSections.length + 1,
				is_enabled: true,
				content,
				settings: {}
			});
			addSectionModal = false;
			newSectionTitle = '';
			newSectionSubtitle = '';
			await loadCMSSections();
		} catch (e: any) {
			alert('Failed to add section: ' + e.message);
		}
	}

	async function moveSection(idx: number, direction: 'UP' | 'DOWN') {
		const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
		if (targetIdx < 0 || targetIdx >= cmsSections.length) return;

		const reordered = [...cmsSections];
		const temp = reordered[idx];
		reordered[idx] = reordered[targetIdx];
		reordered[targetIdx] = temp;

		cmsSections = reordered;
		try {
			await reorderCMSSections(reordered.map((s) => s.id));
			await loadCMSSections();
		} catch (e: any) {
			alert('Failed to reorder: ' + e.message);
		}
	}

	async function toggleSectionStatus(section: CMSSection) {
		try {
			await updateCMSSection(section.id, {
				section_type: section.section_type,
				display_order: section.display_order,
				is_enabled: !section.is_enabled,
				content: section.content,
				settings: section.settings
			});
			await loadCMSSections();
		} catch (e: any) {
			alert('Failed to update section: ' + e.message);
		}
	}

	async function handleDeleteSection(sectionId: string) {
		if (!confirm('Delete this section from the storefront?')) return;
		try {
			await deleteCMSSection(sectionId);
			await loadCMSSections();
		} catch (e: any) {
			alert('Failed to delete section: ' + e.message);
		}
	}

	async function saveStorefrontCms() {
		currentTenant.update((t) => ({
			...t,
			branding: {
				...t.branding,
				landing_mode: cmsLandingMode,
				custom_landing_html: cmsCustomHtml
			}
		}));
		try {
			await updateCMSLandingMode({
				landing_mode: cmsLandingMode,
				custom_landing_html: cmsCustomHtml
			});
		} catch (e) {
			console.log('Saved to local tenant store');
		}
		cmsSaveSuccess = true;
		setTimeout(() => {
			cmsSaveSuccess = false;
		}, 3000);
	}

	// Mock analytics data
	let todayStats = $state({
		grossRevenue: 42650,
		totalOrders: 56,
		dineInOrders: 38,
		deliveryOrders: 18,
		averageTicket: 761.6,
		gstTaxCollected: 2030.95
	});

	// Mock staff data
	interface StaffMember {
		id: string;
		name: string;
		role: 'Chef' | 'Waiter' | 'Driver' | 'Manager';
		phone: string;
		status: 'ON_DUTY' | 'OFF_DUTY';
		shift: string;
	}

	let staffList: StaffMember[] = $state([
		{ id: '1', name: 'Rajesh Kumar', role: 'Chef', phone: '+91 98765 11001', status: 'ON_DUTY', shift: 'Morning / Tandoor' },
		{ id: '2', name: 'Sunil Sharma', role: 'Chef', phone: '+91 98765 11002', status: 'ON_DUTY', shift: 'Curry & Wok' },
		{ id: '3', name: 'Pooja Verma', role: 'Waiter', phone: '+91 98765 22001', status: 'ON_DUTY', shift: 'Floor Captain' },
		{ id: '4', name: 'Amit Patel', role: 'Driver', phone: '+91 98765 33001', status: 'ON_DUTY', shift: 'Bike Fleet #1' },
		{ id: '5', name: 'Anil Mehta', role: 'Manager', phone: '+91 98765 44001', status: 'ON_DUTY', shift: 'General Floor' }
	]);
</script>

<AuthGuard requiredRole="ADMIN" roleTitle="Manager & Admin Portal" icon="📊">
<div class="space-y-6">
	<!-- Admin Header -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
		<div>
			<div class="flex items-center gap-2">
				<h2 class="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
					📊 Manager Command Center
				</h2>
				<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
					Admin Access
				</span>
			</div>
			<p class="text-xs text-zinc-500 dark:text-zinc-400">
				Manage menus, dynamic website sections, kitchen stations, team shifts, and branding.
			</p>
		</div>

		<!-- Tab Navigation Buttons -->
		<div class="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex-wrap gap-1">
			<button
				type="button"
				onclick={() => (activeTab = 'ANALYTICS')}
				class="px-3 py-1.5 rounded-lg transition {activeTab === 'ANALYTICS' ? 'bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}"
			>
				📈 Sales
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'MENU')}
				class="px-3 py-1.5 rounded-lg transition {activeTab === 'MENU' ? 'bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}"
			>
				🍽️ Menu & Dishes
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'CMS')}
				class="px-3 py-1.5 rounded-lg transition {activeTab === 'CMS' ? 'bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}"
			>
				🌐 Storefront CMS
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'STAFF')}
				class="px-3 py-1.5 rounded-lg transition {activeTab === 'STAFF' ? 'bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}"
			>
				👥 Staff ({staffList.length})
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'SETTINGS')}
				class="px-3 py-1.5 rounded-lg transition {activeTab === 'SETTINGS' ? 'bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}"
			>
				⚙️ Settings
			</button>
		</div>
	</div>

	<!-- TAB 1: SALES ANALYTICS -->
	{#if activeTab === 'ANALYTICS'}
		<div class="space-y-6">
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs space-y-2">
					<span class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Gross Income Today</span>
					<h3 class="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
						₹{todayStats.grossRevenue.toLocaleString('en-IN')}
					</h3>
					<span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
						↑ +18.4% vs yesterday
					</span>
				</div>

				<div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs space-y-2">
					<span class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Orders</span>
					<h3 class="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
						{todayStats.totalOrders}
					</h3>
					<p class="text-[11px] text-zinc-500 dark:text-zinc-400">
						🍽️ {todayStats.dineInOrders} Dine-In • 🛵 {todayStats.deliveryOrders} Delivery
					</p>
				</div>

				<div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs space-y-2">
					<span class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Average Ticket</span>
					<h3 class="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
						₹{todayStats.averageTicket.toFixed(2)}
					</h3>
					<span class="text-[11px] text-zinc-400">Per table / run</span>
				</div>

				<div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs space-y-2">
					<span class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">GST Statutory</span>
					<h3 class="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
						₹{todayStats.gstTaxCollected.toFixed(2)}
					</h3>
					<span class="text-[11px] text-zinc-400">5% GST Collected</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 2: COMPLETE MENU & DISHES MANAGEMENT -->
	{#if activeTab === 'MENU'}
		<div class="space-y-6">
			<!-- Header Action Bar -->
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-zinc-900 border border-zinc-800 text-white">
				<div>
					<h3 class="font-black text-lg text-white">Menu Engineering & Catalog</h3>
					<p class="text-xs text-zinc-400">Categories, food items, station routing, allergens, and CSV bulk import</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => (csvImportModal = true)}
						class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition"
					>
						📥 Bulk CSV Import
					</button>
					<button
						type="button"
						onclick={() => (newCategoryModal = true)}
						class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition"
					>
						+ Add Category
					</button>
					<button
						type="button"
						onclick={() => (newItemModal = true)}
						class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition"
					>
						+ Add Food Item
					</button>
				</div>
			</div>

			<!-- Categories & Items Hierarchy -->
			{#if menuLoading}
				<div class="py-16 text-center text-zinc-400">Loading restaurant menu...</div>
			{:else}
				<div class="space-y-6">
					{#each categories as category}
						<div class="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
							<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
								<div class="flex items-center gap-2">
									<h4 class="font-black text-base text-zinc-900 dark:text-white">{category.name}</h4>
									<span class="text-xs text-zinc-400">({category.items.length} items)</span>
								</div>
								<button
									type="button"
									onclick={() => handleDeleteCategory(category.id)}
									class="text-xs text-zinc-400 hover:text-red-500 transition"
								>
									Delete Category ✕
								</button>
							</div>

							<!-- Items Table -->
							<div class="overflow-x-auto">
								<table class="w-full text-left text-xs">
									<thead>
										<tr class="text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 font-bold uppercase tracking-wider pb-2">
											<th class="py-2">Item Name</th>
											<th class="py-2">Price</th>
											<th class="py-2">Food Type</th>
											<th class="py-2">Kitchen Station</th>
											<th class="py-2">Allergens</th>
											<th class="py-2">Stock Availability</th>
											<th class="py-2 text-right">Actions</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
										{#each category.items as item}
											<tr class="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition">
												<td class="py-2.5 font-bold text-zinc-900 dark:text-white">
													{item.name}
												</td>
												<td class="py-2.5 font-mono text-zinc-900 dark:text-white font-bold">
													₹{item.price}
												</td>
												<td class="py-2.5">
													<span class="px-2 py-0.5 rounded text-[10px] font-bold {item.food_type === 'VEG' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}">
														{item.food_type}
													</span>
												</td>
												<td class="py-2.5 font-semibold text-zinc-600 dark:text-zinc-400">
													{item.kitchen_station || 'MAIN_KITCHEN'}
												</td>
												<td class="py-2.5 text-zinc-500">
													{item.allergens && item.allergens.length > 0 ? item.allergens.join(', ') : 'None'}
												</td>
												<td class="py-2.5">
													<button
														type="button"
														onclick={() => handleToggleAvailability(item)}
														class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition {item.is_available ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'}"
													>
														{item.is_available ? 'In Stock ✓' : "86'd (Sold Out)"}
													</button>
												</td>
												<td class="py-2.5 text-right">
													<button
														type="button"
														onclick={() => handleDeleteItem(item.id)}
														class="text-xs text-red-500 hover:underline"
													>
														Delete
													</button>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- TAB 3: DYNAMIC STOREFRONT CMS & SECTIONS -->
	{#if activeTab === 'CMS'}
		<div class="space-y-6 max-w-4xl">
			<!-- Dynamic Sections Manager -->
			<div class="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-white space-y-4 shadow-xs">
				<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
					<div>
						<h3 class="font-black text-lg text-white">Dynamic Storefront Sections</h3>
						<p class="text-xs text-zinc-400">Add, remove, reorder, and toggle sections published on the public website</p>
					</div>
					<button
						type="button"
						onclick={() => (addSectionModal = true)}
						class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition"
					>
						+ Add Section
					</button>
				</div>

				{#if cmsSectionsLoading}
					<div class="py-8 text-center text-zinc-400 text-xs">Loading website sections...</div>
				{:else if cmsSections.length === 0}
					<div class="py-8 text-center text-zinc-500 text-xs">No dynamic sections configured yet. Add one above!</div>
				{:else}
					<div class="space-y-2">
						{#each cmsSections as section, idx (section.id)}
							<div class="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-between text-xs">
								<div class="flex items-center gap-3">
									<div class="flex flex-col gap-1">
										<button
											type="button"
											disabled={idx === 0}
											onclick={() => moveSection(idx, 'UP')}
											class="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-[10px] disabled:opacity-30"
										>
											▲
										</button>
										<button
											type="button"
											disabled={idx === cmsSections.length - 1}
											onclick={() => moveSection(idx, 'DOWN')}
											class="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-[10px] disabled:opacity-30"
										>
											▼
										</button>
									</div>
									<div>
										<span class="font-bold text-white text-sm uppercase tracking-wide">
											{section.section_type}
										</span>
										<p class="text-[11px] text-zinc-400">
											{section.content?.title || section.content?.heading || 'Custom Section Content'}
										</p>
									</div>
								</div>

								<div class="flex items-center gap-2">
									<button
										type="button"
										onclick={() => toggleSectionStatus(section)}
										class="px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase transition {section.is_enabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-zinc-700 text-zinc-400'}"
									>
										{section.is_enabled ? 'Published' : 'Draft'}
									</button>
									<button
										type="button"
										onclick={() => handleDeleteSection(section.id)}
										class="text-xs text-red-400 hover:text-red-300 p-1"
									>
										✕
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Custom HTML Landing Switcher -->
			<div class="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-white space-y-4 shadow-xs">
				<h3 class="font-black text-lg text-white">Custom Landing Override (Sandboxed)</h3>
				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={() => (cmsLandingMode = 'DEFAULT')}
						class="px-4 py-2 rounded-xl text-xs font-bold transition {cmsLandingMode === 'DEFAULT' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'}"
					>
						Dynamic Sections Mode
					</button>
					<button
						type="button"
						onclick={() => (cmsLandingMode = 'CUSTOM_HTML')}
						class="px-4 py-2 rounded-xl text-xs font-bold transition {cmsLandingMode === 'CUSTOM_HTML' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'}"
					>
						Raw Custom HTML Mode
					</button>
				</div>

				{#if cmsLandingMode === 'CUSTOM_HTML'}
					<textarea
						bind:value={cmsCustomHtml}
						rows="6"
						class="w-full text-xs p-3 font-mono rounded-xl bg-zinc-950 border border-zinc-700 text-emerald-300 focus:outline-none"
					></textarea>
				{/if}

				<div class="flex items-center justify-between pt-2">
					<button
						type="button"
						onclick={saveStorefrontCms}
						class="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-black text-xs shadow-md transition"
					>
						Save Storefront Settings
					</button>
					{#if cmsSaveSuccess}
						<span class="text-xs text-emerald-400 font-bold">✓ Saved successfully!</span>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 4: STAFF MANAGEMENT -->
	{#if activeTab === 'STAFF'}
		<div class="space-y-4">
			<div class="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-4">
				<h3 class="font-black text-base text-zinc-900 dark:text-white">Active Operational Staff</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs">
						<thead>
							<tr class="text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-wider pb-2">
								<th class="py-2">Name</th>
								<th class="py-2">Role</th>
								<th class="py-2">Shift</th>
								<th class="py-2">Phone</th>
								<th class="py-2">Duty</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
							{#each staffList as staff}
								<tr>
									<td class="py-3 font-bold text-zinc-900 dark:text-white">{staff.name}</td>
									<td class="py-3 font-semibold text-zinc-500">{staff.role}</td>
									<td class="py-3 text-zinc-500">{staff.shift}</td>
									<td class="py-3 font-mono text-zinc-500">{staff.phone}</td>
									<td class="py-3">
										<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
											{staff.status}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 5: RESTAURANT SETTINGS -->
	{#if activeTab === 'SETTINGS'}
		<div class="space-y-6 max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xs text-left">
			<h3 class="font-black text-lg text-zinc-900 dark:text-white">Restaurant Configuration</h3>
			<div class="space-y-3 text-xs">
				<div>
					<span class="font-bold text-zinc-500 block mb-1">Restaurant Name</span>
					<input
						type="text"
						bind:value={$currentTenant.name}
						class="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
					/>
				</div>
				<div>
					<span class="font-bold text-zinc-500 block mb-1">GST Tax Rate (%)</span>
					<input
						type="number"
						bind:value={$currentTenant.settings.tax_gst_percentage}
						class="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
					/>
				</div>
				<div>
					<span class="font-bold text-zinc-500 block mb-1">Contact Phone</span>
					<input
						type="text"
						bind:value={$currentTenant.phone}
						class="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
					/>
				</div>
				<div>
					<span class="font-bold text-zinc-500 block mb-1">Address</span>
					<input
						type="text"
						bind:value={$currentTenant.address}
						class="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Modal: Add Category -->
{#if newCategoryModal}
	<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
			<h3 class="font-bold text-base text-white">Create Menu Category</h3>
			<input
				type="text"
				bind:value={newCategoryName}
				placeholder="Category Name (e.g. Clay Oven Specialties)"
				class="w-full text-xs p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none"
			/>
			<div class="flex items-center justify-end gap-2 pt-2">
				<button type="button" onclick={() => (newCategoryModal = false)} class="px-4 py-2 text-xs text-zinc-400">Cancel</button>
				<button type="button" onclick={handleAddCategory} class="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs">Create Category</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal: Add Food Item -->
{#if newItemModal}
	<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
			<h3 class="font-bold text-base text-white">Add New Food Item</h3>
			<div class="space-y-3 text-xs">
				<div>
					<span class="text-zinc-400 block mb-1">Menu Category</span>
					<select bind:value={newItemCategoryId} class="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white">
						{#each categories as cat}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<span class="text-zinc-400 block mb-1">Dish Name</span>
					<input type="text" bind:value={newItemName} placeholder="e.g. Awadhi Dum Biryani" class="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white" />
				</div>
				<div>
					<span class="text-zinc-400 block mb-1">Description</span>
					<textarea bind:value={newItemDescription} placeholder="Aromatic basmati rice sealed with saffron..." rows="2" class="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white"></textarea>
				</div>
				<div class="grid grid-cols-2 gap-2">
					<div>
						<span class="text-zinc-400 block mb-1">Price (₹)</span>
						<input type="number" bind:value={newItemPrice} class="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white" />
					</div>
					<div>
						<span class="text-zinc-400 block mb-1">Food Type</span>
						<select bind:value={newItemFoodType} class="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white">
							<option value="VEG">🟢 Pure Veg</option>
							<option value="NON_VEG">🔴 Non-Veg</option>
							<option value="EGG">🟡 Egg</option>
							<option value="VEGAN">🌱 Vegan</option>
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-2">
					<div>
						<span class="text-zinc-400 block mb-1">Prep Time (mins)</span>
						<input type="number" bind:value={newItemPrepTime} class="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white" />
					</div>
					<div>
						<span class="text-zinc-400 block mb-1">Kitchen Station</span>
						<select bind:value={newItemStation} class="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white">
							<option value="MAIN_KITCHEN">MAIN_KITCHEN</option>
							<option value="GRILL">GRILL</option>
							<option value="BAKERY">BAKERY</option>
							<option value="BEVERAGES">BEVERAGES</option>
							<option value="DESSERTS">DESSERTS</option>
							<option value="EXPO">EXPO</option>
						</select>
					</div>
				</div>
			</div>
			<div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
				<button type="button" onclick={() => (newItemModal = false)} class="px-4 py-2 text-xs text-zinc-400">Cancel</button>
				<button type="button" disabled={isSubmittingMenu} onclick={handleAddMenuItem} class="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md">
					{isSubmittingMenu ? 'Saving...' : 'Add Food Item'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal: Bulk CSV Import -->
{#if csvImportModal}
	<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
			<div class="space-y-1">
				<h3 class="font-bold text-base text-white">Bulk CSV Menu Import</h3>
				<p class="text-xs text-zinc-400">Paste your CSV records with headers: category, name, description, price, food_type, preparation_time_mins, kitchen_station, allergens</p>
			</div>

			<textarea
				bind:value={csvText}
				rows="7"
				placeholder={`category,name,description,price,food_type,preparation_time_mins,kitchen_station,allergens
Starters,Paneer Tikka,Clay oven roasted,280,VEG,15,GRILL,DAIRY
Breads,Garlic Naan,Clay tandoor baked,70,VEG,8,BAKERY,GLUTEN;DAIRY`}
				class="w-full text-xs p-3 font-mono rounded-xl bg-zinc-950 border border-zinc-700 text-emerald-300 focus:outline-none"
			></textarea>

			{#if csvImportResult}
				<div class="p-2.5 rounded-xl bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800">
					✓ {csvImportResult}
				</div>
			{/if}

			<div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
				<button type="button" onclick={() => (csvImportModal = false)} class="px-4 py-2 text-xs text-zinc-400">Cancel</button>
				<button type="button" disabled={isSubmittingMenu || !csvText.trim()} onclick={handleBulkCSVImport} class="px-5 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs shadow-md">
					{isSubmittingMenu ? 'Importing...' : 'Run Bulk Import →'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal: Add Dynamic CMS Section -->
{#if addSectionModal}
	<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
			<h3 class="font-bold text-base text-white">Add Storefront Section</h3>
			<div class="space-y-3 text-xs">
				<div>
					<span class="text-zinc-400 block mb-1">Section Type</span>
					<select bind:value={newSectionType} class="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white">
						<option value="story">📜 Culinary Heritage & Story</option>
						<option value="ambience_gallery">🖼️ Ambience & Spaces Gallery</option>
						<option value="signature_dishes">✨ Signature Dishes Highlights</option>
						<option value="dining_guidelines">🕰️ Hours & Concierge Guidelines</option>
					</select>
				</div>
				<div>
					<span class="text-zinc-400 block mb-1">Section Title</span>
					<input type="text" bind:value={newSectionTitle} placeholder="e.g. Master Chef Credentials" class="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white" />
				</div>
				<div>
					<span class="text-zinc-400 block mb-1">Section Subtitle / Tagline</span>
					<input type="text" bind:value={newSectionSubtitle} placeholder="e.g. 25 Years of Awadhi Mastery" class="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white" />
				</div>
			</div>
			<div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
				<button type="button" onclick={() => (addSectionModal = false)} class="px-4 py-2 text-xs text-zinc-400">Cancel</button>
				<button type="button" onclick={handleAddSection} class="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md">Add Section</button>
			</div>
		</div>
	</div>
{/if}
</AuthGuard>
