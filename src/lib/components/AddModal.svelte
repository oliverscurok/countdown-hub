<script>
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ACCENT_KEYS, accent } from '$lib/accents.js';
	import { addEvent, updateEvent } from '$lib/store.svelte.js';
	import { toLocalDatetimeInput, fromLocalDatetimeInput } from '$lib/time.js';

	let { open = $bindable(false), editing = null, prefillIso = null, onClose } = $props();

	let title = $state('');
	let dt = $state('');
	let emoji = $state('🎯');
	let accentKey = $state('violet');
	let error = $state('');

	$effect(() => {
		if (open) {
			if (editing) {
				title = editing.title;
				dt = toLocalDatetimeInput(editing.targetDate);
				emoji = editing.emoji;
				accentKey = editing.accent;
			} else {
				title = '';
				const seedIso = prefillIso ?? new Date(Date.now() + 7 * 86_400_000).toISOString();
				dt = toLocalDatetimeInput(seedIso);
				emoji = '🎯';
				accentKey = randomAccent();
			}
			error = '';
			// Focus title input
			queueMicrotask(() => {
				titleInput?.focus();
			});
		}
	});

	function randomAccent() {
		return ACCENT_KEYS[Math.floor(Math.random() * ACCENT_KEYS.length)];
	}

	function close() {
		open = false;
		onClose?.();
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

	function submit(e) {
		e?.preventDefault();
		error = '';
		const iso = fromLocalDatetimeInput(dt);
		if (!iso) {
			error = 'Pick a valid date and time.';
			return;
		}
		if (!editing && new Date(iso).getTime() <= Date.now()) {
			error = 'Target date must be in the future.';
			return;
		}
		const t = title.trim() || 'Untitled';
		const em = (emoji || '🎯').trim() || '🎯';

		if (editing) {
			updateEvent(editing.id, { title: t, targetDate: iso, emoji: em, accent: accentKey });
		} else {
			addEvent({ title: t, targetDate: iso, emoji: em, accent: accentKey });
		}
		vibrate(10);
		close();
	}

	function onKey(e) {
		if (e.key === 'Escape') close();
	}

	let titleInput = $state(null);
</script>

<svelte:window onkeydown={onKey} />

{#if open}
	<button
		type="button"
		aria-label="Close"
		class="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-lg"
		onclick={close}
		in:fade={{ duration: 180 }}
		out:fade={{ duration: 160 }}
	></button>

	<div
		role="dialog"
		aria-modal="true"
		aria-label={editing ? 'Edit countdown' : 'New countdown'}
		class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-xl rounded-t-3xl border border-white/10 bg-neutral-950/90 p-6 backdrop-blur-2xl shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.6)] sm:bottom-6 sm:rounded-3xl"
		style="padding-bottom: max(1.5rem, env(safe-area-inset-bottom));"
		in:fly={{ y: 320, duration: 280, easing: cubicOut }}
		out:fly={{ y: 320, duration: 220, easing: cubicOut }}
	>
		<div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15 sm:hidden"></div>

		<header class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-white">
				{editing ? 'Edit countdown' : 'New countdown'}
			</h2>
			<button
				type="button"
				aria-label="Close"
				class="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
				onclick={close}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>
		</header>

		<form onsubmit={submit} class="space-y-4">
			<div>
				<label class="mb-1.5 block text-xs uppercase tracking-wider text-white/50" for="cd-title">Title</label>
				<input
					id="cd-title"
					bind:this={titleInput}
					bind:value={title}
					maxlength="80"
					autocomplete="off"
					class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-white/30 outline-none ring-0 focus:border-white/30"
					placeholder="Trip to Tokyo"
				/>
			</div>

			<div class="grid grid-cols-[auto_1fr] gap-3">
				<div>
					<label class="mb-1.5 block text-xs uppercase tracking-wider text-white/50" for="cd-emoji">Emoji</label>
					<input
						id="cd-emoji"
						bind:value={emoji}
						maxlength="4"
						autocomplete="off"
						class="w-20 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl text-white outline-none focus:border-white/30"
					/>
				</div>
				<div>
					<label class="mb-1.5 block text-xs uppercase tracking-wider text-white/50" for="cd-when">Date &amp; time</label>
					<input
						id="cd-when"
						type="datetime-local"
						bind:value={dt}
						class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none focus:border-white/30"
					/>
				</div>
			</div>

			<div>
				<div class="mb-2 block text-xs uppercase tracking-wider text-white/50">Accent</div>
				<div class="flex gap-3">
					{#each ACCENT_KEYS as key (key)}
						{@const a = accent(key)}
						<button
							type="button"
							aria-label={key}
							aria-pressed={accentKey === key}
							onclick={() => (accentKey = key)}
							class="h-10 w-10 rounded-full transition active:scale-95 {a.bg} {accentKey === key ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : 'ring-1 ring-white/20'}"
						></button>
					{/each}
				</div>
			</div>

			{#if error}
				<p class="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/30">
					{error}
				</p>
			{/if}

			<div class="flex gap-2 pt-2">
				<button
					type="button"
					class="flex-1 rounded-full bg-white/5 px-4 py-3 text-sm font-medium text-white/80 ring-1 ring-white/10 transition hover:bg-white/10"
					onclick={close}
				>
					Cancel
				</button>
				<button
					type="submit"
					class="flex-1 rounded-full bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition active:scale-[0.98] hover:bg-white/90"
				>
					{editing ? 'Save' : 'Add countdown'}
				</button>
			</div>
		</form>
	</div>
{/if}
