<script lang="ts">
	import { theme } from '$lib/stores/theme';
</script>

<div class="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors">
	<button
		type="button"
		onclick={() => theme.set('light')}
		class="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 {$theme === 'light'
			? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
			: 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}"
		title="Light Theme"
		aria-label="Light Theme"
	>
		<span>☀️</span>
		<span class="hidden sm:inline">Light</span>
	</button>

	<button
		type="button"
		onclick={() => theme.set('dark')}
		class="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 {$theme === 'dark'
			? 'bg-slate-900 text-sky-400 shadow-xs'
			: 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}"
		title="Dark Theme"
		aria-label="Dark Theme"
	>
		<span>🌙</span>
		<span class="hidden sm:inline">Dark</span>
	</button>

	<button
		type="button"
		onclick={() => theme.set('system')}
		class="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 {$theme === 'system'
			? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
			: 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}"
		title="System Auto Preference"
		aria-label="System Theme"
	>
		<span>💻</span>
		<span class="hidden sm:inline">Auto</span>
	</button>
</div>
