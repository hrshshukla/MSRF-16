import { useEffect, useState } from "react";
import { Check, Clock3, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-response";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/user-avatar";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

type VolunteerApplication = {
  id: number;
  userId: number;
  applicantName: string;
  applicantProfileImageUrl: string | null;
  applicantEmail: string;
  applicantPhone: string | null;
  skills: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  createdAt: string;
  readAt: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ManageVolunteersPage() {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  async function loadApplications() {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/volunteer-applications`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await readApiResponse<{ applications?: VolunteerApplication[]; error?: string }>(
        response,
      );
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, body, "Unable to load applications"));
      }
      setApplications(body?.applications ?? []);
      const readResponse = await fetch(`${API}/volunteer-applications/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (readResponse.ok) {
        window.dispatchEvent(new CustomEvent("volunteer-applications-read"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load applications");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, [accessToken]);

  async function updateApplication(id: number, status: "approved" | "rejected") {
    if (!accessToken) return;
    setUpdatingId(id);
    try {
      const response = await fetch(`${API}/volunteer-applications/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, body, "Unable to update application"));
      }
      toast({
        title: status === "approved" ? "Volunteer approved" : "Application rejected",
        description:
          status === "approved"
            ? "The volunteer application has been approved."
            : "The application status has been updated to rejected.",
      });
      await loadApplications();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err instanceof Error ? err.message : "Unable to update application",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = applications.filter((application) => application.status === "pending").length;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredApplications = applications.filter((application) =>
    application.applicantName.toLowerCase().includes(normalizedSearch),
  );

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Administration
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold">Manage volunteer</h2>
        <p className="mt-2 text-muted-foreground">
          Review volunteer applications and approve or reject them.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading applications…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          {error}
        </div>
          ) : applications.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <Clock3 className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-semibold">No applications yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            New volunteer applications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 rounded-2xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{pendingCount}</span>{" "}
              pending {pendingCount === 1 ? "application" : "applications"}
            </p>
            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by member name"
                aria-label="Search volunteer applications by member name"
                className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
          {filteredApplications.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
              No applications match “{search}”.
            </div>
          ) : (
            filteredApplications.map((application) => {
              const isPending = application.status === "pending";
              const cardKey = application.id > 0 ? application.id : `decided-${application.userId}`;

              return (
                <article
                  key={cardKey}
                  className={`rounded-2xl border bg-card shadow-sm ${isPending ? "p-5" : "p-3 sm:p-4"}`}
                >
                  {isPending ? (
                    <>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <UserAvatar
                            name={application.applicantName}
                            imageUrl={application.applicantProfileImageUrl}
                            className="h-11 w-11 bg-primary/10 text-sm font-semibold text-primary"
                            fallbackClassName="bg-primary/10 text-primary"
                          />
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">{application.applicantName}</h3>
                            <p className="truncate text-sm text-muted-foreground">{application.applicantEmail}</p>
                            {application.applicantPhone && (
                              <p className="text-sm text-muted-foreground">{application.applicantPhone}</p>
                            )}
                          </div>
                        </div>
                        <span className="w-fit shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-800">
                          Pending
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 border-t pt-5 md:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-semibold">Skills and experience</h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                            {application.skills}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">Why they want to volunteer</h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                            {application.message}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                          Applied {formatDate(application.createdAt)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === application.id}
                            onClick={() => void updateApplication(application.id, "rejected")}
                          >
                            {updatingId === application.id ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <X className="mr-1.5 h-4 w-4" />
                            )}
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={updatingId === application.id}
                            onClick={() => void updateApplication(application.id, "approved")}
                          >
                            {updatingId === application.id ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-1.5 h-4 w-4" />
                            )}
                            Approve
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                          name={application.applicantName}
                          imageUrl={application.applicantProfileImageUrl}
                          className="h-10 w-10 bg-primary/10 text-sm font-semibold text-primary"
                          fallbackClassName="bg-primary/10 text-primary"
                        />
                        <p className="truncate font-semibold">{application.applicantName}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          application.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}