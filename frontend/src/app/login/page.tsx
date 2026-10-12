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
  Loader2,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Award,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import FormField from "@/components/FormField";
import PasswordInput from "@/components/PasswordInput";
import { InlineAlert, useToast } from "@/components/Toast";
import { BTN_PRIMARY, INPUT_CLASS, INPUT_ERROR_CLASS, TEXT_LINK } from "@/components/formStyles";
import {
  friendlyAuthMessage,
  getErrorMessage,
  isNetworkError,
  validateEmail,
} from "@/components/formValidators";

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

type FieldErrors = {
  email?: string;
  password?: string;
};

type FormError = {
  title: string;
  message: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { notify, toastContainer } = useToast();

  const [selectedRole, setSelectedRole] =
    useState<Role | null>(null);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [errors, setErrors] =
    useState<FieldErrors>({});

  const [formError, setFormError] =
    useState<FormError | null>(null);

  const [shake, setShake] = useState(0);

  const [loading, setLoading] =
    useState(false);

  const validatePasswordField = (value: string) =>
    value ? "" : "Please enter your password.";

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setErrors({});
    setFormError(null);
  };

  const showFailure = (title: string, message: string) => {
    setFormError({ title, message });
    setShake((count) => count + 1);
    notify("error", title, message);
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedRole) {
      notify(
        "warning",
        "Choose how to sign in",
        "Select Student or Trainer to continue."
      );
      return;
    }

    setFormError(null);

    // ---- Validate before calling the server ----
    const nextErrors: FieldErrors = {
      email: validateEmail(email),
      password: validatePasswordField(password),
    };

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      setShake((count) => count + 1);

      notify(
        "warning",
        "Please check your details",
        nextErrors.email || nextErrors.password
      );

      document
        .getElementById(
          nextErrors.email ? "login-email" : "login-password"
        )
        ?.focus();

      return;
    }

    setErrors({});
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
          `This account is registered as a ${frontendRole}, not a ${selectedRole}. Please go back, choose "${
            frontendRole === "student" ? "Student" : "Trainer"
          }" and try again.`
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

      const message = friendlyAuthMessage(
        getErrorMessage(
          err,
          "Something went wrong. Please try again."
        )
      );

      showFailure(
        isNetworkError(err) ? "Connection problem" : "Sign-in failed",
        message
      );

      // Wrong credentials: let them retype the password straight away.
      if (/incorrect email or password/i.test(message)) {
        setPassword("");
        document.getElementById("login-password")?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const activeRole = ROLES.find(
    (item) => item.key === selectedRole
  );

  return (
    <>
      {toastContainer}

      <section className="sk-auth-bg relative isolate flex min-h-[78vh] items-center overflow-hidden px-5 py-10 sm:px-6 sm:py-14">
        {/* Animated navy backdrop */}
        <div className="sk-auth-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="sk-orb sk-orb-a pointer-events-none absolute -z-10" />
        <div className="sk-orb sk-orb-b pointer-events-none absolute -z-10" />
        <div className="sk-orb sk-orb-c pointer-events-none absolute -z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[3px] bg-gradient-to-r from-orange-500 via-blue-500 to-[#0B2A52]" />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_minmax(0,28rem)] lg:gap-16">
          {/* Brand panel (desktop) */}
          <div className="hidden text-white lg:block">
            <span className="sk-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-orange-200 backdrop-blur">
              <Sparkles size={14} />
              SK Computer Education Learning Portal
            </span>

            <h2
              className="sk-rise mt-5 text-4xl font-extrabold leading-tight xl:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              Your learning journey,
              <span className="block bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                all in one place.
              </span>
            </h2>

            <p
              className="sk-rise mt-4 max-w-lg text-base leading-7 text-slate-300"
              style={{ animationDelay: "160ms" }}
            >
              Sign in to continue your courses, submit assignments, attempt
              quizzes and track your progress.
            </p>

            <ul className="mt-8 grid max-w-lg grid-cols-2 gap-3">
              {[
                { icon: BookOpen, title: "Courses", text: "Lessons & materials" },
                { icon: ClipboardList, title: "Assignments", text: "Quizzes & submissions" },
                { icon: TrendingUp, title: "Progress", text: "Track your growth" },
                { icon: Award, title: "Certificates", text: "Proof of completion" },
              ].map(({ icon: Icon, title, text }, index) => (
                <li
                  key={title}
                  className="sk-rise sk-feature group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-orange-300/40 hover:bg-white/10"
                  style={{ animationDelay: `${240 + index * 90}ms` }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-300 transition duration-300 group-hover:bg-orange-500 group-hover:text-white">
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{title}</span>
                    <span className="block text-xs text-slate-300">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sign-in card */}
          <div className="sk-card-in mx-auto w-full max-w-md">
            <div className="sk-card-glow rounded-[26px] p-px">
              <div className="w-full overflow-hidden rounded-[25px] bg-white shadow-2xl shadow-black/30">
                {/* Header */}
                <div className="sk-card-head relative overflow-hidden px-6 py-8 text-center text-white sm:px-8">
                  <div className="sk-orb-sm pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/30 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />

                  <div className="relative">
                    <div className="sk-icon-pulse mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-900/30">
                      <LockKeyhole size={25} />
                    </div>

                    <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
                      Welcome Back
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-blue-100/80">
                      {selectedRole
                        ? "Sign in to your SK Computer Education account"
                        : "Choose how you want to sign in"}
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  {!selectedRole && (
                    <div className="space-y-3">
                      {ROLES.map(
                        ({ key, label, description, icon: Icon }, index) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedRole(key);
                              resetForm();
                            }}
                            style={{ animationDelay: `${120 + index * 90}ms` }}
                            className="sk-rise group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                          >
                            <span className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-orange-500 transition-transform duration-300 group-hover:scale-y-100" />

                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#173B67] transition duration-300 group-hover:rotate-3 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white">
                              <Icon size={22} />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-[#173B67]">
                                {label}
                              </span>

                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                {description}
                              </span>
                            </span>

                            <ArrowRight
                              size={18}
                              className="text-slate-300 transition duration-300 group-hover:translate-x-1.5 group-hover:text-orange-500"
                            />
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {selectedRole && (
                    <form
                      key={shake}
                      onSubmit={handleSubmit}
                      noValidate
                      className={`space-y-5 ${shake > 0 ? "sk-shake" : "sk-auth-in"}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole(null);
                          resetForm();
                        }}
                        className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-orange-500"
                      >
                        <ArrowLeft
                          size={14}
                          className="transition-transform duration-200 group-hover:-translate-x-1"
                        />
                        Change role
                      </button>

                      {activeRole && (
                        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#173B67] to-[#0B2A52] text-white shadow-md shadow-blue-900/20">
                            <activeRole.icon size={19} />
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Signing in as
                            </p>

                            <p className="mt-0.5 text-sm font-bold text-[#173B67]">
                              {activeRole.label}
                            </p>
                          </div>
                        </div>
                      )}

                      {formError && (
                        <InlineAlert
                          title={formError.title}
                          message={formError.message}
                          onClose={() => setFormError(null)}
                        />
                      )}

                      <FormField
                        label="Email"
                        htmlFor="login-email"
                        error={errors.email}
                      >
                        <input
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);

                            if (errors.email) {
                              setErrors((current) => ({
                                ...current,
                                email: validateEmail(e.target.value),
                              }));
                            }
                          }}
                          onBlur={() =>
                            setErrors((current) => ({
                              ...current,
                              email: email ? validateEmail(email) : "",
                            }))
                          }
                          placeholder="Enter your email"
                          autoComplete="email"
                          aria-invalid={errors.email ? true : undefined}
                          aria-describedby={
                            errors.email ? "login-email-error" : undefined
                          }
                          className={`${INPUT_CLASS} ${
                            errors.email ? INPUT_ERROR_CLASS : ""
                          }`}
                        />
                      </FormField>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label
                            htmlFor="login-password"
                            className="text-sm font-semibold text-[#173B67]"
                          >
                            Password
                          </label>

                          <Link
                            href="/forgot-password"
                            className="text-xs font-semibold text-orange-500 underline-offset-4 transition-colors hover:text-orange-600 hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>

                        <FormField htmlFor="login-password" error={errors.password}>
                          <PasswordInput
                            id="login-password"
                            value={password}
                            onChange={(value) => {
                              setPassword(value);

                              if (errors.password) {
                                setErrors((current) => ({
                                  ...current,
                                  password: validatePasswordField(value),
                                }));
                              }
                            }}
                            onBlur={undefined}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            error={errors.password}
                          />
                        </FormField>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className={`${BTN_PRIMARY} sk-btn-shine group w-full`}
                      >
                        {loading ? (
                          <>
                            <Loader2 size={17} className="animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight
                              size={17}
                              className="transition-transform duration-200 group-hover:translate-x-1"
                            />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                    <p className="text-sm text-slate-500">
                      Don&apos;t have an account?{" "}
                      <Link href="/register" className={TEXT_LINK}>
                        Register Now
                      </Link>
                    </p>

                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <ShieldCheck size={13} />
                      Your password is never stored in the browser
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .sk-auth-bg {
            background:
              radial-gradient(1100px 520px at 85% -10%, rgba(249, 115, 22, 0.22), transparent 60%),
              radial-gradient(900px 500px at -10% 110%, rgba(37, 99, 235, 0.35), transparent 60%),
              linear-gradient(135deg, #071c3a 0%, #0f2f5f 48%, #173b67 100%);
          }

          .sk-auth-grid {
            background-image: radial-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px);
            background-size: 26px 26px;
            -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
            mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
          }

          .sk-orb {
            border-radius: 9999px;
            filter: blur(70px);
            opacity: 0.55;
          }
          .sk-orb-a {
            width: 340px;
            height: 340px;
            left: -80px;
            top: 8%;
            background: #2563eb;
            animation: skFloat 14s ease-in-out infinite;
          }
          .sk-orb-b {
            width: 300px;
            height: 300px;
            right: 4%;
            bottom: -90px;
            background: #f97316;
            opacity: 0.4;
            animation: skFloat 17s ease-in-out -4s infinite reverse;
          }
          .sk-orb-c {
            width: 220px;
            height: 220px;
            left: 42%;
            top: -70px;
            background: #38bdf8;
            opacity: 0.25;
            animation: skFloat 20s ease-in-out -8s infinite;
          }

          .sk-card-glow {
            background: linear-gradient(135deg, rgba(251, 146, 60, 0.9), rgba(255, 255, 255, 0.25) 40%, rgba(96, 165, 250, 0.8));
            background-size: 200% 200%;
            box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.55);
            animation: skGlow 8s ease-in-out infinite;
          }

          .sk-card-head {
            background: linear-gradient(135deg, #0b2a52 0%, #173b67 60%, #1d4d85 100%);
          }
          .sk-card-head::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.1) 50%, transparent 65%);
            transform: translateX(-100%);
            animation: skSheen 6s ease-in-out 1s infinite;
          }

          .sk-icon-pulse {
            position: relative;
          }
          .sk-icon-pulse::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            border: 2px solid rgba(251, 146, 60, 0.7);
            animation: skPing 2.4s ease-out infinite;
          }

          .sk-btn-shine {
            position: relative;
            overflow: hidden;
          }
          .sk-btn-shine::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%);
            transform: translateX(-120%);
            transition: transform 0.7s ease;
          }
          .sk-btn-shine:hover:not(:disabled)::after {
            transform: translateX(120%);
          }

          @keyframes skFloat {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(40px, -30px, 0) scale(1.12); }
          }
          @keyframes skGlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes skSheen {
            0% { transform: translateX(-100%); }
            40%, 100% { transform: translateX(100%); }
          }
          @keyframes skPing {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes skRise {
            from { opacity: 0; transform: translateY(18px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes skCardIn {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes skAuthIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes skShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(7px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(3px); }
          }

          .sk-rise { animation: skRise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
          .sk-card-in { animation: skCardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
          .sk-auth-in { animation: skAuthIn 0.35s ease-out both; }
          .sk-shake { animation: skShake 0.4s ease-in-out; }

          @media (prefers-reduced-motion: reduce) {
            .sk-orb, .sk-card-glow, .sk-card-head::after, .sk-icon-pulse::after,
            .sk-rise, .sk-card-in, .sk-auth-in {
              animation: none !important;
            }
          }
        `}</style>
      </section>
    </>
  );
}
