"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MailCheck,
  ShieldCheck,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type ForgotPasswordResponse = {
  success: boolean;
  message: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [sent, setSent] =
    useState(false);

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/auth/forgot-password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email:
                email.trim(),
            }),
          }
        );

      const json: ForgotPasswordResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.message ||
            "Something went wrong. Please try again."
        );
      }

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[85vh] bg-slate-50 px-6 py-16">

      <div className="mx-auto flex max-w-md flex-col items-center justify-center">

        {/* Brand */}

        <div className="mb-8 flex flex-col items-center text-center">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#173B67]">
              <span className="text-xl font-extrabold text-white">
                SK
              </span>
            </div>

            <div className="text-left">
              <div className="text-xl font-extrabold text-[#173B67]">
                SK Computer Education
              </div>

              <div className="text-xs font-medium text-orange-500">
                Learn â€¢ Grow â€¢ Succeed
              </div>
            </div>

          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {sent
              ? "Check Your Email"
              : "Forgot Your Password?"}
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {sent
              ? `We've prepared password reset instructions for ${email}.`
              : "Enter your registered email address and we'll help you reset your password."}
          </p>

        </div>

        {/* Card */}

        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          {sent ? (
            <div className="text-center">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                <MailCheck
                  size={30}
                  className="text-orange-500"
                />
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Reset link sent
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Check your registered email address
                for the password reset instructions.
                If you requested a reset, you will
                receive an email with a secure link
                to create a new password.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError("");
                }}
                className="mt-6 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:border-[#173B67]"
              >
                Try Another Email
              </button>

            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />

              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Preparing..."
                  : "Send Reset Link"}
              </button>

            </form>
          )}

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">

            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-[#173B67]"
            />

            <p className="text-xs leading-5 text-slate-500">
              Your account information is kept secure.
              We do not reveal whether an email address
              is registered with SKCE.
            </p>

          </div>

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#173B67] hover:text-orange-500"
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>

        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Need help?{" "}
          <Link
            href="/contact"
            className="font-semibold text-[#173B67] hover:text-orange-500"
          >
            Contact SKCE
          </Link>
        </p>

      </div>

    </main>
  );
}