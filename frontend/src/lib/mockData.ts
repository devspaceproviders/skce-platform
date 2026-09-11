import { Course, Trainer, Testimonial } from "@/types";

export const MOCK_COURSES: Course[] = [
  {
    id: "full-stack",
    slug: "full-stack-web-development",
    title: "Full Stack Web Development",
    mode: "Hybrid",
    description:
      "Master React, Node.js, PostgreSQL, and cloud deployment. Build production-ready applications from day one.",
    durationMonths: 6,
    modules: 24,
    enrolled: 145,
    price: 45000,
    accentColor: "border-t-blue-500",
    language: "English",
    totalVideos: 48,
    hasCertificate: true,
    bannerImageUrl: "/courses/full-stack-banner.svg",
    videoThumbnailUrl: "/courses/full-stack-banner.svg",
    aboutLong:
      "Learn how to design, build, and deploy full stack web applications from scratch. This course takes you from HTML/CSS fundamentals through React, Node.js/Express APIs, PostgreSQL, and cloud deployment — with real projects at every stage.",
    whatYouWillLearn: [
      "Building responsive UIs with React & Tailwind CSS",
      "REST API design with Node.js & Express",
      "Relational database modeling with PostgreSQL",
      "Authentication with JWT and OAuth",
      "Deploying apps to the cloud with Docker",
    ],
    requirements: [
      "Basic computer and internet skills",
      "No prior programming experience needed",
    ],
    topics: [
      {
        title: "Module 1: Frontend Foundations",
        lessons: ["HTML, CSS & responsive design", "JavaScript ES6+", "Intro to React"],
      },
      {
        title: "Module 2: Backend & APIs",
        lessons: ["Node.js & Express basics", "REST API design", "Authentication with JWT"],
      },
      {
        title: "Module 3: Database & Deployment",
        lessons: ["PostgreSQL & Prisma ORM", "Docker basics", "Deploying to AWS"],
      },
    ],
    instructor: {
      name: "Rajesh Kumar",
      title: "Lead Trainer",
      avatarUrl: "/trainers/rajesh.jpg.svg",
      bio: "I'm Rajesh, a full stack engineer with 8+ years building production systems. I'm passionate about teaching practical, job-ready skills through hands-on projects.",
    },
  },
  {
    id: "python-data-science",
    slug: "python-data-science",
    title: "Python & Data Science",
    mode: "Online",
    description:
      "Python programming, data analysis with pandas, machine learning with scikit-learn, and data visualization.",
    durationMonths: 4,
    modules: 18,
    enrolled: 98,
    price: 35000,
    accentColor: "border-t-emerald-500",
    language: "English",
    totalVideos: 32,
    hasCertificate: true,
    aboutLong:
      "Go from Python basics to building real machine learning models. Covers data analysis with pandas, visualization, and scikit-learn — with a portfolio-ready capstone project.",
    whatYouWillLearn: [
      "Python programming fundamentals",
      "Data analysis with pandas & NumPy",
      "Data visualization with Matplotlib",
      "Machine learning with scikit-learn",
    ],
    requirements: ["Basic computer and internet skills", "No prior programming experience needed"],
    topics: [
      { title: "Module 1: Python Basics", lessons: ["Syntax & data types", "Control flow", "Functions"] },
      { title: "Module 2: Data Analysis", lessons: ["Pandas & NumPy", "Data cleaning", "Visualization"] },
    ],
    instructor: {
      name: "Priya Sharma",
      title: "Lead Trainer",
      avatarUrl: "/trainers/priya.jpg.svg",
      bio: "I'm Priya, a data scientist with 6+ years of industry experience. I love breaking down complex ML concepts into practical, applicable skills.",
    },
  },
  {
    id: "java-spring-boot",
    slug: "java-spring-boot",
    title: "Java & Spring Boot",
    mode: "Offline",
    description:
      "Core Java, OOPs, Spring Boot, REST APIs, Hibernate, and enterprise application development.",
    durationMonths: 3,
    modules: 16,
    enrolled: 72,
    price: 25000,
    accentColor: "border-t-orange-500",
    language: "English",
    totalVideos: 28,
    hasCertificate: true,
  },
  {
    id: "sap-training",
    slug: "sap-training",
    title: "SAP Training",
    mode: "Offline",
    description:
      "SAP FICO, MM, and SD modules with hands-on system access and real-world business scenarios.",
    durationMonths: 4,
    modules: 20,
    enrolled: 54,
    price: 40000,
    accentColor: "border-t-purple-500",
    language: "English",
    totalVideos: 30,
    hasCertificate: true,
  },
  {
    id: "digital-marketing",
    slug: "digital-marketing",
    title: "Digital Marketing",
    mode: "Hybrid",
    description:
      "SEO, SEM, social media marketing, Google Ads, content strategy, and analytics dashboards.",
    durationMonths: 3,
    modules: 14,
    enrolled: 88,
    price: 22000,
    accentColor: "border-t-pink-500",
    language: "English",
    totalVideos: 26,
    hasCertificate: true,
  },
  {
    id: "adca",
    slug: "adca-advanced-diploma",
    title: "ADCA — Advanced Diploma",
    mode: "Offline",
    description:
      "Complete computer applications: MS Office, accounting software, programming basics, and web design.",
    durationMonths: 6,
    modules: 22,
    enrolled: 63,
    price: 18000,
    accentColor: "border-t-cyan-500",
    language: "English",
    totalVideos: 40,
    hasCertificate: true,
  },
];

export const MOCK_TRAINERS: Trainer[] = [
  { id: "t1", name: "Rajesh Kumar", yearsExperience: 8, avatarUrl: "/trainers/rajesh.jpg.svg", specialty: "Full Stack Development" },
  { id: "t2", name: "Priya Sharma", yearsExperience: 6, avatarUrl: "/trainers/priya.jpg.svg", specialty: "Python & Data Science" },
  { id: "t3", name: "Anand Verma", yearsExperience: 10, avatarUrl: "/trainers/anand.jpg.svg", specialty: "SAP Training" },
  { id: "t4", name: "Meera Patel", yearsExperience: 5, avatarUrl: "/trainers/meera.jpg.svg", specialty: "Digital Marketing" },
];
// NOTE: swap these placeholder avatars for real photos (S3 URLs or files in /public/trainers) when ready.

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: "r1",
    studentName: "Ravi Teja",
    initials: "RT",
    course: "Full Stack Development",
    rating: 5,
    quote:
      "SKCE transformed my career completely. The hands-on projects and real-world curriculum helped me land a job at a startup within 2 months of completing the course.",
  },
  {
    id: "r2",
    studentName: "Anjali Sharma",
    initials: "AS",
    course: "Python & Data Science",
    rating: 5,
    quote:
      "The quality of instruction here is exceptional. Priya ma'am explained complex concepts so clearly. I am now working as a Junior Data Analyst at a fintech company.",
  },
  {
    id: "r3",
    studentName: "Mohammed Farhan",
    initials: "MF",
    course: "SAP Training",
    rating: 5,
    quote:
      "Best SAP training center in the city. Anand sir has immense practical experience and his real-world examples made the modules easy to understand and apply.",
  },
];
