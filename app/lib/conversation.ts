// All requests go through /api/proxy to avoid CORS; the proxy forwards to
// BACKEND_URL on the server side (see app/lib/backend.ts).
const PROXY = "/api/proxy";

// export type PatchMessageRequest = {
// };

export async function getConversations(token: string | null | undefined) {
  const res = await fetch(`${PROXY}/conversation`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch conversations (${res.status})${body ? `: ${body}` : ""}`,
    );
  }
  return res.json();
}

export async function getConversation(id: number, token: string | null | undefined) {
  const res = await fetch(`${PROXY}/conversation/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch conversation (${res.status})${body ? `: ${body}` : ""}`,
    );
  }
  return res.json();
}

export async function getUserConversations(id: string, token: string | null | undefined) {
  const res = await fetch(`${PROXY}/conversation?participantId=${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch user conversations (${res.status})${body ? `: ${body}` : ""}`,
    );
  }
  return res.json();
}

export async function getDirectConversation(otherUserId: string, token: string | null | undefined) {
  const res = await fetch(
    `${PROXY}/conversation/direct?otherUserId=${otherUserId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch direct conversation (${res.status})${body ? `: ${body}` : ""}`,
    );
  }
  return res.json();
}

export async function createGroupConversation(
  request: {
    participants: string[];
  },
  token: string | null | undefined,
) {
  try {
    if (request.participants.length < 3) {
      throw new Error(
        "Must have more than 2 participants to create a group chat",
      );
    }
    const res = await fetch(`${PROXY}/conversation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });
    return res.json();
  } catch (err) {
    console.error("GROUP CHAT POST ERROR:", err);
    throw err;
  }
}

export async function getMessages(id: number, token: string | null | undefined) {
  try {
    const res = await fetch(
      `${PROXY}/conversation/${id}/message`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
    return res.json();
  } catch (err) {
    console.error("MESSAGE GET ERROR:", err);
    throw err;
  }
}

export async function deleteMessage(
  conversationId: number,
  messageId: number,
  token: string | null | undefined,
) {
  try {
    const res = await fetch(
      `${PROXY}/conversation/${conversationId}/message/${messageId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res.json();
  } catch (err) {
    console.error("DELETE MESSAGE ERROR:", err);
    throw err;
  }
}

export async function getGroupChatMembers(id: string, token: string | null | undefined) {
  try {
    const res = await fetch(`${PROXY}/group/${id}/member?groupId=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.warn(
        `getGroupChatMembers: ${res.status} ${res.statusText} for group ${id}`,
      );
      return [];
    }
    console.log("getGroupChatMembers response:", res);
    return res.json();
  } catch (err) {
    console.warn("getGroupChatMembers network error:", err);
    return [];
  }
}

export async function inviteChatMember(
  conversationId: number,
  userId: string,
  token: string | null | undefined,
) {
  const res = await fetch(`${PROXY}/conversation/${conversationId}/participants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ participantId: userId }),
  });
  if (!res.ok) throw new Error("Failed to add member");
  return res.json();
}

/** Opens (or reuses) a direct chat, or starts a group chat for 2+ others. */
export async function startConversation(participants: string[], token: string | null | undefined) {
  const res = await fetch(`${PROXY}/conversation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ participants }),
  });
  if (!res.ok) throw new Error(`Failed to start conversation (${res.status})`);
  return res.json();
}

export async function postMessage(
  conversationId: number,
  content: string,
  token: string | null | undefined,
  parentId?: number,
) {
  const res = await fetch(`${PROXY}/conversation/${conversationId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, parentId }),
  });
  if (!res.ok) throw new Error(`Failed to send message (${res.status})`);
  return res.json();
}
