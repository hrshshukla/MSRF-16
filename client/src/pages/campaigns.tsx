import { Heart } from "lucide-react";
import { CampaignDonationCard } from "@/components/campaigns/campaign-donation-card";
import { useSevaCampaigns } from "@/lib/seva-campaigns";

export function CampaignsSection() {
  const { campaigns, isLoading } = useSevaCampaigns();

  return (
    <section id="campaigns" className="scroll-mt-28 py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Campaigns</p>
          <h2 className="font-serif text-4xl font-bold md:text-5xl">Seva Campaigns</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join us in our ongoing efforts to support communities, build infrastructure, and provide emergency relief across the nation.
          </p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border bg-card overflow-hidden shadow-sm animate-pulse h-[400px]">
                <div className="h-48 bg-muted w-full" />
                <div className="p-6">
                  <div className="h-6 bg-muted rounded w-2/3 mb-4" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-4/5 mb-6" />
                  <div className="h-2 bg-muted rounded w-full mb-2" />
                </div>
              </div>
            ))}
          </div>
        ) : !campaigns?.length ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No active campaigns</h3>
            <p className="text-muted-foreground">There are currently no active campaigns. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <CampaignDonationCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function CampaignsPage() {
  return (
    <div className="w-full pb-24 relative">
      <div className="bg-card border-b pt-24 pb-16 relative overflow-hidden">
        <div className="mandala-bg text-secondary opacity-[0.03]" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Seva Campaigns</h1>
          <p className="text-lg text-muted-foreground">
            Join us in our ongoing efforts to support communities, build infrastructure, and provide emergency relief across the nation.
          </p>
        </div>
      </div>
      <CampaignsSection />
    </div>
  );
}
