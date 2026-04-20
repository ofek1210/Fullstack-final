import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import {
  fetchPostsByUser,
  likePost,
  unlikePost,
  type Post,
} from "../features/posts/posts.api";
import { fetchPublicUser, type PublicUser } from "../features/users/users.api";

const PAGE_LIMIT = 10;

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [profileError, setProfileError] = useState("");
  const [items, setItems] = useState<Post[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const isMe = Boolean(me?.userId && userId && me.userId === userId);

  useEffect(() => {
    if (!userId) return;
    setProfile(null);
    setProfileError("");
    setItems([]);
    setSkip(0);
    setHasMore(true);
    void (async () => {
      try {
        const res = await fetchPublicUser(userId);
        setProfile(res.user);
      } catch (err: unknown) {
        setProfileError(getErrorMessage(err, "Failed to load profile"));
      }
    })();
  }, [userId]);

  async function loadPosts(reset = false) {
    if (!userId || isLoading) return;
    setIsLoading(true);
    setPostsError("");
    try {
      const res = await fetchPostsByUser(userId, {
        skip: reset ? 0 : skip,
        limit: PAGE_LIMIT,
      });
      setItems((prev) => (reset ? res.items : prev.concat(res.items)));
      setSkip(res.nextSkip);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      setPostsError(getErrorMessage(err, "Failed to load posts"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!userId || !profile) return;
    void loadPosts(true);
  }, [userId, profile]);

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
  }, [hasMore, isLoading, skip, userId, profile]);

  async function toggleLike(post: Post) {
    setPostsError("");
    try {
      const res = post.likedByMe ? await unlikePost(post.id) : await likePost(post.id);
      setItems((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, likesCount: res.likesCount, likedByMe: res.likedByMe } : p
        )
      );
    } catch (err: unknown) {
      setPostsError(getErrorMessage(err, "Failed to update like"));
    }
  }

  if (!userId) {
    return (
      <div style={{ padding: 24, color: "#fff" }}>
        <Link to="/feed">← Back</Link>
        <p>Missing user id.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/feed" style={{ color: "rgba(255,255,255,0.85)" }}>
          ← Back to feed
        </Link>
      </div>

      {profileError && (
        <div style={{ color: "#f87171", marginBottom: 12 }}>{profileError}</div>
      )}

      {profile && (
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
            padding: 20,
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            background: "rgba(11, 15, 26, 0.72)",
            boxShadow: "0 14px 30px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(12px)",
            color: "#fff",
            marginBottom: 24,
          }}
        >
          <img
            src={
              profile.avatarUrl?.trim()
                ? profile.avatarUrl
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=random&size=128`
            }
            alt=""
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>
              {profile.fullName?.trim() || profile.username}
            </h1>
            <div style={{ color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>@{profile.username}</div>
            {profile.bio?.trim() && (
              <p style={{ margin: 0, lineHeight: 1.5, color: "rgba(255,255,255,0.9)" }}>{profile.bio}</p>
            )}
            {isMe && (
              <Link
                to="/dashboard"
                style={{ display: "inline-block", marginTop: 12, color: "#93c5fd" }}
              >
                Edit my profile →
              </Link>
            )}
          </div>
        </div>
      )}

      {postsError && <div style={{ color: "#f87171", marginBottom: 12 }}>{postsError}</div>}

      {profile && (
        <>
          <h2 style={{ fontSize: 18, marginBottom: 12, color: "#fff" }}>Posts</h2>

          <div style={{ display: "grid", gap: 16 }}>
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
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>
                  {new Date(post.createdAt).toLocaleString()}
                </div>
                <p style={{ margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{post.text}</p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt=""
                    style={{ width: "100%", borderRadius: 10, maxHeight: 320, objectFit: "cover" }}
                  />
                )}
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                  <button type="button" onClick={() => toggleLike(post)}>
                    {post.likedByMe ? "Unlike" : "Like"} ({post.likesCount})
                  </button>
                  <Link to={`/posts/${post.id}`} style={{ color: "#93c5fd" }}>
                    Comments ({post.commentsCount})
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div style={{ marginTop: 16, color: "rgba(255,255,255,0.6)" }}>Loading...</div>
          )}
          <div ref={sentinelRef} />
        </>
      )}
    </div>
  );
}
