import { browser } from '$app/environment';
import { events } from '$lib/store.svelte.js';

const DAY = 86_400_000;

const tick = $state({ now: Date.now() });

function needsFast() {
	const n = tick.now;
	for (const e of events()) {
		const ms = new Date(e.targetDate).getTime() - n;
		if (ms > -2000 && ms < 7 * DAY) return true;
	}
	return false;
}

let intervalId = null;
let currentRate = 0;

function ensureInterval(rate) {
	if (currentRate === rate) return;
	if (intervalId) clearInterval(intervalId);
	currentRate = rate;
	intervalId = setInterval(() => {
		tick.now = Date.now();
	}, rate);
}

if (browser) {
	ensureInterval(1000);
	// Re-evaluate desired rate periodically without thrashing
	setInterval(() => {
		const rate = needsFast() ? 1000 : 30_000;
		ensureInterval(rate);
	}, 5000);

	// Resync immediately when tab becomes visible
	document.addEventListener('visibilitychange', () => {
		if (!document.hidden) {
			tick.now = Date.now();
		}
	});
}

export function now() {
	return tick.now;
}
