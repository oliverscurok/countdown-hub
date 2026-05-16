<script>
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import EventCard from '$lib/components/EventCard.svelte';
	import AddModal from '$lib/components/AddModal.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CalendarMini from '$lib/components/CalendarMini.svelte';
	import { events } from '$lib/store.svelte.js';
	import { now } from '$lib/tick.svelte.js';

	let modalOpen = $state(false);
	let editingEvent = $state(null);
	let prefillIso = $state(null);
	let pastOpen = $state(false);
	let highlightedId = $state(null);
	let highlightTimer = null;

	const sorted = $derived(
		[...events()].sort(
			(a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
		)
	);
	const active = $derived(sorted.filter((e) => new Date(e.targetDate).getTime() > now()));
	const past = $derived(
		sorted
			.filter((e) => new Date(e.targetDate).getTime() <= now())
			.reverse()
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

	function scrollToEvent(id) {
		// Defer until microtask so a freshly mounted card is in DOM
		queueMicrotask(() => {
			const el = document.getElementById(`event-${id}`);
			if (!el) return;
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			// Re-trigger animation if same id is highlighted twice in a row
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
</script>

<svelte:head>
	<title>Countdown Hub</title>
</svelte:head>

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
					<EventCard {event} onEdit={openEdit} highlight={highlightedId === event.id} />
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
			<section class="mt-12" aria-label="Past countdowns">
				<button
					type="button"
					class="flex w-full items-center justify-between rounded-2xl px-2 py-3 text-left text-sm text-white/70 transition hover:text-white"
					onclick={() => (pastOpen = !pastOpen)}
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
							<EventCard {event} onEdit={openEdit} highlight={highlightedId === event.id} />
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</main>

<AddModal bind:open={modalOpen} editing={editingEvent} {prefillIso} onClose={closeModal} />
