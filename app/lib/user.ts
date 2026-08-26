import { setUser } from "../store/user";

const BACKEND = "https://probable-guacamole-alpha.vercel.app";

export type PatchUserRequest = {
  fName?: string;
  lName?: string;
  bio?: string;
  profileImg?: string;
  bannerImg?: string;
  userName?: string;
};

function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => {
      return value !== undefined && value !== null;
    }),
  ) as Partial<T>;
}

export async function getUsers(token?: string | null) {
  const res = await fetch(`${BACKEND}/api/user`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getUser(id: string, token?: string | null) {
  const res = await fetch(`${BACKEND}/api/user/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch user");
  }
  return res.json();
}

export async function postUser(request: {
  id: string;
  email: string;
  fName: string | null;
  lName: string | null;
  profileImg: string | null;
  userName: string;
}) {
  try {
    const res = await fetch(`${BACKEND}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return res.json();
  } catch (err) {
    console.log("POST USER ERROR:", err);
    throw err;
  }
}

export async function patchUser(
  request: PatchUserRequest,
  id: string,
  dispatch: any,
  token?: string | null,
) {
  try {
    const cleanRequest = cleanObject(request);
    console.log("PATCH PAYLOAD:", cleanRequest);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BACKEND}/api/user/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(cleanRequest),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("PATCH USER RESPONSE:", res.status, text);
      if (res.status === 404) throw new Error("User not found");
      throw new Error("Failed to update user");
    }
    const data = await res.json();
    if (typeof dispatch === "function") dispatch(setUser(data));
    return data;
  } catch (err) {
    console.log("PATCH USER ERROR:", err);
    throw err;
  }
}
