"use client";



import { useEffect, useMemo, useState } from "react";

import type { ReactNode } from "react";

import { useParams, useRouter } from "next/navigation";

import {

  ArrowLeft,

  CalendarDays,

  CheckCircle2,

  Clock3,

  Eye,

  Hash,

  Layers,

  Mail,

  Phone,

  RefreshCw,

  Users,

} from "lucide-react";



const API_URL =

  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";



type Batch = {

  id: number;

  displayId: string;

  name: string;

  courseId: number;

  trainerId: number | null;

  startDate: string;

  endDate: string;

  mode: string;

  maxStudents: number;

  status: string;

  course: {

    id: number;

    slug: string;

    title: string;

    isActive: boolean;

  } | null;

  trainer: {

    id: number;

    userId: number;

    name: string;

    email: string;

    phone: string | null;

    isActive: boolean;

  } | null;

  studentCount: number;

};



type BatchStudent = {

  id: number;

  studentId: number;

  assignedAt: string;

  completedAt: string | null;

  student: {

    id: number;

    studentId: string;

    name: string;

    email: string;

    phone: string | null;

    isActive: boolean;

  } | null;

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



async function apiFetch(path: string) {

  const token = getToken();



  if (!token) {

    throw new Error("Authentication token not found. Please log in again.");

  }



  const response = await fetch(`${API_URL}${path}`, {

    headers: {

      Authorization: `Bearer ${token}`,

    },

    cache: "no-store",

  });



  const result = await response.json().catch(() => null);



  if (!response.ok) {

    throw new Error(

      result?.message || "Unable to load the requested information."

    );

  }



  return result;

}



function formatDate(value: string | null | undefined) {

  if (!value) return "Not set";



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) return "Not set";



  return new Intl.DateTimeFormat("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

  }).format(date);

}



function formatMode(value: string) {

  const normalized = value?.toUpperCase();



  if (normalized === "ONLINE") return "Online";

  if (normalized === "HYBRID") return "Hybrid";

  return "Offline";

}



function formatStatus(value: string) {

  const normalized = value?.toUpperCase();



  if (normalized === "ACTIVE") return "Active";

  if (normalized === "COMPLETED") return "Completed";

  if (normalized === "INACTIVE") return "Inactive";

  return "Upcoming";

}



function statusClass(value: string) {

  const normalized = value?.toUpperCase();



  if (normalized === "ACTIVE") {

    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

  }



  if (normalized === "COMPLETED") {

    return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

  }



  if (normalized === "INACTIVE") {

    return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

  }



  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

}



export default function TrainerBatchDetailPage() {

  const router = useRouter();

  const params = useParams();



  const batchId = String(params.batchId ?? "");



  const [batch, setBatch] = useState<Batch | null>(null);

  const [students, setStudents] = useState<BatchStudent[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");



  async function loadData(isRefresh = false) {

    try {

      if (isRefresh) {

        setRefreshing(true);

      } else {

        setLoading(true);

      }



      setError("");



      if (!batchId) {

        throw new Error("Batch ID is missing.");

      }



      const [batchResult, studentsResult] = await Promise.all([

        apiFetch(`/trainer/batches/${batchId}`),

        apiFetch(`/trainer/batches/${batchId}/students`),

      ]);



      setBatch(batchResult?.data ?? null);

      setStudents(

        Array.isArray(studentsResult?.data) ? studentsResult.data : []

      );

    } catch (err) {

      console.error("Load trainer batch details error:", err);

      setError(

        err instanceof Error

          ? err.message

          : "Unable to load batch details."

      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }



  useEffect(() => {

    loadData();

  }, [batchId]);



  const visibleStudents = useMemo(

    () => students.filter((assignment) => assignment.student),

    [students]

  );



  function openStudent(studentProfileId: number) {

    router.push(

      `/dashboard/trainer/my-batches/batch-detail/${batchId}/student/${studentProfileId}`

    );

  }



  if (loading) {

    return (

      <main className="tr-page-surface min-h-screen bg-slate-50">

        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-6">

          <div className="text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">

              <RefreshCw size={22} className="animate-spin" />

            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">

              Loading batch...

            </p>

          </div>

        </div>

      <style dangerouslySetInnerHTML={{ __html: trainerBatchUiCss }} />
      </main>

    );

  }



  if (!batch) {

    return (

      <main className="tr-page-surface min-h-screen bg-slate-50 px-6 py-8">

        <div className="tr-page-wrap mx-auto max-w-[1680px]">

          <button

            type="button"

            onClick={() => router.push("/dashboard/trainer/my-batches")}

            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#173B67] hover:text-orange-600"

          >

            <ArrowLeft size={17} />

            Back to My Batches

          </button>



          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">

            <h1 className="text-lg font-bold text-slate-900">

              Unable to load batch

            </h1>

            <p className="mt-2 text-sm text-red-600">

              {error || "Batch not found."}

            </p>

          </div>

        </div>

      <style dangerouslySetInnerHTML={{ __html: trainerBatchUiCss }} />
      </main>

    );

  }



  return (

    <main className="tr-page-surface min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="tr-page-wrap mx-auto max-w-[1680px]">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

          <button

            type="button"

            onClick={() => router.push("/dashboard/trainer/my-batches")}

            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#173B67]"

          >

            <ArrowLeft size={17} />

            Back to My Batches

          </button>



          <button

            type="button"

            onClick={() => loadData(true)}

            disabled={refreshing}

            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#173B67] hover:text-[#173B67] disabled:cursor-not-allowed disabled:opacity-60"

          >

            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />

            Refresh

          </button>

        </div>



        {error ? (

          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {error}

          </div>

        ) : null}



        <section className="tr-page-hero overflow-hidden rounded-2xl bg-[#173B67] shadow-sm">

          <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1fr_auto] lg:px-8">

            <div>

              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-200">

                <Layers size={17} />

                Trainer Portal

              </div>



              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">

                {batch.name}

              </h1>



              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-blue-100">

                <span>{batch.displayId}</span>

                <span>{batch.course?.title || "Course not available"}</span>

                <span>{formatMode(batch.mode)}</span>

              </div>

            </div>



            <div className="min-w-[190px] rounded-xl border border-white/15 bg-white/10 px-5 py-4">

              <p className="text-xs font-medium text-blue-100">

                Students

              </p>

              <p className="mt-1 text-3xl font-bold text-white">

                {visibleStudents.length}

                <span className="ml-1 text-sm font-normal text-blue-100">

                  / {batch.maxStudents}

                </span>

              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">

                <div

                  className="h-full rounded-full bg-orange-400"

                  style={{

                    width: `${Math.min(

                      (visibleStudents.length / Math.max(batch.maxStudents, 1)) *

                        100,

                      100

                    )}%`,

                  }}

                />

              </div>

            </div>

          </div>

        </section>



        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <InfoCard

            icon={<Users size={19} />}

            label="Students"

            value={`${visibleStudents.length} / ${batch.maxStudents}`}

          />

          <InfoCard

            icon={<CalendarDays size={19} />}

            label="Start date"

            value={formatDate(batch.startDate)}

          />

          <InfoCard

            icon={<Clock3 size={19} />}

            label="End date"

            value={formatDate(batch.endDate)}

          />

          <InfoCard

            icon={<CheckCircle2 size={19} />}

            label="Status"

            value={formatStatus(batch.status)}

          />

        </section>



        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>

              <h2 className="text-lg font-bold text-slate-900">

                Batch Information

              </h2>

              <p className="mt-1 text-sm text-slate-500">

                Information for this batch assigned to you.

              </p>

            </div>



            <span

              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(

                batch.status

              )}`}

            >

              {formatStatus(batch.status)}

            </span>

          </div>



          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <Detail label="Batch ID" value={batch.displayId} />

            <Detail

              label="Course"

              value={batch.course?.title || "Not available"}

            />

            <Detail

              label="Trainer"

              value={batch.trainer?.name || "Not assigned"}

            />

            <Detail label="Mode" value={formatMode(batch.mode)} />

          </div>

        </section>



        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">

            <div>

              <h2 className="text-lg font-bold text-slate-900">

                Batch Students

              </h2>

              <p className="mt-1 text-sm text-slate-500">

                Open a student to view their complete learning progress and

                history.

              </p>

            </div>



            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">

              {visibleStudents.length} student

              {visibleStudents.length === 1 ? "" : "s"}

            </span>

          </div>



          {visibleStudents.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">

                <Users size={25} />

              </div>

              <h3 className="mt-4 text-base font-bold text-slate-800">

                No students assigned

              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">

                Students assigned to this batch will appear here.

              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead className="bg-slate-50">

                  <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">

                    <th className="px-6 py-3.5">Student</th>

                    <th className="px-5 py-3.5">Student ID</th>

                    <th className="px-5 py-3.5">Email</th>

                    <th className="px-5 py-3.5">Phone</th>

                    <th className="px-5 py-3.5 text-center">Status</th>

                    <th className="px-6 py-3.5 text-right">Action</th>

                  </tr>

                </thead>



                <tbody>

                  {visibleStudents.map((assignment) => {

                    const student = assignment.student!;



                    return (

                      <tr

                        key={assignment.id}

                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"

                      >

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-sm font-bold text-white">

                              {student.name?.charAt(0).toUpperCase() || "S"}

                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-slate-900">

                                {student.name || "Student"}

                              </p>

                              <p className="text-xs text-slate-400">

                                Assigned {formatDate(assignment.assignedAt)}

                              </p>

                            </div>

                          </div>

                        </td>



                        <td className="px-5 py-4">

                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">

                            <Hash size={14} className="text-orange-500" />

                            {student.studentId || "—"}

                          </span>

                        </td>



                        <td className="max-w-[230px] px-5 py-4">

                          <span className="inline-flex max-w-full items-center gap-1.5 text-sm text-slate-600">

                            <Mail size={14} className="shrink-0 text-slate-400" />

                            <span className="truncate">{student.email || "—"}</span>

                          </span>

                        </td>



                        <td className="px-5 py-4">

                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">

                            <Phone size={14} className="text-slate-400" />

                            {student.phone || "—"}

                          </span>

                        </td>



                        <td className="px-5 py-4 text-center">

                          <span

                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${

                              student.isActive

                                ? "bg-emerald-50 text-emerald-700"

                                : "bg-slate-100 text-slate-500"

                            }`}

                          >

                            {student.isActive ? "Active" : "Inactive"}

                          </span>

                        </td>



                        <td className="px-6 py-4 text-right">

                          <button

                            type="button"

                            onClick={() => openStudent(student.id)}

                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#173B67] shadow-sm transition hover:border-[#173B67] hover:bg-slate-50"

                          >

                            <Eye size={15} />

                            View Details

                          </button>

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    <style dangerouslySetInnerHTML={{ __html: trainerBatchUiCss }} />
      </main>

  );

}



function InfoCard({

  icon,

  label,

  value,

}: {

  icon: ReactNode;

  label: string;

  value: string;

}) {

  return (

    <div className="tr-info-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="tr-info-icon flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">

          {icon}

        </div>

        <div className="min-w-0">

          <p className="text-xs font-medium text-slate-400">{label}</p>

          <p className="mt-0.5 truncate text-sm font-bold text-[#173B67]">

            {value}

          </p>

        </div>

      </div>

    </div>

  );

}



function Detail({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">

      <p className="text-xs font-semibold text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>

    </div>

  );

}

const trainerBatchUiCss = `
@keyframes trDetailGradient{0%{background-position:0% 50%}100%{background-position:100% 50%}}
@keyframes trDetailRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes trDetailShimmer{0%{transform:translateX(-130%) skewX(-18deg)}100%{transform:translateX(280%) skewX(-18deg)}}
.tr-page-surface{box-sizing:border-box;width:100%;min-height:100vh!important;padding:30px clamp(16px,2.5vw,40px) 44px!important;background:var(--bg,#F7F9FC)!important;color:var(--navy,#0F2F5F);isolation:isolate}
.tr-page-surface *{box-sizing:border-box}
.tr-page-wrap{width:100%;max-width:1680px!important;margin:0 auto}
.tr-page-surface h1,.tr-page-surface h2,.tr-page-surface h3{letter-spacing:-.025em}
.tr-page-surface .bg-\[\#173B67\],.tr-page-surface .bg-\[\#173B67\]{background:linear-gradient(120deg,#0F2F5F 0%,#123B6D 48%,#205A98 100%)!important}
.tr-page-surface .rounded-2xl.border,.tr-page-surface .rounded-2xl.bg-white,.tr-page-surface .rounded-2xl.border.bg-white{border-color:#E2E8F1!important;border-radius:16px!important;box-shadow:0 2px 5px rgba(15,47,95,.035),0 8px 24px rgba(15,47,95,.035);transition:transform .24s cubic-bezier(.2,.7,.2,1),box-shadow .24s ease,border-color .24s ease}
.tr-page-surface .rounded-2xl.border.bg-white:hover,.tr-page-surface .rounded-2xl.bg-white:hover{border-color:#C8D8EF!important;box-shadow:0 12px 28px rgba(15,47,95,.09)}
.tr-page-surface .border-slate-200{border-color:#E2E8F1!important}
.tr-page-surface .text-slate-900,.tr-page-surface .text-slate-800{color:#153967!important}
.tr-page-surface .text-slate-700{color:#304967!important}
.tr-page-surface .text-slate-600,.tr-page-surface .text-slate-500{color:#64748B!important}
.tr-page-surface .text-slate-400{color:#8795A9!important}
.tr-page-surface .bg-slate-50{background:#F7F9FC!important}
.tr-page-surface .bg-orange-50{background:#FFF1E6!important}
.tr-page-surface .text-orange-500{color:#F36B08!important}
.tr-page-surface .bg-orange-500{background:#FF6B00!important}
.tr-page-surface .bg-orange-500:hover,.tr-page-surface .hover\:bg-orange-600:hover{background:#E85F00!important}
.tr-page-surface a,.tr-page-surface button{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,background-color .2s ease,color .2s ease}
.tr-page-surface a:focus-visible,.tr-page-surface button:focus-visible{outline:3px solid rgba(37,99,235,.32);outline-offset:3px}
.tr-page-surface .hover\:shadow-md:hover,.tr-page-surface .hover\:shadow-sm:hover{box-shadow:0 12px 28px rgba(15,47,95,.09)!important}
.tr-page-surface table thead{background:#F5F8FC!important}
.tr-page-surface table tbody tr{transition:background .18s ease}
.tr-page-surface table tbody tr:hover{background:#F7FAFE!important}
.tr-page-surface input,.tr-page-surface select,.tr-page-surface textarea{border-color:#D8E2F0;border-radius:10px}
.tr-page-surface .tr-page-hero{position:relative;overflow:hidden;border-radius:18px;background:linear-gradient(120deg,#0F2F5F 0%,#123B6D 45%,#205A98 100%);box-shadow:0 12px 30px rgba(15,47,95,.16)}
.tr-page-surface .tr-page-hero{background:linear-gradient(120deg,#101D3A 0%,#0F2F5F 35%,#17477F 68%,#2563A6 100%);background-size:220% 220%;animation:trDetailRise .55s cubic-bezier(.2,.7,.2,1) both,trDetailGradient 14s ease-in-out infinite alternate}
.tr-page-surface .tr-page-hero::before{content:"";position:absolute;z-index:0;top:-205px;right:-55px;width:430px;height:430px;border:1px solid rgba(255,255,255,.10);border-radius:50%;box-shadow:0 0 0 22px rgba(255,255,255,.035),0 0 0 48px rgba(255,255,255,.03),0 0 0 78px rgba(255,255,255,.025);pointer-events:none}
.tr-page-surface .tr-page-hero>div{position:relative;z-index:1}
.tr-page-surface .tr-info-card{position:relative;overflow:hidden;animation:trDetailRise .48s cubic-bezier(.2,.7,.2,1) both}
.tr-page-surface .tr-info-card::after{content:"";position:absolute;top:0;bottom:0;left:0;width:3px;background:linear-gradient(180deg,#FF9A3D,#FF6B00);opacity:.72;transform:scaleY(.45);transform-origin:center;transition:transform .25s ease,opacity .25s ease}
.tr-page-surface .tr-info-card:hover::after{transform:scaleY(1);opacity:1}
.tr-page-surface .tr-info-icon{background:linear-gradient(135deg,#FFF4EB,#FFE4D0)!important;box-shadow:inset 0 0 0 1px rgba(255,107,0,.04);transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s ease}
.tr-page-surface .tr-info-card:hover .tr-info-icon{transform:translateY(-2px) rotate(-4deg);box-shadow:0 6px 14px rgba(255,107,0,.12)}
.tr-page-surface .tr-page-hero .bg-white\/10{backdrop-filter:blur(10px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09)}
.tr-page-surface .tr-page-hero::after{content:"";position:absolute;bottom:0;left:0;width:18%;height:3px;background:linear-gradient(90deg,#FF6B00,#FFB15E)}
.tr-page-surface .tr-page-kicker{color:#FFD0AA;font-size:11px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
.tr-page-surface .tr-page-summary{border:1px solid #E2E8F1;border-radius:15px;background:#fff;box-shadow:0 3px 14px rgba(15,47,95,.035);transition:transform .22s ease,box-shadow .22s ease}
.tr-page-surface .tr-page-summary:hover{transform:translateY(-3px);box-shadow:0 12px 24px rgba(15,47,95,.08)}
.tr-page-surface .tr-page-action{display:inline-flex;align-items:center;gap:7px;border-radius:10px;background:linear-gradient(180deg,#FF8A12,#FF6B00);padding:9px 13px;color:white;font-size:12px;font-weight:800;text-decoration:none;box-shadow:0 5px 12px rgba(255,107,0,.15)}
.tr-page-surface .tr-page-action:hover{transform:translateY(-2px);box-shadow:0 9px 18px rgba(255,107,0,.24)}
@media(max-width:900px){.tr-page-surface{padding:22px 18px 34px!important}.tr-page-surface .tr-page-wrap{max-width:100%!important}}
@media(max-width:640px){.tr-page-surface{padding:16px 12px 28px!important}.tr-page-surface .rounded-2xl{border-radius:14px!important}.tr-page-surface .tr-page-hero{border-radius:15px}}
@media(max-width:640px){.tr-page-surface .tr-page-hero::before{right:-260px;top:-245px}.tr-page-surface .tr-info-card{animation-delay:0ms}}
@media(prefers-reduced-motion:reduce){.tr-page-surface *,.tr-page-surface *::before,.tr-page-surface *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;
