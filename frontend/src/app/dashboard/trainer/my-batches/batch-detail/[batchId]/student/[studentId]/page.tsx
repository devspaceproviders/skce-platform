"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  X,
  Award,
  BookOpen,
  CalendarDays,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  RefreshCw,
  UserRound,
} from "lucide-react";
import {
  AdminPageHeader,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_LIGHT,
} from "@/components/dashboard/admin/AdminPageHeader";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type Lesson = {
  lessonId?: number;
  lessonTitle?: string;
  sortOrder?: number;
  status?: string;
  startedAt?: string | null;
  completedAt?: string | null;
};
type Module = {
  moduleId?: number;
  moduleTitle?: string;
  sortOrder?: number;
  lessons?: Lesson[];
};
type Course = {
  courseId?: number;
  courseTitle?: string;
  totalModules?: number;
  totalLessons?: number;
  completedLessons?: number;
  remainingLessons?: number;
  progressPercentage?: number;
  modules?: Module[];
  assessments?: Assessment[];
};
type Assessment = {
  id?: number;
  assessmentId?: number;
  title?: string;
  type?: string;
  courseId?: number;
  courseTitle?: string;
  totalMarks?: number | null;
  dueAt?: string | null;
  submissionStatus?: string | null;
  score?: number | null;
  submittedAt?: string | null;
  createdByUserId?: number | null;
  createdByName?: string | null;
  createdByRole?: string | null;
  latestSubmission?: {
    score?: number | null;
    status?: string | null;
    submittedAt?: string | null;
  } | null;
};
type Certificate = {
  id?: number;
  certificateNumber?: string;
  certificateType?: string;
  courseId?: number | null;
  courseTitle?: string;
  issuedAt?: string;
  certificateUrl?: string | null;
};
type Student = {
  studentId?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  profilePhotoUrl?: string | null;
  isActive?: boolean;
  state?: string | null;
  city?: string | null;
};
type Meeting = {
  id?: number;
  title?: string;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  meetingUrl?: string | null;
  meetingPlatform?: string | null;
  meetingType?: string | null;
  status?: string | null;
  course?: {
    id?: number;
    title?: string;
  } | null;
  batch?: {
    id?: number;
    name?: string;
  } | null;
  organizer?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};
type StudentData = {
  student?: Student;
  progress?: {
    summary?: {
      totalCourses?: number;
      completedCourses?: number;
      totalLessons?: number;
      completedLessons?: number;
      averageProgress?: number;
      totalAssessments?: number;
      attemptedAssessments?: number;
      totalCertificates?: number;
    };
    courseProgress?: Course[];
    assessments?: Assessment[];
    certificates?: Certificate[];
  };
  meetings?: Meeting[];
  batch?: {
    id?: number;
    assignedAt?: string;
    completedAt?: string | null;
  };
};
type Tab = "overview" | "progress" | "assessments" | "meetings" | "certificates";
function getToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}
async function apiFetch(
  path: string,
  router: ReturnType<typeof useRouter>
) {
  const token = getToken();
  if (!token) {
    router.push("/login");
    throw new Error("Authentication required");
  }
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("accessToken");
    router.push("/login");
    throw new Error("Authentication required");
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || "Unable to load student information."
    );
  }
  return result;
}
function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
function formatDateTime(value?: string | null) {
  if (!value) return "Not submitted";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
function prettyStatus(value?: string | null) {
  if (!value) return "Not Submitted";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function statusClass(value?: string | null) {
  const normalized = String(value || "").toUpperCase();
  if (
    normalized === "COMPLETED" ||
    normalized === "GRADED" ||
    normalized === "SUBMITTED"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (normalized === "IN_PROGRESS" || normalized === "PENDING") {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-slate-100 text-slate-600";
}
export default function TrainerStudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = String(params.batchId ?? "");
  const studentId = String(params.studentId ?? "");
  const [data, setData] = useState<StudentData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [openModules, setOpenModules] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  async function loadStudent(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");
      if (!batchId || !studentId) {
        throw new Error("Batch or student ID is missing.");
      }
      const result = await apiFetch(
        `/trainer/batches/${batchId}/students/${studentId}`,
        router
      );
      setData(result?.data ?? null);
    } catch (err) {
      console.error("Load trainer student details error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load student details."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  useEffect(() => {
    void loadStudent();
  }, [batchId, studentId]);
  const courses = data?.progress?.courseProgress ?? [];
  const assessments =
    data?.progress?.assessments ??
    courses.flatMap((course) => course.assessments ?? []);
  const certificates = data?.progress?.certificates ?? [];
  const meetings = data?.meetings ?? [];
  const certificateRows = useMemo(
    () =>
      certificates.filter(
        (certificate) =>
          certificate.courseId != null &&
          courses.some(
            (course) =>
              Number(course.courseId) ===
              Number(certificate.courseId)
          )
      ),
    [certificates, courses]
  );
  const overallProgress = Math.round(
    Number(data?.progress?.summary?.averageProgress ?? 0)
  );
  const [assessmentQuery, setAssessmentQuery] = useState("");
  const [assessmentType, setAssessmentType] = useState("ALL");
  const [assessmentStatus, setAssessmentStatus] = useState("ALL");
  const filteredAssessments = assessments.filter((assessment) => {
    const status =
      assessment.latestSubmission?.status ?? assessment.submissionStatus ?? "NOT_SUBMITTED";
    if (assessmentType !== "ALL" && String(assessment.type ?? "").toUpperCase() !== assessmentType) return false;
    if (assessmentStatus !== "ALL" && String(status).toUpperCase() !== assessmentStatus) return false;
    const needle = assessmentQuery.trim().toLowerCase();
    if (!needle) return true;
    return [assessment.title, assessment.courseTitle, assessment.createdByName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });
  const assessmentFiltersOn =
    assessmentQuery.trim() !== "" || assessmentType !== "ALL" || assessmentStatus !== "ALL";

  function toggleModule(moduleId: number) {
    setOpenModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }
  if (loading) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2
              size={30}
              className="mx-auto animate-spin text-orange-500"
            />
            <p className="mt-3 text-sm text-slate-500">
              Loading student information...
            </p>
          </div>
        </div>
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/trainer/my-batches/batch-detail/${batchId}`
              )
            }
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#173B67]"
          >
            <ArrowLeft size={17} />
            Back to Batch
          </button>
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-lg font-bold text-slate-900">
              Unable to load student
            </h1>
            <p className="mt-2 text-sm text-red-600">
              {error || "Student details were not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }
  const student = data.student ?? {};
  return (
    <main className="tr-student-page min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1680px]">
        <AdminPageHeader
          label="Trainer Portal  ·  Student"
          icon={UserRound}
          title={
            <span className="inline-flex items-center gap-3">
              {student.profilePhotoUrl ? (
                <img
                  src={student.profilePhotoUrl}
                  alt={student.name || "Student"}
                  className="h-9 w-9 shrink-0 rounded-full border border-white/30 object-cover"
                />
              ) : null}
              <span>{student.name || "Student"}</span>
            </span>
          }
          subtitle={[`Student ID: ${student.studentId || "—"}`, student.email || "—", student.phone || ""]
            .filter(Boolean)
            .join("  •  ")}
          chips={[{ label: "Responsible course progress", value: `${overallProgress}%` }]}
          actions={
            <>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/trainer/my-batches/batch-detail/${batchId}`
                  )
                }
                className={ADMIN_BTN_GHOST}
              >
                <ArrowLeft size={17} />
                Back to Batch Students
              </button>
              <button
                type="button"
                onClick={() => void loadStudent(true)}
                disabled={refreshing}
                className={ADMIN_BTN_LIGHT}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </>
          }
        />
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Responsible Course Progress</span>
            <strong className="text-[#173B67]">{overallProgress}%</strong>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1459B8] to-[#F97316]"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Based only on courses you are responsible for.
          </p>
        </section>
        <div className="tr-student-tabs mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-max">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              label="Overview"
              icon={<UserRound size={16} />}
            />
            <TabButton
              active={activeTab === "progress"}
              onClick={() => setActiveTab("progress")}
              label="Learning Progress"
              icon={<BookOpen size={16} />}
            />
            <TabButton
              active={activeTab === "assessments"}
              onClick={() => setActiveTab("assessments")}
              label="Assessment History"
              icon={<FileText size={16} />}
            />
            <TabButton
              active={activeTab === "meetings"}
              onClick={() => setActiveTab("meetings")}
              label="Meetings"
              icon={<CalendarDays size={16} />}
            />
            <TabButton
              active={activeTab === "certificates"}
              onClick={() => setActiveTab("certificates")}
              label="Certificates"
              icon={<Award size={16} />}
            />
          </div>
        </div>
        {activeTab === "overview" ? (
          <section className="tr-student-overview mt-5 grid gap-5 sm:grid-cols-2">
            <InfoCard
              label="Student ID"
              value={student.studentId}
            />
            <InfoCard
              label="Email"
              value={student.email}
            />
            <InfoCard
              label="Phone"
              value={student.phone}
            />
            <InfoCard
              label="Status"
              value={student.isActive ? "Active" : "Inactive"}
            />
            <InfoCard
              label="State"
              value={student.state}
            />
            <InfoCard
              label="City"
              value={student.city}
            />
            <InfoCard
              label="Batch Assigned"
              value={formatDate(data.batch?.assignedAt)}
            />
            <InfoCard
              label="Batch Completed"
              value={
                data.batch?.completedAt
                  ? formatDate(data.batch.completedAt)
                  : "Not completed"
              }
            />
          </section>
        ) : null}
        {activeTab === "progress" ? (
          <section className="mt-5 space-y-5">
            {courses.length === 0 ? (
              <Empty
                title="No responsible courses found"
                text="This student has no enrolled course currently assigned to you."
              />
            ) : (
              courses.map((course) => (
                <CourseProgressCard
                  key={course.courseId}
                  course={course}
                  openModules={openModules}
                  onToggleModule={toggleModule}
                />
              ))
            )}
          </section>
        ) : null}
        {activeTab === "assessments" ? (
          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Assessment History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Assessments belonging only to your responsible courses.
              </p>
            </div>
            {assessments.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                <label className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 focus-within:border-[#173B67] focus-within:ring-2 focus-within:ring-orange-200">
                  <Search size={15} aria-hidden="true" />
                  <input
                    type="search"
                    value={assessmentQuery}
                    onChange={(event) => setAssessmentQuery(event.target.value)}
                    placeholder="Search assessment, course or creator"
                    aria-label="Search assessments"
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none"
                  />
                </label>
                <select
                  value={assessmentType}
                  onChange={(event) => setAssessmentType(event.target.value)}
                  aria-label="Filter by type"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#173B67]"
                >
                  <option value="ALL">All types</option>
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="QUIZ">Quiz</option>
                </select>
                <select
                  value={assessmentStatus}
                  onChange={(event) => setAssessmentStatus(event.target.value)}
                  aria-label="Filter by status"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#173B67]"
                >
                  <option value="ALL">All statuses</option>
                  <option value="NOT_SUBMITTED">Not submitted</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="GRADED">Graded</option>
                </select>
                {assessmentFiltersOn ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAssessmentQuery("");
                      setAssessmentType("ALL");
                      setAssessmentStatus("ALL");
                    }}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 text-xs font-bold text-orange-700 hover:bg-orange-100"
                  >
                    <X size={14} /> Clear filters
                  </button>
                ) : null}
              </div>
            ) : null}
            {assessments.length === 0 ? (
              <Empty
                title="No assessments found"
                text="There are no assessment records for your responsible courses."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Assessment</th>
                      <th className="px-5 py-3">Course</th>
                      <th className="px-5 py-3">Created By</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Submission</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessments.map((assessment) => {
                      const submission =
                        assessment.latestSubmission;
                      const status =
                        submission?.status ??
                        assessment.submissionStatus;
                      const score =
                        submission?.score ??
                        assessment.score;
                      return (
                        <tr
                          key={
                            assessment.id ??
                            assessment.assessmentId
                          }
                          className="border-t border-slate-100"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {assessment.title || "Assessment"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Due{" "}
                              {formatDate(
                                assessment.dueAt
                              )}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {assessment.courseTitle || "Course"}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-700">
                              {assessment.createdByName || "Not available"}
                            </p>
                            {assessment.createdByRole ? (
                              <p className="mt-1 text-xs text-slate-400">
                                {prettyStatus(assessment.createdByRole)}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {prettyStatus(assessment.type)}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatDateTime(
                              submission?.submittedAt ??
                                assessment.submittedAt
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                            {score != null
                              ? `${score} / ${
                                  assessment.totalMarks ?? "—"
                                }`
                              : "—"}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                status
                              )}`}
                            >
                              {prettyStatus(status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {filteredAssessments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                          No assessments match the current filters.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
        {activeTab === "meetings" ? (
          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Student Meetings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Meetings related to this student through the assigned batch or direct participation.
              </p>
            </div>
            {meetings.length === 0 ? (
              <Empty
                title="No meetings found"
                text="There are no meetings currently associated with this student."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex flex-wrap items-start justify-between gap-5 px-5 py-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#173B67]">
                        <CalendarDays size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {meeting.title || "Meeting"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDateTime(meeting.startAt)}
                          {meeting.endAt ? ` – ${formatDateTime(meeting.endAt)}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          {meeting.course?.title ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {meeting.course.title}
                            </span>
                          ) : null}
                          {meeting.batch?.name ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {meeting.batch.name}
                            </span>
                          ) : null}
                          {meeting.meetingType ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {prettyStatus(meeting.meetingType)}
                            </span>
                          ) : null}
                          {meeting.meetingPlatform ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {prettyStatus(meeting.meetingPlatform)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Scheduled By: {meeting.organizer?.name || "Not available"}
                          {meeting.organizer?.role ? ` · ${prettyStatus(meeting.organizer.role)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(meeting.status)}`}>
                        {prettyStatus(meeting.status)}
                      </span>
                      {meeting.meetingUrl ? (
                        <a
                          href={meeting.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#173B67] px-3 py-2 text-xs font-semibold text-white hover:bg-[#123052]"
                        >
                          <ExternalLink size={14} />
                          Join Meeting
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
        {activeTab === "certificates" ? (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Certificates Issued
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Certificates related only to courses you are responsible for.
              </p>
            </div>
            {certificateRows.length === 0 ? (
              <Empty
                title="No certificates found"
                text="No certificate has been issued for your responsible courses."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {certificateRows.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <Award size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {certificate.courseTitle ||
                            "Course Certificate"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {certificate.certificateNumber || "—"} ·{" "}
                          {formatDate(certificate.issuedAt)}
                        </p>
                      </div>
                    </div>
                    {certificate.certificateUrl ? (
                      <a
                        href={certificate.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#173B67] hover:text-orange-600"
                      >
                        View Certificate
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
      <style dangerouslySetInnerHTML={{ __html: trainerStudentDetailCss }} />
    </main>
  );
}
const trainerStudentDetailCss = `
@keyframes trStudentRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes trStudentGradient{0%{background-position:0% 50%}100%{background-position:100% 50%}}
.tr-student-page{box-sizing:border-box;width:100%;background:transparent!important;color:#0F2F5F;isolation:isolate}
.tr-student-page *{box-sizing:border-box}
.tr-student-page h1,.tr-student-page h2,.tr-student-page h3{letter-spacing:-.025em}
.tr-student-page .tr-student-hero{position:relative;isolation:isolate;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:linear-gradient(120deg,#101D3A 0%,#0F2F5F 34%,#17477F 68%,#2563A6 100%)!important;background-size:220% 220%;box-shadow:0 14px 32px rgba(15,47,95,.17);animation:trStudentRise .55s cubic-bezier(.2,.7,.2,1) both,trStudentGradient 14s ease-in-out infinite alternate}
.tr-student-page .tr-student-hero::before{content:"";position:absolute;z-index:-1;top:-190px;right:-48px;width:430px;height:430px;border:1px solid rgba(255,255,255,.11);border-radius:50%;box-shadow:0 0 0 22px rgba(255,255,255,.04),0 0 0 48px rgba(255,255,255,.03),0 0 0 78px rgba(255,255,255,.025);pointer-events:none}
.tr-student-page .tr-student-hero::after{content:"";position:absolute;left:0;bottom:0;width:18%;height:3px;background:linear-gradient(90deg,#FF7900,#FFB15E)}
.tr-student-page .tr-student-hero>div{position:relative;z-index:1}
.tr-student-page .tr-student-hero .rounded-xl.bg-white\/10{border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(10px);box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
.tr-student-page .tr-student-hero .rounded-xl.bg-white\/10 .bg-orange-400{background:linear-gradient(90deg,#FF7900,#FFAA55)!important;box-shadow:0 0 12px rgba(255,121,0,.2)}
.tr-student-page .tr-student-tabs{border-color:#DDE6F2!important;border-radius:15px!important;box-shadow:0 4px 15px rgba(15,47,95,.045);animation:trStudentRise .5s .06s both}
.tr-student-page .tr-student-tabs>div{gap:0}
.tr-student-page .tr-student-tabs button{position:relative;white-space:nowrap;transition:color .2s ease,background .2s ease,transform .2s ease}
.tr-student-page .tr-student-tabs button:hover{background:#F7FAFE}
.tr-student-page .tr-student-tabs button:focus-visible{outline:3px solid rgba(37,99,235,.28);outline-offset:-3px}
.tr-student-page .tr-student-overview .tr-student-info-card{position:relative;overflow:hidden;border-color:#E2E8F1!important;border-radius:15px!important;box-shadow:0 2px 6px rgba(15,47,95,.035),0 7px 20px rgba(15,47,95,.03);animation:trStudentRise .45s both;transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s ease,border-color .25s ease}
.tr-student-page .tr-student-overview .tr-student-info-card:nth-child(2n){animation-delay:.05s}
.tr-student-page .tr-student-overview .tr-student-info-card:hover{transform:translateY(-3px);border-color:#BFD2EB!important;box-shadow:0 13px 25px rgba(15,47,95,.08)}
.tr-student-page .tr-student-info-card::before{content:"";position:absolute;top:0;left:0;bottom:0;width:3px;background:linear-gradient(180deg,#FF9A3D,#FF7900);opacity:.7}
.tr-student-page .border-slate-200{border-color:#E2E8F1!important}
.tr-student-page .text-slate-900,.tr-student-page .text-slate-800{color:#153967!important}
.tr-student-page .text-slate-600,.tr-student-page .text-slate-500{color:#64748B!important}
.tr-student-page .text-slate-400{color:#8795A9!important}
.tr-student-page .bg-slate-50{background:#F7F9FC!important}
.tr-student-page .bg-orange-50{background:#FFF1E6!important}
.tr-student-page button,.tr-student-page a{transition:color .2s ease,background-color .2s ease,border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.tr-student-page table tbody tr{transition:background .18s ease}
.tr-student-page button:focus-visible,.tr-student-page a:focus-visible{outline:3px solid rgba(37,99,235,.3);outline-offset:3px}
@media(max-width:640px){.tr-student-page .tr-student-hero{padding:20px!important;border-radius:15px!important}.tr-student-page .tr-student-hero::before{right:-260px;top:-245px}.tr-student-page .tr-student-tabs{border-radius:12px!important}.tr-student-page .tr-student-tabs button{padding:12px 14px!important;font-size:12px!important}}
@media(prefers-reduced-motion:reduce){.tr-student-page *,.tr-student-page *::before,.tr-student-page *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;
function CourseProgressCard({
  course,
  openModules,
  onToggleModule,
}: {
  course: Course;
  openModules: Set<number>;
  onToggleModule: (moduleId: number) => void;
}) {
  const progress = Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(course.progressPercentage ?? 0))
    )
  );
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#173B67]">
              {course.courseTitle || "Course"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {course.totalModules ?? 0} modules ·{" "}
              {course.totalLessons ?? 0} lessons
            </p>
          </div>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-600">
            {progress}%
          </span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-orange-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniStat
            label="Completed"
            value={course.completedLessons ?? 0}
          />
          <MiniStat
            label="Remaining"
            value={course.remainingLessons ?? 0}
          />
          <MiniStat
            label="Total Lessons"
            value={course.totalLessons ?? 0}
          />
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            Module & Lesson History
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Detailed learning status for this course.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {(course.modules ?? []).length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-500">
              No module information available.
            </p>
          ) : (
            (course.modules ?? []).map((module) => {
              const moduleId = Number(module.moduleId);
              const lessons = module.lessons ?? [];
              const completed = lessons.filter(
                (lesson) =>
                  String(lesson.status).toUpperCase() ===
                  "COMPLETED"
              ).length;
              const isOpen = openModules.has(moduleId);
              return (
                <div key={moduleId}>
                  <button
                    type="button"
                    onClick={() => onToggleModule(moduleId)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {module.moduleTitle || "Module"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {completed} of {lessons.length} lessons completed
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-slate-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                      {lessons.length === 0 ? (
                        <p className="py-2 text-sm text-slate-500">
                          No lessons in this module.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {lessons.map((lesson) => {
                            const completed =
                              String(
                                lesson.status
                              ).toUpperCase() ===
                              "COMPLETED";
                            return (
                              <div
                                key={lesson.lessonId}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-slate-100"
                              >
                                <div className="flex items-center gap-3">
                                  <CheckCircle2
                                    size={16}
                                    className={
                                      completed
                                        ? "text-emerald-500"
                                        : "text-slate-300"
                                    }
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">
                                      {lesson.lessonTitle ||
                                        "Lesson"}
                                    </p>
                                    {lesson.completedAt ? (
                                      <p className="mt-0.5 text-xs text-slate-400">
                                        Completed{" "}
                                        {formatDateTime(
                                          lesson.completedAt
                                        )}
                                      </p>
                                    ) : lesson.startedAt ? (
                                      <p className="mt-0.5 text-xs text-slate-400">
                                        Started{" "}
                                        {formatDateTime(
                                          lesson.startedAt
                                        )}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                    lesson.status
                                  )}`}
                                >
                                  {prettyStatus(
                                    lesson.status
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-semibold transition ${
        active
          ? "border-orange-500 text-[#173B67]"
          : "border-transparent text-slate-500 hover:text-[#173B67]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="tr-student-info-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-800">
        {value || "Not available"}
      </p>
    </div>
  );
}
function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
function Empty({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <BookOpen
        size={28}
        className="mx-auto text-slate-300"
      />
      <p className="mt-3 text-sm font-bold text-slate-700">
        {title}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {text}
      </p>
    </div>
  );
}
