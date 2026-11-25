/**
 * Where the CGserver API lives. Set BACKEND_URL in .env.local (server side
 * only; the browser always goes through /api/proxy). The fallback is the
 * current production deployment.
 */
export const BACKEND_URL = (
  process.env.BACKEND_URL ?? "https://common-ground-sigma-seven.vercel.app"
).replace(/\/$/, "");

/** WebSocket URL for live chat, e.g. wss://your-backend.vercel.app/api/ws */
export const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_API_WEBSOCKET ??
  "wss://common-ground-sigma-seven.vercel.app/api/ws";
