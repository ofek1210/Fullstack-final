import type { AiProvider } from "./ai.provider";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

type EmbedderOutput = {
  data?: Float32Array | number[];
};

type Embedder = (
  text: string,
  options?: { pooling?: "mean"; normalize?: boolean }
) => Promise<EmbedderOutput | Float32Array | number[]>;

let embedderPromise: Promise<Embedder> | null = null;

async function loadEmbedder(): Promise<Embedder> {
  if (!embedderPromise) {
    embedderPromise = import("@xenova/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", MODEL_NAME)
    ) as Promise<Embedder>;
  }
  return embedderPromise;
}

function toNumberArray(value: unknown): number[] {
  if (value instanceof Float32Array) {
    return Array.from(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => Number(item));
  }
  if (value && typeof value === "object" && "data" in value) {
    const data = (value as { data?: unknown }).data;
    if (data !== undefined) {
      return toNumberArray(data);
    }
  }
  throw new Error("Unsupported embedding output");
}

class LocalEmbeddingProvider implements AiProvider {
  getModelName() {
    return MODEL_NAME;
  }

  async embed(text: string) {
    const embedder = await loadEmbedder();
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return toNumberArray(output);
  }
}

const provider = new LocalEmbeddingProvider();

export function getEmbeddingProvider() {
  return provider;
}

export function getEmbeddingModelName() {
  return provider.getModelName();
}

export async function generateEmbedding(text: string) {
  return provider.embed(text);
}
