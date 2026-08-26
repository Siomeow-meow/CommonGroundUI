const PROXY = "/api/proxy";

export async function getFriends(token: any) {
  const res = await fetch(`${PROXY}/friend`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch friends (${res.status})${body ? `: ${body}` : ""}`);
  }
  return res.json();
}

export async function getFriend(id: string, token: any) {
  const res = await fetch(`${PROXY}/friend/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch friend (${res.status})${body ? `: ${body}` : ""}`);
  }
  return res.json();
}

export async function getUsersFriends(token: any) {
  const res = await fetch(`${PROXY}/friend`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch friends (${res.status})${body ? `: ${body}` : ""}`);
  }
  return res.json();
}

export async function getUserFriendRequests(token: any) {
  const res = await fetch(`${PROXY}/friend/request`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(res.status === 404 ? "Friend request not found" : "Failed to fetch friend requests");
  return res.json();
}

export async function sendFriendRequest(
  request: { receiverId: string; status: "PENDING" },
  token: any,
) {
  try {
    const res = await fetch(`${PROXY}/friend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Failed to send friend request (${res.status})${body ? `: ${body}` : ""}`);
    }
    return res.json();
  } catch (err) {
    console.error("FRIEND POST ERROR:", err);
    throw err;
  }
}

export async function acceptFriendRequest(
  request: { receiverId: string; status: "ACCEPTED" },
  id: number,
  token: any,
) {
  try {
    const res = await fetch(`${PROXY}/friend/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(res.status === 404 ? "Receiver not found" : "Failed to accept request");
    return res.json();
  } catch (err) {
    console.error("ACCEPT REQUEST ERROR:", err);
    throw err;
  }
}

export async function deleteFriend(id: number, token: any) {
  try {
    const res = await fetch(`${PROXY}/friend/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    return res.json();
  } catch (err) {
    console.error("DELETE FRIEND ERROR:", err);
    throw err;
  }
}
