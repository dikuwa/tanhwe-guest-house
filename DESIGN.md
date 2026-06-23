---
name: Tanhwe Guest House
description: Warm Namibian hospitality with clear, practical booking flows
colors:
  sunset-orange: "#E89008"
  sunset-orange-deep: "#B96F05"
  river-blue: "#0D5CA8"
  river-blue-deep: "#083F73"
  warm-sand: "#F5F1E8"
  soft-cream: "#FFFDF8"
  ink: "#111827"
  muted-ink: "#6B7280"
  border: "#E5E7EB"
typography:
  display:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "clamp(2.75rem, 8vw, 6.5rem)"
    fontWeight: 700
    lineHeight: 0.95
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "22px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "clamp(64px, 10vw, 128px)"
components:
  button-primary:
    backgroundColor: "{colors.sunset-orange}"
    textColor: "{colors.soft-cream}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.soft-cream}"
    textColor: "{colors.river-blue-deep}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
---

## Overview

**Creative North Star: A sun-warmed guest-book beside an open window.** The public experience is image-first, calm, and useful. It should feel cared for rather than luxurious for luxury's sake.

**The Useful Warmth Rule.** Every expressive choice must improve welcome, orientation, or booking confidence.

The public site uses generous image-led compositions and varied section rhythm. The admin register may be denser, but it shares the same tokens and plain language.

## Colors

Sunset orange carries action and hospitality. River blue carries trust, navigation, and quieter actions. Sand and cream create warmth without becoming beige-on-beige. Ink remains tinted and readable.

**The Two-River Rule.** Orange is for commitment; blue is for guidance. Never let both compete at equal intensity in the same component.

## Typography

Libre Baskerville is the selected public display face. Inter remains the body and interface face. Headings use decisive scale and tight leading; body copy stays between 65 and 75 characters per line.

**The Guest-Book Rule.** Display type appears in short, confident phrases, never in long paragraphs or tiny labels.

## Elevation

Surfaces are mostly flat. Separation comes from tonal backgrounds, whitespace, and fine borders. Shadows are reserved for sticky booking controls and lifted navigation, always soft and low contrast.

## Components

Buttons use moderate corners, clear verbs, and strong focus states. Room cards are image-dominant with price and inclusions visible without interaction. Forms group dates, party size, and contact information in the order a guest naturally thinks through a stay. Mobile pages use a sticky booking/contact action without covering content.

**The Real Inventory Rule.** Room names, prices, capacity, availability, and images come from the database. Decorative hardcoded substitutes are prohibited.

## Do's and Don'ts

Do:

- Lead with credible room and place imagery.
- Keep prices, breakfast inclusion, capacity, and contact actions scannable.
- Use asymmetric but calm compositions and varied spacing.
- Write like a thoughtful host: brief, direct, and helpful.
- Preserve keyboard, focus, contrast, and reduced-motion support.

Don't:

- Build a generic SaaS landing page.
- Use decorative blobs, glassmorphism, gradient text, or random gradients.
- Repeat identical icon cards across every section.
- Hide practical information behind hover, sliders, or marketing copy.
- Stretch images, use giant radii, or rely on heavy shadows.
