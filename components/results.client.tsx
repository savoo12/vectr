"use client";

import type { ListBlobResult } from "@vercel/blob";
import {
  ArrowLeftIcon,
  FileIcon,
  ImageIcon,
  ImageUpIcon,
  Loader2Icon,
  SearchIcon,
  UploadIcon,
} from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { search } from "@/app/actions/search";
import { Preview } from "./preview";
import { Button } from "./ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { Input } from "./ui/input";
import { UploadButton } from "./upload-button";
import { useUploadedImages } from "./uploaded-images-provider";

type ResultsClientProps = {
  defaultData: ListBlobResult["blobs"];
};

const PRIORITY_COUNT = 12;

export const ResultsClient = ({ defaultData }: ResultsClientProps) => {
  const { images } = useUploadedImages();
  const [state, formAction, isPending] = useActionState(search, undefined);

  useEffect(() => {
    if (state && "error" in state) {
      toast.error(state.error);
    }
  }, [state]);

  const reset = () => {
    window.location.reload();
  };

  const searchPerformed = state !== undefined && "data" in state;
  const searchHasResults = searchPerformed && state.data.length > 0;
  const searchEmpty = searchPerformed && state.data.length === 0;
  const searchErrored = state !== undefined && "error" in state;

  const hasImages = images.length > 0 || defaultData.length > 0 || searchHasResults;

  return (
    <>
      {searchErrored ? (
        <Empty className="h-full min-h-[50vh] rounded-lg border">
          <EmptyHeader className="max-w-none">
            <div className="relative isolate mb-8 flex">
              <div className="rounded-full border bg-background p-3 shadow-xs">
                <SearchIcon className="size-5 text-muted-foreground" />
              </div>
            </div>
            <EmptyTitle>Search error</EmptyTitle>
            <EmptyDescription>
              {state && "error" in state ? state.error : "An unknown error occurred."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : searchEmpty ? (
        <Empty className="h-full min-h-[50vh] rounded-lg border">
          <EmptyHeader className="max-w-none">
            <div className="relative isolate mb-8 flex">
              <div className="rounded-full border bg-background p-3 shadow-xs">
                <SearchIcon className="size-5 text-muted-foreground" />
              </div>
            </div>
            <EmptyTitle>No matching images</EmptyTitle>
            <EmptyDescription>
              No images matched your search. Try a different description or
              broader terms.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : hasImages ? (
        <div className="gap-4 sm:columns-2 md:columns-3 lg:columns-2 xl:columns-3">
          {images.map((image, index) => (
            <Preview
              key={image.url}
              priority={index < PRIORITY_COUNT}
              url={image.url}
            />
          ))}
          {searchHasResults
            ? state.data.map((blob, index) => (
                <Preview
                  key={blob.url}
                  priority={index < PRIORITY_COUNT}
                  url={blob.url}
                />
              ))
            : defaultData.map((blob, index) => (
                <Preview
                  key={blob.url}
                  priority={index < PRIORITY_COUNT}
                  url={blob.downloadUrl}
                />
              ))}
        </div>
      ) : (
        <Empty className="h-full min-h-[50vh] rounded-lg border">
          <EmptyHeader className="max-w-none">
            <div className="relative isolate mb-8 flex">
              <div className="-rotate-12 translate-x-2 translate-y-2 rounded-full border bg-background p-3 shadow-xs">
                <ImageIcon className="size-5 text-muted-foreground" />
              </div>
              <div className="z-10 rounded-full border bg-background p-3 shadow-xs">
                <UploadIcon className="size-5 text-muted-foreground" />
              </div>
              <div className="-translate-x-2 translate-y-2 rotate-12 rounded-full border bg-background p-3 shadow-xs">
                <FileIcon className="size-5 text-muted-foreground" />
              </div>
            </div>
            <EmptyTitle>No images found</EmptyTitle>
            <EmptyDescription>
              Upload some images with the{" "}
              <ImageUpIcon className="inline size-4" /> button below to get
              started!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <form
        action={formAction}
        className="-translate-x-1/2 fixed bottom-8 left-1/2 flex w-full max-w-sm items-center gap-1 rounded-full bg-background p-1 shadow-xl sm:max-w-lg lg:ml-[182px]"
      >
        {(searchPerformed || searchErrored) && (
          <Button
            className="shrink-0 rounded-full"
            disabled={isPending}
            onClick={reset}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Clear search results</span>
          </Button>
        )}
        <Input
          className="w-full rounded-full border-none bg-secondary shadow-none outline-none"
          disabled={isPending || !hasImages}
          id="search"
          name="search"
          placeholder="Search by description"
          required
        />
        {isPending ? (
          <Button className="shrink-0 rounded-full" disabled size="icon" variant="ghost">
            <Loader2Icon className="size-4 animate-spin" />
            <span className="sr-only">Searching</span>
          </Button>
        ) : (
          <>
            <Button
              className="shrink-0 rounded-full"
              disabled={!hasImages}
              size="icon"
              type="submit"
              variant="ghost"
            >
              <SearchIcon className="size-4" />
              <span className="sr-only">Search</span>
            </Button>
            <UploadButton />
          </>
        )}
      </form>
    </>
  );
};
