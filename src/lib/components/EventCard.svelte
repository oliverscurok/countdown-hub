<script>
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import ProgressRing from './ProgressRing.svelte';
	import { now } from '$lib/tick.svelte.js';
	import { accent } from '$lib/accents.js';
	import {
		diffParts,
		urgencyState,
		formatTargetDate,
		progress as progressOf
	} from '$lib/time.js';
	import { hasCelebrated, markCelebrated, removeEvent } from '$lib/store.svelte.js';

	let { event, onEdit, highlight = false } = $props();

	const targetMs = $derived(new Date(event.targetDate).getTime());
	const parts = $derived(diffParts(targetMs, now()));
	const state = $derived(urgencyState(targetMs, now()));
	const acc = $derived(accent(event.accent));
	const ringProgress = $derived(progressOf(event.createdAt, event.targetDate, now()));
	const isPast = $derived(state === 'past');

	// One-shot flag to distinguish first effect run from later transitions
	let armed = false;

	$effect(() => {
		const past = isPast;
		if (!armed) {
			armed = true;
			if (past && !hasCelebrated(event.id)) {
				// Already past at mount — mark silently
				markCelebrated(event.id);
			}
			return;
		}
		if (!past) return;
		if (hasCelebrated(event.id)) return;

		// Crossed zero while we were watching — fire confetti once
		(async () => {
			try {
				const m = await import('canvas-confetti');
				const fn = m.default;
				const palette = acc.confetti;
				fn({
					particleCount: 90,
					spread: 80,
					origin: { y: 0.6 },
					colors: palette,
					ticks: 200
				});
				setTimeout(() => {
					fn({
						particleCount: 60,
						spread: 100,
						startVelocity: 35,
						origin: { y: 0.65 },
						colors: palette
					});
				}, 220);
				vibrate([20, 40, 20]);
			} catch {
				/* package missing — skip */
			}
			markCelebrated(event.id);
		})();
	});

	function vibrate(pattern) {
		if (typeof navigator !== 'undefined' && navigator.vibrate) {
			try {
				navigator.vibrate(pattern);
			} catch {
				/* ignore */
			}
		}
	}

	function pad(n) {
		return String(n).padStart(2, '0');
	}

	let menuOpen = $state(false);
	let confirmingDelete = $state(false);

	function toggleMenu(e) {
		e?.stopPropagation();
		menuOpen = !menuOpen;
		if (menuOpen) vibrate(10);
	}

	function startEdit() {
		menuOpen = false;
		onEdit?.(event);
	}
	function askDelete() {
		menuOpen = false;
		confirmingDelete = true;
	}
	function cancelDelete() {
		confirmingDelete = false;
	}
	function confirmDelete() {
		vibrate(10);
		removeEvent(event.id);
		confirmingDelete = false;
	}

	const baseClasses =
		'group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-200 ease-out hover:scale-[1.02]';

	const stateClasses = $derived(
		{
			far: 'opacity-90',
			near: '',
			soon: 'pulse-soft',
			imminent: 'urgent-ring pulse-soft',
			past: 'grayscale-[80%] opacity-80'
		}[state] ?? ''
	);

	const glowClass = $derived(state === 'soon' || state === 'imminent' ? acc.glowStrong : acc.glow);

	const cssVars = $derived(`--accent-strong: ${acc.hexStrong};`);
</script>

<article
	id={`event-${event.id}`}
	class="{baseClasses} {stateClasses} {isPast ? '' : glowClass} {highlight ? 'card-highlight' : ''}"
	style={cssVars}
	in:fly={{ y: 12, duration: 220, easing: cubicOut }}
	out:scale={{ start: 0.92, duration: 200, easing: cubicIn }}
>
	<div class="flex items-start justify-between">
		<div class="text-4xl select-none leading-none" aria-hidden="true">{event.emoji}</div>
		<button
			type="button"
			onclick={toggleMenu}
			aria-haspopup="menu"
			aria-expanded={menuOpen}
			aria-label="Open card menu"
			class="relative -m-2 rounded-full p-2 transition hover:bg-white/5 active:scale-95"
		>
			<ProgressRing progress={ringProgress} color={acc.hex} />
		</button>
	</div>

	<h3 class="mt-4 text-lg font-medium text-white/90 line-clamp-1">{event.title}</h3>

	<div
		class="mt-2 tabular whitespace-nowrap text-[clamp(2.25rem,8.5vw,3.25rem)] font-semibold leading-[0.95] tracking-tight {acc.text}"
	>
		{#if isPast}
			<span class="text-white/70">Celebrated 🎉</span>
		{:else if parts.d >= 7}
			{#key parts.d}
				<span
					in:fade={{ duration: 140 }}
					class="inline-block"
				>{parts.d}d</span>
			{/key}
			<span class="text-white/40"> </span>
			{#key parts.h}
				<span
					in:fade={{ duration: 140 }}
					class="inline-block"
				>{parts.h}h</span>
			{/key}
		{:else if parts.d >= 1}
			{#key parts.d}
				<span in:fade={{ duration: 140 }} class="inline-block">{parts.d}d</span>
			{/key}
			<span> </span>
			{#key parts.h}
				<span in:fade={{ duration: 140 }} class="inline-block">{parts.h}h</span>
			{/key}
			<span> </span>
			{#key parts.m}
				<span in:fade={{ duration: 140 }} class="inline-block">{parts.m}m</span>
			{/key}
		{:else}
			{#key parts.h}<span in:fade={{ duration: 140 }} class="inline-block">{pad(parts.h)}</span>{/key}<span class="text-white/40">:</span>{#key parts.m}<span in:fade={{ duration: 140 }} class="inline-block">{pad(parts.m)}</span>{/key}<span class="text-white/40">:</span><span class="inline-block">{pad(parts.s)}</span>
		{/if}
	</div>

	<div class="mt-3 text-xs text-white/60">{formatTargetDate(event.targetDate)}</div>

	{#if isPast}
		<div
			class="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10"
		>
			<span>Celebrated</span><span aria-hidden="true">🎉</span>
		</div>
	{/if}

	{#if menuOpen}
		<button
			type="button"
			aria-label="Close menu"
			class="fixed inset-0 z-40 cursor-default bg-black/30 backdrop-blur-sm"
			onclick={() => (menuOpen = false)}
			in:fade={{ duration: 120 }}
			out:fade={{ duration: 120 }}
		></button>
		<div
			class="absolute right-4 top-4 z-50 w-36 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl"
			in:fly={{ y: -6, duration: 160, easing: cubicOut }}
			out:fade={{ duration: 100 }}
		>
			<button
				type="button"
				class="block w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10"
				onclick={startEdit}
			>
				Edit
			</button>
			<button
				type="button"
				class="block w-full px-4 py-3 text-left text-sm text-rose-300 hover:bg-rose-500/10"
				onclick={askDelete}
			>
				Delete
			</button>
		</div>
	{/if}

	{#if confirmingDelete}
		<div
			class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-3xl bg-neutral-950/85 p-6 backdrop-blur-xl"
			in:fade={{ duration: 140 }}
			out:fade={{ duration: 100 }}
		>
			<p class="text-center text-sm text-white/80">Delete <span class="font-medium">{event.title}</span>?</p>
			<div class="flex gap-2">
				<button
					type="button"
					class="rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 ring-1 ring-white/10 hover:bg-white/15"
					onclick={cancelDelete}
				>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-full bg-rose-500/90 px-4 py-2 text-sm font-medium text-white shadow-[0_0_30px_-10px_rgba(244,63,94,0.8)] hover:bg-rose-500"
					onclick={confirmDelete}
				>
					Delete
				</button>
			</div>
		</div>
	{/if}
</article>
