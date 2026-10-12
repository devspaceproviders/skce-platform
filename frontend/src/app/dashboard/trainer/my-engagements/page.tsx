"use client";



import { useEffect, useMemo, useState } from "react";

import {

  Activity,

  Award,

  BookOpen,

  CalendarDays,

  CheckCircle2,

  Clock3,

  Layers3,

  Loader2,

  RefreshCw,

  Users,

} from "lucide-react";



const API_URL =

  process.env.NEXT_PUBLIC_API_URL ||

  "http://localhost:5000/api";



type Course = {

  id: number;

  courseId: number;

  courseTitle: string;

  courseSlug?: string | null;

  canTeach: boolean;

  canManageContent: boolean;

  canCreateAssessments: boolean;

};



type Batch = {

  id: number;

  name: string;

  courseId: number;

  courseTitle: string;

  startDate: string;

  endDate: string;

  mode?: string | null;

  status?: string | null;

  studentCount: number;

};



type Meeting = {

  id: number;

  title: string;

  description?: string | null;

  startAt: string;

  endAt: string;

  meetingUrl?: string | null;

  meetingPlatform?: string | null;

  meetingType: string;

  status: string;

  courseId?: number | null;

  courseTitle?: string | null;

  batchId?: number | null;

  batchName?: string | null;

  participantCount: number;

  organizer?: {

    id?: number;

    name?: string | null;

    email?: string | null;

    role?: string | null;

  } | null;

};



type EngagementData = {

  summary: {

    responsibleCourses: number;

    assignedBatches: number;

    students: number;

    upcomingMeetings: number;

    totalMeetings: number;

  };

  courses: Course[];

  batches: Batch[];

  meetings: Meeting[];

  upcomingMeetings: Meeting[];

};



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



function formatDate(value?: string | null) {

  if (!value) return "Not available";



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return "Not available";

  }



  return new Intl.DateTimeFormat("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

  }).format(date);

}



function formatDateTime(value?: string | null) {

  if (!value) return "Not available";



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return "Not available";

  }



  return new Intl.DateTimeFormat("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

  }).format(date);

}



function pretty(value?: string | null) {

  if (!value) return "—";



  return value

    .toLowerCase()

    .split("_")

    .map(

      (part) =>

        part.charAt(0).toUpperCase() +

        part.slice(1)

    )

    .join(" ");

}



function organizerName(meeting: Meeting) {

  return meeting.organizer?.name?.trim() || "Not available";

}



function organizerRole(meeting: Meeting) {

  return meeting.organizer?.role

    ? pretty(meeting.organizer.role)

    : "";

}



async function loadEngagements() {

  const token = getToken();



  if (!token) {

    throw new Error(

      "Authentication token not found."

    );

  }



  const response = await fetch(

    `${API_URL}/trainer/engagements`,

    {

      headers: {

        Authorization: `Bearer ${token}`,

      },

      cache: "no-store",

    }

  );



  const result = await response

    .json()

    .catch(() => null);



  if (!response.ok || !result?.success) {

    throw new Error(

      result?.message ||

        "Unable to load your engagements."

    );

  }



  return result.data as EngagementData;

}



export default function MyEngagementsPage() {

  const [data, setData] =

    useState<EngagementData | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =

    useState(false);

  const [error, setError] = useState("");



  async function refresh(isRefresh = false) {

    try {

      isRefresh

        ? setRefreshing(true)

        : setLoading(true);



      setError("");



      const result =

        await loadEngagements();



      setData(result);

    } catch (err) {

      console.error(

        "Load My Engagements error:",

        err

      );



      setError(

        err instanceof Error

          ? err.message

          : "Unable to load your engagements."

      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }



  useEffect(() => {

    void refresh();

  }, []);



  const upcoming = useMemo(

    () =>

      (data?.upcomingMeetings ?? []).slice(0, 5),

    [data]

  );



  if (loading) {

    return (

      <main className="min-h-screen bg-slate-50 p-6">

        <div className="flex min-h-[60vh] items-center justify-center">

          <div className="text-center">

            <Loader2

              size={30}

              className="mx-auto animate-spin text-orange-500"

            />

            <p className="mt-3 text-sm text-slate-500">

              Loading your engagements...

            </p>

          </div>

        </div>

      </main>

    );

  }



  if (error || !data) {

    return (

      <main className="min-h-screen bg-slate-50 p-6">

        <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">

          <h1 className="text-lg font-bold text-slate-900">

            Unable to load My Engagements

          </h1>

          <p className="mt-2 text-sm text-red-600">

            {error || "No engagement data available."}

          </p>

          <button

            type="button"

            onClick={() => void refresh()}

            className="mt-5 rounded-lg bg-[#173B67] px-4 py-2 text-sm font-semibold text-white"

          >

            Try Again

          </button>

        </div>

      </main>

    );

  }



  return (

    <main className="min-h-screen bg-[#F5F8FC] p-4 sm:p-6 lg:p-8">

      <div className="mx-auto w-full max-w-[1500px]">

        <div className="relative mb-7 overflow-hidden rounded-[26px] bg-gradient-to-r from-[#302832] via-[#173B67] to-[#0D2C55] p-6 text-white shadow-[0_18px_45px_rgba(23,59,103,0.18)] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-28 h-80 w-80 rounded-full border-[26px] border-white/[0.045]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-20 h-64 w-64 rounded-full border-[18px] border-white/[0.055]" />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-inner backdrop-blur-sm">
                <Layers3 size={29} />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-300 sm:text-sm">Trainer Workspace</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">My Engagements</h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100/90 sm:text-base">Your teaching responsibilities, assigned batches, students and upcoming meetings.</p>
              </div>
            </div>

          <button
            type="button"
            onClick={() => void refresh(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >

            <RefreshCw

              size={15}

              className={

                refreshing ? "animate-spin" : ""

              }

            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard

            icon={<BookOpen size={19} />}

            label="Responsible Courses"

            value={data.summary.responsibleCourses}

          />

          <SummaryCard

            icon={<Layers3 size={19} />}

            label="Assigned Batches"

            value={data.summary.assignedBatches}

          />

          <SummaryCard

            icon={<Users size={19} />}

            label="Students"

            value={data.summary.students}

          />

          <SummaryCard

            icon={<CalendarDays size={19} />}

            label="Upcoming Meetings"

            value={data.summary.upcomingMeetings}

          />

        </div>



        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md">

          <SectionHeader

            icon={<BookOpen size={18} />}

            title="Responsible Courses"

            description="Courses where you currently have teaching responsibility."

          />



          {data.courses.length === 0 ? (

            <Empty text="No teaching courses are currently assigned to you." />

          ) : (

            <div className="grid gap-4 p-5 md:grid-cols-2">

              {data.courses.map((course) => (

                <div

                  key={course.courseId}

                  className="group rounded-xl border border-slate-200/80 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"

                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <h3 className="font-bold text-slate-900">

                        {course.courseTitle}

                      </h3>

                      <p className="mt-1 text-xs text-slate-400">

                        Course ID: {course.courseId}

                      </p>

                    </div>

                    <CheckCircle2

                      size={19}

                      className="text-emerald-500"

                    />

                  </div>



                  <div className="mt-4 flex flex-wrap gap-2">

                    <PermissionBadge

                      enabled={course.canTeach}

                      label="Teach"

                    />

                    <PermissionBadge

                      enabled={

                        course.canManageContent

                      }

                      label="Content"

                    />

                    <PermissionBadge

                      enabled={

                        course.canCreateAssessments

                      }

                      label="Assessments"

                    />

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>



        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md">

          <SectionHeader

            icon={<Layers3 size={18} />}

            title="Assigned Batches"

            description="Batches connected to your responsible teaching courses."

          />



          {data.batches.length === 0 ? (

            <Empty text="No assigned batches are currently available." />

          ) : (

            <div className="overflow-x-auto p-1">

              <table className="w-full min-w-[760px]">

                <thead className="bg-[#F2F6FC]">

                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">

                    <th className="px-5 py-3">Batch</th>

                    <th className="px-5 py-3">Course</th>

                    <th className="px-5 py-3">Students</th>

                    <th className="px-5 py-3">Period</th>

                    <th className="px-5 py-3">Status</th>

                  </tr>

                </thead>

                <tbody>

                  {data.batches.map((batch) => (

                    <tr

                      key={batch.id}

                      className="border-t border-slate-100 transition-colors hover:bg-orange-50/30"

                    >

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">

                        {batch.name}

                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">

                        {batch.courseTitle}

                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">

                        {batch.studentCount}

                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">

                        {formatDate(batch.startDate)} –{" "}

                        {formatDate(batch.endDate)}

                      </td>

                      <td className="px-5 py-4">

                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">

                          {pretty(batch.status)}

                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>



        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md">

          <SectionHeader

            icon={<CalendarDays size={18} />}

            title="Upcoming Engagements"

            description="Meetings connected to your trainer account, batches or students."

          />



          {upcoming.length === 0 ? (

            <Empty text="No upcoming meetings are currently scheduled." />

          ) : (

            <div className="divide-y divide-slate-100">

              {upcoming.map((meeting) => (

                <div

                  key={meeting.id}

                  className="px-5 py-5 transition duration-200 hover:bg-orange-50/30"

                >

                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div className="flex min-w-0 items-start gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">

                        <Clock3 size={18} />

                      </div>



                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-sm font-bold text-slate-900">

                            {meeting.title}

                          </h3>

                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">

                            {pretty(meeting.status)}

                          </span>

                        </div>



                        <p className="mt-1 text-sm font-medium text-slate-600">

                          {formatDateTime(meeting.startAt)}

                          {meeting.endAt ? ` – ${formatDateTime(meeting.endAt)}` : ""}

                        </p>



                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">

                          <span className="rounded-full bg-slate-100 px-2.5 py-1">

                            {pretty(meeting.meetingType)}

                          </span>

                          {meeting.meetingPlatform ? (

                            <span className="rounded-full bg-slate-100 px-2.5 py-1">

                              {pretty(meeting.meetingPlatform)}

                            </span>

                          ) : null}

                          {meeting.courseTitle ? (

                            <span className="rounded-full bg-slate-100 px-2.5 py-1">

                              Course: {meeting.courseTitle}

                            </span>

                          ) : null}

                          {meeting.batchName ? (

                            <span className="rounded-full bg-slate-100 px-2.5 py-1">

                              Batch: {meeting.batchName}

                            </span>

                          ) : null}

                        </div>



                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">

                          <span className="inline-flex items-center gap-1.5">

                            <Users size={14} />

                            {meeting.participantCount} participant{meeting.participantCount === 1 ? "" : "s"}

                          </span>

                          <span>

                            Scheduled by: <strong className="font-semibold text-slate-700">{organizerName(meeting)}</strong>

                            {organizerRole(meeting) ? ` · ${organizerRole(meeting)}` : ""}

                          </span>

                        </div>

                      </div>

                    </div>



                    {meeting.meetingUrl ? (

                      <a

                        href={meeting.meetingUrl}

                        target="_blank"

                        rel="noreferrer"

                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:from-orange-600 hover:to-orange-700 hover:shadow-md"

                      >

                        Join Meeting

                      </a>

                    ) : null}

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>



        <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_14px_rgba(15,23,42,0.04)]">

          <div className="flex items-start gap-3">

            <Activity

              size={19}

              className="mt-0.5 text-orange-500"

            />

            <div>

              <h2 className="font-bold text-slate-900">

                Engagement data

              </h2>

              <p className="mt-1 text-sm text-slate-500">

                This page is driven by your current course

                permissions, batch assignments and meeting

                records. It does not use hardcoded engagement

                data.

              </p>

            </div>

          </div>

        </section>

      </div>

    </main>

  );

}



function SummaryCard({

  icon,

  label,

  value,

}: {

  icon: React.ReactNode;

  label: string;

  value: number;

}) {

  return (

    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_12px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 ring-1 ring-orange-100 transition group-hover:scale-105">

        {icon}

      </div>

      <p className="mt-4 text-2xl font-bold text-[#173B67]">

        {value}

      </p>

      <p className="mt-1 text-sm text-slate-500">

        {label}

      </p>

    </div>

  );

}



function SectionHeader({

  icon,

  title,

  description,

}: {

  icon: React.ReactNode;

  title: string;

  description: string;

}) {

  return (

    <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/70 px-5 py-4">

      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">

        {icon}

      </div>

      <div>

        <h2 className="font-bold text-slate-900">

          {title}

        </h2>

        <p className="mt-1 text-xs text-slate-500">

          {description}

        </p>

      </div>

    </div>

  );

}



function PermissionBadge({

  enabled,

  label,

}: {

  enabled: boolean;

  label: string;

}) {

  return (

    <span

      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${

        enabled

          ? "bg-emerald-50 text-emerald-700"

          : "bg-slate-100 text-slate-400"

      }`}

    >

      {label}

    </span>

  );

}



function Empty({ text }: { text: string }) {

  return (

    <div className="p-8 text-center">

      <Award

        size={28}

        className="mx-auto text-slate-300"

      />

      <p className="mt-3 text-sm text-slate-500">

        {text}

      </p>

    </div>

  );

}
