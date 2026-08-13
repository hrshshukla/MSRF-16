import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { Image, ImagePlus, Loader2, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadMedia, type UploadedMedia } from "@/hooks/use-feed";
import { useAuth } from "@/lib/auth-context";

export type CampaignStatus = "active" | "completed" | "upcoming" | "stopped";

export type CampaignFormValues = {
  title: string;
  description: string;
  goalAmountInr: string;
  status: CampaignStatus;
  imageUrl: string;
  imageMetadata?: UploadedMedia;
  imageAction?: "keep" | "set" | "remove";
};

export const emptyCampaignForm = (): CampaignFormValues => ({
  title: "",
  description: "",
  goalAmountInr: "",
  status: "active",
  imageUrl: "",
  imageAction: "remove",
});

type CampaignFormProps = {
  initialValues?: CampaignFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: CampaignFormValues) => void;
  onCancel?: () => void;
  showStatus?: boolean;
  previewMode?: boolean;
  previewImageUrl?: string | null;
};

export function CampaignForm({
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
  showStatus = true,
  previewMode = false,
  previewImageUrl = null,
}: CampaignFormProps) {
  const { user } = useAuth();
  const imageInputId = useId();
  const [form, setForm] = useState<CampaignFormValues>(initialValues ?? emptyCampaignForm());
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialValues?.imageUrl || previewImageUrl || null);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    setForm(initialValues ?? emptyCampaignForm());
    setImagePreview(initialValues?.imageUrl || previewImageUrl || null);
    setImageError("");
  }, [initialValues, previewImageUrl]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageError("");
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImageError("Campaign images must be 4 MB or smaller.");
      return;
    }
    if (!user) {
      setImageError("You must be signed in to upload a campaign image.");
      return;
    }

    const previousImageUrl = form.imageUrl;
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploadingImage(true);
    try {
      const uploaded = await uploadMedia(file, user.id, "campaign");
      setForm((current) => ({
        ...current,
        imageUrl: uploaded.mediaUrl,
        imageMetadata: uploaded,
        imageAction: "set",
      }));
    } catch (error) {
      console.error("Campaign image upload failed", error);
      setImagePreview(previousImageUrl || null);
      setImageError(error instanceof Error ? error.message : "Image upload failed. Please try again.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setIsUploadingImage(false);
    }
  }

  function removeImage() {
    setImageError("");
    setImagePreview(null);
    setForm((current) => ({ ...current, imageUrl: "", imageMetadata: undefined, imageAction: "remove" }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isUploadingImage) onSubmit(form);
  }

  const statusLabel = form.status === "active"
    ? "Active"
    : form.status.charAt(0).toUpperCase() + form.status.slice(1);

  return (
    <form onSubmit={handleSubmit}>
      {previewMode && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
          <div className="relative h-52 overflow-hidden bg-muted sm:h-64">
            {imagePreview ? (
              <img src={imagePreview} alt={`${form.title || "Campaign"} preview`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary">
                <Image className="h-12 w-12 opacity-30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <label
              htmlFor={imageInputId}
              title="Edit campaign image"
              className="absolute right-4 top-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-background/90 px-3 py-2 text-xs font-bold text-primary shadow-sm backdrop-blur-sm transition hover:bg-primary hover:text-primary-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
            >
              <Pencil className="h-4 w-4" />
              Edit image
              <input id={imageInputId} type="file" accept="image/*" onChange={handleImageChange} disabled={isUploadingImage} className="sr-only" />
            </label>
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="truncate font-serif text-2xl font-bold drop-shadow-sm">
                  {form.title || "Campaign title"}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-white/80">
                  {form.description || "Campaign description"}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {statusLabel}
              </span>
            </div>
          </div>
          {imageError && (
            <p className="border-t border-destructive/15 bg-destructive/5 px-5 py-3 text-xs font-medium text-destructive">
              {imageError}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {previewMode && <Pencil className="h-3.5 w-3.5 text-primary" />}
            Campaign title
          </span>
          <Input
            required
            maxLength={160}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Winter Blanket Seva"
          />
        </label>

        <label className="space-y-1.5 md:col-span-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {previewMode && <Pencil className="h-3.5 w-3.5 text-primary" />}
            Description
          </span>
          <Textarea
            required
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Describe the purpose and impact of this campaign"
            rows={4}
          />
        </label>

        <label className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {previewMode && <Pencil className="h-3.5 w-3.5 text-primary" />}
            Goal amount (INR)
          </span>
          <Input
            required
            min="0"
            step="1"
            type="number"
            value={form.goalAmountInr}
            onChange={(event) => setForm({ ...form, goalAmountInr: event.target.value })}
            placeholder="100000"
          />
        </label>

        {showStatus && (
          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              {previewMode && <Pencil className="h-3.5 w-3.5 text-primary" />}
              Status
            </span>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as CampaignStatus })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="stopped">Stopped</option>
            </select>
          </label>
        )}

        {!previewMode && <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-semibold">
            Campaign image <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-xl border border-dashed bg-muted/20 p-3">
            {imagePreview ? (
              <img src={imagePreview} alt="Campaign preview" className="h-20 w-28 rounded-lg object-cover" />
            ) : (
              <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Image className="h-7 w-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Upload a campaign image</p>
              <p className="mt-0.5 text-xs text-muted-foreground">JPG, PNG, GIF, or WebP · 4 MB max</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                  {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4 text-primary" />}
                  {isUploadingImage ? "Uploading…" : "Choose image"}
                  <input type="file" accept="image/*" onChange={handleImageChange} disabled={isUploadingImage} className="sr-only" />
                </label>
                {imagePreview && !isUploadingImage && (
                  <button type="button" onClick={removeImage} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
              {imageError && <p className="mt-2 text-xs font-medium text-destructive">{imageError}</p>}
            </div>
          </div>
        </label>}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isUploadingImage}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="cursor-pointer" disabled={isSubmitting || isUploadingImage}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {previewMode && !isSubmitting && <Save className="h-4 w-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}