# LearnTrack — Interview Prep Tracker

Track your interview prep across **8 learning pillars**, LeetCode, GitHub, weekly plans, notes, and improvement graphs.

## Features

- **8 Pillars**: DSA, CS Fundamentals, System Design (HLD/LLD/SD), Database Optimization, Concurrency, APIs (gRPC/REST/GraphQL), Resilience & Scale, STAR & Estimation
- **Topics & notes** per pillar with status and hours
- **LeetCode auto-sync**: solved count, submissions by difficulty, daily question
- **GitHub auto-sync**: contributions, stars, repos, activity score
- **Weekly plan** with goals per pillar
- **Agent import**: bulk paste structured text to auto-create topics/notes/goals
- **Composite score** (learning + LeetCode + GitHub)
- **Improvement graph** over time
- **Daily LeetCode notifications** (browser notifications)

## Mobile & PWA

- **Responsive layout** — bottom nav, slide-out menu, card views on small screens
- **Install as app** — open in Chrome/Safari → Share → **Add to Home Screen**
- On Android you may see an **Install** banner after visiting the site
- Works offline for cached pages (API calls need network)

## Quick start

```bash
cd learning-tracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

1. Go to **Settings** → add your LeetCode and GitHub usernames
2. Click **Refresh Score** on the dashboard
3. Use **Agent Import** to bulk-add topics, or **8 Pillars** to add manually
4. Enable notifications on the dashboard for daily LeetCode reminders

## Agent bulk format

Pipe format (one line per topic):

```
dsa|Binary Search|in_progress|2|notes here
api|GraphQL|done|3
```

Block format:

```
PILLAR: dsa
TOPIC: Binary Search
STATUS: in_progress
HOURS: 2
---
```

## Data

SQLite database stored in `./data/tracker.db` (local, private).
