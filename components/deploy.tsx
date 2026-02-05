import Image from "next/image";

export const DeployButton = () => {
  const url = new URL("https://vercel.com/new/clone");

  // Demo
  url.searchParams.set(
    "demo-description",
    "Search your photos using natural language. Just describe what you're looking for."
  );
  url.searchParams.set("demo-title", "Picsearch");

  // Marketplace
  url.searchParams.set("from", "templates");
  url.searchParams.set("project-name", "Picsearch");

  // Integrations
  url.searchParams.set(
    "products",
    JSON.stringify([
      {
        type: "integration",
        protocol: "storage",
        productSlug: "upstash-search",
        integrationSlug: "upstash",
      },
      { type: "blob" },
    ])
  );
  url.searchParams.set("skippable-integrations", "0");

  return (
    <a href={url.toString()}>
      <Image
        alt="Deploy with Vercel"
        height={32}
        src="https://vercel.com/button"
        unoptimized
        width={103}
      />
    </a>
  );
};
