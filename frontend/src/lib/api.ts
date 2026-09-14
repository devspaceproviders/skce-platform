import { Course, Trainer, Testimonial } from "@/types";
import { MOCK_COURSES, MOCK_TRAINERS, MOCK_TESTIMONIALS } from "./mockData";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const json = await res.json();
    return json.data ?? fallback;
  } catch {
    // Backend not reachable yet during local frontend-only development.
    return fallback;
  } 
}

export const getCourses = () => safeFetch<Course[]>("/courses", MOCK_COURSES);
export const getTrainers = () => safeFetch<Trainer[]>("/trainers", MOCK_TRAINERS);
export const getTestimonials = () =>
  safeFetch<Testimonial[]>("/testimonials", MOCK_TESTIMONIALS);

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const fallback = MOCK_COURSES.find((c) => c.slug === slug) ?? null;
  return safeFetch<Course | null>(`/courses/${slug}`, fallback);
}

export async function submitContactForm(payload: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  const res = await fetch(`${API_URL}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to submit form");
  return res.json();
}
