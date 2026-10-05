export type CourseMode = "Online" | "Offline" | "Hybrid";

export interface Instructor {
  name: string;
  title: string; // e.g. "Speaker", "Lead Trainer"
  avatarUrl: string;
  bio: string;
}

export interface CourseTopic {
  title: string;
  lessons: string[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  mode: CourseMode;
  description: string;

  durationMonths: number;
  modules: number;

  enrolled: number;

  accentColor: string;

  bannerImageUrl?: string;
  videoThumbnailUrl?: string;
  videoUrl?: string;
  imageUrl?: string | null;

  language?: string;
  totalVideos?: number;
  hasCertificate?: boolean;

  aboutLong?: string;
  whatYouWillLearn?: string[];
  requirements?: string[];

  topics?: CourseTopic[];

  instructor?: Instructor;
}

export interface Trainer {
  id: string;
  name: string;
  yearsExperience: number;
  avatarUrl: string;
  specialty?: string;
}

export interface Testimonial {
  id: string;
  studentName: string;
  initials: string;
  course: string;
  rating: number;
  quote: string;
}
