"use client";

import { useState, FormEvent, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Course {
  id: string;
  title: string;
  slug: string;
}

const FIELD_CLASS =
  "w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder-blue-200/80 outline-none transition duration-200 hover:border-white/40 focus:border-orange-400 focus:bg-white/15 focus:ring-4 focus:ring-orange-400/20";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-blue-100";

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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#173B67] to-[#1459B8] p-6 text-white shadow-xl shadow-blue-900/20 sm:p-8">
      {/* Soft brand glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="relative">
        <h2 className="text-2xl font-bold tracking-tight">
          Book a Free Demo Class
        </h2>

        <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-orange-500" />
          <span className="h-1 w-3 rounded-full bg-white/60" />
        </div>

        <p className="mt-3 text-sm text-blue-100">
          No commitment. Experience our teaching style firsthand.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="demo-name" className={LABEL_CLASS}>
                Full Name *
              </label>

              <input
                id="demo-name"
                required
                autoComplete="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className={`${FIELD_CLASS} h-11`}
              />
            </div>

            <div>
              <label htmlFor="demo-phone" className={LABEL_CLASS}>
                Phone Number *
              </label>

              <input
                id="demo-phone"
                required
                type="tel"
                autoComplete="tel"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                className={`${FIELD_CLASS} h-11`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="demo-email" className={LABEL_CLASS}>
                Email Address
              </label>

              <input
                id="demo-email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className={`${FIELD_CLASS} h-11`}
              />
            </div>

            <div>
              <label htmlFor="demo-course" className={LABEL_CLASS}>
                Course of Interest *
              </label>

              <div className="relative">
                <select
                  id="demo-course"
                  required
                  value={form.courseSlug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      courseSlug: e.target.value,
                    })
                  }
                  disabled={coursesLoading || coursesError}
                  className={`${FIELD_CLASS} h-11 appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-70 [&>option]:text-slate-900`}
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

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="demo-message" className={LABEL_CLASS}>
              Additional Message
            </label>

            <textarea
              id="demo-message"
              rows={3}
              placeholder="Any specific queries, preferred batch timings, etc."
              value={form.message}
              onChange={(e) =>
                setForm({
                  ...form,
                  message: e.target.value,
                })
              }
              className={`${FIELD_CLASS} resize-none py-3`}
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
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-lg shadow-orange-900/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#173B67] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {status === "loading" ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Booking...
              </>
            ) : (
              <>
                Book My Free Demo
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </>
            )}
          </button>

          {status === "success" && (
            <div
              role="status"
              className="sk-form-msg flex items-start gap-2.5 rounded-xl border border-emerald-300/30 bg-emerald-400/15 p-3.5 text-sm text-emerald-50"
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              Thanks! Our team will reach out to confirm your demo slot.
            </div>
          )}

          {status === "error" && (
            <div
              role="alert"
              className="sk-form-msg flex items-start gap-2.5 rounded-xl border border-red-300/30 bg-red-500/20 p-3.5 text-sm text-red-50"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              Something went wrong. Please try again.
            </div>
          )}

          <p className="text-center text-xs text-blue-100/80">
            No registration fee. Our team will contact you within 2 hours.
          </p>
        </form>
      </div>

      <style jsx global>{`
        @keyframes skFormMsg {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sk-form-msg {
          animation: skFormMsg 0.25s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .sk-form-msg {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
