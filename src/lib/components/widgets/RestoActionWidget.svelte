<script lang="ts">
	interface Props {
		tableToken?: string;
		onOpenBooking?: () => void;
		onDetectLocation?: () => void;
		isLocating?: boolean;
		detectedAddress?: string;
		layout?: 'cards' | 'bar' | 'compact';
	}

	let {
		tableToken = 'qr_token_table_1_test_resto',
		onOpenBooking,
		onDetectLocation,
		isLocating = false,
		detectedAddress = '',
		layout = 'cards'
	}: Props = $props();

	function handleBookingClick() {
		if (onOpenBooking) {
			onOpenBooking();
		} else {
			// Trigger standard custom event if embedded inside custom HTML
			window.dispatchEvent(new CustomEvent('resto:open-booking'));
		}
	}

	function handleLocationClick() {
		if (onDetectLocation) {
			onDetectLocation();
		} else {
			window.dispatchEvent(new CustomEvent('resto:detect-location'));
		}
	}
</script>

<div class="resto-action-widget w-full">
	{#if layout === 'cards'}
		<!-- 3-Column Visual Cards Layout -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
			<!-- Action 1: Dine-In Table QR -->
			<div class="bg-zinc-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-zinc-800 hover:border-amber-400/50 transition-all flex flex-col justify-between group text-left shadow-lg">
				<div>
					<div class="flex items-center gap-3 mb-2.5">
						<span class="text-2xl p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-400/20">🍽️</span>
						<div>
							<h4 class="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Dine-In Table</h4>
							<p class="text-[11px] text-zinc-400">At our restaurant?</p>
						</div>
					</div>
					<p class="text-xs text-zinc-400 mb-3.5 leading-relaxed">
						Scan acrylic table stand or open Table 1 directly to order with multiplayer shared cart and digital waiter call.
					</p>
				</div>
				<div class="flex items-center gap-2">
					<a
						href="/table/{tableToken}"
						class="flex-1 text-center px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-xs transition shadow-sm active:scale-95"
					>
						Open Table 1 Menu →
					</a>
					<a
						href="/table/qr-print"
						class="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition border border-zinc-700"
						title="View & Print Acrylic QR Stands"
					>
						🖨️
					</a>
				</div>
			</div>

			<!-- Action 2: Home Delivery (strictly includes "Doorstep Delivery" headline) -->
			<div class="bg-zinc-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between group text-left shadow-lg">
				<div>
					<div class="flex items-center gap-3 mb-2.5">
						<span class="text-2xl p-2 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700">🛵</span>
						<div>
							<h4 class="font-bold text-sm text-white group-hover:text-zinc-200 transition-colors">Doorstep Delivery</h4>
							<p class="text-[11px] text-zinc-400">Gourmet dining at home</p>
						</div>
					</div>
					<p class="text-xs text-zinc-400 mb-3.5 leading-relaxed">
						Zero app install needed. Insulated thermal packaging with real-time GPS map tracking to your doorstep.
					</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={handleLocationClick}
						class="flex-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition shadow-sm flex items-center justify-center gap-1 active:scale-95"
					>
						<span>📍</span>
						<span>{isLocating ? 'Detecting...' : (detectedAddress ? 'GPS Active' : 'Auto-Locate')}</span>
					</button>
					<a
						href="#menu-section"
						class="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition border border-zinc-700"
					>
						Order ↓
					</a>
				</div>
			</div>

			<!-- Action 3: Table Reservation / Booking -->
			<div class="bg-zinc-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-zinc-800 hover:border-purple-400/50 transition-all flex flex-col justify-between group text-left shadow-lg">
				<div>
					<div class="flex items-center gap-3 mb-2.5">
						<span class="text-2xl p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-400/20">📅</span>
						<div>
							<h4 class="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">Book a Table</h4>
							<p class="text-[11px] text-zinc-400">Guaranteed reservation</p>
						</div>
					</div>
					<p class="text-xs text-zinc-400 mb-3.5 leading-relaxed">
						Reserve seating in advance. Choose between main dining, romantic rooftop starlight, or private chamber.
					</p>
				</div>
				<button
					type="button"
					onclick={handleBookingClick}
					class="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
				>
					<span>✨</span>
					<span>Reserve Table Now</span>
				</button>
			</div>
		</div>
	{:else}
		<!-- Streamlined Horizontal Action Bar -->
		<div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md">
			<div class="flex items-center gap-2">
				<a
					href="/table/{tableToken}"
					class="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
				>
					<span>🍽️</span>
					<span>Dine-In Table Menu</span>
				</a>
				<a
					href="#menu-section"
					class="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition flex items-center gap-1.5 active:scale-95"
				>
					<span>🛵</span>
					<span>Order Home Delivery</span>
				</a>
			</div>
			<button
				type="button"
				onclick={handleBookingClick}
				class="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs transition shadow-md active:scale-95 flex items-center gap-1.5"
			>
				<span>📅</span>
				<span>Book a Table</span>
			</button>
		</div>
	{/if}
</div>
