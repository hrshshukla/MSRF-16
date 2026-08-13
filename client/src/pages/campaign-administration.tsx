import { ArrowRight, Edit3, Megaphone, Plus, Square, Trash2 } from "lucide-react";
import { Link, Redirect } from "wouter";
import { useAuth } from "@/lib/auth-context";

export function CampaignAdministrationPage() {
  const { user } = useAuth();

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <Redirect to="/settings" />;
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Administration</p>
        <h2 className="mt-2 font-serif text-3xl font-bold">Manage campaigns</h2>
        <p className="mt-2 text-muted-foreground">
          Create new seva campaigns or manage the campaigns already published on the public site.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/settings/campaigns/create"
          className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold">Create new campaign</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add a new campaign with its title, description, fundraising goal, status, and image.
          </p>
        </Link>

        <Link
          href="/settings/campaigns/manage"
          className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold">Manage existing campaigns</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Edit campaign values, stop a campaign so it leaves active listings, or delete it permanently.
          </p>
        </Link>
      </div>

    </section>
  );
}