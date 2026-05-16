<script>
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { events } from '$lib/store.svelte.js';
	import { now } from '$lib/tick.svelte.js';
	import { accent } from '$lib/accents.js';

	let { onScrollToEvent, onAddOnDate } = $props();

	// --- date helpers ---
	function dayKey(d) {
		return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	}
	function startOfDay(d) {
		return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	}
	function vibrate(p) {
		if (typeof navigator !== 'undefined' && navigator.vibrate) {
			try {
				navigator.vibrate(p);
			} catch {
				/* ignore */
			}
		}
	}

	const MONTHS_LONG = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	// --- reactive snapshots ---
	const today = $derived(new Date(now()));
	const todayKey = $derived(dayKey(today));
	const todayStart = $derived(startOfDay(today));

	const hasAnyEvents = $derived(events().length > 0);

	const eventsByDay = $derived.by(() => {
		const map = new Map();
		for (const e of events()) {
			const k = dayKey(new Date(e.targetDate));
			if (!map.has(k)) map.set(k, []);
			map.get(k).push(e);
		}
		for (const arr of map.values()) {
			arr.sort(
				(a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
			);
		}
		return map;
	});

	// --- default view month: month of nearest upcoming event, fallback to today ---
	function pickInitialMonth() {
		const t = Date.now();
		const future = events()
			.map((e) => new Date(e.targetDate))
			.filter((d) => d.getTime() > t)
			.sort((a, b) => a.getTime() - b.getTime());
		const seed = future[0] ?? new Date();
		return { y: seed.getFullYear(), m: seed.getMonth() };
	}

	const initial = pickInitialMonth();
	let viewYear = $state(initial.y);
	let viewMonth = $state(initial.m);
	let direction = $state(1);

	function shiftMonth(delta) {
		direction = delta > 0 ? 1 : -1;
		const d = new Date(viewYear, viewMonth + delta, 1);
		viewYear = d.getFullYear();
		viewMonth = d.getMonth();
	}

	function gotoToday() {
		const cur = viewYear * 12 + viewMonth;
		const tgt = today.getFullYear() * 12 + today.getMonth();
		direction = tgt >= cur ? 1 : -1;
		viewYear = today.getFullYear();
		viewMonth = today.getMonth();
	}

	const isCurrentMonth = $derived(
		viewYear === today.getFullYear() && viewMonth === today.getMonth()
	);
	const monthLabel = $derived(`${MONTHS_LONG[viewMonth]} ${viewYear}`);
	const viewKey = $derived(`${viewYear}-${viewMonth}`);

	// --- 42-cell grid (Monday-first) ---
	const cells = $derived.by(() => {
		const first = new Date(viewYear, viewMonth, 1);
		const offset = (first.getDay() + 6) % 7; // Mon=0..Sun=6
		const start = new Date(viewYear, viewMonth, 1 - offset);
		const out = [];
		for (let i = 0; i < 42; i++) {
			const d = new Date(
				start.getFullYear(),
				start.getMonth(),
				start.getDate() + i
			);
			const k = dayKey(d);
			const dayEvents = eventsByDay.get(k) ?? [];
			out.push({
				date: d,
				key: k,
				day: d.getDate(),
				inMonth: d.getMonth() === viewMonth,
				isToday: k === todayKey,
				isPast: startOfDay(d) < todayStart,
				events: dayEvents
			});
		}
		return out;
	});

	const hasEventsThisMonth = $derived(
		cells.some((c) => c.inMonth && c.events.length > 0)
	);

	function describeCell(cell) {
		const dateText = `${MONTHS_LONG[cell.date.getMonth()]} ${cell.day}, ${cell.date.getFullYear()}`;
		const n = cell.events.length;
		const eventText = n === 0 ? 'no events' : n === 1 ? '1 event' : `${n} events`;
		return `${dateText}, ${eventText}`;
	}

	// --- swipe ---
	let swipeStartX = null;
	let swipeStartY = null;
	let didSwipe = false;

	function onTouchStart(e) {
		const t = e.touches[0];
		swipeStartX = t.clientX;
		swipeStartY = t.clientY;
		didSwipe = false;
	}
	function onTouchEnd(e) {
		if (swipeStartX === null) return;
		const t = e.changedTouches[0];
		const dx = t.clientX - swipeStartX;
		const dy = t.clientY - swipeStartY;
		// Only treat as horizontal swipe if it dominates vertical motion
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
			didSwipe = true;
			vibrate(8);
			shiftMonth(dx < 0 ? 1 : -1);
		}
		swipeStartX = null;
		swipeStartY = null;
	}

	// --- keyboard ---
	function onKeyDown(e) {
		if (e.key === 'ArrowLeft') {
			shiftMonth(-1);
			e.preventDefault();
		} else if (e.key === 'ArrowRight') {
			shiftMonth(1);
			e.preventDefault();
		}
	}

	// --- day click ---
	let shakeKey = $state(null);

	function onDayClick(cell) {
		if (didSwipe) {
			didSwipe = false;
			return;
		}
		if (!cell.inMonth) {
			// Tap on a spillover day jumps to that month
			shiftMonth(cell.date.getMonth() > viewMonth ? 1 : -1);
			return;
		}
		if (cell.events.length > 0) {
			vibrate(6);
			onScrollToEvent?.(cell.events[0].id);
			return;
		}
		if (cell.isPast) {
			// Subtle shake on past-empty cell
			shakeKey = cell.key;
			setTimeout(() => {
				if (shakeKey === cell.key) shakeKey = null;
			}, 320);
			return;
		}
		// Future empty → open add modal with prefilled date at 12:00
		const iso = new Date(
			cell.date.getFullYear(),
			cell.date.getMonth(),
			cell.date.getDate(),
			12,
			0,
			0
		).toISOString();
		vibrate(6);
		onAddOnDate?.(iso);
	}
</script>

{#if hasAnyEvents}
	<section
		class="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
		role="region"
		aria-label="Event calendar"
		tabindex="-1"
		onkeydown={onKeyDown}
	>
		<header class="mb-3 flex items-center justify-between gap-2">
			<div class="flex items-center gap-3 min-w-0">
				<h2 class="truncate text-base font-medium text-white">{monthLabel}</h2>
				{#if !isCurrentMonth}
					<button
						type="button"
						onclick={gotoToday}
						class="rounded-full px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
						in:fade={{ duration: 160 }}
						out:fade={{ duration: 100 }}
					>
						Today
					</button>
				{/if}
			</div>
			<div class="flex items-center gap-1">
				<button
					type="button"
					aria-label="Previous month"
					onclick={() => shiftMonth(-1)}
					class="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white active:scale-95"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="m15 18-6-6 6-6" />
					</svg>
				</button>
				<button
					type="button"
					aria-label="Next month"
					onclick={() => shiftMonth(1)}
					class="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white active:scale-95"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="m9 18 6-6-6-6" />
					</svg>
				</button>
			</div>
		</header>

		<div
			class="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-white/50"
			aria-hidden="true"
		>
			<div>Mo</div>
			<div>Tu</div>
			<div>We</div>
			<div>Th</div>
			<div>Fr</div>
			<div>Sa</div>
			<div>Su</div>
		</div>

		<div
			class="relative overflow-hidden"
			ontouchstart={onTouchStart}
			ontouchend={onTouchEnd}
		>
			{#key viewKey}
				<div
					in:fly={{ x: 20 * direction, duration: 200, easing: cubicOut }}
					out:fly={{ x: -20 * direction, duration: 150 }}
				>
					<div class="grid grid-cols-7 gap-1">
						{#each cells as cell (cell.key)}
							{@const firstAcc = cell.events[0] ? accent(cell.events[0].accent) : null}
							{@const isShaking = shakeKey === cell.key}
							{@const baseTone = cell.inMonth ? 'text-white/85' : 'text-white/40'}
							{@const dimPast =
								cell.inMonth && cell.isPast && cell.events.length === 0
									? 'opacity-50'
									: ''}
							{@const bgTint = cell.events.length > 0 && firstAcc ? firstAcc.dayBg : ''}
							{@const todayRing = cell.isToday
								? 'ring-2 ring-white/40 font-semibold text-white'
								: ''}
							{@const interactive = cell.events.length > 0 || !cell.isPast || !cell.inMonth}
							<button
								type="button"
								onclick={() => onDayClick(cell)}
								aria-label={describeCell(cell)}
								aria-current={cell.isToday ? 'date' : undefined}
								class="relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition {baseTone} {dimPast} {bgTint} {todayRing} {interactive ? 'hover:bg-white/10 active:scale-95' : 'cursor-default'} {isShaking ? 'animate-shake' : ''}"
							>
								<span class="leading-none">{cell.day}</span>
								{#if cell.events.length > 0}
									<div class="flex items-center gap-0.5">
										{#each cell.events.slice(0, 3) as ev, i (ev.id)}
											<span
												class="h-1 w-1 rounded-full {i === 2 && cell.events.length > 3
													? 'bg-white'
													: accent(ev.accent).bg}"
											></span>
										{/each}
									</div>
								{/if}
							</button>
						{/each}
					</div>

					{#if !hasEventsThisMonth}
						<p class="mt-3 text-center text-xs text-white/40">No events this month</p>
					{/if}
				</div>
			{/key}
		</div>
	</section>
{/if}

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-3px);
		}
		50% {
			transform: translateX(3px);
		}
		75% {
			transform: translateX(-2px);
		}
	}
	:global(.animate-shake) {
		animation: shake 280ms ease-in-out;
	}
</style>
