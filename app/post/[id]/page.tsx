"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import PageShell from "@/app/components/PageShell";
import PostCard from "@/app/components/PostCard";
import EditPostModal from "@/app/components/EditPostModal";
import { deletePost, getPost } from "@/app/lib/post";
import Post from "@/app/types/post";

/** A single post, opened from a share link or a notification. */
export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);

  useEffect(() => {
    if (!userId || !id) return;
    (async () => {
      try {
        const token = await getToken();
        setPost(await getPost(id, token));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load post");
      }
    })();
  }, [id, userId, getToken]);

  async function handleDelete(postId: number) {
    try {
      await deletePost(postId, await getToken());
      router.push(post?.groupId ? `/groups/${post.groupId}` : "/");
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <PageShell title="Post">
      {error ? (
        <div className="text-center py-16">
          <p className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
            {error === "Post not found" ? "This post doesn't exist or was deleted." : error}
          </p>
        </div>
      ) : !post ? (
        <div className="h-40 rounded-2xl animate-pulse" style={{ background: "var(--bg-subtle)" }} />
      ) : (
        <PostCard post={post} showOwnerActions onEdit={setEditing} onDelete={handleDelete} />
      )}
      {editing && (
        <EditPostModal
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => setPost((p) => (p ? { ...p, ...updated } : p))}
        />
      )}
    </PageShell>
  );
}
