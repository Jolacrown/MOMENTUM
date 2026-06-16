# Momentum — Web Application

## Key Conventions
- All headings/display text: add `fontFamily: 'Sora'` to CSS (next to `fontWeight`).
- Body text uses `PlusJakartaSans` (applied globally via CSS).
- Screen bg: `#0F0F10`, card bg: `#1A1A1C`, elevated: `#242426`.
- Text colors: primary `#F5F5F0`, secondary `#A0A09A`, muted `#5A5A55`.
- Borders: `rgba(255,255,255,0.06)` for cards; theme borders `#2C2C2E` / `#3A3A3C`.
- Design tokens in `src/styles/tokens.ts`.
- Next.js App Router — routes under `app/` using `page.tsx` convention.
- All state managed with Zustand stores in `src/stores/`.
- Supabase client in `src/lib/supabase-web.ts`.
