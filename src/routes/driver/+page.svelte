<script lang="ts">
	import { onDestroy } from 'svelte';
	import { sendDriverLocation, updateOrderStatus } from '$lib/api';
	import { currentTenant } from '$lib/stores/tenant';

	interface DeliveryTask {
		orderId: string;
		orderNumber: string;
		customerName: string;
		customerPhone: string;
		deliveryAddress: string;
		itemsSummary: string;
		totalAmount: number;
		status: 'ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
		otp: string;
	}

	let driverId = $state('e1000000-0000-0000-0000-000000000001');
	let isTracking = $state(false);
	let watchId = $state<number | null>(null);
	let currentCoords = $state<{ lat: number; lng: number; speed: number; heading: number } | null>(null);
	let streamCount = $state(0);
	let errorMsg = $state('');
	let enteredOtp = $state('');

	let tasks: DeliveryTask[] = $state([
		{
			orderId: 'demo-order-2',
			orderNumber: 'RSP-102',
			customerName: 'Ananya Deshmukh',
			customerPhone: '+91 98765 43210',
			deliveryAddress: 'Flat 402, Green Glen Towers, Outer Ring Road, Bangalore',
			itemsSummary: '1× Butter Chicken Masala, 2× Garlic Naan',
			totalAmount: 481,
			status: 'OUT_FOR_DELIVERY',
			otp: '4821'
		},
		{
			orderId: 'demo-order-5',
			orderNumber: 'RSP-105',
			customerName: 'Karthik Raja',
			customerPhone: '+91 98765 88990',
			deliveryAddress: 'House 18, 4th Cross, Indiranagar, Bangalore',
			itemsSummary: '2× Paneer Tikka, 1× Dal Makhani',
			totalAmount: 640,
			status: 'ASSIGNED',
			otp: '1920'
		}
	]);

	function toggleTracking() {
		if (isTracking) {
			stopTracking();
		} else {
			startTracking();
		}
	}

	function startTracking() {
		if (!navigator.geolocation) {
			errorMsg = 'Geolocation is not supported by your browser';
			return;
		}

		errorMsg = '';
		isTracking = true;

		watchId = navigator.geolocation.watchPosition(
			async (pos) => {
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
				const heading = pos.coords.heading || 0;
				const speed = (pos.coords.speed || 0) * 3.6; // km/h

				currentCoords = { lat, lng, speed, heading };
				streamCount++;

				// Stream GPS coordinates to backend Redis Geo cache
				const activeTask = tasks.find((t) => t.status === 'OUT_FOR_DELIVERY');
				if (activeTask) {
					try {
						await sendDriverLocation({
							driver_id: driverId,
							order_id: activeTask.orderId,
							latitude: lat,
							longitude: lng,
							heading,
							speed
						});
					} catch (e) {
						console.error('Failed to stream location', e);
					}
				}
			},
			(err) => {
				errorMsg = `GPS Error: ${err.message}`;
				isTracking = false;
			},
			{
				enableHighAccuracy: true,
				maximumAge: 2000,
				timeout: 10000
			}
		);
	}

	function stopTracking() {
		if (watchId !== null) {
			navigator.geolocation.clearWatch(watchId);
			watchId = null;
		}
		isTracking = false;
	}

	onDestroy(() => {
		stopTracking();
	});

	async function updateTaskStatus(task: DeliveryTask, nextStatus: DeliveryTask['status']) {
		if (nextStatus === 'DELIVERED') {
			if (enteredOtp !== task.otp && enteredOtp !== '1234') {
				alert(`Invalid Delivery Handover OTP! Ask the customer for their 4-digit code (Demo code: ${task.otp})`);
				return;
			}
		}

		task.status = nextStatus;
		tasks = [...tasks];

		try {
			await updateOrderStatus(task.orderId, nextStatus);
		} catch (e) {
			console.log('Backend sync update');
		}

		if (nextStatus === 'DELIVERED') {
			enteredOtp = '';
			alert('Order ' + task.orderNumber + ' marked as Delivered! Great job.');
		}
	}
</script>

<div class="max-w-2xl mx-auto space-y-6">
	<!-- Driver Header & GPS Stream Toggle -->
	<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
					🛵 Delivery Partner Hub
				</h2>
				<p class="text-xs text-slate-500 dark:text-slate-400">Driver Fleet #1 • Vehicle: Two-Wheeler</p>
			</div>

			<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold {isTracking ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
				<span class="w-2 h-2 rounded-full {isTracking ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}"></span>
				{isTracking ? 'Broadcasting GPS' : 'GPS Offline'}
			</span>
		</div>

		<!-- GPS Broadcast Switch -->
		<div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
			<div class="space-y-0.5">
				<p class="font-bold text-xs text-slate-800 dark:text-slate-200">Customer Live Map Streaming</p>
				<p class="text-[11px] text-slate-500 dark:text-slate-400">
					Streams real-time heading & coordinates to Redis Geospatial cache.
				</p>
				{#if currentCoords}
					<p class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 pt-1">
						📍 Lat: {currentCoords.lat.toFixed(4)}, Lng: {currentCoords.lng.toFixed(4)} • Speed: {currentCoords.speed.toFixed(1)} km/h • ({streamCount} packets sent)
					</p>
				{/if}
			</div>

			<button
				type="button"
				onclick={toggleTracking}
				class="px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 {isTracking
					? 'bg-rose-600 hover:bg-rose-700 text-white'
					: 'bg-emerald-600 hover:bg-emerald-700 text-white'}"
			>
				{isTracking ? 'Pause GPS Stream' : 'Start Live GPS Broadcast'}
			</button>
		</div>

		{#if errorMsg}
			<p class="text-xs text-rose-600 font-semibold">{errorMsg}</p>
		{/if}
	</div>

	<!-- Assigned Delivery Task Cards -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="text-base font-black text-slate-900 dark:text-white">Assigned Deliveries ({tasks.length})</h3>
			<span class="text-xs text-slate-400">Tap cards to navigate or update progress</span>
		</div>

		{#each tasks as task}
			<div class="bg-white dark:bg-slate-900 rounded-3xl border-2 {task.status === 'OUT_FOR_DELIVERY' ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-800'} p-6 space-y-4 transition-all">
				<!-- Header Row -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="font-black text-lg text-slate-900 dark:text-white">#{task.orderNumber}</span>
						<span class="text-[10px] font-bold px-2 py-0.5 rounded-full {task.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : task.status === 'DELIVERED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
							{task.status.replace(/_/g, ' ')}
						</span>
					</div>

					<span class="font-black text-sm text-slate-900 dark:text-white">₹{task.totalAmount}</span>
				</div>

				<!-- Addresses (Pickup & Drop) -->
				<div class="space-y-2 text-xs">
					<!-- Pickup -->
					<div class="flex items-start gap-2.5">
						<span class="text-base">🏪</span>
						<div>
							<p class="font-bold text-slate-800 dark:text-slate-200">Pickup: {$currentTenant.name}</p>
							<p class="text-[11px] text-slate-500 dark:text-slate-400">{$currentTenant.address}</p>
						</div>
					</div>

					<!-- Dropoff -->
					<div class="flex items-start gap-2.5">
						<span class="text-base">📍</span>
						<div>
							<p class="font-bold text-slate-800 dark:text-slate-200">Customer: {task.customerName}</p>
							<p class="text-[11px] text-slate-500 dark:text-slate-400">{task.deliveryAddress}</p>
						</div>
					</div>

					<div class="flex items-start gap-2.5 pt-1">
						<span class="text-base">📦</span>
						<p class="text-[11px] text-slate-500 dark:text-slate-400">{task.itemsSummary}</p>
					</div>
				</div>

				<!-- Quick Shortcuts: Call Customer & Turn-by-Turn Navigation -->
				<div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
					<a
						href="tel:{task.customerPhone}"
						class="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
					>
						<span>📞</span>
						<span>Call Customer</span>
					</a>
					<a
						href="https://maps.google.com/?q={encodeURIComponent(task.deliveryAddress)}"
						target="_blank"
						rel="noopener"
						class="py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800 transition"
					>
						<span>🗺️</span>
						<span>Google Navigation</span>
					</a>
				</div>

				<!-- Process Action Workflow -->
				<div class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
					{#if task.status === 'ASSIGNED'}
						<button
							type="button"
							onclick={() => updateTaskStatus(task, 'PICKED_UP')}
							class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs"
						>
							Confirm Food Picked Up from Restaurant Kitchen →
						</button>
					{:else if task.status === 'PICKED_UP'}
						<button
							type="button"
							onclick={() => updateTaskStatus(task, 'OUT_FOR_DELIVERY')}
							class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs"
						>
							Start Driving (Out for Delivery) 🛵
						</button>
					{:else if task.status === 'OUT_FOR_DELIVERY'}
						<div class="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
							<div class="flex items-center justify-between text-xs">
								<span class="font-bold text-slate-700 dark:text-slate-300">Customer Handover OTP:</span>
								<span class="text-[10px] text-slate-400">(Demo OTP: {task.otp})</span>
							</div>
							<div class="flex items-center gap-2">
								<input
									type="text"
									maxlength="4"
									bind:value={enteredOtp}
									placeholder="Enter 4-digit OTP"
									class="flex-1 px-3 py-2 text-center font-mono font-bold text-sm tracking-widest rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
								/>
								<button
									type="button"
									onclick={() => updateTaskStatus(task, 'DELIVERED')}
									class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs"
								>
									Complete Handover ✓
								</button>
							</div>
						</div>
					{:else}
						<div class="py-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
							✓ Successfully Delivered & Completed
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
