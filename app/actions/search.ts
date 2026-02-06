/** biome-ignore-all lint/suspicious/noConsole: "Handy for debugging" */

"use server";

import { Search } from "@upstash/search";
import type { PutBlobResult } from "@vercel/blob";

const upstash = new Search({
  url: process.env.UPSTASH_SEARCH_REST_URL!,
  token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
});
const index = upstash.index("images");

type SearchResponse =
  | {
      data: PutBlobResult[];
    }
  | {
      error: string;
    };

export const search = async (
  _prevState: SearchResponse | undefined,
  formData: FormData
): Promise<SearchResponse> => {
  const query = formData.get("search");

  if (!query || typeof query !== "string") {
    return { error: "Please enter a search query" };
  }

  try {
    console.log("Searching index for query:", query);
    const results = await index.search({
      query,
      limit: 20,
      reranking: true,
    });

    console.log("[v0] Raw results count:", results.length);
    console.log(
      "[v0] Result scores:",
      results.map((r) => ({ id: r.id, score: r.score }))
    );

    // Use a dynamic threshold: keep results that are at least 60% of the top score.
    // This filters out results that are significantly less relevant than the best match.
    // Also enforce a minimum absolute score to drop completely irrelevant results.
    const MIN_ABSOLUTE_SCORE = 0.3;
    const RELATIVE_THRESHOLD = 0.6;

    const sorted = results.sort((a, b) => b.score - a.score);
    const topScore = sorted.length > 0 ? sorted[0].score : 0;
    const dynamicThreshold = Math.max(
      MIN_ABSOLUTE_SCORE,
      topScore * RELATIVE_THRESHOLD
    );

    console.log(
      "[v0] Top score:",
      topScore,
      "Dynamic threshold:",
      dynamicThreshold
    );

    const data = sorted
      .filter((result) => result.score >= dynamicThreshold)
      .map((result) => result.metadata)
      .filter(Boolean) as unknown as PutBlobResult[];

    console.log("[v0] Filtered results count:", data.length);

    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return { error: message };
  }
};
