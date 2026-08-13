import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { useGetFeedPost } from "@/hooks/use-feed";
import { FeedPostItem } from "@/components/feed/FeedPostItem";
import { Button } from "@/components/ui/button";

export function SharedPostPage() {
  const params = useParams();
  const postId = Number(params.id);
  const { data: post, isLoading, isError } = useGetFeedPost(postId);

  if (isLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-3xl font-bold">Post not found</h1>
        <p className="mt-2 text-muted-foreground">
          This post may have been removed or is no longer available.
        </p>
        <Link href="/blog" className="mt-6">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to community
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to community
      </Link>
      <FeedPostItem post={post} />
    </div>
  );
}