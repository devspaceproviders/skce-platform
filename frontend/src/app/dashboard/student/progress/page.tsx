"use client";



import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import {

  Award,

  BarChart3,

  BookOpen,

  CheckCircle2,

  Clock3,

  FileCheck2,

  GraduationCap,

  PlayCircle,

  RefreshCw,

  Trophy,


} from "lucide-react";



const API_URL =

  process.env.NEXT_PUBLIC_API_URL || "http\://localhost:5000/api";



type Course = {

  id: number;

  title: string;

  slug?: string | null;

};



type PackageCourse = {

  id: number;

  packageId: number;

  courseId: number;

  course: Course | null;

};



type PackageData = {

  id: number;

  title: string;

  courses: PackageCourse[];

};



type Enrollment = {

  id: number;

  status: string;

  enrolledAt?: string | null;

  completedAt?: string | null;

  course: Course | null;

  package: PackageData | null;

};



type DashboardData = {

  enrollments: Enrollment[];

};



type CourseProgress = {

  courseId: number;

  totalLessons: number;

  completedLessons: number;

  startedLessons: number;

  remainingLessons: number;

  progressPercentage: number;

};



type Assessment = {

  id: number;

  courseId: number;

  courseTitle?: string;

  title: string;

  type: "QUIZ" | "ASSIGNMENT" | string;

  totalMarks?: number | null;

  latestSubmission?: {

    attemptNumber?: number | null;

    score?: number | null;

    status?: string | null;

    submittedAt?: string | null;

    gradedAt?: string | null;

  } | null;

};



type Certificate = {

  id: number;

  certificateNumber: string;

  certificateType: string;

  issuedAt: string;

  certificateUrl?: string | null;

  courseTitle?: string | null;

  packageTitle?: string | null;

  course?: { title?: string | null } | null;

  package?: { title?: string | null } | null;

};





type StudentCourse = {

  course: Course;

  packageName: string | null;

};



function getToken() {

  if (typeof window === "undefined") {

    return null;

  }



  return localStorage.getItem("token");

}



async function fetchJson(path: string, token: string) {

  const response = await fetch(`${API_URL}${path}`, {

    method: "GET",

    headers: {

      Authorization: `Bearer ${token}`,

      "Content-Type": "application/json",

    },

  });



  const json = await response.json();



  if (!response.ok) {

    throw new Error(

      json?.message || json?.error || `Request failed: ${response.status}`

    );

  }



  return json?.data ?? json;

}



function normalizeArray<T>(value: any): T[] {

  if (Array.isArray(value)) {

    return value;

  }



  if (Array.isArray(value?.data)) {

    return value.data;

  }



  if (Array.isArray(value?.items)) {

    return value.items;

  }



  if (Array.isArray(value?.results)) {

    return value.results;

  }



  if (Array.isArray(value?.certificates)) {

    return value.certificates;

  }



  if (Array.isArray(value?.assessments)) {

    return value.assessments;

  }



  if (Array.isArray(value?.sessions)) {

    return value.sessions;

  }



  return [];

}



export default function ProgressPage() {

  const [courses, setCourses] = useState<StudentCourse[]>([]);

  const [progressMap, setProgressMap] = useState<

    Record<number, CourseProgress>

  >({});

  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);


  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");



  const loadProgress = async () => {

    const token = getToken();



    if (!token) {

      setError("Please login again.");

      setLoading(false);

      setRefreshing(false);

      return;

    }



    try {

      setError("");



      const dashboardRaw = await fetchJson(

        "/students/me/dashboard",

        token

      );



      const dashboard: DashboardData =

        dashboardRaw?.data ?? dashboardRaw;



      const enrollmentList = dashboard?.enrollments ?? [];

      const courseMap = new Map<number, StudentCourse>();



      for (const enrollment of enrollmentList) {

        if (enrollment.course) {

          courseMap.set(enrollment.course.id, {

            course: enrollment.course,

            packageName: null,

          });

        }



        if (enrollment.package) {

          for (const packageItem of enrollment.package.courses ?? []) {

            if (!packageItem.course) {

              continue;

            }



            if (!courseMap.has(packageItem.course.id)) {

              courseMap.set(packageItem.course.id, {

                course: packageItem.course,

                packageName: enrollment.package.title,

              });

            }

          }

        }

      }



      const studentCourses = Array.from(courseMap.values());

      setCourses(studentCourses);



      const progressResults = await Promise.all(

        studentCourses.map(async (item) => {

          try {

            const raw = await fetchJson(

              `/course-progress/courses/${item.course.id}/progress`,

              token

            );



            const progress: CourseProgress =

              raw?.data ?? raw;



            return progress;

          } catch (progressError) {

            console.error(

              `Progress error for course ${item.course.id}:`,

              progressError

            );

            return null;

          }

        })

      );



      const nextProgressMap: Record<number, CourseProgress> = {};



      for (const progress of progressResults) {

        if (progress) {

          nextProgressMap[progress.courseId] = progress;

        }

      }



      setProgressMap(nextProgressMap);



      const [assessmentResult, certificateResult] =
        await Promise.allSettled([

          fetchJson("/assessments", token),

          fetchJson("/certificates", token),

        ]);



      if (assessmentResult.status === "fulfilled") {

        setAssessments(

          normalizeArray<Assessment>(assessmentResult.value)

        );

      } else {

        console.error(

          "Assessment analytics could not be loaded:",

          assessmentResult.reason

        );

        setAssessments([]);

      }



      if (certificateResult.status === "fulfilled") {

        setCertificates(

          normalizeArray<Certificate>(certificateResult.value)

        );

      } else {

        console.error(

          "Certificate analytics could not be loaded:",

          certificateResult.reason

        );

        setCertificates([]);

      }
    } catch (err: any) {

      console.error("My Progress error:", err);

      setError(err?.message || "Unable to load your progress.");

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  };



  useEffect(() => {

    loadProgress();

  }, []);



  const getCourseProgress = (courseId: number): CourseProgress =>

    progressMap[courseId] ?? {

      courseId,

      totalLessons: 0,

      completedLessons: 0,

      startedLessons: 0,

      remainingLessons: 0,

      progressPercentage: 0,

    };



  const analytics = useMemo(() => {

    const courseProgress = courses.map((item) =>

      getCourseProgress(item.course.id)

    );



    const totalCourses = courses.length;

    const completedCourses = courseProgress.filter(

      (item) => item.progressPercentage === 100

    ).length;

    const inProgressCourses = courseProgress.filter(

      (item) =>

        item.progressPercentage > 0 &&

        item.progressPercentage < 100

    ).length;

    const notStartedCourses = courseProgress.filter(

      (item) => item.progressPercentage === 0

    ).length;



    const totalLessons = courseProgress.reduce(

      (sum, item) => sum + item.totalLessons,

      0

    );

    const completedLessons = courseProgress.reduce(

      (sum, item) => sum + item.completedLessons,

      0

    );

    const remainingLessons = Math.max(

      totalLessons - completedLessons,

      0

    );



    const averageProgress =

      totalCourses === 0

        ? 0

        : Math.round(

            courseProgress.reduce(

              (sum, item) => sum + item.progressPercentage,

              0

            ) / totalCourses

          );



    const attemptedAssessments = assessments.filter(

      (item) => Boolean(item.latestSubmission)

    ).length;



    const pendingAssessments = Math.max(

      assessments.length - attemptedAssessments,

      0

    );



    const quizzes = assessments.filter(

      (item) => item.type === "QUIZ"

    );

    const assignments = assessments.filter(

      (item) => item.type === "ASSIGNMENT"

    );



    const scoredAssessments = assessments.filter(

      (item) =>

        item.latestSubmission &&

        typeof item.latestSubmission.score === "number"

    );



    const averageScore =

      scoredAssessments.length === 0

        ? null

        : Math.round(

            scoredAssessments.reduce(

              (sum, item) =>

                sum + Number(item.latestSubmission?.score ?? 0),

              0

            ) / scoredAssessments.length

          );




      const courseCertificates = certificates.filter(
        (certificate) => certificate.certificateType === "COURSE"
      );

    const packageCertificates = certificates.filter(

      (certificate) => certificate.certificateType === "PACKAGE"

    );



    return {

      totalCourses,

      completedCourses,

      inProgressCourses,

      notStartedCourses,

      averageProgress,

      totalLessons,

      completedLessons,

      remainingLessons,

      attemptedAssessments,

      pendingAssessments,

      totalAssessments: assessments.length,

      quizCount: quizzes.length,

      assignmentCount: assignments.length,

      averageScore,




      totalCertificates: certificates.length,

      courseCertificates: courseCertificates.length,

      packageCertificates: packageCertificates.length,

    };

  }, [courses, progressMap, assessments, certificates]);



  const courseRows = useMemo(() => {

    return courses.map((item) => ({

      ...item,

      progress: getCourseProgress(item.course.id),

    }));

  }, [courses, progressMap]);



  const recentCertificates = useMemo(() => {

    return [...certificates]

      .sort(

        (a, b) =>

          new Date(b.issuedAt).getTime() -

          new Date(a.issuedAt).getTime()

      )

      .slice(0, 4);

  }, [certificates]);



  const certificateDownloadUrl = (certificate: Certificate) => {

    if (!certificate.certificateUrl) {

      return null;

    }



    if (certificate.certificateUrl.startsWith("http")) {

      return certificate.certificateUrl;

    }



    const backendBase = API_URL.replace(/\/$/, "");

    return `${backendBase}${certificate.certificateUrl}`;

  };



  if (loading) {

    return (

      <main style={pageStyle}>

        <Panel style={{ padding: "70px 25px", textAlign: "center" }}>

          <div style={spinnerStyle} />

          <p style={mutedTextStyle}>Loading your progress...</p>

        </Panel>

        <style jsx>{`

          @keyframes spin {

            from {

              transform: rotate(0deg);

            }

            to {

              transform: rotate(360deg);

            }

          }

        `}</style>

      </main>

    );

  }



  if (error) {

    return (

      <main style={pageStyle}>

        <Panel

          style={{

            padding: "55px 25px",

            textAlign: "center",

            borderColor: "#FECACA",

          }}

        >

          <h2 style={{ margin: "0 0 8px", color: "#B91C1C", fontSize: 18 }}>

            Unable to Load Progress

          </h2>

          <p style={{ ...mutedTextStyle, marginBottom: 18 }}>{error}</p>

          <button

            onClick={() => {

              setRefreshing(true);

              loadProgress();

            }}

            style={primaryButtonStyle}

          >

            Try Again

          </button>

        </Panel>

      </main>

    );

  }



  return (

    <main style={pageStyle}>

      <div

        style={{

          display: "flex",

          justifyContent: "space-between",

          alignItems: "flex-start",

          gap: 16,

          marginBottom: 24,

        }}

      >

        <div>

          <h1 style={titleStyle}>My Progress</h1>

          <p style={subtitleStyle}>

            Your learning journey, achievements and activity at a glance.

          </p>

        </div>



        <button

          onClick={() => {

            setRefreshing(true);

            loadProgress();

          }}

          disabled={refreshing}

          style={{

            ...secondaryButtonStyle,

            opacity: refreshing ? 0.6 : 1,

          }}

        >

          <RefreshCw

            size={14}

            style={{

              animation: refreshing

                ? "spin 0.8s linear infinite"

                : undefined,

            }}

          />

          Refresh

        </button>

      </div>



      <div style={summaryGridStyle}>

        <SummaryCard

          icon={<BookOpen size={19} />}

          label="Enrolled Courses"

          value={String(analytics.totalCourses)}

        />

        <SummaryCard

          icon={<BarChart3 size={19} />}

          label="Overall Progress"

          value={`${analytics.averageProgress}%`}

        />

        <SummaryCard

          icon={<CheckCircle2 size={19} />}

          label="Completed Courses"

          value={`${analytics.completedCourses}/${analytics.totalCourses}`}

        />

        <SummaryCard

          icon={<Award size={19} />}

          label="Certificates"

          value={String(analytics.totalCertificates)}

        />

      </div>



      <section style={twoColumnStyle}>

        <Panel>

          <SectionHeader

            icon={<BarChart3 size={17} />}

            title="Course Status"

            subtitle="Current status of your enrolled courses"

          />



          <div style={donutLayoutStyle}>

            <DonutChart

              value={

                analytics.totalCourses === 0

                  ? 0

                  : Math.round(

                      (analytics.completedCourses /

                        analytics.totalCourses) *

                        100

                    )

              }

              centerLabel={`${analytics.completedCourses}`}

              centerSubLabel="completed"

              segments={[

                {

                  value: analytics.completedCourses,

                  label: "Completed",

                  color: "#16A34A",

                },

                {

                  value: analytics.inProgressCourses,

                  label: "In Progress",

                  color: "#A01441",

                },

                {

                  value: analytics.notStartedCourses,

                  label: "Not Started",

                  color: "#D1D5DB",

                },

              ]}

            />



            <div style={legendStyle}>

              <LegendRow

                color="#16A34A"

                label="Completed"

                value={analytics.completedCourses}

              />

              <LegendRow

                color="#A01441"

                label="In Progress"

                value={analytics.inProgressCourses}

              />

              <LegendRow

                color="#D1D5DB"

                label="Not Started"

                value={analytics.notStartedCourses}

              />

            </div>

          </div>

        </Panel>



        <Panel>

          <SectionHeader

            icon={<GraduationCap size={17} />}

            title="Lesson Completion"

            subtitle="Completed versus remaining lessons"

          />



          <div style={donutLayoutStyle}>

            <DonutChart

              value={

                analytics.totalLessons === 0

                  ? 0

                  : Math.round(

                      (analytics.completedLessons /

                        analytics.totalLessons) *

                        100

                    )

              }

              centerLabel={`${analytics.completedLessons}`}

              centerSubLabel="completed"

              segments={[

                {

                  value: analytics.completedLessons,

                  label: "Completed",

                  color: "#3B6BF0",

                },

                {

                  value: analytics.remainingLessons,

                  label: "Remaining",

                  color: "#E5E7EB",

                },

              ]}

            />



            <div style={legendStyle}>

              <LegendRow

                color="#3B6BF0"

                label="Completed Lessons"

                value={analytics.completedLessons}

              />

              <LegendRow

                color="#E5E7EB"

                label="Remaining Lessons"

                value={analytics.remainingLessons}

              />

              <div

                style={{

                  marginTop: 8,

                  padding: "10px 12px",

                  background: "#F8FAFC",

                  borderRadius: 9,

                  fontSize: 11,

                  color: "#6B7280",

                }}

              >

                Total lessons:{" "}

                <strong style={{ color: "#111827" }}>

                  {analytics.totalLessons}

                </strong>

              </div>

            </div>

          </div>

        </Panel>

      </section>



      <Panel style={{ marginBottom: 20 }}>

        <SectionHeader

          icon={<BookOpen size={17} />}

          title="Course Progress"

          subtitle="Detailed progress without duplicating the My Courses page"

        />



        {courseRows.length === 0 ? (

          <EmptyState

            icon={<BookOpen size={30} />}

            text="No enrolled courses yet."

          />

        ) : (

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {courseRows.map((item) => {

              const percentage = Math.min(

                100,

                Math.max(0, item.progress.progressPercentage)

              );

              const completed = percentage === 100;



              return (

                <div key={item.course.id}>

                  <div

                    style={{

                      display: "flex",

                      justifyContent: "space-between",

                      gap: 12,

                      marginBottom: 6,

                    }}

                  >

                    <div style={{ minWidth: 0 }}>

                      <div

                        style={{

                          fontSize: 13,

                          fontWeight: 650,

                          color: "#111827",

                        }}

                      >

                        {item.course.title}

                      </div>

                      {item.packageName && (

                        <div

                          style={{

                            fontSize: 10.5,

                            color: "#9CA3AF",

                            marginTop: 2,

                          }}

                        >

                          From package: {item.packageName}

                        </div>

                      )}

                    </div>



                    <span

                      style={{

                        fontSize: 12,

                        fontWeight: 700,

                        color: completed ? "#15803D" : "#A01441",

                        flexShrink: 0,

                      }}

                    >

                      {percentage}%

                    </span>

                  </div>



                  <div

                    style={{

                      height: 9,

                      borderRadius: 999,

                      background: "#EEF0F4",

                      overflow: "hidden",

                    }}

                  >

                    <div

                      style={{

                        height: "100%",

                        width: `${percentage}%`,

                        borderRadius: 999,

                        background: completed ? "#16A34A" : "#A01441",

                        transition: "width 0.35s ease",

                      }}

                    />

                  </div>



                  <div

                    style={{

                      display: "flex",

                      gap: 18,

                      marginTop: 6,

                      fontSize: 10.5,

                      color: "#6B7280",

                    }}

                  >

                    <span>

                      {item.progress.completedLessons}/

                      {item.progress.totalLessons} lessons completed

                    </span>

                    <span>

                      {item.progress.remainingLessons} remaining

                    </span>

                    {completed && (

                      <span

                        style={{

                          color: "#15803D",

                          fontWeight: 650,

                        }}

                      >

                        Course completed

                      </span>

                    )}

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </Panel>



      <section style={twoColumnStyle}>

        <Panel>

          <SectionHeader

            icon={<FileCheck2 size={17} />}

            title="Assignments & Quizzes"

            subtitle="Your assessment activity"

          />



          <div style={metricGridStyle}>

            <MetricBox

              label="Total"

              value={analytics.totalAssessments}

            />

            <MetricBox

              label="Attempted"

              value={analytics.attemptedAssessments}

            />

            <MetricBox

              label="Pending"

              value={analytics.pendingAssessments}

            />

            <MetricBox

              label="Average Score"

              value={

                analytics.averageScore === null

                  ? "—"

                  : `${analytics.averageScore}%`

              }

            />

          </div>



          <div style={assessmentSplitStyle}>

            <SmallStat

              icon={<PlayCircle size={15} />}

              label="Quizzes"

              value={analytics.quizCount}

            />

            <SmallStat

              icon={<FileCheck2 size={15} />}

              label="Assignments"

              value={analytics.assignmentCount}

            />

          </div>



          {assessments.length > 0 && (

            <div style={{ marginTop: 16 }}>

              {assessments.slice(0, 4).map((assessment) => {

                const submission = assessment.latestSubmission;



                return (

                  <div

                    key={assessment.id}

                    style={{

                      display: "flex",

                      justifyContent: "space-between",

                      gap: 12,

                      padding: "10px 0",

                      borderTop: "1px solid #F0F1F3",

                    }}

                  >

                    <div style={{ minWidth: 0 }}>

                      <div

                        style={{

                          fontSize: 11.5,

                          fontWeight: 600,

                          color: "#374151",

                          overflow: "hidden",

                          textOverflow: "ellipsis",

                          whiteSpace: "nowrap",

                        }}

                      >

                        {assessment.title}

                      </div>

                      <div

                        style={{

                          fontSize: 10,

                          color: "#9CA3AF",

                          marginTop: 2,

                        }}

                      >

                        {assessment.type}

                        {assessment.courseTitle

                          ? ` · ${assessment.courseTitle}`

                          : ""}

                      </div>

                    </div>



                    <span

                      style={{

                        flexShrink: 0,

                        fontSize: 10.5,

                        fontWeight: 650,

                        color: submission

                          ? "#15803D"

                          : "#9CA3AF",

                      }}

                    >

                      {submission

                        ? typeof submission.score === "number"

                          ? `${submission.score}%`

                          : "Attempted"

                        : "Not attempted"}

                    </span>

                  </div>

                );

              })}

            </div>

          )}

        </Panel>




      </section>



      <Panel style={{ marginTop: 20 }}>

        <SectionHeader

          icon={<Trophy size={17} />}

          title="Certificates & Achievements"

          subtitle="Your completed learning milestones"

        />



        <div style={certificateSummaryStyle}>

          <div

            style={{

              display: "flex",

              alignItems: "center",

              gap: 12,

            }}

          >

            <div style={achievementIconStyle}>

              <Trophy size={20} />

            </div>

            <div>

              <div

                style={{

                  fontSize: 22,

                  fontWeight: 750,

                  color: "#111827",

                }}

              >

                {analytics.totalCertificates}

              </div>

              <div

                style={{

                  fontSize: 11,

                  color: "#6B7280",

                }}

              >

                Certificates earned

              </div>

            </div>

          </div>



          <div style={certificateCountsStyle}>

            <SmallStat

              icon={<GraduationCap size={15} />}

              label="Course"

              value={analytics.courseCertificates}

            />

            <SmallStat

              icon={<Trophy size={15} />}

              label="Package"

              value={analytics.packageCertificates}

            />

          </div>

        </div>



        {recentCertificates.length === 0 ? (

          <EmptyState

            icon={<Award size={30} />}

            text="Complete a course to earn your first certificate."

          />

        ) : (

          <div

            style={{

              display: "grid",

              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

              gap: 10,

              marginTop: 16,

            }}

          >

            {recentCertificates.map((certificate) => {

              const title =

                certificate.courseTitle ||

                certificate.course?.title ||

                certificate.packageTitle ||

                certificate.package?.title ||

                (certificate.certificateType === "PACKAGE"

                  ? "Package Certificate"

                  : "Course Certificate");



              const downloadUrl =

                certificateDownloadUrl(certificate);



              return (

                <div

                  key={certificate.id}

                  style={{

                    border: "1px solid #E5E7EB",

                    borderRadius: 10,

                    padding: "13px 14px",

                    background: "#FAFBFC",

                  }}

                >

                  <div

                    style={{

                      display: "flex",

                      justifyContent: "space-between",

                      gap: 12,

                    }}

                  >

                    <div style={{ minWidth: 0 }}>

                      <div

                        style={{

                          fontSize: 12,

                          fontWeight: 700,

                          color: "#111827",

                        }}

                      >

                        {title}

                      </div>

                      <div

                        style={{

                          fontSize: 9.5,

                          color: "#9CA3AF",

                          marginTop: 4,

                        }}

                      >

                        {certificate.certificateType === "PACKAGE"

                          ? "Package certificate"

                          : "Course certificate"}{" "}

                        · {certificate.certificateNumber}

                      </div>

                      <div

                        style={{

                          fontSize: 9.5,

                          color: "#9CA3AF",

                          marginTop: 2,

                        }}

                      >

                        Issued{" "}

                        {new Date(

                          certificate.issuedAt

                        ).toLocaleDateString("en-IN")}

                      </div>

                    </div>



                    {downloadUrl && (

                      <a

                        href={downloadUrl}

                        target="\_blank"

                        rel="noreferrer"

                        style={{

                          ...secondaryButtonStyle,

                          padding: "7px 9px",

                          fontSize: 10,

                          textDecoration: "none",

                          alignSelf: "center",

                        }}

                      >

                        View

                      </a>

                    )}

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </Panel>



      <div

        style={{

          marginTop: 20,

          padding: "13px 15px",

          borderRadius: 10,

          background: "#F8FAFC",

          border: "1px solid #E5E7EB",

          display: "flex",

          alignItems: "center",

          gap: 10,

          color: "#6B7280",

          fontSize: 11,

        }}

      >

        <Clock3 size={15} />

        Progress is calculated from your actual course lessons, assessments,

        certificates and assessment activity.

      </div>



      <style jsx>{`

        @keyframes spin {

          from {

            transform: rotate(0deg);

          }

          to {

            transform: rotate(360deg);

          }

        }



        @media (max-width: 900px) {

          main {

            padding: 22px 18px !important;

          }

        }



        @media (max-width: 700px) {

          section {

            grid-template-columns: 1fr !important;

          }



          div[style*="repeat(4, minmax(0, 1fr))"] {

            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

          }



          div[style*="repeat(2, minmax(0, 1fr))"] {

            grid-template-columns: 1fr !important;

          }

        }



        @media (max-width: 480px) {

          div[style*="repeat(4, minmax(0, 1fr))"] {

            grid-template-columns: 1fr !important;

          }

        }

      `}</style>

    </main>

  );

}



function DonutChart({

  value,

  centerLabel,

  centerSubLabel,

  segments,

}: {

  value: number;

  centerLabel: string;

  centerSubLabel: string;

  segments: {

    value: number;

    label: string;

    color: string;

  }[];

}) {

  const total = segments.reduce((sum, item) => sum + item.value, 0);

  let offset = 0;



  const gradient =

    total === 0

      ? "#E5E7EB"

      : `conic-gradient(${segments

          .map((segment) => {

            const start = (offset / total) * 100;

            offset += segment.value;

            const end = (offset / total) * 100;

            return `${segment.color} ${start}% ${end}%`;

          })

          .join(", ")})`;



  return (

    <div

      style={{

        width: 150,

        height: 150,

        borderRadius: "50%",

        background: gradient,

        position: "relative",

        flexShrink: 0,

        display: "grid",

        placeItems: "center",

      }}

      aria-label={`${value}%`}

    >

      <div

        style={{

          width: 106,

          height: 106,

          borderRadius: "50%",

          background: "#FFFFFF",

          display: "flex",

          flexDirection: "column",

          alignItems: "center",

          justifyContent: "center",

          boxShadow: "0 0 0 1px #F3F4F6",

        }}

      >

        <div

          style={{

            fontSize: 24,

            fontWeight: 750,

            color: "#111827",

            lineHeight: 1,

          }}

        >

          {centerLabel}

        </div>

        <div

          style={{

            fontSize: 9.5,

            color: "#9CA3AF",

            marginTop: 5,

          }}

        >

          {centerSubLabel}

        </div>

      </div>

    </div>

  );

}



function SummaryCard({

  icon,

  label,

  value,

}: {

  icon: ReactNode;

  label: string;

  value: string;

}) {

  return (

    <div

      style={{

        background: "#FFFFFF",

        border: "1px solid #E5E7EB",

        borderRadius: 12,

        padding: "15px 16px",

        display: "flex",

        alignItems: "center",

        gap: 11,

      }}

    >

      <div

        style={{

          width: 37,

          height: 37,

          borderRadius: 9,

          background: "#F8EAF0",

          color: "#A01441",

          display: "grid",

          placeItems: "center",

          flexShrink: 0,

        }}

      >

        {icon}

      </div>



      <div style={{ minWidth: 0 }}>

        <div

          style={{

            fontSize: 10.5,

            color: "#6B7280",

            marginBottom: 3,

          }}

        >

          {label}

        </div>

        <div

          style={{

            fontSize: 17,

            fontWeight: 750,

            color: "#111827",

          }}

        >

          {value}

        </div>

      </div>

    </div>

  );

}



function Panel({

  children,

  style,

}: {

  children: ReactNode;

  style?: CSSProperties;

}) {

  return (

    <div

      style={{

        background: "#FFFFFF",

        border: "1px solid #E5E7EB",

        borderRadius: 14,

        padding: "19px 20px",

        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",

        ...style,

      }}

    >

      {children}

    </div>

  );

}



function SectionHeader({

  icon,

  title,

  subtitle,

}: {

  icon: ReactNode;

  title: string;

  subtitle: string;

}) {

  return (

    <div

      style={{

        display: "flex",

        alignItems: "flex-start",

        gap: 9,

        marginBottom: 18,

      }}

    >

      <div

        style={{

          width: 31,

          height: 31,

          borderRadius: 8,

          background: "#F8EAF0",

          color: "#A01441",

          display: "grid",

          placeItems: "center",

          flexShrink: 0,

        }}

      >

        {icon}

      </div>



      <div>

        <h2

          style={{

            margin: 0,

            fontSize: 14,

            fontWeight: 700,

            color: "#111827",

          }}

        >

          {title}

        </h2>

        <p

          style={{

            margin: "3px 0 0",

            fontSize: 10.5,

            color: "#9CA3AF",

          }}

        >

          {subtitle}

        </p>

      </div>

    </div>

  );

}



function LegendRow({

  color,

  label,

  value,

}: {

  color: string;

  label: string;

  value: number;

}) {

  return (

    <div

      style={{

        display: "flex",

        alignItems: "center",

        justifyContent: "space-between",

        gap: 15,

        padding: "7px 0",

      }}

    >

      <div

        style={{

          display: "flex",

          alignItems: "center",

          gap: 8,

          minWidth: 0,

        }}

      >

        <span

          style={{

            width: 8,

            height: 8,

            borderRadius: "50%",

            background: color,

            flexShrink: 0,

          }}

        />

        <span

          style={{

            fontSize: 11,

            color: "#6B7280",

          }}

        >

          {label}

        </span>

      </div>



      <strong

        style={{

          fontSize: 12,

          color: "#111827",

        }}

      >

        {value}

      </strong>

    </div>

  );

}



function MetricBox({

  label,

  value,

}: {

  label: string;

  value: string | number;

}) {

  return (

    <div

      style={{

        background: "#F9FAFB",

        border: "1px solid #F0F1F3",

        borderRadius: 9,

        padding: "10px 11px",

      }}

    >

      <div

        style={{

          fontSize: 9.5,

          color: "#9CA3AF",

          marginBottom: 4,

        }}

      >

        {label}

      </div>

      <div

        style={{

          fontSize: 16,

          fontWeight: 750,

          color: "#111827",

        }}

      >

        {value}

      </div>

    </div>

  );

}



function SmallStat({

  icon,

  label,

  value,

}: {

  icon: ReactNode;

  label: string;

  value: number;

}) {

  return (

    <div

      style={{

        display: "flex",

        alignItems: "center",

        gap: 8,

        padding: "8px 10px",

        borderRadius: 8,

        background: "#FAFBFC",

        border: "1px solid #F0F1F3",

      }}

    >

      <span style={{ color: "#A01441", display: "flex" }}>{icon}</span>

      <span style={{ fontSize: 10.5, color: "#6B7280" }}>

        {label}

      </span>

      <strong

        style={{

          marginLeft: "auto",

          fontSize: 12,

          color: "#111827",

        }}

      >

        {value}

      </strong>

    </div>

  );

}



function EmptyState({

  icon,

  text,

}: {

  icon: ReactNode;

  text: string;

}) {

  return (

    <div

      style={{

        padding: "24px 10px 8px",

        textAlign: "center",

        color: "#9CA3AF",

      }}

    >

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>

        {icon}

      </div>

      <div style={{ fontSize: 11.5 }}>{text}</div>

    </div>

  );

}



const pageStyle: CSSProperties = {

  padding: "28px 32px",

  flex: 1,

  minWidth: 0,

};



const titleStyle: CSSProperties = {

  fontSize: 24,

  fontWeight: 700,

  color: "#111827",

  margin: "0 0 5px",

};



const subtitleStyle: CSSProperties = {

  color: "#6B7280",

  fontSize: 14,

  margin: 0,

};



const mutedTextStyle: CSSProperties = {

  color: "#6B7280",

  fontSize: 13,

  margin: 0,

};



const summaryGridStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

  gap: 14,

  marginBottom: 20,

};



const twoColumnStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

  gap: 18,

  marginBottom: 20,

};



const donutLayoutStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  gap: 28,

  minHeight: 165,

};



const legendStyle: CSSProperties = {

  minWidth: 145,

};



const metricGridStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

  gap: 9,

};



const assessmentSplitStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

  gap: 9,

  marginTop: 10,

};



const certificateSummaryStyle: CSSProperties = {

  display: "flex",

  justifyContent: "space-between",

  alignItems: "center",

  gap: 18,

  padding: "13px 14px",

  borderRadius: 10,

  background: "#FFFBEB",

  border: "1px solid #FDE68A",

};



const certificateCountsStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

  gap: 9,

  minWidth: 210,

};



const achievementIconStyle: CSSProperties = {

  width: 42,

  height: 42,

  borderRadius: 10,

  display: "grid",

  placeItems: "center",

  background: "#FEF3C7",

  color: "#B45309",

};



const primaryButtonStyle: CSSProperties = {

  border: "none",

  background: "#A01441",

  color: "#FFFFFF",

  borderRadius: 8,

  padding: "10px 18px",

  fontSize: 13,

  fontWeight: 600,

  cursor: "pointer",

};



const secondaryButtonStyle: CSSProperties = {

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  gap: 7,

  border: "1px solid #D7DCE5",

  background: "#FFFFFF",

  color: "#374151",

  borderRadius: 8,

  padding: "9px 13px",

  fontSize: 12,

  fontWeight: 600,

  cursor: "pointer",

};



const spinnerStyle: CSSProperties = {

  width: 40,

  height: 40,

  margin: "0 auto 14px",

  borderRadius: "50%",

  border: "4px solid #E5E7EB",

  borderTopColor: "#A01441",

  animation: "spin 0.8s linear infinite",

};




