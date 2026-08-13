import { Link } from "wouter";
import { useGetAccountDashboard } from "@/lib/api-client";
import {
  ArrowRight,
  CalendarCheck,
  IndianRupee,
  Loader2,
  MessageSquare,
  ReceiptIndianRupee,
  Sparkles,
} from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function AccountDashboardPage() {
  const { data, isLoading, isError } = useGetAccountDashboard();

  if (isLoading) {
    return (
      <div className="flex justify-center rounded-2xl border bg-card py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          We could not load your account activity right now. Please try again shortly.
        </p>
      </div>
    );
  }

  const { summary, donations, participations } = data;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Member overview</p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-foreground">Dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep track of your giving, participation, and community activity.
            </p>
          </div>
          <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-primary/10 p-4">
            <IndianRupee className="h-5 w-5 text-primary" />
            <p className="mt-4 text-2xl font-bold text-foreground">{formatCurrency(summary.totalDonatedInr)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Total donated</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
            <ReceiptIndianRupee className="h-5 w-5 text-amber-700" />
            <p className="mt-4 text-2xl font-bold text-foreground">{summary.donationCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Donation records</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
            <CalendarCheck className="h-5 w-5 text-blue-700" />
            <p className="mt-4 text-2xl font-bold text-foreground">{summary.participationCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Events participated</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <MessageSquare className="h-5 w-5 text-emerald-700" />
            <p className="mt-4 text-2xl font-bold text-foreground">{summary.postCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Community posts</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-bold">Where you donated</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your recorded contribution history.</p>
            </div>
            <IndianRupee className="h-5 w-5 text-primary" />
          </div>
          {donations.length ? (
            <div className="divide-y">
              {donations.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{donation.campaignTitle ?? "Foundation support"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[donation.location, formatDate(donation.donatedAt)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-primary">{formatCurrency(donation.amountInr)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-7 text-center">
              <p className="text-sm text-muted-foreground">No donation records are linked to your account yet.</p>
              <Link href="/seva#campaigns" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Explore campaigns <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-bold">Where you participated</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your recorded event participation.</p>
            </div>
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          {participations.length ? (
            <div className="divide-y">
              {participations.map((participation) => (
                <div key={participation.id} className="py-3">
                  <p className="text-sm font-semibold">{participation.eventTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {participation.eventDate} · {participation.location}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium capitalize text-primary">
                    {participation.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-7 text-center">
              <p className="text-sm text-muted-foreground">No event participation records are linked to your account yet.</p>
              <Link href="/seva#events" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View events <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}