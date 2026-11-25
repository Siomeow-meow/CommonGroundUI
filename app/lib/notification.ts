const PROXY = "/api/proxy";

export async function getNotifications(token: string | null) {
  const res = await fetch(`${PROXY}/notification`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function markNotificationsRead(
  request: { ids: number[] } | { all: true },
  token: string | null,
) {
  const res = await fetch(`${PROXY}/notification`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Failed to mark notifications read");
  return res.json();
}

export async function deleteNotification(id: number, token: string | null) {
  const res = await fetch(`${PROXY}/notification/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete notification");
  return res.json();
}
