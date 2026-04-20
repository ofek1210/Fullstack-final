import { api } from "../../lib/api";

export type PublicUser = {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  oauthProvider: string;
};

export async function fetchPublicUser(userId: string) {
  return api<{ user: PublicUser }>(`/users/profile/${userId}`);
}
