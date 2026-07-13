# GRIND

A study-tracking app inspired by YPT/Yeolpumta's feature set — subject timer,
Pomodoro mode, daily planner, calendar, study group leaderboard, and stats —
built from scratch with **no subscriptions or paywalls**. Runs on **iOS,
Android, and web** from one codebase (Expo + React Native), with all data
stored locally on the device (no backend/server, no account needed).

## Features

- ⏱️ **Timer** — pick a subject, start/stop a stopwatch. **Keeps counting accurately
  even if she switches to another app or locks her phone** — it's timestamp-based,
  not tick-based, so it recalculates the correct elapsed time the moment she
  comes back, instead of losing time while backgrounded.
- 🍅 **Pomodoro mode** — toggle from Stopwatch to Pomodoro on the same screen.
  Default 25 min focus / 5 min break, both adjustable in the Subjects tab.
  Auto-logs a session and switches phase when a round finishes.
- 📝 **Planner** — quick to-do list for today
- 🗓️ **Calendar** — full month view; tap any day to add/view tasks for that
  specific date (not just today), with small dots showing which days have
  tasks or study activity
- 👥 **Group** — add friends locally and log their study time to compare on a leaderboard
  *(note: since there's no server, "friends" are just profiles you add and update
  yourself on this device — it won't sync live between two different phones.
  See "Optional: adding a real backend" below if you want that later.)*
- 📊 **Stats** — 7-day bar chart + time-per-subject breakdown + pomodoro count
- 🎯 **Subjects** — add/remove subjects, set display name, adjust Pomodoro lengths
- 🌸 **One-time welcome screen** — asks her name once on first open, then never
  shows again; everything after that saves automatically in the background —
  no repeated logins, nothing to remember to save
- 🌸💙 **Pink/blue "sky" aesthetic** — soft gradient background, stars, and
  floating flower accents across every screen
- No ads, no subscriptions, no in-app purchases

## Project structure

```
study-app/
├── App.js                     # Navigation + onboarding gate
├── app.json                   # Expo app config (name, icon, bundle id)
├── package.json
├── babel.config.js
└── src/
    ├── theme.js                # Shared colors/palette
    ├── context/
    │   └── StudyContext.js    # Global state + AsyncStorage persistence
    ├── screens/
    │   ├── WelcomeScreen.js   # One-time setup screen
    │   ├── HomeScreen.js      # Timer (stopwatch + Pomodoro)
    │   ├── PlannerScreen.js   # Today's to-do list
    │   ├── CalendarScreen.js  # Month view + per-day tasks
    │   ├── GroupsScreen.js    # Leaderboard
    │   ├── StatsScreen.js     # Charts
    │   └── SubjectsScreen.js  # Subject/profile/Pomodoro settings
    ├── components/
    │   ├── SkyBackground.js  # Pink/blue gradient + stars + flowers backdrop
    │   └── SubjectPicker.js
    └── utils/
        └── storage.js         # AsyncStorage read/write helpers
```

## A note on the background-safe timer

Phones do eventually fully suspend an app's code if it sits in the background
for a very long time (this is normal OS battery-saving behavior, not a bug).
This timer is built to handle that gracefully: it stores the real clock time
it started at, and recalculates elapsed time from that real timestamp the
instant the app becomes active again — so even after a long time away, the
number shown is always correct. What it can't do is show a live-updating
number while she's not looking at the screen at all (no app can, without a
persistent background service) — but nothing is lost, and the timer keeps
running logically the whole time.


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
