# Design

## Theme

Light. A construction estimator's desk in a well-lit site office, Tuesday morning, laptop open before the client call. Warm daylight through frosted glass. Calm, not clinical.

## Color

Strategy: Restrained. Tinted warm neutrals carry the surface. One accent (warm stone) used only for primary actions, active states, and key AI highlights — never decoration.

```css
/* OKLCH tokens */
--color-bg:         oklch(97.8% 0.006 75);   /* #f8f6f3 warm off-white */
--color-surface:    oklch(99%   0.004 75);   /* cards, elevated panels */
--color-panel:      oklch(96.5% 0.008 75);   /* sidebar, toolbar backgrounds */
--color-border:     oklch(90%   0.006 75);   /* 1px borders everywhere */
--color-border-sub: oklch(93%   0.005 75);   /* subtle inner separators */

--color-accent:     oklch(55%   0.08  75);   /* warm stone — primary actions, active nav */
--color-accent-sub: oklch(88%   0.04  75);   /* accent tint for badges, highlights */

--color-text-1:     oklch(18%   0.008 75);   /* headings, primary text */
--color-text-2:     oklch(45%   0.006 75);   /* body, secondary labels */
--color-text-3:     oklch(68%   0.004 75);   /* placeholders, tertiary metadata */

--color-success:    oklch(50%   0.12  145);
--color-warning:    oklch(65%   0.10  75);
--color-danger:     oklch(50%   0.15  25);
--color-info:       oklch(52%   0.08  240);

--color-ai:         oklch(55%   0.06  260);  /* subtle purple-blue for AI elements only */
```

## Typography

One family: Inter (Google Fonts). Fixed rem scale, 1.15 ratio between steps.

```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;

--text-xs:   0.75rem  / 1.4;   /* 12px — labels, badges, metadata */
--text-sm:   0.875rem / 1.5;   /* 14px — body small, table cells */
--text-base: 1rem     / 1.6;   /* 16px — body */
--text-lg:   1.15rem  / 1.5;   /* 18px — subheadings */
--text-xl:   1.32rem  / 1.4;   /* ~21px */
--text-2xl:  1.52rem  / 1.3;   /* ~24px */
--text-3xl:  1.75rem  / 1.25;  /* 28px — page titles */
--text-4xl:  2.25rem  / 1.15;  /* 36px — hero */

Font weights: 400 (body), 500 (medium, labels), 600 (semibold, headings), 700 (bold, emphasis only).
Letter spacing: -0.015em on headings ≥ text-2xl. 0 on body.
```

## Spacing & Radius

```css
/* Spacing scale — 4px base */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;

/* Radius */
--radius-sm:   8px;    /* form controls, small chips */
--radius-md:   12px;   /* buttons, badges */
--radius-lg:   20px;   /* cards, panels */
--radius-xl:   28px;   /* large feature cards, modals */
--radius-full: 9999px; /* pill buttons, avatars */
```

## Elevation

Borders only. No box-shadow on cards or panels. Depth through surface color steps.

```css
--border-card:  1px solid oklch(90% 0.006 75);
--border-input: 1px solid oklch(88% 0.006 75);
--border-focus: 1.5px solid var(--color-accent);

/* Only exception: floating nav gets a very subtle ring */
--shadow-nav: 0 1px 3px oklch(0% 0 0 / 0.06), 0 0 0 1px oklch(90% 0.006 75);
```

## Components

**Navigation**: Floating glass bar, centered, 60px tall, 20px from top, max-width 1080px, radius-full, bg surface/80 backdrop-blur-md, shadow-nav. Logo left, primary links center, user + actions right.

**Cards**: radius-lg, bg surface, border-card, padding space-6 to space-8. Never nested. Hover: border-color steps one warmer (oklch 88%).

**Buttons**:
- Primary: bg accent, text white, radius-md, px-5 py-2.5, font-medium. Hover: oklch lightness -3%.
- Secondary: bg transparent, border border-card, text-2, radius-md. Hover: bg panel.
- Ghost: no border, text-2. Hover: bg panel.
- Pill: radius-full for top-level CTAs on landing.

**Inputs**: radius-sm, border-input, bg surface, focus:border-focus, text-base. No heavy shadows.

**Badges**: radius-full, text-xs font-medium, px-2.5 py-0.5. Semantic: success (green tint), warning (amber tint), danger (red tint), neutral (border-card bg).

**AI surfaces**: Subtle oklch 260 tint (--color-ai). AI-generated content gets a 1px left rule in color-ai at 30% opacity — not decorative, it marks AI provenance. Never use AI sparkle icons or "✨" decorators.

## Motion

Library: Framer Motion.

```js
// Transitions
const ease = [0.16, 1, 0.3, 1]; // ease-out-quint
const duration = { fast: 0.15, base: 0.22, slow: 0.35 };

// Page transitions: fade + 6px y-shift up
// Card entrance: stagger 0.06s, fade + 4px y
// AI response stream: word-level opacity cascade
// Upload progress: linear fill, no bounce
// Sidebar collapse: width transition ease-out-quint
```

Never animate layout properties (width/height for content reflow). Opacity and transform only.

## Layout

App shell: Fixed sidebar 240px (collapsed 60px), content area fills remainder. Top floating nav on landing page only.

Content max-width: 1280px with generous side gutters (48px desktop, 24px tablet, 16px mobile). Section padding: space-12 vertical minimum.

Grid: 12-column, gap space-6. Cards at 4-col (3 up) on desktop, 6-col (2 up) on tablet, 12-col on mobile.

Sidebar sections separated by thin 1px dividers (border-sub), not grouped headings.
