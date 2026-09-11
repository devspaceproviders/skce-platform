"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { GraduationCap, Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type RegisterRole = "student" | "affiliate";

export default function RegisterPage() {
  const [role, setRole] = useState<RegisterRole>("student");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid =
    form.name.trim().length > 1 &&
    form.email.includes("@") &&
    form.phone.trim().length >= 10 &&
    form.password.length >= 8 &&
    agreed;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Registration failed");
      }
      const data = await res.json();
      localStorage.setItem("skce_token", data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[90vh] flex-col items-center justify-center bg-slate-50 px-6 py-16">
      {/* Logo + heading */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <GraduationCap size={22} />
          </span>
          <span className="text-2xl font-extrabold tracking-tight">SKCE</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Join thousands of students at SKCE</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              required
              placeholder="Ravi Kumar"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <input
              required
              type="tel"
              placeholder="+91 98765 00000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Register as */}
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400">
              REGISTER AS
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["student", "affiliate"] as RegisterRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border py-2.5 text-sm font-semibold capitalize transition ${
                    role === r
                      ? "border-brand bg-blue-50 text-brand"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Trainer and Admin accounts are created by the institute.
            </p>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-brand hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-brand hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-brand/50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}
