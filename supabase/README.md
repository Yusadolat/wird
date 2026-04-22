## Supabase Setup

This app uses Supabase for four separate jobs:

1. Guest persistence through anonymous Supabase Auth plus Postgres tables with RLS
2. AI reflection generation through the `reflection` Edge Function
3. AI daily wird generation through the `wird-planner` Edge Function
4. Quran.com OAuth code exchange through the `quran-auth-exchange` Edge Function

### 1. Enable Guest Persistence

In the Supabase dashboard:

1. Enable `Anonymous Sign-Ins` in Auth providers
2. Run `supabase/schema.sql` in the SQL editor
3. Confirm the Expo app has:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_ENABLE_SUPABASE_SYNC=true`

Without anonymous auth enabled, the app will stay local-first and log a Supabase auth warning in development.

### 2. Deploy the Reflection Function

Set the function secret:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

Deploy the function without JWT verification because the current app invokes it before Quran.com auth is available:

```bash
supabase functions deploy reflection --no-verify-jwt
```

Serve it locally during development:

```bash
supabase functions serve reflection --no-verify-jwt --env-file ./supabase/.env.local
```

Optional local function env file:

```bash
OPENAI_API_KEY=your_openai_api_key
```

### 3. Deploy the Wird Planner Function

This function uses the same `OPENAI_API_KEY` secret as the reflection function.

Deploy it without JWT verification because the current app can invoke it before Quran.com auth is fully active:

```bash
supabase functions deploy wird-planner --no-verify-jwt
```

Serve it locally during development:

```bash
supabase functions serve wird-planner --no-verify-jwt --env-file ./supabase/.env.local
```

### 4. Deploy the Quran Auth Exchange Function

Set the Quran OAuth secrets in Supabase:

```bash
supabase secrets set \
  QF_PRELIVE_CLIENT_ID=your_prelive_client_id \
  QF_PRELIVE_CLIENT_SECRET=your_prelive_client_secret \
  QF_PRELIVE_OAUTH_BASE_URL=https://prelive-oauth2.quran.foundation \
  QF_PROD_CLIENT_ID=your_prod_client_id \
  QF_PROD_CLIENT_SECRET=your_prod_client_secret \
  QF_PROD_OAUTH_BASE_URL=https://oauth2.quran.foundation
```

Deploy the function without JWT verification because the app invokes it before Quran.com auth is established:

```bash
supabase functions deploy quran-auth-exchange --no-verify-jwt
```

The function supports both the initial `authorization_code` exchange and later `refresh_token` grants. Redeploy it whenever auth exchange code changes; otherwise the mobile app can store a refresh token but still fail User API calls once the access token expires.

Serve it locally during development:

```bash
supabase functions serve quran-auth-exchange --no-verify-jwt --env-file ./supabase/.env.local
```

Optional local function env file:

```bash
QF_PRELIVE_CLIENT_ID=your_prelive_client_id
QF_PRELIVE_CLIENT_SECRET=your_prelive_client_secret
QF_PRELIVE_OAUTH_BASE_URL=https://prelive-oauth2.quran.foundation
QF_PROD_CLIENT_ID=your_prod_client_id
QF_PROD_CLIENT_SECRET=your_prod_client_secret
QF_PROD_OAUTH_BASE_URL=https://oauth2.quran.foundation
```
