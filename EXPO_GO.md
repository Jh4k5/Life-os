# Run Life OS on your Android phone (Expo Go)

The app is configured for **Expo SDK 54** and verified to bundle for Android in
dev mode. Follow these once on your computer.

## Prerequisites (one time)
- **Node.js 20+** on your computer.
- **Expo Go** app on your Android phone → install from the Play Store.
- Phone and computer on the **same Wi-Fi** (LAN mode). If your network blocks
  device-to-device traffic, use `--tunnel` (see below).

## Steps
```bash
# 1) get the code
git clone https://github.com/Jh4k5/Life-os.git
cd Life-os
git checkout claude/read-files-build-app-rw8fqi

# 2) env (the real, public Supabase values are already in .env.example)
cp .env.example .env

# 3) install deps
npm install

# 4) (optional but recommended) make sure versions match SDK 54
npx expo install --check      # auto-fixes any drift; run once, has network

# 5) start the dev server
npx expo start
```

Then on the phone: open **Expo Go → Scan QR code** and scan the QR in your
terminal. The app loads over the air.

- If the QR/LAN doesn't connect (corporate/campus Wi-Fi), run:
  ```bash
  npx expo start --tunnel
  ```
- To force a clean cache: `npx expo start -c`.

## What works in Expo Go
Everything **except live microphone voice**: Home AI (type your day), the full
Review Layer → Apply → real Supabase persistence, all sections (Areas, Habits,
Tasks, Journal, Study + Flashcards, Learning, Schedule, Health/Nutrition,
Exercise, Memory), global Search, Dashboard, 7 languages + RTL, dark/light.
Meal-photo macros and OCR run through the deployed Edge Functions.

## Voice needs a development build (not Expo Go)
`expo-speech-recognition` is a third-party **native** module that Expo Go does
not bundle, so the app safely disables the mic in Expo Go (text input still
works). To get real on-device voice, make a dev build once:
```bash
npx expo install expo-dev-client
npx eas build --profile development --platform android   # needs a free Expo account
```
Install that APK instead of Expo Go and voice works end to end. Everything else
is identical.

## Notes
- Data persistence, auth, AI parse, and nutrition all talk to the live Supabase
  backend (already deployed). Sign up in the app → your data is saved and syncs.
- `.env` is git-ignored; only `.env.example` (public values) is committed.
