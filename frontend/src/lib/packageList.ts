export type CoursePackage = {
  slug: string;
  title: string;
  description: string;
  price: number;
  courses: string[];
};

export const PACKAGE_OPTIONS: CoursePackage[] = [
  {
    slug: "school-students",
    title: "School Students",
    price: 3999,
    description:
      "Build strong foundational computer, communication and learning skills.",
    courses: [
      "Abacus",
      "Spoken English",
      "Handwriting",
      "Computer Basics",
      "Typing Basics",
      "How to Focus on Education",
    ],
  },

  {
    slug: "college-students",
    title: "College Students",
    price: 6999,
    description:
      "Develop practical computer, programming and technology skills for academics and career growth.",
    courses: [
      "MS Word",
      "MS Excel",
      "MS PowerPoint",
      "Windows",
      "HTML",
      "C Language",
      "C++",
      "Python",
      "JAVA",
      "Data Structures",
      "AI Tools",
      "Power BI",
    ],
  },

  {
    slug: "business-jobseekers",
    title: "Business / Jobseekers",
    price: 3999,
    description:
      "Career-focused skills for business, employment, freelancing and professional growth.",
    courses: [
      "Tally",
      "Advanced Word",
      "Advanced Excel",
      "Digital Marketing",
      "Affiliate Marketing",
      "Free Launching Projects",
      "Data Entry",
      "Interview Preparation",
    ],
  },

  {
    slug: "home-makers",
    title: "Home Makers",
    price: 4999,
    description:
      "Learn practical digital and computer skills for online work, payments and home businesses.",
    courses: [
      "Computer Basics",
      "Online Work Skills",
      "Digital Payments",
      "Internet & Email",
      "Home Business Ideas",
    ],
  },

  {
    slug: "all-in-one",
    title: "All-in-One Package",
    price: 14999,
    description:
      "Get access to all courses and skills offered by SK Computer Education.",
    courses: [
      "Abacus",
      "Spoken English",
      "Handwriting",
      "Computer Basics",
      "Typing Basics",
      "How to Focus on Education",
      "MS Word",
      "MS Excel",
      "MS PowerPoint",
      "Windows",
      "HTML",
      "C Language",
      "C++",
      "Python",
      "JAVA",
      "Data Structures",
      "AI Tools",
      "Power BI",
      "Tally",
      "Advanced Word",
      "Advanced Excel",
      "Digital Marketing",
      "Affiliate Marketing",
      "Free Launching Projects",
      "Data Entry",
      "Interview Preparation",
      "Online Work Skills",
      "Digital Payments",
      "Internet & Email",
      "Home Business Ideas",
    ],
  },
];

export function getPackageBySlug(slug: string) {
  return PACKAGE_OPTIONS.find((pkg) => pkg.slug === slug);
}