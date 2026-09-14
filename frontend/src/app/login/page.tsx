"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  ArrowLeft,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";

type Role = "student" | "trainer";

const ROLES: {
  key: Role;
  label: string;
  description: string;
  icon: typeof GraduationCap;
}[] = [
  {
    key: "student",
    label: "Student",
    description: "Access your courses and learning progress",
    icon: GraduationCap,
  },
  {
    key: "trainer",
    label: "Trainer",
    description: "Manage batches, attendance and grading",
    icon: Briefcase,
  },
];

const ROLE_REDIRECTS: Record<Role, string> = {
  trainer: "/dashboard/trainer",
  student: "/dashboard/student",
};

// -------------------------------------------------------------
// DEV MODE
// Keep this enabled until the real backend authentication
// API is connected.
// -------------------------------------------------------------
const DEV_MODE = true;

const DUMMY_USERS: Record<
  Role,
  { email: string; password: string }
> = {
  student: {
    email: "student@skce.in",
    password: "student123",
  },
  trainer: {
    email: "trainer@skce.in",
    password: "trainer123",
  },
};
// -------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] =
    useState<Role | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedRole) return;

    setError("");
    setLoading(true);

    try {
      // -------------------------------------------------------
      // DEV MODE
      // -------------------------------------------------------
      if (DEV_MODE) {
        const dummy = DUMMY_USERS[selectedRole];

        await new Promise((resolve) =>
          setTimeout(resolve, 400)
        );

        if (
          email.trim().toLowerCase() !== dummy.email ||
          password !== dummy.password
        ) {
          throw new Error(
            `Invalid email or password.`
          );
        }

        localStorage.setItem(
          "token",
          "dev-dummy-token"
        );

        localStorage.setItem(
          "role",
          selectedRole
        );

        router.push(
          ROLE_REDIRECTS[selectedRole]
        );

        return;
      }

      // -------------------------------------------------------
      // REAL BACKEND AUTH
      // -------------------------------------------------------
      const res = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            role: selectedRole,
          }),
        }
      );

      if (!res.ok) {
        const data =
          await res.json().catch(() => null);

        throw new Error(
          data?.message ||
            "Invalid email or password"
        );
      }

      const data = await res.json();

      const { token, user } = data;

      const confirmedRole: Role =
        user.role;

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "role",
        confirmedRole
      );

      router.push(
        ROLE_REDIRECTS[confirmedRole] ||
          "/dashboard"
      );
    } catch (err: any) {
      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 px-5 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">

        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* ===================================================
              HEADER
          =================================================== */}
          <div className="bg-[#173B67] px-6 py-9 text-center text-white sm:px-8">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-900/20">
              <LockKeyhole size={25} />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {selectedRole
                ? "Sign in to your SKCE account"
                : "Choose how you want to sign in"}
            </p>
          </div>

          {/* ===================================================
              CONTENT
          =================================================== */}
          <div className="p-6 sm:p-8">

            {/* =================================================
                STEP 1 — ROLE SELECTION
            ================================================= */}
            {!selectedRole && (
              <div className="space-y-3">

                {ROLES.map(
                  ({
                    key,
                    label,
                    description,
                    icon: Icon,
                  }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedRole(key);
                        setError("");
                      }}
                      className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50/40 hover:shadow-sm"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#173B67] transition group-hover:bg-orange-100 group-hover:text-orange-500">
                        <Icon size={21} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#102A43]">
                          {label}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {description}
                        </span>
                      </span>

                      <ArrowRight
                        size={17}
                        className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
                      />
                    </button>
                  )
                )}

              </div>
            )}

            {/* =================================================
                STEP 2 — LOGIN FORM
            ================================================= */}
            {selectedRole && (
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* Change role */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(null);
                    setError("");
                    setEmail("");
                    setPassword("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-orange-500"
                >
                  <ArrowLeft size={14} />

                  Change role
                </button>

                {/* Selected role */}
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  {(() => {
                    const role =
                      ROLES.find(
                        (item) =>
                          item.key ===
                          selectedRole
                      );

                    if (!role) return null;

                    const Icon = role.icon;

                    return (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#173B67] text-white">
                          <Icon size={19} />
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#173B67]">
                            Signing in as
                          </p>

                          <p className="mt-0.5 text-sm font-bold text-[#102A43]">
                            {role.label}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* DEV MODE INFO */}
                {DEV_MODE && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-bold text-amber-800">
                      Development Mode
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Use the demo credentials below while
                      backend authentication is being developed.
                    </p>

                    <div className="mt-3 rounded-lg bg-white/70 p-3 font-mono text-xs text-amber-900">
                      <div>
                        Email:{" "}
                        <strong>
                          {DUMMY_USERS[selectedRole].email}
                        </strong>
                      </div>

                      <div className="mt-1">
                        Password:{" "}
                        <strong>
                          {DUMMY_USERS[selectedRole].password}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Email
                  </label>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-[#102A43]">
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-orange-500 transition hover:text-orange-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                    {error}
                  </div>
                )}

                {/* Sign in */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign In"}

                  {!loading && (
                    <ArrowRight size={17} />
                  )}
                </button>
              </form>
            )}

            {/* Register */}
            <div className="mt-7 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-bold text-orange-500 transition hover:text-orange-600 hover:underline"
                >
                  Register Now
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}