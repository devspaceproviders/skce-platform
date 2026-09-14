import { db } from "../../prisma/db";

const courses = [
  {
    slug: "abacus",
    title: "Abacus",
  },
  {
    slug: "spoken-english",
    title: "Spoken English",
  },
  {
    slug: "handwriting",
    title: "Handwriting",
  },
  {
    slug: "computer-basics",
    title: "Computer Basics",
  },
  {
    slug: "typing-basics",
    title: "Typing Basics",
  },
  {
    slug: "focus-on-education",
    title: "How to Focus on Education",
  },
  {
    slug: "ms-word",
    title: "MS Word",
  },
  {
    slug: "ms-excel",
    title: "MS Excel",
  },
  {
    slug: "ms-powerpoint",
    title: "MS PowerPoint",
  },
  {
    slug: "windows",
    title: "Windows",
  },
  {
    slug: "html",
    title: "HTML",
  },
  {
    slug: "c-programming",
    title: "C Programming",
  },
  {
    slug: "cpp",
    title: "C++",
  },
  {
    slug: "python",
    title: "Python",
  },
  {
    slug: "java",
    title: "JAVA",
  },
  {
    slug: "data-structures",
    title: "Data Structures",
  },
  {
    slug: "ai-skills",
    title: "AI Skills",
  },
  {
    slug: "power-bi",
    title: "Power BI",
  },
  {
    slug: "tally",
    title: "Tally",
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
  },
  {
    slug: "affiliate-marketing",
    title: "Affiliate Marketing",
  },
  {
    slug: "free-launching-projects",
    title: "Free Launching Projects",
  },
  {
    slug: "data-entry",
    title: "Data Entry",
  },
  {
    slug: "interview-preparation",
    title: "Interview Preparation",
  },
  {
    slug: "online-work-skills",
    title: "Online Work Skills",
  },
  {
    slug: "digital-payments",
    title: "Digital Payments",
  },
  {
    slug: "internet-email",
    title: "Internet & Email",
  },
  {
    slug: "home-business-ideas",
    title: "Home Business Ideas",
  },
];

async function seedCourses() {
  console.log("Starting SKCE course seed...");

  for (const course of courses) {
    const existingCourse = await db.orm.public.Course.first({
      slug: course.slug,
    });

    if (existingCourse) {
      console.log(`Already exists: ${course.title}`);
      continue;
    }

    await db.orm.public.Course.create({
      slug: course.slug,
      title: course.title,
      mode: "ONLINE",
      isActive: true,
    });

    console.log(`Created: ${course.title}`);
  }

  console.log("");
  console.log("SKCE course seed completed.");
}

seedCourses()
  .catch((error) => {
    console.error("Course seed failed:", error);
    process.exit(1);
  });