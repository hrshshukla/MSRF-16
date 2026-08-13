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
  {
    id: "gau-seva-shelter",
    title: "Gau Seva",
    description: "Help provide daily fodder, medicine, and shelter care for rescued cows.",
    details:
      "This seva supports the daily care of rescued and abandoned cows through nutritious fodder, veterinary treatment, shelter maintenance, and compassionate rehabilitation. Every contribution helps create a safer, healthier home for these sacred animals.",
    image: gauSevaImage,
    raised: 165000,
    goal: 250000,
    donors: [
      { name: "Aarav Sharma", amount: 51000 },
      { name: "Meera Joshi", amount: 35000 },
      { name: "Rohan Gupta", amount: 25000 },
      { name: "Kavya Patel", amount: 18000 },
      { name: "Vikram Desai", amount: 12000 },
      { name: "Ananya Rao", amount: 9000 },
      { name: "Suresh Rao", amount: 7500 },
      { name: "Pankaj Mishra", amount: 6500 },
      { name: "Neha Agarwal", amount: 5500 },
      { name: "Arjun Menon", amount: 4500 },
      {
        name: "Harsh Shukla",
        amount: 4000,
        donorEmail: "talktoharshshukla@gmail.com",
      },
      { name: "Divya Shah", amount: 3500 },
      { name: "Rajiv Nair", amount: 3000 },
      { name: "Simran Kaur", amount: 2500 },
      { name: "Mohan Das", amount: 2000 },
      { name: "Tara Iyer", amount: 1500 },
      { name: "Kiran Patel", amount: 1000 },
      { name: "Ramesh Yadav", amount: 900 },
      { name: "Asha Mehta", amount: 800 },
      { name: "Nitin Joshi", amount: 700 },
      { name: "Lata Sharma", amount: 600 },
    ],
  },
  {
    id: "food-seva-families",
    title: "Food Distribution",
    description: "Support nourishing meal distribution for families and communities in need.",
    details:
      "Food Seva brings fresh, nourishing meals to families, children, elders, and people facing hardship. Donations help cover groceries, preparation, packing, and distribution so that a warm meal can reach more people with dignity.",
    image: foodDistributionImage,
    raised: 112000,
    goal: 180000,
    donors: [
      { name: "Nisha Verma", amount: 32000 },
      { name: "Devendra Singh", amount: 24000 },
      { name: "Ishita Mehta", amount: 19000 },
      { name: "Sanjay Kapoor", amount: 15000 },
      { name: "Priya Nair", amount: 12000 },
      { name: "Aditya Shah", amount: 10000 },
      { name: "Rahul Desai", amount: 7500 },
      { name: "Sonal Kapoor", amount: 6500 },
      { name: "Manoj Rao", amount: 5500 },
      { name: "Anita Menon", amount: 4500 },
      { name: "Kunal Bhat", amount: 3500 },
      { name: "Madhuri Jain", amount: 3000 },
      { name: "Vivek Soni", amount: 2500 },
      { name: "Pallavi Shah", amount: 2000 },
      { name: "Gaurav Iyer", amount: 1500 },
      { name: "Rakesh Patel", amount: 1000 },
      { name: "Shweta Yadav", amount: 900 },
      { name: "Anil Mehta", amount: 800 },
      { name: "Priti Joshi", amount: 700 },
      { name: "Mukul Sharma", amount: 600 },
    ],
  },
  {
    id: "medical-camp",
    title: "Medical Camp",
    description: "Bring essential checkups, medicines, and healthcare guidance to underserved communities.",
    details:
      "Community Medical Camps connect underserved neighborhoods with doctors, screenings, essential medicines, and practical health guidance. This appeal helps fund medical supplies, volunteer coordination, and accessible care for every visitor.",
    image: medicalCampImage,
    raised: 210000,
    goal: 300000,
    donors: [
      { name: "Sanjana Kulkarni", amount: 60000 },
      { name: "Harish Malhotra", amount: 45000 },
      { name: "Pooja Iyer", amount: 30000 },
      { name: "Manish Bhatia", amount: 25000 },
      { name: "Ritu Sethi", amount: 22000 },
      { name: "Neel Joshi", amount: 18000 },
      { name: "Vishal Rao", amount: 7500 },
      { name: "Kavita Mishra", amount: 6500 },
      { name: "Ankur Agarwal", amount: 5500 },
      { name: "Reena Menon", amount: 4500 },
      { name: "Sahil Shah", amount: 3500 },
      { name: "Maya Nair", amount: 3000 },
      { name: "Ravi Kaur", amount: 2500 },
      { name: "Uma Das", amount: 2000 },
      { name: "Ira Iyer", amount: 1500 },
      { name: "Keshav Patel", amount: 1000 },
      { name: "Naveen Yadav", amount: 900 },
      { name: "Suman Mehta", amount: 800 },
      { name: "Deepak Joshi", amount: 700 },
      { name: "Alka Sharma", amount: 600 },
    ],
  },
];