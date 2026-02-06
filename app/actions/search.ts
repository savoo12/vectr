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
      debug?: {
        rawCount: number;
        filteredCount: number;
        topScore: number;
        threshold: number;
        scores: number[];
      };
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
    console.log("[v0] Searching index for query:", query);

    let results;
    try {
      results = await index.search({
        query,
        limit: 20,
      });
    } catch (searchError) {
      console.log("[v0] Search call failed:", searchError);
      return { error: "Search failed. Please try again." };
    }

    console.log("[v0] Raw results count:", results.length);
    console.log(
      "[v0] Result scores:",
      JSON.stringify(
        results.map((r) => ({ id: r.id, score: r.score }))
      )
    );

    // Sort by score descending -- Upstash already returns relevant results.
    // Use a relative threshold: only keep results within 50% of the top score.
    // This filters out loosely related results while keeping genuinely relevant ones.
    const sorted = results.sort((a, b) => b.score - a.score);
    const topScore = sorted.length > 0 ? sorted[0].score : 0;
    const threshold = topScore * 0.5;

    console.log("[v0] Top score:", topScore, "Threshold:", threshold);

    const data = sorted
      .filter((result) => result.score >= threshold)
      .map((result) => result.metadata)
      .filter(Boolean) as unknown as PutBlobResult[];

    console.log("[v0] Filtered results count:", data.length);

    return {
      data,
      debug: {
        rawCount: results.length,
        filteredCount: data.length,
        topScore,
        threshold,
        scores: sorted.map((r) => r.score),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return { error: message };
  }
};
