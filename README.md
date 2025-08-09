# YouTube Tag Genie

Enter a YouTube **title** → get **comma-separated tags** tuned to *recent demand* using YouTube Suggest and (optionally) Data API v3.

> **Footer:** Displays “Powered by Foxside”.

## Run locally (optional)
```bash
pnpm i   # or npm i / yarn
cp .env.example .env.local   # optional; add YT_API_KEY=...
pnpm dev
```
Open http://localhost:3000

## Deploy
- Push this folder to GitHub.
- In Vercel → New Project → Import repo → (optional) add `YT_API_KEY` in Project Settings → Deploy.

## Notes
- Uses `/api/suggest` (Google suggest for YouTube) and optional `/api/videos` (YouTube Data API) to mine recent tags/titles.
