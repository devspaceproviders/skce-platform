"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  MessageSquareHeart,
  RefreshCw,
  Search,
  Send,
  Star,
  X,
} from "lucide-react";
import {
  SkStyles,
  reveal,
  useToasts,
} from "@/components/student/skce-ui";
import { AdminPageHeader } from "@/components/dashboard/admin/AdminPageHeader";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export default function StudentFeedbackPage() {
  const toasts = useToasts();

  const [packages, setPackages] = useState<EligiblePackage[]>([]);
  const [feedback, setFeedback] = useState<StudentFeedback[]>([]);
  const [packageId, setPackageId] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fSearch, setFSearch] = useState("");
  const [fStatus, setFStatus] = useState("ALL");
  const [fRating, setFRating] = useState("ALL");

  async function loadFeedback() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Your session has expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/students/me/feedback`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const result: FeedbackResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Unable to load your feedback.");
      }

      setPackages(result.data.packages || []);
      setFeedback(result.data.feedback || []);

      if (result.data.packages.length > 0 && !packageId) {
        setPackageId(String(result.data.packages[0].id));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load your feedback."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      setError("Please enter at least 5 characters in your feedback.");
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Your session has expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/students/me/feedback`, {
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
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit your feedback.");
      }

      setSuccess("Thank you! Your feedback has been submitted for review.");
      toasts.push("success", "Thank you! Your feedback has been submitted for review.");
      setRating(0);
      setHoverRating(0);
      setComment("");

      await loadFeedback();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit your feedback."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const activeRating = hoverRating || rating;
  const fQuery = fSearch.trim().toLowerCase();
  const filtersActive = fQuery !== "" || fStatus !== "ALL" || fRating !== "ALL";
  const visibleFeedback = feedback.filter((item) => {
    if (fStatus !== "ALL" && item.status !== fStatus) return false;
    if (fRating !== "ALL" && item.rating !== Number(fRating)) return false;
    if (fQuery && !`${item.package} ${item.comment}`.toLowerCase().includes(fQuery)) return false;
    return true;
  });
  const clearFilters = () => {
    setFSearch("");
    setFStatus("ALL");
    setFRating("ALL");
  };
  const banner = (
    <AdminPageHeader
      className="mb-6"
      label="Student voice"
      title="Give Feedback"
      subtitle="Share your overall learning experience with your package."
      icon={MessageSquareHeart}
    />
  );

  if (loading) {
    return (
      <>
        <main className="sk-page" aria-busy="true">
          <div className="sk-container fb-container">
            {banner}
            <div className="sk-skel" style={{ height: 460 }} />
            <span className="sk-sr">Loading feedback</span>
          </div>
        </main>
        <SkStyles />
      </>
    );
  }

  return (
    <>
      <main className="sk-page">
        <div className="sk-container fb-container">
          {banner}

          {error && (
            <div className="sk-alert is-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="sk-alert is-ok" role="status">
              <span>{success}</span>
            </div>
          )}

          <section className="sk-panel sk-mb sk-reveal" style={reveal(1)}>
            <div className="sk-panel-head">
              <div className="sk-icon sk-tone-blue">
                <Star size={19} />
              </div>
              <div>
                <h2>Share your experience</h2>
                <p>Your feedback is reviewed before it is published.</p>
              </div>
            </div>

            {packages.length === 0 ? (
              <div className="sk-empty" style={{ minHeight: 160 }}>
                <div className="sk-empty-icon">
                  <MessageSquareHeart size={22} />
                </div>
                <strong>No eligible packages</strong>
                <span>
                  You currently do not have any eligible enrolled packages for
                  feedback.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="fb-form-grid">
                <div className="sk-field">
                  <label htmlFor="feedback-package" className="sk-label">
                    Package
                  </label>
                  <select
                    id="feedback-package"
                    className="sk-select"
                    value={packageId}
                    onChange={(event) => setPackageId(event.target.value)}
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sk-field">
                  <div className="sk-label">Rating</div>
                  <div className="fb-stars" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHoverRating(value)}
                        onFocus={() => setHoverRating(value)}
                        onBlur={() => setHoverRating(0)}
                        aria-label={`${value} star rating`}
                        aria-pressed={rating === value}
                        className={`fb-star${value <= activeRating ? " is-on" : ""}${
                          value === rating ? " is-picked" : ""
                        }`}
                      >
                        <Star
                          size={32}
                          fill={value <= activeRating ? "currentColor" : "none"}
                          strokeWidth={1.8}
                        />
                      </button>
                    ))}
                    <span className="fb-rating-label" key={activeRating}>
                      {activeRating > 0 ? RATING_LABELS[activeRating] : "Tap a star"}
                    </span>
                  </div>
                </div>
                </div>
                <div className="sk-field fb-comment-field">
                  <label htmlFor="feedback-comment" className="sk-label">
                    Your Feedback
                  </label>
                  <textarea
                    id="feedback-comment"
                    className="sk-textarea"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Tell us about your overall learning experience, including trainers, course content, practical sessions, and support..."
                    maxLength={1000}
                    rows={4}
                  />
                  <div className="fb-counter">
                    <span
                      style={{
                        width: `${(comment.length / 1000) * 100}%`,
                      }}
                    />
                    <em>{comment.length}/1000</em>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="sk-btn sk-btn-primary"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={15} className="sk-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            )}
          </section>

          {feedback.length > 0 && (
            <section className="sk-panel sk-reveal" style={reveal(2)}>
              <div className="sk-panel-head">
                <div className="sk-icon sk-tone-orange">
                  <MessageSquareHeart size={19} />
                </div>
                <div>
                  <h2>Your Previous Feedback</h2>
                  <p>
                    {filtersActive ? `${visibleFeedback.length} of ${feedback.length}` : feedback.length} submission{feedback.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="sk-filterbar" role="search" aria-label="Filter feedback">
                <label className="sk-fsearch">
                  <Search size={15} />
                  <input
                    type="search"
                    value={fSearch}
                    onChange={(e) => setFSearch(e.target.value)}
                    placeholder="Search package or comment"
                    aria-label="Search feedback"
                  />
                </label>
                <select className="sk-fselect" value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Status">
                  <option value="ALL">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <select className="sk-fselect" value={fRating} onChange={(e) => setFRating(e.target.value)} aria-label="Rating">
                  <option value="ALL">All ratings</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>
                  ))}
                </select>
                {filtersActive && (
                  <button type="button" className="sk-clear" onClick={clearFilters}>
                    <X size={14} /> Clear filters
                  </button>
                )}
              </div>

              {visibleFeedback.length === 0 && (
                <div className="sk-nomatch">No feedback matches the current filters.</div>
              )}

              <div className="fb-list">
                {visibleFeedback.map((item, index) => (
                  <div
                    key={item.id}
                    className="fb-item"
                    style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
                  >
                    <div className="fb-item-top">
                      <strong>{item.package}</strong>
                      <span
                        className={`sk-badge ${
                          item.status === "APPROVED"
                            ? "tone-green"
                            : item.status === "REJECTED"
                            ? "tone-red"
                            : "tone-orange"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="fb-item-stars">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          size={16}
                          fill={value <= item.rating ? "currentColor" : "none"}
                          color={value <= item.rating ? "#F97316" : "#CBD5E4"}
                        />
                      ))}
                    </div>

                    <p>{item.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {toasts.node}
      <SkStyles />
      <style
        dangerouslySetInnerHTML={{
          __html: `
.fb-container{max-width:1680px}
.fb-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-bottom:6px}
.fb-form-grid .sk-field{min-width:0}
.sk-panel:hover{border-color:#d3e0f2}
.sk-btn:hover:not(:disabled){transform:translateY(-2px);filter:saturate(1.05);box-shadow:0 9px 20px rgba(249,115,22,.2)}
.fb-item:nth-child(3n+1){border-left:3px solid #1d5fc2}
.fb-item:nth-child(3n){border-left:3px solid #8ba9d5}
.fb-title{display:flex;align-items:center;gap:16px}
.fb-icon{width:44px;height:44px;flex:0 0 44px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:linear-gradient(135deg,var(--navy),var(--blue));color:#fff;box-shadow:0 8px 20px rgba(15,47,95,.25)}
.fb-stars{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.fb-star{padding:3px;border:0;background:transparent;color:#CBD5E4;cursor:pointer;transition:color .2s ease,transform .25s var(--ease)}
.fb-star:hover{transform:scale(1.2) rotate(-6deg)}
.fb-star.is-on{color:var(--orange)}
.fb-star.is-picked{animation:sk-pop .4s var(--ease) both}
.fb-star:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3);border-radius:8px}
.fb-rating-label{margin-left:10px;padding:4px 12px;border-radius:999px;background:var(--orange-tint);color:var(--orange-2);font-size:13px;font-weight:600;animation:sk-swap .25s var(--ease) both}
.fb-counter{display:flex;align-items:center;gap:10px;margin-top:8px}
.fb-counter span{display:block;height:4px;flex:none;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--blue-2));transition:width .2s ease}
.fb-counter em{margin-left:auto}
.fb-counter em{flex:0 0 auto;font-style:normal;font-size:12px;color:var(--soft)}
.fb-list{display:flex;flex-direction:column;gap:8px}
.fb-item{padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:#FBFCFE;animation:sk-swap .4s var(--ease) both;transition:transform .25s var(--ease),box-shadow .25s ease,border-color .25s ease}
.fb-item:hover{transform:translateY(-3px);border-color:#9DBBEA;box-shadow:0 10px 22px rgba(15,47,95,.1);background:#fff}
.fb-item-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.fb-item-top strong{font-size:15px;color:var(--navy)}
.fb-item-stars{display:flex;gap:2px;margin-bottom:8px}
.fb-item p{margin:0;font-size:14px;line-height:1.65;color:var(--muted)}
@media (max-width:760px){.fb-form-grid{grid-template-columns:minmax(0,1fr);gap:14px}.fb-title{align-items:flex-start}}
@media (prefers-reduced-motion:reduce){.fb-hero,.fb-item,.fb-star.is-picked,.fb-rating-label{animation:none!important;transition:none!important}.fb-item:hover,.sk-btn:hover:not(:disabled){transform:none}}
`,
        }}
      />
    </>
  );
}