# AGENTS.md - Frontend Guidelines (`restoview`)

## 1. Role & Stack
- **Role:** Universal Frontend PWA serving Customers, Waiters, Kitchen Staff, Delivery Drivers, and Restaurant/Platform Administrators.
- **Tech Stack:** SvelteKit 5 (Runes mode: `$state`, `$derived`, `$props`), TypeScript 5.8, Tailwind CSS v4, Flowbite.

## 2. Key Architectural Directives
1. **Never Make the Homepage Look Like a POS:**
   - The restaurant homepage (`/`) is an editorial brand showcase (Michelin aesthetic) with high-resolution food photography, culinary story, cuisine specialties, signature dishes, atmosphere gallery, and hours.
   - Ordering and reservations are seamlessly integrated via customizable **Resto Action Widgets** and clean drawer interactions.
2. **Strict Svelte 5 Runes:**
   - Do NOT use legacy Svelte 3/4 reactive syntax (`let x = 1; $: y = x * 2;`).
   - Use `$state()`, `$derived()`, `$props()`, and `$effect()`.
3. **Multi-Tenant Theming:**
   - Respect tenant branding reactive store (`$currentTenant`).
   - Support 3-way theme switching: `Light`, `Dark`, and `System Auto`.
4. **Custom HTML Sandboxing:**
   - User-supplied promotional HTML must be isolated in a sandboxed iframe with `sandbox="allow-scripts"` (without `allow-same-origin`) to prevent cross-tenant session hijacking.
5. **Quality Verification:**
   - Always run `npm run check` and `npm run test:unit -- --run` before marking any frontend change complete.
