// ============================================================
// API HELPERS
// ============================================================
//
// This file is retained for compatibility with existing code.
// The backend does not use Next.js-specific fetch options or
// frontend mock-data modules.
//
// ============================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

// ============================================================
// TYPES
// ============================================================

export type Course = {
  id?: number | string;
  slug: string;
  title: string;
  description?: string | null;
  mode?: string;
  durationMonths?: number;
  duration?: string | null;
  modules?: number;
  price?: number | null;
  enrolled?: number;
  imageUrl?: string | null;
  language?: string;
  totalVideos?: number;
  hasCertificate?: boolean;
  accentColor?: string;
  aboutLong?: string;
  whatYouWillLearn?: string[];
  requirements?: string[];
  topics?: Array<{
    title: string;
    lessons: string[];
  }>;
  instructor?: {
    name: string;
    title?: string;
    avatarUrl?: string;
    bio?: string;
  };
};

export type Trainer = {
  id: string | number;
  name: string;
  yearsExperience?: number;
  avatarUrl?: string;
  specialty?: string;
};

export type Testimonial = {
  id: string | number;
  studentName: string;
  initials?: string;
  course?: string;
  rating: number;
  quote: string;
};

// ============================================================
// SAFE FETCH
// ============================================================

async function safeFetch<T>(
  path: string,
  fallback: T
): Promise<T> {
  try {
    const res = await fetch(
      `${API_URL}${path}`
    );

    if (!res.ok) {
      throw new Error(
        `Request failed: ${res.status}`
      );
    }

    const json = await res.json();

    return json.data ?? fallback;
  } catch {
    return fallback;
  }
}

// ============================================================
// COURSES
// ============================================================

export const getCourses = () =>
  safeFetch<Course[]>(
    "/courses",
    []
  );

// ============================================================
// TRAINERS
// ============================================================

export async function getTrainers(): Promise<
  Trainer[]
> {
  try {
    const res = await fetch(
      `${API_URL}/trainers`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(
        `Request failed: ${res.status}`
      );
    }

    const json = await res.json();

    return json.data ?? [];
  } catch {
    return [];
  }
}

// ============================================================
// TESTIMONIALS
// ============================================================

export const getTestimonials = () =>
  safeFetch<Testimonial[]>(
    "/testimonials",
    []
  );

// ============================================================
// COURSE BY SLUG
// ============================================================

export async function getCourseBySlug(
  slug: string
): Promise<Course | null> {
  try {
    const res = await fetch(
      `${API_URL}/courses/${slug}`
    );

    if (!res.ok) {
      throw new Error(
        `Request failed: ${res.status}`
      );
    }

    const json = await res.json();

    if (!json.success || !json.data) {
      return null;
    }

    const data = json.data;

    const modeMap: Record<
      string,
      string
    > = {
      ONLINE: "Online",
      OFFLINE: "Offline",
      HYBRID: "Hybrid",
    };

    const backendBaseUrl =
      API_URL.replace(/\/api\/?$/, "");

    const instructor =
      data.instructor
        ? {
            ...data.instructor,
            avatarUrl:
              data.instructor.avatarUrl &&
              data.instructor.avatarUrl.startsWith(
                "/"
              )
                ? `${backendBaseUrl}${data.instructor.avatarUrl}`
                : data.instructor.avatarUrl || "",
          }
        : undefined;

    return {
      ...data,

      mode:
        modeMap[data.mode] ??
        "Online",

      modules:
        typeof data.modules === "number"
          ? data.modules
          : 0,

      enrolled:
        typeof data.enrolled === "number"
          ? data.enrolled
          : 0,

      totalVideos:
        typeof data.totalVideos === "number"
          ? data.totalVideos
          : 0,

      topics:
        Array.isArray(data.topics)
          ? data.topics
          : [],

      instructor,
    };
  } catch {
    return null;
  }
}

// ============================================================
// CONTACT
// ============================================================

export async function submitContactForm(
  payload: {
    name: string;
    email: string;
    phone: string;
    message: string;
  }
) {
  const res = await fetch(
    `${API_URL}/contact`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(
      "Failed to submit form"
    );
  }

  return res.json();
}

// ============================================================
// PACKAGES
// ============================================================

export type CoursePackageCourse = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  mode: string;
};

export type CoursePackage = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  courses: CoursePackageCourse[];
};

type PackagesResponse = {
  success: boolean;
  data: CoursePackage[];
};

type PackageResponse = {
  success: boolean;
  data: CoursePackage;
};

export async function getPackages(): Promise<
  CoursePackage[]
> {
  try {
    const res = await fetch(
      `${API_URL}/packages`
    );

    if (!res.ok) {
      throw new Error(
        `Request failed: ${res.status}`
      );
    }

    const json: PackagesResponse =
      await res.json();

    if (
      !json.success ||
      !Array.isArray(json.data)
    ) {
      throw new Error(
        "Invalid packages response"
      );
    }

    return json.data;
  } catch (error) {
    console.error(
      "Failed to load packages:",
      error
    );

    return [];
  }
}

// ============================================================
// PACKAGE BY SLUG
// ============================================================

export async function getPackageBySlug(
  slug: string
): Promise<CoursePackage | null> {
  try {
    const res = await fetch(
      `${API_URL}/packages/${slug}`
    );

    if (!res.ok) {
      throw new Error(
        `Request failed: ${res.status}`
      );
    }

    const json: PackageResponse =
      await res.json();

    if (
      !json.success ||
      !json.data
    ) {
      return null;
    }

    return json.data;
  } catch (error) {
    console.error(
      "Failed to load package:",
      error
    );

    return null;
  }
}