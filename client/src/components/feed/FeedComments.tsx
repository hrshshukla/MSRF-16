import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useListFeedPostComments, useCreateFeedPostComment } from "@/hooks/use-feed";
import { Loader2, Send, Smile } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { Link } from "wouter";
import { formatRelativeTime, useLanguage } from "@/lib/language-context";

export function FeedComments({ postId }: { postId: string }) {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const { data: comments, isLoading } = useListFeedPostComments(postId);
  const createComment = useCreateFeedPostComment();
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const emojiRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !isAuthenticated) return;
    
    createComment.mutate(
      { postId, text },
      {
        onSuccess: () => {
          setText("");
          setShowEmojis(false);
        }
      }
    );
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    };
    if (showEmojis) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojis]);

  useEffect(() => {
    const textarea = commentInputRef.current;
    if (!textarea) return;

    const maxHeight = 240;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${Math.max(nextHeight, 44)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [text]);

  const EMOJI_LIST = ["🙏", "🌸", "🙌", "🕉️", "🚩", "👏", "❤️", "🌺"];
  const LONG_COMMENT_LENGTH = 180;

  const toggleCommentExpanded = (commentId: string) => {
    setExpandedCommentIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  return (
    <div className="bg-card px-4 sm:px-5 py-4">
      {/* Comments List */}
      <div className="space-y-4 mb-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments?.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-2">No comments yet. Be the first to reply!</p>
        ) : (
          comments?.map((comment) => (
            <div key={comment.id} className="flex min-w-0 gap-3">
              <Link
                href={`/members/${comment.authorId}`}
                aria-label={`View ${comment.authorName}'s public profile`}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <UserAvatar
                  name={comment.authorName}
                  imageUrl={comment.authorProfileImageUrl}
                  className="h-8 w-8 bg-primary/10 text-xs font-bold text-primary transition-transform hover:scale-105"
                  fallbackClassName="bg-primary/10 text-primary"
                />
              </Link>
              <div className="min-w-0 max-w-full flex-1 overflow-hidden bg-muted/30 rounded-2xl rounded-tl-none px-4 py-2.5">
                <div className="flex min-w-0 items-baseline justify-between gap-2 mb-1">
                  <Link
                    href={`/members/${comment.authorId}`}
                    className="min-w-0 break-words font-semibold text-sm hover:text-primary"
                  >
                    {comment.authorName}
                  </Link>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(new Date(comment.createdAt), language)}
                  </span>
                </div>
                <p
                  className={`break-words text-sm text-foreground/90 whitespace-pre-wrap [overflow-wrap:anywhere] ${
                    comment.text.length > LONG_COMMENT_LENGTH &&
                    !expandedCommentIds.has(comment.id)
                      ? "line-clamp-3"
                      : ""
                  }`}
                >
                  {comment.text}
                </p>
                {comment.text.length > LONG_COMMENT_LENGTH && (
                  <button
                    type="button"
                    onClick={() => toggleCommentExpanded(comment.id)}
                    className="mt-1 text-xs font-semibold text-primary hover:text-primary/80"
                    aria-expanded={expandedCommentIds.has(comment.id)}
                  >
                    {expandedCommentIds.has(comment.id) ? "See less" : "See more"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="relative flex min-w-0 gap-3">
          <UserAvatar
            name={user?.name || "User"}
            imageUrl={user?.profileImageUrl}
            className="mt-1 h-8 w-8 bg-primary text-xs font-bold text-primary-foreground"
            fallbackClassName="bg-primary text-primary-foreground"
          />
          <div className="relative min-w-0 flex-1 flex items-end">
            <textarea
              ref={commentInputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              rows={1}
              className="w-full min-h-[44px] max-h-60 rounded-2xl border bg-transparent px-4 py-2.5 pr-20 text-sm resize-none overflow-y-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary no-scrollbar"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            <div className="absolute right-10 bottom-2 flex items-center" ref={emojiRef}>
              <button
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className="p-1.5 text-muted-foreground hover:text-primary rounded-full transition-colors"
                aria-label="Insert emoji"
              >
                <Smile size={18} />
              </button>
              
              {showEmojis && (
                <div className="absolute bottom-full right-0 mb-2 bg-card border shadow-lg rounded-xl p-2 grid grid-cols-4 gap-1 z-10 w-40">
                  {EMOJI_LIST.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!text.trim() || createComment.isPending}
              className="absolute right-2 bottom-2 p-1.5 text-primary disabled:text-muted-foreground hover:bg-primary/10 rounded-full transition-colors"
            >
              {createComment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </form>
      ) : (
        <Link
          href="/signup"
          className="flex w-full items-center justify-center rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Create an account to leave a comment.
        </Link>
      )}
    </div>
  );
}
