# BrainArena

Free daily puzzle and word games platform. Wordle, Boggle, Sudoku, Typing — in EN/NL/DE/FR/ES with a global leaderboard.

## Local Development

```bash
npm install
npm run dev
```

Local dev URL: http://localhost:3001

## Hostinger Deployment

1. Go to Hostinger hPanel → Websites → Add Website.
2. Choose **Node.js Apps → Import Git Repository**.
3. Select the `brainarena` repository.
4. Set domain: `brainarena.fun`.
5. Add environment variables from `.env.local`:
   - `NEXT_PUBLIC_APP_URL=https://brainarena.fun`
   - `NEXT_PUBLIC_APP_NAME=BrainArena`
6. Set the start command: `npm run start` (Next.js default).
7. Click **Deploy**.

## Stack

- Next.js 16 (App Router) on React 19
- Tailwind CSS 4
- TypeScript

## Leaderboard storage

Scores live in `public/scores/{game}.json`. The API route at `app/api/leaderboard/route.ts` reads and appends to those files. Top 1000 entries kept per game. A future move to a database is recommended once traffic grows.
