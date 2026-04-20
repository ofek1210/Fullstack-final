import { api } from "../../lib/api";

export type PostAuthor = {
  userId: string;
  username: string;
  avatarUrl?: string;
};

export type Post = {
  id: string;
  text: string;
  imageUrl?: string;
  commentsCount: number;
  likesCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
};

export type Comment = {
  id: string;
  postId: string;
  text: string;
  createdAt: string;
  author: PostAuthor;
};

export type PagedResponse<T> = {
  items: T[];
  nextSkip: number;
  hasMore: boolean;
};

export async function fetchPosts(params: { skip?: number; limit?: number; mine?: boolean }) {
  const search = new URLSearchParams();
  if (params.skip) search.set("skip", String(params.skip));
  if (params.limit) search.set("limit", String(params.limit));

  const base = params.mine ? "/posts/mine" : "/posts";
  const path = search.toString() ? `${base}?${search.toString()}` : base;

  return api<PagedResponse<Post>>(path);
}

export async function fetchPostsByUser(userId: string, params: { skip?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params.skip) search.set("skip", String(params.skip));
  if (params.limit) search.set("limit", String(params.limit));
  const base = `/posts/by-user/${userId}`;
  const path = search.toString() ? `${base}?${search.toString()}` : base;
  return api<PagedResponse<Post>>(path);
}

export async function fetchPost(postId: string) {
  return api<Post>(`/posts/${postId}`);
}

export async function createPost(payload: { text: string; imageFile?: File | null }) {
  const formData = new FormData();
  formData.append("text", payload.text);
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }

  return api<Post>("/posts", {
    method: "POST",
    body: formData,
  });
}

export async function updatePost(postId: string, payload: { text: string; imageFile?: File | null }) {
  const formData = new FormData();
  formData.append("text", payload.text);
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }

  return api<Post>(`/posts/${postId}`, {
    method: "PUT",
    body: formData,
  });
}

export async function deletePost(postId: string) {
  return api<void>(`/posts/${postId}`, {
    method: "DELETE",
  });
}

export async function likePost(postId: string) {
  return api<{ likesCount: number; likedByMe: boolean }>(`/posts/${postId}/like`, {
    method: "POST",
  });
}

export async function unlikePost(postId: string) {
  return api<{ likesCount: number; likedByMe: boolean }>(`/posts/${postId}/like`, {
    method: "DELETE",
  });
}

export async function fetchComments(postId: string, params: { skip?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params.skip) search.set("skip", String(params.skip));
  if (params.limit) search.set("limit", String(params.limit));
  const path = search.toString()
    ? `/posts/${postId}/comments?${search.toString()}`
    : `/posts/${postId}/comments`;
  return api<PagedResponse<Comment>>(path);
}

export async function createComment(postId: string, text: string) {
  return api<Comment>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
