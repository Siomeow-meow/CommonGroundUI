"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getConversation, getMessages, postMessage, startConversation } from "./conversation";
import { markConversationRead } from "./chatPrefs";
import { connectChat, onConnectionStatusChange, onMessage } from "@/app/util/websocket";
import { Message } from "@/app/types/conversation";

// The websocket only reaches users connected to the same backend instance,
// so we also poll. Live messages show instantly when the socket works, and
// within a few seconds when it doesn't.
const POLL_MS = 4000;

type MessageWithConvo = Message & { conversationId?: number };

function mergeMessages(prev: MessageWithConvo[], incoming: MessageWithConvo[]) {
  const byId = new Map<number, MessageWithConvo>();
  [...prev, ...incoming].forEach((m) => byId.set(m.id, m));
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

// Owns loading + real-time updates for one open thread. `conversationId`
// can be undefined (no conversation exists yet, e.g. first message to a
// friend); it is created on the first send.
export function useMessages(
  conversationId: string | number | undefined,
  otherUserId: string | undefined,
  onConversationResolved?: (conversationId: string) => void,
) {
  const { userId, getToken } = useAuth();
  const [messages, setMessages] = useState<MessageWithConvo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const mountedRef = useRef(true);
  const activeIdRef = useRef<string | number | undefined>(conversationId);
  useEffect(() => {
    activeIdRef.current = conversationId;
  }, [conversationId]);

  // Check the conversation exists and we're in it (the server answers 404
  // otherwise).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) return;
      if (!conversationId) {
        setAuthLoading(false);
        return;
      }
      try {
        const token = await getToken();
        await getConversation(Number(conversationId), token);
        if (!cancelled) setError(null);
      } catch {
        if (!cancelled) setError("404");
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, userId, getToken]);

  // Open (or reuse) the websocket connection.
  useEffect(() => {
    if (!userId) return;
    connectChat(() => getToken());
    return onConnectionStatusChange((status) => setConnected(status === WebSocket.OPEN));
  }, [userId, getToken]);

  const load = useCallback(
    async (silent = false) => {
      if (!conversationId || error === "404") {
        setMessages([]);
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const token = await getToken();
        const data = await getMessages(Number(conversationId), token);
        if (!mountedRef.current || activeIdRef.current !== conversationId) return;
        const list: MessageWithConvo[] = Array.isArray(data) ? data : [];
        setMessages((prev) => (silent ? mergeMessages(prev, list) : list));
        markConversationRead(conversationId, token);
      } catch (e) {
        console.error(e);
        if (mountedRef.current && !silent) setError("Couldn't load messages.");
      } finally {
        if (mountedRef.current && !silent) setLoading(false);
      }
    },
    [conversationId, error, getToken],
  );

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches data; state is set after the request returns
    load();
    const interval = setInterval(() => load(true), POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [load]);

  // Live messages pushed over the socket.
  useEffect(() => {
    return onMessage((data) => {
      if (data.type !== "message") return;
      const message = data.message as unknown as MessageWithConvo;
      if (!conversationId || String(message.conversationId) !== String(conversationId)) return;
      setMessages((prev) => mergeMessages(prev, [message]));
      getToken().then((t) => markConversationRead(conversationId, t));
    });
  }, [conversationId, getToken]);

  const send = useCallback(
    async (content: string) => {
      if (!userId || !otherUserId || !content.trim() || error === "404") return;
      try {
        const token = await getToken();
        let id = conversationId;
        if (!id) {
          const convo = await startConversation([otherUserId], token);
          id = convo.id;
          onConversationResolved?.(String(id));
        }
        const message = await postMessage(Number(id), content.trim(), token);
        setMessages((prev) => mergeMessages(prev, [message]));
      } catch (e) {
        console.error(e);
        setError("Message not sent. Check your connection and try again.");
      }
    },
    [userId, otherUserId, conversationId, error, getToken, onConversationResolved],
  );

  return { messages, loading, error, setError, connected, send, authLoading };
}
