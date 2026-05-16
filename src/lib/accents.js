export const ACCENTS = {
	rose: {
		ring: 'stroke-rose-400',
		text: 'text-rose-300',
		glow: 'shadow-[0_0_60px_-15px_rgba(244,63,94,0.45)]',
		glowStrong: 'shadow-[0_0_80px_-10px_rgba(244,63,94,0.7)]',
		bg: 'bg-rose-400',
		dayBg: 'bg-rose-500/15',
		border: 'border-rose-400/40',
		hex: '#fb7185',
		hexStrong: 'rgba(244,63,94,0.95)',
		confetti: ['#fda4af', '#fb7185', '#f43f5e', '#e11d48']
	},
	amber: {
		ring: 'stroke-amber-400',
		text: 'text-amber-300',
		glow: 'shadow-[0_0_60px_-15px_rgba(245,158,11,0.45)]',
		glowStrong: 'shadow-[0_0_80px_-10px_rgba(245,158,11,0.7)]',
		bg: 'bg-amber-400',
		dayBg: 'bg-amber-500/15',
		border: 'border-amber-400/40',
		hex: '#fbbf24',
		hexStrong: 'rgba(245,158,11,0.95)',
		confetti: ['#fde68a', '#fbbf24', '#f59e0b', '#d97706']
	},
	emerald: {
		ring: 'stroke-emerald-400',
		text: 'text-emerald-300',
		glow: 'shadow-[0_0_60px_-15px_rgba(16,185,129,0.45)]',
		glowStrong: 'shadow-[0_0_80px_-10px_rgba(16,185,129,0.7)]',
		bg: 'bg-emerald-400',
		dayBg: 'bg-emerald-500/15',
		border: 'border-emerald-400/40',
		hex: '#34d399',
		hexStrong: 'rgba(16,185,129,0.95)',
		confetti: ['#a7f3d0', '#34d399', '#10b981', '#059669']
	},
	sky: {
		ring: 'stroke-sky-400',
		text: 'text-sky-300',
		glow: 'shadow-[0_0_60px_-15px_rgba(56,189,248,0.45)]',
		glowStrong: 'shadow-[0_0_80px_-10px_rgba(56,189,248,0.7)]',
		bg: 'bg-sky-400',
		dayBg: 'bg-sky-500/15',
		border: 'border-sky-400/40',
		hex: '#38bdf8',
		hexStrong: 'rgba(56,189,248,0.95)',
		confetti: ['#bae6fd', '#38bdf8', '#0ea5e9', '#0284c7']
	},
	violet: {
		ring: 'stroke-violet-400',
		text: 'text-violet-300',
		glow: 'shadow-[0_0_60px_-15px_rgba(139,92,246,0.45)]',
		glowStrong: 'shadow-[0_0_80px_-10px_rgba(139,92,246,0.7)]',
		bg: 'bg-violet-400',
		dayBg: 'bg-violet-500/15',
		border: 'border-violet-400/40',
		hex: '#a78bfa',
		hexStrong: 'rgba(139,92,246,0.95)',
		confetti: ['#ddd6fe', '#a78bfa', '#8b5cf6', '#7c3aed']
	},
	fuchsia: {
		ring: 'stroke-fuchsia-400',
		text: 'text-fuchsia-300',
		glow: 'shadow-[0_0_60px_-15px_rgba(217,70,239,0.45)]',
		glowStrong: 'shadow-[0_0_80px_-10px_rgba(217,70,239,0.7)]',
		bg: 'bg-fuchsia-400',
		dayBg: 'bg-fuchsia-500/15',
		border: 'border-fuchsia-400/40',
		hex: '#e879f9',
		hexStrong: 'rgba(217,70,239,0.95)',
		confetti: ['#f5d0fe', '#e879f9', '#d946ef', '#c026d3']
	}
};

export const ACCENT_KEYS = Object.keys(ACCENTS);

export function accent(key) {
	return ACCENTS[key] ?? ACCENTS.violet;
}
