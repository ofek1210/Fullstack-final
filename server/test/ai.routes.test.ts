jest.mock("../src/services/ai/localEmbedding.provider", () => ({
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.1, 0.1]),
  getEmbeddingModelName: () => "test-model",
}));

import request from "supertest";
import app from "../src/app";
import { registerUser } from "./helpers";

describe("AI HTTP API", () => {
  it("GET /ai/health returns model info", async () => {
    const { token } = await registerUser("ai_health_user");
    const res = await request(app).get("/ai/health").set("Authorization", `Bearer ${token}`).expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.provider).toBe("local");
    expect(res.body.model).toBe("test-model");
  });

  it("POST /ai/search returns local results when posts match", async () => {
    const { token } = await registerUser("ai_search_user");

    await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .field("text", "React hooks and component patterns for testing")
      .expect(201);

    const q = `semantic query ${Date.now()} long enough`;
    const res = await request(app)
      .post("/ai/search")
      .set("Authorization", `Bearer ${token}`)
      .send({ query: q, limit: 5, includeAnswer: false })
      .expect(200);

    expect(res.body.mode).toBe("local");
    expect(res.body.results?.length).toBeGreaterThan(0);
  });

  it("POST /ai/query mirrors /ai/search", async () => {
    const { token } = await registerUser("ai_query_user");

    await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .field("text", "Another post for alias query endpoint")
      .expect(201);

    const q = `alias search ${Date.now()} with padding`;
    const searchRes = await request(app)
      .post("/ai/search")
      .set("Authorization", `Bearer ${token}`)
      .send({ query: q, limit: 3 })
      .expect(200);

    const queryRes = await request(app)
      .post("/ai/query")
      .set("Authorization", `Bearer ${token}`)
      .send({ query: q, limit: 3 })
      .expect(200);

    expect(queryRes.body.mode).toBe(searchRes.body.mode);
  });

  it("rejects short query", async () => {
    const { token } = await registerUser("ai_short_q");
    await request(app)
      .post("/ai/search")
      .set("Authorization", `Bearer ${token}`)
      .send({ query: "ab" })
      .expect(400);
  });

  it("requires auth", async () => {
    await request(app).get("/ai/health").expect(401);
  });
});
