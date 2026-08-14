import { useGetCampaign, type Campaign } from "@/lib/api-client";
import { useLayoutEffect, useState } from "react";
import { Link, Redirect, useParams } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatCompactINR, formatINR } from "@/components/campaigns/campaign-donation-card";
import { Heart, Calendar, MapPin, ArrowLeft, Share2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { sevaDonations } from "@/lib/seva-donations";
import { useQueryClient } from "@tanstack/react-query";
import {
  RazorpayDonationButton,
  useCampaignDonationSnapshot,
  type DonationSnapshot,
} from "@/components/campaigns/razorpay-donation-button";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/hooks/use-toast";

export function CampaignDetail() {
  const params = useParams();
  const id = Number(params.id);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);
  
  const { data: campaign, isLoading, isError } = useGetCampaign(id, { 
    query: { enabled: Number.isInteger(id) && id > 0, queryKey: [`/api/campaigns/${id}`] },
  });

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading campaign...</div>;
  }

  if (isError || !campaign) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Campaign Not Found</h2>
        <Link href="/seva#campaigns">
          <Button variant="outline">Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  const matchingDonation = sevaDonations.find((donation) => donation.title === campaign.title);
  if (matchingDonation) {
    return <Redirect to={`/seva-campaigns/${matchingDonation.id}`} />;
  }

  return <CampaignDetailContent campaign={campaign} />;
}

function CampaignDetailContent({
  campaign,
}: {
  campaign: Campaign;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const fallbackSnapshot: DonationSnapshot = {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      goalAmountInr: campaign.goalAmountInr,
      raisedAmountInr: campaign.raisedAmountInr,
    },
    donors: [],
    topDonors: [],
  };
  const { snapshot, refresh: refreshDonationSnapshot } = useCampaignDonationSnapshot(
    campaign.id,
    fallbackSnapshot,
  );
  const progress = snapshot.campaign.goalAmountInr > 0
    ? Math.min(100, Math.round((snapshot.campaign.raisedAmountInr / snapshot.campaign.goalAmountInr) * 100))
    : 0;

  const refreshCampaignData = () => {
    void refreshDonationSnapshot();
    void queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        typeof queryKey[0] === "string" && queryKey[0].startsWith("/api/campaigns"),
    });
  };

  const totalDonors = snapshot.donors.length;

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: `Support ${campaign.title}`,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      setIsSharing(true);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Campaign link copied",
          description: "Share it with your friends and family.",
        });
      } else {
        window.prompt("Copy this campaign link", shareUrl);
      }
    } catch {
      toast({
        title: "Unable to share campaign",
        description: `Copy this link: ${shareUrl}`,
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="w-full pb-24">
      <div className="bg-muted pt-8 pb-2 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <Link href="/seva#campaigns" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={16} className="mr-2" /> Back to all campaigns
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 max-w-4xl">{campaign.title}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-12 flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3">
          {campaign.imageUrl ? (
            <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-auto rounded-3xl object-cover mb-8 shadow-sm" />
          ) : (
            <div className="w-full aspect-video rounded-3xl bg-muted flex items-center justify-center text-muted-foreground/30 mb-8">
              <Heart size={64} />
            </div>
          )}
          
          <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:text-muted-foreground">
            <h2>About this Campaign</h2>
            <p className="whitespace-pre-line">{campaign.description}</p>
          </div>
        </div>
        
        <div className="lg:w-1/3 space-y-6">
          <div className="sticky top-28 bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="font-serif text-2xl font-bold mb-6">Donation Progress</h3>
            
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <div>
                   <p className="text-3xl font-bold text-foreground">{formatINR(snapshot.campaign.raisedAmountInr)}</p>
                   <p className="whitespace-nowrap text-sm text-muted-foreground font-medium mt-1">raised of {formatINR(snapshot.campaign.goalAmountInr)} goal</p>
                </div>
                <span className="text-lg font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 rounded-full" indicatorClassName="bg-primary" />
            </div>
            
            <div className="space-y-4 mb-8">
               <RazorpayDonationButton
                 campaignId={campaign.id}
                 campaignTitle={campaign.title}
                 user={user}
                 className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                  onDonationComplete={refreshCampaignData}
               />
              <Button size="lg" variant="outline" onClick={handleShare} disabled={isSharing} className="w-full h-14 rounded-xl font-medium gap-2">
                 <Share2 size={18} /> {isSharing ? "Preparing link…" : "Share Campaign"}
              </Button>
            </div>
            
            <div className="space-y-4 pt-6 border-t text-sm">
              {campaign.location && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="text-primary" size={18} />
                  <span className="font-medium text-foreground">Location:</span> {campaign.location}
                </div>
              )}
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="text-primary" size={18} />
                <span className="font-medium text-foreground">Started:</span> {format(new Date(campaign.startDate), "MMM d, yyyy")}
              </div>
              {campaign.endDate && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="text-primary" size={18} />
                  <span className="font-medium text-foreground">Ends:</span> {format(new Date(campaign.endDate), "MMM d, yyyy")}
                </div>
              )}
            </div>

            <section className="mt-8 border-t pt-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-secondary" />
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">All donors</p>
                  </div>
                  <h3 className="mt-2 font-serif text-2xl font-bold">Every contribution matters</h3>
                </div>
                <span className="shrink-0 text-sm font-semibold text-muted-foreground">
                  {totalDonors} {totalDonors === 1 ? "contributor" : "contributors"}
                </span>
              </div>

              <div className="max-h-[32rem] overflow-y-auto rounded-2xl border border-border/70 bg-background">
                {snapshot.donors.length > 0 ? (
                  <div className="divide-y divide-border/70">
                    {snapshot.donors.map((donor, index) => (
                      <div key={`${donor.id}-${donor.name}`} className="flex items-center justify-between gap-3 px-3 py-4">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {index + 1}
                          </span>
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
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">Be the first donor to support this campaign.</p>
                )}
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
