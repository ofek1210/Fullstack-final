export type AiAnswerSource = {
  name: string;
  url: string;
};

export type AiAnswer = {
  summary: string;
  confidence: number;
  sources: AiAnswerSource[];
};

export type LocalPostSummaryInput = {
  postId: string;
  title: string;
  text: string;
  score: number;
};

export type ExternalSnippet = {
  title: string;
  snippet: string;
  url: string;
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "are",
  "was",
  "were",
  "you",
  "your",
  "about",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "how",
  "but",
  "not",
  "can",
  "could",
  "should",
  "would",
  "into",
  "our",
  "out",
  "use",
  "using",
]);

function clampConfidence(value: number) {
  return Math.max(0.2, Math.min(0.95, Number(value.toFixed(2))));
}

function formatList(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function extractKeywords(text: string) {
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));

  return Array.from(new Set(tokens)).slice(0, 10);
}

function buildLocalSummarySentences(query: string, keywords: string[]) {
  const topic = keywords[0] || query.trim() || "this topic";
  const highlights = keywords.slice(1, 4);
  const secondary = keywords.slice(4, 7);

  const sentence1 = highlights.length
    ? `Based on posts in the app, the discussion around ${topic} focuses on ${formatList(highlights)}.`
    : `Based on posts in the app, users share practical notes and recurring themes around ${topic}.`;

  const sentence2 = secondary.length
    ? `Common threads connect ${formatList(secondary)} with ${topic}.`
    : `The most relevant posts connect ${topic} with day-to-day usage and real examples.`;

  return `${sentence1} ${sentence2}`;
}

function buildBulletInsights(titles: string[], keywords: string[]) {
  const bullets: string[] = [];
  const titleInsights = titles.filter(Boolean).slice(0, 3);
  const keywordInsights = keywords.slice(0, 3);

  for (const title of titleInsights) {
    if (bullets.length >= 3) break;
    bullets.push(`- Common theme: ${title}`);
  }

  while (bullets.length < 3 && keywordInsights.length > 0) {
    const keyword = keywordInsights.shift();
    if (keyword) {
      bullets.push(`- Users often mention ${keyword}.`);
    }
  }

  while (bullets.length < 3) {
    bullets.push("- More insights emerge as new posts are added.");
  }

  return `\n\nInsights:\n${bullets.join("\n")}`;
}

export function buildLocalAnswer(query: string, posts: LocalPostSummaryInput[]): AiAnswer {
  const combinedText = posts.map((post) => post.text).join(" ");
  const keywords = [
    ...extractKeywords(query),
    ...extractKeywords(combinedText),
  ];
  const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 8);
  const summary = buildLocalSummarySentences(query, uniqueKeywords);

  const titles = posts.map((post) => post.title);
  const insights = buildBulletInsights(titles, uniqueKeywords);

  const topScore = posts[0]?.score ?? 0.35;
  const confidence = clampConfidence(0.3 + topScore * 0.7);
  const sources = posts.map((post) => ({
    name: post.title,
    url: `/posts/${post.postId}`,
  }));

  return {
    summary: `${summary}${insights}`,
    confidence,
    sources,
  };
}

export function buildFallbackAnswer(query: string, wikipedia: ExternalSnippet[]): AiAnswer {
  const best = wikipedia[0];
  const topic = best?.title || query.trim() || "this topic";

  const snippet = best?.snippet?.trim() || "";
  const sentence1 = `No relevant posts were found in the app.`;
  const sentence2 = snippet
    ? `Wikipedia suggests that ${snippet.replace(/\.$/, "")}.`
    : `Wikipedia has general background information about ${topic}.`;

  const sentence3 = `This summary is based on external sources.`;
  const summary = `${sentence1} ${sentence2} ${sentence3}`;

  const sources = best
    ? [{ name: "Wikipedia", url: best.url }]
    : [];

  return {
    summary,
    confidence: clampConfidence(0.35),
    sources,
  };
}
