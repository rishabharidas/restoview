<script lang="ts">
	import { auth, DEMO_STAFF_ACCOUNTS } from '$lib/stores/auth';
	import type { StaffRole } from '$lib/types';

	const isModalOpen = auth.loginModalOpen;
	let username = $state('');
	let password = $state('');
	let selectedRole = $state<StaffRole>('WAITER');

	function handleCustomLogin(e: Event) {
		e.preventDefault();
		auth.loginAsRole(selectedRole);
		const dest = auth.getRoleDestination(selectedRole);
		window.location.href = dest;
	}

	function handleQuickLogin(role: StaffRole) {
		auth.loginAsRole(role);
		const dest = auth.getRoleDestination(role);
		window.location.href = dest;
	}
</script>

{#if $isModalOpen}
	<div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
			<!-- Subtle Accent Glow -->
			<div class="absolute -top-16 -right-16 w-48 h-48 bg-zinc-700/20 rounded-full blur-2xl pointer-events-none"></div>

			<!-- Header -->
			<div class="flex items-start justify-between border-b border-zinc-800 pb-4">
				<div>
					<div class="flex items-center gap-2">
						<span class="text-xl">🔐</span>
						<h3 class="font-black text-lg text-white tracking-tight">Staff Authentication Portal</h3>
					</div>
					<p class="text-xs text-zinc-400 mt-1">
						Sign in to switch from the public guest view into your operational dashboard.
					</p>
				</div>
				<button
					type="button"
					onclick={() => auth.closeLoginModal()}
					class="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition"
				>
					✕
				</button>
			</div>

			<!-- ⚡ Instant 1-Tap Quick Staff Role Switcher (For testing and operations) -->
			<div class="space-y-2.5">
				<span class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
					1-Tap Fast Access (Testing Presets)
				</span>
				<div class="grid grid-cols-2 gap-2 text-xs font-semibold">
					<button
						type="button"
						onclick={() => handleQuickLogin('WAITER')}
						class="p-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/70 hover:border-emerald-500/50 text-left transition flex flex-col justify-between space-y-1 active:scale-95"
					>
						<div class="flex items-center justify-between">
							<span class="text-lg">🛎️</span>
							<span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">POS</span>
						</div>
						<p class="font-bold text-white">Waiter Station</p>
						<p class="text-[10px] text-zinc-400">Pooja Verma (Floor)</p>
					</button>

					<button
						type="button"
						onclick={() => handleQuickLogin('CHEF')}
						class="p-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/70 hover:border-amber-500/50 text-left transition flex flex-col justify-between space-y-1 active:scale-95"
					>
						<div class="flex items-center justify-between">
							<span class="text-lg">👨‍🍳</span>
							<span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800/60">KDS</span>
						</div>
						<p class="font-bold text-white">Kitchen Chef</p>
						<p class="text-[10px] text-zinc-400">Rajesh Kumar (Pass)</p>
					</button>

					<button
						type="button"
						onclick={() => handleQuickLogin('DRIVER')}
						class="p-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/70 hover:border-blue-500/50 text-left transition flex flex-col justify-between space-y-1 active:scale-95"
					>
						<div class="flex items-center justify-between">
							<span class="text-lg">🛵</span>
							<span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-blue-950 text-blue-300 border border-blue-800/60">GPS</span>
						</div>
						<p class="font-bold text-white">Delivery Partner</p>
						<p class="text-[10px] text-zinc-400">Amit Patel (Fleet #1)</p>
					</button>

					<button
						type="button"
						onclick={() => handleQuickLogin('ADMIN')}
						class="p-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/70 hover:border-purple-500/50 text-left transition flex flex-col justify-between space-y-1 active:scale-95"
					>
						<div class="flex items-center justify-between">
							<span class="text-lg">📊</span>
							<span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-purple-950 text-purple-300 border border-purple-800/60">Admin</span>
						</div>
						<p class="font-bold text-white">Manager Portal</p>
						<p class="text-[10px] text-zinc-400">Anil Mehta (Owner)</p>
					</button>
				</div>
			</div>

			<!-- Manual Credentials Form -->
			<form onsubmit={handleCustomLogin} class="space-y-3 pt-4 border-t border-zinc-800 text-xs">
				<span class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
					Or Sign In with Staff ID
				</span>

				<div>
					<input
						type="text"
						bind:value={username}
						placeholder="Staff Username (e.g. waiter_pooja)"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
					/>
				</div>

				<div>
					<input
						type="password"
						bind:value={password}
						placeholder="Security Password"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
					/>
				</div>

				<button
					type="submit"
					class="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-extrabold text-xs shadow-md transition active:scale-98"
				>
					Sign In to Operations →
				</button>
			</form>
		</div>
	</div>
{/if}
