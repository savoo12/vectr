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

    const SCORE_THRESHOLD = 0.6;
    const data = sorted
      .filter((result) => result.score >= SCORE_THRESHOLD)
      .map((result) => result.metadata)
      .filter(Boolean) as unknown as PutBlobResult[];

    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return { error: message };
  }
};
