# VibeKit / JB Reference Files

> Scaffolded for the Tanhwe Guest House UI/UX update.
> **Date accessed:** June 23, 2026

---

## References

| File | Source URL | How It Is Used |
|------|-----------|----------------|
| `README.md` | https://raw.githubusercontent.com/MUKE-coder/vibekit/main/README.md | Framework overview — design philosophy, component registry structure, token economy. Adopted: component-first approach, pre-deploy review concept. |
| `design-style-guide-template.md` | https://raw.githubusercontent.com/MUKE-coder/vibekit/main/design-style-guide.md | Template for creating the Tanhwe-specific design style guide (docs/tanhwe-ui-v2/design-style-guide.md). The type scale, spacing grid, radius scale, and component specs were adapted for hospitality. |
| `jb-components.md` | https://raw.githubusercontent.com/MUKE-coder/vibekit/main/jb-components.md | JB Registry reference. Evaluated for Tanhwe — Data Table, Searchable Select, and Form primitives are relevant. Other components (auth, payments, kanban, blog) rejected because they conflict with existing architecture. |
| `agent-tooling.md` | https://github.com/MUKE-coder/vibekit/blob/main/agent-tooling.md | Agent skill + MCP guidance. Not directly applicable — Tanhwe uses Codebuff, not Claude Code. The UI/UX principles were absorbed into the design guide. |
| `vibekit-primitives.md` | https://github.com/MUKE-coder/vibekit/blob/main/vibekit-primitives.md | 150-primitive library reference. Evaluated: stat-card, page-header, empty-state, skeletons, formatters, loading-button patterns were considered but existing Tanhwe components were adapted instead to preserve architecture. |

---

## Adoption Decisions

### Fully Adopted
- **Design template structure** — the section-by-section format (typography, color, spacing, radius, shadows, components, motion, responsive, accessibility)
- **Type scale** — the table-based type definition with size, weight, line-height, tracking, and usage
- **8px spacing grid** — applied via Tailwind spacing utilities
- **Radius scale** — 6px / 8px / 10px / 12px / 16px (tailored for hospitality instead of B2B SaaS)
- **Philosophy** — borders > shadows, surfaces > gradients, `tabular-nums` for money
- **Responsive approach** — mobile-first, tables → stacked cards on small screens
- **Component spec format** — documenting buttons, inputs, cards, tables, badges, modals, forms

### Adopted with Modifications
- **Color palette** — kept Tanhwe's existing brand colors (orange `#E89008`, blue `#0D5CA8`, sand/cream neutrals) instead of VibeKit's indigo/zinc. Applied the shade refinement approach (50-900 scale with light tints and dark shades).
- **Font** — switched from VibeKit's recommended Onest to a combined Onest (body) + Inter Tight (headings) system. Onest for the clean geometric look, Inter Tight for distinctive headings. This preserves the project's existing Inter Tight usage while upgrading the body font.
- **Button heights** — VibeKit uses 36/40/44px; Tanhwe keeps 32/36/40px for a more compact dashboard feel suitable for a hospitality admin.
- **Sidebar** — VibeKit's 256px sidebar is adapted to 240px to better fit the admin content.

### Rejected (Conflicts with Architecture)
- **Prisma ORM** — Tanhwe uses Drizzle ORM with Neon PostgreSQL
- **Better Auth** — Tanhwe uses Better Auth already but has its own auth setup
- **Upstash Redis** — not needed; Tanhwe's traffic volume doesn't require caching
- **React Query** — Tanhwe uses server components and direct fetch
- **Stripe / payments** — Tanhwe records payments offline (cash/bank transfer)
- **Framer Motion for everything** — kept Framer Motion but only for dialogs/modals
- **Tailwind v4 CSS-first config** — already using Tailwind v4 via `@theme` in globals.css — perfect fit
- **Kanban Board, Rich Text Editor, Notification Center** — not needed for a guest house admin
- **Website UI component** — Tanhwe already has its own public pages
- **JB Better Auth UI** — auth is already implemented with Better Auth + custom UI
- **File Storage UI** — Tanhwe already has Cloudflare R2 + custom upload UI
- **Data Table component** — existing tables are simple and functional; replacing them would risk breaking state management

### Parts Reviewed but Not Installed
The following JB/VibeKit registry components were evaluated but ultimately not installed because existing Tanhwe components are sufficient or the scope doesn't justify it:
- Searchable Select — existing `<select>` elements are simple enough
- Data Table — existing tables work with server-side rendering
- Empty states — Tanhwe already has basic empty states; improved them inline
- Loading skeletons — added CSS shimmer patterns instead of installing a library
- Page Header — incorporated the pattern into admin pages directly

---

## Design Principles Applied from VibeKit

1. **Premium minimalism** — generous whitespace, sharp typography, subtle borders
2. **Warm hospitality** — warm sand/cream neutrals instead of cold grays
3. **Quiet confidence** — refined borders, soft shadows, precise alignment
4. **Image-led** — real guest house imagery takes visual priority
5. **Functional over decorative** — every element serves a purpose
6. **Mobile-first** — layouts start as single-column and expand
