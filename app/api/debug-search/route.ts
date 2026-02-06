import { Search } from "@upstash/search";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "dog";

  try {
    const upstash = new Search({
      url: process.env.UPSTASH_SEARCH_REST_URL!,
      token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
    });

    const index = upstash.index("images");

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
        content: r.content,
      })),
      env: {
        hasUrl: !!process.env.UPSTASH_SEARCH_REST_URL,
        hasToken: !!process.env.UPSTASH_SEARCH_REST_TOKEN,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        env: {
          hasUrl: !!process.env.UPSTASH_SEARCH_REST_URL,
          hasToken: !!process.env.UPSTASH_SEARCH_REST_TOKEN,
        },
      },
      { status: 500 }
    );
  }
};
