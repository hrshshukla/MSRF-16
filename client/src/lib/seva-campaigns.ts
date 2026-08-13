import { useQueries } from "@tanstack/react-query";
import { useListCampaigns, type Campaign as ApiCampaign } from "@/lib/api-client";
import { sevaDonations } from "@/lib/seva-donations";
import type { CampaignDonationCardData } from "@/components/campaigns/campaign-donation-card";
import { getCampaignDonationSnapshot } from "@/components/campaigns/razorpay-donation-button";

const featuredCampaignCards: CampaignDonationCardData[] = sevaDonations.map((campaign) => ({
  id: campaign.id,
  title: campaign.title,
  description: campaign.description,
  image: campaign.image,
  raised: campaign.raised,
  goal: campaign.goal,
  donors: [],
  status: campaign.status,
  donateHref: `/seva-campaigns/${campaign.id}`,
  detailsHref: `/seva-campaigns/${campaign.id}`,
}));

function toCardData(campaign: ApiCampaign, donors: CampaignDonationCardData["donors"] = []): CampaignDonationCardData {
  const featuredCampaign = featuredCampaignCards.find((item) => item.title === campaign.title);

  if (featuredCampaign) {
    return {
      ...featuredCampaign,
      description: campaign.description,
      image: campaign.imageUrl ?? featuredCampaign.image,
      raised: campaign.raisedAmountInr,
      goal: campaign.goalAmountInr,
      donors,
      status: campaign.status,
    };
  }

  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    image: campaign.imageUrl,
    raised: campaign.raisedAmountInr,
    goal: campaign.goalAmountInr,
    donors,
    status: campaign.status,
    donateHref: `/campaigns/${campaign.id}`,
    detailsHref: `/campaigns/${campaign.id}`,
  };
}

export function useSevaCampaigns() {
  const query = useListCampaigns({ status: "active" });
  const apiCampaigns = query.data ?? [];
  const donorQueries = useQueries({
    queries: apiCampaigns.map((campaign) => ({
      queryKey: ["/api/payments/campaigns", campaign.id, "donors"],
      queryFn: () => getCampaignDonationSnapshot(campaign.id),
      staleTime: 30_000,
    })),
  });
  const topDonorsByCampaignId = new Map(
    apiCampaigns.map((campaign, index) => [campaign.id, donorQueries[index]?.data?.topDonors ?? []]),
  );
  const campaigns = [
    ...featuredCampaignCards.map((campaign) => {
      const apiCampaign = apiCampaigns.find((item) => item.title === campaign.title);
      return apiCampaign
        ? toCardData(apiCampaign, topDonorsByCampaignId.get(apiCampaign.id))
        : campaign;
    }),
    ...apiCampaigns
      .filter((campaign) => !featuredCampaignCards.some((item) => item.title === campaign.title))
      .map((campaign) => toCardData(campaign, topDonorsByCampaignId.get(campaign.id))),
  ];

  return {
    ...query,
    campaigns,
  };
}