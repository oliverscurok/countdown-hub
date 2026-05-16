<script>
	let { progress = 0, color = '#a78bfa', size = 44, stroke = 3 } = $props();

	const r = $derived((size - stroke) / 2);
	const c = $derived(2 * Math.PI * r);
	const dashOffset = $derived(c * (1 - Math.max(0, Math.min(1, progress))));
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 {size} {size}"
	class="-rotate-90"
	aria-hidden="true"
>
	<circle
		cx={size / 2}
		cy={size / 2}
		r={r}
		fill="none"
		stroke="rgba(255,255,255,0.10)"
		stroke-width={stroke}
	/>
	<circle
		cx={size / 2}
		cy={size / 2}
		r={r}
		fill="none"
		stroke={color}
		stroke-width={stroke}
		stroke-linecap="round"
		stroke-dasharray={c}
		stroke-dashoffset={dashOffset}
		style="transition: stroke-dashoffset 400ms ease-out;"
	/>
</svg>
