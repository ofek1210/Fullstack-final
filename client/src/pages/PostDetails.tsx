import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createComment,
  fetchComments,
  fetchPost,
  type Comment,
  type Post,
} from "../features/posts/posts.api";

const PAGE_LIMIT = 10;

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function PostDetails() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");

  async function loadPost(postId: string) {
    setError("");
    try {
      const data = await fetchPost(postId);
      setPost(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load post"));
    }
  }

  async function loadComments(postId: string, reset = false) {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetchComments(postId, { skip: reset ? 0 : skip, limit: PAGE_LIMIT });
      setComments((prev) => (reset ? res.items : prev.concat(res.items)));
      setSkip(res.nextSkip);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load comments"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    void loadPost(id);
    void loadComments(id, true);
  }, [id]);

  async function handleCreateComment(e: FormEvent) {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    setError("");
    try {
      const created = await createComment(id, newComment.trim());
      setComments((prev) => [created, ...prev]);
      setNewComment("");
      setPost((prev) =>
        prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to add comment"));
    }
  }

  if (!id) {
    return (
      <div>
        <Link to="/feed">Back to feed</Link>
        <div>Missing post id.</div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/feed">← Back to feed</Link>

      {post && (
        <div
          style={{
            marginTop: 16,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 12,
            background: "rgba(11, 15, 26, 0.6)",
            boxShadow: "0 14px 30px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(12px)",
            padding: 16,
            color: "#fff",
          }}
        >
          <Link
            to={`/users/${post.author.userId}`}
            style={{ fontWeight: 600, color: "#e0e7ff", textDecoration: "none" }}
          >
            {post.author.username}
          </Link>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            {new Date(post.createdAt).toLocaleString()}
          </div>
          <p style={{ marginTop: 12 }}>{post.text}</p>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="post"
              style={{ width: "100%", borderRadius: 10, maxHeight: 320, objectFit: "cover" }}
            />
          )}
          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.7)" }}>
            {post.commentsCount} comments
          </div>
        </div>
      )}

      <form onSubmit={handleCreateComment} style={{ marginTop: 16, display: "grid", gap: 8 }}>
        <textarea
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          style={{ padding: 10, borderRadius: 8, border: "1px solid #d0d0d0" }}
        />
        <button type="submit" disabled={!newComment.trim()}>
          Add comment
        </button>
      </form>

      {error && <div style={{ color: "#b42318", marginTop: 12 }}>{error}</div>}

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {comments.map((comment) => (
          <div
            key={comment.id}
            style={{
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 10,
              background: "rgba(11, 15, 26, 0.4)",
              padding: 12,
              color: "#fff",
            }}
          >
            <Link
              to={`/users/${comment.author.userId}`}
              style={{ fontWeight: 600, color: "#e0e7ff", textDecoration: "none" }}
            >
              {comment.author.username}
            </Link>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              {new Date(comment.createdAt).toLocaleString()}
            </div>
            <p style={{ marginTop: 8 }}>{comment.text}</p>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => void loadComments(id)}
          disabled={isLoading}
          style={{ marginTop: 16 }}
        >
          {isLoading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
