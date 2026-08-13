import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateFeedPost, uploadMedia, type UploadedMedia } from "@/hooks/use-feed";
import { ImagePlus, X, Loader2, Smile } from "lucide-react";
import { Link } from "wouter";
import { UserAvatar } from "@/components/user-avatar";
import { FeedVideo } from "./FeedVideo";

interface SelectedMedia {
  id: string;
  file: File;
  uploaded: UploadedMedia | null;
  previewUrl: string;
  status: "uploading" | "uploaded" | "error";
}

const MAX_POST_LENGTH = 4000;
const MAX_IMAGES = 3;
const MAX_VIDEOS = 2;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

let mediaIdSequence = 0;

function createMediaId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  mediaIdSequence += 1;
  return `media-${Date.now()}-${mediaIdSequence}`;
}

function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Photo upload failed. Please try again.";
}

export function FeedPostComposer() {
  const { user, isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [mediaItems, setMediaItems] = useState<SelectedMedia[]>([]);
  const [mediaMessage, setMediaMessage] = useState("");
  const [hasTextExpanded, setHasTextExpanded] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const cursorPositionRef = useRef(0);

  const createPost = useCreateFeedPost();
  const EMOJI_LIST = [
    "🙏", "🕉️", "🚩", "🪔", "📿",
    "🌸", "🌺", "🌼", "✨", "☀️",
    "🙌", "🤝", "👏", "💛", "❤️",
    "😊", "💪", "🎉", "🌿", "🏵️",
  ];

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !emojiRef.current?.contains(target) &&
        !emojiPickerRef.current?.contains(target)
      ) {
        setShowEmojis(false);
      }
    };

    if (showEmojis) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showEmojis]);

  useEffect(() => {
    if (!text.trim()) {
      setHasTextExpanded(false);
      return;
    }

    const textarea = textAreaRef.current;
    if (
      textarea &&
      !hasTextExpanded &&
      textarea.scrollHeight > textarea.clientHeight + 1
    ) {
      setHasTextExpanded(true);
    }
  }, [text, mediaItems.length, hasTextExpanded]);

  const insertEmoji = (emoji: string) => {
    const currentText = text;
    const cursorPosition = Math.min(
      cursorPositionRef.current,
      currentText.length,
    );
    const nextText =
      currentText.slice(0, cursorPosition) +
      emoji +
      currentText.slice(cursorPosition);
    if (nextText.length > MAX_POST_LENGTH) {
      return;
    }
    const nextCursorPosition = cursorPosition + emoji.length;

    setText(nextText);
    cursorPositionRef.current = nextCursorPosition;

    requestAnimationFrame(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.setSelectionRange(
        nextCursorPosition,
        nextCursorPosition,
      );
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFiles = Array.from(e.target.files);
    const currentImageCount = mediaItems.filter((item) =>
      item.file.type.startsWith("image/"),
    ).length;
    const currentVideoCount = mediaItems.filter((item) =>
      item.file.type.startsWith("video/"),
    ).length;
    let imageCount = currentImageCount;
    let videoCount = currentVideoCount;
    let rejectedImageCount = 0;
    let rejectedVideoCount = 0;
    let rejectedTypeCount = 0;
    let rejectedSizeCount = 0;

    const files = selectedFiles.filter((file) => {
      const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
      const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);

      if (!isImage && !isVideo) {
        rejectedTypeCount += 1;
        return false;
      }

      const maxSize = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
      if (file.size > maxSize) {
        rejectedSizeCount += 1;
        return false;
      }

      if (isImage) {
        if (imageCount >= MAX_IMAGES) {
          rejectedImageCount += 1;
          return false;
        }
        imageCount += 1;
        return true;
      }

      if (isVideo) {
        if (videoCount >= MAX_VIDEOS) {
          rejectedVideoCount += 1;
          return false;
        }
        videoCount += 1;
        return true;
      }

      return false;
    });

    if (
      rejectedImageCount > 0 ||
      rejectedVideoCount > 0 ||
      rejectedTypeCount > 0 ||
      rejectedSizeCount > 0
    ) {
      const limits = [
        rejectedImageCount > 0 ? `up to ${MAX_IMAGES} images` : "",
        rejectedVideoCount > 0 ? `up to ${MAX_VIDEOS} videos` : "",
      ]
        .filter(Boolean)
        .join(" and ");
      const messages = [
        limits ? `You can add ${limits} per post.` : "",
        rejectedTypeCount > 0
          ? `${rejectedTypeCount} file${rejectedTypeCount === 1 ? "" : "s"} use an unsupported format.`
          : "",
        rejectedSizeCount > 0
          ? `${rejectedSizeCount} file${rejectedSizeCount === 1 ? "" : "s"} exceed the upload size limit.`
          : "",
      ].filter(Boolean);
      setMediaMessage(messages.join(" "));
    } else {
      setMediaMessage("");
    }

    if (files.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const pendingItems = files.map((file) => ({
      id: createMediaId(),
      file,
      uploaded: null,
      previewUrl: URL.createObjectURL(file),
      status: "uploading" as const,
    }));

    setMediaItems((prev) => [...prev, ...pendingItems]);
    setIsUploading(true);

    await Promise.all(
      pendingItems.map(async (pendingItem) => {
        try {
          const uploaded = await uploadMedia(pendingItem.file, user!.id);
          setMediaItems((prev) =>
            prev.map((item) =>
              item.id === pendingItem.id
                ? {
                    ...item,
                    uploaded,
                    status: "uploaded",
                  }
                : item,
            ),
          );
        } catch (error) {
          console.error("Upload failed", error);
          setMediaMessage(getUploadErrorMessage(error));
          setMediaItems((prev) =>
            prev.map((item) =>
              item.id === pendingItem.id
                ? { ...item, status: "error" }
                : item,
            ),
          );
        }
      }),
    );

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const retryMediaUpload = async (mediaId: string) => {
    const item = mediaItems.find((media) => media.id === mediaId);
    if (!item || item.status === "uploading") return;

    setMediaItems((prev) =>
      prev.map((media) =>
        media.id === mediaId
          ? { ...media, status: "uploading" }
          : media,
      ),
    );
    setIsUploading(true);

    try {
      const uploaded = await uploadMedia(item.file, user!.id);
      setMediaItems((prev) =>
        prev.map((media) =>
          media.id === mediaId
            ? {
                ...media,
                uploaded,
                status: "uploaded",
              }
            : media,
        ),
      );
      setMediaMessage("");
    } catch (error) {
      console.error("Upload retry failed", error);
      setMediaMessage(getUploadErrorMessage(error));
      setMediaItems((prev) =>
        prev.map((media) =>
          media.id === mediaId ? { ...media, status: "error" } : media,
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (indexToRemove: number) => {
    setMediaMessage("");
    setMediaItems((prev) => {
      const item = prev[indexToRemove];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleSubmit = async () => {
    if (
      (!text.trim() && mediaItems.length === 0) ||
      text.length > MAX_POST_LENGTH ||
      mediaItems.some((item) => item.status !== "uploaded")
    ) {
      return;
    }
    
    try {
      await createPost.mutateAsync({
        text,
        media: mediaItems.map((item) => item.uploaded!),
      });
      setText("");
      mediaItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setMediaItems([]);
    } catch (error) {
      console.error("Failed to post", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-card rounded-2xl p-6 border shadow-sm text-center">
        <h3 className="font-serif text-xl font-semibold mb-2">Share your experience</h3>
        <p className="text-muted-foreground mb-4">Login in to post updates, photos, and connect with the community.</p>
        <Link href="/login" className={buttonVariants({ variant: "default", className: "rounded-full" })}>
          Login in to Post
        </Link>
      </div>
    );
  }

  const hasMedia = mediaItems.length > 0;
  const isFullHeightStage =
    text.length >= MAX_POST_LENGTH ||
    (hasMedia && hasTextExpanded);
  const isHalfHeightStage = hasMedia || hasTextExpanded || isFullHeightStage;
  const composerHeightClass = isFullHeightStage
    ? "h-[calc(100dvh-7rem)] min-h-[24rem]"
    : isHalfHeightStage
      ? "h-[50vh] min-h-[24rem]"
      : "";
  const textSectionClass = isFullHeightStage && hasMedia
    ? "basis-[40%] min-h-0"
    : isHalfHeightStage
      ? "min-h-0 flex-1"
      : "";
  const textAreaSizeClass = isHalfHeightStage
    ? "h-full min-h-0 max-h-none flex-1"
    : "min-h-[80px] max-h-[220px]";
  const mediaSectionClass = isFullHeightStage
    ? "basis-[50%] min-h-0"
    : "h-48";
  const mediaGridClass = mediaItems.length === 1
    ? "grid-cols-1"
    : mediaItems.length === 2
      ? "grid-cols-2"
      : "grid-cols-2 grid-rows-2";

  return (
    <div className="relative">
      <div className={`flex flex-col bg-card rounded-2xl p-4 sm:p-5 border shadow-[0_4px_16px_rgba(83,52,24,0.06)] transition-all focus-within:shadow-[0_8px_24px_rgba(83,52,24,0.1)] ${composerHeightClass}`}>
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="flex-shrink-0">
            <UserAvatar
              name={user?.name ?? "User"}
              imageUrl={user?.profileImageUrl}
              className="h-10 w-10 bg-primary text-sm font-bold text-primary-foreground shadow-inner"
              fallbackClassName="bg-primary text-primary-foreground"
            />
          </div>
          
          <div className="flex min-h-0 flex-1 flex-col min-w-0">
            <div className={`relative flex min-h-0 flex-col ${textSectionClass}`}>
              <Textarea
                ref={textAreaRef}
                value={text}
                maxLength={MAX_POST_LENGTH}
                onChange={(e) => setText(e.target.value)}
                onClick={(e) => {
                  cursorPositionRef.current = e.currentTarget.selectionStart;
                }}
                onKeyUp={(e) => {
                  cursorPositionRef.current = e.currentTarget.selectionStart;
                }}
                onSelect={(e) => {
                  cursorPositionRef.current = e.currentTarget.selectionStart;
                }}
                placeholder="Share your thoughts, or community updates..."
                className={`${textAreaSizeClass} composer-scrollbar w-full resize-none overflow-y-auto border-none shadow-none focus-visible:ring-0 p-0 pb-6 pr-12 text-base bg-transparent placeholder:text-muted-foreground/70`}
              />
              <span
                className={`pointer-events-none absolute bottom-1 right-1 text-xs ${
                  text.length >= MAX_POST_LENGTH
                    ? "font-semibold text-destructive"
                    : "text-muted-foreground"
                }`}
                aria-live="polite"
              >
                {text.length}/{MAX_POST_LENGTH}
              </span>
            </div>

            {mediaItems.length > 0 && (
              <div className={`${mediaSectionClass} min-h-0 overflow-hidden rounded-xl border bg-muted/30 p-2`}>
                <div className={`grid h-full min-h-0 gap-2 ${mediaGridClass}`}>
                {mediaItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`relative min-h-0 overflow-hidden rounded-lg border bg-muted ${
                      mediaItems.length > 2 && index === 0 ? "row-span-2" : ""
                    }`}
                  >
                    {item.file.type.startsWith("video/") ? (
                      <FeedVideo
                        src={item.previewUrl}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img src={item.previewUrl} alt="Selected post media" className="h-full w-full object-cover" />
                    )}
                    {item.status === "uploading" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <Loader2 className="w-7 h-7 animate-spin text-white" />
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 px-2 text-center text-white">
                        <span className="text-xs font-semibold">Upload failed</span>
                        <button
                          type="button"
                          onClick={() => retryMediaUpload(item.id)}
                          className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-white"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 z-10 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                      aria-label="Remove media"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                </div>
              </div>
            )}

            {isUploading && mediaItems.length === 0 && (
              <div className="py-3">
                <div className="w-32 h-32 rounded-xl bg-muted flex items-center justify-center border border-dashed">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {mediaMessage && (
              <p
                className="mt-2 text-xs font-medium text-destructive"
                role="status"
                aria-live="polite"
              >
                {mediaMessage}
              </p>
            )}

            <div className="relative flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-1">
                <div className="relative" ref={emojiRef}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowEmojis((current) => !current)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                    aria-label="Insert emoji"
                    aria-expanded={showEmojis}
                  >
                    <Smile size={20} />
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors flex items-center gap-2"
                  aria-label="Add photo"
                >
                  <ImagePlus size={20} />
                  <span className="text-sm font-semibold hidden sm:inline">Photo</span>
                </button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={
                  (!text.trim() && mediaItems.length === 0) ||
                  mediaItems.some((item) => item.status !== "uploaded") ||
                  isUploading ||
                  createPost.isPending
                }
                className="rounded-full px-6 font-bold shadow-sm"
              >
                {createPost.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showEmojis && (
        <div
          ref={emojiPickerRef}
          className="mt-2 grid w-full grid-cols-5 gap-1 overflow-y-auto overscroll-contain rounded-2xl border bg-card p-3 shadow-md max-h-[min(16rem,40vh)] sm:grid-cols-10"
        >
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertEmoji(emoji)}
              className="flex h-10 w-full items-center justify-center rounded-lg text-xl transition-colors hover:bg-muted"
              aria-label={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
