"use server";

import { generateObject } from "ai";
import { Search } from "@upstash/search";
import type { PutBlobResult } from "@vercel/blob";
import { z } from "zod";

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

/**
 * AI-powered re-ranking: takes the top candidate results from Upstash and
 * asks xAI to verify which ones actually match the query. This solves the
 * problem where generic terms like "red shirt" loosely match many images.
 */
async function rerankWithAI(
  query: string,
  candidates: { blob: PutBlobResult; score: number }[]
): Promise<PutBlobResult[]> {
  if (candidates.length === 0) return [];

  // Build a list of candidates with their URLs for the AI to evaluate
  const candidateList = candidates.map((c, i) => ({
    index: i,
    url: c.blob.downloadUrl,
  }));

  try {
    const { object } = await generateObject({
      model: "xai/grok-2-vision",
      schema: z.object({
        matches: z.array(
          z.object({
            index: z.number().describe("The index of the matching image"),
            relevant: z
              .boolean()
              .describe("Whether this image truly matches the search query"),
          })
        ),
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an image search judge. The user searched for: "${query}"

Below are ${candidateList.length} candidate images. For EACH one, decide if it truly matches the search query "${query}".

Be STRICT: only mark an image as relevant if it clearly and obviously matches. For example:
- "red shirt" → only images where someone is actually wearing a red shirt
- "dog" → only images that actually contain a dog
- "blue car" → only images showing a blue car

Evaluate each image:`,
            },
            ...candidateList.map(
              (c) =>
                ({
                  type: "image" as const,
                  image: c.url,
                })
            ),
          ],
        },
      ],
    });

    // Filter to only relevant results, maintaining original order
    const relevantIndices = new Set(
      object.matches.filter((m) => m.relevant).map((m) => m.index)
    );

    return candidates
      .filter((_, i) => relevantIndices.has(i))
      .map((c) => c.blob);
  } catch {
    // If AI re-ranking fails, fall back to returning all candidates
    return candidates.map((c) => c.blob);
  }
}

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

    // First pass: use a low threshold to get a broad set of candidates.
    // The AI re-ranker will do the precise filtering.
    const MIN_THRESHOLD = 0.4;
    const candidates = sorted
      .filter((result) => result.score >= MIN_THRESHOLD)
      .map((result) => ({
        blob: result.metadata as unknown as PutBlobResult,
        score: result.score,
      }))
      .filter((c) => c.blob);

    // Take top 10 candidates max to limit AI vision API calls
    const topCandidates = candidates.slice(0, 10);

    // Second pass: AI verifies which images truly match the query
    const data = await rerankWithAI(query, topCandidates);

    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return { error: message };
  }
};
