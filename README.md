# Global Passion Development Organization (GPDO)

Official website and content management system for Global Passion Development Organization.

## Upgrade status

Steps 1–11 are implemented on the `nextjs-migration` preview branch:

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

### Current backend

The CMS now uses the organisation-accessible Supabase project at `bykbwivujyodiakrrlks.supabase.co`.

The existing GPDO schema, RLS policies, authorization helpers, admin safeguards, seed gallery/slideshow/settings data and storage buckets were migrated to that project. Password-based administrator sign-in was verified successfully on the Vercel preview on 21 August 2026.

### Security and deployment notes

- All CMS tables use Row Level Security.
- Public read access is restricted to published/public content.
- Authenticated CMS writes require an active administrator or editor record.
- User management is administrator-only and the database protects the final active administrator from removal or demotion.
- Future-dated daily tips remain inaccessible until their display date.
- Auth callback redirects are restricted to `/admin` destinations.
- Admin and auth routes send `X-Robots-Tag: noindex, nofollow, noarchive`.
- Standard response security headers are configured.
- Contact form WhatsApp destination is driven by Site Settings.
- No Supabase service-role or secret key is stored in the repository.
- Password sign-in is the active admin login method. Magic-link sign-in is not exposed while SMTP and production redirect settings are not yet configured.
- The temporary Supabase diagnostic endpoint used during migration has been removed.

Production `main` remains unchanged until explicit approval for the final Step 12 merge and deployment.
