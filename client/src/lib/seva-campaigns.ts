import { useListCampaigns, type Campaign as ApiCampaign } from "@/lib/api-client";
import { sevaDonations } from "@/lib/seva-donations";
import type { CampaignDonationCardData } from "@/components/campaigns/campaign-donation-card";

const featuredCampaignCards: CampaignDonationCardData[] = sevaDonations.map((campaign) => ({
  id: campaign.id,
  title: campaign.title,
  description: campaign.description,
  image: campaign.image,
  raised: campaign.raised,
  goal: campaign.goal,
  donors: campaign.donors,
  status: campaign.status,
  donateHref: `/seva-campaigns/${campaign.id}`,
  detailsHref: `/seva-campaigns/${campaign.id}`,
}));

function toCardData(campaign: ApiCampaign): CampaignDonationCardData {
  const featuredCampaign = featuredCampaignCards.find((item) => item.title === campaign.title);

  if (featuredCampaign) {
    return {
      ...featuredCampaign,
      description: campaign.description,
      image: campaign.imageUrl ?? featuredCampaign.image,
      raised: campaign.raisedAmountInr,
      goal: campaign.goalAmountInr,
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
    donors: [],
    status: campaign.status,
    donateHref: `/campaigns/${campaign.id}`,
    detailsHref: `/campaigns/${campaign.id}`,
  };
}

export function useSevaCampaigns() {
  const query = useListCampaigns({ status: "active" });
  const apiCampaigns = query.data ?? [];
  const campaigns = [
    ...featuredCampaignCards.map((campaign) => {
      const apiCampaign = apiCampaigns.find((item) => item.title === campaign.title);
      return apiCampaign ? toCardData(apiCampaign) : campaign;
    }),
    ...apiCampaigns
      .filter((campaign) => !featuredCampaignCards.some((item) => item.title === campaign.title))
      .map(toCardData),
  ];

  return {
    ...query,
    campaigns,
  };
}