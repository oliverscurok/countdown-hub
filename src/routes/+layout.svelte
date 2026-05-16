<script>
	import '../app.css';
	import AuroraBackground from '$lib/components/AuroraBackground.svelte';

	let { children } = $props();
</script>

<AuroraBackground />

<div class="relative z-10 min-h-dvh">
	{@render children()}
</div>
