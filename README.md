# Study Together

A study-tracking app inspired by YPT/Yeolpumta's feature set — subject timer,
daily planner, study group leaderboard, and stats — built from scratch with
**no subscriptions or paywalls**. Runs on **iOS, Android, and web** from one
codebase (Expo + React Native), with all data stored locally on the device
(no backend/server, no account needed).

## Features

- ⏱️ **Timer** — pick a subject, start/stop a stopwatch, sessions are saved automatically
- 📝 **Planner** — simple daily to-do list
- 👥 **Group** — add friends locally and log their study time to compare on a leaderboard
  *(note: since there's no server, "friends" are just profiles you add and update
  yourself on this device — it won't sync live between two different phones.
  See "Optional: adding a real backend" below if you want that later.)*
- 📊 **Stats** — 7-day bar chart + time-per-subject breakdown
- 🎯 **Subjects** — add/remove subjects and set your display name
- No ads, no subscriptions, no in-app purchases

## Project structure

```
study-app/
├── App.js                     # Navigation + app entry point
├── app.json                   # Expo app config (name, icon, bundle id)
├── package.json
├── babel.config.js
└── src/
    ├── context/
    │   └── StudyContext.js    # Global state + AsyncStorage persistence
    ├── screens/
    │   ├── HomeScreen.js      # Timer
    │   ├── PlannerScreen.js   # To-do planner
    │   ├── GroupsScreen.js    # Leaderboard
    │   ├── StatsScreen.js     # Charts
    │   └── SubjectsScreen.js  # Subject/profile management
    ├── components/
    │   └── SubjectPicker.js
    └── utils/
        └── storage.js         # AsyncStorage read/write helpers
```

## 1. Run it on your computer first

You'll need [Node.js](https://nodejs.org) (18 or newer) installed.

```bash
cd study-app
npm install
npx expo start
```

This opens a QR code in your terminal/browser. From there:
- **Web**: press `w` in the terminal, or click "Run in web browser" — opens instantly in Chrome
- **Phone (fastest way to test)**: install the free **Expo Go** app from the
  App Store / Play Store on your sister's phone, then scan the QR code. The
  app loads directly, no build/publishing needed.

## 2. Put it on GitHub

1. Create a new repo on GitHub (click the **+** in the top right → **New repository**).
   Name it something like `study-together`, leave it empty (no README/license), click **Create repository**.
2. On your computer, inside the `study-app` folder:

```bash
git init
git add .
git commit -m "Initial commit: study together app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/study-together.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. GitHub will show you this
exact command on the empty repo's page too.

A `.gitignore` is included so `node_modules` won't be uploaded.

## 3. Get it onto your sister's phone permanently (no computer needed after setup)

Once it's working, easiest options, easiest first:

- **Expo Go link (free, instant, good for personal use)**: run `npx expo publish`
  or `eas update` (Expo's newer tool) so she can open it anytime through the
  Expo Go app without you needing to keep your computer running.
- **Real installable app (.apk / .ipa)**: use [EAS Build](https://docs.expo.dev/build/introduction/)
  (`npx eas build -p android` or `-p ios`), Expo's free tier covers occasional
  personal builds. This gives a real app icon on the home screen instead of
  opening through Expo Go.
- **Web version**: `npx expo export -p web` builds a static site you can host
  for free on GitHub Pages, Vercel, or Netlify — she can open it from any
  browser and even "Add to Home Screen."

## Optional: adding a real backend later

Right now group rankings only work on one device since there's no server. If
you want live syncing between your sister and her friends' phones later, the
cleanest low-effort option is [Supabase](https://supabase.com) (free tier) —
you'd swap the AsyncStorage calls in `src/context/StudyContext.js` for
Supabase database calls. Happy to help build that out if you want it.

## Notes

- This was built as an original app inspired by the general concept of study
  timer + planner + groups apps (a common category with several existing
  apps). It is **not** a copy of any specific company's code, assets, or
  design files — everything here was written from scratch.
- No payment/subscription code is included anywhere, by design.
