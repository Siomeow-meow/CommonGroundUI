import { WEBSOCKET_URL } from "@/app/lib/backend";

/**
 * Live chat socket. It only delivers incoming messages; sending goes through
 * the REST API (see useMessages), so a message is saved even if the socket
 * is down. The socket authenticates with the Clerk session token.
 */
export type SocketEvent =
  | { type: "authenticated" }
  | { type: "error"; message: string }
  | { type: "message"; message: { id: number; conversationId: number; senderId: string } & Record<string, unknown> };

type TokenProvider = () => Promise<string | null>;

let socket: WebSocket | null = null;
let getToken: TokenProvider | null = null;
let reconnectDelay = 1000;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const statusListeners = new Set<(status: number) => void>();
let messageListeners: ((data: SocketEvent) => void)[] = [];

function notify() {
  statusListeners.forEach((l) => l(socket?.readyState ?? WebSocket.CLOSED));
}

function connect() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }
  if (!getToken) return;

  const ws = new WebSocket(WEBSOCKET_URL);
  socket = ws;

  ws.addEventListener("open", async () => {
    const token = await getToken?.().catch(() => null);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "authenticate", token }));
    }
    reconnectDelay = 1000;
    notify();
  });

  ws.addEventListener("message", (event) => {
    let data: SocketEvent;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    messageListeners.forEach((listener) => listener(data));
  });

  ws.addEventListener("close", () => {
    notify();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  });

  ws.addEventListener("error", notify);
}

export function connectChat(tokenProvider: TokenProvider) {
  getToken = tokenProvider;
  connect();
}

/** Subscribes to socket open/close changes. Returns an unsubscribe function. */
export function onConnectionStatusChange(listener: (status: number) => void) {
  statusListeners.add(listener);
  listener(socket?.readyState ?? WebSocket.CLOSED);
  return () => {
    statusListeners.delete(listener);
  };
}

export function onMessage(listener: (data: SocketEvent) => void) {
  messageListeners.push(listener);
  return () => {
    messageListeners = messageListeners.filter((l) => l !== listener);
  };
}
