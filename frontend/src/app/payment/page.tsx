"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useRazorpay,
  RazorpayOrderOptions,
} from "react-razorpay";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  Package,
  ShieldCheck,
} from "lucide-react";

import Reveal from "@/components/Reveal";
import { ALERT_ERROR, BACK_LINK } from "@/components/formStyles";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const RAZORPAY_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

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

type RazorpayPaymentResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

function DetailTile({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 font-semibold text-slate-800 ${
          breakAll ? "break-all" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

export default function PaymentPage() {
  const { Razorpay, isLoading: razorpayLoading, error: razorpayError } =
    useRazorpay();

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
   * RAZORPAY TEST PAYMENT
   * ==========================================================
   *
   * 1. Ask backend to create a Razorpay order.
   * 2. Open Razorpay Checkout.
   * 3. Receive Razorpay payment response.
   * 4. Send the response to backend verification.
   *
   * The backend remains authoritative for:
   * - package price
   * - payment verification
   * - student creation
   * - enrollment
   * - registration completion
   */
  const handlePayment = async () => {
    if (!registration) {
      return;
    }

    if (!RAZORPAY_KEY_ID) {
      setError(
        "Razorpay Key ID is not configured in the frontend."
      );
      return;
    }

    if (razorpayLoading) {
      setError(
        "Razorpay Checkout is still loading. Please try again."
      );
      return;
    }

    if (!Razorpay) {
      setError(
        razorpayError ||
          "Razorpay Checkout could not be loaded."
      );
      return;
    }

    setError("");
    setPaymentLoading(true);

    try {
      /*
       * ------------------------------------------------------
       * 1. CREATE RAZORPAY ORDER
       * ------------------------------------------------------
       *
       * We send only the registration intent ID.
       *
       * The backend determines the authoritative package
       * and amount from the database.
       */
      const orderResponse = await fetch(
        `${API_URL}/payments/create-order`,
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

      const orderJson =
        await orderResponse
          .json()
          .catch(() => null);

      if (
        !orderResponse.ok ||
        !orderJson?.success ||
        !orderJson?.data?.order?.id
      ) {
        throw new Error(
          orderJson?.message ||
            "Unable to create Razorpay order."
        );
      }

      const razorpayOrder =
        orderJson.data.order;

      /*
       * ------------------------------------------------------
       * 2. OPEN RAZORPAY CHECKOUT
       * ------------------------------------------------------
       *
       * Amount and order ID come from the backend-created
       * Razorpay order.
       */
      const options: RazorpayOrderOptions = {
        key: RAZORPAY_KEY_ID,

        amount: razorpayOrder.amount,

        currency:
          razorpayOrder.currency || "INR",

        name: "SK Computer Education",

        description:
          registration.packageTitle,

        order_id:
          razorpayOrder.id,

        prefill: {
          name: registration.name,
          email: registration.email,
          contact: registration.phone,
        },

        notes: `registration_intent_id=${registration.registrationIntentId}, package=${registration.packageSlug}`,

        theme: {
          color: "#F97316",
        },

        handler: async (
          response: RazorpayPaymentResponse
        ) => {
          /*
           * Razorpay has returned the payment response.
           *
           * IMPORTANT:
           * We do NOT mark the payment successful here.
           *
           * The backend must verify the Razorpay signature.
           */

          try {
            setError("");
            setPaymentLoading(true);

            const verifyResponse =
              await fetch(
                `${API_URL}/payments/verify`,
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    razorpayOrderId:
                      response.razorpay_order_id,

                    razorpayPaymentId:
                      response.razorpay_payment_id,

                    razorpaySignature:
                      response.razorpay_signature,
                  }),
                }
              );

            const verifyJson =
              await verifyResponse
                .json()
                .catch(() => null);

            if (
              !verifyResponse.ok ||
              !verifyJson?.success
            ) {
              throw new Error(
                verifyJson?.message ||
                  "Payment verification failed."
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
             * RegistrationIntent
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
              verifyJson?.data?.student?.studentId;

            if (studentId) {
              sessionStorage.setItem(
                "skce_student_id",
                studentId
              );
            }

            /*
             * Razorpay payment has been verified
             * and registration has completed.
             */
            window.location.href =
              "/registration-success";
          } catch (err) {
            console.error(
              "Razorpay payment verification error:",
              err
            );

            setError(
              err instanceof Error
                ? err.message
                : "Unable to verify payment."
            );

            setPaymentLoading(false);
          }
        },
      };

      /*
       * Create the Razorpay Checkout instance
       * and open the payment window.
       */
      const razorpayInstance =
        new Razorpay(options);

      /*
       * If the customer closes Checkout without
       * completing payment, the registration remains
       * intact and can be attempted again.
       */
      razorpayInstance.on(
        "payment.failed",
        (response) => {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setError(
            response?.error?.description ||
              "Payment failed. Please try again."
          );

          setPaymentLoading(false);
        }
      );

      razorpayInstance.open();

      /*
       * Checkout is now open.
       *
       * Razorpay will call the handler above after
       * successful payment.
       */
      setPaymentLoading(false);
    } catch (err) {
      console.error(
        "Razorpay payment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start payment."
      );

      setPaymentLoading(false);
    }
  };

  /* =====================================================================
     RENDER
     ===================================================================== */

  if (loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center bg-[#F7F9FC] px-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-slate-600 shadow-sm">
          <Loader2 size={20} className="animate-spin text-orange-500" />

          Loading payment details...
        </div>
      </section>
    );
  }

  if (!registration) {
    // Loading finished but details could not be loaded (see `error`).
    if (error) {
      return (
        <section className="flex min-h-[60vh] items-center justify-center bg-[#F7F9FC] px-5">
          <div
            role="alert"
            className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
          >
            <AlertCircle size={28} className="mx-auto text-red-500" />

            <p className="mt-3 text-sm font-medium text-red-700">
              {error}
            </p>

            <Link
              href="/register"
              className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#173B67] px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
            >
              Back to Registration
            </Link>
          </div>
        </section>
      );
    }

    return null;
  }

  const formattedAmount = registration.amount.toLocaleString("en-IN");

  return (
    <section className="bg-[#F7F9FC] px-5 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Back */}
        <Link href="/register" className={`${BACK_LINK} mb-5`}>
          <ArrowLeft
            size={16}
            className="transition-transform duration-200 group-hover:-translate-x-1"
          />
          Back to Registration
        </Link>

        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
            {/* Header */}
            <div className="relative overflow-hidden bg-[#173B67] px-6 py-8 text-white sm:px-10">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />

              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400 sm:text-sm">
                  SK Computer Education
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Complete Your Payment
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                  Complete the secure payment to finish your registration.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_320px]">
              {/* LEFT */}
              <div>
                <h2 className="flex items-center gap-3 text-xl font-bold text-[#173B67]">
                  <span
                    aria-hidden="true"
                    className="h-5 w-1 rounded-full bg-orange-500"
                  />
                  Registration Details
                </h2>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <DetailTile
                      label="Student Name"
                      value={registration.name}
                    />
                    <DetailTile
                      label="Email"
                      value={registration.email}
                      breakAll
                    />
                    <DetailTile
                      label="Mobile"
                      value={registration.phone}
                    />
                    <DetailTile
                      label="State"
                      value={registration.state}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Registration Reference
                  </span>

                  <span className="font-mono text-sm font-bold text-[#173B67]">
                    #{registration.registrationIntentId}
                  </span>
                </div>

                {registration.courseTitle && (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#173B67] text-white">
                        <BookOpen size={19} />
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#173B67]">
                          Selected Course
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-[#173B67]">
                          {registration.courseTitle}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          Included with your selected package.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                      <Package size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                        Selected Package
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-[#173B67]">
                        {registration.packageTitle}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {registration.packageDescription ||
                          "Package details will be provided after registration."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment methods */}
                <div className="mt-8">
                  <h2 className="flex items-center gap-3 text-xl font-bold text-[#173B67]">
                    <span
                      aria-hidden="true"
                      className="h-5 w-1 rounded-full bg-orange-500"
                    />
                    Secure Payment
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Pay securely using Razorpay Test Mode. No real money will
                    be charged.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-sm">
                      <CreditCard size={20} className="text-orange-500" />

                      <p className="mt-3 text-sm font-bold text-slate-800">
                        Cards
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Razorpay Test Mode
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-sm">
                      <span className="flex h-5 w-8 items-center justify-center rounded border border-slate-300 text-[9px] font-bold text-slate-500">
                        UPI
                      </span>

                      <p className="mt-3 text-sm font-bold text-slate-800">
                        UPI
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Razorpay Test Mode
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-sm">
                      <CheckCircle2 size={20} className="text-emerald-500" />

                      <p className="mt-3 text-sm font-bold text-slate-800">
                        Test Mode
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        No real payment
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT — ORDER SUMMARY */}
              <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                    <Package size={19} className="text-orange-500" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                      ₹{formattedAmount}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-base font-bold text-[#173B67]">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-orange-500">
                      ₹{formattedAmount}
                    </span>
                  </div>
                </div>

                {/* TEST MODE notice */}
                <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-xs font-bold text-[#173B67]">
                    RAZORPAY TEST MODE
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    No real money will be charged. This payment uses
                    Razorpay&apos;s testing environment.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div role="alert" className={`mb-4 ${ALERT_ERROR}`}>
                    {error}
                  </div>
                )}

                {/* Razorpay loading error */}
                {razorpayError && !error && (
                  <div role="alert" className={`mb-4 ${ALERT_ERROR}`}>
                    Unable to load Razorpay Checkout. Please refresh and try
                    again.
                  </div>
                )}

                {/* Pay Button */}
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={paymentLoading || razorpayLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Processing...
                    </>
                  ) : razorpayLoading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Loading Payment...
                    </>
                  ) : (
                    <>Complete Payment ₹{formattedAmount}</>
                  )}
                </button>

                {/* Security */}
                <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <LockKeyhole size={14} className="text-[#173B67]" />
                    Secure registration
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck size={14} className="text-[#173B67]" />
                    Backend payment verification
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </Reveal>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Razorpay Test Mode is enabled for development. No real money will
          be charged.
        </p>
      </div>
    </section>
  );
}
