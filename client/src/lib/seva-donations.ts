const gauSevaImage = "https://ik.imagekit.io/harshshukla/campaigns/legacy/gau-seva.jpg";
const foodDistributionImage = "https://ik.imagekit.io/harshshukla/campaigns/legacy/food-seva.jpg";
const medicalCampImage = "https://ik.imagekit.io/harshshukla/campaigns/legacy/medical-camp.jpg";

export type SevaDonor = {
  name: string;
  amount: number;
  donorEmail?: string;
};

export type SevaDonation = {
  id: string;
  title: string;
  description: string;
  details: string;
  image: string;
  raised: number;
  goal: number;
  donors: SevaDonor[];
  status?: "ongoing" | "paused" | "completed";
};

export const sevaDonations: SevaDonation[] = [

];