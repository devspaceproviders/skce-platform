"use client";



import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import {

  ArrowLeft,

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



const API_URL =

  process.env.NEXT_PUBLIC_API_URL || "http\://localhost:5000/api";



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



type AssessmentQuestion = {
  id?: number;
  assessmentId?: number;
  question?: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer?: string | null;
  marks?: number;
  sortOrder?: number;
};

type AssessmentAttempt = {
  id?: number;
  attemptNumber?: number;
  answers?: string | null;
  submissionFileName?: string | null;
  submissionFileUrl?: string | null;
  submissionComment?: string | null;
  score?: number | null;
  status?: string | null;
  feedback?: string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  gradedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  questions?: AssessmentQuestion[];
  attempts?: AssessmentAttempt[];
  latestSubmission?: AssessmentAttempt | null;
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

    meetings?: Meeting[];

  };

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

  const [assessmentSearch, setAssessmentSearch] = useState("");

  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState("All");

  const [assessmentCourseFilter, setAssessmentCourseFilter] = useState("All");

  const [assessmentCreatorFilter, setAssessmentCreatorFilter] = useState("All");

  const [assessmentDueDateFilter, setAssessmentDueDateFilter] = useState<"All" | "Due" | "No due date">("All");

  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState("All");

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

  const meetings: Meeting[] = data?.progress?.meetings ?? [];



  const assessmentCourseOptions = useMemo(() => {

    return Array.from(

      new Set(

        assessments

          .map((assessment) => assessment.courseTitle?.trim())

          .filter((value): value is string => Boolean(value))

      )

    ).sort((a, b) => a.localeCompare(b));

  }, [assessments]);



  const assessmentCreatorOptions = useMemo(() => {

    return Array.from(

      new Set(

        assessments.map(

          (assessment) => assessment.createdByName?.trim() || "Not available"

        )

      )

    ).sort((a, b) => a.localeCompare(b));

  }, [assessments]);



  const filteredAssessments = useMemo(() => {

    const query = assessmentSearch.trim().toLowerCase();



    return assessments.filter((assessment) => {

      const title = assessment.title?.toLowerCase() || "";

      const course = assessment.courseTitle?.toLowerCase() || "";

      const creator = assessment.createdByName?.trim() || "Not available";

      const type = assessment.type || "";

      const submissionStatus =

        assessment.latestSubmission?.status ||

        assessment.submissionStatus ||

        "NOT_SUBMITTED";



      const matchesSearch =

        !query ||

        title.includes(query) ||

        course.includes(query) ||

        creator.toLowerCase().includes(query);



      const matchesType =

        assessmentTypeFilter === "All" || type === assessmentTypeFilter;



      const matchesCourse =

        assessmentCourseFilter === "All" ||

        assessment.courseTitle === assessmentCourseFilter;



      const matchesCreator =

        assessmentCreatorFilter === "All" || creator === assessmentCreatorFilter;



      const matchesDueDate =

        assessmentDueDateFilter === "All" ||

        (assessmentDueDateFilter === "Due" && Boolean(assessment.dueAt)) ||

        (assessmentDueDateFilter === "No due date" && !assessment.dueAt);



      const matchesStatus =

        assessmentStatusFilter === "All" ||

        (assessmentStatusFilter === "Not Submitted" && !assessment.latestSubmission) ||

        (assessmentStatusFilter === "Submitted" &&

          Boolean(assessment.latestSubmission) &&

          String(submissionStatus).toUpperCase() === "SUBMITTED") ||

        (assessmentStatusFilter === "In Progress" &&

          String(submissionStatus).toUpperCase() === "IN_PROGRESS") ||

        (assessmentStatusFilter === "Graded" &&

          String(submissionStatus).toUpperCase() === "GRADED");



      return (

        matchesSearch &&

        matchesType &&

        matchesCourse &&

        matchesCreator &&

        matchesDueDate &&

        matchesStatus

      );

    });

  }, [

    assessments,

    assessmentSearch,

    assessmentTypeFilter,

    assessmentCourseFilter,

    assessmentCreatorFilter,

    assessmentDueDateFilter,

    assessmentStatusFilter,

  ]);



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

      <main className="min-h-screen bg-slate-50">

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

      <main className="min-h-screen bg-slate-50 px-6 py-8">

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

    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

          <button

            type="button"

            onClick={() =>

              router.push(

                `/dashboard/trainer/my-batches/batch-detail/${batchId}`

              )

            }

            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#173B67]"

          >

            <ArrowLeft size={17} />

            Back to Batch Students

          </button>



          <button

            type="button"

            onClick={() => void loadStudent(true)}

            disabled={refreshing}

            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"

          >

            <RefreshCw

              size={15}

              className={refreshing ? "animate-spin" : ""}

            />

            Refresh

          </button>

        </div>



        <section className="rounded-2xl bg-[#173B67] p-6 shadow-sm sm:p-7">

          <div className="flex flex-wrap items-center justify-between gap-6">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white/10 text-xl font-bold text-white">

                {student.profilePhotoUrl ? (

                  <img

                    src={student.profilePhotoUrl}

                    alt={student.name || "Student"}

                    className="h-full w-full object-cover"

                  />

                ) : (

                  student.name?.charAt(0).toUpperCase() || "S"

                )}

              </div>



              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-orange-200">

                  Student

                </p>

                <h1 className="mt-1 text-2xl font-bold text-white">

                  {student.name || "Student"}

                </h1>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-100">

                  <span>Student ID: {student.studentId || "—"}</span>

                  <span>{student.email || "—"}</span>

                  {student.phone ? <span>{student.phone}</span> : null}

                </div>

              </div>

            </div>



            <div className="min-w-[210px] rounded-xl bg-white/10 p-4">

              <div className="flex justify-between text-xs text-blue-100">

                <span>Responsible Course Progress</span>

                <strong className="text-white">

                  {overallProgress}%

                </strong>

              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">

                <div

                  className="h-full rounded-full bg-orange-400"

                  style={{

                    width: `${Math.min(overallProgress, 100)}%`,

                  }}

                />

              </div>

              <p className="mt-2 text-xs text-blue-100">

                Based only on courses you are responsible for.

              </p>

            </div>

          </div>

        </section>



        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">

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

          <section className="mt-5 grid gap-5 sm:grid-cols-2">

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
                Assessments belonging only to your responsible courses, with
                every student attempt and submitted answer shown dynamically.
              </p>
            </div>

            {assessments.length === 0 ? (
              <Empty
                title="No assessments found"
                text="There are no assessment records for your responsible courses."
              />
            ) : (
              <>
                <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Filter assessments
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Find assessments by the same core criteria used in the
                        Admin Assignments portal.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAssessmentSearch("");
                        setAssessmentTypeFilter("All");
                        setAssessmentCourseFilter("All");
                        setAssessmentCreatorFilter("All");
                        setAssessmentDueDateFilter("All");
                        setAssessmentStatusFilter("All");
                      }}
                      className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      Clear Filters
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <input
                      value={assessmentSearch}
                      onChange={(event) =>
                        setAssessmentSearch(event.target.value)
                      }
                      placeholder="Search assessment or course"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#173B67]"
                    />

                    <select
                      value={assessmentTypeFilter}
                      onChange={(event) =>
                        setAssessmentTypeFilter(event.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#173B67]"
                    >
                      <option value="All">All Types</option>
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="QUIZ">Quiz</option>
                    </select>

                    <select
                      value={assessmentCourseFilter}
                      onChange={(event) =>
                        setAssessmentCourseFilter(event.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#173B67]"
                    >
                      <option value="All">All Courses</option>
                      {assessmentCourseOptions.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>

                    <select
                      value={assessmentCreatorFilter}
                      onChange={(event) =>
                        setAssessmentCreatorFilter(event.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#173B67]"
                    >
                      <option value="All">All Created By</option>
                      {assessmentCreatorOptions.map((creator) => (
                        <option key={creator} value={creator}>
                          {creator}
                        </option>
                      ))}
                    </select>

                    <select
                      value={assessmentDueDateFilter}
                      onChange={(event) =>
                        setAssessmentDueDateFilter(
                          event.target.value as
                            | "All"
                            | "Due"
                            | "No due date"
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#173B67]"
                    >
                      <option value="All">All Due Dates</option>
                      <option value="Due">Has Due Date</option>
                      <option value="No due date">No Due Date</option>
                    </select>

                    <select
                      value={assessmentStatusFilter}
                      onChange={(event) =>
                        setAssessmentStatusFilter(event.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#173B67]"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Not Submitted">Not Submitted</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Graded">Graded</option>
                    </select>
                  </div>
                </div>

                {filteredAssessments.length === 0 ? (
                  <Empty
                    title="No assessments match the filters"
                    text="Try changing or clearing the selected filters."
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredAssessments.map((assessment, index) => {
                      const assessmentId = Number(
                        assessment.id ?? assessment.assessmentId ?? 0
                      );

                      const attempts = (assessment.attempts ?? [])
                        .slice()
                        .sort(
                          (a, b) =>
                            Number(a.attemptNumber ?? 0) -
                            Number(b.attemptNumber ?? 0)
                        );

                      return (
                        <AssessmentAccordion
                          key={assessmentId}
                          assessment={assessment}
                          attempts={attempts}
                          defaultOpen={index === 0}
                        />
                      );
                    })}
                  </div>
                )}
              </>
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

    </main>

  );

}



function parseAssessmentAnswers(
  answers?: string | null
): Record<string, string> {
  if (!answers) return {};

  try {
    const parsed = JSON.parse(answers);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [
        String(key),
        String(value ?? ""),
      ])
    );
  } catch {
    return {};
  }
}

function normalizeAssessmentAnswer(
  value?: string | null
) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  if (/^[A-D]$/.test(normalized)) {
    return normalized;
  }

  const optionMatch = normalized.match(/^OPTION[\s_-]*([A-D])$/);
  return optionMatch?.[1] ?? normalized;
}

function AssessmentAccordion({
  assessment,
  attempts,
  defaultOpen = false,
}: {
  assessment: Assessment;
  attempts: AssessmentAttempt[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const latest =
    assessment.latestSubmission ??
    attempts[attempts.length - 1] ??
    null;

  const status = latest?.status ?? assessment.submissionStatus;
  const score = latest?.score ?? assessment.score;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="w-full text-left transition hover:bg-slate-50"
      >
        <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-slate-900">
                {assessment.title || "Assessment"}
              </p>

              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-600">
                {prettyStatus(assessment.type)}
              </span>

              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                {attempts.length} attempt
                {attempts.length === 1 ? "" : "s"}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {assessment.courseTitle || "Course"} · Due {formatDate(assessment.dueAt)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Created by {assessment.createdByName || "Not available"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Score
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {score != null
                  ? `${score} / ${assessment.totalMarks ?? "—"}`
                  : "—"}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                status
              )}`}
            >
              {prettyStatus(status)}
            </span>

            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <ChevronDown size={17} />
            </span>
          </div>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
          <AssessmentAttemptHistory
            assessment={assessment}
            attempts={attempts}
          />
        </div>
      ) : null}
    </div>
  );
}

function AssessmentAttemptHistory({
  assessment,
  attempts,
}: {
  assessment: Assessment;
  attempts: AssessmentAttempt[];
}) {
  const orderedAttempts = attempts
    .slice()
    .sort(
      (a, b) =>
        Number(a.attemptNumber ?? 0) -
        Number(b.attemptNumber ?? 0)
    );

  const [selectedAttemptId, setSelectedAttemptId] = useState<
    number | string | null
  >(orderedAttempts[0]?.id ?? orderedAttempts[0]?.attemptNumber ?? null);

  const selectedAttempt =
    orderedAttempts.find((attempt) =>
      selectedAttemptId != null
        ? (attempt.id ?? attempt.attemptNumber) === selectedAttemptId
        : false
    ) ?? orderedAttempts[0];

  if (orderedAttempts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        No submitted attempts are available for this assessment.
      </div>
    );
  }

  const questions = (assessment.questions ?? [])
    .slice()
    .sort(
      (a, b) =>
        Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
    );

  const answers = parseAssessmentAnswers(selectedAttempt?.answers);
  const score = selectedAttempt?.score;
  const percentage =
    score != null && Number(assessment.totalMarks)
      ? Math.round(
          (Number(score) / Number(assessment.totalMarks)) * 100
        )
      : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Assessment Attempts
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {orderedAttempts.length} attempt
              {orderedAttempts.length === 1 ? "" : "s"} stored for this assessment
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {orderedAttempts.map((attempt) => {
              const key = attempt.id ?? attempt.attemptNumber ?? 0;
              const isSelected =
                (selectedAttempt?.id ?? selectedAttempt?.attemptNumber) === key;

              return (
                <button
                  key={String(key)}
                  type="button"
                  onClick={() => setSelectedAttemptId(key)}
                  className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${
                    isSelected
                      ? "border-[#173B67] bg-[#173B67] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#173B67] hover:text-[#173B67]"
                  }`}
                >
                  Attempt {attempt.attemptNumber ?? "—"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedAttempt ? (
        <>
          <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Attempt
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {selectedAttempt.attemptNumber ?? "—"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Score
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {score != null
                  ? `${score} / ${assessment.totalMarks ?? "—"}${
                      percentage != null ? ` (${percentage}%)` : ""
                    }`
                  : `Not graded / ${assessment.totalMarks ?? "—"}`}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Status
              </p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                  selectedAttempt.status
                )}`}
              >
                {prettyStatus(selectedAttempt.status)}
              </span>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Submitted
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatDateTime(selectedAttempt.submittedAt)}
              </p>
            </div>
          </div>

          {selectedAttempt.submissionComment ? (
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Student Comment
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {selectedAttempt.submissionComment}
              </p>
            </div>
          ) : null}

          {assessment.type === "QUIZ" ? (
            <div className="p-4 sm:p-5">
              {questions.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Question details are not available.
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm font-bold text-slate-900">
                      Submitted Answers
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Green indicates the correct answer. Red indicates a selected incorrect answer.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {questions.map((question, index) => {
                      const selected = normalizeAssessmentAnswer(
                        answers[String(question.id)]
                      );
                      const correct = normalizeAssessmentAnswer(
                        question.correctAnswer
                      );

                      const options = [
                        ["A", question.optionA],
                        ["B", question.optionB],
                        ["C", question.optionC],
                        ["D", question.optionD],
                      ] as const;

                      return (
                        <div
                          key={question.id ?? index}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold leading-6 text-slate-900">
                              {index + 1}. {question.question}
                            </p>

                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                              {question.marks ?? 1} mark
                              {(question.marks ?? 1) === 1 ? "" : "s"}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {options.map(([letter, optionText]) => {
                              if (!optionText) return null;

                              const isSelected = selected === letter;
                              const isCorrect = correct === letter;
                              const isWrongSelected =
                                isSelected && !isCorrect;

                              let classes =
                                "border-slate-200 bg-slate-50 text-slate-700";

                              if (isCorrect) {
                                classes =
                                  "border-emerald-300 bg-emerald-50 text-emerald-800";
                              } else if (isWrongSelected) {
                                classes =
                                  "border-red-300 bg-red-50 text-red-800";
                              }

                              return (
                                <div
                                  key={letter}
                                  className={`rounded-lg border px-3 py-2.5 ${classes}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="font-bold">
                                      {letter}.
                                    </span>
                                    <span className="min-w-0 flex-1 text-sm">
                                      {optionText}
                                    </span>
                                  </div>

                                  <div className="mt-1 flex flex-wrap gap-2 pl-5 text-[10px] font-bold uppercase tracking-wide">
                                    {isSelected ? (
                                      <span>Selected</span>
                                    ) : null}
                                    {isCorrect ? (
                                      <span>Correct Answer</span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-4 text-xs">
                            <span className="text-slate-600">
                              Student answer:{" "}
                              <strong>{selected || "Not answered"}</strong>
                            </span>
                            <span className="text-slate-600">
                              Correct answer:{" "}
                              <strong>{correct || "—"}</strong>
                            </span>
                            <span className="text-slate-600">
                              Marks:{" "}
                              <strong>{question.marks ?? 1}</strong>
                            </span>

                            {selected ? (
                              <span
                                className={
                                  selected === correct
                                    ? "font-bold text-emerald-600"
                                    : "font-bold text-red-600"
                                }
                              >
                                {selected === correct ? "✓ Correct" : "✕ Incorrect"}
                              </span>
                            ) : (
                              <span className="font-bold text-slate-400">
                                Not answered
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-4 sm:p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Submitted File
                </p>

                {selectedAttempt.submissionFileUrl ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <FileText size={17} className="text-[#173B67]" />
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedAttempt.submissionFileName || "Uploaded file"}
                    </span>
                    <a
                      href={selectedAttempt.submissionFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#173B67] hover:text-orange-600"
                    >
                      View Submission
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No uploaded file information is available.
                  </p>
                )}
              </div>

              {selectedAttempt.feedback ? (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Trainer Feedback
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {selectedAttempt.feedback}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

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

    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

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
