"use client";



import { FormEvent, useEffect, useState } from "react";

import {

  AlertCircle,

  MessageSquareHeart,

  RefreshCw,

  Send,

  Star,

} from "lucide-react";

import {

  SkStyles,

  reveal,

  useToasts,

} from "@/components/student/skce-ui";



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



  if (loading) {

    return (

      <>

        <main className="sk-page" aria-busy="true">

          <div className="sk-container fb-container">

            <div className="sk-skel" style={{ height: 70, marginBottom: 20 }} />

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

          <header className="fb-hero sk-reveal">

            <div className="fb-title">

              <div className="fb-icon">

                <MessageSquareHeart size={24} />

              </div>

              <div>

                <div className="sk-kicker">Student voice</div>

                <h1>Give Feedback</h1>

                <p>Share your overall learning experience with your package.</p>

              </div>

            </div>

          </header>



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

                    {feedback.length} submission{feedback.length === 1 ? "" : "s"}

                  </p>

                </div>

              </div>



              <div className="fb-list">

                {feedback.map((item, index) => (

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

                          color={value <= item.rating ? "#FF6B00" : "#CBD5E4"}

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

.fb-container{max-width:1560px}
.fb-form-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px 28px;align-items:start;margin-bottom:4px}
.fb-form-grid .sk-field{min-width:0}
.fb-comment-field{margin-top:2px}
.fb-hero{position:relative;isolation:isolate;overflow:hidden;display:flex;align-items:center;min-height:154px;padding:28px 30px;margin:0 0 24px;border-radius:24px;background:linear-gradient(112deg,#242332 0%,#102f5f 48%,#245d9d 100%);border-bottom:3px solid #ff7900;box-shadow:0 16px 32px rgba(15,47,95,.14);animation:sk-reveal .65s var(--ease) both}
.fb-hero:before,.fb-hero:after{content:"";position:absolute;z-index:-1;pointer-events:none;border:1px solid rgba(255,255,255,.08);border-radius:50%;aspect-ratio:1}
.fb-hero:before{width:300px;right:-72px;top:-155px;box-shadow:0 0 0 18px rgba(255,255,255,.025),0 0 0 36px rgba(255,255,255,.025),0 0 0 54px rgba(255,255,255,.02)}
.fb-hero:after{width:180px;right:40px;top:-100px;border-color:rgba(255,255,255,.045)}
.fb-hero .fb-title{position:relative;z-index:1;width:100%;gap:18px}
.fb-hero .fb-icon{width:56px;height:56px;flex:0 0 56px;border:1px solid rgba(255,255,255,.24);border-radius:17px;background:rgba(255,255,255,.15);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(8px)}
.fb-hero .sk-kicker{color:#ff9a3d!important;letter-spacing:.12em;font-weight:800;text-transform:none}
.fb-hero h1{margin:4px 0 7px;color:#fff!important;font-size:clamp(28px,3vw,36px);font-weight:750;letter-spacing:-.035em;line-height:1.12}
.fb-hero p{margin:0;color:rgba(239,246,255,.82)!important;font-size:15px;line-height:1.55;max-width:700px}
.fb-hero .fb-title>div:last-child{min-width:0}
.fb-hero .fb-icon svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,.12))}
.sk-panel{transition:transform .25s var(--ease),box-shadow .25s ease,border-color .25s ease}
.sk-panel:hover{border-color:#d3e0f2}
.sk-btn{transition:transform .2s var(--ease),box-shadow .2s ease,filter .2s ease}
.sk-btn:hover:not(:disabled){transform:translateY(-2px);filter:saturate(1.05);box-shadow:0 9px 20px rgba(255,107,0,.2)}
.sk-btn:active:not(:disabled){transform:translateY(0) scale(.99)}
.fb-item:nth-child(3n+1){border-left:3px solid #1d5fc2}
.fb-item:nth-child(3n+2){border-left:3px solid #ff7900}
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

@media (max-width:760px){.fb-form-grid{grid-template-columns:minmax(0,1fr);gap:14px}.fb-hero{min-height:auto;padding:22px 20px;border-radius:20px}.fb-hero .fb-title{align-items:flex-start;gap:13px}.fb-hero .fb-icon{width:46px;height:46px;flex-basis:46px;border-radius:14px}.fb-hero h1{font-size:28px}.fb-hero p{font-size:14px}.fb-hero:before{right:-170px}.fb-title{align-items:flex-start}}

@media (prefers-reduced-motion:reduce){.fb-hero,.fb-item,.fb-star.is-picked,.fb-rating-label{animation:none!important;transition:none!important}.fb-item:hover,.sk-btn:hover:not(:disabled){transform:none}}

`,

        }}

      />

    </>

  );

}
