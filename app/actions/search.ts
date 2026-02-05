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
      limit: 50,
      reranking: true,
    });

    // Sort by score first
    const sortedResults = results.sort((a, b) => b.score - a.score);
    
    // Get the top score and filter results relative to it
    // Only include results within 50% of the top score to ensure relevance
    const topScore = sortedResults[0]?.score ?? 0;
    const dynamicThreshold = topScore * 0.5;
    
    console.log("[v0] Top score:", topScore, "Dynamic threshold:", dynamicThreshold);
    console.log("[v0] All results:", sortedResults.map(r => ({ 
      id: r.id, 
      score: r.score,
      included: r.score >= dynamicThreshold
    })));
    
    const data = sortedResults
      .filter((result) => result.score >= dynamicThreshold)
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
