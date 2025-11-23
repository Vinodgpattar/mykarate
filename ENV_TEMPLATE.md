# Environment Variables Template

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Sentry Error Tracking
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## How to Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Important Notes

- The `service_role` key bypasses Row Level Security (RLS) - use it carefully!
- Never commit `.env.local` to version control
- The service role key is only needed for admin operations that require bypassing RLS

