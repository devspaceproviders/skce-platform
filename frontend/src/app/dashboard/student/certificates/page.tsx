"use client";

import {
  Award,
  Download,
  Loader2,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

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

export default function CertificatesPage() {
  const router = useRouter();

  const [certificates, setCertificates] =
    useState<Certificate[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/certificates`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        router.push("/login");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Failed to load certificates."
        );
      }

      setCertificates(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (err) {
      console.error(
        "Load certificates error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load certificates."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateValue: string) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getCertificateUrl(
    certificateUrl: string
  ) {
    if (
      certificateUrl.startsWith("http://") ||
      certificateUrl.startsWith("https://")
    ) {
      return certificateUrl;
    }

    const backendUrl =
      API_URL.replace(/\/api\/?$/, "");

    return `${backendUrl}${
      certificateUrl.startsWith("/")
        ? ""
        : "/"
    }${certificateUrl}`;
  }

  function handleDownload(
    certificate: Certificate
  ) {
    if (!certificate.certificateUrl) {
      return;
    }

    const url = getCertificateUrl(
      certificate.certificateUrl
    );

    window.open(url, "_blank");
  }

  return (
    <main
      style={{
        padding: "28px 32px",
        flex: 1,
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#111827",
          margin: "0 0 4px",
        }}
      >
        Certificates
      </h1>

      <p
        style={{
          color: "#6B7280",
          fontSize: 14,
          margin: "0 0 24px",
        }}
      >
        Certificates you've earned and ones still
        in progress.
      </p>

      {loading && (
        <div
          style={{
            minHeight: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6B7280",
            fontSize: 14,
            gap: 8,
          }}
        >
          <Loader2
            size={18}
            style={{
              animation: "spin 1s linear infinite",
            }}
          />
          Loading certificates...
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            borderRadius: 10,
            padding: "14px 16px",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        certificates.length === 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "40px 24px",
              textAlign: "center",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "#F1EAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <Lock
                size={22}
                color="#8A3FEB"
              />
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              No certificates yet
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#6B7280",
              }}
            >
              Complete your enrolled courses to
              earn certificates.
            </div>
          </div>
        )}

      {!loading &&
        !error &&
        certificates.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 16,
            }}
          >
            {certificates.map(
              (certificate) => (
                <div
                  key={certificate.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding:
                      "20px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    boxShadow:
                      "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 14,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background:
                          "#F1EAFE",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        flexShrink: 0,
                      }}
                    >
                      <Award
                        size={20}
                        color="#8A3FEB"
                      />
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14.5,
                          fontWeight: 600,
                          color: "#111827",
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {certificate.title}
                      </div>

                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#6B7280",
                          marginTop: 2,
                        }}
                      >
                        Earned{" "}
                        {formatDate(
                          certificate.issuedAt
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#9CA3AF",
                          marginTop: 2,
                        }}
                      >
                        {
                          certificate.certificateNumber
                        }
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        certificate
                      )
                    }
                    disabled={
                      !certificate.certificateUrl
                    }
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 6,
                      border:
                        "1px solid #E2E5EC",
                      background: "#fff",
                      borderRadius: 7,
                      padding:
                        "6px 12px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color:
                        certificate.certificateUrl
                          ? "#374151"
                          : "#9CA3AF",
                      cursor:
                        certificate.certificateUrl
                          ? "pointer"
                          : "not-allowed",
                      flexShrink: 0,
                    }}
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              )
            )}
          </div>
        )}
    </main>
  );
}