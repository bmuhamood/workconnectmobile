# WorkConnect Mobile (Expo / React Native)

Uses the **exact same Supabase backend** as the web app — same tables, same
RLS, same `worker_profiles`/`employer_profiles`/`contracts`/`messages` etc.
Anything a worker or employer does here shows up on the web app instantly,
and vice versa (including chat, via Supabase Realtime).

## Setup

```bash
cd mobile
npm install
npx expo start
```

> **Note on versions**: `package.json` is already pinned to the exact
> versions Expo's own compatibility checker (`expo install --fix`)
> reported for SDK 56, and `.npmrc` sets `legacy-peer-deps=true`. That's
> there because `expo-router` 6.2+ bundles `@expo/ui`, which pulls in
> web-only packages (Radix UI, `vaul`) with a peer dependency npm's
> resolver can't cleanly satisfy — irrelevant for a mobile-only app, but
> npm still errors on it without that flag. If a future `npm install`
> ever hits an `ERESOLVE` error again, that's almost certainly the same
> family of issue; `legacy-peer-deps=true` is the fix.

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR
code with the **Expo Go** app on your phone for the fastest way to test on
a real device.

Supabase credentials are already filled in in `app.json` under
`expo.extra` (same project as the web app — the URL and publishable key,
same ones already in `frontend/.env.local.example`). Nothing else to
configure to get running.

## Push Notifications (Firebase) — currently paused

Firebase push notifications were removed from this build (temporarily) so
the app can run in **plain Expo Go** for fast, build-free testing — native
modules like `@react-native-firebase` cannot run in Expo Go at all, and
getting a real dev-client build working hit a long chain of native build
issues (version mismatches, an Android manifest merger conflict between
`expo-notifications` and `@react-native-firebase/messaging`). Rather than
keep blocking all testing on that, Firebase is out for now.

**What still works exactly as before**: everything else — auth, jobs,
workers, messages (including Realtime chat), contracts, admin, all of it.
None of that depends on Firebase.

**What's paused**: `lib/pushNotifications.ts` is reduced to no-ops.
`hooks/useAuth.tsx` still calls into it on login/logout, but those calls
now do nothing — no crash, no functionality, just quietly skipped.

**To bring Firebase back later**: see `supabase/FIREBASE_SETUP.md` for the
full setup, and `git log` for the previous working versions of
`lib/pushNotifications.ts`, `index.js`, and `app.json`'s plugin config to
restore from. That work wasn't wasted — it's just not blocking you from
testing the app today.

## Design

Colors now match the web app's actual dominant palette (checked by
counting usage across the real codebase, not guessed): primary is
**blue-600 → purple-600** — that gradient is the web app's single most
common CTA button style (31 occurrences) — with emerald reserved for
money/success context, matching how the web app actually uses it. Primary
buttons render as a real gradient via `expo-linear-gradient`.

## What's included

- **Auth**: login, register (worker/employer), forgot password
- **Jobs**: browse, search, view detail, apply, save/unsave, dedicated
  Saved Jobs list, My Applications tracker
- **Workers**: browse, search, view detail, message
- **Messages**: conversation list with unread counts, live chat via Realtime
- **Contracts**: list, detail, sign
- **Documents**: upload (camera roll → Supabase Storage), status tracking,
  delete before verification
- **Payments**: payment history, native payslip view (in-app, not a PDF —
  see note below)
- **Employer**: Post a Job, My Job Postings (publish/close), Applicants
  management (status pipeline, message applicant), Invoices (real
  Flutterwave payment via the same `initiate-payment` Edge Function the
  web app uses, opened in an in-app browser)
- **Admin**: dashboard (live stats), Users (search, suspend/unblock),
  Jobs (publish/close/cancel), Verifications (approve/reject documents,
  opens the doc in the device browser), Reports (resolve/dismiss)

Block/blacklist enforcement at login matches the web app.

### Note on payslips/PDFs

The web app's payslip/invoice screens use the browser's native
print-to-PDF. There's no direct mobile equivalent to "print to PDF" without
a native module, so payslips render as an in-app native screen instead
(same data, not literally a downloadable PDF file). If you want a real
downloadable PDF on mobile, that needs either a PDF-generation library
(e.g. `react-native-html-to-pdf`) or calling out to a server-side Edge
Function that returns a PDF — a reasonable next step, just not in this pass.

## What's not in this pass

Everything from the previous pass is now built. Two small, honest gaps
remain:

- **Payslip/invoice PDFs**: mobile shows the same data as a native screen
  rather than a literal downloadable PDF file (no direct "print to PDF"
  equivalent on mobile without a native module — see note above).
- **Push notifications**: `notification_preferences` toggles exist and
  save correctly, but nothing actually sends a push yet — that needs Expo
  Push Notifications set up (device token registration + a trigger,
  probably from the `on notifications insert` you already have server-side
  via the `notifications` table).

## Project structure

```
mobile/
  app/                    expo-router file-based routes
    _layout.tsx            root layout (AuthProvider)
    index.tsx               splash/redirect
    (auth)/                 login, register, forgot-password
    (tabs)/                 Home, Jobs, Workers, Messages, Profile
    jobs/[id].tsx           job detail
    workers/[id].tsx        worker detail
    messages/[id].tsx       chat thread
    contracts/              list + detail
  hooks/                   useAuth, useJobs, useWorkers, useMessages
  lib/supabase.ts          Supabase client (AsyncStorage-backed sessions)
  components/ui.tsx        shared Button/Card/Input/Badge/Screen primitives
  constants/theme.ts       colors, spacing, formatUGX/formatDate
```

## Building for real devices (EAS)

Once you're happy testing in Expo Go:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # or ios, or both
```

This is Expo's cloud build service — no local Xcode/Android Studio setup
needed. See https://docs.expo.dev/build/introduction/ for the full guide.
