# Landing Page Redesign (Modern Dev Tool Aesthetic)

## Why

The current `/` page is still a default starter layout and does not communicate the product's value or design quality. We need a focused marketing landing page that quickly explains the app, showcases architecture credibility, and drives users to the dashboard.

## What

Refactor `src/app/page.tsx` into a fully responsive, section-based landing page with a modern developer-tool aesthetic, built with Tailwind utilities, `lucide-react` icons, and subtle motion styling compatible with the `tailwind-animations.com` plugin setup.

The page must include exactly these sections in order:
- Hero (pegboard background + headline + CTA pair)
- By the Numbers (4 compact stat cards)
- Motivation (callout/split explanatory section)
- Tech Stack (responsive architecture card grid)
- Workflow (6-step spec-driven pipeline)
- Footer CTA (final conversion card with links)

## Constraints

### Must
- Use `lucide-react` for all icons across the landing page.
- Install and configure required dependencies for this feature: `lucide-react` and the `tailwind-animations.com` Tailwind plugin.
- Keep implementation on the `/` route (`src/app/page.tsx`) while preserving Next.js App Router conventions.
- Create separated, landing-scoped components under `src/app/_components/` (mirroring the dashboard organizational style) instead of implementing all UI inline in `src/app/page.tsx`.
- Use Tailwind heavily for visual style:
  - subtle borders (`border-border/50` or `border-slate-200`)
  - no rounded corners (match the sharp-edged treatment used in `src/app/dashboard/page.tsx`)
  - subtle depth (`shadow-sm`/`shadow-inner`)
  - clean, high-contrast typography with muted supporting text (`text-muted-foreground`)
- Use structured layout patterns (cards, grids, centered containers), not long prose blocks.
- Implement Hero pegboard dot-pattern background (radial-gradient or SVG pattern) to visually align with `/dashboard`.
- Include primary and secondary CTA buttons in Hero.
- Build "By the Numbers" as 4 horizontal cards (mobile responsive stacking allowed).
- Build Tech Stack as responsive grid: 1 col mobile, 2 col tablet, 4 col desktop.
- Build Workflow as horizontal pipeline with visual connectors and circular numbered nodes (1-6), with vertical mobile fallback.
- Include Footer CTA card with `Open Dashboard` button and links for GitHub + LinkedIn.
- Keep copy aligned to provided text where explicitly specified.
- Add full Tailwind class support for both light and dark themes while keeping light mode as the default visual baseline.
- Ensure accessibility basics: semantic headings, sufficient contrast, and descriptive link/button labels.

### Must Not
- Do not add new dependencies for icons or animation libraries beyond what is already available (`lucide-react`, existing Tailwind/plugin setup).
- Do not modify dashboard route behavior or unrelated business logic files.
- Do not introduce client-side state/effects unless needed for purely presentational behavior.
- Do not build all landing page sections directly inside a single `src/app/page.tsx` component.
- Do not leave placeholder starter content from default Next.js template.

### Out of Scope
- Authentication changes or dashboard feature work.
- CMS/content management for marketing copy.
- A/B testing, analytics instrumentation, or conversion tracking.
- New API routes/server actions for the landing page.

## Current State

The homepage currently renders the default Next.js starter experience and does not reflect product branding or structure.

- Existing landing route: `src/app/page.tsx`
- Global styling context: `src/app/globals.css`
- Design reference alignment target: `src/app/dashboard/page.tsx` (pegboard language + app visual coherence)
- No dedicated landing page section components currently exist.
- Dashboard uses route-scoped `_components` organization as the structural reference pattern.

## Tasks

### T1: Install and Configure Feature Dependencies
**What:** Add `lucide-react` and integrate the `tailwind-animations.com` plugin in the Tailwind setup so animation utility classes are available for landing page polish.
**Files:** `package.json`, Tailwind config file(s)
**Verify:** Dependency install succeeds and Tailwind animation classes compile without config errors.

### T2: Replace Starter Layout with Sectioned Marketing Shell
**What:** Rewrite `src/app/page.tsx` into a lightweight composition root that imports section components from `src/app/_components/`, uses a centered marketing container, and enforces square-corner styling aligned with `/dashboard`.
**Files:** `src/app/page.tsx`, `src/app/_components/*`
**Verify:** Manual check confirms the default Next.js starter content is removed, all six sections render in order, and `src/app/page.tsx` primarily composes extracted components.

### T3: Build Hero with Pegboard Background and Dual CTAs
**What:** Implement Hero section with pegboard/dot-pattern background, top badge (`Built with Spec-Driven Development` + sparkle icon), large headline (`From Chaos to Clarity in One Click.`), concise muted subheadline, and primary/secondary CTA buttons.
**Files:** `src/app/_components/HeroSection.tsx`
**Verify:** Manual check confirms centered Hero composition, pegboard background visibility, clear CTA hierarchy, and responsive typography behavior.

### T4: Add By-the-Numbers and Motivation Sections
**What:** Add a 4-card "By the Numbers" row (icon + number + label) using the specified values, then implement the Motivation section as a wide callout or split layout with subtle background tone and `BrainCircuit` or `ZapOff` iconography.
**Files:** `src/app/_components/ByTheNumbersSection.tsx`, `src/app/_components/MotivationSection.tsx`
**Verify:** Manual check confirms 4 stats are visible and the Motivation copy/title matches spec text.

### T5: Implement Tech Stack Architecture Grid
**What:** Build uniform Tech Stack cards for Next.js, SQLite, LLM + Structured Outputs, and Zod with centered icon badges, concise descriptions (max 2 lines), subtle hover lift/shadow transitions, and responsive 1/2/4-column behavior.
**Files:** `src/app/_components/TechStackSection.tsx`
**Verify:** Manual check confirms exact 4 cards, responsive column transitions, and hover interactions.

### T6: Implement Workflow Pipeline (Spec-Driven Development)
**What:** Create 6-step pipeline (Plan, Generate Spec, Review, Implement, Validate, Commit) with connected nodes, circular numbered badges, short bold titles, and muted one-sentence descriptions; horizontal on larger screens and vertical fallback on mobile.
**Files:** `src/app/_components/WorkflowSection.tsx`
**Verify:** Manual check confirms visible step connectors, correct step order 1-6, and clean mobile stacking.

### T7: Add Footer CTA Conversion Block, Theme Variants, and Final Polish
**What:** Add final centered CTA container with `Open Dashboard` button and simple GitHub/LinkedIn text links; apply final polish for borders, spacing, shadow depth, and typographic hierarchy; include light and dark Tailwind variants across all sections while keeping light mode as default presentation.
**Files:** `src/app/_components/FooterCtaSection.tsx`, `src/app/page.tsx`, `src/app/_components/*`
**Verify:** Manual check confirms footer CTA appears distinct, links are accessible, dark-theme classes are present across sections, and overall page feels coherent with dashboard aesthetic.

## Validation

- `pnpm lint`
- `pnpm test`
- Manual browser validation on `/`:
  - Landing route composes section components from `src/app/_components/` rather than one large inline page component.
  - Dependencies are installed and animation plugin utilities are available in Tailwind output.
  - Hero shows pegboard background, badge, headline, subheadline, and two CTAs.
  - "By the Numbers" displays 4 cards with correct metrics.
  - Motivation section displays exact title and body copy in highlighted container.
  - Tech Stack renders 4 uniform cards with lucide icons and responsive columns.
  - Workflow renders 6 connected steps and stacks correctly on mobile.
  - Footer CTA shows `Open Dashboard` plus GitHub/LinkedIn links.
  - Visual style uses subtle borders, no rounded corners, soft shadows, and clean typography throughout.
  - Dark theme classes exist for all key sections while light mode remains the default appearance.
