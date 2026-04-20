"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPosts = searchPosts;
const Post_1 = require("../../models/Post");
const localEmbedding_provider_1 = require("./localEmbedding.provider");
const summarizer_1 = require("./summarizer");
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const CANDIDATE_LIMIT = 200;
const RELEVANCE_THRESHOLD = 0.4;
function normalizeQuery(query) {
    return query.trim().toLowerCase();
}
function stripHtml(input) {
    return input.replace(/<[^>]*>/g, "");
}
function clampLimit(limit) {
    const raw = typeof limit === "number" ? limit : DEFAULT_LIMIT;
    return Math.min(Math.max(raw, 1), MAX_LIMIT);
}
function getPostTitle(text) {
    const trimmed = text.trim();
    if (!trimmed)
        return "Untitled post";
    const firstLine = trimmed.split(/\r?\n/)[0] || trimmed;
    return firstLine.length > 60 ? `${firstLine.slice(0, 60)}...` : firstLine;
}
function getPostExcerpt(text) {
    const trimmed = text.trim();
    if (trimmed.length <= 140)
        return trimmed;
    return `${trimmed.slice(0, 140)}...`;
}
function cosineSimilarity(a, b) {
    const length = Math.min(a.length, b.length);
    if (!length)
        return 0;
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
    if (!normA || !normB)
        return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
function buildWikipediaSearchUrl(query) {
    return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
}
async function fetchWikipediaSources(query) {
    try {
        const url = `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(query)}&limit=3`;
        const res = await fetch(url);
        if (!res.ok)
            return [];
        const data = (await res.json());
        const pages = data.pages || [];
        return pages.map((page) => ({
            title: page.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            snippet: stripHtml(page.excerpt || ""),
        }));
    }
    catch {
        return [];
    }
}
async function ensureEmbedding(post, modelName) {
    if (post.embedding &&
        post.embedding.length > 0 &&
        post.embeddingModel === modelName &&
        post.embeddingUpdatedAt &&
        post.embeddingUpdatedAt >= post.updatedAt) {
        return post.embedding;
    }
    try {
        const embedding = await (0, localEmbedding_provider_1.generateEmbedding)(post.text);
        await Post_1.Post.updateOne({ _id: post._id }, { embedding, embeddingModel: modelName, embeddingUpdatedAt: new Date() });
        return embedding;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate embedding";
        console.error("Embedding generation failed", { postId: String(post._id), message });
        return null;
    }
}
async function buildFallback(query, includeAnswer) {
    const keywords = (0, summarizer_1.extractKeywords)(query);
    const sources = [
        {
            name: "Wikipedia",
            queryUrl: buildWikipediaSearchUrl(keywords.length ? keywords.join(" ") : query),
        },
    ];
    const wikipedia = await fetchWikipediaSources(query);
    const response = {
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
        response.answer = (0, summarizer_1.buildFallbackAnswer)(query, wikipedia);
    }
    return response;
}
async function searchPosts(query, limit, includeAnswer = false) {
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
    const modelName = (0, localEmbedding_provider_1.getEmbeddingModelName)();
    const queryEmbedding = await (0, localEmbedding_provider_1.generateEmbedding)(query);
    const candidates = await Post_1.Post.find()
        .sort({ createdAt: -1 })
        .limit(CANDIDATE_LIMIT)
        .lean()
        .exec();
    const scored = [];
    for (const post of candidates) {
        if (!post.text?.trim())
            continue;
        const embedding = await ensureEmbedding(post, modelName);
        if (!embedding)
            continue;
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
    let result;
    if (filtered.length > 0) {
        const response = {
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
            const summaryPosts = filtered.slice(0, 5).map((item) => ({
                postId: item.postId,
                title: item.title,
                text: item.text,
                score: item.score,
            }));
            response.answer = (0, summarizer_1.buildLocalAnswer)(query, summaryPosts);
        }
        result = response;
    }
    else {
        result = await buildFallback(query, includeAnswer);
    }
    cache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
}
