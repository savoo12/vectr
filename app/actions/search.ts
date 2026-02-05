/** biome-ignore-all lint/suspicious/noConsole: "Handy for debugging" */

"use server";

import { Index } from "@upstash/vector";
import type { PutBlobResult } from "@vercel/blob";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

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
    // Upstash Vector with embedding model handles text-to-vector conversion
    const results = await index.query({
      data: query,
      topK: 20,
      includeMetadata: true,
    });

    console.log("Results:", results);
    const data = results
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((result) => result.metadata)
      .filter(Boolean) as unknown as PutBlobResult[];

    console.log("Images found:", data);
    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return { error: message };
  }
};
