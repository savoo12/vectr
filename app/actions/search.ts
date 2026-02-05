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
    console.log("[v0] Searching index for query:", query);
    const results = await index.search({ 
      query,
      limit: 50,
      reranking: true,
    });

    // Sort by score (highest first)
    const sortedResults = results.sort((a, b) => b.score - a.score);
    
    // Log all results with their scores and content for debugging
    console.log("[v0] Search results:");
    sortedResults.forEach((r, i) => {
      const contentPreview = typeof r.content === 'object' && r.content !== null && 'text' in r.content 
        ? String((r.content as { text: string }).text).substring(0, 150)
        : String(r.content || '').substring(0, 150);
      console.log(`[v0] ${i + 1}. Score: ${r.score.toFixed(4)} | ID: ${r.id}`);
      console.log(`[v0]    Content: ${contentPreview}...`);
    });

    // Use absolute minimum threshold - scores below 0.1 are likely not relevant
    // Also use relative threshold - only include if within 60% of top score
    const ABSOLUTE_MIN = 0.1;
    const topScore = sortedResults[0]?.score ?? 0;
    const relativeThreshold = topScore * 0.6;
    const threshold = Math.max(ABSOLUTE_MIN, relativeThreshold);
    
    console.log(`[v0] Top score: ${topScore}, Relative threshold: ${relativeThreshold}, Final threshold: ${threshold}`);
    
    const data = sortedResults
      .filter((result) => result.score >= threshold)
      .map((result) => result.metadata)
      .filter(Boolean) as unknown as PutBlobResult[];
    
    console.log("[v0] Filtered results count:", data.length);

    console.log("Images found:", data);
    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return { error: message };
  }
};
