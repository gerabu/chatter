# Migrate Route from /dashboard to /app

## Why

The current `/dashboard` route naming does not align with the application's branding. Renaming to `/app` provides a cleaner, more modern URL structure that matches the product name and improves the overall user experience.

## What

Rename the protected route from `/dashboard` to `/app`, updating all references in sign-in/sign-up flows, navigation links, proxy configuration, and documentation.

## Constraints

### Must
- Update all `/dashboard` references to `/app` in source code files
- Rename the `src/app/dashboard/` directory to `src/app/app/`
- Update proxy matcher configuration
- Update auth callback URLs in sign-in/sign-up components
- Update navigation links in HeroSection and FooterCtaSection
- Keep all existing layout and logic intact

### Must Not
- Modify any business logic or functionality
- Change the visual appearance or layout
- Add new features or dependencies
- Update historical specs in `.ai/specs/`

### Out of Scope
- Changes to landing page content (only update navigation links)
- Database schema modifications
- Authentication logic changes

## Current State

- Dashboard route: `src/app/dashboard/page.tsx`
- Dashboard components: `src/app/dashboard/_components/`
- Sign-in pages: `src/app/signin/`, `src/app/auth/signin/`
- Sign-up pages: `src/app/signup/`, `src/app/auth/signup/`
- Navigation: `src/app/_components/HeroSection.tsx`, `src/app/_components/FooterCtaSection.tsx`
- Proxy: `src/proxy.ts`
- Relevant docs: `src/docs/github-auth-setup.md`, `src/docs/google-auth-setup.md`

## Tasks

### T1: Rename dashboard directory
**What:** Rename `src/app/dashboard/` to `src/app/app/` preserving all contents including page.tsx and _components/
**Files:** `src/app/dashboard/` → `src/app/app/`
**Verify:** `ls src/app/` shows `app/` directory instead of `dashboard/`

### T2: Update proxy configuration
**What:** Update the matcher in proxy.ts from `/dashboard/:path*` to `/app/:path*`
**Files:** `src/proxy.ts`
**Verify:** TypeScript compiles without errors

### T3: Update auth sign-in components
**What:** Update callbackUrl and redirect from "/dashboard" to "/app" in all sign-in components
**Files:** `src/app/auth/signin/page.tsx`, `src/app/auth/signin/_components/SigninPanel.tsx`, `src/app/signin/_components/SigninPanel.tsx`
**Verify:** TypeScript compiles without errors

### T4: Update auth sign-up components
**What:** Update callbackUrl and redirect from "/dashboard" to "/app" in all sign-up components
**Files:** `src/app/auth/signup/page.tsx`, `src/app/auth/signup/_components/SignupPanel.tsx`, `src/app/signup/_components/SignupPanel.tsx`
**Verify:** TypeScript compiles without errors

### T5: Update navigation links
**What:** Update href from "/dashboard" to "/app" in HeroSection and FooterCtaSection
**Files:** `src/app/_components/HeroSection.tsx`, `src/app/_components/FooterCtaSection.tsx`
**Verify:** Links point to /app in rendered HTML

### T6: Update setup documentation
**What:** Update /dashboard references to /app in OAuth setup guides
**Files:** `src/docs/github-auth-setup.md`, `src/docs/google-auth-setup.md`
**Verify:** Documentation reflects new route

## Validation

- Run `pnpm tsc --noEmit` to verify TypeScript compilation
- Verify `/app` route is accessible after authentication
- Test sign-in flow: sign in → should redirect to `/app`
- Test sign-up flow: sign up → should redirect to `/app`
- Manual check: clicking "Open Dashboard" button links to `/app`

## Done

- [x] T1: Rename src/app/dashboard/ to src/app/app/
- [x] T2: Update proxy.ts matcher
- [x] T3: Update sign-in components
- [x] T4: Update sign-up components
- [x] T5: Update navigation links
- [x] T6: Update setup documentation
- [x] TypeScript compilation passes
