import { Post } from "../src/models/Post";

jest.mock("../src/services/ai/localEmbedding.provider", () => ({
  generateEmbedding: jest.fn().mockResolvedValue([1, 0]),
  getEmbeddingModelName: () => "test-model",
}));

import { generateEmbedding } from "../src/services/ai/localEmbedding.provider";
import { searchPosts } from "../src/services/ai/ai.service";

const mockGenerateEmbedding = jest.mocked(generateEmbedding);

describe("ai.searchPosts", () => {
  beforeEach(() => {
    mockGenerateEmbedding.mockReset();
    mockGenerateEmbedding.mockResolvedValue([1, 0]);
  });

  it("returns ranked posts when relevant matches exist", async () => {
    const post1 = await Post.create({
      author: "507f191e810c19729de860ea",
      text: "React hooks and component state",
      embedding: [1, 0],
      embeddingModel: "test-model",
      embeddingUpdatedAt: new Date(Date.now() + 1000),
    });

    await Post.create({
      author: "507f191e810c19729de860eb",
      text: "MongoDB indexing strategies",
      embedding: [0, 1],
      embeddingModel: "test-model",
      embeddingUpdatedAt: new Date(Date.now() + 1000),
    });

    const result = await searchPosts("react hooks", 5, true);

    expect(result.mode).toBe("local");
    if (result.mode === "local") {
      expect(result.results[0]?.postId).toBe(String(post1._id));
      expect(result.results[0]?.score).toBeGreaterThan(0.8);
      expect(result.answer).toBeDefined();
      expect(result.answer?.summary).toMatch(/Based on posts in the app/i);
      expect(result.answer?.sources[0]?.url).toBe(`/posts/${post1._id}`);
    }
  });

  it("returns fallback external sources when no matches found", async () => {
    await Post.create({
      author: "507f191e810c19729de860ec",
      text: "Database replication basics",
      embedding: [0, 1],
      embeddingModel: "test-model",
      embeddingUpdatedAt: new Date(Date.now() + 1000),
    });

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        pages: [
          { title: "Fallback Topic", excerpt: "Short summary." },
        ],
      }),
    });

    const originalFetch = global.fetch;
    global.fetch = fetchMock as typeof fetch;

    let result;
    try {
      result = await searchPosts("quantum physics", 5, true);
    } finally {
      global.fetch = originalFetch;
    }

    expect(result.mode).toBe("fallback");
    if (result.mode === "fallback") {
      expect(result.message).toMatch(/No relevant posts/i);
      expect(result.external.wikipedia.length).toBeGreaterThan(0);
      expect(result.answer).toBeDefined();
      expect(result.answer?.sources[0]?.url).toBe("https://en.wikipedia.org/wiki/Fallback%20Topic");
      expect(result.answer?.summary).toMatch(/Wikipedia/i);
    }
  });
});
