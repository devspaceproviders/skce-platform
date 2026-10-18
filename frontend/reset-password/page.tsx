"use client";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LockKeyhole,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import FormField from "@/components/FormField";
import PasswordInput, { PasswordStrength } from "@/components/PasswordInput";
import { InlineAlert, useToast } from "@/components/Toast";
import { BACK_LINK, BTN_PRIMARY } from "@/components/formStyles";
import {
  getErrorMessage,
  isNetworkError,
  validatePassword,
} from "@/components/formValidators";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type ResetResponse = {
  success: boolean;
  message: string;
};

const validateConfirm = (password: string, confirm: string) => {
  if (!confirm) {
    return "Please re-enter your new password.";
  }

  if (confirm !== password) {
    return "Passwords don't match. Please re-enter.";
  }

  return "";
};

function ResetPasswordForm() {
  const searchParams =
    useSearchParams();

  const { notify, toastContainer } = useToast();

  const token =
    searchParams.get("token") ||
    "";

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const [formError, setFormError] =
    useState<{ title: string; message: string } | null>(null);

  const [shake, setShake] = useState(0);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    setFormError(null);

    if (!token) {
      const message =
        "This password reset link is invalid or has expired. Please request a new one.";

      setFormError({ title: "Invalid reset link", message });
      notify("error", "Invalid reset link", message);
      return;
    }

    const nextErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirm(password, confirmPassword),
    };

    if (nextErrors.password || nextErrors.confirmPassword) {
      setErrors(nextErrors);
      setShake((count) => count + 1);

      notify(
        "warning",
        "Please check your password",
        nextErrors.password || nextErrors.confirmPassword
      );

      document
        .getElementById(
          nextErrors.password ? "new-password" : "confirm-password"
        )
        ?.focus();

      return;
    }

    setErrors({});
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

      notify(
        "success",
        "Password updated",
        "You can now sign in with your new password."
      );
    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      const raw = getErrorMessage(err, "Unable to reset password.");

      const message = /expired|invalid.*token|token/i.test(raw)
        ? "This reset link is invalid or has expired. Please request a new one."
        : raw;

      const title = isNetworkError(err)
        ? "Connection problem"
        : "Couldn't reset password";

      setFormError({ title, message });
      setShake((count) => count + 1);
      notify("error", title, message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        {toastContainer}

        <section className="sk-auth-bg relative isolate flex min-h-[78vh] items-center overflow-hidden px-5 py-10 sm:px-6">
        <div className="sk-auth-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="sk-orb sk-orb-a pointer-events-none absolute -z-10" />
        <div className="sk-orb sk-orb-b pointer-events-none absolute -z-10" />
        <div className="sk-orb sk-orb-c pointer-events-none absolute -z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[3px] bg-gradient-to-r from-orange-500 via-blue-500 to-[#0B2A52]" />
          <div className="sk-auth-in sk-card-in mx-auto w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl shadow-black/30">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-[#173B67]">
              Password Reset Successful
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your password has been updated. You can now sign in using your
              new password.
            </p>

            <Link href="/login" className={`${BTN_PRIMARY} mt-7 w-full`}>
              Go to Sign In
            </Link>
          </div>

          <AuthAnimation />
        </section>
      </>
    );
  }

  return (
    <>
      {toastContainer}

      <section className="sk-auth-bg relative isolate flex min-h-[78vh] items-center overflow-hidden px-5 py-10 sm:px-6 sm:py-14">
        <div className="sk-auth-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="sk-orb sk-orb-a pointer-events-none absolute -z-10" />
        <div className="sk-orb sk-orb-b pointer-events-none absolute -z-10" />
        <div className="sk-orb sk-orb-c pointer-events-none absolute -z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[3px] bg-gradient-to-r from-orange-500 via-blue-500 to-[#0B2A52]" />
        <div className="sk-auth-in mx-auto w-full max-w-md">
          <div className="sk-card-in w-full overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/30">
            <div className="sk-card-head relative overflow-hidden px-6 py-8 text-center text-white sm:px-8">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />

              <div className="relative">
                <div className="sk-icon-pulse mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-900/30">
                  <LockKeyhole size={25} />
                </div>

                <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
                  Reset Password
                </h1>

                <p className="mt-2 text-sm leading-6 text-blue-100/80">
                  Create a new password for your SK Computer Education
                  account.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {!token && (
                <InlineAlert
                  className="mb-5"
                  title="Invalid reset link"
                  message="This password reset link is invalid or missing. Please request a new one."
                />
              )}

              <form
                key={shake}
                onSubmit={handleSubmit}
                noValidate
                className={`space-y-5 ${shake > 0 ? "sk-shake" : ""}`}
              >
                {formError && (
                  <InlineAlert
                    title={formError.title}
                    message={formError.message}
                    onClose={() => setFormError(null)}
                  />
                )}

                <FormField
                  label="New Password"
                  htmlFor="new-password"
                  error={errors.password}
                  hint="Minimum 8 characters."
                >
                  <PasswordInput
                    id="new-password"
                    value={password}
                    onChange={(value) => {
                      setPassword(value);

                      setErrors((current) => ({
                        ...current,
                        password: current.password
                          ? validatePassword(value)
                          : "",
                        confirmPassword: current.confirmPassword
                          ? validateConfirm(value, confirmPassword)
                          : "",
                      }));
                    }}
                    onBlur={() =>
                      setErrors((current) => ({
                        ...current,
                        password: password ? validatePassword(password) : "",
                      }))
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    error={errors.password}
                  />

                  <PasswordStrength value={password} />
                </FormField>

                <FormField
                  label="Confirm Password"
                  htmlFor="confirm-password"
                  error={errors.confirmPassword}
                >
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(value) => {
                      setConfirmPassword(value);

                      // Check the match live once they've started typing.
                      setErrors((current) => ({
                        ...current,
                        confirmPassword:
                          value || current.confirmPassword
                            ? validateConfirm(password, value)
                            : "",
                      }));
                    }}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    error={errors.confirmPassword}
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className={`${BTN_PRIMARY} w-full`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>

              <Link
                href="/login"
                className={`${BACK_LINK} mt-6 flex justify-center`}
              >
                <ArrowLeft
                  size={16}
                  className="transition-transform duration-200 group-hover:-translate-x-1"
                />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>

        <AuthAnimation />
      </section>
    </>
  );
}

function AuthAnimation() {
  return (
    <style jsx global>{`
@keyframes skFloat {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(40px, -30px, 0) scale(1.12); }
          }
          @keyframes skSheen {
            0% { transform: translateX(-100%); }
            40%, 100% { transform: translateX(100%); }
          }
          @keyframes skPing {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes skCardIn {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .sk-auth-bg {
            background:
              radial-gradient(1100px 520px at 85% -10%, rgba(59, 130, 246, 0.3), transparent 60%),
              radial-gradient(900px 500px at -10% 110%, rgba(37, 99, 235, 0.35), transparent 60%),
              linear-gradient(135deg, #071c3a 0%, #0f2f5f 48%, #173b67 100%);
          }
          .sk-auth-grid {
            background-image: radial-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px);
            background-size: 26px 26px;
            -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
            mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
          }
          .sk-orb { border-radius: 9999px; filter: blur(70px); opacity: 0.55; }
          .sk-orb-a { width: 340px; height: 340px; left: -80px; top: 8%; background: #2563eb; animation: skFloat 14s ease-in-out infinite; }
          .sk-orb-b { width: 300px; height: 300px; right: 4%; bottom: -90px; background: #3b82f6;
            opacity: 0.3; animation: skFloat 17s ease-in-out -4s infinite reverse; }
          .sk-orb-c { width: 220px; height: 220px; left: 42%; top: -70px; background: #38bdf8; opacity: 0.25; animation: skFloat 20s ease-in-out -8s infinite; }
          .sk-card-in { animation: skCardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
          .sk-card-head { background: linear-gradient(135deg, #0b2a52 0%, #173b67 60%, #1d4d85 100%); }
          .sk-card-head::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.1) 50%, transparent 65%);
            transform: translateX(-100%);
            animation: skSheen 6s ease-in-out 1s infinite;
          }
          .sk-icon-pulse { position: relative; }
          .sk-icon-pulse::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            border: 2px solid rgba(251, 146, 60, 0.7);
            animation: skPing 2.4s ease-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .sk-orb, .sk-card-in, .sk-card-head::after, .sk-icon-pulse::after, .sk-auth-in { animation: none !important; }
          }

                @keyframes skAuthIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes skShake {
        0%,
        100% {
          transform: translateX(0);
        }
        20% {
          transform: translateX(-8px);
        }
        40% {
          transform: translateX(7px);
        }
        60% {
          transform: translateX(-5px);
        }
        80% {
          transform: translateX(3px);
        }
      }

      .sk-auth-in {
        animation: skAuthIn 0.35s ease-out both;
      }

      .sk-shake {
        animation: skShake 0.4s ease-in-out;
      }
    `}</style>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <section className="sk-auth-bg flex min-h-[78vh] items-center px-5 py-10">
          <div className="mx-auto flex w-full max-w-md items-center justify-center gap-3 rounded-2xl bg-white p-10 text-sm text-slate-500 shadow-xl">
            <Loader2 size={18} className="animate-spin text-orange-500" />
            Loading...
          </div>
        </section>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
