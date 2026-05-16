<script>
	import { onMount } from 'svelte';
	import { fly, fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { browser } from '$app/environment';
	import EventCard from '$lib/components/EventCard.svelte';
	import AddModal from '$lib/components/AddModal.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CalendarMini from '$lib/components/CalendarMini.svelte';
	import { events, markCelebrated } from '$lib/store.svelte.js';
	import { now } from '$lib/tick.svelte.js';
	import { accent } from '$lib/accents.js';

	const PAST_OPEN_KEY = 'past-section-open';
	const FRESH_HOLD_MS = 3000;
	const STAGGER_MS = 250;
	const TOAST_MS = 4000;

	function loadPastOpen() {
		if (!browser) return false;
		try {
			return localStorage.getItem(PAST_OPEN_KEY) === 'true';
		} catch {
			return false;
		}
	}

	let modalOpen = $state(false);
	let editingEvent = $state(null);
	let prefillIso = $state(null);
	let pastOpen = $state(loadPastOpen());
	let highlightedId = $state(null);
	let highlightTimer = null;

	// id → stagger delay in ms. Presence in the map means "fresh".
	let freshIds = $state({});
	let toast = $state(null);
	let toastTimer = null;

	const sorted = $derived(
		[...events()].sort(
			(a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
		)
	);
	const active = $derived(sorted.filter((e) => new Date(e.targetDate).getTime() > now()));
	const past = $derived(
		sorted.filter((e) => new Date(e.targetDate).getTime() <= now()).reverse()
	);

	function openNew() {
		editingEvent = null;
		prefillIso = null;
		modalOpen = true;
	}

	function openEdit(ev) {
		editingEvent = ev;
		prefillIso = null;
		modalOpen = true;
	}

	function openWithDate(iso) {
		editingEvent = null;
		prefillIso = iso;
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
		editingEvent = null;
		prefillIso = null;
	}

	function togglePast() {
		pastOpen = !pastOpen;
		if (!browser) return;
		try {
			localStorage.setItem(PAST_OPEN_KEY, String(pastOpen));
		} catch {
			/* ignore */
		}
	}

	function scrollToEvent(id, { withHighlight = true } = {}) {
		queueMicrotask(() => {
			const el = document.getElementById(`event-${id}`);
			if (!el) return;
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			if (!withHighlight) return;
			highlightedId = null;
			queueMicrotask(() => {
				highlightedId = id;
				clearTimeout(highlightTimer);
				highlightTimer = setTimeout(() => {
					if (highlightedId === id) highlightedId = null;
				}, 1600);
			});
		});
	}

	async function fireCelebrationConfetti(accentKey) {
		try {
			const m = await import('canvas-confetti');
			const fn = m.default;
			const palette = accent(accentKey).confetti;
			fn({
				particleCount: 110,
				spread: 90,
				origin: { y: 0.6 },
				colors: palette,
				ticks: 220
			});
			setTimeout(() => {
				fn({
					particleCount: 70,
					spread: 110,
					startVelocity: 38,
					origin: { y: 0.65 },
					colors: palette
				});
			}, 240);
			if (browser && navigator.vibrate) {
				try {
					navigator.vibrate([20, 40, 20]);
				} catch {
					/* ignore */
				}
			}
		} catch {
			/* canvas-confetti not available — skip */
		}
	}

	function isInViewport(el) {
		const rect = el.getBoundingClientRect();
		return rect.top >= 0 && rect.bottom <= (window.innerHeight || 0);
	}

	function processFreshCelebrations() {
		if (!browser) return;
		if (typeof document !== 'undefined' && document.hidden) return;

		const t = now();
		/** @type {Array<{id:string, accent:string, emoji:string, title:string}>} */
		const fresh = [];
		for (const ev of events()) {
			if (ev.celebratedAt !== null) continue;
			if (new Date(ev.targetDate).getTime() > t) continue;
			fresh.push(ev);
		}
		if (fresh.length === 0) return;

		// Sort by target time so the earliest gets the smallest stagger.
		fresh.sort(
			(a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
		);

		const iso = new Date(t).toISOString();
		for (const ev of fresh) markCelebrated(ev.id, iso);

		// Activate fresh state with staggered animation-delay.
		const nextFresh = { ...freshIds };
		fresh.forEach((ev, i) => {
			nextFresh[ev.id] = i * STAGGER_MS;
		});
		freshIds = nextFresh;

		// Release each id after its full animation has had time to play.
		fresh.forEach((ev, i) => {
			setTimeout(() => {
				const cur = { ...freshIds };
				delete cur[ev.id];
				freshIds = cur;
			}, FRESH_HOLD_MS + i * STAGGER_MS);
		});

		// Force-expand Past (and persist — staying open after the user "saw it").
		if (!pastOpen) {
			pastOpen = true;
			try {
				localStorage.setItem(PAST_OPEN_KEY, 'true');
			} catch {
				/* ignore */
			}
		}

		// Toast.
		const message =
			fresh.length === 1
				? `${fresh[0].emoji} ${fresh[0].title}`
				: `${fresh.length} events celebrated`;
		toast = { message, ids: fresh.map((e) => e.id) };
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toast = null;
		}, TOAST_MS);

		// Single confetti burst for the batch, using the most-recent event's palette.
		fireCelebrationConfetti(fresh[fresh.length - 1].accent);

		// Scroll the most recent celebrated card into view. Use setTimeout so
		// Svelte has rendered the (just-expanded) past section before we look
		// for the card; the event was active a moment ago, now it's past.
		setTimeout(() => {
			const target = fresh[fresh.length - 1];
			const el = document.getElementById(`event-${target.id}`);
			if (el && !isInViewport(el)) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 80);
	}

	// Re-detect on every tick (events() and now() are both tracked here).
	$effect(() => {
		// Establish dependency on the tick so we re-evaluate every second(ish).
		now();
		// Also depend on events length so newly-added past events get caught.
		events();
		processFreshCelebrations();
	});

	function onVisibility() {
		if (!document.hidden) processFreshCelebrations();
	}

	onMount(() => {
		processFreshCelebrations();
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			document.removeEventListener('visibilitychange', onVisibility);
			clearTimeout(toastTimer);
			clearTimeout(highlightTimer);
		};
	});

	function onToastClick() {
		const id = toast?.ids?.[0];
		toast = null;
		clearTimeout(toastTimer);
		if (id) scrollToEvent(id, { withHighlight: false });
	}
</script>

<svelte:head>
	<title>Countdown Hub</title>
</svelte:head>

{#if toast}
	<button
		type="button"
		onclick={onToastClick}
		in:fly={{ y: -20, duration: 250, easing: cubicOut }}
		out:fade={{ duration: 200 }}
		class="fixed left-1/2 top-4 z-[60] max-w-[90vw] -translate-x-1/2 truncate rounded-full bg-white/10 px-5 py-2 text-sm text-white shadow-lg ring-1 ring-white/15 backdrop-blur-xl transition hover:bg-white/15"
	>
		🎉 {toast.message}
	</button>
{/if}

<main class="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:pt-10">
	<header class="mb-6 flex items-center justify-between sm:mb-10">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Countdown Hub</h1>
			<p class="mt-1 text-sm text-white/50">{active.length} active · {past.length} celebrated</p>
		</div>
		<button
			type="button"
			onclick={openNew}
			class="group inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur-xl transition hover:bg-white/15 active:scale-95"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 5v14M5 12h14" />
			</svg>
			<span>New</span>
		</button>
	</header>

	{#if active.length === 0 && past.length === 0}
		<EmptyState onAdd={openNew} />
	{:else}
		{#if active.length > 0}
			<section
				class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
				aria-label="Active countdowns"
			>
				{#each active as event (event.id)}
					<EventCard
						{event}
						onEdit={openEdit}
						highlight={highlightedId === event.id}
						fresh={freshIds[event.id] !== undefined}
						freshDelay={freshIds[event.id] ?? 0}
					/>
				{/each}
			</section>
		{:else}
			<section class="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center">
				<div class="text-4xl">🎉</div>
				<p class="mt-2 text-sm text-white/60">No active countdowns. Add another one!</p>
				<button
					type="button"
					onclick={openNew}
					class="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
				>+ New</button>
			</section>
		{/if}

		<div class="mt-8">
			<CalendarMini onScrollToEvent={scrollToEvent} onAddOnDate={openWithDate} />
		</div>

		{#if past.length > 0}
			<section class="mt-12" id="past-section" aria-label="Past countdowns">
				<button
					type="button"
					class="flex w-full items-center justify-between rounded-2xl px-2 py-3 text-left text-sm text-white/70 transition hover:text-white"
					onclick={togglePast}
					aria-expanded={pastOpen}
				>
					<span class="font-medium">Past · {past.length}</span>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="transition-transform duration-200 {pastOpen ? 'rotate-180' : ''}"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>
				{#if pastOpen}
					<div
						class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
						transition:slide={{ duration: 240, easing: cubicOut }}
					>
						{#each past as event (event.id)}
							<EventCard
								{event}
								onEdit={openEdit}
								highlight={highlightedId === event.id}
								fresh={freshIds[event.id] !== undefined}
								freshDelay={freshIds[event.id] ?? 0}
							/>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</main>

<AddModal bind:open={modalOpen} editing={editingEvent} {prefillIso} onClose={closeModal} />
