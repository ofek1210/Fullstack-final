import { api } from "../../lib/api";

export type AiSearchLocalResult = {
  postId: string;
  title: string;
  excerpt: string;
  score: number;
};

export type AiExternalSource = {
  title: string;
  snippet: string;
  url: string;
};

export type AiSearchLocalResponse = {
  mode: "local";
  results: AiSearchLocalResult[];
  threshold: number;
  answer?: AiAnswer;
};

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

export type AiAnswer = {
  summary: string;
  confidence: number;
  sources: Array<{ name: string; url: string }>;
};

export async function queryAi(query: string, limit?: number, includeAnswer?: boolean) {
  return api<AiSearchResponse>("/ai/search", {
    method: "POST",
    body: JSON.stringify({ query, limit, includeAnswer }),
  });
}
