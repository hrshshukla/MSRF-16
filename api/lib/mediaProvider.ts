import ImageKit from "@imagekit/nodejs";

export const ALLOWED_MEDIA_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
} as const;

export type AllowedMediaType = keyof typeof ALLOWED_MEDIA_TYPES;
export type UploadPurpose = "post" | "profile" | "campaign" | "project";

export interface MediaUploadMetadata {
  fileId: string;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  filePath: string;
  fileType: "image" | "video";
  mimeType: AllowedMediaType;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export class MediaConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaConfigurationError";
  }
}

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

function positiveEnvNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function trimUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export interface MediaProvider {
  getAuthenticationParameters(): {
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
  };
  deleteFile(fileId: string): Promise<void>;
  validateUploadMetadata(input: {
    userId: number;
    purpose: UploadPurpose;
    metadata: unknown;
  }): MediaUploadMetadata;
}

export class ImageKitService implements MediaProvider {
  private readonly client: ImageKit;
  private readonly publicKey: string;
  private readonly urlEndpoint: string;

  constructor() {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
    this.publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim() ?? "";
    this.urlEndpoint = trimUrl(process.env.IMAGEKIT_URL_ENDPOINT?.trim() ?? "");

    if (!privateKey || !this.publicKey || !this.urlEndpoint) {
      throw new MediaConfigurationError(
        "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT.",
      );
    }

    this.client = new ImageKit({ privateKey });
  }

  getAuthenticationParameters() {
    const authentication = this.client.helper.getAuthenticationParameters();
    return {
      ...authentication,
      publicKey: this.publicKey,
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!/^[A-Za-z0-9_-]+$/.test(fileId)) {
      throw new MediaValidationError("Invalid media file ID.");
    }
    await this.client.files.delete(fileId);
  }

  validateUploadMetadata(input: {
    userId: number;
    purpose: UploadPurpose;
    metadata: unknown;
  }): MediaUploadMetadata {
    if (!input.metadata || typeof input.metadata !== "object") {
      throw new MediaValidationError("Uploaded media metadata is required.");
    }

    const value = input.metadata as Record<string, unknown>;
    const mimeType = typeof value.mimeType === "string" ? value.mimeType : "";
    if (!(mimeType in ALLOWED_MEDIA_TYPES)) {
      throw new MediaValidationError("Unsupported media type.");
    }

    const fileId = typeof value.fileId === "string" ? value.fileId.trim() : "";
    const mediaUrl = typeof value.mediaUrl === "string" ? value.mediaUrl.trim() : "";
    const filePath = typeof value.filePath === "string" ? value.filePath.trim() : "";
    const fileSize = typeof value.fileSize === "number" ? value.fileSize : NaN;
    const fileType = value.fileType === "image" || value.fileType === "video"
      ? value.fileType
      : mimeType.startsWith("image/")
        ? "image"
        : "video";

    if (!fileId || !mediaUrl || !filePath) {
      throw new MediaValidationError("Uploaded media metadata is incomplete.");
    }
    if ((input.purpose === "profile" || input.purpose === "campaign") && fileType !== "image") {
      throw new MediaValidationError("This upload must be an image.");
    }
    if (
      (fileType === "image" && !mimeType.startsWith("image/")) ||
      (fileType === "video" && !mimeType.startsWith("video/"))
    ) {
      throw new MediaValidationError("Uploaded media type does not match its MIME type.");
    }
    if (!Number.isInteger(fileSize) || fileSize < 1) {
      throw new MediaValidationError("Uploaded media size is invalid.");
    }

    const maxSize = input.purpose === "profile"
      ? positiveEnvNumber("IMAGEKIT_MAX_PROFILE_IMAGE_SIZE_BYTES", 2 * 1024 * 1024)
      : fileType === "image"
        ? positiveEnvNumber("IMAGEKIT_MAX_IMAGE_SIZE_BYTES", 10 * 1024 * 1024)
        : positiveEnvNumber("IMAGEKIT_MAX_VIDEO_SIZE_BYTES", 100 * 1024 * 1024);

    if (fileSize > maxSize) {
      throw new MediaValidationError(
        `File is too large. The maximum allowed size is ${Math.floor(maxSize / (1024 * 1024))} MB.`,
      );
    }

    const expectedFolder =
      input.purpose === "profile"
        ? "profiles"
        : input.purpose === "campaign"
          ? "campaigns"
          : input.purpose === "project"
            ? "projects"
          : "posts";
    const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    if (!normalizedPath.startsWith(`/${expectedFolder}/${input.userId}/`)) {
      throw new MediaValidationError("Uploaded media is not owned by the current user.");
    }
    if (!mediaUrl.startsWith(this.urlEndpoint + "/")) {
      throw new MediaValidationError("Uploaded media URL is invalid.");
    }

    const width = this.optionalInteger(value.width);
    const height = this.optionalInteger(value.height);
    const duration = this.optionalInteger(value.duration);
    return {
      fileId,
      mediaUrl,
      thumbnailUrl:
        typeof value.thumbnailUrl === "string" ? value.thumbnailUrl.trim() : null,
      filePath: normalizedPath,
      fileType,
      mimeType: mimeType as AllowedMediaType,
      fileSize,
      width,
      height,
      duration,
    };
  }

  validatePublicUrl(publicUrl: string, userId: number, purpose: UploadPurpose): boolean {
    const normalized = publicUrl.trim();
    const folder =
      purpose === "profile"
        ? "profiles"
        : purpose === "campaign"
          ? "campaigns"
          : purpose === "project"
            ? "projects"
          : "posts";
    return (
      normalized.startsWith(`${this.urlEndpoint}/`) &&
      normalized.includes(`/${folder}/${userId}/`) &&
      normalized.length <= 2048
    );
  }

  private optionalInteger(value: unknown): number | null {
    return typeof value === "number" && Number.isInteger(value) && value >= 0
      ? value
      : null;
  }

}