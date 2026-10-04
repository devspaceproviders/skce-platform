"use client";



import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import {

  ArrowRight,

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
      <main className="progress-page" style={pageStyle}>
        <div className="progress-loading-card">
          <div style={spinnerStyle} />
          <p className="progress-loading-title">Loading your progress...</p>
          <p className="progress-loading-subtitle">
            Preparing your learning overview.
          </p>
        </div>
        <style jsx global>{`
        @keyframes progressSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .progress-page {
          width: 100%;
          min-height: 100%;
          box-sizing: border-box;
          background: #f5f7fb;
        }

        .progress-page > * {
          box-sizing: border-box;
        }

        .progress-header-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 16px 18px;
          margin-bottom: 12px;
          border: 1px solid #e2e7ef;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.025);
        }

        .progress-header-copy { min-width: 0; }

        .progress-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 5px;
          color: #a01441;
          font-size: 9.5px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .progress-header-card h1 {
          margin: 0;
          color: #111827;
          font-size: 24px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .progress-header-card p {
          margin: 5px 0 0;
          color: #808b9b;
          font-size: 11px;
          line-height: 1.45;
        }

        .progress-refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 0 0 auto;
          min-width: 92px;
          border: 1px solid #d7dce5;
          border-radius: 8px;
          padding: 8px 11px;
          background: #ffffff;
          color: #334155;
          font-size: 10.5px;
          font-weight: 750;
          cursor: pointer;
        }

        .progress-refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .progress-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }

        .progress-stat-card {
          min-width: 0;
          min-height: 72px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border: 1px solid #e2e7ef;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 3px 10px rgba(15, 23, 42, 0.02);
        }

        .progress-stat-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 34px;
          border-radius: 10px;
        }

        .progress-stat-icon.blue { background: #eaf0ff; color: #316cf2; }
        .progress-stat-icon.rose { background: #f8e8ef; color: #a01441; }
        .progress-stat-icon.green { background: #eaf8f0; color: #198a55; }
        .progress-stat-icon.gold { background: #fff4db; color: #b7791a; }

        .progress-stat-copy { min-width: 0; }
        .progress-stat-label { color: #8b95a5; font-size: 9.5px; }
        .progress-stat-value {
          margin-top: 2px;
          color: #172033;
          font-size: 17px;
          line-height: 1.1;
          font-weight: 800;
        }
        .progress-stat-helper {
          overflow: hidden;
          margin-top: 2px;
          color: #9aa3b0;
          font-size: 8.8px;
          line-height: 1.25;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .progress-overview-grid,
        .progress-lower-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .progress-overview-grid > *,
        .progress-lower-grid > * {
          align-self: start;
          min-width: 0;
        }

        .progress-overview-content {
          display: grid;
          grid-template-columns: 122px minmax(0, 1fr);
          align-items: center;
          gap: 14px;
          min-height: 116px;
        }

        .progress-overview-legend {
          width: 100%;
          max-width: none;
        }

        .progress-mini-highlight {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 6px;
          padding: 8px 9px;
          border: 1px solid #edf0f4;
          border-radius: 8px;
          background: #f8fafc;
          color: #738096;
          font-size: 9.5px;
        }

        .progress-mini-highlight strong { color: #172033; font-size: 11px; }

        .course-progress-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .course-progress-row {
          padding: 10px 11px;
          border: 1px solid #e8ecf2;
          border-radius: 11px;
          background: #fbfcfe;
        }

        .course-progress-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .course-progress-name-wrap {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .course-progress-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          flex: 0 0 31px;
          border-radius: 8px;
          background: #edf3ff;
          color: #316cf2;
        }

        .course-progress-name-block { min-width: 0; }
        .course-progress-name {
          overflow: hidden;
          color: #1f2937;
          font-size: 11.5px;
          font-weight: 800;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .course-progress-meta {
          overflow: hidden;
          margin-top: 1px;
          color: #97a0af;
          font-size: 8.5px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .course-progress-percent {
          flex: 0 0 auto;
          color: #a01441;
          font-size: 11px;
          font-weight: 800;
        }
        .course-progress-percent.completed { color: #15803d; }

        .course-progress-bar {
          height: 6px;
          overflow: hidden;
          margin-top: 7px;
          border-radius: 999px;
          background: #e9edf4;
        }

        .course-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #a01441, #cf4d78);
          transition: width 0.35s ease;
        }
        .course-progress-fill.completed {
          background: linear-gradient(90deg, #16a34a, #43b86f);
        }

        .course-progress-bottomline {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 4px;
          color: #8993a4;
          font-size: 8.5px;
        }
        .course-completed-label { color: #15803d; font-weight: 750; }

        .progress-assessment-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
        }
        .progress-assessment-types {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
          margin-top: 8px;
        }
        .assessment-activity-list { margin-top: 8px; }
        .assessment-activity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 6px 0;
          border-top: 1px solid #edf0f4;
        }
        .assessment-activity-main { min-width: 0; }
        .assessment-activity-title {
          overflow: hidden;
          color: #374151;
          font-size: 10.2px;
          font-weight: 700;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .assessment-activity-meta {
          overflow: hidden;
          margin-top: 1px;
          color: #a0a8b5;
          font-size: 8.4px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .assessment-result-tag {
          flex: 0 0 auto;
          padding: 4px 6px;
          border: 1px solid #e4e8ef;
          border-radius: 999px;
          background: #ffffff;
          color: #98a1ae;
          font-size: 8.5px;
          font-weight: 750;
        }
        .assessment-result-tag.positive {
          border-color: #d3eddc;
          background: #f3fbf6;
          color: #198a55;
        }

        .certificate-overview {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: 7px;
          margin-bottom: 8px;
        }
        .certificate-total-card {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px;
          border: 1px solid #f4e2aa;
          border-radius: 9px;
          background: #fffaf0;
        }
        .certificate-total-icon {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          flex: 0 0 32px;
          border-radius: 9px;
          background: #fff1c9;
          color: #b45309;
        }
        .certificate-total-number {
          color: #382b18;
          font-size: 19px;
          line-height: 1;
          font-weight: 800;
        }
        .certificate-total-label {
          margin-top: 2px;
          color: #8b7a5c;
          font-size: 8.5px;
        }
        .certificate-counts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
        }
        .certificate-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .certificate-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 8px;
          border: 1px solid #e8ecf2;
          border-radius: 9px;
          background: #fbfcfe;
        }
        .certificate-row-icon {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          flex: 0 0 29px;
          border-radius: 8px;
          background: #f2eaff;
          color: #7a56d6;
        }
        .certificate-row-main { min-width: 0; flex: 1; }
        .certificate-row-title {
          overflow: hidden;
          color: #374151;
          font-size: 10px;
          font-weight: 750;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .certificate-row-meta {
          overflow: hidden;
          margin-top: 1px;
          color: #98a1ae;
          font-size: 8.2px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .certificate-view-button {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          flex: 0 0 auto;
          border: 1px solid #dbe1ea;
          border-radius: 7px;
          padding: 5px 7px;
          background: #ffffff;
          color: #4269bf;
          font-size: 8.5px;
          font-weight: 750;
          text-decoration: none;
        }

        .progress-note {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 10px;
          padding: 8px 10px;
          border: 1px solid #e5e9ef;
          border-radius: 9px;
          background: #fbfcfe;
          color: #8993a4;
          font-size: 8.8px;
          line-height: 1.4;
        }
        .progress-note svg { flex: 0 0 auto; }

        .progress-loading-card,
        .progress-error-card {
          min-height: 240px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e7ef;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.025);
          text-align: center;
        }

        .progress-loading-title {
          margin: 0;
          color: #172033;
          font-size: 15px;
          font-weight: 800;
        }
        .progress-loading-subtitle {
          margin: 5px 0 0;
          color: #919aaa;
          font-size: 10.5px;
        }
        .progress-error-card {
          padding: 24px;
          border-color: #f4c9c9;
        }
        .progress-error-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #fef1f1;
          color: #b42318;
        }
        .progress-error-card h2 {
          margin: 10px 0 0;
          color: #7f1d1d;
          font-size: 16px;
          font-weight: 800;
        }
        .progress-error-card p {
          max-width: 520px;
          margin: 5px 0 15px;
          color: #8c6c6c;
          font-size: 10.5px;
          line-height: 1.5;
        }

        @media (max-width: 1050px) {
          .progress-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .progress-overview-grid,
          .progress-lower-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 700px) {
          .progress-page { padding: 16px !important; }
          .progress-header-card { align-items: flex-start; flex-direction: column; }
          .progress-stat-grid { grid-template-columns: 1fr; }
          .progress-overview-content { grid-template-columns: 112px minmax(0, 1fr); gap: 10px; }
          .progress-assessment-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .certificate-overview { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .progress-header-card { padding: 15px; }
          .progress-header-card h1 { font-size: 22px; }
          .progress-overview-content { grid-template-columns: 1fr; justify-items: center; }
          .progress-overview-legend { width: 100%; }
          .progress-assessment-stats,
          .progress-assessment-types,
          .certificate-counts { grid-template-columns: 1fr; }
        }
      `}</style>
      </main>
    );
  }

  if (error) {
    return (
      <main className="progress-page" style={pageStyle}>
        <div className="progress-error-card">
          <div className="progress-error-icon">
            <Clock3 size={20} />
          </div>
          <h2>Unable to load progress</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              loadProgress();
            }}
            style={primaryButtonStyle}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="progress-page" style={pageStyle}>
      <section className="progress-header-card">
        <div className="progress-header-copy">
          <div className="progress-kicker">
            <GraduationCap size={15} />
            STUDENT LEARNING
          </div>
          <h1>My Progress</h1>
          <p>
            See how your courses, lessons, assessments and achievements are
            progressing in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            loadProgress();
          }}
          disabled={refreshing}
          className="progress-refresh-button"
        >
          <RefreshCw
            size={15}
            style={
              refreshing
                ? { animation: "progressSpin 0.8s linear infinite" }
                : undefined
            }
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      <section className="progress-stat-grid">
        <ProgressStatCard
          icon={<BookOpen size={18} />}
          label="Enrolled Courses"
          value={String(analytics.totalCourses)}
          helper={`${analytics.completedCourses} completed`}
          tone="blue"
        />
        <ProgressStatCard
          icon={<BarChart3 size={18} />}
          label="Overall Progress"
          value={`${analytics.averageProgress}%`}
          helper={`${analytics.completedLessons}/${analytics.totalLessons || 0} lessons`}
          tone="rose"
        />
        <ProgressStatCard
          icon={<CheckCircle2 size={18} />}
          label="Completed Courses"
          value={`${analytics.completedCourses}/${analytics.totalCourses}`}
          helper={`${analytics.inProgressCourses} in progress`}
          tone="green"
        />
        <ProgressStatCard
          icon={<Award size={18} />}
          label="Certificates"
          value={String(analytics.totalCertificates)}
          helper={`${analytics.courseCertificates} course · ${analytics.packageCertificates} package`}
          tone="gold"
        />
      </section>

      <section className="progress-overview-grid">
        <Panel style={{ padding: 16 }}>
          <SectionHeader
            icon={<BarChart3 size={17} />}
            title="Course Overview"
            subtitle="A quick breakdown of where your enrolled courses stand"
          />

          <div className="progress-overview-content">
            <DonutChart
              value={
                analytics.totalCourses === 0
                  ? 0
                  : Math.round(
                      (analytics.completedCourses / analytics.totalCourses) * 100
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
                  color: "#D7DCE5",
                },
              ]}
            />

            <div className="progress-overview-legend">
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
                color="#D7DCE5"
                label="Not Started"
                value={analytics.notStartedCourses}
              />
            </div>
          </div>
        </Panel>

        <Panel style={{ padding: 16 }}>
          <SectionHeader
            icon={<GraduationCap size={17} />}
            title="Lesson Completion"
            subtitle="Your completed lessons across enrolled courses"
          />

          <div className="progress-overview-content">
            <DonutChart
              value={
                analytics.totalLessons === 0
                  ? 0
                  : Math.round(
                      (analytics.completedLessons / analytics.totalLessons) * 100
                    )
              }
              centerLabel={`${analytics.completedLessons}`}
              centerSubLabel="lessons"
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

            <div className="progress-overview-legend">
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
              <div className="progress-mini-highlight">
                <span>Total lessons</span>
                <strong>{analytics.totalLessons}</strong>
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <Panel style={{ marginBottom: 12, padding: 16 }}>
        <SectionHeader
          icon={<BookOpen size={17} />}
          title="Course Progress"
          subtitle="Detailed progress for every enrolled course"
        />

        {courseRows.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={30} />}
            text="No enrolled courses yet."
          />
        ) : (
          <div className="course-progress-list">
            {courseRows.map((item) => {
              const percentage = Math.min(
                100,
                Math.max(0, item.progress.progressPercentage)
              );
              const completed = percentage === 100;

              return (
                <div className="course-progress-row" key={item.course.id}>
                  <div className="course-progress-topline">
                    <div className="course-progress-name-wrap">
                      <div className="course-progress-icon">
                        <BookOpen size={16} />
                      </div>
                      <div className="course-progress-name-block">
                        <div className="course-progress-name">
                          {item.course.title}
                        </div>
                        <div className="course-progress-meta">
                          {item.packageName
                            ? `From package: ${item.packageName}`
                            : "Direct enrollment"}
                        </div>
                      </div>
                    </div>

                    <span
                      className={
                        completed
                          ? "course-progress-percent completed"
                          : "course-progress-percent"
                      }
                    >
                      {percentage}%
                    </span>
                  </div>

                  <div className="course-progress-bar">
                    <div
                      className={
                        completed
                          ? "course-progress-fill completed"
                          : "course-progress-fill"
                      }
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="course-progress-bottomline">
                    <span>
                      {item.progress.completedLessons}/
                      {item.progress.totalLessons} lessons completed
                    </span>
                    <span>{item.progress.remainingLessons} remaining</span>
                    {completed ? (
                      <span className="course-completed-label">
                        Course completed
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <section className="progress-lower-grid">
        <Panel style={{ padding: 16 }}>
          <SectionHeader
            icon={<FileCheck2 size={17} />}
            title="Assignments & Quizzes"
            subtitle="Your latest assessment activity"
          />

          <div className="progress-assessment-stats">
            <MetricBox label="Total" value={analytics.totalAssessments} />
            <MetricBox label="Attempted" value={analytics.attemptedAssessments} />
            <MetricBox label="Pending" value={analytics.pendingAssessments} />
            <MetricBox
              label="Average Score"
              value={
                analytics.averageScore === null
                  ? "—"
                  : `${analytics.averageScore}%`
              }
            />
          </div>

          <div className="progress-assessment-types">
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

          {assessments.length > 0 ? (
            <div className="assessment-activity-list">
              {assessments.slice(0, 5).map((assessment) => {
                const submission = assessment.latestSubmission;
                return (
                  <div className="assessment-activity-row" key={assessment.id}>
                    <div className="assessment-activity-main">
                      <div className="assessment-activity-title">
                        {assessment.title}
                      </div>
                      <div className="assessment-activity-meta">
                        {assessment.type}
                        {assessment.courseTitle
                          ? ` · ${assessment.courseTitle}`
                          : ""}
                      </div>
                    </div>
                    <span
                      className={
                        submission
                          ? "assessment-result-tag positive"
                          : "assessment-result-tag"
                      }
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
          ) : (
            <EmptyState
              icon={<FileCheck2 size={28} />}
              text="No assessment activity yet."
            />
          )}
        </Panel>

        <Panel style={{ padding: 16 }}>
          <SectionHeader
            icon={<Trophy size={17} />}
            title="Certificates & Achievements"
            subtitle="Your earned learning milestones"
          />

          <div className="certificate-overview">
            <div className="certificate-total-card">
              <div className="certificate-total-icon">
                <Trophy size={19} />
              </div>
              <div>
                <div className="certificate-total-number">
                  {analytics.totalCertificates}
                </div>
                <div className="certificate-total-label">
                  Certificates earned
                </div>
              </div>
            </div>

            <div className="certificate-counts">
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
              icon={<Award size={28} />}
              text="Complete a course to earn your first certificate."
            />
          ) : (
            <div className="certificate-list">
              {recentCertificates.map((certificate) => {
                const title =
                  certificate.courseTitle ||
                  certificate.course?.title ||
                  certificate.packageTitle ||
                  certificate.package?.title ||
                  (certificate.certificateType === "PACKAGE"
                    ? "Package Certificate"
                    : "Course Certificate");

                const downloadUrl = certificateDownloadUrl(certificate);

                return (
                  <div className="certificate-row" key={certificate.id}>
                    <div className="certificate-row-icon">
                      <Award size={16} />
                    </div>
                    <div className="certificate-row-main">
                      <div className="certificate-row-title">{title}</div>
                      <div className="certificate-row-meta">
                        {certificate.certificateType === "PACKAGE"
                          ? "Package certificate"
                          : "Course certificate"}
                        {certificate.certificateNumber
                          ? ` · ${certificate.certificateNumber}`
                          : ""}
                        {certificate.issuedAt
                          ? ` · ${new Date(certificate.issuedAt).toLocaleDateString("en-IN")}`
                          : ""}
                      </div>
                    </div>
                    {downloadUrl ? (
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="certificate-view-button"
                      >
                        View
                        <ArrowRight size={13} />
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </section>

      <div className="progress-note">
        <Clock3 size={15} />
        <span>
          Progress is calculated from your actual course lessons, assessments,
          certificates and assessment activity.
        </span>
      </div>

      <style jsx global>{`
        @keyframes progressSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .progress-page {
          width: 100%;
          min-height: 100%;
          background: #f5f7fb;
          box-sizing: border-box;
        }

        .progress-header-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          padding: 24px 26px;
          margin-bottom: 16px;
          border: 1px solid #e2e7ef;
          border-radius: 18px;
          background: linear-gradient(135deg, #ffffff 0%, #fbfcff 100%);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.035);
        }

        .progress-header-copy { min-width: 0; }

        .progress-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 7px;
          color: #a01441;
          font-size: 10px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: 0.09em;
        }

        .progress-header-card h1 {
          margin: 0;
          color: #111827;
          font-size: 28px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .progress-header-card p {
          max-width: 720px;
          margin: 7px 0 0;
          color: #7c8798;
          font-size: 12.5px;
          line-height: 1.6;
        }

        .progress-refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          flex: 0 0 auto;
          min-width: 104px;
          border: 1px solid #d7dce5;
          border-radius: 9px;
          padding: 10px 13px;
          background: #ffffff;
          color: #334155;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .progress-refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .progress-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .progress-stat-card {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 15px 16px;
          border: 1px solid #e2e7ef;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.025);
        }

        .progress-stat-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          flex: 0 0 38px;
          border-radius: 11px;
        }

        .progress-stat-icon.blue { background: #eaf0ff; color: #316cf2; }
        .progress-stat-icon.rose { background: #f8e8ef; color: #a01441; }
        .progress-stat-icon.green { background: #eaf8f0; color: #198a55; }
        .progress-stat-icon.gold { background: #fff4db; color: #b7791a; }

        .progress-stat-copy { min-width: 0; }
        .progress-stat-label { color: #8b95a5; font-size: 10px; }
        .progress-stat-value {
          margin-top: 2px;
          color: #172033;
          font-size: 19px;
          line-height: 1.15;
          font-weight: 800;
        }
        .progress-stat-helper {
          overflow: hidden;
          margin-top: 3px;
          color: #9aa3b0;
          font-size: 9.5px;
          line-height: 1.3;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .progress-overview-grid,
        .progress-lower-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .progress-overview-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 26px;
          min-height: 172px;
        }

        .progress-overview-legend {
          width: 100%;
          max-width: 220px;
        }

        .progress-mini-highlight {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 8px;
          padding: 9px 11px;
          border: 1px solid #edf0f4;
          border-radius: 9px;
          background: #f8fafc;
          color: #738096;
          font-size: 10.5px;
        }

        .progress-mini-highlight strong { color: #172033; font-size: 12px; }

        .course-progress-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .course-progress-row {
          padding: 14px;
          border: 1px solid #e8ecf2;
          border-radius: 13px;
          background: #fbfcfe;
        }

        .course-progress-topline,
        .course-progress-bottomline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .course-progress-name-wrap {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .course-progress-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 34px;
          border-radius: 9px;
          background: #edf3ff;
          color: #316cf2;
        }

        .course-progress-name-block { min-width: 0; }
        .course-progress-name {
          overflow: hidden;
          color: #1f2937;
          font-size: 12.5px;
          font-weight: 800;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .course-progress-meta {
          overflow: hidden;
          margin-top: 2px;
          color: #97a0af;
          font-size: 9.5px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .course-progress-percent {
          flex: 0 0 auto;
          color: #a01441;
          font-size: 12px;
          font-weight: 800;
        }
        .course-progress-percent.completed { color: #15803d; }

        .course-progress-bar {
          height: 8px;
          overflow: hidden;
          margin-top: 11px;
          border-radius: 999px;
          background: #e9edf4;
        }

        .course-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #a01441, #cf4d78);
          transition: width 0.35s ease;
        }
        .course-progress-fill.completed {
          background: linear-gradient(90deg, #16a34a, #43b86f);
        }

        .course-progress-bottomline {
          justify-content: flex-start;
          flex-wrap: wrap;
          margin-top: 7px;
          color: #8993a4;
          font-size: 9.5px;
        }
        .course-completed-label { color: #15803d; font-weight: 750; }

        .progress-assessment-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }
        .progress-assessment-types {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 9px;
        }
        .assessment-activity-list { margin-top: 14px; }
        .assessment-activity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-top: 1px solid #edf0f4;
        }
        .assessment-activity-main { min-width: 0; }
        .assessment-activity-title {
          overflow: hidden;
          color: #374151;
          font-size: 10.8px;
          font-weight: 700;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .assessment-activity-meta {
          overflow: hidden;
          margin-top: 2px;
          color: #a0a8b5;
          font-size: 9px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .assessment-result-tag {
          flex: 0 0 auto;
          padding: 5px 7px;
          border: 1px solid #e4e8ef;
          border-radius: 999px;
          background: #ffffff;
          color: #98a1ae;
          font-size: 9px;
          font-weight: 750;
        }
        .assessment-result-tag.positive {
          border-color: #d3eddc;
          background: #f3fbf6;
          color: #198a55;
        }

        .certificate-overview {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
          gap: 10px;
          margin-bottom: 12px;
        }
        .certificate-total-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid #f4e2aa;
          border-radius: 11px;
          background: #fffaf0;
        }
        .certificate-total-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          flex: 0 0 38px;
          border-radius: 10px;
          background: #fff1c9;
          color: #b45309;
        }
        .certificate-total-number {
          color: #382b18;
          font-size: 20px;
          line-height: 1;
          font-weight: 800;
        }
        .certificate-total-label {
          margin-top: 3px;
          color: #8b7a5c;
          font-size: 9.5px;
        }
        .certificate-counts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .certificate-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .certificate-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid #e8ecf2;
          border-radius: 10px;
          background: #fbfcfe;
        }
        .certificate-row-icon {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          flex: 0 0 32px;
          border-radius: 9px;
          background: #f2eaff;
          color: #7a56d6;
        }
        .certificate-row-main { min-width: 0; flex: 1; }
        .certificate-row-title {
          overflow: hidden;
          color: #374151;
          font-size: 10.8px;
          font-weight: 750;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .certificate-row-meta {
          overflow: hidden;
          margin-top: 2px;
          color: #98a1ae;
          font-size: 8.8px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .certificate-view-button {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex: 0 0 auto;
          border: 1px solid #dbe1ea;
          border-radius: 8px;
          padding: 6px 8px;
          background: #ffffff;
          color: #4269bf;
          font-size: 9px;
          font-weight: 750;
          text-decoration: none;
        }

        .progress-note {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 11px 13px;
          border: 1px solid #e5e9ef;
          border-radius: 10px;
          background: #fbfcfe;
          color: #8993a4;
          font-size: 9.5px;
          line-height: 1.5;
        }
        .progress-note svg { flex: 0 0 auto; }

        .progress-loading-card,
        .progress-error-card {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e7ef;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.03);
          text-align: center;
        }
        .progress-loading-title {
          margin: 0;
          color: #172033;
          font-size: 15px;
          font-weight: 800;
        }
        .progress-loading-subtitle {
          margin: 5px 0 0;
          color: #919aaa;
          font-size: 10.5px;
        }
        .progress-error-card {
          padding: 28px;
          border-color: #f4c9c9;
        }
        .progress-error-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #fef1f1;
          color: #b42318;
        }
        .progress-error-card h2 {
          margin: 12px 0 0;
          color: #7f1d1d;
          font-size: 17px;
          font-weight: 800;
        }
        .progress-error-card p {
          max-width: 520px;
          margin: 6px 0 17px;
          color: #8c6c6c;
          font-size: 11px;
          line-height: 1.6;
        }

        @media (max-width: 1050px) {
          .progress-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .progress-overview-grid,
          .progress-lower-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 700px) {
          .progress-page { padding: 20px 16px !important; }
          .progress-header-card { align-items: flex-start; flex-direction: column; }
          .progress-stat-grid { grid-template-columns: 1fr; }
          .progress-overview-content { justify-content: flex-start; flex-wrap: wrap; }
          .progress-assessment-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .certificate-overview { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .progress-header-card { padding: 19px; }
          .progress-header-card h1 { font-size: 24px; }
          .progress-assessment-stats,
          .progress-assessment-types,
          .certificate-counts { grid-template-columns: 1fr; }
          .progress-overview-content { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </main>
  );
}

function ProgressStatCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "rose" | "green" | "gold";
}) {
  return (
    <div className="progress-stat-card">
      <div className={`progress-stat-icon ${tone}`}>{icon}</div>
      <div className="progress-stat-copy">
        <div className="progress-stat-label">{label}</div>
        <div className="progress-stat-value">{value}</div>
        <div className="progress-stat-helper">{helper}</div>
      </div>
    </div>
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

  padding: "18px 24px 28px",

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




