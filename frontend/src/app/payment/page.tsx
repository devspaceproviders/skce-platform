"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  Package,
  ShieldCheck,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type RegistrationData = {
  registrationIntentId: number;

  name: string;
  email: string;
  phone: string;
  state: string;
  referralId: string | null;

  packageSlug: string;
  packageTitle: string;
  packageDescription: string | null;

  courseSlug?: string | null;
  courseTitle?: string | null;

  /*
   * This is the package amount loaded
   * from the backend/database.
   */
  amount: number;
};

export default function PaymentPage() {
  const [registration, setRegistration] =
    useState<RegistrationData | null>(null);

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPaymentDetails = async () => {
      try {
        const stored =
          sessionStorage.getItem("skce_registration");

        if (!stored) {
          window.location.href = "/register";
          return;
        }

        const parsed = JSON.parse(stored);

        /*
         * Registration Intent is required because
         * the backend uses it to identify the
         * registration and selected package.
         */
        if (
          !parsed.registrationIntentId ||
          typeof parsed.registrationIntentId !== "number"
        ) {
          sessionStorage.removeItem("skce_registration");
          window.location.href = "/register";
          return;
        }

        if (!parsed.packageSlug) {
          sessionStorage.removeItem("skce_registration");
          window.location.href = "/register";
          return;
        }

        /*
         * IMPORTANT:
         *
         * Do NOT use packageList.ts here.
         *
         * Load the package directly from the backend.
         * This ensures the current database package
         * amount is displayed.
         */
        const packageResponse = await fetch(
          `${API_URL}/packages/${encodeURIComponent(
            parsed.packageSlug
          )}`
        );

        const packageData =
          await packageResponse
            .json()
            .catch(() => null);

        if (
          !packageResponse.ok ||
          !packageData?.success
        ) {
          throw new Error(
            packageData?.message ||
              "Unable to load package details."
          );
        }

        const coursePackage = packageData.data;

        if (!coursePackage) {
          throw new Error(
            "Package details were not returned."
          );
        }

        /*
         * Package must be active.
         */
        if (coursePackage.isActive === false) {
          throw new Error(
            "This package is currently unavailable."
          );
        }

        /*
         * Find selected course from the courses
         * actually included in this package.
         *
         * No course price is used.
         */
        let selectedCourseTitle =
          parsed.courseTitle || null;

        if (
          parsed.courseSlug &&
          Array.isArray(coursePackage.courses)
        ) {
          const selectedCourse =
            coursePackage.courses.find(
              (course: {
                slug: string;
                title: string;
              }) =>
                course.slug === parsed.courseSlug
            );

          if (selectedCourse) {
            selectedCourseTitle =
              selectedCourse.title;
          }
        }

        /*
         * IMPORTANT:
         *
         * Package price comes directly from
         * CoursePackage.price in the database.
         *
         * Do NOT use parsed.amount here.
         *
         * sessionStorage can contain an old amount
         * if the admin changed the package price.
         */
        const packagePrice = Number(
          coursePackage.price
        );

        if (
          !Number.isInteger(packagePrice) ||
          packagePrice < 0
        ) {
          throw new Error(
            "Invalid package amount."
          );
        }

        setRegistration({
          registrationIntentId:
            parsed.registrationIntentId,

          name: parsed.name || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          state: parsed.state || "",

          referralId:
            parsed.referralId || null,

          packageSlug:
            coursePackage.slug,

          packageTitle:
            coursePackage.title,

          packageDescription:
            coursePackage.description || null,

          courseSlug:
            parsed.courseSlug || null,

          courseTitle:
            selectedCourseTitle,

          /*
           * DATABASE PACKAGE PRICE
           */
          amount: packagePrice,
        });

        setLoading(false);
      } catch (err) {
        console.error(
          "Payment details error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load payment details."
        );

        setLoading(false);
      }
    };

    loadPaymentDetails();
  }, []);

  /*
   * ==========================================================
   * DEV PAYMENT
   * ==========================================================
   *
   * This endpoint simulates a successful payment
   * for development/testing.
   *
   * NO REAL MONEY IS INVOLVED.
   *
   * IMPORTANT:
   *
   * We send ONLY registrationIntentId.
   *
   * The backend must determine the authoritative
   * package amount from CoursePackage.price.
   */
  const handlePayment = async () => {
    if (!registration) {
      return;
    }

    setError("");
    setPaymentLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/payments/dev-complete`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            registrationIntentId:
              registration.registrationIntentId,
          }),
        }
      );

      const json =
        await response
          .json()
          .catch(() => null);

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to complete payment."
        );
      }

      /*
       * Backend has now completed:
       *
       * User
       * StudentProfile
       * Student ID
       * Enrollment
       * Payment
       *
       * Only now remove registration data.
       */
      sessionStorage.removeItem(
        "skce_registration"
      );

      /*
       * Save generated Student ID so
       * the success page can display it.
       */
      const studentId =
        json?.data?.student?.studentId;

      if (studentId) {
        sessionStorage.setItem(
          "skce_student_id",
          studentId
        );
      }

      /*
       * Development payment has completed.
       */
      window.location.href =
        "/registration-success";
    } catch (err) {
      console.error(
        "DEV payment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete payment."
      );

      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            size={20}
            className="animate-spin text-orange-500"
          />

          Loading payment details...
        </div>
      </section>
    );
  }

  if (!registration) {
    return null;
  }

  return (
    <section className="min-h-screen bg-slate-50 px-5 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">

        {/* Back */}
        <Link
          href="/register"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft size={16} />
          Back to Registration
        </Link>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}
          <div className="bg-[#173B67] px-6 py-9 text-white sm:px-10">
            <p className="text-sm font-semibold text-orange-400">
              SK Computer Education
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              Complete Your Payment
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Complete the secure payment to
              finish your registration.
            </p>
          </div>

          {/* Content */}
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_320px]">

            {/* LEFT */}
            <div>

              <h2 className="text-xl font-extrabold text-[#102A43]">
                Registration Details
              </h2>

              {/* Student Details */}
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Student Name
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {registration.name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all font-semibold text-slate-800">
                      {registration.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Mobile
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {registration.phone || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      State
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {registration.state || "—"}
                    </p>
                  </div>

                </div>
              </div>

              {/* Registration Reference */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-4">

                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Registration Reference
                  </span>

                  <span className="font-mono text-sm font-bold text-[#173B67]">
                    #{registration.registrationIntentId}
                  </span>

                </div>
              </div>

              {/* Selected Course */}
              {registration.courseTitle && (
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <div className="flex items-start gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#173B67] text-white">
                      <BookOpen size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#173B67]">
                        Selected Course
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-[#102A43]">
                        {registration.courseTitle}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        Included with your selected package.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* Selected Package */}
              <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                    <Package size={19} />
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                      Selected Package
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-[#102A43]">
                      {registration.packageTitle}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {registration.packageDescription ||
                        "Package details will be provided after registration."}
                    </p>

                  </div>

                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-8">

                <h2 className="text-xl font-extrabold text-[#102A43]">
                  Secure Payment
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  This is currently a development
                  payment environment.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-xl border border-slate-200 p-4">
                    <CreditCard
                      size={20}
                      className="text-orange-500"
                    />

                    <p className="mt-3 text-sm font-bold text-slate-800">
                      Cards
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Razorpay later
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <span className="flex h-5 w-8 items-center justify-center rounded border border-slate-300 text-[9px] font-bold text-slate-500">
                      UPI
                    </span>

                    <p className="mt-3 text-sm font-bold text-slate-800">
                      UPI
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Razorpay later
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <CheckCircle2
                      size={20}
                      className="text-green-500"
                    />

                    <p className="mt-3 text-sm font-bold text-slate-800">
                      DEV Mode
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      No real payment
                    </p>
                  </div>

                </div>
              </div>

            </div>

            {/* RIGHT - ORDER SUMMARY */}
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  <Package
                    size={19}
                    className="text-orange-500"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Order Summary
                  </p>

                  <h3 className="mt-1 text-base font-bold text-[#173B67]">
                    {registration.packageTitle}
                  </h3>
                </div>

              </div>

              <div className="my-6 border-t border-slate-200 pt-5">

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Package Price
                  </span>

                  <span className="font-semibold text-slate-800">
                    ₹
                    {registration.amount.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between">

                  <span className="text-base font-bold text-[#102A43]">
                    Total
                  </span>

                  <span className="text-2xl font-extrabold text-orange-500">
                    ₹
                    {registration.amount.toLocaleString(
                      "en-IN"
                    )}
                  </span>

                </div>

              </div>

              {/* DEV Notice */}
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

                <p className="text-xs font-bold text-[#173B67]">
                  DEVELOPMENT MODE
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  No real money will be charged.
                  This button simulates a successful
                  payment.
                </p>

              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                  {error}
                </div>
              )}

              {/* Pay Button */}
              <button
                type="button"
                onClick={handlePayment}
                disabled={paymentLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {paymentLoading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Processing...
                  </>
                ) : (
                  <>
                    Complete Payment ₹
                    {registration.amount.toLocaleString(
                      "en-IN"
                    )}
                  </>
                )}
              </button>

              {/* Security */}
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <LockKeyhole
                    size={14}
                    className="text-[#173B67]"
                  />

                  Secure registration
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck
                    size={14}
                    className="text-[#173B67]"
                  />

                  Backend verification
                </div>

              </div>

            </aside>

          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Development payment environment.
          Razorpay will be connected before
          production payments are enabled.
        </p>

      </div>
    </section>
  );
}