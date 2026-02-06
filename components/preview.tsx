import Image from "next/image";

type PreviewProps = {
  url: string;
  priority?: boolean;
};

export const Preview = ({ url, priority }: PreviewProps) => (
  <div className="mb-4 rounded-xl bg-card p-2 shadow-xl">
    <Image
      alt={url}
      className="h-auto w-full rounded-md"
      height={630}
      loading={priority ? "eager" : "lazy"}
      priority={priority}
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
      src={url}
      width={630}
    />
  </div>
);
