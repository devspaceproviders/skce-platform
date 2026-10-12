"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";

import FormField from "@/components/FormField";
import PasswordInput from "@/components/PasswordInput";
import { InlineAlert, useToast } from "@/components/Toast";
import {
  BACK_LINK,
  BTN_PRIMARY,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
} from "@/components/formStyles";
import {
  friendlyAuthMessage,
  getErrorMessage,
  isNetworkError,
  validateEmail,
} from "@/components/formValidators";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const { notify, toastContainer } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});

  const [formError, setFormError] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [shake, setShake] = useState(0);
  const [loading, setLoading] = useState(false);

  const validatePasswordField = (value: string) =>
    value ? "" : "Please enter your password.";

  const showFailure = (title: string, message: string) => {
    setFormError({ title, message });
    setShake((count) => count + 1);
    notify("error", title, message);
  };

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

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
          nextErrors.email ? "admin-email" : "admin-password"
        )
        ?.focus();

      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to login"
        );
      }

      const user = result.data?.user;
      const token = result.data?.token;

      if (!token || !user) {
        throw new Error(
          "Invalid login response from server"
        );
      }

      // Only ADMIN users can enter the Admin Portal
      if (user.role !== "ADMIN") {
        throw new Error(
          "This account does not have Admin access. Students and trainers can sign in from the main Login page."
        );
      }

      // Store the real JWT
      localStorage.setItem(
        "token",
        token
      );

      // Optional admin marker for frontend UI
      localStorage.setItem(
        "skce_admin_logged_in",
        "true"
      );

      // Go to existing Admin Dashboard
      router.push("/dashboard/admin");
    } catch (err) {
      console.error(
        "Admin login error:",
        err
      );

      const message = friendlyAuthMessage(
        getErrorMessage(err, "Unable to login")
      );

      showFailure(
        isNetworkError(err) ? "Connection problem" : "Sign-in failed",
        message
      );

      if (/incorrect email or password/i.test(message)) {
        setPassword("");
        document.getElementById("admin-password")?.focus();
      }

      setLoading(false);
    }
  }

  return (
    <>
      {toastContainer}

      <main className="sk-auth-bg relative isolate flex min-h-[78vh] items-center justify-center overflow-hidden px-6 py-12">
        <div className="sk-auth-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="sk-orb sk-orb-a pointer-events-none absolute -z-10" />
        <div className="sk-orb sk-orb-b pointer-events-none absolute -z-10" />
        <div className="sk-orb sk-orb-c pointer-events-none absolute -z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[3px] bg-gradient-to-r from-orange-500 via-blue-500 to-[#0B2A52]" />
        <div className="sk-auth-in w-full max-w-md">
          {/* Header */}
          <div className="mb-7 text-center">
            <div className="sk-icon-pulse mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-900/30">
              <ShieldCheck size={30} className="text-white" />
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
              Secure Access
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Admin Login
            </h1>

            <p className="mt-2 text-sm text-blue-100/80">
              Sign in to access the SK Computer Education Admin Portal
            </p>
          </div>

          {/* Card */}
          <div className="sk-card-in relative overflow-hidden rounded-3xl bg-white p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 via-blue-500 to-[#173B67]" />
            <form
              key={shake}
              onSubmit={handleLogin}
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

              {/* Email */}
              <FormField
                label="Admin Email"
                htmlFor="admin-email"
                error={errors.email}
              >
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="admin-email"
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
                    placeholder="Enter admin email"
                    autoComplete="email"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={
                      errors.email ? "admin-email-error" : undefined
                    }
                    className={`${INPUT_CLASS} pl-11 ${
                      errors.email ? INPUT_ERROR_CLASS : ""
                    }`}
                  />
                </div>
              </FormField>

              {/* Password */}
              <FormField
                label="Password"
                htmlFor="admin-password"
                error={errors.password}
              >
                <PasswordInput
                  id="admin-password"
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
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  error={errors.password}
                  leftIcon={<Lock size={18} />}
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
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Backend authentication notice */}
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <p className="text-xs leading-5 text-emerald-800">
                <span className="font-bold">Secure authentication:</span>{" "}
                Admin access is verified through the SK Computer Education
                backend.
              </p>
            </div>

            <Link
              href="/"
              className={`${BACK_LINK} mt-6 flex justify-center text-slate-500`}
            >
              <ArrowLeft
                size={15}
                className="transition-transform duration-200 group-hover:-translate-x-1"
              />
              Back to Website
            </Link>
          </div>
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
