"use client";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type ResetResponse = {
  success: boolean;
  message: string;
};

function ResetPasswordForm() {
  const searchParams =
    useSearchParams();

  const token =
    searchParams.get("token") ||
    "";

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!token) {
      setError(
        "This password reset link is invalid."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/auth/reset-password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              token,
              password,
              confirmPassword,
            }),
          }
        );

      const json: ResetResponse =
        await response.json();

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.message ||
            "Unable to reset password."
        );
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="min-h-screen bg-slate-50 px-5 py-10 sm:px-6 sm:py-16">

        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">

          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2
                size={32}
                className="text-green-600"
              />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-[#173B67]">
              Password Reset Successful
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your password has been updated.
              You can now sign in using your new password.
            </p>

            <Link
              href="/login"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white hover:bg-orange-600"
            >
              Go to Sign In
            </Link>

          </div>

        </div>

      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 px-5 py-10 sm:px-6 sm:py-16">

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">

        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="bg-[#173B67] px-6 py-9 text-center text-white sm:px-8">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500">
              <LockKeyhole size={25} />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">
              Reset Password
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Create a new password for your SKCE account.
            </p>

          </div>

          <div className="p-6 sm:p-8">

            {!token && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                This password reset link is invalid or missing.
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Password */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  New Password
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
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-orange-500"
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
                  Minimum 8 characters.
                </p>

              </div>

              {/* Confirm */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  Confirm Password
                </label>

                <div className="relative">

                  <input
                    required
                    minLength={8}
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-orange-500"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !token
                }
                className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading
                  ? "Resetting Password..."
                  : "Reset Password"}
              </button>

            </form>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#173B67] hover:text-orange-500"
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-screen bg-slate-50 px-5 py-10">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-10 text-center">
            Loading...
          </div>
        </section>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}