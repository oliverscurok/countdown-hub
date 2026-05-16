import { browser } from '$app/environment';
import { nanoid } from 'nanoid';

const KEY = 'countdown-hub-v1';
const LEGACY_CELEBRATED_KEY = 'countdown-hub-celebrated-v1';

function isValidEvent(e) {
	return (
		e &&
		typeof e.id === 'string' &&
		typeof e.title === 'string' &&
		typeof e.targetDate === 'string' &&
		typeof e.emoji === 'string' &&
		typeof e.accent === 'string' &&
		typeof e.createdAt === 'string'
	);
}

function readLegacyCelebrated() {
	if (!browser) return new Set();
	try {
		const raw = localStorage.getItem(LEGACY_CELEBRATED_KEY);
		if (!raw) return new Set();
		const arr = JSON.parse(raw);
		return new Set(Array.isArray(arr) ? arr : []);
	} catch {
		return new Set();
	}
}

// Add `celebratedAt` (null | ISO string) to legacy events.
// If an event is already past at first load — or appeared in the legacy
// `countdown-hub-celebrated-v1` set — anchor it to its targetDate so the
// glow won't fire for things the user has already seen.
function migrate(rawEvents) {
	const now = Date.now();
	const legacy = readLegacyCelebrated();
	let touched = legacy.size > 0;

	const events = rawEvents.map((e) => {
		if (Object.prototype.hasOwnProperty.call(e, 'celebratedAt')) {
			return e;
		}
		touched = true;
		const isPastAlready = new Date(e.targetDate).getTime() <= now;
		const celebratedAt = legacy.has(e.id) || isPastAlready ? e.targetDate : null;
		return { ...e, celebratedAt };
	});

	return { events, touched };
}

function loadRaw() {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!parsed || !Array.isArray(parsed.events)) return [];
		return parsed.events.filter(isValidEvent);
	} catch {
		return [];
	}
}

const initial = migrate(loadRaw());
const state = $state({ events: initial.events });

function persist() {
	if (!browser) return;
	try {
		localStorage.setItem(KEY, JSON.stringify({ events: state.events }));
	} catch {
		/* quota or private mode — ignore */
	}
}

if (browser && initial.touched) {
	persist();
	try {
		localStorage.removeItem(LEGACY_CELEBRATED_KEY);
	} catch {
		/* ignore */
	}
}

export function events() {
	return state.events;
}

export function addEvent({ title, targetDate, emoji, accent }) {
	const event = {
		id: nanoid(10),
		title: title.trim() || 'Untitled',
		targetDate,
		emoji: emoji || '🎯',
		accent: accent || 'violet',
		createdAt: new Date().toISOString(),
		celebratedAt: null
	};
	state.events = [...state.events, event];
	persist();
	return event;
}

export function updateEvent(id, patch) {
	state.events = state.events.map((e) => {
		if (e.id !== id) return e;
		const merged = { ...e, ...patch };
		if (patch.targetDate !== undefined && patch.targetDate !== e.targetDate) {
			const newMs = new Date(patch.targetDate).getTime();
			if (newMs <= Date.now()) {
				// Edited into the past — anchor to that date, suppress glow.
				merged.celebratedAt = patch.targetDate;
			} else {
				// Moved back into the future — re-arm so a future transition can fire.
				merged.celebratedAt = null;
			}
		}
		return merged;
	});
	persist();
}

export function removeEvent(id) {
	state.events = state.events.filter((e) => e.id !== id);
	persist();
}

export function markCelebrated(id, isoTimestamp) {
	let changed = false;
	state.events = state.events.map((e) => {
		if (e.id !== id || e.celebratedAt !== null) return e;
		changed = true;
		return { ...e, celebratedAt: isoTimestamp };
	});
	if (changed) persist();
	return changed;
}

if (browser) {
	window.addEventListener('storage', (e) => {
		if (e.key === KEY && e.newValue) {
			try {
				const parsed = JSON.parse(e.newValue);
				if (parsed && Array.isArray(parsed.events)) {
					const m = migrate(parsed.events.filter(isValidEvent));
					state.events = m.events;
				}
			} catch {
				/* ignore */
			}
		}
	});
}
