# GRIND

Study tracker built with Expo/React Native. Runs on iOS, Android, and web
from one codebase. No accounts, no subscriptions — everything is stored
locally on-device except the optional group leaderboard, which syncs through
a small Supabase table.

## Features

- Stopwatch and Pomodoro timers, subject-tagged
- Daily planner + full calendar view
- Sticky notes
- Study group leaderboard (real-time via Supabase)
- Stats: daily bar chart, per-subject breakdown, pomodoro count
- Local push notification / alarm when a pomodoro phase ends

## Structure

```
study-app/
├── App.js
├── app.json
├── package.json
└── src/
    ├── theme.js
    ├── context/StudyContext.js
    ├── screens/
    ├── components/
    └── utils/
```

## Setup

```bash
npm install
npx expo start
```

Press `w` for web, or scan the QR with Expo Go.

## Deploy

Web build goes to GitHub Pages:

```bash
npm run deploy
```

Native builds via EAS:

```bash
npx eas build -p android
npx eas build -p ios
```

## Group leaderboard backend

Uses Supabase. Table schema:

```sql
create table profiles (
  username text primary key,
  display_name text not null,
  total_seconds integer not null default 0,
  updated_at timestamp with time zone default now()
);
```

RLS policies allow public read/insert/update — fine for a small private
group, not meant for anything sensitive.
"" 
"Built with Expo and React Native." 
"" 
"Tested on Android, iOS (Expo Go), and web." 
"" 
"See package.json for the full dependency list." 
"" 
"## License" 
"Personal project, not licensed for redistribution." 
