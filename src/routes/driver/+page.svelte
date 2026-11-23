<script lang="ts">
	import { onDestroy } from 'svelte';
	import { sendDriverLocation } from '$lib/api';

	let driverId = $state('e1000000-0000-0000-0000-000000000001');
	let orderId = $state('demo-order-2');
	let isTracking = $state(false);
	let watchId = $state<number | null>(null);
	let currentCoords = $state<{ lat: number; lng: number; speed: number; heading: number } | null>(null);
	let streamCount = $state(0);
	let errorMsg = $state('');

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
				const speed = (pos.coords.speed || 0) * 3.6; // convert m/s to km/h

				currentCoords = { lat, lng, speed, heading };
				streamCount++;

				// Stream GPS to backend API
				try {
					await sendDriverLocation({
						driver_id: driverId,
						order_id: orderId,
						latitude: lat,
						longitude: lng,
						heading,
						speed
					});
				} catch (e) {
					console.error('Failed to stream location to backend', e);
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
</script>

<div class="max-w-md mx-auto space-y-6">
	<div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
		<div class="flex items-center justify-between border-b border-slate-100 pb-3">
			<h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
				🛵 Driver GPS Tracker
			</h2>
			{#if isTracking}
				<span class="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
					<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Streaming
				</span>
			{:else}
				<span class="text-xs text-slate-400 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
					Idle
				</span>
			{/if}
		</div>

		<p class="text-xs text-slate-500 leading-relaxed">
			This lightweight PWA streams your live GPS location to the customer's live tracking map without needing an app store installation.
		</p>

		<!-- Order & Driver Inputs -->
		<div class="space-y-3">
			<div>
				<label for="order-id" class="block text-xs font-semibold text-slate-700 mb-1">Active Order ID</label>
				<input
					id="order-id"
					type="text"
					bind:value={orderId}
					class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
				/>
			</div>

			<div>
				<label for="driver-id" class="block text-xs font-semibold text-slate-700 mb-1">Driver Partner ID</label>
				<input
					id="driver-id"
					type="text"
					bind:value={driverId}
					class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono text-slate-500"
				/>
			</div>
		</div>

		{#if errorMsg}
			<div class="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
				{errorMsg}
			</div>
		{/if}

		{#if currentCoords}
			<div class="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
				<div class="flex justify-between text-slate-600">
					<span>Coordinates:</span>
					<span class="font-mono font-bold text-slate-800">{currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}</span>
				</div>
				<div class="flex justify-between text-slate-600">
					<span>Current Speed:</span>
					<span class="font-bold text-slate-800">{currentCoords.speed.toFixed(1)} km/h</span>
				</div>
				<div class="flex justify-between text-slate-600">
					<span>Points Streamed:</span>
					<span class="font-bold text-emerald-600">{streamCount}</span>
				</div>
			</div>
		{/if}

		<button
			type="button"
			onclick={toggleTracking}
			class="w-full py-3 rounded-xl font-bold text-sm shadow transition {isTracking ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}"
		>
			{isTracking ? '⏹️ Stop Live GPS Stream' : '▶️ Start Delivering & Stream GPS'}
		</button>
	</div>
</div>
