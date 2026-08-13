import { useState } from "react";
import {
  FeedPost,
  useDeleteFeedPost,
  useReportFeedPost,
  useToggleFeedPostLike,
  useShareFeedPost,
} from "@/hooks/use-feed";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  MapPin,
  Flag,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { FeedComments } from "./FeedComments";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/user-avatar";
import { Link } from "wouter";
import { formatRelativeTime, useLanguage } from "@/lib/language-context";
import { FeedVideo } from "./FeedVideo";

export function FeedPostItem({ post }: { post: FeedPost }) {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const CHUNK = 10;
  const [visibleLines, setVisibleLines] = useState(CHUNK);
  const [isSharing, setIsSharing] = useState(false);

  const postLines = post.text ? post.text.split("\n") : [];
  const hasMore = postLines.length > visibleLines;
  const displayedText = postLines.slice(0, visibleLines).join("\n");
  const toggleLike = useToggleFeedPostLike();
  const sharePost = useShareFeedPost();
  const deletePost = useDeleteFeedPost();
  const reportPost = useReportFeedPost();
  const { toast } = useToast();

  const copy =
    language === "hi"
      ? {
          deletePost: "पोस्ट हटाएं",
          reportPost: "पोस्ट रिपोर्ट करें",
          postDeleted: "पोस्ट हटा दी गई",
          postRemoved: "आपकी पोस्ट फीड से हटा दी गई है।",
          deleteFailed: "पोस्ट हटाई नहीं जा सकी",
          reported: "पोस्ट रिपोर्ट की गई",
          reportThanks: "धन्यवाद। हमारी टीम इस पोस्ट की समीक्षा करेगी।",
          reportFailed: "पोस्ट रिपोर्ट नहीं की जा सकी",
          alreadyReported: "आपने इस पोस्ट की पहले ही रिपोर्ट कर दी है।",
          loginToReport: "पोस्ट रिपोर्ट करने के लिए लॉग इन करें",
          reportLoginHint: "रिपोर्ट दर्ज करने के लिए कृपया लॉग इन करें।",
          tryAgain: "कृपया फिर प्रयास करें।",
          deleteTitle: "यह पोस्ट हटाएं?",
          deleteWarning: "यह कार्रवाई पूर्ववत नहीं की जा सकती। आपकी पोस्ट और उससे जुड़ी प्रतिक्रियाएं फीड से हटा दी जाएंगी।",
          cancel: "रद्द करें",
          deleting: "हटाया जा रहा है...",
        }
      : language === "mr"
        ? {
            deletePost: "पोस्ट हटवा",
            reportPost: "पोस्ट रिपोर्ट करा",
            postDeleted: "पोस्ट हटवली",
            postRemoved: "तुमची पोस्ट फीडमधून हटवली आहे.",
            deleteFailed: "पोस्ट हटवता आली नाही",
            reported: "पोस्ट रिपोर्ट केली",
            reportThanks: "धन्यवाद. आमची टीम या पोस्टचे पुनरावलोकन करेल.",
            reportFailed: "पोस्ट रिपोर्ट करता आली नाही",
            alreadyReported: "तुम्ही या पोस्टची आधीच रिपोर्ट केली आहे.",
            loginToReport: "पोस्ट रिपोर्ट करण्यासाठी लॉग इन करा",
            reportLoginHint: "रिपोर्ट नोंदवण्यासाठी कृपया लॉग इन करा.",
            tryAgain: "कृपया पुन्हा प्रयत्न करा.",
            deleteTitle: "ही पोस्ट हटवायची?",
            deleteWarning: "ही कृती पूर्ववत करता येणार नाही. तुमची पोस्ट आणि तिच्याशी संबंधित प्रतिक्रिया फीडमधून हटवल्या जातील.",
            cancel: "रद्द करा",
            deleting: "हटवत आहे...",
          }
        : {
            deletePost: "Delete post",
            reportPost: "Report post",
            postDeleted: "Post deleted",
            postRemoved: "Your post has been removed from the feed.",
            deleteFailed: "Couldn't delete post",
            reported: "Post reported",
            reportThanks: "Thank you. Our team will review this post.",
            reportFailed: "Couldn't report post",
            alreadyReported: "You have already reported this post.",
            loginToReport: "Login in to report a post",
            reportLoginHint: "Please login in so we can record your report.",
            tryAgain: "Please try again.",
            deleteTitle: "Delete this post?",
            deleteWarning: "This action cannot be undone. Your post and its interactions will be removed from the feed.",
            cancel: "Cancel",
            deleting: "Deleting...",
          };

  const handleLike = () => {
    if (!isAuthenticated) return;
    toggleLike.mutate(post.id);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    sharePost.mutate(post.id);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.authorName}`,
          text: post.text || `See ${post.authorName}'s community post`,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      setIsSharing(true);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Post link copied",
          description: "Share it on WhatsApp, Facebook, X, or any other app.",
        });
      } else {
        window.prompt("Copy this post link", shareUrl);
      }
    } catch {
      toast({
        title: "Unable to share post",
        description: `Copy this link: ${shareUrl}`,
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        toast({
          title: copy.postDeleted,
          description: copy.postRemoved,
        });
      },
      onError: () => {
        setShowDeleteConfirm(false);
        toast({
          title: copy.deleteFailed,
          description: copy.tryAgain,
          variant: "destructive",
        });
      },
    });
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      toast({
        title: copy.loginToReport,
        description: copy.reportLoginHint,
      });
      setShowMenu(false);
      return;
    }

    reportPost.mutate(post.id, {
      onSuccess: () => {
        toast({
          title: copy.reported,
          description: copy.reportThanks,
        });
        setShowMenu(false);
      },
      onError: (error: any) => {
        toast({
          title: copy.reportFailed,
          description:
            error?.message?.includes("409") || error?.status === 409
              ? copy.alreadyReported
              : copy.tryAgain,
          variant: "destructive",
        });
        setShowMenu(false);
      },
    });
  };

  // Masonry-ish grid for media
  const renderMediaItem = (
    media: FeedPost["media"][number],
    className: string,
  ) => {
    if (media.type === "video") {
      return <FeedVideo src={media.url} className={className} />;
    }

    return <img src={media.url} alt="" className={className} loading="lazy" />;
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;
    
    if (post.media.length === 1) {
      return (
        <div className="mt-3 rounded-2xl overflow-hidden border bg-muted max-h-[500px]">
          {renderMediaItem(post.media[0], "w-full h-full object-contain")}
        </div>
      );
    }
    
    if (post.media.length === 2) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl overflow-hidden max-h-[400px]">
          {post.media.map((m, i) => (
            <div key={i} className="min-w-0 border bg-muted">
              {renderMediaItem(m, "w-full h-full object-cover")}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl overflow-hidden max-h-[400px]">
        <div className="row-span-2 min-w-0 border bg-muted">
          {renderMediaItem(post.media[0], "w-full h-full object-cover")}
        </div>
        <div className="h-[196px] min-w-0 border bg-muted">
          {renderMediaItem(post.media[1], "w-full h-full object-cover")}
        </div>
        {post.media.length > 2 && (
          <div className="relative h-[196px]">
            {renderMediaItem(post.media[2], "w-full h-full object-cover border bg-muted")}
            {post.media.length > 3 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl border">
                +{post.media.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl border shadow-[0_2px_8px_rgba(83,52,24,0.04)] overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/members/${post.authorId}`}
              aria-label={`View ${post.authorName}'s public profile`}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <UserAvatar
                name={post.authorName}
                imageUrl={post.authorProfileImageUrl}
                className="h-10 w-10 bg-secondary text-sm font-bold text-secondary-foreground shadow-sm transition-transform hover:scale-105"
                fallbackClassName="bg-secondary text-secondary-foreground"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/members/${post.authorId}`}
                  className="font-semibold text-foreground hover:text-primary"
                >
                  {post.authorName}
                </Link>
                {post.badge && (
                  <span className={`inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider shadow-sm ${
                    post.badge === 'admin' ? 'border-red-200 bg-red-100 text-red-700' :
                    post.badge === 'volunteer' ? 'border-amber-200 bg-amber-100 text-amber-800' :
                    post.badge === 'member' ? 'border-primary/20 bg-primary/10 text-primary' :
                    'border-secondary/35 bg-secondary/15 text-foreground shadow-secondary/10 dark:text-secondary'
                  }`}>
                    {post.badge !== 'admin' && post.badge !== 'volunteer' && post.badge !== 'member' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                    {post.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span>{formatRelativeTime(new Date(post.createdAt), language)}</span>
                {post.city && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><MapPin size={10} /> {post.city}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              aria-label="Post actions"
              aria-expanded={showMenu}
              onClick={() => setShowMenu((current) => !current)}
              className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
            >
            <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border bg-card py-1 shadow-lg">
                {post.isAuthor ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    disabled={deletePost.isPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    {copy.deletePost}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReport}
                    disabled={reportPost.isPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted disabled:opacity-60"
                  >
                    <Flag size={16} />
                    {copy.reportPost}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Text content */}
        {post.text && (
          <div>
            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-[15px] break-words overflow-wrap-anywhere">
              {displayedText}
              {hasMore && "…"}
            </p>
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleLines((v) => v + CHUNK)}
                className="mt-1 text-sm font-medium text-primary hover:underline"
              >
                See more
              </button>
            )}
          </div>
        )}

        {/* Media */}
        {renderMedia()}
      </div>

      {/* Action Bar */}
      <div className="px-4 py-2 border-t border-b flex items-center justify-between bg-muted/20">
        <button
          type="button"
          onClick={handleLike}
          aria-pressed={post.likedByViewer}
          className={`group flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 ${
            post.likedByViewer 
              ? "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ThumbsUp
            size={20}
            className={`transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-90 ${
              post.likedByViewer ? "fill-current" : ""
            }`}
          />
          <span className="font-medium text-sm">{post.counts.likes > 0 ? post.counts.likes : "Like"}</span>
        </button>
        
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          aria-expanded={showComments}
          className={`group flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 ${
            showComments
              ? "bg-primary/10 text-primary hover:bg-primary/15"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <MessageCircle
            size={20}
            strokeWidth={showComments ? 2.5 : 2}
            className={`transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-90 ${
              showComments ? "fill-primary/20 text-primary" : ""
            }`}
          />
          <span className="font-medium text-sm">{post.counts.comments > 0 ? post.counts.comments : "Comment"}</span>
        </button>
        
        <button
           type="button"
          onClick={handleShare}
           disabled={isSharing || sharePost.isPending}
           className="flex items-center gap-2 rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-wait disabled:opacity-60"
        >
          <Share2 size={20} />
          <span className="font-medium text-sm">{post.counts.shares > 0 ? post.counts.shares : "Share"}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <FeedComments postId={post.id} />
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletePost.isPending) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-post-title-${post.id}`}
            aria-describedby={`delete-post-description-${post.id}`}
            className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl"
          >
            <h2
              id={`delete-post-title-${post.id}`}
              className="font-serif text-xl font-bold text-foreground"
            >
              {copy.deleteTitle}
            </h2>
            <p
              id={`delete-post-description-${post.id}`}
              className="mt-2 text-sm leading-relaxed text-muted-foreground"
            >
              {copy.deleteWarning}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletePost.isPending}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletePost.isPending}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletePost.isPending ? copy.deleting : copy.deletePost}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
