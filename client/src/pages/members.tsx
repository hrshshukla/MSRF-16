import { useListTeam } from "@/lib/api-client";
import { Users } from "lucide-react";
import { MemberCards } from "@/components/member-cards";

export function MembersPage() {
  const { data: members, isLoading, isError } = useListTeam();

  return (
    <div className="w-full pb-24 relative">
      <div className="bg-card border-b pt-24 pb-16 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/2 rounded-l-full bg-secondary/5 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Our Members</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">The people behind the seva</h1>
          <p className="text-lg text-muted-foreground">
            Meet all the dedicated members serving Sanatan Dharma and strengthening communities through meaningful action.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-12">
        {isLoading ? (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
              <div key={item} className="flex min-h-40 items-center gap-5 rounded-[2rem] border border-border/70 bg-background/55 p-5">
                <div className="h-28 w-28 shrink-0 animate-pulse rounded-2xl bg-muted sm:h-36 sm:w-44" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-dashed bg-background/60 px-6 py-10 text-center">
            <Users className="mx-auto mb-4 h-8 w-8 text-primary" />
            <p className="font-serif text-2xl font-semibold">Member profiles are temporarily unavailable</p>
            <p className="mt-2 text-muted-foreground">Please check back soon to meet our team.</p>
          </div>
        ) : members && members.length > 0 ? (
          <MemberCards members={members} />
        ) : (
          <div className="mx-auto max-w-xl rounded-3xl border border-dashed bg-background/60 px-6 py-10 text-center">
            <Users className="mx-auto mb-4 h-8 w-8 text-primary" />
            <p className="font-serif text-2xl font-semibold">Our member profiles are coming soon</p>
            <p className="mt-2 text-muted-foreground">
              We are preparing the stories of the people who serve our community.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}