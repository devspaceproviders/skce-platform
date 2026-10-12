
"use client";

import {
  AlertCircle,
  Award,
  ArrowRight,
  Download,
  Lock,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SkStyles, reveal } from "@/components/student/skce-ui";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

type Certificate = {
  id: number;
  certificateNumber: string;
  certificateType: string;
  courseId: number | null;
  packageId: number | null;
  title: string;
  issuedAt: string;
  certificateUrl: string | null;
};

function normalizeCertificates(value: unknown): Certificate[] {
  if (Array.isArray(value)) return value as Certificate[];

  if (value && typeof value === "object") {
    const result = value as {
      data?: unknown;
      items?: unknown;
      certificates?: unknown;
    };

    if (Array.isArray(result.data)) {
      return result.data as Certificate[];
    }
    if (Array.isArray(result.items)) {
      return result.items as Certificate[];
    }
    if (Array.isArray(result.certificates)) {
      return result.certificates as Certificate[];
    }
  }

  return [];
}

export default function CertificatesPage() {
  const router = useRouter();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_URL}/certificates`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        router.replace("/login");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to load certificates."
        );
      }

      setCertificates(normalizeCertificates(result));
    } catch (err) {
      console.error("Load certificates error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load certificates."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  function refreshCertificates() {
    setRefreshing(true);
    void loadCertificates();
  }

  function formatDate(value: string) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getCertificateUrl(value: string) {
    const path = value.trim();

    if (!path) return null;

    if (/^https?:\/\//i.test(path)) return path;

    const backendOrigin = API_URL.replace(/\/api\/?$/i, "");

    if (path.startsWith("//")) {
      return `${window.location.protocol}${path}`;
    }

    if (path.startsWith("/")) {
      return `${backendOrigin}${path}`;
    }

    return `${backendOrigin}/${path}`;
  }

  function downloadCertificate(certificate: Certificate) {
    if (!certificate.certificateUrl) return;

    const url = getCertificateUrl(certificate.certificateUrl);

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  const courseCount = certificates.filter(
    (item) => item.certificateType === "COURSE"
  ).length;

  const packageCount = certificates.filter(
    (item) => item.certificateType === "PACKAGE"
  ).length;

  return (
    <>
      <main className="sk-page ct-page">
        <div className="sk-container ct-container">
          {/* Gradient hero — consistent with Calendar and Assignments */}
          <header className="ct-hero sk-reveal">
            <div className="ct-hero-decoration" aria-hidden="true">
              <span className="ct-orbit ct-orbit-one" />
              <span className="ct-orbit ct-orbit-two" />
              <span className="ct-orbit ct-orbit-three" />
            </div>

            <div className="ct-hero-content">
              <div className="ct-hero-icon">
                <Award size={29} strokeWidth={1.8} />
              </div>

              <div className="ct-hero-copy">
                <div className="ct-kicker">STUDENT ACHIEVEMENTS</div>
                <h1>Certificates</h1>
                <p>
                  Celebrate your achievements and explore the
                  certificates you have earned through learning.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={refreshCertificates}
              disabled={loading || refreshing}
              className="ct-refresh"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "ct-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          {/* Summary tiles */}
          {!loading && !error && certificates.length > 0 && (
            <section className="ct-stats" aria-label="Certificate summary">
              <StatTile
                index={1}
                icon={<Award size={20} />}
                label="Total Certificates"
                value={certificates.length}
                helper="Your achievements"
                tone="blue"
              />
              <StatTile
                index={2}
                icon={<Award size={20} />}
                label="Course Certificates"
                value={courseCount}
                helper="Completed courses"
                tone="orange"
              />
              <StatTile
                index={3}
                icon={<Award size={20} />}
                label="Package Certificates"
                value={packageCount}
                helper="Completed packages"
                tone="green"
              />
            </section>
          )}

          {/* Loading skeletons */}
          {loading && (
            <section className="ct-stats" aria-busy="true">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="sk-skel"
                  style={{ height: 112 }}
                />
              ))}
              <div className="ct-grid ct-skeleton-grid">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="sk-skel"
                    style={{ height: 90 }}
                  />
                ))}
              </div>
              <span className="sk-sr">Loading certificates</span>
            </section>
          )}

          {/* Error state */}
          {!loading && error && (
            <section className="ct-state sk-reveal" role="alert">
              <div className="ct-state-icon ct-error-icon">
                <AlertCircle size={27} />
              </div>
              <h2>Unable to load certificates</h2>
              <p>{error}</p>
              <button
                type="button"
                onClick={refreshCertificates}
                disabled={refreshing}
                className="sk-btn sk-btn-primary"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "ct-spin" : ""}
                />
                Try Again
              </button>
            </section>
          )}

          {/* Empty state */}
          {!loading && !error && certificates.length === 0 && (
            <section className="ct-state sk-reveal" style={reveal(1)}>
              <div className="ct-state-icon">
                <Lock size={27} />
              </div>
              <h2>Your achievements start here</h2>
              <p>
                Complete your enrolled courses to earn certificates.
                Your achievements will appear here when available.
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/student/my-courses")
                }
                className="sk-btn sk-btn-primary"
              >
                View My Courses
                <ArrowRight size={15} />
              </button>
            </section>
          )}

          {/* Certificate cards */}
          {!loading && !error && certificates.length > 0 && (
            <section className="ct-list-section">
              <div className="ct-section-heading sk-reveal" style={reveal(2)}>
                <div>
                  <h2>Your Achievements</h2>
                  <p>
                    Your earned certificates, ready to view.
                  </p>
                </div>

                <span className="ct-count">
                  {certificates.length}{" "}
                  {certificates.length === 1
                    ? "certificate"
                    : "certificates"}
                </span>
              </div>

              <div className="ct-grid">
                {certificates.map((certificate, index) => {
                  const hasDownload = Boolean(
                    certificate.certificateUrl?.trim()
                  );

                  const isPackage =
                    certificate.certificateType === "PACKAGE";

                  return (
                    <article
                      key={certificate.id}
                      className="ct-card sk-reveal"
                      style={reveal(Math.min(index, 8) + 3)}
                    >
                      <div className="ct-card-main">
                        <div className="ct-badge">
                          <Award size={23} strokeWidth={1.9} />
                        </div>

                        <div className="ct-card-content">
                          <div className="ct-earned-label">
                            <span className="ct-earned-dot" />
                            CERTIFICATE EARNED
                          </div>

                          <h3 title={certificate.title}>
                            {certificate.title || "Certificate"}
                          </h3>

                          <p className="ct-date">
                            Earned {formatDate(certificate.issuedAt)}
                          </p>

                          <div className="ct-card-meta">
                            <span
                              className={`ct-type ${
                                isPackage
                                  ? "ct-type-package"
                                  : "ct-type-course"
                              }`}
                            >
                              {isPackage
                                ? "Package certificate"
                                : "Course certificate"}
                            </span>

                            {certificate.certificateNumber && (
                              <code title={certificate.certificateNumber}>
                                {certificate.certificateNumber}
                              </code>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ct-card-actions">
                        <button
                          type="button"
                          onClick={() =>
                            downloadCertificate(certificate)
                          }
                          disabled={!hasDownload}
                          title={
                            hasDownload
                              ? "Open certificate"
                              : "Certificate file is not available"
                          }
                          className="ct-download"
                        >
                          <Download size={15} />
                          Download
                          <ArrowRight
                            size={14}
                            className="ct-download-arrow"
                          />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <SkStyles />

      <style
        dangerouslySetInnerHTML={{
          __html: `
/* =========================================================
   SKCE Certificates — shared student portal visual language
   ========================================================= */

.ct-page {
  min-height: 100vh;
}

.ct-container {
  width: 100%;
  max-width: 1700px;
  margin-inline: auto;
  padding: 26px 30px 42px;
  box-sizing: border-box;
}

/* Gradient hero */

.ct-hero {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 168px;
  overflow: hidden;
  margin-bottom: 24px;
  padding: 30px 34px;
  border: 1px solid rgba(255,255,255,.14);
  border-bottom: 3px solid #FF7900;
  border-radius: 27px;
  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(69,133,204,.4),
      transparent 42%
    ),
    linear-gradient(
      112deg,
      #252330 0%,
      #142F57 35%,
      #16477F 72%,
      #2863A1 100%
    );
  box-shadow: 0 16px 32px rgba(15,47,95,.14);
}

.ct-hero::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  content: "";
  pointer-events: none;
  opacity: .18;
  background-image: radial-gradient(
    rgba(255,255,255,.65) .7px,
    transparent .7px
  );
  background-size: 17px 17px;
  mask-image: linear-gradient(90deg, transparent, #000 40%, #000);
}

.ct-hero-decoration {
  position: absolute;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.ct-orbit {
  position: absolute;
  display: block;
  aspect-ratio: 1;
  border: 1px solid rgba(255,255,255,.075);
  border-radius: 50%;
  transition: transform .8s cubic-bezier(.2,.7,.2,1);
}

.ct-orbit-one {
  width: 390px;
  right: -100px;
  top: -245px;
  box-shadow:
    0 0 0 20px rgba(255,255,255,.025),
    0 0 0 40px rgba(255,255,255,.02);
}

.ct-orbit-two {
  width: 310px;
  right: -55px;
  top: -205px;
  border-width: 22px;
  border-color: rgba(255,255,255,.035);
}

.ct-orbit-three {
  width: 240px;
  right: -20px;
  top: -170px;
  border-width: 1px;
  border-color: rgba(255,255,255,.09);
}

.ct-hero:hover .ct-orbit-one {
  transform: translate(-8px, 8px);
}

.ct-hero:hover .ct-orbit-two {
  transform: translate(-5px, 5px);
}

.ct-hero-content {
  display: flex;
  align-items: center;
  gap: 19px;
  min-width: 0;
}

.ct-hero-icon {
  display: grid;
  place-items: center;
  flex: 0 0 70px;
  width: 70px;
  height: 70px;
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 20px;
  color: #fff;
  background: rgba(255,255,255,.13);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
  backdrop-filter: blur(8px);
  transition: transform .35s cubic-bezier(.2,.7,.2,1);
}

.ct-hero:hover .ct-hero-icon {
  transform: translateY(-2px) rotate(-4deg);
}

.ct-hero-copy {
  min-width: 0;
}

.ct-kicker {
  margin-bottom: 8px;
  color: #FF9A42;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 2px;
}

.ct-hero h1 {
  margin: 0;
  color: #fff;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -.9px;
  line-height: 1.2;
}

.ct-hero p {
  max-width: 650px;
  margin: 9px 0 0;
  color: #D1DDEE;
  font-size: 15px;
  line-height: 1.65;
}

.ct-refresh {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  flex: 0 0 auto;
  min-width: 140px;
  min-height: 48px;
  padding: 12px 18px;
  border: 1px solid rgba(255,255,255,.27);
  border-radius: 13px;
  color: #fff;
  background: rgba(255,255,255,.11);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition:
    background .25s ease,
    border-color .25s ease,
    transform .25s ease;
}

.ct-refresh:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,.48);
  background: rgba(255,255,255,.2);
}

.ct-refresh:disabled {
  opacity: .65;
  cursor: wait;
}

.ct-spin {
  animation: ct-rotate .8s linear infinite;
}

/* Summary tiles */

.ct-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 27px;
}

.ct-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  min-height: 106px;
  padding: 19px 20px;
  border: 1px solid #DDE6F2;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 3px 8px rgba(15,47,95,.035);
  animation: ct-rise .5s cubic-bezier(.2,.7,.2,1) both;
  transition:
    transform .28s cubic-bezier(.2,.7,.2,1),
    border-color .28s ease,
    box-shadow .28s ease;
}

.ct-stat:hover {
  transform: translateY(-4px);
  border-color: #B8CDEB;
  box-shadow: 0 13px 26px rgba(15,47,95,.09);
}

.ct-stat-icon {
  display: grid;
  place-items: center;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  border-radius: 15px;
  transition: transform .3s ease;
}

.ct-stat:hover .ct-stat-icon {
  transform: scale(1.06);
}

.ct-stat-icon.tone-blue {
  color: #1459B8;
  background: #EAF1FF;
}

.ct-stat-icon.tone-orange {
  color: #FF6B00;
  background: #FFF1E7;
}

.ct-stat-icon.tone-green {
  color: #078849;
  background: #E7F7EE;
}

.ct-stat-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ct-stat-label {
  color: #71819A;
  font-size: 13px;
  font-weight: 500;
}

.ct-stat-value {
  margin-top: 3px;
  color: #15345D;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.ct-stat-helper {
  margin-top: 4px;
  color: #8A9AB2;
  font-size: 12px;
}

/* Section heading */

.ct-list-section {
  min-width: 0;
}

.ct-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 15px;
}

.ct-section-heading h2 {
  margin: 0;
  color: #15345D;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -.3px;
}

.ct-section-heading p {
  margin: 5px 0 0;
  color: #71819A;
  font-size: 13px;
  line-height: 1.5;
}

.ct-count {
  flex: 0 0 auto;
  padding: 7px 12px;
  border: 1px solid #D9E5F7;
  border-radius: 999px;
  color: #1459B8;
  background: #EDF4FF;
  font-size: 12px;
  font-weight: 700;
}

/* Certificate cards */

.ct-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.ct-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
  padding: 17px 18px;
  overflow: hidden;
  border: 1px solid #DEE7F3;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 2px 5px rgba(15,47,95,.025);
  transition:
    transform .3s cubic-bezier(.2,.7,.2,1),
    box-shadow .3s ease,
    border-color .3s ease;
}

.ct-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  content: "";
  background: linear-gradient(180deg, #FF9B45, #FF6B00);
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform .3s ease;
}

.ct-card:hover,
.ct-card:focus-within {
  transform: translateY(-3px);
  border-color: #B8CDEB;
  box-shadow: 0 13px 25px rgba(15,47,95,.085);
}

.ct-card:hover::before,
.ct-card:focus-within::before {
  transform: scaleY(1);
}

.ct-card-main {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.ct-badge {
  display: grid;
  place-items: center;
  flex: 0 0 49px;
  width: 49px;
  height: 49px;
  border: 1px solid rgba(255,107,0,.06);
  border-radius: 15px;
  color: #FF6B00;
  background: linear-gradient(135deg, #FFF3E9 0%, #FFE2CC 100%);
  transition:
    transform .35s cubic-bezier(.2,.7,.2,1),
    box-shadow .35s ease;
}

.ct-card:hover .ct-badge {
  transform: rotate(-7deg) scale(1.06);
  box-shadow: 0 5px 12px rgba(255,107,0,.12);
}

.ct-card-content {
  min-width: 0;
  flex: 1;
}

.ct-earned-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
  color: #8798B0;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

.ct-earned-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16A05D;
  box-shadow: 0 0 0 3px rgba(22,160,93,.1);
}

.ct-card h3 {
  margin: 0;
  overflow: hidden;
  color: #15345D;
  font-size: 16px;
  font-weight: 750;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ct-date {
  margin: 4px 0 0;
  color: #7889A3;
  font-size: 12px;
  line-height: 1.5;
}

.ct-card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 9px;
}

.ct-type {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 700;
}

.ct-type-course {
  color: #1459B8;
  background: #EAF1FF;
}

.ct-type-package {
  color: #9A4A00;
  background: #FFF0E1;
}

.ct-card-meta code {
  max-width: 180px;
  overflow: hidden;
  padding: 4px 7px;
  border: 1px solid #E6EBF3;
  border-radius: 7px;
  color: #71819A;
  background: #F5F7FB;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ct-card-actions {
  flex: 0 0 auto;
}

.ct-download {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 41px;
  padding: 10px 13px;
  border: 1px solid #DCE6F5;
  border-radius: 11px;
  color: #1459B8;
  background: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color .25s ease,
    background .25s ease,
    border-color .25s ease,
    transform .25s ease,
    box-shadow .25s ease;
}

.ct-download:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #1459B8;
  color: #fff;
  background: #1459B8;
  box-shadow: 0 5px 13px rgba(20,89,184,.19);
}

.ct-download:active:not(:disabled) {
  transform: translateY(0);
}

.ct-download:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.ct-download-arrow {
  transition: transform .25s ease;
}

.ct-download:hover .ct-download-arrow {
  transform: translateX(3px);
}

/* Empty and error states */

.ct-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 310px;
  padding: 36px 24px;
  border: 1px solid #DEE7F3;
  border-radius: 21px;
  background:
    radial-gradient(circle at 50% 0%, #EDF4FF 0%, transparent 56%),
    #fff;
  text-align: center;
  box-shadow: 0 6px 18px rgba(15,47,95,.035);
}

.ct-state-icon {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  margin-bottom: 17px;
  border-radius: 19px;
  color: #1459B8;
  background: #EAF1FF;
}

.ct-error-icon {
  color: #D92D20;
  background: #FFF0EF;
}

.ct-state h2 {
  margin: 0;
  color: #15345D;
  font-size: 21px;
  font-weight: 800;
}

.ct-state p {
  max-width: 440px;
  margin: 9px 0 19px;
  color: #71819A;
  font-size: 13px;
  line-height: 1.7;
}

.ct-skeleton-grid {
  grid-column: 1 / -1;
  margin-top: 3px;
}

/* Motion */

@keyframes ct-rotate {
  to { transform: rotate(360deg); }
}

@keyframes ct-rise {
  from {
    opacity: 0;
    transform: translateY(9px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1100px) {
  .ct-container {
    padding-inline: 22px;
  }

  .ct-hero {
    padding: 27px;
  }

  .ct-card {
    padding: 15px;
  }

  .ct-card-main {
    gap: 11px;
  }

  .ct-badge {
    flex-basis: 44px;
    width: 44px;
    height: 44px;
  }

  .ct-download {
    gap: 6px;
    padding-inline: 10px;
  }
}

@media (max-width: 760px) {
  .ct-container {
    padding: 19px 16px 32px;
  }

  .ct-hero {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
    min-height: 0;
    padding: 24px;
    border-radius: 21px;
  }

  .ct-hero-content {
    gap: 14px;
  }

  .ct-hero-icon {
    flex-basis: 54px;
    width: 54px;
    height: 54px;
    border-radius: 15px;
  }

  .ct-hero h1 {
    font-size: 28px;
  }

  .ct-hero p {
    font-size: 13px;
  }

  .ct-refresh {
    min-height: 42px;
  }

  .ct-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
    margin-bottom: 23px;
  }

  .ct-stat {
    min-height: 94px;
    padding: 14px;
  }

  .ct-stat-icon {
    flex-basis: 41px;
    width: 41px;
    height: 41px;
  }

  .ct-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 11px;
  }
}

@media (max-width: 480px) {
  .ct-container {
    padding-inline: 12px;
  }

  .ct-hero {
    padding: 20px 17px;
  }

  .ct-hero-content {
    align-items: flex-start;
  }

  .ct-hero-icon {
    flex-basis: 45px;
    width: 45px;
    height: 45px;
  }

  .ct-kicker {
    font-size: 10px;
    letter-spacing: 1.4px;
  }

  .ct-hero h1 {
    font-size: 25px;
  }

  .ct-hero p {
    font-size: 12px;
  }

  .ct-stats {
    grid-template-columns: minmax(0, 1fr);
    gap: 9px;
  }

  .ct-stat {
    min-height: 78px;
  }

  .ct-stat-value {
    font-size: 23px;
  }

  .ct-section-heading h2 {
    font-size: 18px;
  }

  .ct-section-heading p {
    font-size: 12px;
  }

  .ct-card {
    flex-wrap: wrap;
    gap: 12px;
    padding: 14px;
  }

  .ct-card-main {
    flex-basis: 100%;
  }

  .ct-card h3 {
    font-size: 14px;
  }

  .ct-card-actions,
  .ct-download {
    width: 100%;
  }

  .ct-state {
    min-height: 260px;
    padding: 28px 17px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ct-hero *,
  .ct-card,
  .ct-badge,
  .ct-stat,
  .ct-stat-icon,
  .ct-download,
  .ct-download-arrow,
  .ct-refresh,
  .ct-orbit {
    animation: none !important;
    transition: none !important;
  }

  .ct-spin {
    animation: ct-rotate 2s linear infinite !important;
  }
}
`,
        }}
      />
    </>
  );
}

function StatTile({
  index,
  icon,
  label,
  value,
  helper,
  tone,
}: {
  index: number;
  icon: React.ReactNode;
  label: string;
  value: number;
  helper: string;
  tone: "blue" | "orange" | "green";
}) {
  return (
    <article
      className="ct-stat"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      <div className={`ct-stat-icon tone-${tone}`}>{icon}</div>
      <div className="ct-stat-copy">
        <span className="ct-stat-label">{label}</span>
        <strong className="ct-stat-value">{value}</strong>
        <span className="ct-stat-helper">{helper}</span>
      </div>
    </article>
  );
}
