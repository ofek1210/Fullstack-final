import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { queryAi, type AiSearchResponse } from "../features/ai/ai.api";

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) {
    const status = (err as { status?: number }).status;
    if (status === 401) {
      return "You are not authorized. Please log in again.";
    }
    if (status === 429) {
      return "Too many requests. Please wait a minute and try again.";
    }
    if (status && status >= 500) {
      return "AI service is temporarily unavailable. Please try again later.";
    }
    return err.message;
  }
  return fallback;
}

export default function AiSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AiSearchResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [includeAnswer, setIncludeAnswer] = useState(true);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 3) {
      setResult(null);
      setError("");
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      void runQuery(query.trim(), includeAnswer);
    }, 500);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query, includeAnswer]);

  async function runQuery(value: string, includeAnswerFlag: boolean) {
    setIsLoading(true);
    setError("");
    try {
      const data = await queryAi(value, undefined, includeAnswerFlag);
      setResult(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch AI response"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ marginBottom: 0 }}>AI Search</h2>
        <Link to="/feed">Back to feed</Link>
      </div>

      <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
        Search your posts semantically. If nothing matches, we show external sources.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about a topic..."
        style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d0d0d0" }}
      />

      <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
        <input
          type="checkbox"
          checked={includeAnswer}
          onChange={(e) => setIncludeAnswer(e.target.checked)}
        />
        <span>קבל גם תשובת AI</span>
      </label>

      {isLoading && <div style={{ marginTop: 12 }}>Searching...</div>}
      {error && <div style={{ marginTop: 12, color: "#b42318" }}>{error}</div>}

      {result && (
        <div
          style={{
            marginTop: 16,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 12,
            background: "rgba(11, 15, 26, 0.6)",
            boxShadow: "0 14px 30px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(12px)",
            padding: 16,
            color: "#fff",
          }}
        >
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <strong>תוצאות מהאפליקציה</strong>
              {result.mode === "local" ? (
                <>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                    נמצאו {result.results.length} תוצאות (threshold {result.threshold})
                  </div>
                  <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                    {result.results.map((item) => (
                      <div key={item.postId} style={{ display: "grid", gap: 6 }}>
                        <Link to={`/posts/${item.postId}`} style={{ color: "#fff", fontWeight: 600 }}>
                          {item.title}
                        </Link>
                        <div style={{ color: "rgba(255,255,255,0.8)" }}>{item.excerpt}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                          score: {item.score.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ marginTop: 8, color: "rgba(255,255,255,0.7)" }}>
                  לא נמצאו תוצאות רלוונטיות באפליקציה.
                </div>
              )}
            </div>

            {result.answer && (
              <div>
                <strong>תשובת AI</strong>
                <div style={{ marginTop: 8, whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.85)" }}>
                  {result.answer.summary}
                </div>
                {result.answer.sources.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      confidence: {result.answer.confidence.toFixed(2)}
                    </div>
                    <ul style={{ marginTop: 6 }}>
                      {result.answer.sources.map((source) => (
                        <li key={source.url}>
                          <a href={source.url} target="_blank" rel="noreferrer">
                            {source.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {result.mode === "fallback" && (
              <div>
                {result.external.wikipedia.length > 0 && (
                  <>
                    <strong>Wikipedia results</strong>
                    <ul style={{ marginTop: 8 }}>
                      {result.external.wikipedia.map((item) => (
                        <li key={item.url}>
                          <a href={item.url} target="_blank" rel="noreferrer">
                            {item.title}
                          </a>
                          {item.snippet && (
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                              {item.snippet}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {result.suggestions.sources.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <strong>External sources</strong>
                    <ul style={{ marginTop: 8 }}>
                      {result.suggestions.sources.map((source) => (
                        <li key={source.queryUrl}>
                          <a href={source.queryUrl} target="_blank" rel="noreferrer">
                            {source.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
