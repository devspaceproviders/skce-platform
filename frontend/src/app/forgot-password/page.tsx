"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, MailCheck } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Something went wrong. Please try again.");
      // Always show the success state, even if the email doesn't exist,
      // so we don't leak which addresses are registered.
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[85vh] flex-col items-center justify-center bg-slate-50 px-6 py-16">
      {/* Logo + heading */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <GraduationCap size={22} />
          </span>
          <span className="text-2xl font-extrabold tracking-tight">SKCE</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {sent ? "Check your email" : "Forgot password?"}
        </h1>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          {sent
            ? `We've sent password reset instructions to ${email}`
            : "No worries — enter your email and we'll send you reset instructions."}
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        {sent ? (
          <div className="flex flex-col items-center text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-brand">
              <MailCheck size={26} />
            </span>
            <p className="mb-6 text-sm text-slate-500">
              Didn&apos;t get the email? Check your spam folder, or try
              again with a different address.
            </p>
            <button
              onClick={() => setSent(false)}
              className="w-full rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Try another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-brand/50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand"
        >
          <ArrowLeft size={15} /> Back to Sign in
        </Link>
      </div>
    </section>
  );
}