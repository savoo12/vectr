import { Search } from "@upstash/search";
import { NextResponse } from "next/server";

const upstash = new Search({
  url: process.env.UPSTASH_SEARCH_REST_URL!,
  token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
});

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "dog";

  try {
    const index = upstash.index("images");

    // Try searching
    const results = await index.search({
      query,
      limit: 20,
    });

    return NextResponse.json({
      query,
      resultCount: results.length,
      results: results.map((r) => ({
        id: r.id,
        score: r.score,
        metadata: r.metadata,
        content: typeof r.content === "string" ? r.content.slice(0, 200) : r.content,
      })),
      env: {
        hasUrl: !!process.env.UPSTASH_SEARCH_REST_URL,
        hasToken: !!process.env.UPSTASH_SEARCH_REST_TOKEN,
        urlPrefix: process.env.UPSTASH_SEARCH_REST_URL?.slice(0, 30) + "...",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        env: {
          hasUrl: !!process.env.UPSTASH_SEARCH_REST_URL,
          hasToken: !!process.env.UPSTASH_SEARCH_REST_TOKEN,
        },
      },
      { status: 500 }
    );
  }
};
