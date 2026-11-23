<script lang="ts">
	import { currentTenant } from '$lib/stores/tenant';

	interface PrintableTable {
		number: string;
		qrToken: string;
		capacity: number;
	}

	let wifiName = $state('TestResto_Guest');
	let wifiPass = $state('EatDelicious2026');

	let tables: PrintableTable[] = $state([
		{ number: 'T-01', qrToken: 'qr_token_table_1_test_resto', capacity: 4 },
		{ number: 'T-02', qrToken: 'qr_token_table_2_test_resto', capacity: 2 },
		{ number: 'T-03', qrToken: 'qr_token_table_3_test_resto', capacity: 6 },
		{ number: 'T-04', qrToken: 'qr_token_table_4_test_resto', capacity: 4 },
		{ number: 'T-05', qrToken: 'qr_token_table_5_test_resto', capacity: 4 },
		{ number: 'T-06', qrToken: 'qr_token_table_6_test_resto', capacity: 8 }
	]);

	function triggerPrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Printable Table QR Stands - {$currentTenant.name}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Control Bar (Hidden when Printing) -->
	<div class="print:hidden bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-bold text-slate-900 dark:text-white">🖨️ Table QR Stand Generator</h2>
			<p class="text-xs text-slate-500 dark:text-slate-400">
				Print-ready acrylic table stand cards for {$currentTenant.name}. Designed for A5 / A6 acrylic holders.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={triggerPrint}
				class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 active:scale-95"
			>
				🖨️ Print All Cards
			</button>
		</div>
	</div>

	<!-- Printable Table Stand Cards Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
		{#each tables as tbl}
			<div class="bg-white border-2 border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-lg print:shadow-none print:break-inside-avoid">
				<!-- Restaurant Header -->
				<div class="flex items-center gap-2 mb-2">
					{#if $currentTenant.branding.logo_url}
						<img
							src={$currentTenant.branding.logo_url}
							alt={$currentTenant.name}
							class="w-8 h-8 rounded-full object-cover"
						/>
					{/if}
					<span class="font-extrabold text-sm tracking-tight text-slate-900">
						{$currentTenant.name}
					</span>
				</div>

				<div class="my-2 py-1 px-4 rounded-full bg-slate-900 text-white text-xs font-black tracking-widest uppercase">
					Table {tbl.number}
				</div>

				<!-- Visual QR Code Container -->
				<div class="my-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm inline-block">
					<!-- Standardized Scalable QR Code Display -->
					<img
						src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://{$currentTenant.slug}.resto.local/table/{tbl.qrToken}"
						alt="QR Code for Table {tbl.number}"
						class="w-36 h-36"
					/>
				</div>

				<h3 class="font-black text-base text-slate-900">Scan to Order & Pay</h3>
				<p class="text-[11px] text-slate-500 max-w-[200px] mt-1 leading-snug">
					Point your camera to browse menu, order directly, or call your server.
				</p>

				<!-- Wi-Fi Details & Digital Bell Note -->
				<div class="mt-4 pt-3 border-t border-slate-100 w-full text-[10px] text-slate-500 space-y-0.5">
					<p>📶 Wi-Fi: <strong class="text-slate-800">{wifiName}</strong> • Key: <strong class="text-slate-800">{wifiPass}</strong></p>
					<p class="text-slate-400">No App Download Needed</p>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	@media print {
		:global(body) {
			background: white !important;
		}
		:global(header), :global(footer) {
			display: none !important;
		}
	}
</style>
