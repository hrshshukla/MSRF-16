import { ArrowLeft, Heart } from "lucide-react";
import { useLayoutEffect } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/lib/auth-context";
import { sevaDonations } from "@/lib/seva-donations";
import { formatCompactINR } from "@/components/campaigns/campaign-donation-card";
import { useListCampaigns } from "@/lib/api-client";
import {
  RazorpayDonationButton,
  useCampaignDonationSnapshot,
  type DonationSnapshot,
} from "@/components/campaigns/razorpay-donation-button";

export function SevaDonationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const donation = sevaDonations.find((item) => item.id === id);
  const { data: apiCampaigns } = useListCampaigns({ limit: 100 });
  const apiCampaign = apiCampaigns?.find((campaign) => campaign.title === donation?.title);
  const fallbackSnapshot: DonationSnapshot = {
    campaign: {
      id: apiCampaign?.id ?? 0,
      title: donation?.title ?? "",
      goalAmountInr: apiCampaign?.goalAmountInr ?? donation?.goal ?? 0,
      raisedAmountInr: apiCampaign?.raisedAmountInr ?? donation?.raised ?? 0,
    },
    donors: donation?.donors.map((donor, index) => ({
      id: -(index + 1),
      name: donor.name,
      profileImageUrl: null,
      amount: donor.amount,
      donatedAt: "",
    })) ?? [],
  };
  const { snapshot, refresh: refreshDonationSnapshot } = useCampaignDonationSnapshot(
    apiCampaign?.id ?? null,
    fallbackSnapshot,
  );
  const currentUserDonorIndex = user && donation
    ? snapshot.donors.findIndex(
        (donor) =>
          donor.name.trim().toLowerCase() === user.name.trim().toLowerCase(),
      )
    : -1;
  const currentUserDonor =
    donation && currentUserDonorIndex >= 0 ? snapshot.donors[currentUserDonorIndex] : null;
  const showCurrentUserSpotlight = currentUserDonor !== null;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  if (!donation) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Heart className="mb-5 h-12 w-12 text-primary/50" />
        <h1 className="font-serif text-3xl font-bold">Seva campaign not found</h1>
        <p className="mt-3 text-muted-foreground">The seva campaign you are looking for is unavailable.</p>
        <Link href="/#seva-campaigns" className="mt-6">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Seva Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  const progress = snapshot.campaign.goalAmountInr > 0
    ? Math.min(100, Math.round((snapshot.campaign.raisedAmountInr / snapshot.campaign.goalAmountInr) * 100))
    : 0;
  const totalDonors = snapshot.donors.length;

  return (
    <div className="w-full pb-24">
      <header className="relative overflow-hidden border-b bg-card py-12 md:py-16">
        <div className="mandala-bg text-primary opacity-[0.03]" />
        <div className="container relative z-10 mx-auto px-4 md:px-8">
          <Link
            href="/#seva-campaigns"
            className="mb-8 inline-flex items-center text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Seva Campaigns
          </Link>
          <h1 className="max-w-4xl font-serif text-4xl font-bold tracking-tight md:text-6xl">{donation.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{donation.description}</p>
        </div>
      </header>

      <main className="container mx-auto mt-12 grid gap-10 px-4 md:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div>
          <img
            src={donation.image}
            alt={donation.title}
            className="h-72 w-full rounded-3xl object-cover shadow-sm md:h-[28rem]"
          />

          <section className="mt-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">About this seva</p>
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Together, we can serve with purpose</h2>
            <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{donation.details}</p>
          </section>

          <div className="mt-10 rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
            <h2 className="font-serif text-2xl font-bold">Support this seva</h2>
            <div className="mt-6">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-primary">{formatCompactINR(snapshot.campaign.raisedAmountInr)}</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    raised of {formatCompactINR(snapshot.campaign.goalAmountInr)} goal
                  </p>
                </div>
                <span className="text-lg font-bold text-primary">{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <RazorpayDonationButton
              campaignId={apiCampaign?.id ?? null}
              campaignTitle={donation.title}
              user={user}
              disabled={!apiCampaign}
              onDonationComplete={() => void refreshDonationSnapshot()}
            />
            {!apiCampaign && (
              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                Online donations are being connected for this campaign.
              </p>
            )}
          </div>

        </div>

        <aside>
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm md:p-6 lg:sticky lg:top-28">
            <div className="mb-6 flex flex-col gap-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">All donors</p>
                <h2 className="mt-2 whitespace-nowrap font-serif text-xl font-bold leading-tight sm:text-2xl">Every contribution matters</h2>
              </div>
              <span className="self-start text-sm font-semibold text-muted-foreground">{totalDonors} contributors</span>
            </div>

            {showCurrentUserSpotlight && currentUserDonor && (
              <div className="mb-5 rounded-3xl border border-primary/20 bg-primary/[0.04] p-3">
                <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">
                  Your contribution · #{currentUserDonorIndex + 1}
                </p>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-card/90 px-3 py-4 shadow-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">
                      {currentUserDonorIndex + 1}
                    </span>
                    <UserAvatar
                      name={currentUserDonor.name}
                       imageUrl={currentUserDonor.profileImageUrl ?? user?.profileImageUrl}
                      className="h-8 w-8 border border-background shadow-sm"
                      fallbackClassName="bg-primary text-[10px] font-extrabold text-primary-foreground"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{currentUserDonor.name}</p>
                      <p className="text-[11px] leading-tight text-muted-foreground">
                        Your place in the donor list
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-primary">
                    {formatCompactINR(currentUserDonor.amount)}
                  </span>
                </div>
              </div>
            )}

            <div
              className="composer-scrollbar max-h-[38rem] overflow-y-auto rounded-3xl border border-border/70 bg-background"
            >
              <div className="divide-y divide-border/70">
                {snapshot.donors.map((donor, index) => (
                  <div
                    key={`${donor.id}-${donor.name}`}
                    className={`flex items-center justify-between gap-3 px-3 py-4 ${
                      index < 3 ? "donor-shine-row" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {index < 3 ? (
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-extrabold shadow-sm ${
                            index === 0
                              ? "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-300"
                              : index === 1
                                ? "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-400/40 dark:bg-slate-400/15 dark:text-slate-300"
                                : "border-orange-300 bg-orange-100 text-orange-700 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-300"
                          }`}
                        >
                          {index + 1}
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-xs font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                      <UserAvatar
                        name={donor.name}
                        imageUrl={donor.profileImageUrl}
                        className="h-8 w-8 border border-background shadow-sm"
                        fallbackClassName="bg-primary text-[10px] font-extrabold text-primary-foreground"
                      />
                      <span className="min-w-0 truncate text-sm font-semibold">{donor.name}</span>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-primary">{formatCompactINR(donor.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}