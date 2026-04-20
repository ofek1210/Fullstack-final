import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import {
  createPost,
  deletePost,
  fetchPosts,
  likePost,
  type Post,
  unlikePost,
  updatePost,
} from "../features/posts/posts.api";

const PAGE_LIMIT = 10;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function Feed() {
  const { user } = useAuth();
  const [view, setView] = useState<"all" | "mine">("all");
  const [items, setItems] = useState<Post[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [newText, setNewText] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const newFileInputRef = useRef<HTMLInputElement | null>(null);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const canPost = newText.trim().length > 0;

  const isOwnPost = useMemo(() => {
    return (post: Post) => post.author.userId === user?.userId;
  }, [user?.userId]);

  useEffect(() => {
    if (newImagePreview) {
      return () => URL.revokeObjectURL(newImagePreview);
    }
  }, [newImagePreview]);

  useEffect(() => {
    if (editImagePreview) {
      return () => URL.revokeObjectURL(editImagePreview);
    }
  }, [editImagePreview]);

  async function loadPosts(reset = false) {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetchPosts({
        skip: reset ? 0 : skip,
        limit: PAGE_LIMIT,
        mine: view === "mine",
      });
      setItems((prev) => (reset ? res.items : prev.concat(res.items)));
      setSkip(res.nextSkip);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load posts"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts(true);
  }, [view]);

  useEffect(() => {
    if (!hasMore || isLoading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadPosts();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, skip, view]);

  function resetNewImage() {
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }
    setNewImageFile(null);
    setNewImagePreview(null);
    if (newFileInputRef.current) {
      newFileInputRef.current.value = "";
    }
  }

  function handleNewImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError("Image must be JPG, PNG, or WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 3MB or smaller.");
      event.target.value = "";
      return;
    }

    resetNewImage();
    setError("");
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  }

  async function handleCreatePost(e: FormEvent) {
    e.preventDefault();
    if (!canPost) return;
    setError("");

    try {
      const created = await createPost({ text: newText.trim(), imageFile: newImageFile });
      setItems((prev) => [created, ...prev]);
      setNewText("");
      resetNewImage();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create post"));
    }
  }

  function startEdit(post: Post) {
    setEditingPostId(post.id);
    setEditText(post.text);
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  }

  function cancelEdit() {
    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditingPostId(null);
    setEditText("");
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  }

  function handleEditImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError("Image must be JPG, PNG, or WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 3MB or smaller.");
      event.target.value = "";
      return;
    }

    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview);
    }
    setError("");
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  }

  async function handleSaveEdit(postId: string) {
    setError("");
    if (!editText.trim()) {
      setError("Post text is required.");
      return;
    }
    try {
      const updated = await updatePost(postId, { text: editText.trim(), imageFile: editImageFile });
      setItems((prev) => prev.map((post) => (post.id === postId ? updated : post)));
      cancelEdit();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update post"));
    }
  }

  async function handleDelete(postId: string) {
    setError("");
    try {
      await deletePost(postId);
      setItems((prev) => prev.filter((post) => post.id !== postId));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete post"));
    }
  }

  async function toggleLike(post: Post) {
    setError("");
    try {
      const res = post.likedByMe ? await unlikePost(post.id) : await likePost(post.id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? { ...item, likesCount: res.likesCount, likedByMe: res.likedByMe }
            : item
        )
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update like"));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginBottom: 0 }}>Feed</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link to="/ai">AI Search</Link>
          <button
            type="button"
            onClick={() => setView("all")}
            disabled={view === "all"}
          >
            All posts
          </button>
          <button
            type="button"
            onClick={() => setView("mine")}
            disabled={view === "mine"}
          >
            My posts
          </button>
        </div>
      </div>

      <form onSubmit={handleCreatePost} style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <textarea
          rows={3}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Write something..."
          style={{ padding: 10, borderRadius: 8, border: "1px solid #d0d0d0" }}
        />

        {newImagePreview && (
          <img
            src={newImagePreview}
            alt="preview"
            style={{ width: "100%", borderRadius: 10, maxHeight: 320, objectFit: "cover" }}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input
            ref={newFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleNewImageChange}
            style={{ display: "none" }}
          />
          <button type="button" onClick={() => newFileInputRef.current?.click()}>
            Add image
          </button>
          {newImageFile && (
            <button type="button" onClick={resetNewImage}>
              Remove image
            </button>
          )}
          <button type="submit" disabled={!canPost}>
            Publish
          </button>
        </div>
      </form>

      {error && <div style={{ color: "#b42318", marginTop: 12 }}>{error}</div>}

      <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
        {items.map((post) => (
          <div
            key={post.id}
            style={{
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 12,
              background: "rgba(11, 15, 26, 0.6)",
              boxShadow: "0 14px 30px rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(12px)",
              padding: 16,
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <Link
                  to={`/users/${post.author.userId}`}
                  style={{ fontWeight: 600, color: "#e0e7ff", textDecoration: "none" }}
                >
                  {post.author.username}
                </Link>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              </div>
              {isOwnPost(post) && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => startEdit(post)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(post.id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>

            {editingPostId === post.id ? (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <textarea
                  rows={3}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{ padding: 10, borderRadius: 8, border: "1px solid #d0d0d0" }}
                />
                {editImagePreview && (
                  <img
                    src={editImagePreview}
                    alt="preview"
                    style={{ width: "100%", borderRadius: 10, maxHeight: 320, objectFit: "cover" }}
                  />
                )}
                {!editImagePreview && post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="post"
                    style={{ width: "100%", borderRadius: 10, maxHeight: 320, objectFit: "cover" }}
                  />
                )}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleEditImageChange}
                  style={{ display: "none" }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => editFileInputRef.current?.click()}>
                    Change image
                  </button>
                  <button type="button" onClick={() => handleSaveEdit(post.id)}>
                    Save
                  </button>
                  <button type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ marginTop: 12, marginBottom: 12 }}>{post.text}</p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="post"
                    style={{ width: "100%", borderRadius: 10, maxHeight: 320, objectFit: "cover" }}
                  />
                )}
              </>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
              <button type="button" onClick={() => toggleLike(post)}>
                {post.likedByMe ? "Unlike" : "Like"} ({post.likesCount})
              </button>
              <Link to={`/posts/${post.id}`}>Comments ({post.commentsCount})</Link>
            </div>
          </div>
        ))}
      </div>

      {isLoading && <div style={{ marginTop: 16 }}>Loading...</div>}
      <div ref={sentinelRef} />
    </div>
  );
}
