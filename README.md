# Countdown Hub

Mobile-first PWA for personal countdowns — holidays, birthdays, deadlines. Built with **SvelteKit 2 + Svelte 5 (runes)**, **Tailwind CSS**, deployed as a static site, with everything persisted to `localStorage`. No backend.

## Highlights

- ✨ "Soft Aurora" dark theme with animated mesh gradient
- ⏱ Live ticking countdowns — `HH:MM:SS` under 24 h, `Dd Hh Mm` under a week, `Dd Hh` beyond
- 🎉 Confetti when an event crosses zero (fires once per event, persisted)
- 📱 Installable PWA, works offline (service worker via `@vite-pwa/sveltekit`)
- 🤚 Tap-and-hold (500 ms) on a card → Edit / Delete
- 💾 All data lives in `localStorage` under `countdown-hub-v1`
- 🪶 Haptics on supported devices

## Local development

```bash
npm install
npm run icons     # one-off: generates PNG icons from the SVG source
npm run dev
```

`npm run icons` only needs to be re-run when you change `static/icons/icon-source.svg` or `icon-maskable-source.svg`. The PNG outputs are committed.

## Build

```bash
npm run build
npm run preview
```

Output lands in `build/` — fully static, ready for any CDN.

## Deploy to Vercel

1. `git push` to GitHub (this repo).
2. Visit [vercel.com/new](https://vercel.com/new) → **Import** the repo.
3. Vercel auto-detects SvelteKit. Build command `npm run build`, output directory `build`.
4. Hit **Deploy**. That's it.

No environment variables required. The build is 100 % static — `@sveltejs/adapter-static` with `fallback: 'index.html'` so client-side routing works on direct loads.

## Data model

Stored under `localStorage["countdown-hub-v1"]`:

```ts
{
  events: [{
    id: string,            // nanoid(10)
    title: string,
    targetDate: string,    // ISO datetime
    emoji: string,
    accent: "rose" | "amber" | "emerald" | "sky" | "violet" | "fuchsia",
    createdAt: string      // ISO datetime
  }]
}
```

A second key `countdown-hub-celebrated-v1` tracks which events already fired their confetti so reloads don't replay it.

## Tech

- **SvelteKit 2** + **Svelte 5** runes (`$state`, `$derived`, `$effect`)
- **Tailwind CSS** 3
- **@sveltejs/adapter-static**
- **@vite-pwa/sveltekit** (Workbox-generated service worker)
- **canvas-confetti**
- **nanoid**

## Project layout

```
src/
├─ app.css                      # Tailwind base + aurora keyframes + urgent ring
├─ app.html                     # PWA meta, Inter font preconnect
├─ lib/
│  ├─ store.svelte.js           # localStorage-backed event store (runes)
│  ├─ tick.svelte.js            # global 1s/30s tick, adaptive rate
│  ├─ time.js                   # diffParts, urgencyState, formatters
│  ├─ accents.js                # 6 accent palettes
│  └─ components/
│     ├─ AuroraBackground.svelte
│     ├─ EventCard.svelte       # urgency states + long-press + inline delete
│     ├─ ProgressRing.svelte
│     ├─ AddModal.svelte        # slide-up sheet, create + edit
│     └─ EmptyState.svelte
└─ routes/
   ├─ +layout.js                # prerender: true, ssr: false
   ├─ +layout.svelte
   └─ +page.svelte
```
