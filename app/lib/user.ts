import { setUser } from "../store/user";

// Browser calls go through /api/proxy (see app/lib/backend.ts).
const PROXY = "/api/proxy";

export type PatchUserRequest = {
  fName?: string;
  lName?: string;
  bio?: string;
  profileImg?: string;
  bannerImg?: string;
  userName?: string;
};

function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null),
  ) as Partial<T>;
}

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getUsers(token?: string | null) {
  const res = await fetch(`${PROXY}/user`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getUser(id: string, token?: string | null) {
  const res = await fetch(`${PROXY}/user/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch user");
  }
  return res.json();
}

export async function patchUser(
  request: PatchUserRequest,
  id: string,
  dispatch: unknown,
  token?: string | null,
) {
  const res = await fetch(`${PROXY}/user/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(cleanObject(request)),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (res.status === 404) throw new Error("User not found");
    throw new Error(body?.error ?? "Failed to update user");
  }
  const data = await res.json();
  if (typeof dispatch === "function") dispatch(setUser(data));
  return data;
}
