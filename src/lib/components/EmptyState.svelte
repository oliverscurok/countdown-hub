<script>
	let { onAdd } = $props();
</script>

<div class="flex flex-col items-center justify-center py-24 text-center">
	<div class="text-6xl select-none" aria-hidden="true">📅</div>
	<h2 class="mt-6 text-xl font-medium text-white/90">No countdowns yet</h2>
	<p class="mt-2 max-w-xs text-sm text-white/50">
		Add your first one — a holiday, a deadline, that long-anticipated weekend.
	</p>
	<button
		type="button"
		onclick={onAdd}
		class="mt-8 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white shadow-[0_0_60px_-15px_rgba(168,85,247,0.5)] ring-1 ring-white/15 backdrop-blur-xl transition hover:bg-white/15 active:scale-95"
	>
		Add your first
	</button>
</div>
