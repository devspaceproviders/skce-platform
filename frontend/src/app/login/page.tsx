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
  Eye,
  EyeOff,
} from "lucide-react";

type Role =
  | "student"
  | "trainer";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const ROLES = [
  {
    key: "student" as Role,
    label: "Student",
    description:
      "Access your courses and learning progress",
    icon: GraduationCap,
  },
  {
    key: "trainer" as Role,
    label: "Trainer",
    description:
      "Manage batches, attendance and grading",
    icon: Briefcase,
  },
];

const ROLE_REDIRECTS: Record<
  Role,
  string
> = {
  student:
    "/dashboard/student",
  trainer:
    "/dashboard/trainer",
};

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      phone: string | null;
      role:
        | "ADMIN"
        | "STUDENT"
        | "TRAINER";
    };
    student: {
      id: number;
      studentId: string;
      state: string | null;
      referralId: string | null;
    } | null;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] =
    useState<Role | null>(null);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedRole) {
      setError(
        "Please select how you want to sign in."
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email:
                email.trim(),
              password,
            }),
          }
        );

      const json: LoginResponse =
        await response.json();

      if (
        !response.ok ||
        !json.success ||
        !json.data
      ) {
        throw new Error(
          json.message ||
            "Invalid email or password."
        );
      }

      const {
        token,
        user,
        student,
      } = json.data;

      const frontendRole:
        | Role
        | null =
        user.role === "STUDENT"
          ? "student"
          : user.role ===
            "TRAINER"
          ? "trainer"
          : null;

      if (!frontendRole) {
        throw new Error(
          "This account type cannot sign in here."
        );
      }

      if (
        frontendRole !==
        selectedRole
      ) {
        throw new Error(
          `This account is registered as a ${frontendRole}, not a ${selectedRole}.`
        );
      }

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "role",
        frontendRole
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      if (
        frontendRole ===
          "student" &&
        student
      ) {
        localStorage.setItem(
          "student",
          JSON.stringify(student)
        );

        localStorage.setItem(
          "studentId",
          student.studentId
        );
      } else {
        localStorage.removeItem(
          "student"
        );

        localStorage.removeItem(
          "studentId"
        );
      }

      router.push(
        ROLE_REDIRECTS[
          frontendRole
        ]
      );
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

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
    <section className="min-h-screen bg-slate-50 px-5 py-10 sm:px-6 sm:py-16">

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">

        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="bg-[#173B67] px-6 py-9 text-center text-white sm:px-8">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500">
              <LockKeyhole size={25} />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {selectedRole
                ? "Sign in to your SKCE account"
                : "Choose how you want to sign in"}
            </p>

          </div>

          <div className="p-6 sm:p-8">

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
                        setSelectedRole(
                          key
                        );
                        setError("");
                      }}
                      className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-orange-300 hover:bg-orange-50/40 hover:shadow-sm"
                    >

                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#173B67] group-hover:bg-orange-100 group-hover:text-orange-500">

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
                        className="text-slate-300 group-hover:text-orange-500"
                      />

                    </button>
                  )
                )}

              </div>
            )}

            {selectedRole && (
              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-5"
              >

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(
                      null
                    );
                    setError("");
                    setEmail("");
                    setPassword("");
                    setShowPassword(
                      false
                    );
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-500"
                >
                  <ArrowLeft size={14} />
                  Change role
                </button>

                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">

                  {(() => {
                    const role =
                      ROLES.find(
                        (item) =>
                          item.key ===
                          selectedRole
                      );

                    if (!role) {
                      return null;
                    }

                    const Icon =
                      role.icon;

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

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Email
                  </label>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label className="text-sm font-semibold text-[#102A43]">
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-orange-500 hover:underline"
                    >
                      Forgot password?
                    </Link>

                  </div>

                  <div className="relative">

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      required
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-orange-500"
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

                </div>

                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign In"}

                  {!loading && (
                    <ArrowRight
                      size={17}
                    />
                  )}
                </button>

              </form>
            )}

            <div className="mt-7 border-t border-slate-100 pt-6 text-center">

              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}

                <Link
                  href="/register"
                  className="font-bold text-orange-500 hover:underline"
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