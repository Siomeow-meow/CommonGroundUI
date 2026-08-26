const PROXY = "/api/proxy";

export async function getPosts(token: any) {
  const res = await fetch(`${PROXY}/post`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch posts (${res.status} ${res.statusText})${body ? `: ${body}` : ""}`);
  }
  return res.json();
}

export async function getPost(id: string, token: any) {
  const res = await fetch(`${PROXY}/post/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok)
    throw new Error(
      res.status === 404 ? "Post not found" : "Failed to fetch post",
    );
  return res.json();
}

export async function getPostsByAuthor(id: string, token: any) {
  const res = await fetch(`${PROXY}/post?authorId=${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok)
    throw new Error(
      res.status === 404 ? "Post not found" : "Failed to fetch posts",
    );
  return res.json();
}

export async function postPost(
  request: {
    title: string;
    content: string;
    tags: string[];
    images: string[];
    status: string;
    authorId: string;
    groupId?: number;
    parentId?: number;
    isAnonymous?: boolean;
  },
  token: any,
) {
  const res = await fetch(`${PROXY}/post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  return res.json();
}

export async function deletePost(id: number, token: any) {
  const res = await fetch(`${PROXY}/post/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function patchPost(
  request: {
    title?: string;
    content?: string;
    tags?: string[];
    images?: string[];
    status?: string;
    authorId: string;
    isAnonymous?: boolean;
  },
  id: number,
  token: any,
) {
  const res = await fetch(`${PROXY}/post/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  if (!res.ok)
    throw new Error(
      res.status === 404 ? "Post not found" : "Failed to patch post",
    );
  return res.json();
}

export async function likePost(
  request: { type: string },
  token: any,
  id: number,
) {
  const res = await fetch(`${PROXY}/post/${id}/likes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  return res.json();
}