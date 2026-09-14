import { db } from "../../prisma/db";

const packages = [
  {
    slug: "school-students",
    title: "School Students",
    description:
      "Build strong foundational computer, communication and learning skills.",
    price: 3999,
    courses: [
      "abacus",
      "spoken-english",
      "handwriting",
      "computer-basics",
      "typing-basics",
      "focus-on-education",
    ],
  },

  {
    slug: "college-students",
    title: "College Students",
    description:
      "Develop practical computer, programming and technology skills for academics and career growth.",
    price: 6999,
    courses: [
      "ms-word",
      "ms-excel",
      "ms-powerpoint",
      "windows",
      "html",
      "c-programming",
      "cpp",
      "python",
      "java",
      "data-structures",
      "ai-skills",
      "power-bi",
    ],
  },

  {
    slug: "business-jobseekers",
    title: "Business / Jobseekers",
    description:
      "Career-focused skills for business, employment, freelancing and professional growth.",
    price: 3999,
    courses: [
      "tally",
      "digital-marketing",
      "affiliate-marketing",
      "free-launching-projects",
      "data-entry",
      "interview-preparation",
    ],
  },

  {
    slug: "home-makers",
    title: "Home Makers",
    description:
      "Learn practical digital and computer skills for online work, payments and home businesses.",
    price: 4999,
    courses: [
      "computer-basics",
      "online-work-skills",
      "digital-payments",
      "internet-email",
      "home-business-ideas",
    ],
  },

  {
    slug: "all-in-one",
    title: "All-in-One Package",
    description:
      "Get access to all courses and skills offered by SK Computer Education.",
    price: 14999,
    courses: [
      "abacus",
      "spoken-english",
      "handwriting",
      "computer-basics",
      "typing-basics",
      "focus-on-education",
      "ms-word",
      "ms-excel",
      "ms-powerpoint",
      "windows",
      "html",
      "c-programming",
      "cpp",
      "python",
      "java",
      "data-structures",
      "ai-skills",
      "power-bi",
      "tally",
      "digital-marketing",
      "affiliate-marketing",
      "free-launching-projects",
      "data-entry",
      "interview-preparation",
      "online-work-skills",
      "digital-payments",
      "internet-email",
      "home-business-ideas",
    ],
  },
];

async function seedPackages() {
  console.log("Starting SKCE package seed...");

  for (const packageData of packages) {
    let coursePackage = await db.orm.public.CoursePackage.first({
      slug: packageData.slug,
    });

    if (coursePackage) {
      console.log(`Package already exists: ${packageData.title}`);
    } else {
      coursePackage = await db.orm.public.CoursePackage.create({
        slug: packageData.slug,
        title: packageData.title,
        description: packageData.description,
        price: packageData.price,
        isActive: true,
      });

      console.log(`Created package: ${packageData.title}`);
    }

    for (const courseSlug of packageData.courses) {
      const course = await db.orm.public.Course.first({
        slug: courseSlug,
      });

      if (!course) {
        throw new Error(
          `Course not found for package "${packageData.title}": ${courseSlug}`
        );
      }

      const existingPackageCourse =
        await db.orm.public.PackageCourse.first({
          packageId: coursePackage.id,
          courseId: course.id,
        });

      if (!existingPackageCourse) {
        await db.orm.public.PackageCourse.create({
          packageId: coursePackage.id,
          courseId: course.id,
        });

        console.log(
          `  Linked: ${packageData.title} → ${course.title}`
        );
      }
    }
  }

  console.log("");
  console.log("SKCE package seed completed.");
}

seedPackages()
  .catch((error) => {
    console.error("Package seed failed:", error);
    process.exit(1);
  });