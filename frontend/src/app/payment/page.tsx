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
import { PACKAGE_OPTIONS } from "@/lib/packageList";
import { COURSE_OPTIONS } from "@/lib/courseList";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type RegistrationData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  state: string;
  referralId: string | null;

  packageSlug: string;
  packageTitle: string;

  courseSlug?: string | null;
  courseTitle?: string | null;

  amount: number;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      prefill?: {
        name?: string;
        email?: string;
        contact?: string;
      };
      notes?: Record<string, string>;
      theme?: {
        color?: string;
      };
      handler: (response: RazorpayResponse) => void;
      modal?: {
        ondismiss?: () => void;
      };
    }) => {
      open: () => void;
    };
  }
}

export default function PaymentPage() {
  const [registration, setRegistration] =
    useState<RegistrationData | null>(null);

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem("skce_registration");

      if (!stored) {
        window.location.href = "/register";
        return;
      }

      const parsed: RegistrationData =
        JSON.parse(stored);

      const pkg = PACKAGE_OPTIONS.find(
        (item) => item.slug === parsed.packageSlug
      );

      if (!pkg) {
        sessionStorage.removeItem("skce_registration");
        window.location.href = "/register";
        return;
      }

      const course =
        parsed.courseSlug
          ? COURSE_OPTIONS.find(
              (item) => item.slug === parsed.courseSlug
            )
          : undefined;

      setRegistration({
        ...parsed,
        packageTitle: pkg.title,
        amount: pkg.price,
        courseTitle:
          course?.title ||
          parsed.courseTitle ||
          null,
      });

      setLoading(false);
    } catch {
      sessionStorage.removeItem("skce_registration");
      window.location.href = "/register";
    }
  }, []);

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener(
          "load",
          () => resolve(true)
        );

        existingScript.addEventListener(
          "error",
          () => resolve(false)
        );

        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.async = true;

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!registration) return;

    setError("");
    setPaymentLoading(true);

    try {
      /*
       * STEP 1
       *
       * Ask the backend to create a Razorpay order.
       *
       * The backend MUST determine the authoritative
       * package amount from packageSlug.
       */
      const orderResponse = await fetch(
        `${API_URL}/payments/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: registration.name,
            email: registration.email,
            phone: registration.phone,
            state: registration.state,
            referralId: registration.referralId,

            packageSlug: registration.packageSlug,

            courseSlug:
              registration.courseSlug || null,
          }),
        }
      );

      const orderData =
        await orderResponse.json().catch(() => null);

      if (!orderResponse.ok) {
        throw new Error(
          orderData?.message ||
            "Unable to create payment order."
        );
      }

      if (!orderData?.orderId) {
        throw new Error(
          "Payment order was not created correctly."
        );
      }

      /*
       * STEP 2
       *
       * Load Razorpay Checkout.
       */
      const razorpayLoaded =
        await loadRazorpayScript();

      if (!razorpayLoaded) {
        throw new Error(
          "Unable to load Razorpay. Please check your internet connection and try again."
        );
      }

      if (!orderData.keyId) {
        throw new Error(
          "Razorpay configuration is missing on the server."
        );
      }

      /*
       * STEP 3
       *
       * Open Razorpay Checkout.
       */
      const razorpay =
        new window.Razorpay({
          key: orderData.keyId,

          /*
           * Razorpay amount is in paise.
           *
           * This MUST come from the backend-created order.
           */
          amount: orderData.amount,

          currency:
            orderData.currency || "INR",

          name: "SK Computer Education",

          description:
            registration.packageTitle,

          order_id:
            orderData.orderId,

          prefill: {
            name: registration.name,
            email: registration.email,
            contact: registration.phone,
          },

          notes: {
            packageSlug:
              registration.packageSlug,

            packageTitle:
              registration.packageTitle,

            courseSlug:
              registration.courseSlug || "",
          },

          theme: {
            color: "#F97316",
          },

          /*
           * STEP 4
           *
           * Razorpay returns payment details.
           *
           * Send these details to the backend.
           * The backend verifies the signature and
           * creates the student only after verification.
           */
          handler: async (
            response: RazorpayResponse
          ) => {
            try {
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
                      name: registration.name,
                      email: registration.email,
                      phone: registration.phone,
                      password:
                        registration.password,
                      state: registration.state,
                      referralId:
                        registration.referralId,

                      packageSlug:
                        registration.packageSlug,

                      courseSlug:
                        registration.courseSlug ||
                        null,

                      razorpayOrderId:
                        response.razorpay_order_id,

                      razorpayPaymentId:
                        response.razorpay_payment_id,

                      razorpaySignature:
                        response.razorpay_signature,
                    }),
                  }
                );

              const verifyData =
                await verifyResponse
                  .json()
                  .catch(() => null);

              if (!verifyResponse.ok) {
                throw new Error(
                  verifyData?.message ||
                    "Payment verification failed."
                );
              }

              /*
               * Only clear registration data after
               * the backend confirms successful payment
               * verification and student creation.
               */
              sessionStorage.removeItem(
                "skce_registration"
              );

              if (verifyData?.token) {
                localStorage.setItem(
                  "skce_token",
                  verifyData.token
                );
              }

              window.location.href =
                "/registration-success";
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Payment verification failed."
              );

              setPaymentLoading(false);
            }
          },

          modal: {
            ondismiss: () => {
              setPaymentLoading(false);
            },
          },
        });

      razorpay.open();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start payment."
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

        {/* =====================================================
            BACK
        ===================================================== */}
        <Link
          href="/register"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft size={16} />
          Back to Registration
        </Link>

        {/* =====================================================
            MAIN CARD
        ===================================================== */}
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
              Complete the secure payment to finish your
              registration.
            </p>
          </div>

          {/* Content */}
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_320px]">

            {/* =================================================
                LEFT
            ================================================= */}
            <div>

              <h2 className="text-xl font-extrabold text-[#102A43]">
                Registration Details
              </h2>

              {/* Student details */}
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Student Name
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {registration.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all font-semibold text-slate-800">
                      {registration.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Mobile
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {registration.phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      State
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {registration.state}
                    </p>
                  </div>

                </div>
              </div>

              {/* Selected course */}
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

              {/* Selected package */}
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
                      {
                        PACKAGE_OPTIONS.find(
                          (pkg) =>
                            pkg.slug ===
                            registration.packageSlug
                        )?.description
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  PAYMENT METHODS
              ================================================= */}
              <div className="mt-8">
                <h2 className="text-xl font-extrabold text-[#102A43]">
                  Secure Payment
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Choose from the payment methods available
                  inside Razorpay Checkout.
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
                      Debit / Credit
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
                      UPI / QR
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <CheckCircle2
                      size={20}
                      className="text-green-500"
                    />

                    <p className="mt-3 text-sm font-bold text-slate-800">
                      Secure
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Razorpay Checkout
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* =================================================
                RIGHT - ORDER SUMMARY
            ================================================= */}
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

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                  {error}
                </div>
              )}

              {/* Pay button */}
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

                    Opening Secure Payment...
                  </>
                ) : (
                  <>
                    Pay ₹
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

                  Secure payment processing
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck
                    size={14}
                    className="text-[#173B67]"
                  />

                  Payment verification required
                </div>

              </div>

            </aside>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Your payment is processed through Razorpay.
          Registration is completed only after successful
          payment verification.
        </p>
      </div>
    </section>
  );
}