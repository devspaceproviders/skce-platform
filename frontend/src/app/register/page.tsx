"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  ChevronDown,
  BookOpen,
  Package,
} from "lucide-react";
import { COURSE_OPTIONS } from "@/lib/courseList";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

type PackageOption = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  isActive: boolean;
  courses?: Array<{
    id?: number;
    slug?: string;
    title?: string;
  }>;
};

type PackagesResponse = {
  success: boolean;
  message: string;
  data: PackageOption[];
};

type RegistrationIntentResponse = {
  success: boolean;
  message: string;
  data?: {
    registrationIntentId: number;
    package: {
      id: number;
      slug: string;
      title: string;
      price: number;
    };
    course: {
      id: number;
      slug: string;
      title: string;
    } | null;
    status: string;
  };
};

export default function RegisterPage() {
  const searchParams = useSearchParams();

  const urlPackageSlug =
    searchParams.get("package") || "";

  const urlCourseSlug =
    searchParams.get("course") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    state: "",
    referralId: "",
    packageSlug: "",
  });

  const [packages, setPackages] =
    useState<PackageOption[]>([]);

  const [selectedCourse, setSelectedCourse] =
    useState("");

  const [packagesLoading, setPackagesLoading] =
    useState(true);

  const [packagesError, setPackagesError] =
    useState("");

  const [agreed, setAgreed] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  /*
   * ============================================================
   * LOAD PACKAGES
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadPackages() {
      try {
        setPackagesLoading(true);
        setPackagesError("");

        const response = await fetch(
          `${API_URL}/packages`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load packages: ${response.status}`
          );
        }

        const json: PackagesResponse =
          await response.json();

        if (
          !json.success ||
          !Array.isArray(json.data)
        ) {
          throw new Error(
            "Invalid package response"
          );
        }

        if (cancelled) {
          return;
        }

        const activePackages =
          json.data.filter(
            (pkg) => pkg.isActive
          );

        setPackages(activePackages);

        /*
         * Select package from URL.
         *
         * Example:
         * /register?package=all-in-one
         */

        if (urlPackageSlug) {
          const matchingPackage =
            activePackages.find(
              (pkg) =>
                pkg.slug === urlPackageSlug
            );

          if (matchingPackage) {
            setForm((current) => ({
              ...current,
              packageSlug:
                matchingPackage.slug,
            }));
          } else {
            setForm((current) => ({
              ...current,
              packageSlug: "",
            }));
          }
        } else {
          setForm((current) => ({
            ...current,
            packageSlug: "",
          }));
        }

        /*
         * Individual course registration.
         */

        if (
          urlCourseSlug &&
          COURSE_OPTIONS.some(
            (course) =>
              course.slug === urlCourseSlug
          )
        ) {
          setSelectedCourse(urlCourseSlug);
        } else {
          setSelectedCourse("");
        }
      } catch (err) {
        console.error(
          "Package loading error:",
          err
        );

        if (!cancelled) {
          setPackagesError(
            "Unable to load learning packages. Please refresh the page and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setPackagesLoading(false);
        }
      }
    }

    loadPackages();

    return () => {
      cancelled = true;
    };
  }, [urlPackageSlug, urlCourseSlug]);

  /*
   * ============================================================
   * SELECTED PACKAGE
   * ============================================================
   */

  const selectedPackage =
    packages.find(
      (pkg) =>
        pkg.slug === form.packageSlug
    );

  /*
   * ============================================================
   * SELECTED COURSE
   * ============================================================
   */

  const selectedCourseData =
    COURSE_OPTIONS.find(
      (course) =>
        course.slug === selectedCourse
    );

  /*
   * ============================================================
   * FORM UPDATE
   * ============================================================
   */

  const updateForm = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   *
   * Registration flow:
   *
   * Register form
   *      ↓
   * POST /api/payments/registration-intent
   *      ↓
   * RegistrationIntent created
   *      ↓
   * registrationIntentId returned
   *      ↓
   * Store payment reference in sessionStorage
   *      ↓
   * Payment page
   *
   * IMPORTANT:
   *
   * No User or StudentProfile is created here.
   *
   * User + StudentProfile + Student ID + Enrollment
   * are created only after successful payment verification.
   *
   * ============================================================
   */

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    /*
     * ----------------------------------------------------------
     * Validate package
     * ----------------------------------------------------------
     */

    if (!selectedPackage) {
      setError(
        "Please select a package."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * Validate name
     * ----------------------------------------------------------
     */

    if (form.name.trim().length < 2) {
      setError(
        "Please enter your name."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * Validate email
     * ----------------------------------------------------------
     */

    if (!form.email.trim()) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (
      !form.email.includes("@")
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * Validate mobile
     * ----------------------------------------------------------
     */

    if (
      form.phone.replace(/\D/g, "")
        .length < 10
    ) {
      setError(
        "Please enter a valid mobile number."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * Validate password
     * ----------------------------------------------------------
     */

    if (form.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * Validate state
     * ----------------------------------------------------------
     */

    if (!form.state) {
      setError(
        "Please select your state."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * Validate agreement
     * ----------------------------------------------------------
     */

    if (!agreed) {
      setError(
        "Please agree to the User Agreement and Privacy Policy."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      /*
       * --------------------------------------------------------
       * 1. Create Registration Intent
       * --------------------------------------------------------
       */

      const response = await fetch(
        `${API_URL}/payments/registration-intent`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name:
              form.name.trim(),

            email:
              form.email.trim(),

            phone:
              form.phone.trim(),

            password:
              form.password,

            state:
              form.state,

            referralId:
              form.referralId.trim() ||
              undefined,

            packageSlug:
              selectedPackage.slug,

            courseSlug:
              selectedCourse ||
              undefined,
          }),
        }
      );

      const json: RegistrationIntentResponse =
        await response.json();

      /*
       * --------------------------------------------------------
       * 2. Handle backend response
       * --------------------------------------------------------
       */

      if (
        !response.ok ||
        !json.success ||
        !json.data
      ) {
        throw new Error(
          json.message ||
            "Unable to create registration"
        );
      }

      /*
       * --------------------------------------------------------
       * 3. Store registration reference
       * --------------------------------------------------------
       *
       * IMPORTANT:
       *
       * We intentionally DO NOT store the password.
       *
       * The backend has already securely hashed it inside
       * RegistrationIntent.
       *
       * The payment page only needs the registration intent
       * and display information.
       * --------------------------------------------------------
       */

      sessionStorage.setItem(
        "skce_registration",
        JSON.stringify({
          registrationIntentId:
            json.data.registrationIntentId,

          name:
            form.name.trim(),

          email:
            form.email.trim(),

          phone:
            form.phone.trim(),

          state:
            form.state,

          referralId:
            form.referralId.trim() || null,

          packageSlug:
            json.data.package.slug,

          packageTitle:
            json.data.package.title,

          amount:
            json.data.package.price,

          courseSlug:
            json.data.course?.slug ||
            null,

          courseTitle:
            json.data.course?.title ||
            null,
        })
      );

      /*
       * --------------------------------------------------------
       * 4. Go to payment page
       * --------------------------------------------------------
       */

      window.location.href =
        "/payment";
    } catch (err) {
      console.error(
        "Registration intent creation error:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Unable to continue";

      setError(message);
      setLoading(false);
    }
  };

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <section className="min-h-screen bg-slate-50 px-5 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">

        {/* Registration Card */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}

          <div className="border-b border-slate-100 px-6 py-8 text-center sm:px-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
              <BookOpen
                size={24}
                className="text-orange-500"
              />
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#173B67]">
              Registration
            </h1>

            <p className="mt-3 text-base text-slate-600">
              Create your SKCE account and continue to payment.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-orange-500 transition hover:text-orange-600 hover:underline"
              >
                Login
              </Link>
            </p>
          </div>

          {/* Form */}

          <form
            onSubmit={handleSubmit}
            className="px-6 py-8 sm:px-10 sm:py-10"
          >

            {/* Selected Course */}

            {selectedCourseData && (
              <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#173B67] text-white">
                    <BookOpen size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#173B67]">
                      Selected Course
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-[#102A43]">
                      {
                        selectedCourseData.title
                      }
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      You started registration from this course.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* Package Loading Error */}

            {packagesError && (
              <div className="mb-8 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {packagesError}
              </div>
            )}

            {/* Form Fields */}

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">

              {/* Choose Package */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  Choose Package
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <div className="relative">

                  <select
                    required
                    value={
                      form.packageSlug
                    }
                    disabled={
                      packagesLoading
                    }
                    onChange={(e) =>
                      updateForm(
                        "packageSlug",
                        e.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">
                      {packagesLoading
                        ? "Loading Packages..."
                        : "Select Package"}
                    </option>

                    {packages.map(
                      (pkg) => (
                        <option
                          key={
                            pkg.slug
                          }
                          value={
                            pkg.slug
                          }
                        >
                          {pkg.title} — ₹
                          {pkg.price.toLocaleString(
                            "en-IN"
                          )}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={19}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>
              </div>

              {/* Referral ID */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  Referral ID
                </label>

                <input
                  type="text"
                  placeholder="Enter referral ID"
                  value={
                    form.referralId
                  }
                  onChange={(e) =>
                    updateForm(
                      "referralId",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Name */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  Your Name
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  required
                  type="text"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) =>
                    updateForm(
                      "name",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* State */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  State
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <div className="relative">

                  <select
                    required
                    value={
                      form.state
                    }
                    onChange={(e) =>
                      updateForm(
                        "state",
                        e.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">
                      Select State
                    </option>

                    {STATES.map(
                      (state) => (
                        <option
                          key={state}
                          value={state}
                        >
                          {state}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={19}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>
              </div>

              {/* Mobile */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  Mobile
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  required
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={form.phone}
                  onChange={(e) =>
                    updateForm(
                      "phone",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Email */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  Email ID
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  required
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) =>
                    updateForm(
                      "email",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Password */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  Password
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <div className="relative">

                  <input
                    required
                    minLength={8}
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create a password"
                    value={
                      form.password
                    }
                    onChange={(e) =>
                      updateForm(
                        "password",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) =>
                          !value
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-orange-500"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Password must contain at least 8
                  characters.
                </p>
              </div>
            </div>

            {/* Selected Package Summary */}

            {selectedPackage && (
              <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-start gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                      <Package size={19} />
                    </div>

                    <div>

                      <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                        Selected Package
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-[#102A43]">
                        {
                          selectedPackage.title
                        }
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {
                          selectedPackage
                            .courses
                            ?.length ?? 0
                        }{" "}
                        learning areas
                      </p>

                    </div>
                  </div>

                  <div className="text-left sm:text-right">

                    <p className="text-xs font-medium text-slate-500">
                      Package Price
                    </p>

                    <p className="text-2xl font-extrabold text-orange-600">
                      ₹
                      {selectedPackage.price.toLocaleString(
                        "en-IN"
                      )}
                    </p>

                  </div>

                </div>
              </div>
            )}

            {/* Terms */}

            <div className="mt-8">

              <label className="flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) =>
                    setAgreed(
                      e.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />

                <span className="text-sm leading-relaxed text-slate-600">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-orange-500 hover:underline"
                  >
                    User Agreement
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-orange-500 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>

              </label>

            </div>

            {/* Error */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Continue to Payment */}

            <div className="mt-8 flex justify-center">

              <button
                type="submit"
                disabled={
                  loading ||
                  packagesLoading
                }
                className="min-w-[240px] rounded-xl bg-orange-500 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading
                  ? "Creating Registration..."
                  : "Continue to Payment"}
              </button>

            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Your registration details will be securely processed before payment.
            </p>

          </form>
        </div>
      </div>
    </section>
  );
}