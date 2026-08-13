import { useEffect, useRef, useCallback, useState } from "react";
import { useListFeedPosts } from "@/hooks/use-feed";
import { FeedPostComposer } from "@/components/feed/FeedPostComposer";
import { FeedPostItem } from "@/components/feed/FeedPostItem";
import { Loader2, RefreshCw, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BlogPage() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching
  } = useListFeedPosts();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const PULL_THRESHOLD = 72;
  
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingNextPage) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Handle case where we don't have enough posts to trigger scrolling
  useEffect(() => {
    if (data?.pages[0]?.items.length && data.pages[0].items.length < 5 && hasNextPage && !isFetchingNextPage) {
      // Just in case it's a short initial fetch
    }
  }, [data, hasNextPage, isFetchingNextPage]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.currentTarget.scrollTop === 0 && !isRefetching) {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null || isRefetching) return;

    const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
    const distance = currentY - touchStartYRef.current;

    if (distance <= 0 || event.currentTarget.scrollTop > 0) {
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    event.preventDefault();
    setPullDistance(Math.min(distance * 0.5, 96));
    setIsPulling(true);
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null) return;

    const shouldRefresh = pullDistance >= PULL_THRESHOLD;
    touchStartYRef.current = null;

    if (shouldRefresh) {
      setPullDistance(PULL_THRESHOLD);
      setIsPulling(false);
      void refetch().finally(() => {
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  return (
    <div className="w-full h-full relative flex flex-col bg-background">
      {/* Subtle mandala background */}
      <div className="mandala-bg" />

      {/* Main scrollable area */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar relative z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ overscrollBehaviorY: "contain" }}
      >
        <div
          className="flex items-center justify-center gap-2 overflow-hidden text-sm text-muted-foreground transition-[height] duration-200"
          style={{
            height: isRefetching ? 48 : pullDistance,
            minHeight: isRefetching ? 48 : 0,
          }}
          aria-live="polite"
        >
          <RefreshCw
            size={18}
            className={isRefetching ? "animate-spin text-primary" : ""}
            style={{
              transform: `rotate(${Math.min(pullDistance / PULL_THRESHOLD, 1) * 180}deg)`,
            }}
          />
          <span>
            {isRefetching
              ? "Refreshing..."
              : pullDistance >= PULL_THRESHOLD
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </div>
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">
          {/* Composer */}
          <div className="mb-6">
            <FeedPostComposer />
          </div>

          {/* Feed List */}
          {isError ? (
            <div className="bg-card border rounded-2xl p-8 text-center">
              <p className="text-muted-foreground mb-4">Could not load the feed. Please try again.</p>
              <Button onClick={() => refetch()} variant="outline">Retry</Button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data?.pages[0]?.items.length === 0 ? (
            <div className="bg-card border border-dashed rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <HeartHandshake size={32} />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">Welcome to the Feed</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                This is where members share their Seva experiences. Be the first to post an update!
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {data?.pages.map((page, i) => (
                <div key={i} className="space-y-5">
                  {page.items.map((post) => (
                    <FeedPostItem key={post.id} post={post} />
                  ))}
                </div>
              ))}
              
              {/* Infinite scroll sentinel */}
              <div 
                ref={lastElementRef} 
                className="py-8 flex justify-center"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : hasNextPage ? (
                  <span className="text-sm text-muted-foreground">Scroll for more</span>
                ) : (
                  <div className="text-center">
                    <HeartHandshake className="w-6 h-6 text-primary/40 mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">You've reached the end of the feed</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
