<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import type { StaffRole } from '$lib/types';
	import type { Snippet } from 'svelte';

	interface Props {
		requiredRole: StaffRole;
		roleTitle: string;
		icon?: string;
		children: Snippet;
	}

	let { requiredRole, roleTitle, icon = '🔒', children }: Props = $props();

	const isAuthorized = $derived(
		$auth !== null && ($auth.role === requiredRole || $auth.role === 'ADMIN')
	);
</script>

{#if isAuthorized}
	{@render children()}
{:else}
	<div class="max-w-md mx-auto my-12 p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-center shadow-xl space-y-5">
		<div class="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center text-3xl">
			{icon}
		</div>

		<div class="space-y-1.5">
			<h2 class="text-xl font-black text-white tracking-tight">Staff Sign-In Required</h2>
			<p class="text-xs text-zinc-400 leading-relaxed">
				The <strong>{roleTitle}</strong> dashboard is restricted to authorized restaurant personnel. Please sign in to access your operational view.
			</p>
		</div>

		<div class="pt-2 space-y-2.5">
			<button
				type="button"
				onclick={() => auth.loginAsRole(requiredRole)}
				class="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-xs shadow-md transition active:scale-95"
			>
				Sign In as {roleTitle} (1-Tap Demo) →
			</button>

			<a
				href="/"
				class="block w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 transition"
			>
				← Back to Guest Customer Menu
			</a>
		</div>
	</div>
{/if}
