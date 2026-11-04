
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Mail,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type UserRole = "ADMIN" | "STUDENT" | "TRAINER";

type VerifyResponse = {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      phone: string | null;
      role: UserRole;
    };
    student: {
      id: number;
      studentId: string;
      state: string | null;
      referralId: string | null;
    } | null;
  };
};

export default function VerifyOtpPage() {
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [returnPath, setReturnPath] = useState("/login");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  // Load the OTP challenge created during login.
  useEffect(() => {
    const challenge = sessionStorage.getItem(
      "loginChallengeToken"
    );

    const email = sessionStorage.getItem(
      "loginMaskedEmail"
    );

    const savedReturnPath = sessionStorage.getItem(
      "loginReturnPath"
    );

    if (!challenge) {
      router.replace("/login");
      return;
    }

    setChallengeToken(challenge);
    setMaskedEmail(email || "your registered email address");
    setReturnPath(savedReturnPath || "/login");
    setReady(true);
  }, [router]);

  async function handleVerify(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit verification code.");
      return;
    }

    if (!challengeToken) {
      setError(
        "Your verification session has expired. Please sign in again."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/login/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            challengeToken,
            otp,
          }),
        }
      );

      const json: VerifyResponse = await response.json();

      if (!response.ok || !json.success || !json.data) {
        throw new Error(
          json.message || "OTP verification failed."
        );
      }

      const { token, user, student } = json.data;

      if (!token || !user) {
        throw new Error(
          "Invalid authentication response from server."
        );
      }

      const role =
        user.role === "ADMIN"
          ? "admin"
          : user.role === "STUDENT"
            ? "student"
            : user.role === "TRAINER"
              ? "trainer"
              : null;

      if (!role) {
        throw new Error(
          "This account role cannot access the portal."
        );
      }

      // Save authentication only after OTP verification.
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(user));

      // Admin authentication marker.
      if (role === "admin") {
        localStorage.setItem(
          "skce_admin_logged_in",
          "true"
        );
      } else {
        localStorage.removeItem(
          "skce_admin_logged_in"
        );
      }

      // Save student-specific information.
      if (role === "student" && student) {
        localStorage.setItem(
          "student",
          JSON.stringify(student)
        );

        localStorage.setItem(
          "studentId",
          student.studentId
        );
      } else {
        localStorage.removeItem("student");
        localStorage.removeItem("studentId");
      }

      // Clear the temporary OTP challenge.
      sessionStorage.removeItem("loginChallengeToken");
      sessionStorage.removeItem("loginMaskedEmail");
      sessionStorage.removeItem("loginReturnPath");

      // Redirect based on authenticated role.
      if (role === "admin") {
        router.replace("/dashboard/admin");
      } else if (role === "student") {
        router.replace("/dashboard/student");
      } else {
        router.replace("/dashboard/trainer");
      }

    } catch (err) {
      console.error("OTP verification error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify the code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Return to the correct login page.
  function handleBackToLogin() {
    const destination =
      returnPath.startsWith("/") &&
      !returnPath.startsWith("//")
        ? returnPath
        : "/login";

    sessionStorage.removeItem("loginChallengeToken");
    sessionStorage.removeItem("loginMaskedEmail");
    sessionStorage.removeItem("loginReturnPath");

    router.replace(destination);
  }

  if (!ready) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <Loader2
          className="animate-spin text-orange-500"
          size={32}
        />
      </main>
    );
  }

  const buttonClass =
    "flex w-full items-center justify-center gap-2 rounded-xl bg-[#F56612] px-4 py-3.5 font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-[#E85D0A] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main className="flex min-h-[78vh] items-center justify-center bg-slate-950 px-4 py-12">

      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0B2A52] to-[#173B67] px-6 py-8 text-center text-white">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-900/30">
            <ShieldCheck size={32} />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
            Secure Authentication
          </p>

          <h1 className="mt-2 text-2xl font-extrabold">
            Verify Your Email
          </h1>

          <p className="mt-3 text-sm leading-6 text-blue-100">
            Enter the six-digit verification code sent to your registered email address.
          </p>

          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold">
            <Mail size={17} />
            <span>{maskedEmail}</span>
          </div>

        </div>

        {/* OTP Form */}
        <form
          onSubmit={handleVerify}
          className="space-y-5 p-6 sm:p-8"
        >

          <div>
            <label
              htmlFor="login-otp"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Verification Code
            </label>

            <input
              id="login-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                );
                setError("");
              }}
              placeholder="Enter 6-digit code"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className={buttonClass}
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Verify & Sign In
              </>
            )}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleBackToLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </button>

          <p className="text-center text-xs leading-5 text-slate-400">
            Your verification code expires in 5 minutes.
            Never share your code with anyone.
          </p>

        </form>

      </section>

    </main>
  );
}
