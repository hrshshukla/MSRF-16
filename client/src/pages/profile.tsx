import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Redirect } from "wouter";
import { motion } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { uploadMedia } from "@/hooks/use-feed";
import { useLanguage } from "@/lib/language-context";
import { resolveMyThoughts } from "@/lib/my-thoughts";

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
const DEFAULT_CITY = "Nagpur";

function profileImageSrc(profileImageUrl: string | null) {
  if (!profileImageUrl) return null;
  if (
    profileImageUrl.startsWith("http://") ||
    profileImageUrl.startsWith("https://") ||
    profileImageUrl.startsWith("data:")
  ) {
    return profileImageUrl;
  }
  return profileImageUrl;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { language } = useLanguage();
  const [name, setName] = useState(user?.name ?? "");
  const [description, setDescription] = useState(user?.description ?? "");
  const [city, setCity] = useState(user?.city ?? DEFAULT_CITY);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    user?.profileImageUrl ?? null,
  );
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    profileImageSrc(user?.profileImageUrl ?? null),
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const defaultThought = user
    ? resolveMyThoughts(null, language, user.thoughtTemplateId)
    : "";

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setDescription(user.description ?? "");
    setCity(user.city ?? DEFAULT_CITY);
    setProfileImageUrl(user.profileImageUrl ?? null);
    setProfileImagePreview(profileImageSrc(user.profileImageUrl ?? null));
  }, [user]);

  useEffect(() => {
    if (!saved) return;

    const timeoutId = window.setTimeout(() => {
      setSaved(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [saved]);

  if (!user) return <Redirect to="/login" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setIsSaving(true);

    try {
      await updateProfile({ name, profileImageUrl, description, city });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhotoError("");
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setPhotoError("Profile photos must be 2 MB or smaller.");
      return;
    }

    setProfileImagePreview(URL.createObjectURL(file));
    setIsUploadingPhoto(true);

    try {
      const currentUser = user;
      if (!currentUser) {
        throw new Error("You must be signed in to upload a profile photo.");
      }
      const uploaded = await uploadMedia(file, currentUser.id, "profile");
      setProfileImageUrl(uploaded.mediaUrl);
    } catch (error) {
      console.error("Profile photo upload failed", error);
      setPhotoError("Photo upload failed. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function removePhoto() {
    setPhotoError("");
    setProfileImageUrl(null);
    setProfileImagePreview(null);
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-orange-50/70 via-background to-amber-50/50 px-4 py-7 lg:pt-0  sm:py-9">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-full"
      >
        <div className="mb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">My account</p>
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">Edit profile</h1>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">Personal details</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium capitalize text-primary">
                {user.role === "super_admin"
                  ? "Super user"
                  : user.role === "admin"
                    ? "Admin"
                    : user.role === "volunteer"
                      ? "Volunteer"
                      : "Member"}
              </span>
            </div>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10 text-xl font-bold text-primary sm:h-[4.5rem] sm:w-[4.5rem]">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  initials(user.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Profile photo</p>
                <p className="mt-0.5 text-xs text-muted-foreground">JPG, PNG, GIF, or WebP · 2 MB max</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4 text-primary" />
                    )}
                    {isUploadingPhoto ? "Uploading…" : "Choose photo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={isUploadingPhoto}
                      className="sr-only"
                    />
                  </label>
                  {profileImagePreview && !isUploadingPhoto && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
                {photoError && (
                  <p className="mt-2 text-xs font-medium text-destructive" role="status">
                    {photoError}
                  </p>
                )}
              </div>
              <Camera className="hidden h-5 w-5 shrink-0 text-primary/60 sm:block" />
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Full name</span>
              <span className="relative block">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Email address</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={user.email}
                  autoComplete="email"
                  readOnly
                  aria-readonly="true"
                  className="w-full cursor-not-allowed rounded-lg border bg-muted/40 py-2.5 pl-10 pr-4 text-sm text-muted-foreground outline-none"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Phone number</span>
              <span className="relative block">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={user.phone ?? "Not provided"}
                  autoComplete="tel"
                  readOnly
                  aria-readonly="true"
                  className="w-full cursor-not-allowed rounded-lg border bg-muted/40 py-2.5 pl-10 pr-4 text-sm text-muted-foreground outline-none"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">City</span>
              <span className="relative block">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value.slice(0, 120))}
                  maxLength={120}
                  autoComplete="address-level2"
                  placeholder={DEFAULT_CITY}
                  className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">My thoughts</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 150))}
                maxLength={150}
                rows={4}
                placeholder={defaultThought}
                className="w-full resize-y rounded-lg border bg-background px-4 py-2.5 text-sm leading-relaxed outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <span className="mt-1 block text-right text-xs text-muted-foreground">
                {description.length}/150
              </span>
            </label>

            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
              <Link href="/" className="rounded-lg border px-5 py-2.5 text-center text-sm font-medium text-foreground transition hover:bg-muted">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving || saved}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  saved
                    ? "bg-green-600 text-white hover:bg-green-600"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving…" : saved ? "Saved" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

