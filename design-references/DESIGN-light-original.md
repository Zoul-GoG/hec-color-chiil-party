---
name: HEC Beats Abidjan
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#ba0035'
  on-secondary: '#ffffff'
  secondary-container: '#e21e49'
  on-secondary-container: '#fffbff'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#ffdada'
  secondary-fixed-dim: '#ffb3b6'
  on-secondary-fixed: '#40000c'
  on-secondary-fixed-variant: '#920028'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Sora
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system powers a vibrant, collaborative party playlist web application built for social energy, rapid track discovery, and real-time crowd curation. The interface is designed for a young, music-driven audience—students, partygoers, and hosts—who need to scan queues, upvote tracks, and add songs effortlessly in both daylight and dimly lit social settings.

The aesthetic blends **Corporate / Modern** clarity with **High-Contrast / Bold** accents. Crisp white and cool slate surfaces keep the interface airy and legible, while energetic royal blue and festive crimson accents inject urgency and celebration into primary actions, live badges, and active queue states.

## Colors

The palette is anchored in a high-contrast light mode ("White Mode") that pairs clean, neutral surfaces with energetic, celebratory accents:

- **Primary (`#2563EB` / `#1D4ED8` hover):** Energetic royal blue drives primary CTAs, active navigation states, upvote toggles, and progress indicators.
- **Secondary (`#E11D48`):** Festive crimson-red highlights live-session badges, "Now Playing" indicators, hot-track pills, and destructive actions.
- **Surfaces & Backgrounds:** Pure white (`#FFFFFF`) serves as the primary card and modal surface, layered over very light cool gray (`#F8FAFC`) for the main canvas and `#F1F5F9` for recessed containers, search bars, and inactive pills.
- **Borders:** Subtle cool gray (`#E2E8F0`) defines structural boundaries without visual heaviness.
- **Typography:** Deep slate/navy (`#0F172A`) ensures maximum readability for track titles and headings, while muted slate (`#334155` and `#64748B`) handles artist names, timestamps, and metadata.

## Typography

The type system pairs **Sora** for geometric, forward-looking headlines with **Inter** for crisp, utilitarian legibility across dense playlist queues and metadata.

- **Display & Headlines (`Sora`):** Used for party room titles, section headers, and featured track callouts. Tight negative letter-spacing keeps large headings compact and punchy. On mobile viewports, `display-lg-mobile` scales down to `30px` to prevent awkward wrapping.
- **Body & Labels (`Inter`):** Used for track titles, artist names, queue timestamps, vote counts, and button labels. Tabular numerals (`font-variant-numeric: tabular-nums`) should be enabled on vote counters and track durations so numbers align cleanly during live updates.

## Layout & Spacing

This design system uses a **fluid 12-column grid** on desktop (`>= 1024px`) with `1rem` (`16px`) gutters and `1.5rem` (`24px`) outer margins, centered within a maximum container width of `1280px`.

- **Desktop (`>= 1024px`):** 12 columns. Supports a two-column split for the primary experience—an 8-column collaborative queue alongside a 4-column "Now Playing" and room-activity sidebar.
- **Tablet (`640px – 1023px`):** 8 columns with `1rem` gutters and `1.5rem` margins. The sidebar collapses into a sticky bottom player bar and tabbed drawer.
- **Mobile (`< 640px`):** 4 columns with `0.75rem` gutters and `1rem` outer margins. Content stacks vertically with generous touch targets (`44px` minimum height) and a persistent bottom playback bar.

## Elevation & Depth

Hierarchy is established through a combination of **tonal surface layering**, **low-contrast cool gray borders (`#E2E8F0`)**, and **soft ambient shadows**:

- **Base Canvas (`#F8FAFC`):** The lowest visual plane, providing a soft, non-glaring backdrop.
- **Primary Cards & Queue Containers (`#FFFFFF`):** Elevated above the canvas using a `1px solid #E2E8F0` border and a subtle ambient shadow (`0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)`).
- **Interactive Hover & Floating Elements:** Active cards, dropdowns, and the persistent "Now Playing" bar use a deeper, diffused slate-tinted shadow (`0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)`) to signal interactivity without harsh black drop shadows.

## Shapes

A **rounded (`2`)** shape language gives the interface a friendly, approachable, and modern feel:

- **Standard (`0.5rem` / `8px`):** Applied to buttons, input fields, queue item rows, and dropdown menus.
- **Large (`1rem` / `16px`):** Applied to playlist cards, album art containers, and modal dialogs.
- **Extra-Large (`1.5rem` / `24px`):** Applied to featured hero banners and floating bottom sheets.
- **Pills (`9999px`):** Reserved for status badges (e.g., "LIVE"), genre filter chips, and upvote count pills.

## Components

- **Buttons:**
  - *Primary:* Solid royal blue (`#2563EB`, hover `#1D4ED8`) with `#FFFFFF` label text, `0.5rem` radius, and `40px–44px` height.
  - *Secondary:* `#F1F5F9` fill with `#0F172A` text and subtle `#E2E8F0` border.
  - *Festive / Live CTA:* `#E11D48` fill with `#FFFFFF` text for high-priority actions like "Join Live Party" or "Boost Track."
- **Chips & Badges:** Pill-shaped (`9999px`) with `label-md` typography. Filter chips use `#F1F5F9` inactive and `#2563EB` active states. Live status badges use `#E11D48` with a subtle pulsing dot.
- **Lists (Collaborative Queue Items):** Full-width rows on `#FFFFFF` with `0.5rem` radius, `1px solid #E2E8F0` border on hover, `48px` square album art (`0.5rem` radius), `title-md` track name, `body-sm` artist, and a right-aligned upvote button.
- **Checkboxes & Radio Buttons:** `18px` controls with `#E2E8F0` borders that transition to `#2563EB` fill with `#FFFFFF` checkmarks when selected.
- **Input Fields:** `#F8FAFC` or `#FFFFFF` background, `1px solid #E2E8F0` border, `0.5rem` radius, and `#2563EB` focus ring (`2px` offset).
- **Cards:** `#FFFFFF` surface, `1rem` radius, `1.5rem` internal padding, `1px solid #E2E8F0` border, and soft ambient shadow.
- **Now Playing Bar:** Sticky bottom or sidebar module featuring `#FFFFFF` surface, `#E2E8F0` top border, `#2563EB` progress scrub bar, and `#E11D48` live-sync indicator.