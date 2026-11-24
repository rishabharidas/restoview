<script lang="ts">
	interface Props {
		tableToken?: string;
		onOpenBooking?: () => void;
		onDetectLocation?: () => void;
		isLocating?: boolean;
		detectedAddress?: string;
		layout?: 'cards' | 'bar';
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
		<!-- Minimalist Luxury Michelin Action Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
			<!-- Gateway 1: Dine-In Table Service -->
			<div class="bg-zinc-900/70 hover:bg-zinc-900/90 backdrop-blur-md rounded-2xl p-5 border border-zinc-800 hover:border-amber-400/40 transition-all flex flex-col justify-between group text-left">
				<div>
					<div class="flex items-center gap-2.5 mb-2">
						<span class="text-xl p-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">🍽️</span>
						<div>
							<h4 class="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Dine-In Table</h4>
							<p class="text-[11px] text-zinc-400">At our restaurant?</p>
						</div>
					</div>
					<p class="text-xs text-zinc-400 mb-4 leading-relaxed font-light">
						Scan acrylic table stand or open Table 1 for collaborative shared ordering.
					</p>
				</div>
				<div class="flex items-center gap-2">
					<a
						href="/table/{tableToken}"
						class="flex-1 text-center px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-xs transition shadow-sm active:scale-95"
					>
						Open Table 1 →
					</a>
					<a
						href="/table/qr-print"
						class="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition border border-zinc-700"
						title="Print Acrylic QR Stand"
					>
						🖨️
					</a>
				</div>
			</div>

			<!-- Gateway 2: Online Delivery (strictly contains "🛵 Home Delivery") -->
			<div class="bg-zinc-900/70 hover:bg-zinc-900/90 backdrop-blur-md rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between group text-left">
				<div>
					<div class="flex items-center gap-2.5 mb-2">
						<span class="text-xl p-2 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700">🛵</span>
						<div>
							<h4 class="font-bold text-sm text-white group-hover:text-zinc-200 transition-colors">🛵 Home Delivery</h4>
							<p class="text-[11px] text-zinc-400">Gourmet dining at home</p>
						</div>
					</div>
					<p class="text-xs text-zinc-400 mb-4 leading-relaxed font-light">
						Live GPS tracking and insulated thermal packaging direct to your door.
					</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={handleLocationClick}
						class="flex-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition flex items-center justify-center gap-1 active:scale-95"
					>
						<span>📍</span>
						<span>{isLocating ? 'Locating...' : (detectedAddress ? 'GPS Ready' : 'Auto-Locate')}</span>
					</button>
					<a
						href="#menu-section"
						class="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition border border-zinc-700"
					>
						Menu ↓
					</a>
				</div>
			</div>

			<!-- Gateway 3: Advance Table Booking -->
			<div class="bg-zinc-900/70 hover:bg-zinc-900/90 backdrop-blur-md rounded-2xl p-5 border border-zinc-800 hover:border-amber-400/40 transition-all flex flex-col justify-between group text-left">
				<div>
					<div class="flex items-center gap-2.5 mb-2">
						<span class="text-xl p-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">📅</span>
						<div>
							<h4 class="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Book a Table</h4>
							<p class="text-[11px] text-zinc-400">Guaranteed reservation</p>
						</div>
					</div>
					<p class="text-xs text-zinc-400 mb-4 leading-relaxed font-light">
						Reserve seating in advance for rooftop starlight, private dining, or dates.
					</p>
				</div>
				<button
					type="button"
					onclick={handleBookingClick}
					class="w-full py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs transition shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
				>
					<span>✨</span>
					<span>Reserve Seating</span>
				</button>
			</div>
		</div>
	{:else}
		<!-- Minimalist Bar Layout -->
		<div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md">
			<div class="flex items-center gap-2">
				<a
					href="/table/{tableToken}"
					class="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-xs transition"
				>
					🍽️ Dine-In Table
				</a>
				<a
					href="#menu-section"
					class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition"
				>
					🛵 Home Delivery
				</a>
			</div>
			<button
				type="button"
				onclick={handleBookingClick}
				class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs transition"
			>
				📅 Reserve a Table
			</button>
		</div>
	{/if}
</div>
