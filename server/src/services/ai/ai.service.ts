import { Types } from "mongoose";
import { Post } from "../../models/Post";
import { generateEmbedding, getEmbeddingModelName } from "./localEmbedding.provider";
import {
  buildFallbackAnswer,
  buildLocalAnswer,
  extractKeywords,
  type AiAnswer,
  type ExternalSnippet,
  type LocalPostSummaryInput,
} from "./summarizer";

export type AiSearchLocalResult = {
  postId: string;
  title: string;
  excerpt: string;
  score: number;
};

export type AiSearchLocalResponse = {
  mode: "local";
  results: AiSearchLocalResult[];
  threshold: number;
  answer?: AiAnswer;
};

export type AiExternalSource = ExternalSnippet;

export type AiSearchFallbackResponse = {
  mode: "fallback";
  message: string;
  suggestions: {
    keywords: string[];
    sources: Array<{ name: string; queryUrl: string }>;
  };
  external: {
    wikipedia: AiExternalSource[];
  };
  answer?: AiAnswer;
};

export type AiSearchResponse = AiSearchLocalResponse | AiSearchFallbackResponse;

type CacheEntry = {
  value: AiSearchResponse;
  expiresAt: number;
};

type PostLean = {
  _id: Types.ObjectId;
  text: string;
  embedding?: number[];
  embeddingModel?: string;
  embeddingUpdatedAt?: Date | null;
  updatedAt: Date;
};

type ScoredPost = {
  postId: string;
  text: string;
  title: string;
  excerpt: string;
  score: number;
};

const cache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const CANDIDATE_LIMIT = 200;
const RELEVANCE_THRESHOLD = 0.4;

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, "");
}

function clampLimit(limit?: number) {
  const raw = typeof limit === "number" ? limit : DEFAULT_LIMIT;
  return Math.min(Math.max(raw, 1), MAX_LIMIT);
}

function getPostTitle(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return "Untitled post";
  const firstLine = trimmed.split(/\r?\n/)[0] || trimmed;
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}...` : firstLine;
}

function getPostExcerpt(text: string) {
  const trimmed = text.trim();
  if (trimmed.length <= 140) return trimmed;
  return `${trimmed.slice(0, 140)}...`;
}

function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildWikipediaSearchUrl(query: string) {
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
}

async function fetchWikipediaSources(query: string): Promise<AiExternalSource[]> {
  try {
    const url = `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(
      query
    )}&limit=3`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = (await res.json()) as {
      pages?: Array<{ title: string; excerpt?: string }>;
    };

    const pages = data.pages || [];
    return pages.map((page) => ({
      title: page.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      snippet: stripHtml(page.excerpt || ""),
    }));
  } catch {
    return [];
  }
}

async function ensureEmbedding(post: PostLean, modelName: string) {
  if (
    post.embedding &&
    post.embedding.length > 0 &&
    post.embeddingModel === modelName &&
    post.embeddingUpdatedAt &&
    post.embeddingUpdatedAt >= post.updatedAt
  ) {
    return post.embedding;
  }

  try {
    const embedding = await generateEmbedding(post.text);
    await Post.updateOne(
      { _id: post._id },
      { embedding, embeddingModel: modelName, embeddingUpdatedAt: new Date() }
    );
    return embedding;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate embedding";
    console.error("Embedding generation failed", { postId: String(post._id), message });
    return null;
  }
}

async function buildFallback(query: string, includeAnswer: boolean): Promise<AiSearchFallbackResponse> {
  const keywords = extractKeywords(query);
  const sources = [
    {
      name: "Wikipedia",
      queryUrl: buildWikipediaSearchUrl(keywords.length ? keywords.join(" ") : query),
    },
  ];
  const wikipedia = await fetchWikipediaSources(query);

  const response: AiSearchFallbackResponse = {
    mode: "fallback",
    message: "No relevant posts found in the app.",
    suggestions: {
      keywords,
      sources,
    },
    external: {
      wikipedia,
    },
  };

  if (includeAnswer) {
    response.answer = buildFallbackAnswer(query, wikipedia);
  }

  return response;
}

export async function searchPosts(
  query: string,
  limit?: number,
  includeAnswer = false
): Promise<AiSearchResponse> {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return buildFallback(query, includeAnswer);
  }

  const safeLimit = clampLimit(limit);
  const cacheKey = `${normalized}:${safeLimit}:${includeAnswer ? "1" : "0"}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const modelName = getEmbeddingModelName();
  const queryEmbedding = await generateEmbedding(query);

  const candidates: PostLean[] = await Post.find()
    .sort({ createdAt: -1 })
    .limit(CANDIDATE_LIMIT)
    .lean<PostLean[]>()
    .exec();

  const scored: ScoredPost[] = [];

  for (const post of candidates) {
    if (!post.text?.trim()) continue;
    const embedding = await ensureEmbedding(post, modelName);
    if (!embedding) continue;

    const score = cosineSimilarity(queryEmbedding, embedding);
    scored.push({
      postId: String(post._id),
      text: post.text,
      title: getPostTitle(post.text),
      excerpt: getPostExcerpt(post.text),
      score,
    });
  }

  const filtered = scored
    .filter((item) => item.score >= RELEVANCE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit);

  let result: AiSearchResponse;
  if (filtered.length > 0) {
    const response: AiSearchLocalResponse = {
      mode: "local",
      results: filtered.map(({ postId, title, excerpt, score }) => ({
        postId,
        title,
        excerpt,
        score,
      })),
      threshold: RELEVANCE_THRESHOLD,
    };

    if (includeAnswer) {
      const summaryPosts: LocalPostSummaryInput[] = filtered.slice(0, 5).map((item) => ({
        postId: item.postId,
        title: item.title,
        text: item.text,
        score: item.score,
      }));
      response.answer = buildLocalAnswer(query, summaryPosts);
    }

    result = response;
  } else {
    result = await buildFallback(query, includeAnswer);
  }

  cache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}
