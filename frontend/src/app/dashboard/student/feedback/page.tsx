"use client";
import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  MessageSquareHeart,
  Send,
  Star,
} from "lucide-react";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";
interface EligiblePackage {
  id: number;
  title: string;
  slug: string;
  imageUrl?: string | null;
}
interface StudentFeedback {
  id: number;
  packageId: number;
  package: string;
  rating: number;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}
interface FeedbackResponse {
  success: boolean;
  data?: {
    packages: EligiblePackage[];
    feedback: StudentFeedback[];
  };
  message?: string;
}
export default function StudentFeedbackPage() {
  const [packages, setPackages] = useState<EligiblePackage[]>([]);
  const [feedback, setFeedback] = useState<StudentFeedback[]>([]);
  const [packageId, setPackageId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function loadFeedback() {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Your session has expired. Please login again.");
        return;
      }
      const response = await fetch(
        `${API_URL}/students/me/feedback`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );
      const result: FeedbackResponse =
        await response.json();
      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to load your feedback."
        );
      }
      setPackages(result.data.packages || []);
      setFeedback(result.data.feedback || []);
      if (
        result.data.packages.length > 0 &&
        !packageId
      ) {
        setPackageId(
          String(result.data.packages[0].id)
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your feedback."
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadFeedback();
  }, []);
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!packageId) {
      setError("Please select a package.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5.");
      return;
    }
    const trimmedComment = comment.trim();
    if (trimmedComment.length < 5) {
      setError(
        "Please enter at least 5 characters in your feedback."
      );
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }
      const response = await fetch(
        `${API_URL}/students/me/feedback`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            packageId: Number(packageId),
            rating,
            comment: trimmedComment,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to submit your feedback."
        );
      }
      setSuccess(
        "Thank you! Your feedback has been submitted for review."
      );
      setRating(0);
      setComment("");
      await loadFeedback();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your feedback."
      );
    } finally {
      setSubmitting(false);
    }
  }
  if (loading) {
    return (
      <main
        style={{
          flex: 1,
          padding: "32px",
          background: "#F7F8FC",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 40,
            textAlign: "center",
            color: "#6B7280",
          }}
        >
          Loading feedback...
        </div>
      </main>
    );
  }
  return (
    <main
      style={{
        flex: 1,
        padding: "28px 32px",
        background: "#F7F8FC",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              gap: 12,
              width: "fit-content",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#EEF3FF",
                color: "#2F6BFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageSquareHeart size={21} />
            </div>
            <div style={{ margin: 0, textAlign: "left" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#111827",
                  textAlign: "left",
                }}
              >
                Give Feedback
              </h1>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: 14,
                  color: "#6B7280",
                  textAlign: "left",
                }}
              >
                Share your overall learning experience with your package.
              </p>
            </div>
          </div>
        </div>
        {/* Messages */}
        {error && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#B91C1C",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              color: "#047857",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}
        {/* Feedback Form */}
        <section
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            border: "1px solid #E5E7EB",
            boxShadow:
              "0 2px 8px rgba(15,23,42,0.04)",
          }}
        >
          <h2
            style={{
              margin: "0 0 20px",
              fontSize: 17,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Share your experience
          </h2>
          {packages.length === 0 ? (
            <div
              style={{
                padding: 24,
                borderRadius: 12,
                background: "#F8FAFC",
                color: "#64748B",
                fontSize: 14,
              }}
            >
              You currently do not have any eligible
              enrolled packages for feedback.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Package */}
              <div
                style={{
                  marginBottom: 22,
                }}
              >
                <label
                  htmlFor="feedback-package"
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Package
                </label>
                <select
                  id="feedback-package"
                  value={packageId}
                  onChange={(event) =>
                    setPackageId(event.target.value)
                  }
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 12px",
                    borderRadius: 9,
                    border: "1px solid #D1D5DB",
                    background: "#fff",
                    color: "#111827",
                    fontSize: 14,
                    outline: "none",
                  }}
                >
                  {packages.map((pkg) => (
                    <option
                      key={pkg.id}
                      value={pkg.id}
                    >
                      {pkg.title}
                    </option>
                  ))}
                </select>
              </div>
              {/* Rating */}
              <div
                style={{
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Rating
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {[1, 2, 3, 4, 5].map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setRating(value)
                        }
                        aria-label={`${value} star rating`}
                        style={{
                          border: "none",
                          background:
                            "transparent",
                          padding: 2,
                          cursor: "pointer",
                          color:
                            value <= rating
                              ? "#F59E0B"
                              : "#D1D5DB",
                        }}
                      >
                        <Star
                          size={28}
                          fill={
                            value <= rating
                              ? "currentColor"
                              : "none"
                        }
                        strokeWidth={1.8}
                      />
                    </button>
                  ))}
                </div>
              </div>
              {/* Comment */}
              <div
                style={{
                  marginBottom: 22,
                }}
              >
                <label
                  htmlFor="feedback-comment"
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Your Feedback
                </label>
                <textarea
                  id="feedback-comment"
                  value={comment}
                  onChange={(event) =>
                    setComment(event.target.value)
                  }
                  placeholder="Tell us about your overall learning experience, including trainers, course content, practical sessions, and support..."
                  maxLength={1000}
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "12px 13px",
                    borderRadius: 10,
                    border:
                      "1px solid #D1D5DB",
                    resize: "vertical",
                    fontSize: 14,
                    color: "#111827",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    marginTop: 5,
                    textAlign: "right",
                    fontSize: 12,
                    color: "#9CA3AF",
                  }}
                >
                  {comment.length}/1000
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 44,
                  padding: "0 20px",
                  border: "none",
                  borderRadius: 9,
                  background: submitting
                    ? "#93B4FF"
                    : "#2F6BFF",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: submitting
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <Send size={16} />
                {submitting
                  ? "Submitting..."
                  : "Submit Feedback"}
              </button>
            </form>
          )}
        </section>
        {/* Your Previous Feedback */}
        {feedback.length > 0 && (
          <section
            style={{
              marginTop: 24,
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              border: "1px solid #E5E7EB",
            }}
          >
            <h2
              style={{
                margin: "0 0 18px",
                fontSize: 17,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Your Previous Feedback
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {feedback.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: "#F8FAFC",
                    border:
                      "1px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {item.package}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 8px",
                        borderRadius: 999,
                        background:
                          item.status ===
                          "APPROVED"
                            ? "#DCFCE7"
                            : item.status ===
                              "REJECTED"
                            ? "#FEE2E2"
                            : "#FEF3C7",
                        color:
                          item.status ===
                          "APPROVED"
                            ? "#166534"
                            : item.status ===
                              "REJECTED"
                            ? "#991B1B"
                            : "#92400E",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 2,
                      marginBottom: 8,
                    }}
                  >
                    {[
                      1,
                      2,
                      3,
                      4,
                      5,
                    ].map((value) => (
                      <Star
                        key={value}
                        size={15}
                        fill={
                          value <= item.rating
                            ? "currentColor"
                            : "none"
                        }
                        color={
                          value <= item.rating
                            ? "#F59E0B"
                            : "#D1D5DB"
                        }
                      />
                    ))}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "#4B5563",
                    }}
                  >
                    {item.comment}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
