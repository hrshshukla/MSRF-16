import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, ShieldCheck, Trash2, TriangleAlert, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth, type UserRole } from "@/lib/auth-context";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-response";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

export type ManagedMember = {
  id: number;
  name: string;
  profileImageUrl: string | null;
  customBadge: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export const adminRoles = new Set<UserRole>([
  "super_admin",
  "admin",
]);

export function roleLabel(role: UserRole) {
  if (role === "super_admin") return "Super user";
  if (adminRoles.has(role)) return "Admin";
  if (role === "volunteer") return "Volunteer";
  return "Member";
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

export function ManageMembersPage() {
  const { accessToken, user } = useAuth();
  const [members, setMembers] = useState<ManagedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadMembers();
  }, [accessToken]);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  async function loadMembers() {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/admin/members`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await readApiResponse<{ members?: ManagedMember[]; error?: string }>(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, body, "Unable to load members"));
      }
      setMembers(body?.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load members");
    } finally {
      setIsLoading(false);
    }
  }

  const memberCount = members.filter((member) => !adminRoles.has(member.role)).length;
  const adminCount = members.filter(
    (member) => member.role !== "super_admin" && adminRoles.has(member.role),
  ).length;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Admin tools</p>
        <h2 className="mt-2 font-serif text-3xl font-bold">Manage accounts</h2>
        <p className="mt-2 text-muted-foreground">
          View and manage admin, volunteer, and member accounts, promote members to admin, or remove an account.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading members…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">{error}</div>
      ) : (
        <div className={`grid gap-3 ${user?.role === "super_admin" ? "sm:grid-cols-2" : ""}`}>
          <Link
            href="/settings/members/members"
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
          >
              <Users className="h-5 w-5 text-primary" />
              <p className="mt-3 text-2xl font-bold">{memberCount}</p>
              <p className="text-sm text-muted-foreground group-hover:text-foreground">Member and volunteer accounts</p>
              <p className="mt-2 text-xs font-semibold text-primary">View and search members →</p>
          </Link>
          {user?.role === "super_admin" && (
            <Link
              href="/settings/members/admins"
              className="group rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
            >
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="mt-3 text-2xl font-bold">{adminCount}</p>
                <p className="text-sm text-muted-foreground group-hover:text-foreground">Admin accounts</p>
                <p className="mt-2 text-xs font-semibold text-primary">View and manage admins →</p>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export function ManageMemberAccountsPage({
  accountType,
}: {
  accountType: "members" | "admins";
}) {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<ManagedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [pendingDeleteMember, setPendingDeleteMember] = useState<ManagedMember | null>(null);

  useEffect(() => {
    void loadMembers();
  }, [accessToken]);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  async function loadMembers() {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/admin/members`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await readApiResponse<{ members?: ManagedMember[]; error?: string }>(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, body, "Unable to load accounts"));
      }
      setMembers(body?.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load accounts");
    } finally {
      setIsLoading(false);
    }
  }

  async function promoteMember(member: ManagedMember) {
    if (!accessToken) return;
    setWorkingId(member.id);
    try {
      const response = await fetch(`${API}/admin/members/${member.id}/role`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "admin" }),
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, body, "Unable to promote member"));
      }
      toast({
        title: "Member promoted",
        description: `${member.name} is now an admin.`,
      });
      await loadMembers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Promotion failed",
        description: err instanceof Error ? err.message : "Unable to promote member",
      });
    } finally {
      setWorkingId(null);
    }
  }

  async function makeMember(member: ManagedMember) {
    if (!accessToken) return;
    setWorkingId(member.id);
    try {
      const response = await fetch(`${API}/admin/members/${member.id}/role`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "member" }),
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, body, "Unable to make member"));
      }
      toast({
        title: "Admin demoted",
        description: `${member.name} is now a normal member.`,
      });
      await loadMembers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Demotion failed",
        description: err instanceof Error ? err.message : "Unable to make member",
      });
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteMember(member: ManagedMember) {
    if (!accessToken) return;
    setWorkingId(member.id);
    try {
      const response = await fetch(`${API}/admin/members/${member.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, body, "Unable to delete account"));
      }
      toast({
        title: "Account deleted",
        description: `${member.name}'s account and member ID were removed.`,
      });
      setPendingDeleteMember(null);
      await loadMembers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: err instanceof Error ? err.message : "Unable to delete account",
      });
    } finally {
      setWorkingId(null);
    }
  }

  async function confirmDeleteMember() {
    if (pendingDeleteMember) {
      await deleteMember(pendingDeleteMember);
    }
  }

  const isAdminList = accountType === "admins";
  const title = isAdminList ? "Admin accounts" : "Member accounts";
  const description = isAdminList
    ? "Search and manage administrator accounts."
    : "Search members and volunteers, promote a member account to admin, or remove an account.";
  const query = search.trim().toLowerCase();
  const filteredMembers = members
    .filter((member) =>
      isAdminList
        ? member.role !== "super_admin" && adminRoles.has(member.role)
        : !adminRoles.has(member.role),
    )
    .filter(
      (member) =>
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query),
    );

  return (
    <section className="space-y-6">
      <div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Admin tools
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>

      {pendingDeleteMember && (
        <div
          className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 shadow-sm sm:p-5"
          role="alertdialog"
          aria-modal="false"
          aria-labelledby="member-delete-title"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="member-delete-title" className="font-semibold text-foreground">Delete this account?</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {pendingDeleteMember.name}&apos;s account and member ID will be permanently removed. This action cannot be undone.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={workingId !== null}
                  onClick={() => setPendingDeleteMember(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="cursor-pointer"
                  disabled={workingId !== null}
                  onClick={() => void confirmDeleteMember()}
                >
                  {workingId !== null && <Loader2 className="animate-spin" />}
                  Delete account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading accounts…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          {error}
        </div>
      ) : (
        <>
          <div className="relative">
            <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              aria-label={`Search ${title.toLowerCase()}`}
              className="w-full rounded-2xl border bg-card py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {filteredMembers.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
               No {isAdminList ? "admin accounts" : "member or volunteer accounts"} match your search.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => {
                const isAdmin = adminRoles.has(member.role);
                const isVolunteer = member.role === "volunteer";
                const isWorking = workingId === member.id;

                return (
                  <article key={member.id} className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                          <p className="text-xs text-muted-foreground">
                            Member ID #{member.id} · Joined {formatDate(member.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2 sm:flex-col md:flex-row">
                        {!isAdmin && !isVolunteer && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isWorking}
                            onClick={() => void promoteMember(member)}
                          >
                            {isWorking ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="mr-1.5 h-4 w-4" />
                            )}
                            Make admin
                          </Button>
                        )}
                        {isAdmin && member.role !== "super_admin" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isWorking}
                            onClick={() => void makeMember(member)}
                          >
                            {isWorking ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <UserRound className="mr-1.5 h-4 w-4" />
                            )}
                            Remove admin
                          </Button>
                        )}
                        {(user.role === "super_admin" || !isAdmin) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isWorking}
                            onClick={() => setPendingDeleteMember(member)}
                          >
                            {isWorking ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-1.5 h-4 w-4" />
                            )}
                            Delete
                          </Button>
                        )}
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