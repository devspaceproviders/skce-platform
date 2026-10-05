"use client";

import { useState, FormEvent, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Course {
  id: string;
  title: string;
  slug: string;
}

export default function BookDemoForm() {
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    courseSlug: "",
    message: "",
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(false);

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Load active courses from the backend.
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCoursesLoading(true);
        setCoursesError(false);

        const response = await fetch(`${API_URL}/contact/courses`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load courses");
        }

        const result = await response.json();

        setCourses(result.data || []);
      } catch (error) {
        console.error("Course loading error:", error);
        setCoursesError(true);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Pre-select the course when arriving from a course card's "Enroll Now" link.
  useEffect(() => {
    const courseFromQuery = searchParams.get("course");

    if (courseFromQuery) {
      setForm((prev) => ({
        ...prev,
        courseSlug: courseFromQuery,
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch(`${API_URL}/contact/demo-booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to submit demo request");
      }

      setStatus("success");

      setForm({
        name: "",
        phone: "",
        email: "",
        courseSlug: "",
        message: "",
      });
    } catch (error) {
      console.error("Demo booking error:", error);
      setStatus("error");
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand to-blue-700 p-8 text-white shadow-lg">
      <h2 className="text-2xl font-extrabold">Book a Free Demo Class</h2>

      <p className="mt-1 text-sm text-blue-100">
        No commitment. Experience our teaching style firsthand.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-blue-100">
              Full Name *
            </label>

            <input
              required
              placeholder="Enter your full name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-blue-200 outline-none focus:border-white/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-blue-100">
              Phone Number *
            </label>

            <input
              required
              type="tel"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-blue-200 outline-none focus:border-white/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-blue-100">
              Email Address
            </label>

            <input
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-blue-200 outline-none focus:border-white/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-blue-100">
              Course of Interest *
            </label>

            <select
              required
              value={form.courseSlug}
              onChange={(e) =>
                setForm({
                  ...form,
                  courseSlug: e.target.value,
                })
              }
              disabled={coursesLoading || coursesError}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-white/50 disabled:cursor-not-allowed disabled:opacity-70 [&>option]:text-slate-900"
            >
              <option value="" disabled className="text-slate-900">
                {coursesLoading
                  ? "Loading courses..."
                  : coursesError
                    ? "Unable to load courses"
                    : "Select a course"}
              </option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.slug}
                  className="text-slate-900"
                >
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-blue-100">
            Additional Message
          </label>

          <textarea
            rows={3}
            placeholder="Any specific queries, preferred batch timings, etc."
            value={form.message}
            onChange={(e) =>
              setForm({
                ...form,
                message: e.target.value,
              })
            }
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-blue-200 outline-none focus:border-white/50"
          />
        </div>

        <button
          type="submit"
          disabled={
            status === "loading" ||
            coursesLoading ||
            coursesError ||
            courses.length === 0
          }
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3.5 text-sm font-bold text-brand transition hover:bg-blue-50 disabled:opacity-70"
        >
          {status === "loading" ? "Booking..." : "Book My Free Demo"}

          {status !== "loading" && <ArrowRight size={16} />}
        </button>

        {status === "success" && (
          <p className="text-center text-sm text-blue-100">
            Thanks! Our team will reach out to confirm your demo slot.
          </p>
        )}

        {status === "error" && (
          <p className="text-center text-sm text-red-200">
            Something went wrong. Please try again.
          </p>
        )}

        <p className="text-center text-xs text-blue-100/80">
          No registration fee. Our team will contact you within 2 hours.
        </p>
      </form>
    </div>
  );
}