// lib/pushNotifications.ts
//
// Firebase push delivery is paused for now — @react-native-firebase is a
// native module that can't run in plain Expo Go, and getting a real dev
// client build working hit a long, hard-to-diagnose chain of native build
// issues. This file is temporarily reduced to safe no-ops so the rest of
// the app (auth, jobs, workers, messages, contracts, admin — everything
// else) can be tested immediately in plain Expo Go via `npx expo start`,
// with zero build step.
//
// hooks/useAuth.tsx calls registerForPushNotifications/unregisterPushToken
// on login/logout — those calls are untouched; this file just makes them
// no-ops so nothing breaks. expo-notifications itself (used for local,
// on-device notification display) is untouched and still fully works in
// Expo Go, since it's a standard Expo SDK package.
//
// To bring real Firebase push back later: see supabase/FIREBASE_SETUP.md,
// and re-add @react-native-firebase/app + @react-native-firebase/messaging
// (git history has the previous working version of this file to restore
// from, plus the matching index.js background-handler setup and app.json
// plugin config).

export async function registerForPushNotifications(_userId: string): Promise<void> {
  // no-op — Firebase push is paused, see comment above
}

export async function unregisterPushToken(): Promise<void> {
  // no-op — Firebase push is paused, see comment above
}

export function subscribeToForegroundMessages(): () => void {
  return () => {};
}
