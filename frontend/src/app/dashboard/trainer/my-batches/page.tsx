"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

type Course = {
  id: number;
  slug: string;
  title: string;
  isActive: boolean;
};

type Batch = {
  id: number;
  displayId: string;
  name: string;
  courseId: number;
  trainerId: number;
  startDate: string;
  endDate: string;
  mode: string;
  maxStudents: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  course: Course | null;
  studentCount: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("accessToken");
}

function normalizeStatus(status?: string): "Active" | "Completed" {
  const value = (status || "").trim().toUpperCase();
  return ["COMPLETED", "COMPLETE", "FINISHED"].includes(value)
    ? "Completed"
    : "Active";
}

function normalizeMode(mode?: string): string {
  const value = (mode || "").trim().toUpperCase();
  if (value === "OFFLINE") return "Offline";
  if (value === "HYBRID") return "Hybrid";
  return "Online";
}

function formatDate(value?: string): string {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStudentCount(batch: Batch): number {
  const count = Number(batch.studentCount);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export default function MyBatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadBatches() {
      setLoading(true);
      setError("");

      try {
        const token = getToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(`${API_URL}/trainer/batches`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Unable to load trainer batches.");
        }

        if (!cancelled) {
          setBatches(Array.isArray(result?.data) ? result.data : []);
        }
      } catch (err) {
        console.error("Load trainer batches error:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load trainer batches."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBatches();
    return () => {
      cancelled = true;
    };
  }, [router, refreshKey]);

  const summary = useMemo(() => {
    const active = batches.filter((batch) => normalizeStatus(batch.status) === "Active").length;
    const completed = batches.filter((batch) => normalizeStatus(batch.status) === "Completed").length;
    const students = batches.reduce((total, batch) => total + getStudentCount(batch), 0);
    return { total: batches.length, active, completed, students };
  }, [batches]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  return (
    <main className="tr-batches-page">
      <div className="tr-batches-container">
        <section className="tr-batches-hero">
          <div className="tr-batches-rings" aria-hidden="true" />
          <div className="tr-batches-orb" aria-hidden="true" />
          <div className="tr-batches-hero-content">
            <div className="tr-batches-hero-copy">
              <div className="tr-batches-kicker">
                <span className="tr-batches-hero-icon"><GraduationCap size={21} /></span>
                <span>Trainer Workspace</span>
              </div>
              <h1>My Batches</h1>
              <p>Manage your assigned training batches, review student capacity, and open a batch to track learner progress.</p>
              <div className="tr-batches-pills">
                <span className="tr-batches-pill"><ShieldCheck size={15} />Trainer portal</span>
                <span className="tr-batches-pill"><Layers size={15} />{loading ? "Loading batches" : `${summary.total} assigned ${summary.total === 1 ? "batch" : "batches"}`}</span>
              </div>
            </div>
            <div className="tr-batches-hero-count">
              <span className="tr-batches-count-label">Active batches</span>
              <strong>{loading ? "—" : summary.active}</strong>
              <span className="tr-batches-count-foot">{loading ? "Updating your workspace" : `${summary.students} ${summary.students === 1 ? "student" : "students"} across your batches`}</span>
            </div>
          </div>
          <div className="tr-batches-hero-accent" />
        </section>

        <div className="tr-batches-toolbar">
          <div>
            <h2>Training overview</h2>
            <p>Your assigned batches at a glance.</p>
          </div>
          <button type="button" className="tr-batches-refresh" onClick={refresh} disabled={loading}>
            <RefreshCw size={15} className={loading ? "tr-batches-spin" : ""} /> Refresh
          </button>
        </div>

        <section className="tr-batches-stats" aria-label="Batch statistics">
          <SummaryCard icon={<Layers size={20} />} value={loading ? "—" : summary.total} label="Total Batches" index={0} />
          <SummaryCard icon={<GraduationCap size={20} />} value={loading ? "—" : summary.active} label="Active Batches" index={1} />
          <SummaryCard icon={<Clock3 size={20} />} value={loading ? "—" : summary.completed} label="Completed Batches" index={2} />
          <SummaryCard icon={<Users size={20} />} value={loading ? "—" : summary.students} label="Total Students" index={3} />
        </section>

        {error && (
          <section className="tr-batches-error" role="alert">
            <AlertCircle size={21} />
            <div className="tr-batches-error-copy"><h2>Unable to load batches</h2><p>{error}</p></div>
            <button type="button" className="tr-batches-retry" onClick={refresh}>Try again</button>
          </section>
        )}

        {!error && loading && (
          <section className="tr-batches-list" aria-label="Loading batches" aria-busy="true">
            {[0, 1].map((item) => (
              <div className="tr-batch-skeleton" key={item}>
                <div className="tr-skeleton-heading"><span className="tr-skeleton-icon" /><div><span className="tr-skeleton-line short" /><span className="tr-skeleton-line" /><span className="tr-skeleton-line medium" /></div></div>
                <span className="tr-skeleton-divider" /><span className="tr-skeleton-line medium" /><span className="tr-skeleton-line short" />
              </div>
            ))}
          </section>
        )}

        {!loading && !error && batches.length === 0 && (
          <section className="tr-batches-empty">
            <span className="tr-batches-empty-icon"><Layers size={26} /></span>
            <h2>No batches assigned</h2>
            <p>You currently do not have any training batches assigned to your trainer profile.</p>
            <button type="button" className="tr-batches-retry" onClick={refresh}><RefreshCw size={14} /> Refresh batches</button>
          </section>
        )}

        {!loading && !error && batches.length > 0 && (
          <section className="tr-batches-results">
            <div className="tr-batches-results-heading">
              <div><h2>Assigned batches</h2><p>Select a batch to view its students and details.</p></div>
              <span className="tr-batches-results-count">{batches.length} {batches.length === 1 ? "batch" : "batches"}</span>
            </div>

            <div className="tr-batches-list">
              {batches.map((batch, index) => {
                const status = normalizeStatus(batch.status);
                const studentCount = getStudentCount(batch);
                const capacity = Math.max(0, Number(batch.maxStudents) || 0);
                const capacityPercent = capacity > 0 ? Math.min(100, Math.round((studentCount / capacity) * 100)) : 0;
                const courseName = batch.course?.title || "Course not available";

                return (
                  <article className="tr-batch-card" key={batch.id} style={{ "--batch-index": index } as React.CSSProperties}>
                    <div className="tr-batch-card-top">
                      <span className="tr-batch-card-icon"><Layers size={21} /></span>
                      <span className={`tr-batch-status ${status === "Active" ? "is-active" : "is-completed"}`}><span />{status}</span>
                    </div>
                    <div className="tr-batch-identity">
                      <span className="tr-batch-code">{batch.displayId || `BATCH-${batch.id}`}</span>
                      <h3>{batch.name || "Untitled batch"}</h3>
                      <p>{courseName}</p>
                    </div>
                    <div className="tr-batch-capacity">
                      <div className="tr-batch-capacity-label"><span>Student capacity</span><strong>{studentCount}{capacity > 0 ? ` / ${capacity}` : ""}</strong></div>
                      <div className="tr-batch-progress-track" role="progressbar" aria-label="Student capacity" aria-valuemin={0} aria-valuemax={capacity || 100} aria-valuenow={capacity > 0 ? Math.min(studentCount, capacity) : 0}>
                        <span style={{ width: `${capacityPercent}%` }} />
                      </div>
                    </div>
                    <div className="tr-batch-details">
                      <DetailItem icon={<Users size={15} />} label="Students" value={`${studentCount} ${studentCount === 1 ? "student" : "students"}`} />
                      <DetailItem icon={<GraduationCap size={15} />} label="Mode" value={normalizeMode(batch.mode)} />
                      <DetailItem icon={<CalendarDays size={15} />} label="Start date" value={formatDate(batch.startDate)} />
                      <DetailItem icon={<Clock3 size={15} />} label="End date" value={formatDate(batch.endDate)} />
                    </div>
                    <div className="tr-batch-card-footer">
                      <span className="tr-batch-course-label"><CheckCircle2 size={14} /> Training batch</span>
                      <Link href={`/dashboard/trainer/my-batches/batch-detail/${encodeURIComponent(String(batch.id))}`} className="tr-batch-view">View batch <ArrowRight size={15} /></Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <style jsx global>{`
        .tr-batches-page{--tb-navy:#0f2f5f;--tb-orange:#ff6b00;--tb-line:#e1e8f2;--tb-muted:#71839e;width:100%;min-height:100vh;padding:18px 24px 36px;background:#f5f8fc;color:var(--tb-navy);box-sizing:border-box}
        .tr-batches-page *,.tr-batches-page *:before,.tr-batches-page *:after{box-sizing:border-box}
        .tr-batches-container{width:100%;max-width:1280px!important;margin:0 auto!important}
        .tr-batches-hero{position:relative;isolation:isolate;overflow:hidden;min-height:140px;margin-bottom:22px;border-radius:20px;color:#fff;background:linear-gradient(118deg,#102f5c 0%,#173f73 43%,#18539a 76%,#123663 100%);background-size:220% 220%;box-shadow:0 15px 34px rgba(15,47,95,.14);animation:tb-gradient 14s ease-in-out infinite alternate,tb-enter .5s cubic-bezier(.2,.7,.2,1) both}
        .tr-batches-hero-content{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:22px;min-height:140px;padding:14px 28px 17px}
        .tr-batches-hero-copy{min-width:0;flex:1}.tr-batches-kicker{display:flex;align-items:center;gap:10px;margin-bottom:5px;color:#ffd0aa;font-size:11px;font-weight:850;letter-spacing:.14em;text-transform:uppercase}
        .tr-batches-hero-icon{display:inline-flex;width:36px;height:36px;flex:0 0 auto;align-items:center;justify-content:center;border:1px solid #ffffff33;border-radius:13px;color:#ff9a3d;background:#ffffff12}
        .tr-batches-hero h1{margin:0;color:#fff;font-size:clamp(26px,2.2vw,31px);font-weight:850;letter-spacing:-.045em;line-height:1.08}
        .tr-batches-hero-copy>p{max-width:720px;margin:4px 0 0;color:#d7e5f8;font-size:12px;line-height:1.45}
        .tr-batches-pills{display:none;flex-wrap:wrap;gap:8px;margin-top:8px}.tr-batches-pill{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border:1px solid #ffffff33;border-radius:999px;color:#f8fbff;background:#ffffff12;font-size:11px;font-weight:750;backdrop-filter:blur(8px)}
        .tr-batches-hero-count{display:flex;width:180px;min-width:160px;flex-direction:column;gap:5px;padding:11px 15px;border:1px solid #ffffff33;border-radius:17px;background:linear-gradient(145deg,#ffffff29,#ffffff12);backdrop-filter:blur(12px);animation:tb-float 5s ease-in-out infinite}
        .tr-batches-count-label{color:#d5e5fb;font-size:10px;font-weight:650}.tr-batches-hero-count strong{color:#fff;font-size:30px;font-weight:850;letter-spacing:-.04em;line-height:1}.tr-batches-count-foot{color:#d5e5fb;font-size:10px;line-height:1.4}
        .tr-batches-rings{position:absolute;z-index:0;top:-235px;right:7%;width:450px;height:450px;border:1px solid #ffffff12;border-radius:50%;box-shadow:0 0 0 26px #ffffff08,0 0 0 52px #ffffff06,0 0 0 78px #ffffff05;pointer-events:none}
        .tr-batches-orb{position:absolute;z-index:0;right:-65px;bottom:-185px;width:290px;height:290px;border:1px solid #ffffff1f;border-radius:50%;background:radial-gradient(circle at 35% 30%,#4b91e233,transparent 68%);pointer-events:none;animation:tb-float 8s ease-in-out infinite reverse}
        .tr-batches-hero-accent{position:absolute;z-index:3;bottom:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,#ff6b00 0%,#ff8a12 18%,#ffffff30 18%,#ffffff0a 100%)}
        .tr-batches-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:15px}.tr-batches-toolbar h2,.tr-batches-results-heading h2{margin:0;color:var(--tb-navy);font-size:17px;font-weight:850;letter-spacing:-.025em}.tr-batches-toolbar p,.tr-batches-results-heading p{margin:4px 0 0;color:var(--tb-muted);font-size:12px;line-height:1.6}
        .tr-batches-refresh,.tr-batches-retry{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:38px;padding:8px 12px;border:1px solid #dce5f1;border-radius:10px;color:#1459b8;background:#fff;font-size:12px;font-weight:750;cursor:pointer;transition:transform .2s,box-shadow .2s}.tr-batches-refresh:hover,.tr-batches-retry:hover{transform:translateY(-2px);box-shadow:0 7px 18px #0f2f5f14}.tr-batches-refresh:disabled{opacity:.6;cursor:wait}
        .tr-batches-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:27px}.tr-batches-stat{display:flex;min-width:0;align-items:center;gap:12px;padding:16px 15px;border:1px solid var(--tb-line);border-radius:15px;background:#fff;box-shadow:0 3px 12px #0f2f5f08;animation:tb-enter .45s ease both;animation-delay:calc(var(--stat-index,0)*55ms);transition:transform .22s,box-shadow .22s}.tr-batches-stat:hover{transform:translateY(-3px);box-shadow:0 10px 23px #0f2f5f12}
        .tr-batches-stat-icon{display:flex;width:43px;height:43px;flex:0 0 auto;align-items:center;justify-content:center;border:1px solid #ffe6d4;border-radius:13px;color:var(--tb-orange);background:linear-gradient(135deg,#fff5ed,#ffe8d8)}.tr-batches-stat-value{color:var(--tb-navy);font-size:26px;font-weight:850;letter-spacing:-.04em;line-height:1.1}.tr-batches-stat-label{margin-top:4px;color:var(--tb-muted);font-size:11px;font-weight:600;line-height:1.4}
        .tr-batches-results-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.tr-batches-results-count{padding:6px 10px;border:1px solid #dce7f6;border-radius:999px;color:#24558d;background:#edf4ff;font-size:11px;font-weight:750;white-space:nowrap}
        .tr-batches-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch;gap:14px}.tr-batch-card{position:relative;display:flex;min-width:0;flex-direction:column;padding:19px;border:1px solid var(--tb-line);border-radius:16px;background:#fff;box-shadow:0 3px 12px #0f2f5f08;animation:tb-enter .45s ease both;animation-delay:calc(var(--batch-index,0)*60ms);transition:transform .24s,border-color .24s,box-shadow .24s}.tr-batch-card:before{position:absolute;top:0;right:16px;left:16px;height:3px;border-radius:0 0 4px 4px;background:linear-gradient(90deg,#ff6b00,#ffb15e);content:"";opacity:0;transition:opacity .2s}.tr-batch-card:hover{transform:translateY(-3px);border-color:#c6d7ef;box-shadow:0 12px 26px #0f2f5f12}.tr-batch-card:hover:before{opacity:1}
        .tr-batch-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}.tr-batch-card-icon{display:inline-flex;width:43px;height:43px;flex:0 0 auto;align-items:center;justify-content:center;border-radius:13px;color:var(--tb-orange);background:linear-gradient(135deg,#fff4eb,#ffe6d5);transition:transform .22s}.tr-batch-card:hover .tr-batch-card-icon{transform:rotate(-5deg)}.tr-batch-status{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap}.tr-batch-status>span{width:7px;height:7px;border-radius:50%;background:currentColor}.tr-batch-status.is-active{color:#128342;background:#eaf9ef}.tr-batch-status.is-completed{color:#617087;background:#eff3f8}
        .tr-batch-code{display:inline-block;max-width:100%;overflow:hidden;color:#8495af;font-size:10px;font-weight:800;letter-spacing:.055em;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}.tr-batch-identity h3{margin:5px 0 0;overflow-wrap:anywhere;color:var(--tb-navy);font-size:18px;font-weight:850;letter-spacing:-.03em;line-height:1.3}.tr-batch-identity p{margin:5px 0 0;overflow-wrap:anywhere;color:var(--tb-muted);font-size:12px;line-height:1.5}
        .tr-batch-capacity{margin-top:16px;padding:12px;border:1px solid #edf1f7;border-radius:11px;background:#f9fbfe}.tr-batch-capacity-label{display:flex;align-items:center;justify-content:space-between;gap:9px;color:var(--tb-muted);font-size:11px}.tr-batch-capacity-label strong{color:var(--tb-navy);font-size:12px;font-weight:850}.tr-batch-progress-track{height:5px;margin-top:9px;overflow:hidden;border-radius:999px;background:#e4ebf5}.tr-batch-progress-track>span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#ff6b00,#ff9a3d);transition:width .45s}
        .tr-batch-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 10px;margin-top:17px}.tr-batch-detail{display:flex;min-width:0;align-items:flex-start;gap:8px}.tr-batch-detail-icon{display:flex;width:28px;height:28px;flex:0 0 auto;align-items:center;justify-content:center;border-radius:8px;color:#35639b;background:#edf4ff}.tr-batch-detail-copy{min-width:0}.tr-batch-detail-label{color:#8a9ab1;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.tr-batch-detail-value{margin-top:4px;overflow-wrap:anywhere;color:#244568;font-size:11px;font-weight:750;line-height:1.45}
        .tr-batch-card-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;padding-top:16px;border-top:1px solid #edf1f7;margin-top:17px}.tr-batch-course-label{display:inline-flex;min-width:0;align-items:center;gap:5px;color:#7789a2;font-size:10px;font-weight:700}.tr-batch-course-label svg{flex:0 0 auto;color:#198754}.tr-batch-view{display:inline-flex;min-height:35px;flex:0 0 auto;align-items:center;justify-content:center;gap:7px;padding:8px 11px;border-radius:9px;color:#fff;background:linear-gradient(180deg,#ff8a12,#ff6b00);box-shadow:0 4px 10px #ff6b0026;font-size:11px;font-weight:800;text-decoration:none;transition:transform .2s,box-shadow .2s}.tr-batch-view:hover{transform:translateY(-2px);box-shadow:0 8px 16px #ff6b003d}.tr-batch-view svg{transition:transform .2s}.tr-batch-view:hover svg{transform:translateX(3px)}
        .tr-batches-error{display:flex;align-items:flex-start;gap:12px;margin-bottom:22px;padding:16px;border:1px solid #fecaca;border-radius:14px;color:#dc2626;background:#fff5f5}.tr-batches-error-copy{flex:1;min-width:0}.tr-batches-error h2{margin:0;color:#991b1b;font-size:13px;font-weight:800}.tr-batches-error p{margin:5px 0 0;color:#b91c1c;font-size:12px;line-height:1.6;overflow-wrap:anywhere}
        .tr-batches-empty{padding:42px 22px;border:1px dashed #cad6e6;border-radius:17px;background:#fff;text-align:center;animation:tb-enter .4s ease both}.tr-batches-empty-icon{display:inline-flex;width:55px;height:55px;align-items:center;justify-content:center;border-radius:16px;color:var(--tb-orange);background:#fff0e4}.tr-batches-empty h2{margin:15px 0 0;color:var(--tb-navy);font-size:19px;font-weight:850}.tr-batches-empty p{max-width:420px;margin:8px auto 17px;color:var(--tb-muted);font-size:12px;line-height:1.8}
        .tr-batch-skeleton{display:flex;min-width:0;flex-direction:column;gap:16px;padding:19px;border:1px solid var(--tb-line);border-radius:16px;background:#fff}.tr-skeleton-heading{display:flex;align-items:center;gap:12px}.tr-skeleton-heading>div{display:flex;flex:1;flex-direction:column;gap:8px}.tr-skeleton-icon,.tr-skeleton-line,.tr-skeleton-divider{display:block;background:linear-gradient(100deg,#e9eef6 20%,#f7f9fc 45%,#e9eef6 70%);background-size:220% 100%;animation:tb-shimmer 1.4s linear infinite}.tr-skeleton-icon{width:43px;height:43px;flex:0 0 auto;border-radius:13px}.tr-skeleton-line{width:85%;height:11px;border-radius:6px}.tr-skeleton-line.short{width:42%}.tr-skeleton-line.medium{width:62%}.tr-skeleton-divider{width:100%;height:1px}.tr-batches-spin{animation:tb-spin .8s linear infinite}
        .tr-batches-page button:focus-visible,.tr-batches-page a:focus-visible{outline:3px solid #2563eb55;outline-offset:3px}
        @keyframes tb-gradient{from{background-position:0% 50%}to{background-position:100% 50%}}@keyframes tb-enter{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}@keyframes tb-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes tb-shimmer{from{background-position:100% 0}to{background-position:-120% 0}}@keyframes tb-spin{to{transform:rotate(360deg)}}
        @media(max-width:1100px){.tr-batches-container{max-width:100%!important}.tr-batches-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.tr-batches-hero-content{gap:16px;padding:19px 22px 21px}.tr-batches-hero-count{width:175px;min-width:155px}}
        @media(max-width:760px){.tr-batches-page{padding:18px 15px 32px}.tr-batches-list{grid-template-columns:minmax(0,1fr)}.tr-batches-hero-content{align-items:stretch;flex-direction:column;gap:11px;padding:16px 20px 18px}.tr-batches-pills{display:flex}.tr-batches-hero-count{width:100%;min-width:0;padding:10px 13px}.tr-batches-hero-count strong{font-size:27px}.tr-batches-hero{min-height:0}.tr-batches-hero-content{min-height:0}.tr-batches-rings{right:-190px}}
        @media(max-width:480px){.tr-batches-page{padding:14px 10px 25px}.tr-batches-hero{border-radius:16px;margin-bottom:20px}.tr-batches-hero-content{padding:15px 15px 17px}.tr-batches-hero h1{font-size:28px}.tr-batches-hero-copy>p{font-size:12px}.tr-batches-pills{gap:7px}.tr-batches-pill{padding:7px 9px;font-size:10px}.tr-batches-toolbar h2,.tr-batches-results-heading h2{font-size:15px}.tr-batches-stats{gap:9px;margin-bottom:22px}.tr-batches-stat{gap:9px;padding:12px 10px;border-radius:13px}.tr-batches-stat-icon{width:36px;height:36px;border-radius:10px}.tr-batches-stat-value{font-size:22px}.tr-batches-stat-label{font-size:10px}.tr-batch-card{padding:16px 14px}.tr-batch-details{gap:13px 7px}.tr-batch-view{padding:8px 9px;font-size:10px}}
        @media(prefers-reduced-motion:reduce){.tr-batches-page *,.tr-batches-page *:before,.tr-batches-page *:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
      `}</style>
    </main>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  index,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  index: number;
}) {
  return (
    <article className="tr-batches-stat" style={{ "--stat-index": index } as React.CSSProperties}>
      <span className="tr-batches-stat-icon">{icon}</span>
      <div className="tr-batches-stat-copy">
        <div className="tr-batches-stat-value">{value}</div>
        <div className="tr-batches-stat-label">{label}</div>
      </div>
    </article>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="tr-batch-detail">
      <span className="tr-batch-detail-icon">{icon}</span>
      <div className="tr-batch-detail-copy">
        <div className="tr-batch-detail-label">{label}</div>
        <div className="tr-batch-detail-value">{value}</div>
      </div>
    </div>
  );
}
