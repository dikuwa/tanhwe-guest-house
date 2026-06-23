# File: 02-design-system.md

# Tanhwe Guest House — Design System

## Design Direction

The app must feel like a modern hospitality booking platform.

It should combine:

- Tanhwe's warm local brand identity
- Airbnb-style browsing clarity
- Breather-style room detail layout
- Clean admin dashboard patterns similar to Desert Tech
- Practical, polished, non-generic UI

## Brand Personality

- Warm
- Trustworthy
- Calm
- Clean
- Professional
- Hospitable
- Local Namibian feel

## Color Tokens

Use the Tanhwe poster as the brand base.

```css
:root {
  --color-primary: #E89008;       /* Sunset Orange */
  --color-primary-dark: #B96F05;
  --color-secondary: #0D5CA8;     /* River Blue */
  --color-secondary-dark: #083F73;
  --color-sand: #F5F1E8;
  --color-cream: #FFFDF8;
  --color-background: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-border: #E5E7EB;
  --color-text: #111827;
  --color-muted: #6B7280;
  --color-success: #16A34A;
  --color-warning: #F59E0B;
  --color-danger: #DC2626;
}
```

## Color Usage

Primary orange:

- Main CTAs
- Important badges
- Active states
- Brand highlights

Secondary blue:

- Secondary CTAs
- Links
- Footer
- Trust/navigation accents

Sand/cream:

- Background sections
- Soft hospitality panels

Avoid:

- Random gradients
- Neon colors
- Excessive dark overlays
- Generic blue SaaS look

## Typography

Recommended:

### Headings

Use one of:

- Merriweather
- Inter Tight for headings and display text
- Inter for body and interface text

Purpose:

- Adds hospitality and premium feel

### Body/UI

Use:

- Inter

Purpose:

- Clean, readable, familiar across admin and public UI

## Type Scale

```css
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 32px;
--text-4xl: 40px;
--text-5xl: 56px;
```

## Radius Scale

Use moderate radius.

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 22px;
--radius-full: 999px;
```

Avoid giant random radii.

## Spacing Scale

Use clean spacing.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

## Layout Widths

- Public page max width: 1180px
- Admin content width: full with safe padding
- Room detail content: 2-column desktop
- Mobile: single column

## Image Rules

- Room images must be large, clean, and real
- Use object-cover
- Avoid stretched or squashed images
- Use galleries, not heavy sliders
- Use thumbnails on detail pages

## Icons

Use Lucide React.

Icon style:

- 18px to 22px
- Stroke width 1.75 to 2
- Do not mix icon libraries
- Use icons only when they improve scanning

## Motion

Use Framer Motion subtly.

Allowed:

- Page fade
- Card hover lift
- Modal transitions
- Drawer transitions

Avoid:

- Bouncing
- Spinning
- Floating blobs
- Animated gradients
- Overdone reveal animations

## Components

Use shadcn/ui as the component foundation.

Required components:

- Button
- Card
- Badge
- Input
- Select
- Calendar
- Dialog
- Sheet
- Tabs
- Table
- Dropdown menu
- Toast
- Form
- Separator
- Avatar
