import { ArrowRight, Heart, Trophy } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { RazorpayDonationButton } from "@/components/campaigns/razorpay-donation-button";
import { useAuth } from "@/lib/auth-context";

export type CampaignCardDonor = {
  name: string;
  profileImageUrl?: string | null;
  amount: number;
};

export type CampaignCardStatus =
  "active" | "ongoing" | "paused" | "upcoming" | "completed" | "stopped";

export type CampaignDonationCardData = {
  id: string | number;
  title: string;
  description: string;
  image: string | null;
  raised: number;
  goal: number;
  donors: CampaignCardDonor[];
  status?: CampaignCardStatus;
  donateHref: string;
  detailsHref: string;
};

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactINR(value: number) {
  const units = [
    { divisor: 10_000_000, suffix: "Cr" },
    { divisor: 100_000, suffix: "L" },
    { divisor: 1_000, suffix: "K" },
  ];
  const unit = units.find(({ divisor }) => value >= divisor);

  if (!unit) {
    return formatINR(value);
  }

  const compactValue = value / unit.divisor;
  const formattedValue = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(compactValue);

  return `₹${formattedValue}${unit.suffix}`;
}

function campaignStatusStyles(status: CampaignCardStatus = "ongoing") {
  if (status === "paused" || status === "stopped") {
    return {
      label: "Paused",
      className: "bg-amber-950/75 text-amber-100",
      dotClassName: "bg-amber-300",
    };
  }
  if (status === "completed") {
    return {
      label: "Completed",
      className: "bg-emerald-950/75 text-emerald-100",
      dotClassName: "bg-emerald-300",
    };
  }
  if (status === "upcoming") {
    return {
      label: "Upcoming",
      className: "bg-sky-950/75 text-sky-100",
      dotClassName: "bg-sky-300",
    };
  }
  return {
    label: "Ongoing",
    className: "bg-green-950/75 text-green-100",
    dotClassName: "bg-green-300",
  };
}

export function CampaignDonationCard({
  campaign,
}: {
  campaign: CampaignDonationCardData;
}) {
  const { user } = useAuth();
  const progress =
    campaign.goal > 0
      ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100))
      : 0;
  const topDonors = campaign.donors.slice(0, 3);
  const status = campaignStatusStyles(campaign.status);

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-72 overflow-hidden bg-muted sm:h-96">
        {campaign.image ? (
          <img
            src={campaign.image}
            alt={campaign.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary">
            <Heart className="h-12 w-12 opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <div
          className={`absolute bottom-4 left-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] shadow-sm backdrop-blur-sm ${status.className}`}
        >
          <span
            className={`h-2 w-2 rounded-full animate-pulse ${status.dotClassName}`}
            aria-hidden="true"
          />
          {status.label}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-2xl font-bold">{campaign.title}</h3>
        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {campaign.description}
        </p>

        <div className="mt-6">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-xl font-extrabold tracking-tight text-primary">
                {formatCompactINR(campaign.raised)}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                raised of {formatCompactINR(campaign.goal)}
              </p>
            </div>
            <span className="text-sm font-bold text-muted-foreground">
              {progress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6">
          <RazorpayDonationButton
            campaignId={Number(campaign.id)}
            campaignTitle={campaign.title}
            user={user}
            className="w-full rounded-full bg-primary text-white hover:bg-primary/90"
          />
        </div>

        <div className="mt-6 border-t pt-5">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-secondary" />
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Top donors
            </p>
          </div>
          {topDonors.length > 0 ? (
            <div className="space-y-2">
              {topDonors.map((donor) => (
                <div
                  key={donor.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <UserAvatar
                      name={donor.name}
                      imageUrl={donor.profileImageUrl}
                      className="h-8 w-8 border border-background shadow-sm"
                      fallbackClassName="bg-primary text-[10px] font-extrabold text-primary-foreground"
                    />
                    <span className="truncate font-medium">{donor.name}</span>
                  </div>
                  <span className="shrink-0 font-bold text-primary">
                    {formatCompactINR(donor.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Be the first donor to support this seva.
            </p>
          )}
        </div>

        <Link href={campaign.detailsHref} className="mt-5 cursor-pointer">
          <Button variant="outline" className="w-full rounded-full">
            See details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </article>
  );
}
