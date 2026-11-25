# CommonGroundUI

Frontend for **CommonGround**, a social platform with groups (including
anonymous posting), friends, direct messages, notifications and saved posts. Next.js 16, React 19, Clerk, Supabase Storage.

The API lives in the separate `CGserver` repo. The browser talks only to
this app's `/api/proxy/*` route, which forwards to `BACKEND_URL`.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```

Both apps must use the **same Clerk application**. To run the backend
locally too, start CGserver on another port (`npm run dev -- -p 4000`) and
set `BACKEND_URL=http://localhost:4000` and
`NEXT_PUBLIC_API_WEBSOCKET=ws://localhost:4000/api/ws`.

## Notes

- New accounts go through `/auth/onboarding`, which creates the profile in
  the database.
- Chat messages are sent over REST; the websocket pushes them live and the
  chat also polls every few seconds as a fallback.
