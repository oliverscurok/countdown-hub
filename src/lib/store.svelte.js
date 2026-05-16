import { browser } from '$app/environment';
import { nanoid } from 'nanoid';

const KEY = 'countdown-hub-v1';
const CELEBRATED_KEY = 'countdown-hub-celebrated-v1';

function load() {
	if (!browser) return { events: [] };
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { events: [] };
		const parsed = JSON.parse(raw);
		if (!parsed || !Array.isArray(parsed.events)) return { events: [] };
		return { events: parsed.events.filter(isValidEvent) };
	} catch {
		return { events: [] };
	}
}

function loadCelebrated() {
	if (!browser) return new Set();
	try {
		const raw = localStorage.getItem(CELEBRATED_KEY);
		if (!raw) return new Set();
		const arr = JSON.parse(raw);
		return new Set(Array.isArray(arr) ? arr : []);
	} catch {
		return new Set();
	}
}

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

const state = $state(load());
const celebrated = $state({ ids: [...loadCelebrated()] });

function persist() {
	if (!browser) return;
	try {
		localStorage.setItem(KEY, JSON.stringify({ events: state.events }));
	} catch {
		/* quota or private mode — ignore */
	}
}

function persistCelebrated() {
	if (!browser) return;
	try {
		localStorage.setItem(CELEBRATED_KEY, JSON.stringify(celebrated.ids));
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
		createdAt: new Date().toISOString()
	};
	state.events = [...state.events, event];
	persist();
	return event;
}

export function updateEvent(id, patch) {
	state.events = state.events.map((e) => (e.id === id ? { ...e, ...patch } : e));
	persist();
}

export function removeEvent(id) {
	state.events = state.events.filter((e) => e.id !== id);
	persist();
	// Also clean up celebration record so re-adding triggers again
	if (celebrated.ids.includes(id)) {
		celebrated.ids = celebrated.ids.filter((x) => x !== id);
		persistCelebrated();
	}
}

export function hasCelebrated(id) {
	return celebrated.ids.includes(id);
}

export function markCelebrated(id) {
	if (celebrated.ids.includes(id)) return;
	celebrated.ids = [...celebrated.ids, id];
	persistCelebrated();
}

// Cross-tab sync
if (browser) {
	window.addEventListener('storage', (e) => {
		if (e.key === KEY && e.newValue) {
			try {
				const parsed = JSON.parse(e.newValue);
				if (parsed && Array.isArray(parsed.events)) {
					state.events = parsed.events.filter(isValidEvent);
				}
			} catch {
				/* ignore */
			}
		}
		if (e.key === CELEBRATED_KEY && e.newValue) {
			try {
				const arr = JSON.parse(e.newValue);
				celebrated.ids = Array.isArray(arr) ? arr : [];
			} catch {
				/* ignore */
			}
		}
	});
}
