import { Link } from "wouter";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { FeedPostItem } from "@/components/feed/FeedPostItem";
import { useListMyFeedPosts } from "@/hooks/use-feed";
import { Button } from "@/components/ui/button";

export function YourPostsPage() {
  const { data: posts, isLoading, isError, refetch, isRefetching } = useListMyFeedPosts();

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">My account</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-foreground">Your posts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage everything you have shared with the community.
          </p>
        </div>
        <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">Could not load your posts.</p>
          <Button
            variant="outline"
            className="mt-4 gap-2 rounded-full"
            onClick={() => void refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={isRefetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Try again
          </Button>
        </div>
      ) : posts?.length ? (
        <div className="space-y-5">
          {posts.map((post) => (
            <FeedPostItem key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-primary/50" />
          <h3 className="mt-4 font-serif text-xl font-bold">No posts yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Share an update, photo, or Seva experience with the community.
          </p>
          <Link
            href="/blog"
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Create a post
          </Link>
        </div>
      )}
    </section>
  );
}