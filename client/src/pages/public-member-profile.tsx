import { useGetPublicMemberProfile } from "@/lib/api-client";
import { ArrowLeft, CalendarDays, Loader2, MapPin, MessageCircle } from "lucide-react";
import { Link, useParams } from "wouter";
import { FeedPostItem } from "@/components/feed/FeedPostItem";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { mapApiPost } from "@/hooks/use-feed";
import { BrandLogo } from "@/components/brand-logo";
import { useLanguage } from "@/lib/language-context";
import { resolveMyThoughts } from "@/lib/my-thoughts";
import { MyThoughtQuote } from "@/components/my-thought-quote";

function roleLabel(role: string) {
  if (role === "super_admin") return "Super user";
  if (role === "admin") return "Admin";
  if (role === "volunteer") return "Volunteer";
  return "Member";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

export function PublicMemberProfilePage() {
  const params = useParams();
  const memberId = Number(params.id);
  const { data, isLoading, isError } = useGetPublicMemberProfile(memberId, {
    query: {
      enabled: Number.isInteger(memberId) && memberId > 0,
      queryKey: ["/api/members", memberId, "profile"],
    },
  });
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-3xl font-bold">Profile not found</h1>
        <p className="mt-2 text-muted-foreground">
          This member profile is unavailable or no longer active.
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

  const { profile } = data;
  const profileCity = profile.city ?? "Nagpur";
  const thoughts = resolveMyThoughts(profile.description, language, profile.thoughtTemplateId);
  const posts = data.posts.map(mapApiPost);

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-orange-50/70 via-background to-amber-50/50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to community
        </Link>

        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div
            className="relative isolate h-28 overflow-hidden bg-gradient-to-br from-[#f5a24c] via-[#e87516] to-[#c95b0c] sm:h-36"
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,.7) 0 2px, transparent 2px), radial-gradient(circle at 80% 70%, rgba(255,255,255,.45) 0 1px, transparent 1px)",
                backgroundSize: "34px 34px, 26px 26px",
              }}
              aria-hidden="true"
            />
            <BrandLogo
              alt=""
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 opacity-20 mix-blend-multiply sm:h-32 sm:w-32"
              sizes="128px"
              loading="eager"
            />
          </div>
          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <UserAvatar
                name={profile.name}
                imageUrl={profile.profileImageUrl}
                className="h-28 w-28 border-4 border-card bg-primary text-2xl font-bold text-primary-foreground shadow-lg sm:h-32 sm:w-32"
                fallbackClassName="bg-primary text-primary-foreground"
                alt={`${profile.name}'s profile photo`}
              />
              <span
                className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm ${
                  profile.customBadge
                    ? "border-secondary/35 bg-secondary/15 text-foreground shadow-secondary/10 dark:text-secondary"
                    : "border-primary/20 bg-primary/10 text-primary"
                }`}
              >
                {profile.customBadge || roleLabel(profile.role)}
              </span>
            </div>

            <div className="mt-5">
              <h1 className="font-serif text-3xl font-bold sm:text-4xl">{profile.name}</h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {profileCity}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Member since {formatDate(profile.createdAt)}
                </span>
              </div>
              {thoughts && (
                <MyThoughtQuote className="mt-5 max-w-3xl" textClassName="text-base sm:text-lg">
                  {thoughts}
                </MyThoughtQuote>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex justify-end">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          </div>

          <div className="max-h-[72vh] space-y-5 overflow-y-auto rounded-3xl border border-dashed bg-background/50 p-2 sm:p-4">
            {posts.length > 0 ? (
              posts.map((post) => <FeedPostItem key={post.id} post={post} />)
            ) : (
              <div className="rounded-2xl border bg-card px-6 py-14 text-center">
                <MessageCircle className="mx-auto h-10 w-10 text-primary/40" />
                <h3 className="mt-4 font-serif text-xl font-bold">No posts yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {profile.name} has not shared anything with the community yet.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}