"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  MailCheck,
  ShieldCheck,
} from "lucide-react";

import FormField from "@/components/FormField";
import { InlineAlert, useToast } from "@/components/Toast";
import {
  BACK_LINK,
  BTN_GHOST,
  BTN_PRIMARY,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
} from "@/components/formStyles";
import {
  getErrorMessage,
  isNetworkError,
  validateEmail,
} from "@/components/formValidators";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type ForgotPasswordResponse = {
  success: boolean;
  message: string;
};

export default function ForgotPasswordPage() {
  const { notify, toastContainer } = useToast();

  const [email, setEmail] =
    useState("");

  const [emailError, setEmailError] =
    useState("");

  const [formError, setFormError] =
    useState<{ title: string; message: string } | null>(null);

  const [shake, setShake] = useState(0);

  const [loading, setLoading] =
    useState(false);

  const [sent, setSent] =
    useState(false);

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    setFormError(null);

    const validationMessage = validateEmail(email);

    if (validationMessage) {
      setEmailError(validationMessage);
      setShake((count) => count + 1);

      notify(
        "warning",
        "Please check your email",
        validationMessage
      );

      document.getElementById("email")?.focus();
      return;
    }

    setEmailError("");
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

      notify(
        "success",
        "Reset link sent",
        "Check your inbox (and spam folder) for the next steps.",
        6500
      );
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Something went wrong. Please try again."
      );

      const title = isNetworkError(err)
        ? "Connection problem"
        : "Couldn't send the reset link";

      setFormError({ title, message });
      setShake((count) => count + 1);
      notify("error", title, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toastContainer}

      <main className="sk-auth-bg relative isolate flex min-h-[78vh] items-center overflow-hidden px-6 py-10 sm:py-14">
        <div className="sk-auth-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="sk-orb sk-orb-a pointer-events-none absolute -z-10" />
        <div className="sk-orb sk-orb-b pointer-events-none absolute -z-10" />
        <div className="sk-orb sk-orb-c pointer-events-none absolute -z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[3px] bg-gradient-to-r from-orange-500 via-blue-500 to-[#0B2A52]" />
        <div className="sk-auth-in mx-auto flex w-full max-w-md flex-col items-center">
          {/* Brand */}
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-900/30">
                <span className="text-xl font-extrabold text-white">SK</span>
              </div>

              <div className="text-left">
                <div className="text-xl font-bold text-white">
                  SK Computer Education
                </div>

                <div className="text-xs font-medium text-orange-300">
                  Learn • Grow • Succeed
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {sent ? "Check Your Email" : "Forgot Your Password?"}
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100/80">
              {sent
                ? `We've prepared password reset instructions for ${email.trim()}.`
                : "Enter your registered email address and we'll help you reset your password."}
            </p>
          </div>

          {/* Card */}
          <div className="sk-card-in relative w-full overflow-hidden rounded-3xl bg-white p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 via-blue-500 to-[#173B67]" />
            {sent ? (
              <div className="sk-auth-in text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                  <MailCheck size={30} className="text-orange-500" />
                </div>

                <h2 className="text-lg font-bold text-[#173B67]">
                  Reset link sent
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Check your registered email address for the password reset
                  instructions. If you requested a reset, you will receive an
                  email with a secure link to create a new password.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setFormError(null);
                  }}
                  className={`${BTN_GHOST} mt-6 w-full`}
                >
                  Try Another Email
                </button>
              </div>
            ) : (
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
                  label="Email Address"
                  htmlFor="email"
                  error={emailError}
                >
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);

                      if (emailError) {
                        setEmailError(validateEmail(e.target.value));
                      }
                    }}
                    onBlur={() =>
                      setEmailError(email ? validateEmail(email) : "")
                    }
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? "email-error" : undefined}
                    className={`${INPUT_CLASS} ${
                      emailError ? INPUT_ERROR_CLASS : ""
                    }`}
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${BTN_PRIMARY} w-full`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#173B67]"
              />

              <p className="text-xs leading-5 text-slate-500">
                Your account information is kept secure. We do not reveal
                whether an email address is registered with SK Computer
                Education.
              </p>
            </div>

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

          <p className="mt-6 text-center text-xs text-blue-100/70">
            Need help?{" "}
            <Link
              href="/contact"
              className="font-semibold text-orange-300 transition-colors hover:text-orange-200"
            >
              Contact SK Computer Education
            </Link>
          </p>
        </div>

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
          .sk-orb { border-radius: 9999px; filter: blur(70px); opacity: 0.55; }
          .sk-orb-a { width: 340px; height: 340px; left: -80px; top: 8%; background: #2563eb; animation: skFloat 14s ease-in-out infinite; }
          .sk-orb-b { width: 300px; height: 300px; right: 4%; bottom: -90px; background: #f97316; opacity: 0.4; animation: skFloat 17s ease-in-out -4s infinite reverse; }
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
      </main>
    </>
  );
}
