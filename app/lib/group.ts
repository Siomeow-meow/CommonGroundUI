// All requests go through /api/proxy to avoid CORS; the proxy forwards to
// BACKEND_URL on the server side (see app/lib/backend.ts).
const PROXY = "/api/proxy";

export type PatchGroupRequest = {
  groupName?: string;
  description?: string;
  groupImg?: string;
  bannerImg?: string;
  groupThemes?: string[];
  allowAnonymity?: boolean;
};

export async function getGroups(token: string | null | undefined) {
  const res = await fetch(`${PROXY}/group`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch groups");
  return res.json();
}

export async function getGroup(id: string, token: string | null | undefined) {
  const res = await fetch(`${PROXY}/group/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(
      res.status === 404 ? "Group not found" : "Failed to fetch group",
    );
  }
  return res.json();
}

export async function getUserMemberships(id: string, token: string | null | undefined) {
  const res = await fetch(`${PROXY}/group?memberId=${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(
      res.status === 404 ? "Group not found" : "Failed to fetch memberships",
    );
  }
  return res.json();
}

export async function createGroup(
  request: {
    groupName: string;
    description: string;
    groupImg: string;
    bannerImg: string;
  },
  token: string | null | undefined,
) {
  try {
    const res = await fetch(`${PROXY}/group`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? "Failed to create group");
    }
    return res.json();
  } catch (err) {
    console.error("GROUP POST ERROR:", err);
    throw err;
  }
}

export async function patchGroup(
  request: {
    groupName?: string;
    description?: string;
    groupImg?: string;
    bannerImg?: string;
    groupThemes?: string[];
    allowAnonymity?: boolean;
  },
  id: number,
  token: string | null | undefined,
) {
  try {
    const res = await fetch(`${PROXY}/group/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      throw new Error(
        res.status === 404 ? "Group not found" : "Failed to patch group",
      );
    }
    return res.json();
  } catch (err) {
    console.error("GROUP PATCH ERROR:", err);
    throw err;
  }
}

export async function followGroup(
  request: { role: string },
  token: string | null | undefined,
  id: number,
) {
  try {
    const res = await fetch(`${PROXY}/group/${id}/member`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? "Failed to update membership");
    }
    return res.json();
  } catch (err) {
    console.error("FOLLOW GROUP ERROR:", err);
    throw err;
  }
}

export async function getGroupPosts(id: string, token: string | null | undefined) {
  const res = await fetch(`${PROXY}/post?groupId=${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(
      res.status === 404 ? "Posts not found" : "Failed to fetch group posts",
    );
  }
  return res.json();
}

export async function deleteGroup(id: number, token: string | null | undefined) {
  try {
    const res = await fetch(`${PROXY}/group/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? `Request failed (${res.status})`);
    }
    return res.json();
  } catch (err) {
    console.error("DELETE GROUP ERROR:", err);
    throw err;
  }
}

export async function getGroupMembers(id: string, token: string | null | undefined) {
  try {
    const res = await fetch(`${PROXY}/group/${id}/member`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.warn(
        `getGroupMembers: ${res.status} ${res.statusText} for group ${id}`,
      );
      return [];
    }
    return res.json();
  } catch (err) {
    console.warn("getGroupMembers network error:", err);
    return [];
  }
}

export async function kickMember(
  groupId: number,
  memberId: string,
  token: string | null | undefined,
) {
  try {
    const res = await fetch(`${PROXY}/group/${groupId}/member/${memberId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? `Request failed (${res.status})`);
    }
    return res.json();
  } catch (err) {
    console.error("KICK MEMBER ERROR:", err);
    throw err;
  }
}

export async function updateMemberRole(
  groupId: number,
  memberId: string,
  role: string,
  token: string | null | undefined,
) {
  try {
    const res = await fetch(`${PROXY}/group/${groupId}/member/${memberId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update role (${res.status})`);
    }
    return res.json();
  } catch (err) {
    console.error("UPDATE MEMBER ROLE ERROR:", err);
    throw err;
  }
}

export async function inviteMember(
  groupId: number,
  userId: string,
  token: string | null | undefined,
) {
  try {
    const res = await fetch(`${PROXY}/group/${groupId}/member`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? `Request failed (${res.status})`);
    }
    return res.json();
  } catch (err) {
    console.error("INVITE MEMBER ERROR:", err);
    throw err;
  }
}
