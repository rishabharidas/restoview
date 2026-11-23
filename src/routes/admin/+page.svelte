<script lang="ts">
	import { currentTenant, applyTheme } from '$lib/stores/tenant';
	import AuthGuard from '$lib/components/AuthGuard.svelte';

	// Tab navigation
	let activeTab = $state<'ANALYTICS' | 'STAFF' | 'MENU' | 'SETTINGS'>('ANALYTICS');

	// Mock analytics data
	let todayStats = $state({
		grossRevenue: 42650,
		totalOrders: 56,
		dineInOrders: 38,
		deliveryOrders: 18,
		averageTicket: 761.6,
		gstTaxCollected: 2030.95
	});

	let topSoldDishes = $state([
		{ name: 'Butter Chicken Masala', category: 'Main Course', portionsSold: 42, revenue: 17640, type: 'NON_VEG' },
		{ name: 'Paneer Tikka', category: 'Starters', portionsSold: 38, revenue: 10640, type: 'VEG' },
		{ name: 'Dal Makhani', category: 'Main Course', portionsSold: 34, revenue: 8840, type: 'VEG' },
		{ name: 'Garlic Naan', category: 'Breads', portionsSold: 76, revenue: 5320, type: 'VEG' },
		{ name: 'Mango Lassi', category: 'Beverages', portionsSold: 28, revenue: 3360, type: 'VEG' }
	]);

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
		{ id: '3', name: 'Pooja Verma', role: 'Waiter', phone: '+91 98765 22001', status: 'ON_DUTY', shift: 'Tables 1-4' },
		{ id: '4', name: 'Vikram Singh', role: 'Waiter', phone: '+91 98765 22002', status: 'ON_DUTY', shift: 'Tables 5-8' },
		{ id: '5', name: 'Amit Patel', role: 'Driver', phone: '+91 98765 33001', status: 'ON_DUTY', shift: 'Bike Fleet #1' },
		{ id: '6', name: 'Deepak Joshi', role: 'Driver', phone: '+91 98765 33002', status: 'OFF_DUTY', shift: 'Bike Fleet #2' },
		{ id: '7', name: 'Anil Mehta', role: 'Manager', phone: '+91 98765 44001', status: 'ON_DUTY', shift: 'General Floor' }
	]);

	let newStaffModal = $state(false);
	let newStaffName = $state('');
	let newStaffRole = $state<'Chef' | 'Waiter' | 'Driver' | 'Manager'>('Waiter');
	let newStaffPhone = $state('');

	function addStaffMember() {
		if (!newStaffName || !newStaffPhone) {
			alert('Please enter staff name and phone');
			return;
		}

		staffList = [
			...staffList,
			{
				id: 'staff-' + Date.now(),
				name: newStaffName,
				role: newStaffRole,
				phone: newStaffPhone,
				status: 'ON_DUTY',
				shift: 'General Shift'
			}
		];
		newStaffName = '';
		newStaffPhone = '';
		newStaffModal = false;
	}

	function toggleStaffDuty(id: string) {
		staffList = staffList.map((s) =>
			s.id === id ? { ...s, status: s.status === 'ON_DUTY' ? 'OFF_DUTY' : 'ON_DUTY' } : s
		);
	}
</script>

<AuthGuard requiredRole="ADMIN" roleTitle="Manager & Admin Portal" icon="📊">
<div class="space-y-6">
	<!-- Admin Header -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
		<div>
			<div class="flex items-center gap-2">
				<h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
					📊 Manager & Admin Command Center
				</h2>
				<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
					Admin Access
				</span>
			</div>
			<p class="text-xs text-slate-500 dark:text-slate-400">
				Monitor business income, manage kitchen & floor staff, review top-performing dishes, and configure restaurant branding.
			</p>
		</div>

		<!-- Tab Navigation Buttons -->
		<div class="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
			<button
				type="button"
				onclick={() => (activeTab = 'ANALYTICS')}
				class="px-3 py-1.5 rounded-lg transition {activeTab === 'ANALYTICS' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
			>
				📈 Sales & Income
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'STAFF')}
				class="px-3 py-1.5 rounded-lg transition {activeTab === 'STAFF' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
			>
				👥 Staff Management ({staffList.length})
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'SETTINGS')}
				class="px-3 py-1.5 rounded-lg transition {activeTab === 'SETTINGS' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
			>
				⚙️ Restaurant Settings
			</button>
		</div>
	</div>

	<!-- TAB 1: SALES & INCOME ANALYTICS -->
	{#if activeTab === 'ANALYTICS'}
		<div class="space-y-6">
			<!-- KPI Stat Cards -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
					<span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Income Today</span>
					<h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
						₹{todayStats.grossRevenue.toLocaleString('en-IN')}
					</h3>
					<span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
						↑ +18.4% vs yesterday
					</span>
				</div>

				<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
					<span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Orders</span>
					<h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
						{todayStats.totalOrders}
					</h3>
					<p class="text-[11px] text-slate-500 dark:text-slate-400">
						🍽️ {todayStats.dineInOrders} Dine-In • 🛵 {todayStats.deliveryOrders} Delivery
					</p>
				</div>

				<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
					<span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Ticket Size</span>
					<h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
						₹{todayStats.averageTicket.toFixed(2)}
					</h3>
					<span class="text-[11px] text-slate-400">Per table / delivery run</span>
				</div>

				<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
					<span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GST Tax Collected</span>
					<h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
						₹{todayStats.gstTaxCollected.toFixed(2)}
					</h3>
					<span class="text-[11px] text-slate-400">5% GST Statutory Reserve</span>
				</div>
			</div>

			<!-- Payment Method Distribution -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="text-2xl p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">📲</span>
						<div>
							<h4 class="font-bold text-sm text-slate-900 dark:text-white">UPI QR Payments</h4>
							<p class="text-xs text-slate-400">68% of total volume</p>
						</div>
					</div>
					<span class="font-black text-base text-slate-900 dark:text-white">₹29,002</span>
				</div>

				<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="text-2xl p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">💵</span>
						<div>
							<h4 class="font-bold text-sm text-slate-900 dark:text-white">Cash at Table</h4>
							<p class="text-xs text-slate-400">18% of total volume</p>
						</div>
					</div>
					<span class="font-black text-base text-slate-900 dark:text-white">₹7,677</span>
				</div>

				<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="text-2xl p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">💳</span>
						<div>
							<h4 class="font-bold text-sm text-slate-900 dark:text-white">Credit / Debit Cards</h4>
							<p class="text-xs text-slate-400">14% of total volume</p>
						</div>
					</div>
					<span class="font-black text-base text-slate-900 dark:text-white">₹5,971</span>
				</div>
			</div>

			<!-- Top Selling Dishes Leaderboard -->
			<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="font-black text-base text-slate-900 dark:text-white">🏆 Best Selling Dishes Today</h3>
						<p class="text-xs text-slate-400">Track which items drive the highest restaurant revenue</p>
					</div>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs">
						<thead>
							<tr class="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
								<th class="py-2.5">Dish Name</th>
								<th class="py-2.5">Category</th>
								<th class="py-2.5">Portions Sold</th>
								<th class="py-2.5">Total Revenue</th>
								<th class="py-2.5 text-right">Performance</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
							{#each topSoldDishes as dish, idx}
								<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
									<td class="py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
										<span class="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold">
											{idx + 1}
										</span>
										<span>{dish.name}</span>
										<span class="text-[9px] px-1 rounded font-bold {dish.type === 'VEG' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
											{dish.type}
										</span>
									</td>
									<td class="py-3 text-slate-500 dark:text-slate-400">{dish.category}</td>
									<td class="py-3 font-semibold text-slate-800 dark:text-slate-200">{dish.portionsSold} plates</td>
									<td class="py-3 font-black text-blue-600 dark:text-blue-400">₹{dish.revenue.toLocaleString('en-IN')}</td>
									<td class="py-3 text-right">
										<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
											🔥 High Velocity
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

	<!-- TAB 2: STAFF MANAGEMENT -->
	{#if activeTab === 'STAFF'}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="font-black text-base text-slate-900 dark:text-white">Active Restaurant Team</h3>
					<p class="text-xs text-slate-400">Manage Kitchen Chefs, Waitstaff, Delivery Drivers, and Shift Schedules</p>
				</div>
				<button
					type="button"
					onclick={() => (newStaffModal = true)}
					class="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
				>
					+ Add Staff Member
				</button>
			</div>

			<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
							<th class="p-3.5">Name</th>
							<th class="p-3.5">Role</th>
							<th class="p-3.5">Assigned Shift</th>
							<th class="p-3.5">Phone</th>
							<th class="p-3.5">Duty Status</th>
							<th class="p-3.5 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
						{#each staffList as staff}
							<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
								<td class="p-3.5 font-bold text-slate-900 dark:text-white">{staff.name}</td>
								<td class="p-3.5">
									<span class="px-2 py-0.5 rounded-full text-[10px] font-bold {staff.role === 'Chef' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : staff.role === 'Waiter' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : staff.role === 'Driver' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'}">
										{staff.role === 'Chef' ? '👨‍🍳 Chef' : staff.role === 'Waiter' ? '🛎️ Waiter' : staff.role === 'Driver' ? '🛵 Driver' : '📊 Manager'}
									</span>
								</td>
								<td class="p-3.5 text-slate-500 dark:text-slate-400">{staff.shift}</td>
								<td class="p-3.5 font-mono text-slate-600 dark:text-slate-300">{staff.phone}</td>
								<td class="p-3.5">
									<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold {staff.status === 'ON_DUTY' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
										<span class="w-1.5 h-1.5 rounded-full {staff.status === 'ON_DUTY' ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
										{staff.status === 'ON_DUTY' ? 'On Duty' : 'Off Shift'}
									</span>
								</td>
								<td class="p-3.5 text-right">
									<button
										type="button"
										onclick={() => toggleStaffDuty(staff.id)}
										class="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
									>
										{staff.status === 'ON_DUTY' ? 'Set Off Duty' : 'Set On Duty'}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- TAB 3: RESTAURANT & THEME SETTINGS -->
	{#if activeTab === 'SETTINGS'}
		<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs max-w-2xl space-y-5">
			<div>
				<h3 class="font-black text-lg text-slate-900 dark:text-white">Tenant Branding & Tax Configuration</h3>
				<p class="text-xs text-slate-400">Configure restaurant details, logo, and theme colors</p>
			</div>

			<div class="space-y-4 text-xs">
				<div>
					<span class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Restaurant Name</span>
					<input
						type="text"
						bind:value={$currentTenant.name}
						class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<span class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</span>
						<input
							type="text"
							bind:value={$currentTenant.phone}
							class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
						/>
					</div>
					<div>
						<span class="block font-bold text-slate-700 dark:text-slate-300 mb-1">GST Tax Rate (%)</span>
						<input
							type="number"
							bind:value={$currentTenant.settings.tax_gst_percentage}
							class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
						/>
					</div>
				</div>

				<div>
					<span class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Theme Brand Color</span>
					<div class="flex items-center gap-3">
						<input
							type="color"
							bind:value={$currentTenant.branding.primary_color}
							class="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700"
						/>
						<span class="font-mono text-slate-600 dark:text-slate-300">{$currentTenant.branding.primary_color}</span>
						<button
							type="button"
							onclick={() => applyTheme($currentTenant)}
							class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs"
						>
							Apply Theme Live
						</button>
					</div>
				</div>

				<button
					type="button"
					onclick={() => alert('Settings saved successfully!')}
					class="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-xs"
				>
					Save Configuration Changes
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Modal: Add New Staff Member -->
{#if newStaffModal}
	<div class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 shadow-2xl space-y-4">
			<div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
				<h3 class="font-black text-base text-slate-900 dark:text-white">Add Team Member</h3>
				<button type="button" onclick={() => (newStaffModal = false)} class="text-xs text-slate-400">✕</button>
			</div>

			<div class="space-y-3 text-xs">
				<div>
					<span class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</span>
					<input
						type="text"
						bind:value={newStaffName}
						placeholder="e.g. Ramesh Chandra"
						class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
					/>
				</div>

				<div>
					<span class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role</span>
					<select
						bind:value={newStaffRole}
						class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
					>
						<option value="Chef">Chef (Kitchen KDS)</option>
						<option value="Waiter">Waiter (Floor POS)</option>
						<option value="Driver">Driver (Delivery Fleet)</option>
						<option value="Manager">Manager / Floor Captain</option>
					</select>
				</div>

				<div>
					<span class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</span>
					<input
						type="tel"
						bind:value={newStaffPhone}
						placeholder="+91 98765 00000"
						class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
					/>
				</div>

				<button
					type="button"
					onclick={addStaffMember}
					class="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-xs mt-2"
				>
					Confirm & Create Account
				</button>
			</div>
		</div>
	</div>
{/if}
</AuthGuard>
