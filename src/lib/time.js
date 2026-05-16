const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;
const SECOND = 1_000;

export function diffParts(targetMs, nowMs) {
	let ms = targetMs - nowMs;
	const past = ms < 0;
	ms = Math.abs(ms);
	const d = Math.floor(ms / DAY);
	ms -= d * DAY;
	const h = Math.floor(ms / HOUR);
	ms -= h * HOUR;
	const m = Math.floor(ms / MINUTE);
	ms -= m * MINUTE;
	const s = Math.floor(ms / SECOND);
	return { past, d, h, m, s };
}

/**
 * @returns {'past' | 'imminent' | 'soon' | 'near' | 'normal' | 'far'}
 */
export function urgencyState(targetMs, nowMs) {
	const ms = targetMs - nowMs;
	if (ms <= 0) return 'past';
	if (ms < DAY) return 'imminent';
	if (ms < 7 * DAY) return 'soon';
	if (ms < 30 * DAY) return 'near';
	return 'far';
}

export function formatRemaining(targetMs, nowMs) {
	const { past, d, h, m, s } = diffParts(targetMs, nowMs);
	const ms = targetMs - nowMs;
	if (past) return 'Celebrated';
	if (ms < DAY) {
		return `${pad(h)}:${pad(m)}:${pad(s)}`;
	}
	if (ms < 7 * DAY) {
		return `${d}d ${h}h ${m}m`;
	}
	return `${d}d ${h}h`;
}

function pad(n) {
	return String(n).padStart(2, '0');
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

export function formatTargetDate(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const dow = DOW[d.getDay()];
	const day = d.getDate();
	const month = MONTH[d.getMonth()];
	const year = d.getFullYear();
	const hh = pad(d.getHours());
	const mm = pad(d.getMinutes());
	return `${dow}, ${day} ${month} ${year} • ${hh}:${mm}`;
}

export function progress(createdAtIso, targetIso, nowMs) {
	const created = new Date(createdAtIso).getTime();
	const target = new Date(targetIso).getTime();
	if (!Number.isFinite(created) || !Number.isFinite(target)) return 0;
	const total = target - created;
	if (total <= 0) return 1;
	const elapsed = nowMs - created;
	return Math.max(0, Math.min(1, elapsed / total));
}

export function toLocalDatetimeInput(iso) {
	const d = iso ? new Date(iso) : new Date(Date.now() + DAY);
	if (Number.isNaN(d.getTime())) return '';
	const yyyy = d.getFullYear();
	const mo = pad(d.getMonth() + 1);
	const dd = pad(d.getDate());
	const hh = pad(d.getHours());
	const mi = pad(d.getMinutes());
	return `${yyyy}-${mo}-${dd}T${hh}:${mi}`;
}

export function fromLocalDatetimeInput(value) {
	if (!value) return null;
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return null;
	return d.toISOString();
}
