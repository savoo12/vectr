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
    const results = await index.search({
      query,
      limit: 20,
    });

    const sorted = results.sort((a, b) => b.score - a.score);

    // Two-tier filtering:
    // 1. Always include results scoring >= 0.6 (strong matches)
    // 2. For results between 0.4 and 0.6, include them only if they are
    //    within 75% of the top score (relative relevance to best match).
    //    This helps with specific queries like "red shirt" where the best
    //    match may score below 0.6 but is still clearly relevant.
    const STRONG_THRESHOLD = 0.6;
    const MIN_THRESHOLD = 0.4;
    const topScore = sorted.length > 0 ? sorted[0].score : 0;
    const relativeThreshold = topScore * 0.75;

    const data = sorted
      .filter((result) => {
        if (result.score >= STRONG_THRESHOLD) return true;
        if (result.score >= MIN_THRESHOLD && result.score >= relativeThreshold)
          return true;
        return false;
      })
      .map((result) => result.metadata)
      .filter(Boolean) as unknown as PutBlobResult[];

    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return { error: message };
  }
};
