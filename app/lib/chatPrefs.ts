"use client";

const PROXY = "/api/proxy";

/**
 * Marks a conversation as read on the server. Unread counts come back on
 * each conversation from GET /conversation (`unreadCount`).
 */
export async function markConversationRead(
  conversationId: string | number,
  token: string | null,
) {
  if (!token || !conversationId) return;
  try {
    await fetch(`${PROXY}/conversation/${conversationId}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Not critical: the chat still works, it just stays marked unread.
  }
}
