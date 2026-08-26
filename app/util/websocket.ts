const api = process.env.NEXT_PUBLIC_API_WEBSOCKET;
let socket: WebSocket;
let reconnectDelay = 1000;
let listeners: ((status: number) => void)[] = [];
let messageListeners: ((data: any) => void)[] = [];

function connect(userId: string) {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  socket = new WebSocket(`wss://probable-guacamole-alpha.vercel.app/api/ws`);

  socket.addEventListener("open", () => {
    socket.send(
      JSON.stringify({
        type: "authenticate",
        userId,
      }),
    );
    reconnectDelay = 1000;
    notify();
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    messageListeners.forEach((listener) => {
      listener(data);
    });
  });

  socket.addEventListener("close", () => {
    setTimeout(() => connect(userId), reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    notify();
  });

  socket.addEventListener("error", notify);
}

export function sendMessage(
  content: string,
  senderId: string,
  receiverId: string,
) {
  const payload = JSON.stringify({
    type: "message",
    content,
    senderId,
    receiverId,
  });

  console.log(payload);
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(payload);
    return;
  }

  connectChat(senderId);

  socket?.addEventListener(
    "open",
    () => {
      socket.send(payload);
    },
    { once: true },
  );
}

export function connectChat(userId: string) {
  connect(userId);
}

export function onConnectionStatusChange(listener: (status: number) => void) {
  listeners.push(listener);
}

function notify() {
  listeners.forEach((l) => l(socket?.readyState ?? WebSocket.CLOSED));
}

export function onMessage(listener: (data: any) => void) {
  messageListeners.push(listener);

  console.log("Listeners after adding:", messageListeners.length);

  return () => {
    messageListeners = messageListeners.filter((l) => l !== listener);
  };
}
