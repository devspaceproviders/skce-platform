"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  GraduationCap,
  Layers3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Assessment = {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  type: "ASSIGNMENT" | "QUIZ";
  dueAt: string | null;
  totalMarks: number;
  submissionCount: number;
  isActive: boolean;
};

type Submission = {
  id: number;
  userId: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  submittedAt: string | null;
};

type PendingAssessment = Assessment & { pendingCount: number };

type TrainerCoursePermission = {
  id: number;
  trainerId: number;
  courseId: number;
  canTeach: boolean;
  canManageContent: boolean;
  canCreateAssessments: boolean;
  createdAt: string;
  updatedAt: string;
};

type DashboardUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getLoggedInUser(): DashboardUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DashboardUser;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function TrainerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [pendingAssessments, setPendingAssessments] = useState<PendingAssessment[]>([]);
  const [coursePermissions, setCoursePermissions] = useState<TrainerCoursePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        throw new Error("Authentication required");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
          ...(options.body ? { "Content-Type": "application/json" } : {}),
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        localStorage.removeItem("student");
        localStorage.removeItem("studentId");
        router.push("/login");
        throw new Error("Your session has expired. Please sign in again.");
      }

      return response;
    },
    [router],
  );

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");

        const [assessmentsResponse, permissionsResponse] = await Promise.all([
          authenticatedFetch(`${API_URL}/assessments`),
          authenticatedFetch(`${API_URL}/trainer/course-permissions`),
        ]);

        const [assessmentsJson, permissionsJson] = await Promise.all([
          assessmentsResponse.json(),
          permissionsResponse.json(),
        ]);

        if (!assessmentsResponse.ok || !assessmentsJson?.success) {
          throw new Error(assessmentsJson?.message || "Unable to load assessments.");
        }
        if (!permissionsResponse.ok || !permissionsJson?.success) {
          throw new Error(permissionsJson?.message || "Unable to load course permissions.");
        }

        const assessmentData: Assessment[] = Array.isArray(assessmentsJson.data)
          ? assessmentsJson.data
          : [];
        const permissionData: TrainerCoursePermission[] = Array.isArray(permissionsJson.data)
          ? permissionsJson.data
          : [];

        setAssessments(assessmentData);
        setCoursePermissions(permissionData);

        const manageableCourseIds = new Set(
          permissionData
            .filter((permission) => permission.canCreateAssessments)
            .map((permission) => permission.courseId),
        );

        const gradeableAssessments = assessmentData.filter((assessment) =>
          manageableCourseIds.has(assessment.courseId),
        );

        const pendingResults = await Promise.all(
          gradeableAssessments.map(async (assessment) => {
            try {
              const response = await authenticatedFetch(
                `${API_URL}/assessments/${assessment.id}/submissions`,
              );
              const json = await response.json();

              if (!response.ok || !json?.success) {
                return { ...assessment, pendingCount: 0 };
              }

              const submissions: Submission[] = Array.isArray(json.data)
                ? json.data
                : Array.isArray(json.data?.submissions)
                  ? json.data.submissions
                  : [];

              return {
                ...assessment,
                pendingCount: submissions.filter((submission) => submission.status === "SUBMITTED").length,
              };
            } catch {
              return { ...assessment, pendingCount: 0 };
            }
          }),
        );

        setPendingAssessments(
          pendingResults
            .filter((item) => item.pendingCount > 0)
            .sort((a, b) => b.pendingCount - a.pendingCount)
            .slice(0, 5),
        );
        setUser(getLoggedInUser());
      } catch (err) {
        console.error("Trainer dashboard load error:", err);
        setError(err instanceof Error ? err.message : "Unable to load trainer dashboard.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authenticatedFetch],
  );

  useEffect(() => {
    setUser(getLoggedInUser());
    void loadDashboard();
  }, [loadDashboard]);

  const pendingGradingCount = useMemo(
    () => pendingAssessments.reduce((sum, assessment) => sum + assessment.pendingCount, 0),
    [pendingAssessments],
  );
  const activeAssessments = assessments.filter((assessment) => assessment.isActive).length;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Trainer";
  const totalPermissions = coursePermissions.length;
  const allowedContentCourses = coursePermissions.filter((item) => item.canManageContent).length;
  const assessmentCourses = coursePermissions.filter((item) => item.canCreateAssessments).length;

  return (
    <main className="trd-page">
      <div className="trd-wrap">
        <header className="tr-hero trd-hero">
          <div className="trd-hero-orb trd-hero-orb-one" aria-hidden="true" />
          <div className="trd-hero-orb trd-hero-orb-two" aria-hidden="true" />
          <div className="trd-hero-content">
            <div className="trd-eyebrow">
              <span className="trd-eyebrow-icon"><GraduationCap size={17} /></span>
              Trainer workspace
            </div>
            <h1>{getGreeting()}, {firstName} <span className="trd-wave">👋</span></h1>
            <p>Everything you need to manage courses, assessments and learner progress.</p>
            <div className="trd-hero-meta">
              <span><ShieldCheck size={14} /> Trainer portal</span>
              <span><Layers3 size={14} /> {totalPermissions} assigned {totalPermissions === 1 ? "course" : "courses"}</span>
            </div>
          </div>
          <div className="trd-hero-actions">
            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={loading || refreshing}
              className="trd-button trd-button-glass"
            >
              <RefreshCw size={16} className={refreshing ? "tr-spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <Link href="/" className="trd-button trd-button-light">
              <Bell size={16} /> Public site <ArrowRight size={15} />
            </Link>
          </div>
          <div className="trd-hero-bottom"><span /></div>
        </header>

        {error && (
          <div className="trd-alert" role="alert">
            <span className="trd-alert-icon"><AlertCircle size={19} /></span>
            <div className="trd-alert-copy">
              <strong>Unable to load some dashboard data</strong>
              <p>{error}</p>
            </div>
            <button type="button" onClick={() => void loadDashboard(true)} className="trd-alert-retry">
              Try again <RefreshCw size={14} />
            </button>
          </div>
        )}

        <section className="trd-stats" aria-label="Trainer summary">
          <StatCard
            icon={ClipboardList}
            tone="orange"
            value={loading ? "—" : pendingGradingCount}
            label="Pending grading"
            description="Submissions awaiting review"
            footnote="Needs attention"
            footIcon={Clock3}
            index={0}
          />
          <StatCard
            icon={BookOpen}
            tone="blue"
            value={loading ? "—" : activeAssessments}
            label="Active assessments"
            description="Assignments and quizzes live now"
            footnote="Current activity"
            footIcon={ArrowDownRight}
            index={1}
          />
          <StatCard
            icon={Users}
            tone="violet"
            value={loading ? "—" : totalPermissions}
            label="Course permissions"
            description="Courses assigned to your account"
            footnote="Your workspace"
            footIcon={CheckCircle2}
            index={2}
          />
        </section>

        <div className="trd-main-grid">
          <div className="trd-primary-column">
            <section className="trd-section">
              <SectionHeader
                eyebrow="Action required"
                title="Pending grading"
                description="Submitted work waiting for your review."
                href="/dashboard/trainer/assignments"
              />
              {loading ? (
                <LoadingCard />
              ) : pendingAssessments.length === 0 ? (
                <EmptyCard
                  icon={ClipboardCheck}
                  title="You're all caught up"
                  description="There are no submitted assignments or quizzes awaiting grading right now."
                />
              ) : (
                <div className="trd-pending-list">
                  {pendingAssessments.map((assessment, index) => (
                    <article key={assessment.id} className="tr-card trd-pending-card tr-reveal" style={{ "--i": index } as React.CSSProperties}>
                      <div className="trd-pending-icon">
                        {assessment.type === "QUIZ" ? <BookOpen size={19} /> : <ClipboardList size={19} />}
                      </div>
                      <div className="trd-pending-details">
                        <div className="trd-pending-heading">
                          <h3>{assessment.title}</h3>
                          <span className="trd-count-pill">{assessment.pendingCount} pending</span>
                        </div>
                        <p className="trd-course-name">{assessment.courseTitle || "Course not available"}</p>
                        <div className="trd-pending-meta">
                          <span className={`trd-type-pill ${assessment.type === "QUIZ" ? "is-blue" : "is-orange"}`}>{assessment.type === "QUIZ" ? "Quiz" : "Assignment"}</span>
                          {assessment.dueAt && <span><Clock3 size={13} /> Due {formatDate(assessment.dueAt)}</span>}
                          <span>{assessment.totalMarks} marks</span>
                        </div>
                        <Link href="/dashboard/trainer/assignments" className="trd-inline-link">
                          Review submissions <ArrowRight size={14} />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="tr-card trd-overview tr-reveal" style={{ "--i": 3 } as React.CSSProperties}>
              <div className="trd-section-top">
                <div className="trd-section-icon trd-icon-blue"><BookOpen size={19} /></div>
                <div>
                  <span className="trd-section-eyebrow">At a glance</span>
                  <h2>Assessment overview</h2>
                  <p>Your assessment activity in one place.</p>
                </div>
              </div>
              <div className="trd-overview-summary">
                <div className="trd-overview-summary-number">{loading ? "—" : assessments.length}</div>
                <div className="trd-overview-summary-copy">
                  <strong>Total assessments</strong>
                  <span>{activeAssessments} active {activeAssessments === 1 ? "assessment" : "assessments"} available</span>
                </div>
                <div className="trd-overview-mark"><ClipboardCheck size={24} /></div>
              </div>
              <div className="trd-overview-grid">
                <OverviewItem label="Total assessments" value={loading ? "—" : assessments.length} tone="neutral" />
                <OverviewItem label="Active now" value={loading ? "—" : activeAssessments} tone="green" />
                <OverviewItem label="Awaiting grading" value={loading ? "—" : pendingGradingCount} tone="orange" />
              </div>
            </section>
          </div>

          <aside className="trd-side-column">
            <section className="trd-quick-panel">
              <div className="trd-quick-heading">
                <div>
                  <span className="trd-quick-eyebrow">Shortcuts</span>
                  <h2>Quick links</h2>
                  <p>Jump straight into your daily tasks.</p>
                </div>
                <span className="trd-quick-heading-icon"><ArrowRight size={18} /></span>
              </div>
              <div className="trd-quick-links">
                <QuickLink href="/dashboard/trainer/assignments" label="Assignments & quizzes" description="Review and grade work" icon={ClipboardList} />
                <QuickLink href="/dashboard/trainer/my-batches" label="My batches" description="Manage your learners" icon={Users} />
                <QuickLink href="/dashboard/trainer/course-content" label="Course content" description="Update lessons and materials" icon={BookOpen} />
                <QuickLink href="/dashboard/trainer/calendar" label="Calendar" description="Check your schedule" icon={Clock3} />
                <QuickLink href="/dashboard/trainer/profile" label="My profile" description="View account details" icon={GraduationCap} />
              </div>
            </section>

            <section className="tr-card trd-permissions">
              <div className="trd-permissions-heading">
                <div className="trd-section-icon trd-icon-orange"><ShieldCheck size={19} /></div>
                <div>
                  <h2>Course permissions</h2>
                  <p>Access assigned to your account.</p>
                </div>
              </div>

              <div className="trd-permission-summary">
                <div><strong>{loading ? "—" : totalPermissions}</strong><span>Assigned</span></div>
                <div><strong>{loading ? "—" : allowedContentCourses}</strong><span>Content</span></div>
                <div><strong>{loading ? "—" : assessmentCourses}</strong><span>Assessments</span></div>
              </div>

              {loading ? (
                <div className="trd-permission-empty"><Loader2 size={16} className="tr-spin" /> Loading permissions…</div>
              ) : coursePermissions.length === 0 ? (
                <div className="trd-permission-empty">No course permissions have been assigned to you yet.</div>
              ) : (
                <div className="trd-permission-list">
                  {coursePermissions.map((permission, index) => (
                    <article key={permission.id} className="trd-permission-item tr-reveal" style={{ "--i": index } as React.CSSProperties}>
                      <div className="trd-permission-course-icon"><BookOpen size={16} /></div>
                      <div className="trd-permission-course">
                        <strong>Course {permission.courseId}</strong>
                        <span>Assigned course</span>
                      </div>
                      <div className="trd-permission-status">
                        <span className={permission.canTeach ? "is-enabled" : "is-disabled"}>{permission.canTeach ? "Teaching" : "No teaching"}</span>
                        <span className={permission.canManageContent ? "is-enabled" : "is-disabled"}>{permission.canManageContent ? "Content access" : "No content access"}</span>
                        <span className={permission.canCreateAssessments ? "is-enabled" : "is-disabled"}>{permission.canCreateAssessments ? "Create assessments" : "No assessment access"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: trainerDashboardCss }} />
    </main>
  );
}

function StatCard({
  icon: Icon,
  tone,
  value,
  label,
  description,
  footnote,
  footIcon: FootIcon,
  index,
}: {
  icon: LucideIcon;
  tone: "orange" | "blue" | "violet";
  value: number | string;
  label: string;
  description: string;
  footnote: string;
  footIcon: LucideIcon;
  index: number;
}) {
  return (
    <article className="tr-card trd-stat-card tr-reveal" style={{ "--i": index } as React.CSSProperties}>
      <div className="trd-stat-top">
        <div className={`trd-stat-icon tone-${tone}`}><Icon size={21} /></div>
        <span className="trd-stat-decoration"><FootIcon size={17} /></span>
      </div>
      <div className="trd-stat-value">{value}</div>
      <h2>{label}</h2>
      <p>{description}</p>
      <div className="trd-stat-foot"><span className={`trd-status-dot tone-${tone}`} />{footnote}</div>
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  href,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="trd-section-header">
      <div>
        <span className="trd-section-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Link href={href} className="trd-view-all">View all <ArrowRight size={15} /></Link>
    </div>
  );
}

function OverviewItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "neutral" | "green" | "orange";
}) {
  return (
    <div className={`trd-overview-item tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="tr-card trd-loading-card" aria-live="polite" aria-busy="true">
      <span className="trd-loading-spinner"><Loader2 size={19} className="tr-spin" /></span>
      <div><strong>Loading your grading queue</strong><span>Checking assessment submissions…</span></div>
      <div className="trd-loading-bars"><i /><i /><i /></div>
    </div>
  );
}

function EmptyCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="tr-card trd-empty-card">
      <div className="trd-empty-icon"><Icon size={25} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href="/dashboard/trainer/assignments" className="trd-inline-link">Go to assignments <ArrowRight size={14} /></Link>
    </div>
  );
}

function QuickLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="trd-quick-link">
      <span className="trd-quick-link-icon"><Icon size={18} /></span>
      <span className="trd-quick-link-copy"><strong>{label}</strong><small>{description}</small></span>
      <ArrowRight size={16} className="trd-quick-arrow" />
    </Link>
  );
}

const trainerDashboardCss = `
.trd-page{width:100%;min-width:0;padding:30px clamp(18px,2.6vw,42px) 44px;color:var(--navy,#0F2F5F)}
.trd-wrap{width:100%;max-width:1680px;margin:0 auto}
.trd-hero{min-height:218px;padding:30px 32px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.trd-hero-content,.trd-hero-actions{position:relative;z-index:1}
.trd-hero-content{max-width:760px}
.trd-eyebrow{display:inline-flex;align-items:center;gap:9px;color:#FFD0AA;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.trd-eyebrow-icon{width:30px;height:30px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(255,255,255,.1);display:grid;place-items:center;color:#FFB16F}
.trd-hero h1{margin:15px 0 0;color:#fff;font-size:clamp(27px,3vw,38px);font-weight:800;line-height:1.15;letter-spacing:-.035em}
.trd-wave{display:inline-block;transform-origin:70% 70%;animation:trd-wave 2.8s ease-in-out 1}
.trd-hero p{max-width:620px;margin:11px 0 0;color:#D5E4F8;font-size:14px;line-height:1.7}
.trd-hero-meta{display:flex;flex-wrap:wrap;gap:9px;margin-top:20px}
.trd-hero-meta span{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid rgba(255,255,255,.15);border-radius:999px;background:rgba(255,255,255,.08);color:#E7F0FD;font-size:11px;font-weight:650}
.trd-hero-actions{display:flex;flex-wrap:wrap;align-items:center;gap:9px;flex-shrink:0}
.trd-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:42px;padding:0 15px;border-radius:11px;font-size:12px;font-weight:750;text-decoration:none;transition:transform .22s ease,background .22s ease,box-shadow .22s ease}
.trd-button:hover{transform:translateY(-2px)}
.trd-button:disabled{cursor:not-allowed;opacity:.6;transform:none}
.trd-button-glass{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.1);color:white}
.trd-button-glass:hover{background:rgba(255,255,255,.18)}
.trd-button-light{border:1px solid #fff;background:#fff;color:#174579;box-shadow:0 5px 15px rgba(3,19,45,.13)}
.trd-button-light:hover{box-shadow:0 9px 22px rgba(3,19,45,.2)}
.trd-hero-orb{position:absolute;pointer-events:none;border:1px solid rgba(255,255,255,.08);border-radius:50%}
.trd-hero-orb-one{width:320px;height:320px;right:8%;top:-190px;box-shadow:0 0 0 24px rgba(255,255,255,.025),0 0 0 48px rgba(255,255,255,.02)}
.trd-hero-orb-two{width:200px;height:200px;right:-35px;bottom:-145px;background:rgba(255,255,255,.04)}
.trd-hero-bottom{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(255,255,255,.08)}
.trd-hero-bottom span{display:block;width:18%;height:100%;background:linear-gradient(90deg,#FF6B00,#FFB15E)}
.trd-alert{display:flex;align-items:flex-start;gap:12px;margin-top:18px;padding:15px 17px;border:1px solid #FECACA;border-radius:14px;background:#FFF6F5;color:#991B1B}
.trd-alert-icon{display:grid;place-items:center;flex-shrink:0;width:34px;height:34px;border-radius:10px;background:#FEE2E2}
.trd-alert-copy{min-width:0;flex:1}
.trd-alert-copy strong{font-size:13px}
.trd-alert-copy p{margin:3px 0 0;font-size:12px;line-height:1.6;overflow-wrap:anywhere}
.trd-alert-retry{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;border:0;background:transparent;color:#991B1B;font-size:12px;font-weight:750;cursor:pointer}
.trd-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:22px}
.trd-stat-card{position:relative;overflow:hidden;padding:21px 22px 18px}
.trd-stat-card::after{content:"";position:absolute;right:-35px;top:-45px;width:125px;height:125px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.065),transparent 70%);pointer-events:none}
.trd-stat-top{display:flex;align-items:center;justify-content:space-between}
.trd-stat-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:14px}
.trd-stat-icon.tone-orange{background:linear-gradient(145deg,#FFF4EA,#FFE2CB);color:#F76B0B}
.trd-stat-icon.tone-blue{background:linear-gradient(145deg,#EFF6FF,#DCEAFE);color:#2563EB}
.trd-stat-icon.tone-violet{background:linear-gradient(145deg,#F4F0FF,#E8E1FF);color:#7655D8}
.trd-stat-decoration{display:grid;place-items:center;width:31px;height:31px;border:1px solid var(--line,#E2E8F1);border-radius:10px;color:#91A1B8;background:#fff}
.trd-stat-value{margin-top:15px;color:var(--navy,#0F2F5F);font-size:34px;font-weight:850;letter-spacing:-.04em;line-height:1.05}
.trd-stat-card h2{margin:7px 0 0;color:#183D6C;font-size:14px;font-weight:800}
.trd-stat-card p{margin:5px 0 0;color:var(--muted,#64748B);font-size:12px;line-height:1.5}
.trd-stat-foot{display:flex;align-items:center;gap:7px;margin-top:16px;padding-top:12px;border-top:1px solid #EEF2F7;color:#77869C;font-size:11px;font-weight:650}
.trd-status-dot{width:7px;height:7px;border-radius:50%}
.trd-status-dot.tone-orange{background:#FF7A18;box-shadow:0 0 0 3px #FFF0E4}
.trd-status-dot.tone-blue{background:#3779E8;box-shadow:0 0 0 3px #EAF1FD}
.trd-status-dot.tone-violet{background:#8062DF;box-shadow:0 0 0 3px #F0ECFF}
.trd-main-grid{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(320px,1fr);align-items:start;gap:22px;margin-top:28px}
.trd-primary-column,.trd-side-column{display:grid;gap:26px;min-width:0}
.trd-section{min-width:0}
.trd-section-header{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:14px}
.trd-section-eyebrow{display:block;margin-bottom:5px;color:#F07822;font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
.trd-section-header h2,.trd-section-top h2{margin:0;color:#123766;font-size:20px;font-weight:850;letter-spacing:-.025em}
.trd-section-header p,.trd-section-top p{margin:6px 0 0;color:#71819A;font-size:12px;line-height:1.6}
.trd-view-all,.trd-inline-link{display:inline-flex;align-items:center;gap:7px;color:#1459B8;font-size:12px;font-weight:800;text-decoration:none;white-space:nowrap;transition:gap .2s ease,color .2s ease}
.trd-view-all{padding:9px 11px;border:1px solid #DDE7F5;border-radius:10px;background:#fff}
.trd-view-all:hover,.trd-inline-link:hover{gap:10px;color:#F36B08}
.trd-pending-list{display:grid;gap:11px}
.trd-pending-card{display:flex;align-items:flex-start;gap:14px;padding:17px 18px}
.trd-pending-icon{display:grid;place-items:center;flex-shrink:0;width:43px;height:43px;border-radius:13px;background:linear-gradient(145deg,#FFF3E8,#FFE4CE);color:#F36B08}
.trd-pending-details{min-width:0;flex:1}
.trd-pending-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.trd-pending-heading h3{margin:1px 0 0;color:#163B6B;font-size:14px;font-weight:800;line-height:1.45;overflow-wrap:anywhere}
.trd-count-pill{flex-shrink:0;padding:6px 9px;border:1px solid #FFD9BE;border-radius:999px;background:#FFF5EC;color:#D95C00;font-size:10px;font-weight:850}
.trd-course-name{margin:5px 0 0;color:#77869C;font-size:12px}
.trd-pending-meta{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:11px;color:#8190A5;font-size:10px}
.trd-pending-meta>span{display:inline-flex;align-items:center;gap:4px}
.trd-type-pill{padding:4px 8px;border-radius:6px;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.04em}
.trd-type-pill.is-orange{background:#FFF1E5;color:#D85C00}
.trd-type-pill.is-blue{background:#EAF1FD;color:#245DB5}
.trd-pending-card .trd-inline-link{margin-top:13px}
.trd-overview{padding:22px}
.trd-section-top{display:flex;align-items:center;gap:12px}
.trd-section-icon{display:grid;place-items:center;flex-shrink:0;width:42px;height:42px;border-radius:13px}
.trd-icon-blue{background:#EAF1FD;color:#245DB5}
.trd-icon-orange{background:#FFF0E5;color:#EF6B0A}
.trd-section-top h2{font-size:17px}
.trd-section-top p{margin-top:4px}
.trd-overview-summary{display:flex;align-items:center;gap:14px;margin-top:21px;padding:17px;border:1px solid #E8EEF7;border-radius:14px;background:linear-gradient(110deg,#F8FAFE,#F2F6FD)}
.trd-overview-summary-number{color:#123766;font-size:32px;font-weight:850;letter-spacing:-.04em}
.trd-overview-summary-copy{display:grid;gap:4px;flex:1}
.trd-overview-summary-copy strong{color:#1A3D69;font-size:12px}
.trd-overview-summary-copy span{color:#7C8BA0;font-size:11px}
.trd-overview-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#fff;color:#2563EB;box-shadow:0 3px 12px rgba(15,47,95,.07)}
.trd-overview-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
.trd-overview-item{display:flex;flex-direction:column;gap:10px;min-width:0;padding:14px;border:1px solid #E9EEF6;border-radius:12px;background:#fff}
.trd-overview-item span{color:#7A899F;font-size:10px;line-height:1.45}
.trd-overview-item strong{font-size:22px;font-weight:850;color:#183D6B}
.trd-overview-item.tone-green strong{color:#15803D}
.trd-overview-item.tone-orange strong{color:#EA6A0A}
.trd-quick-panel{overflow:hidden;border-radius:17px;background:linear-gradient(145deg,#0F2F5F,#16477F 70%,#1D5592);box-shadow:0 12px 26px rgba(15,47,95,.15)}
.trd-quick-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:22px 21px 18px;color:#fff}
.trd-quick-eyebrow{color:#FFBF8C;font-size:10px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
.trd-quick-heading h2{margin:5px 0 0;color:#fff;font-size:20px;font-weight:850;letter-spacing:-.025em}
.trd-quick-heading p{margin:6px 0 0;color:#D0E0F4;font-size:11px;line-height:1.6}
.trd-quick-heading-icon{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(255,255,255,.09);color:#FFD0AA}
.trd-quick-links{display:grid;gap:8px;padding:0 12px 13px}
.trd-quick-link{display:flex;align-items:center;gap:11px;min-width:0;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.075);color:#fff;text-decoration:none;transition:transform .22s ease,background .22s ease,border-color .22s ease}
.trd-quick-link:hover{transform:translateX(3px);border-color:rgba(255,255,255,.24);background:rgba(255,255,255,.14)}
.trd-quick-link-icon{display:grid;place-items:center;flex-shrink:0;width:36px;height:36px;border-radius:11px;background:#fff;color:#1B579B}
.trd-quick-link-copy{display:grid;gap:4px;flex:1;min-width:0}
.trd-quick-link-copy strong{font-size:11px;font-weight:800}
.trd-quick-link-copy small{color:#C4D6ED;font-size:10px;line-height:1.4}
.trd-quick-arrow{flex-shrink:0;color:#FFD0AA;transition:transform .2s ease}
.trd-quick-link:hover .trd-quick-arrow{transform:translateX(3px)}
.trd-permissions{padding:21px}
.trd-permissions-heading{display:flex;align-items:center;gap:12px}
.trd-permissions-heading h2{margin:0;color:#163B6B;font-size:16px;font-weight:850}
.trd-permissions-heading p{margin:5px 0 0;color:#7B899E;font-size:11px;line-height:1.5}
.trd-permission-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:18px;padding:12px 8px;border-radius:12px;background:#F7F9FC}
.trd-permission-summary>div{display:grid;gap:3px;text-align:center}
.trd-permission-summary>div+div{border-left:1px solid #E0E7F1}
.trd-permission-summary strong{color:#183D6B;font-size:21px;font-weight:850}
.trd-permission-summary span{color:#7D8BA0;font-size:9px;font-weight:650}
.trd-permission-list{display:grid;gap:10px;margin-top:15px}
.trd-permission-item{padding:13px;border:1px solid #E6ECF5;border-radius:12px;background:#fff}
.trd-permission-course{display:inline-grid;gap:3px;vertical-align:middle}
.trd-permission-course-icon{display:inline-grid;place-items:center;float:left;width:34px;height:34px;margin-right:10px;border-radius:10px;background:#EAF1FD;color:#245DB5}
.trd-permission-course strong{color:#1B3E6B;font-size:11px;font-weight:850}
.trd-permission-course span{color:#8794A7;font-size:10px}
.trd-permission-status{display:flex;flex-wrap:wrap;gap:6px;clear:both;padding-top:12px}
.trd-permission-status span{padding:5px 7px;border-radius:6px;font-size:9px;font-weight:750}
.trd-permission-status .is-enabled{background:#E8F6EE;color:#167342}
.trd-permission-status .is-disabled{background:#F1F4F8;color:#8A96A8}
.trd-permission-empty{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:15px;padding:20px 13px;border:1px dashed #DCE5F1;border-radius:12px;color:#7B899E;font-size:11px;line-height:1.6;text-align:center}
.trd-empty-card{display:flex;flex-direction:column;align-items:center;padding:30px 20px;text-align:center}
.trd-empty-icon{display:grid;place-items:center;width:54px;height:54px;border-radius:16px;background:#FFF1E5;color:#EF6B0A}
.trd-empty-card h3{margin:13px 0 0;color:#163B6B;font-size:15px;font-weight:850}
.trd-empty-card p{max-width:380px;margin:7px 0 0;color:#7B899E;font-size:12px;line-height:1.7}
.trd-empty-card .trd-inline-link{margin-top:15px}
.trd-loading-card{display:flex;align-items:center;gap:12px;padding:22px}
.trd-loading-spinner{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#EAF1FD;color:#245DB5}
.trd-loading-card>div:nth-child(2){display:grid;gap:5px;flex:1}
.trd-loading-card strong{color:#173B67;font-size:12px}
.trd-loading-card span{color:#8491A5;font-size:11px}
.trd-loading-bars{display:flex;gap:4px;align-items:flex-end;height:25px}
.trd-loading-bars i{display:block;width:4px;border-radius:4px;background:#FF9A4D;animation:trd-bars .8s ease-in-out infinite alternate}
.trd-loading-bars i:nth-child(1){height:12px}
.trd-loading-bars i:nth-child(2){height:22px;animation-delay:.15s}
.trd-loading-bars i:nth-child(3){height:16px;animation-delay:.3s}
.trd-page a:focus-visible,.trd-page button:focus-visible{outline:3px solid rgba(37,99,235,.35);outline-offset:3px}
@keyframes trd-wave{0%,100%{transform:rotate(0)}15%,35%{transform:rotate(13deg)}25%,45%{transform:rotate(-8deg)}}
@keyframes trd-bars{from{transform:scaleY(.45);opacity:.55}to{transform:scaleY(1);opacity:1}}
@media(max-width:1180px){.trd-main-grid{grid-template-columns:minmax(0,1.35fr) minmax(290px,.9fr);gap:17px}.trd-page{padding-left:22px;padding-right:22px}.trd-hero{padding:27px}.trd-hero-actions{flex-direction:column;align-items:stretch}.trd-button{white-space:nowrap}}
@media(max-width:900px){.trd-main-grid{grid-template-columns:minmax(0,1fr)}.trd-side-column{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.trd-quick-panel,.trd-permissions{min-width:0}.trd-hero{align-items:flex-start}.trd-hero-actions{flex-direction:row;flex-wrap:wrap}}
@media(max-width:640px){.trd-page{padding:17px 13px 30px}.trd-hero{flex-direction:column;gap:20px;padding:23px 19px;border-radius:15px}.trd-hero h1{font-size:27px}.trd-hero p{font-size:12px}.trd-hero-actions{width:100%}.trd-button{flex:1;padding:0 10px}.trd-stats{grid-template-columns:minmax(0,1fr);gap:11px;margin-top:14px}.trd-stat-card{padding:17px}.trd-stat-value{margin-top:11px;font-size:29px}.trd-stat-foot{margin-top:12px}.trd-main-grid{gap:22px;margin-top:23px}.trd-primary-column,.trd-side-column{gap:22px}.trd-side-column{grid-template-columns:minmax(0,1fr)}.trd-section-header{align-items:flex-start}.trd-section-header h2{font-size:18px}.trd-section-header p{max-width:250px}.trd-view-all{padding:8px;font-size:10px}.trd-pending-card{gap:10px;padding:13px}.trd-pending-icon{width:37px;height:37px}.trd-pending-heading{flex-direction:column;gap:7px}.trd-count-pill{align-self:flex-start}.trd-overview{padding:16px}.trd-overview-grid{gap:7px}.trd-overview-item{padding:10px}.trd-overview-item span{font-size:9px}.trd-overview-item strong{font-size:19px}.trd-quick-heading{padding:19px 17px 15px}.trd-quick-links{padding:0 10px 11px}.trd-permissions{padding:17px}.trd-alert{flex-wrap:wrap}.trd-alert-retry{margin-left:45px}.trd-loading-bars{display:none}}
@media(prefers-reduced-motion:reduce){.trd-page *,.trd-page *::before,.trd-page *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
`;
