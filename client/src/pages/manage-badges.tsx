import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListTeamQueryKey } from "@/lib/api-client";
import { Award, Loader2, Search, Save, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/lib/auth-context";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-response";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

type BadgeUser = {
  id: number;
  name: string;
  email: string;
  profileImageUrl: string | null;
  customBadge: string | null;
  role: string;
  createdAt: string;
};

function roleLabel(role: string) {
  if (role === "super_admin") return "Super user";
  if (role === "admin") return "Admin";
  if (role === "volunteer") return "Volunteer";
  return "Member";
}

export function ManageBadgesPage() {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<BadgeUser[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== "super_admin" || !accessToken) return;

    let cancelled = false;
    async function loadUsers() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`${API}/admin/badges`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const body = await readApiResponse<{ members?: BadgeUser[]; error?: string }>(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(response, body, "Unable to load users"));
        }
        if (cancelled) return;
        const nextUsers = body?.members ?? [];
        setUsers(nextUsers);
        setDrafts(
          Object.fromEntries(nextUsers.map((member) => [member.id, member.customBadge ?? ""])),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load users");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user?.role]);

  const query = search.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users.filter(
        (member) =>
          !query ||
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query),
      ),
    [query, users],
  );

  if (!user || user.role !== "super_admin") {
    return null;
  }

  async function saveBadge(member: BadgeUser) {
    if (!accessToken) return;
    setWorkingId(member.id);
    try {
      const response = await fetch(`${API}/admin/members/${member.id}/badge`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ badge: drafts[member.id]?.trim() || null }),
      });
      const body = await readApiResponse<{ member?: BadgeUser; error?: string }>(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, body, "Unable to save badge"));
      }
      if (body?.member) {
        setUsers((current) =>
          current.map((item) => (item.id === member.id ? body.member! : item)),
        );
        setDrafts((current) => ({
          ...current,
          [member.id]: body.member?.customBadge ?? "",
        }));
        window.dispatchEvent(
          new CustomEvent("custom-badge-updated", {
            detail: {
              userId: body.member.id,
              customBadge: body.member.customBadge,
            },
          }),
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feedPosts"] }),
        queryClient.invalidateQueries({ queryKey: ["myFeedPosts"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/members", member.id, "profile"] }),
        queryClient.invalidateQueries({ queryKey: getListTeamQueryKey() }),
      ]);
      toast({
        title: "Badge updated",
        description: `${member.name}'s custom badge is now ${drafts[member.id]?.trim() ? "visible" : "cleared"}.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Badge update failed",
        description: err instanceof Error ? err.message : "Unable to save badge",
      });
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Super Admin tools</p>
        <h2 className="mt-2 flex items-center gap-2 font-serif text-3xl font-bold">
          <Award className="h-7 w-7 text-primary" />
          Custom badges
        </h2>
        <p className="mt-2 text-muted-foreground">
          Assign a display badge to any account without changing their permissions or account role.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading users…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          {error}
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users by name or email"
              aria-label="Search users by name or email"
              className="w-full rounded-2xl border bg-card py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
              No users match your search.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((member) => {
                const isWorking = workingId === member.id;
                const draft = drafts[member.id] ?? "";
                const hasChanges = draft.trim() !== (member.customBadge ?? "");

                return (
                  <article key={member.id} className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                          name={member.name}
                          imageUrl={member.profileImageUrl}
                          className="h-11 w-11 border border-background shadow-sm"
                          fallbackClassName="bg-primary text-xs font-extrabold text-primary-foreground"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold">{member.name}</h3>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] shadow-sm ${
                                member.customBadge
                                  ? "border-secondary/35 bg-secondary/15 text-foreground shadow-secondary/10 dark:text-secondary"
                                  : "border-primary/20 bg-primary/10 text-primary"
                              }`}
                            >
                              {member.customBadge || roleLabel(member.role)}
                            </span>
                          </div>
                          <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                          <p className="text-xs text-muted-foreground">Account #{member.id}</p>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-md">
                        <label htmlFor={`badge-${member.id}`} className="text-xs font-semibold text-muted-foreground">
                          Custom badge
                        </label>
                        <div className="flex gap-2">
                          <input
                            id={`badge-${member.id}`}
                            value={draft}
                            maxLength={40}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [member.id]: event.target.value.slice(0, 40),
                              }))
                            }
                            placeholder="e.g. Founder, Donor, Mentor"
                            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                          />
                          {draft && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Clear ${member.name}'s badge`}
                              disabled={isWorking}
                              onClick={() =>
                                setDrafts((current) => ({ ...current, [member.id]: "" }))
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            disabled={isWorking || !hasChanges}
                            onClick={() => void saveBadge(member)}
                          >
                            {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span className="hidden sm:inline">Save</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}