import { Course, Trainer, Testimonial } from "@/types";
import {
  MOCK_COURSES,
  MOCK_TRAINERS,
  MOCK_TESTIMONIALS,
} from "./mockData";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const BACKEND_BASE_URL = API_URL.replace(/\/api\/?$/, "");

function resolveMediaUrl(
  url?: string | null
): string | null {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${BACKEND_BASE_URL}${url}`;
  }

  return url;
}

async function safeFetch<T>(
  path: string,
  fallback: T
): Promise<T> {
  try {
    const res = await fetch(
      `${API_URL}${path}`,
      {
        next: {
          revalidate: 60,
        },
      }
    );

    if (!res.ok) {
      throw new Error(
        `Request failed: ${res.status}`
      );
    }

    const json = await res.json();

    return json.data ?? fallback;
  } catch {
    // Backend not reachable yet during local
    // frontend-only development.
    return fallback;
  }
}

export async function getCourses(): Promise<Course[]> {
  const courses = await safeFetch<Course[]>(
    "/courses",
    MOCK_COURSES
  );

  return courses.map((course) => ({
    ...course,
    imageUrl: resolveMediaUrl(course.imageUrl),
  }));
}

/*
 * ============================================================
 * TRAINERS
 * ============================================================
 *
 * Trainers must always use the latest backend data because
 * profile photos can be changed by trainers/admins.
 *
 * cache: "no-store" prevents Next.js from serving an
 * older trainer response.
 * ============================================================
 */

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

    return json.data ?? MOCK_TRAINERS;
  } catch {
    return MOCK_TRAINERS;
  }
}

/*
 * ============================================================
 * TESTIMONIALS
 * ============================================================
 *
 * Testimonials come from Student Feedback moderation.
 * Once an Admin approves new feedback, the homepage must
 * always fetch the latest approved records.
 *
 * cache: "no-store" prevents Next.js from showing an older
 * testimonial response.
 * ============================================================
 */

export async function getTestimonials(): Promise<
  Testimonial[]
> {
  try {
    const res = await fetch(
      `${API_URL}/testimonials`,
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

    return json.data ?? MOCK_TESTIMONIALS;
  } catch {
    return MOCK_TESTIMONIALS;
  }
}

export async function getCourseBySlug(
  slug: string
): Promise<Course | null> {
  const fallback =
    MOCK_COURSES.find(
      (c) => c.slug === slug
    ) ?? null;

  try {
    const res = await fetch(
      `${API_URL}/courses/${slug}`,
      {
        next: {
          revalidate: 60,
        },
      }
    );

    if (!res.ok) {
      throw new Error(
        `Request failed: ${res.status}`
      );
    }

    const json = await res.json();

    if (!json.success || !json.data) {
      return fallback;
    }

    const data = json.data;

    const modeMap: Record<
      string,
      Course["mode"]
    > = {
      ONLINE: "Online",
      OFFLINE: "Offline",
      HYBRID: "Hybrid",
    };

    const instructor =
      data.instructor
        ? {
            ...data.instructor,
            avatarUrl:
              data.instructor.avatarUrl &&
              data.instructor.avatarUrl.startsWith(
                "/"
              )
                ? `${BACKEND_BASE_URL}${data.instructor.avatarUrl}`
                : data.instructor.avatarUrl || "",
          }
        : undefined;

    return {
      ...data,

      imageUrl: resolveMediaUrl(data.imageUrl),

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
    return fallback;
  }
}

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
      `${API_URL}/packages`,
      {
        next: {
          revalidate: 60,
        },
      }
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

    return json.data.map((pkg) => ({
      ...pkg,
      imageUrl: resolveMediaUrl(pkg.imageUrl),
    }));
  } catch (error) {
    console.error(
      "Failed to load packages:",
      error
    );

    return [];
  }
}

export async function getPackageBySlug(
  slug: string
): Promise<CoursePackage | null> {
  try {
    const res = await fetch(
      `${API_URL}/packages/${slug}`,
      {
        next: {
          revalidate: 60,
        },
      }
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

    return {
      ...json.data,
      imageUrl: resolveMediaUrl(
        json.data.imageUrl
      ),
    };
  } catch (error) {
    console.error(
      "Failed to load package:",
      error
    );

    return null;
  }
}