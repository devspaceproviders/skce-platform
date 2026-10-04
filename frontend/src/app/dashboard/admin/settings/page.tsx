"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Database,
  FileCheck2,
  Image as ImageIcon,
  Loader2,
  Package,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

type CertificateAssets = {
  logoUrl: string | null;
  signatureUrl: string | null;
  updatedAt?: string | null;
};

type LiveMetrics = {
  students: number;
  courses: number;
  activeCourses: number;
  packages: number;
  activePackages: number;
  trainers: number;
  activeTrainers: number;
  certificates: number;
  paidRevenue: number;
  currency: string;
};

const EMPTY_METRICS: LiveMetrics = {
  students: 0,
  courses: 0,
  activeCourses: 0,
  packages: 0,
  activePackages: 0,
  trainers: 0,
  activeTrainers: 0,
  certificates: 0,
  paidRevenue: 0,
  currency: "INR",
};

function getToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  );
}

async function apiJson(path: string, init?: RequestInit) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      window.location.href = "/admin/login";
      throw new Error("Your admin session has expired.");
    }

    throw new Error(
      result?.message ||
        result?.error ||
        `Request failed with status ${response.status}.`
    );
  }

  return result;
}

function absoluteAssetUrl(value: string | null) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("/")) {
    return `${BACKEND_URL}${value}`;
  }
  return `${BACKEND_URL}/${value}`;
}

function extractData<T>(result: any): T {
  return (result?.data ?? result) as T;
}

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminSettingsPage() {
  const [metrics, setMetrics] = useState<LiveMetrics>(EMPTY_METRICS);
  const [certificateAssets, setCertificateAssets] =
    useState<CertificateAssets>({
      logoUrl: null,
      signatureUrl: null,
      updatedAt: null,
    });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [certificateAssetsLoading, setCertificateAssetsLoading] =
    useState(true);
  const [certificateAssetUploading, setCertificateAssetUploading] =
    useState<"LOGO" | "SIGNATURE" | null>(null);
  const [certificateAssetMessage, setCertificateAssetMessage] = useState<
    string | null
  >(null);
  const [certificateAssetError, setCertificateAssetError] = useState<
    string | null
  >(null);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);

  const loadSettings = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [reportsResult, packagesResult, certificateResult] =
        await Promise.all([
          apiJson("/admin/reports?range=all"),
          apiJson("/admin/packages"),
          apiJson("/admin/certificate-assets"),
        ]);

      const reports = extractData<any>(reportsResult);
      const packages = extractData<any>(packagesResult);
      const certificate = extractData<any>(certificateResult);

      const courseRows = Array.isArray(reports?.courses?.rows)
        ? reports.courses.rows
        : [];

      const trainerRows = Array.isArray(reports?.trainers?.rows)
        ? reports.trainers.rows
        : [];

      const studentRows = Array.isArray(reports?.students?.rows)
        ? reports.students.rows
        : [];

      const packageRows = Array.isArray(packages)
        ? packages
        : Array.isArray(packages?.packages)
          ? packages.packages
          : [];

      const certificateData =
        certificate?.settings ??
        certificate?.certificateSetting ??
        certificate ??
        {};

      setMetrics({
        students:
          Number(reports?.students?.total) ||
          studentRows.length ||
          0,
        courses:
          Number(reports?.courses?.total) ||
          courseRows.length ||
          0,
        activeCourses:
          Number(reports?.courses?.active) ||
          courseRows.filter((course: any) => Boolean(course?.isActive)).length,
        packages: packageRows.length,
        activePackages: packageRows.filter(
          (item: any) => Boolean(item?.isActive)
        ).length,
        trainers:
          Number(reports?.trainers?.total) ||
          trainerRows.length ||
          0,
        activeTrainers:
          Number(reports?.trainers?.active) ||
          trainerRows.filter(
            (trainer: any) =>
              String(trainer?.status ?? "").toUpperCase() === "ACTIVE" ||
              Boolean(trainer?.isActive)
          ).length,
        certificates:
          Number(reports?.certificates?.total) ||
          (Array.isArray(reports?.certificates?.rows)
            ? reports.certificates.rows.length
            : 0),
        paidRevenue: Number(reports?.payments?.revenue) || 0,
        currency: String(
          reports?.payments?.currency ||
            reports?.currency ||
            "INR"
        ),
      });

      setCertificateAssets({
        logoUrl:
          certificateData?.logoUrl ??
          certificateData?.logo ??
          null,
        signatureUrl:
          certificateData?.signatureUrl ??
          certificateData?.signature ??
          null,
        updatedAt: certificateData?.updatedAt ?? null,
      });

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error("Load admin settings error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load live platform settings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCertificateAssetsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();

    // Keep the overview fresh without requiring a page reload.
    const interval = window.setInterval(() => {
      loadSettings(true);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [loadSettings]);

  async function uploadCertificateAsset(
    type: "LOGO" | "SIGNATURE",
    file: File
  ) {
    if (!file.type.startsWith("image/")) {
      setCertificateAssetError(
        "Please select a JPG, PNG, WEBP or other image file."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCertificateAssetError(
        "Certificate asset must not exceed 5 MB."
      );
      return;
    }

    const token = getToken();
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      setCertificateAssetUploading(type);
      setCertificateAssetMessage(null);
      setCertificateAssetError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/admin/certificate-assets/${type}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/admin/login";
          return;
        }

        throw new Error(
          result?.message ||
            result?.error ||
            `Failed to upload certificate ${type.toLowerCase()}.`
        );
      }

      const data = extractData<any>(result);

      setCertificateAssets((current) => ({
        ...current,
        logoUrl:
          type === "LOGO"
            ? data?.logoUrl ??
              data?.url ??
              data?.assetUrl ??
              current.logoUrl
            : current.logoUrl,
        signatureUrl:
          type === "SIGNATURE"
            ? data?.signatureUrl ??
              data?.url ??
              data?.assetUrl ??
              current.signatureUrl
            : current.signatureUrl,
        updatedAt: new Date().toISOString(),
      }));

      setCertificateAssetMessage(
        type === "LOGO"
          ? "Certificate logo uploaded successfully."
          : "Certificate signature uploaded successfully."
      );

      // Re-read the database-backed value so the UI always reflects
      // what the backend actually persisted.
      await loadSettings(true);
    } catch (err) {
      console.error("Certificate asset upload error:", err);
      setCertificateAssetError(
        err instanceof Error
          ? err.message
          : "Certificate asset upload failed."
      );
    } finally {
      setCertificateAssetUploading(null);
    }
  }

  function handleCertificateAssetChange(
    type: "LOGO" | "SIGNATURE",
    file: File | null
  ) {
    if (!file) return;
    uploadCertificateAsset(type, file);
  }

  const liveStatus = useMemo(
    () => (error ? "Degraded" : loading ? "Loading" : "Operational"),
    [error, loading]
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500">
              <SettingsIcon size={15} />
              Platform Configuration
            </div>

            <h1 className="text-2xl font-bold text-[#173B67] sm:text-3xl">
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Live platform configuration and operational status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                liveStatus === "Operational"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : liveStatus === "Loading"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {liveStatus}
            </span>

            <button
              type="button"
              onClick={() => loadSettings(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Live settings could not be refreshed.</p>
              <p className="mt-0.5 text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#173B67] shadow-sm">
              <Database size={19} />
            </div>

            <div>
              <h2 className="font-bold text-[#173B67]">
                Live configuration overview
              </h2>
              <p className="mt-1 text-sm leading-6 text-blue-900/70">
                The operational values below are loaded from the current
                backend data. The page automatically refreshes every 30
                seconds and can also be refreshed manually.
              </p>

              {lastUpdated && (
                <p className="mt-2 text-xs font-medium text-blue-900/55">
                  Last checked: {formatDateTime(lastUpdated)}
                </p>
              )}
            </div>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon={<BarChart3 size={19} />}
            title="Platform Overview"
            description="Current platform identity and live database activity."
          />

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Institute Name"
              value="SK Computer Education"
            />
            <InfoCard
              label="Platform"
              value="SKCE Learning Platform"
            />
            <InfoCard
              label="Currency"
              value="Indian Rupee (INR)"
            />
            <InfoCard
              label="Platform Status"
              value={liveStatus}
              live
            />
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon={<Database size={19} />}
            title="Live Platform Data"
            description="Current records read directly from the backend."
          />

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <MetricCard
              icon={<Users size={18} />}
              label="Students"
              value={metrics.students}
              loading={loading}
            />

            <MetricCard
              icon={<BookOpen size={18} />}
              label="Courses"
              value={metrics.courses}
              detail={`${metrics.activeCourses} active`}
              loading={loading}
            />

            <MetricCard
              icon={<Package size={18} />}
              label="Packages"
              value={metrics.packages}
              detail={`${metrics.activePackages} active`}
              loading={loading}
            />

            <MetricCard
              icon={<Users size={18} />}
              label="Trainers"
              value={metrics.trainers}
              detail={`${metrics.activeTrainers} active`}
              loading={loading}
            />

            <MetricCard
              icon={<Award size={18} />}
              label="Certificates"
              value={metrics.certificates}
              detail="Issued records"
              loading={loading}
            />
          </div>

          <div className="mx-5 mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Verified revenue in database
              </p>
              <p className="mt-1 text-xl font-bold text-[#173B67]">
                {formatCurrency(metrics.paidRevenue, metrics.currency)}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <CircleDollarSign size={16} />
              Based on successful payment records
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon={<FileCheck2 size={19} />}
            title="Learning & Completion Policies"
            description="Only platform behavior that is currently implemented is shown here."
          />

          <div className="grid gap-4 p-5 lg:grid-cols-3">
            <PolicyCard
              title="Course Completion"
              value="Lesson progress based"
              description="Completion is calculated from the student's recorded lesson progress."
            />

            <PolicyCard
              title="Assessments"
              value="Course assessment based"
              description="Assignments and quizzes are handled through the assessment system."
            />

            <PolicyCard
              title="Certificates"
              value="Automatic on completion"
              description="Eligible students receive certificates through the existing certificate workflow."
            />
          </div>

          <div className="mx-5 mb-5 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
            <p className="text-xs font-semibold text-amber-800">
              Configuration note
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-700/80">
              Attendance percentages and other editable thresholds are not
              displayed as configurable settings because the current platform
              does not store those values in a dedicated settings record.
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon={<Award size={19} />}
            title="Certificate Configuration"
            description="Certificate generation is part of the existing platform workflow."
          />

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Certificate Generation"
              value="Automatic"
            />
            <InfoCard
              label="Certificate ID"
              value="Automatically generated"
            />
            <InfoCard
              label="Storage"
              value="Digital"
            />
            <InfoCard
              label="Verification"
              value="Certificate ID based"
            />
          </div>

          <div className="border-t border-slate-100 p-5">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#173B67]">
                Certificate Branding
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                These assets are stored through the backend certificate
                settings and are used by generated certificates.
              </p>
            </div>

            {certificateAssetError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {certificateAssetError}
              </div>
            )}

            {certificateAssetMessage && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {certificateAssetMessage}
              </div>
            )}

            {certificateAssetsLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                <Loader2 size={17} className="animate-spin" />
                Loading certificate branding...
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <CertificateAssetCard
                  title="Certificate Logo"
                  description="Logo displayed on generated certificates."
                  url={certificateAssets.logoUrl}
                  onUpload={() => logoInputRef.current?.click()}
                  uploading={certificateAssetUploading === "LOGO"}
                />

                <CertificateAssetCard
                  title="Certificate Signature"
                  description="Signature displayed on generated certificates."
                  url={certificateAssets.signatureUrl}
                  onUpload={() => signatureInputRef.current?.click()}
                  uploading={certificateAssetUploading === "SIGNATURE"}
                />
              </div>
            )}

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleCertificateAssetChange(
                  "LOGO",
                  event.target.files?.[0] ?? null
                );
                event.currentTarget.value = "";
              }}
            />

            <input
              ref={signatureInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleCertificateAssetChange(
                  "SIGNATURE",
                  event.target.files?.[0] ?? null
                );
                event.currentTarget.value = "";
              }}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon={<Clock3 size={19} />}
            title="System Information"
            description="Current application behavior and data source."
          />

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Data Source"
              value="PostgreSQL via backend API"
            />
            <InfoCard
              label="Live Refresh"
              value="Every 30 seconds"
            />
            <InfoCard
              label="Manual Refresh"
              value="Available"
            />
            <InfoCard
              label="Admin Access"
              value="Authenticated"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#173B67]">
        {icon}
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  live = false,
}: {
  label: string;
  value: string;
  live?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {live && (
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        )}

        <p className="break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail?: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          {loading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-[#173B67]">
              {value.toLocaleString("en-IN")}
            </p>
          )}

          {detail && (
            <p className="mt-1 text-xs text-slate-400">{detail}</p>
          )}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>
      </div>
    </div>
  );
}

function PolicyCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-base font-bold text-[#173B67]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function CertificateAssetCard({
  title,
  description,
  url,
  onUpload,
  uploading,
}: {
  title: string;
  description: string;
  url: string | null;
  onUpload: () => void;
  uploading: boolean;
}) {
  const imageUrl = absoluteAssetUrl(url);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
        <div>
          <h4 className="font-semibold text-slate-800">{title}</h4>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <ImageIcon size={18} className="text-slate-400" />
      </div>

      <div className="flex min-h-[170px] items-center justify-center bg-slate-50 p-5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="max-h-36 max-w-full object-contain"
          />
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm">
              <ImageIcon size={22} />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-500">
              No asset configured
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4">
        <p className="text-xs text-slate-400">
          JPG, PNG or other image · max 5 MB
        </p>

        <button
          type="button"
          onClick={onUpload}
          disabled={uploading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#173B67] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#123257] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ImageIcon size={14} />
          )}
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
