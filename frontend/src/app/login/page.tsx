"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Briefcase, Users, ArrowLeft } from "lucide-react";

type Role = "student" | "trainer" | "associate";

const ROLES: { key: Role; label: string; description: string; icon: typeof GraduationCap }[] = [
  { key: "student", label: "Student", description: "Access your courses and progress", icon: GraduationCap },
  { key: "trainer", label: "Trainer", description: "Manage batches and grading", icon: Briefcase },
  { key: "associate", label: "Associate", description: "Earnings, referrals and more", icon: Users },
];

const ROLE_REDIRECTS: Record<Role, string> = {
  trainer: "/dashboard/trainer",
  student: "/dashboard/student",
  associate: "/dashboard",
};

// --- DEV MODE ---------------------------------------------------------
// While the backend auth API isn't ready yet, set this to true to log in
// with hardcoded dummy accounts instead of calling /api/auth/login.
// Flip this to false (or delete this block) once real auth is wired up.
const DEV_MODE = true;

const DUMMY_USERS: Record<Role, { email: string; password: string }> = {
  student: { email: "student@skce.in", password: "student123" },
  trainer: { email: "trainer@skce.in", password: "trainer123" },
  associate: { email: "associate@skce.in", password: "associate123" },
};
// ------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setError("");
    setLoading(true);

    try {
      // --- DEV MODE: skip the real API and check against dummy accounts ---
      if (DEV_MODE) {
        const dummy = DUMMY_USERS[selectedRole];
        await new Promise((resolve) => setTimeout(resolve, 400)); // mimic network delay

        if (email.trim().toLowerCase() !== dummy.email || password !== dummy.password) {
          throw new Error(
            `Invalid email or password. Try ${dummy.email} / ${dummy.password} for ${selectedRole}.`
          );
        }

        localStorage.setItem("token", "dev-dummy-token");
        localStorage.setItem("role", selectedRole);
        router.push(ROLE_REDIRECTS[selectedRole]);
        return;
      }
      // ----------------------------------------------------------------------

      // Replace this URL with your actual auth endpoint.
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Invalid email or password");
      }

      const data = await res.json();
      // Expected shape: { token: string, user: { role: "trainer" | "student" | "associate", ... } }
      const { token, user } = data;

      // Guard against a user picking the wrong tab (e.g. a trainer clicking "Student").
      // Trust the role the backend confirms for this account, not just the UI selection.
      const confirmedRole: Role = user.role;

      localStorage.setItem("token", token);
      localStorage.setItem("role", confirmedRole);

      router.push(ROLE_REDIRECTS[confirmedRole] || "/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F4F6FA",
        fontFamily: "'Inter', sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 14,
          padding: "36px 32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#2F6BFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            S
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13.5, color: "#6B7280", marginTop: 4 }}>
            {selectedRole ? "Sign in to your account" : "Choose how you want to sign in"}
          </p>
        </div>

        {/* Step 1: role selection */}
        {!selectedRole && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ROLES.map(({ key, label, description, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedRole(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: "1px solid #E2E5EC",
                  background: "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2F6BFF")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E5EC")}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: "#EAF0FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color="#3B6BF0" />
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "#111827" }}>{label}</div>
                  <div style={{ fontSize: 12.5, color: "#6B7280" }}>{description}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: credentials form */}
        {selectedRole && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <button
              type="button"
              onClick={() => {
                setSelectedRole(null);
                setError("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                color: "#6B7280",
                fontSize: 12.5,
                cursor: "pointer",
                padding: 0,
                marginBottom: -4,
              }}
            >
              <ArrowLeft size={14} />
              Change role — signing in as {ROLES.find((r) => r.key === selectedRole)?.label}
            </button>

            {DEV_MODE && (
              <div
                style={{
                  fontSize: 12,
                  color: "#92400E",
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  padding: "8px 12px",
                  borderRadius: 8,
                }}
              >
                Dev mode — use <strong>{DUMMY_USERS[selectedRole].email}</strong> /{" "}
                <strong>{DUMMY_USERS[selectedRole].password}</strong>
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={DEV_MODE ? DUMMY_USERS[selectedRole].email : "you@example.com"}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #E2E5EC",
                  fontSize: 14,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12.5, color: "#3B6BF0", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={DEV_MODE ? DUMMY_USERS[selectedRole].password : "••••••••"}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #E2E5EC",
                  fontSize: 14,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "#DC2626", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#93A9F5" : "#2F6BFF",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "11px 0",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20 }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "#3B6BF0", fontWeight: 600, textDecoration: "none" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}