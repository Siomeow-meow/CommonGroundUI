const PROXY = "/api/proxy";

export async function getComments(token: any) {
  const res = await fetch(`${PROXY}/comment`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function getComment(id: string, token: any) {
  const res = await fetch(`${PROXY}/comment/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(res.status === 404 ? "Comment not found" : "Failed to fetch comment");
  return res.json();
}

export async function postComment(
  request: { content: string; commenterId: string; postId: number },
  token: any,
) {
  try {
    const res = await fetch(`${PROXY}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
    });
    return res.json();
  } catch (err) {
    console.error("POST COMMENT ERROR:", err);
    throw err;
  }
}

export async function getPostComments(id: string, token: any) {
  const res = await fetch(`${PROXY}/comment?postId=${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(res.status === 404 ? "Comment not found" : "Failed to fetch comments");
  return res.json();
}

export async function deleteComment(id: number, token: any) {
  try {
    const res = await fetch(`${PROXY}/comment/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(res.status === 404 ? "Comment not found" : "Failed to delete comment");
    return res.json();
  } catch (err) {
    console.error("DELETE COMMENT ERROR:", err);
    throw err;
  }
}

// Mirrors likePost's /post/:id/likes shape — without this, hearting a
// comment/reply only ever touched local state, so the like silently reset
// itself the next time the comment tree was fetched from the server.
export async function likeComment(
  request: { type: "LIKE" | "UNLIKE" },
  token: any,
  id: number,
) {
  const res = await fetch(`${PROXY}/comment/${id}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Failed to like comment");
  return res.json();
}

export async function patchComment(
  request: { content: string },
  id: string,
  token: any,
) {
  try {
    const res = await fetch(`${PROXY}/comment/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(res.status === 404 ? "Comment not found" : "Failed to patch comment");
    return res.json();
  } catch (err) {
    console.error("PATCH COMMENT ERROR:", err);
    throw err;
  }
}
