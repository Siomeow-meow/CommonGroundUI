// All requests go through /api/proxy to avoid CORS — the proxy forwards to
// https://probable-guacamole-alpha.vercel.app on the server side.
const PROXY = "/api/proxy";

// export type PatchMessageRequest = {
// };

export async function getConversations(token: any) {
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

export async function getConversation(id: number, token: any) {
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

export async function getUserConversations(id: string, token: any) {
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

export async function getDirectConversation(otherUserId: string, token: any) {
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
  token: any,
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

export async function getMessages(id: number, token: any) {
  try {
    const res = await fetch(
      `${PROXY}/conversation/${id}/message?conversationId=${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res.json();
  } catch (err) {
    console.error("MESSAGE GET ERROR:", err);
    throw err;
  }
}

export async function deleteMessage(
  conversationId: number,
  messageId: number,
  token: any,
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

export async function getGroupChatMembers(id: string, token: any) {
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

export async function kickChatMember(
  conversationId: number,
  memberId: string,
  token: any,
) {
  try {
    const res = await fetch(
      `${PROXY}/conversation/${conversationId}/participant/${memberId}`,
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
    console.error("KICK MEMBER ERROR:", err);
    throw err;
  }
}

export async function inviteChatMember(
  conversationId: number,
  userId: string,
  token: any,
) {
  try {
    const res = await fetch(`${PROXY}/conversation/${conversationId}/member`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, role: "MEMBER" }),
    });
    return res.json();
  } catch (err) {
    console.error("INVITE MEMBER ERROR:", err);
    throw err;
  }
}
