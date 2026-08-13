import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFeedPost,
  createFeedPostComment,
  deleteFeedPost,
  getFeedPost,
  getMediaAuth,
  listFeedPostComments,
  listFeedPosts,
  listMyFeedPosts,
  reportFeedPost,
  toggleFeedPostLike,
  type FeedComment as ApiFeedComment,
  type FeedPost as ApiFeedPost,
} from "@/lib/api-client";
import { upload as uploadToImageKit, type UploadResponse } from "@imagekit/javascript";
import { useAuth } from "@/lib/auth-context";

export interface FeedMedia {
  type: "image" | "video";
  url: string;
}

export interface UploadedMedia {
  fileId: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  filePath: string;
  fileType: "image" | "video";
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  previewUrl: string;
}

export interface FeedPost {
  id: string;
  authorId: number;
  authorName: string;
  authorProfileImageUrl: string | null;
  badge: string;
  city: string | null;
  text: string | null;
  media: FeedMedia[];
  counts: {
    likes: number;
    comments: number;
    shares: number;
  };
  likedByViewer: boolean;
  isAuthor: boolean;
  createdAt: string;
}

export interface FeedComment {
  id: string;
  postId: string;
  authorId: number;
  authorName: string;
  authorProfileImageUrl: string | null;
  text: string;
  createdAt: string;
}

export interface PaginatedFeedPostsResponse {
  items: FeedPost[];
  nextCursor: string | null;
}

export function mapApiPost(post: ApiFeedPost): FeedPost {
  return {
    id: String(post.id),
    authorId: post.author.id,
    authorName: post.author.name,
    authorProfileImageUrl: post.author.profileImageUrl,
    badge: post.author.badge,
    city: post.author.city,
    text: post.text,
    media: post.media.map((item) => ({
      type: item.type,
      url: item.url,
    })),
    counts: post.counts,
    likedByViewer: post.likedByViewer,
    isAuthor: post.isAuthor,
    createdAt: post.createdAt,
  };
}

function mapApiComment(comment: ApiFeedComment): FeedComment {
  return {
    id: String(comment.id),
    postId: String(comment.postId),
    authorId: comment.author.id,
    authorName: comment.author.name,
    authorProfileImageUrl: comment.author.profileImageUrl,
    text: comment.text,
    createdAt: comment.createdAt,
  };
}

export function useListFeedPosts() {
  return useInfiniteQuery<PaginatedFeedPostsResponse>({
    queryKey: ["feedPosts"],
    queryFn: async ({ pageParam = null }) => {
      const page = await listFeedPosts({
        cursor: typeof pageParam === "string" ? pageParam : undefined,
        limit: 10,
      });

      return {
        items: page.items.map(mapApiPost),
        nextCursor: page.nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });
}

export function useListMyFeedPosts() {
  return useQuery({
    queryKey: ["myFeedPosts"],
    queryFn: async () => {
      const posts = await listMyFeedPosts();
      return posts.map(mapApiPost);
    },
  });
}

export function useCreateFeedPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { text: string; media: UploadedMedia[] }) => {
      const post = await createFeedPost({
        text: data.text.trim() || null,
        media: data.media.map((media) => ({
          type: media.fileType,
          fileId: media.fileId,
          mediaUrl: media.mediaUrl,
          thumbnailUrl: media.thumbnailUrl,
          filePath: media.filePath,
          fileType: media.fileType,
          mimeType: media.mimeType,
          fileSize: media.fileSize,
          width: media.width,
          height: media.height,
          duration: media.duration,
        })),
      });

      return mapApiPost(post);
    },
    onSuccess: async (newPost) => {
      queryClient.setQueryData<{
        pages: PaginatedFeedPostsResponse[];
        pageParams: unknown[];
      }>(["feedPosts"], (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page, index) =>
            index === 0
              ? {
                  ...page,
                  items: [
                    newPost,
                    ...page.items.filter((post) => post.id !== newPost.id),
                  ],
                }
              : page,
          ),
        };
      });
      queryClient.setQueryData<FeedPost[]>(["myFeedPosts"], (old) =>
        old ? [newPost, ...old.filter((post) => post.id !== newPost.id)] : [newPost],
      );

      await queryClient.invalidateQueries({ queryKey: ["feedPosts"] });
      await queryClient.invalidateQueries({ queryKey: ["myFeedPosts"] });
    },
  });
}

export function useToggleFeedPostLike() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      return toggleFeedPostLike(Number(postId));
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["feedPosts"] });
      const previous = queryClient.getQueryData(["feedPosts"]);
      
      queryClient.setQueryData(["feedPosts"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: FeedPost) => {
              if (item.id === postId) {
                const wasLiked = item.likedByViewer;
                return {
                  ...item,
                  likedByViewer: !wasLiked,
                  counts: {
                    ...item.counts,
                    likes: item.counts.likes + (wasLiked ? -1 : 1)
                  }
                };
              }
              return item;
            })
          }))
        };
      });
      return { previous };
    },
    onSuccess: (result, postId) => {
      queryClient.setQueryData(["feedPosts"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: FeedPost) =>
              item.id === postId
                ? {
                    ...item,
                    likedByViewer: result.liked,
                    counts: {
                      ...item.counts,
                      likes: result.likes,
                      shares: result.shares,
                    },
                  }
                : item,
            ),
          })),
        };
      });
    },
    onError: (_err, _newVal, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["feedPosts"], context.previous);
      }
    },
  });
}

export function useDeleteFeedPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      await deleteFeedPost(Number(postId));
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.setQueryData(["feedPosts"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((item: FeedPost) => item.id !== postId),
          })),
        };
      });
      void queryClient.invalidateQueries({ queryKey: ["feedPosts"] });
      queryClient.setQueryData<FeedPost[]>(["myFeedPosts"], (old) =>
        old?.filter((post) => post.id !== postId),
      );
      void queryClient.invalidateQueries({ queryKey: ["myFeedPosts"] });
    },
  });
}

export function useReportFeedPost() {
  return useMutation({
    mutationFn: async (postId: string) => reportFeedPost(Number(postId)),
  });
}

export function useListFeedPostComments(postId: string) {
  return useQuery({
    queryKey: ["feedComments", postId],
    queryFn: async () => {
      const comments = await listFeedPostComments(Number(postId));
      return comments.map(mapApiComment);
    },
    enabled: !!postId && Number.isInteger(Number(postId)),
  });
}

export function useCreateFeedPostComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, text }: { postId: string; text: string }) => {
      const comment = await createFeedPostComment(Number(postId), {
        text: text.trim(),
      });
      return mapApiComment(comment);
    },
    onSuccess: (newComment, { postId }) => {
      queryClient.setQueryData(["feedComments", postId], (old: FeedComment[] | undefined) => {
        if (!old) return [newComment];
        if (old.some((comment) => comment.id === newComment.id)) return old;
        return [...old, newComment];
      });
      // Update comment count locally
      queryClient.setQueryData(["feedPosts"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: FeedPost) => {
              if (item.id === postId) {
                return {
                  ...item,
                  counts: { ...item.counts, comments: item.counts.comments + 1 }
                };
              }
              return item;
            })
          }))
        };
      });
    },
  });
}

export function useShareFeedPost() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      const result = await fetch(`/api/feed/${postId}/share`, {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (!result.ok) {
        throw new Error("Unable to record share");
      }
      return (await result.json()) as { shares: number };
    },
    onSuccess: (result, postId) => {
      queryClient.setQueryData(["feedPosts"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: FeedPost) =>
              item.id === postId
                ? { ...item, counts: { ...item.counts, shares: result.shares } }
                : item,
            ),
          })),
        };
      });
      queryClient.setQueryData<FeedPost[]>(["myFeedPosts"], (old) =>
        old?.map((item) =>
          item.id === postId
            ? { ...item, counts: { ...item.counts, shares: result.shares } }
            : item,
        ),
      );
    },
  });
}

export function useGetFeedPost(postId: number) {
  return useQuery({
    queryKey: ["feedPost", postId],
    queryFn: async () => mapApiPost(await getFeedPost(postId)),
    enabled: Number.isInteger(postId) && postId > 0,
  });
}

export async function uploadMedia(
  file: File,
  userId: number,
  purpose: "post" | "profile" | "campaign" | "project" = "post",
): Promise<UploadedMedia> {
  const auth = await getMediaAuth({ purpose });
  const fileType = file.type.startsWith("image/") ? "image" : "video";
  const response: UploadResponse = await uploadToImageKit({
    file,
    fileName: file.name,
    token: auth.token,
    expire: auth.expire,
    signature: auth.signature,
    publicKey: auth.publicKey,
    folder: auth.folder,
    useUniqueFileName: true,
    isPrivateFile: false,
  });

  if (!response.fileId || !response.url || !response.filePath) {
    throw new Error("ImageKit returned incomplete media metadata.");
  }

  return {
    fileId: response.fileId,
    mediaUrl: response.url,
    thumbnailUrl: response.thumbnailUrl ?? null,
    filePath: response.filePath,
    fileType,
    mimeType: file.type,
    fileSize: response.size ?? file.size,
    width: response.width ?? response.metadata?.width ?? null,
    height: response.height ?? response.metadata?.height ?? null,
    duration: response.duration ?? response.metadata?.duration ?? null,
    previewUrl: URL.createObjectURL(file),
  };
}
