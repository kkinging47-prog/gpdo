# Global Passion Development Organization (GPDO)

Official website and content management system for Global Passion Development Organization.

## Upgrade status

Steps 1–11 have been implemented on the `nextjs-migration` preview branch:

1. Next.js migration
2. Supabase database and storage
3. Secure admin authentication
4. Media & Gallery Manager
5. Homepage Slideshow Manager
6. Events Manager
7. Programs & Projects Manager
8. Articles & News Manager
9. Daily Tips Manager
10. Site Settings & User Management
11. Security, responsive-layout and configuration audit

### Step 11 hardening

- Latest Vercel preview build passes successfully.
- Supabase security advisor reports no current security findings.
- All CMS tables have Row Level Security enabled.
- Public read policies are scoped to anonymous visitors; authenticated staff use staff policies.
- Future-dated daily tips remain inaccessible until their display date.
- User management is administrator-only and the database protects the final active administrator from removal or demotion.
- Auth callback redirects are restricted to `/admin` destinations.
- Admin and auth routes send `X-Robots-Tag: noindex, nofollow, noarchive`.
- Standard response security headers are configured.
- Contact form WhatsApp destination is driven by Site Settings rather than a hard-coded number.
- Responsive breakpoints cover public navigation, content grids, forms and admin layouts.
- No Supabase service-role or secret key is stored in the repository.

One manual end-to-end magic-link login test remains dependent on adding the preview callback URL in Supabase Authentication URL Configuration.

Production `main` remains unchanged until final Step 12 deployment.
