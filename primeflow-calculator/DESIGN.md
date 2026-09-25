# Profit Recovery Engine: design system

**Direction: night-drive instrument panel.** The synthwave horizon is the atmosphere, not the decoration. Everything placed on top of it is restrained: hairline surfaces, one accent per job, and big numbers doing the talking.

## Colour has one job each

| Token | Value | Job |
|---|---|---|
| `ink-950` | `#03060f` | Canvas |
| `card` / `surface` | `rgba(10,20,50,.6)` → opaque `rgba(7,14,34,.86)` | Content surfaces (opaque enough to read over the moving grid without backdrop blur on scrolling content) |
| `line` | `rgba(96,165,250,.12)` | Hairlines |
| `cyan` `#00c8ff` / `cyan-soft` `#38bdf8` | | Interaction: focus, selection, links, "you are here" |
| `gold` `#d4af37` / `#ffd700` | | Brand highlight: ENGINE, the top opportunity |
| `win` `#4ade80` / `#22c55e` | | Money you can win back |
| `leak` red / orange / yellow | `#ef4444` `#fb923c` `#facc15` | The three leaks, always in that order |
| `pink` `#ff00dd` | | Headline neon and horizon only |
| `soft` `#a3b1c6`, `muted` `#7d8ba1` | | Secondary and tertiary text (≥4.5:1 on the canvas; the brief's `#64748b` is kept as `brand-muted` for decoration only) |

## Type

- **Orbitron** (700/900): the headline, the headline money figures (leakage total, teaser, ROI), the grade letter. Nothing else.
- **Inter** (400–700): everything else. Numbers use tabular figures (`.tabular`). Headings are sentence case with tight tracking (−0.015 to −0.03em).
- Small uppercase labels (11px, 0.14–0.18em tracking) are reserved for data labels and form group titles.

## Surfaces

- `Card` (`.surface`, 22px radius): every report section and form.
- `Bezel` (outer tray + inner plate, 28px radius): only the hero moments: scan box, teaser, leakage banner, closing CTA.
- No nested cards. Data tiles inside a card are flat tinted blocks with a 1px ring.

## Motion

- One orchestrated entrance on the landing hero (logo → words → subhead → scan box), blur-in with `cubic-bezier(.16,1,.3,1)`.
- Steps cross-fade (400ms). Sections fade up once on scroll. Money counts up once.
- Neon flicker never drops below 0.55 opacity. ENGINE never animates.
- CTA: brand gradient travels, a gloss band sweeps; presses scale to 0.98.
- `prefers-reduced-motion`: Motion is set to `reducedMotion="user"`, CSS loops stop, the canvas renders one static frame.

## Components

- Primary CTA: pill with a nested trailing icon circle that nudges on hover.
- Ghost button: pill, hairline ring, used for Back and Download.
- Inputs: 48px, 12px radius, cyan focus ring. Source badges sit under the field ("Found on your site" cyan, "Industry average" gold, "Industry data" violet) and disappear when the prospect edits the value.
- Icons: one inline set (`ui/Icon.tsx`), 24px grid, 1.6 stroke. No emoji.
