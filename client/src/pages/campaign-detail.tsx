import { useGetCampaign } from "@/lib/api-client";
import { useLayoutEffect } from "react";
import { Link, Redirect, useParams } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/components/campaigns/campaign-donation-card";
import { Heart, Calendar, MapPin, ArrowLeft, Share2 } from "lucide-react";
import { format } from "date-fns";
import { sevaDonations } from "@/lib/seva-donations";

export function CampaignDetail() {
  const params = useParams();
  const id = Number(params.id);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);
  
  const { data: campaign, isLoading, isError } = useGetCampaign(id, { 
    query: { enabled: !!id, queryKey: ["/api/campaigns", id] } 
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

  const progress = Math.min(100, Math.round((campaign.raisedAmountInr / campaign.goalAmountInr) * 100));

  return (
    <div className="w-full pb-24">
      <div className="bg-muted py-8 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <Link href="/seva#campaigns" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={16} className="mr-2" /> Back to all campaigns
          </Link>
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-primary mb-4">
            <span className="px-2.5 py-1 bg-primary/10 rounded-md">{campaign.category}</span>
            <span className={`px-2.5 py-1 rounded-md ${campaign.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
              {campaign.status}
            </span>
          </div>
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
                  <p className="text-3xl font-bold text-foreground">{formatINR(campaign.raisedAmountInr)}</p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">raised of {formatINR(campaign.goalAmountInr)} goal</p>
                </div>
                <span className="text-lg font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 rounded-full" indicatorClassName="bg-primary" />
            </div>
            
            <div className="space-y-4 mb-8">
              <Button size="lg" className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
                Donate Now
              </Button>
              <Button size="lg" variant="outline" className="w-full h-14 rounded-xl font-medium gap-2">
                <Share2 size={18} /> Share Campaign
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
          </div>
        </div>
      </div>
    </div>
  );
}
