# Quran Foundation API Usage in Wird

Wird integrates **four Content APIs**, **OAuth 2.0 with PKCE**, and **three User API endpoint groups** from the Quran Foundation platform. Every API call has a concrete user-facing purpose, not a token integration.

**Client IDs, base URLs, and environment variables:** see [../.env.example](../.env.example)
**Runtime config:** [../lib/config.ts](../lib/config.ts)

---

## Environment Targeting

| Environment | Content API | User API | OAuth |
|---|---|---|---|
| Pre-live (default for hackathon judging) | `https://api.qurancdn.com/api/qdc` | `https://apis-prelive.quran.foundation/auth/v1` | `https://prelive-oauth2.quran.foundation` |
| Production | `https://api.qurancdn.com/api/qdc` | `https://apis.quran.foundation/auth/v1` | `https://oauth2.quran.foundation` |

Toggle via `EXPO_PUBLIC_QF_USE_PRODUCTION=true`.

---

## 1. Content APIs

**Client:** [services/quranApi.ts](../services/quranApi.ts) (axios instance `quranApi`)

### 1.1 Verses API

| Endpoint | Wird feature | Source function |
|---|---|---|
| `GET /verses/by_key/{verseKey}` | Single-ayah lookup with translation + tafsir for reflection screen | `fetchVerseByKey` |
| `GET /verses/by_chapter/{chapterNumber}` | Paginated verse range for the daily wird reader | `fetchVerseRange` |

Both calls request `words=true` with `text_uthmani` to render per-word Arabic at `app/reader.tsx`, plus the configured translation (`EXPO_PUBLIC_DEFAULT_TRANSLATION_ID=131` — Mustafa Khattab).

### 1.2 Chapters API

| Endpoint | Wird feature | Source function |
|---|---|---|
| `GET /chapters` | Surah picker and adaptive planner's knowledge of verse counts | `fetchChapters` |
| `GET /chapters/{id}` | Chapter header in reader | `fetchChapterById` |

### 1.3 Tafsir API

| Endpoint | Wird feature | Source function |
|---|---|---|
| `GET /tafsirs/{tafsirId}/by_ayah/{verseKey}` | Inline tafsir panel + grounding source for AI reflection prompts | `fetchTafsirByAyah` |

Default tafsir: `EXPO_PUBLIC_DEFAULT_TAFSIR_ID=169` (Ibn Kathir). HTML is stripped server-side and rendered as plain text to prevent hallucinated scripture generation — **the AI only summarizes verified tafsir, never synthesizes its own**.

### 1.4 Audio API

| Endpoint | Wird feature | Source function |
|---|---|---|
| `GET /chapter_recitations/{reciterId}/{chapterNumber}` | Full-surah audio with per-ayah timestamps for the reader's follow-along player | `fetchChapterAudio` |
| `GET /recitations/{reciterId}/by_ayah/{verseKey}` | Single-ayah audio for tap-to-play in reflection | `fetchVerseAudioUrl` |

Default reciter: `EXPO_PUBLIC_DEFAULT_RECITER_ID=7` (Mishari Al-Afasy).

---

## 2. OAuth 2.0 (Authorization Code + PKCE)

**Client code:** [lib/quranAuth.ts](../lib/quranAuth.ts)
**Token-exchange edge function:** [supabase/functions/quran-auth-exchange/index.ts](../supabase/functions/quran-auth-exchange/index.ts)
**Tests:** [lib/quranAuth.test.ts](../lib/quranAuth.test.ts)

### Flow

1. Client generates PKCE challenge and opens `expo-auth-session` browser tab to `{OAUTH_BASE_URL}/oauth2/authorize` with `response_type=code`, `client_id`, `redirect_uri=wird://auth/callback`, and the challenge.
2. User approves on the Quran Foundation consent screen.
3. Redirect returns an authorization code to the app.
4. App POSTs the code + verifier to the **Supabase edge function** (`quran-auth-exchange`), which performs the server-side token exchange. This keeps the client secret off-device.
5. Edge function returns the access token + refresh token.
6. Tokens are stored in `expo-secure-store` via [services/authStorage.ts](../services/authStorage.ts).

### Why an edge function

Direct client-side token exchange requires the client secret on the device, which is unsafe. The Supabase edge function acts as a thin confidential-client proxy.

---

## 3. User APIs (OAuth-authenticated)

**Client:** [services/quranUserApi.ts](../services/quranUserApi.ts)
**Request headers:** `x-auth-token: {access_token}`, `x-client-id: {client_id}`, optional `x-timezone: {IANA zone}`.

### 3.1 Bookmarks API

| Endpoint | Wird feature | Source function |
|---|---|---|
| `POST /bookmarks` | Save verse from reader's long-press menu | `createQuranBookmark` |
| `GET /bookmarks?type=ayah&key={chapter}` | List bookmarks in the Saved tab | `removeQuranBookmarkByVerseKey` (read-before-delete) |
| `DELETE /bookmarks/{id}` | Unbookmark from Saved tab | `removeQuranBookmarkByVerseKey` |

Bookmarks are stored with `type=ayah`, `key={chapterNumber}`, `verseNumber`, and `mushaf=4`.

### 3.2 Activity & Goals API

| Endpoint | Wird feature | Source function |
|---|---|---|
| `POST /reading-sessions` | Record that user finished today's wird | `syncQuranReadingSession` |
| `POST /activity-days` | Log total reading time + verse ranges covered, with IANA timezone for correct day-bucketing | `syncQuranActivityDay` |

Every completed wird session emits both records — so the user's progress is visible across any Quran Foundation-connected surface, not just Wird. This is what turns Wird from a silo into a companion in the Quran Foundation ecosystem.

---

## 4. Sync Strategy

[services/syncService.ts](../services/syncService.ts) orchestrates:

1. Local-first writes (Supabase Postgres + AsyncStorage) — so the app works offline.
2. Best-effort remote sync to Quran Foundation User APIs when the user is authenticated and online.
3. Silent failure with Sentry logging (not user-facing) — missed sync never interrupts the user's reading flow.

This means the **mercy philosophy** extends to the network: a failed sync doesn't break the user's streak-free experience.

---

## 5. Feature → API Map (Judge Quick-Reference)

| User action | APIs touched |
|---|---|
| Open Home — see today's AI plan | Chapters (metadata for plan math) |
| Open Reader → tap play | Verses, Audio (chapter recitation), Tafsir |
| Long-press ayah → bookmark | Bookmarks (POST) |
| Complete session → reflection | Tafsir (grounding), Reading Sessions (POST), Activity Days (POST) |
| Open Progress | Activity Days (read via sync), local aggregation |
| Sign in with Quran.com | OAuth 2.0 PKCE + Supabase edge exchange |
| Open Saved tab | Bookmarks (GET) |

---

## 6. Count Summary

- **Content APIs integrated:** 4 (Verses, Chapters, Tafsir, Audio) — requirement was ≥1
- **User APIs integrated:** 2 groups, 5 endpoints (Bookmarks ×3, Activity & Goals ×2) — requirement was ≥1
- **OAuth:** Implemented with PKCE + confidential-client edge proxy
- **Total distinct endpoints called:** 11
