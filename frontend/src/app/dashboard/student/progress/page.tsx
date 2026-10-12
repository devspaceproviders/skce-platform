
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  GraduationCap,
  PlayCircle,
  RefreshCw,
  Trophy,
} from "lucide-react";
import {
  CountUp,
  DetailPanel,
  SkStyles,
  SkTile,
  reveal,
  usePreview,
} from "@/components/student/skce-ui";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

type TileKey = "courses" | "progress" | "completed" | "certificates";

function getToken() {
  if (typeof window === "undefined") return null;
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
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.certificates)) return value.certificates;
  if (Array.isArray(value?.assessments)) return value.assessments;
  if (Array.isArray(value?.sessions)) return value.sessions;
  return [];
}

export default function ProgressPage() {
  const router = useRouter();
  const preview = usePreview<TileKey>("courses");

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

      const dashboardRaw = await fetchJson("/students/me/dashboard", token);
      const dashboard: DashboardData = dashboardRaw?.data ?? dashboardRaw;
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
            if (!packageItem.course) continue;

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

            const progress: CourseProgress = raw?.data ?? raw;
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
        if (progress) nextProgressMap[progress.courseId] = progress;
      }

      setProgressMap(nextProgressMap);

      const [assessmentResult, certificateResult] = await Promise.allSettled([
        fetchJson("/assessments", token),
        fetchJson("/certificates", token),
      ]);

      if (assessmentResult.status === "fulfilled") {
        setAssessments(normalizeArray<Assessment>(assessmentResult.value));
      } else {
        console.error(
          "Assessment analytics could not be loaded:",
          assessmentResult.reason
        );
        setAssessments([]);
      }

      if (certificateResult.status === "fulfilled") {
        setCertificates(normalizeArray<Certificate>(certificateResult.value));
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
      (item) => item.progressPercentage > 0 && item.progressPercentage < 100
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
    const remainingLessons = Math.max(totalLessons - completedLessons, 0);

    const averageProgress =
      totalCourses === 0
        ? 0
        : Math.round(
            courseProgress.reduce(
              (sum, item) => sum + item.progressPercentage,
              0
            ) / totalCourses
          );

    const attemptedAssessments = assessments.filter((item) =>
      Boolean(item.latestSubmission)
    ).length;

    const pendingAssessments = Math.max(
      assessments.length - attemptedAssessments,
      0
    );

    const quizzes = assessments.filter((item) => item.type === "QUIZ");
    const assignments = assessments.filter(
      (item) => item.type === "ASSIGNMENT"
    );

    const scoredAssessments = assessments.filter(
      (item) =>
        item.latestSubmission && typeof item.latestSubmission.score === "number"
    );

    const averageScore =
      scoredAssessments.length === 0
        ? null
        : Math.round(
            scoredAssessments.reduce(
              (sum, item) => sum + Number(item.latestSubmission?.score ?? 0),
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

  const courseRows = useMemo(
    () =>
      courses.map((item) => ({
        ...item,
        progress: getCourseProgress(item.course.id),
      })),
    [courses, progressMap]
  );

  const recentCertificates = useMemo(
    () =>
      [...certificates]
        .sort(
          (a, b) =>
            new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
        )
        .slice(0, 4),
    [certificates]
  );

  const certificateDownloadUrl = (certificate: Certificate) => {
    if (!certificate.certificateUrl) return null;

    if (certificate.certificateUrl.startsWith("http")) {
      return certificate.certificateUrl;
    }

    return `${API_URL.replace(/\/$/, "")}${certificate.certificateUrl}`;
  };

  const certificateTitle = (certificate: Certificate) =>
    certificate.courseTitle ||
    certificate.course?.title ||
    certificate.packageTitle ||
    certificate.package?.title ||
    (certificate.certificateType === "PACKAGE"
      ? "Package Certificate"
      : "Course Certificate");

  const openCourse = (courseId: number) =>
    router.push(`/dashboard/student/my-courses/${courseId}`);

  const refresh = () => {
    setRefreshing(true);
    loadProgress();
  };

  if (loading) {
    return (
      <>
        <main className="sk-page" aria-busy="true" aria-live="polite">
          <div className="sk-container">
            <div className="sk-skel" style={{ height: 172, marginBottom: 24 }} />
            <div className="sk-tiles sk-zone">
              {[0, 1, 2, 3].map((n) => (
                <div key={n} className="sk-skel" style={{ height: 96 }} />
              ))}
            </div>
            <div className="sk-grid-2 sk-mb">
              <div className="sk-skel" style={{ height: 240 }} />
              <div className="sk-skel" style={{ height: 240 }} />
            </div>
            <div className="sk-skel" style={{ height: 300 }} />
            <span className="sk-sr">Loading your progress</span>
          </div>
        </main>
        <SkStyles />
        <style dangerouslySetInnerHTML={{ __html: progressCss }} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <main className="sk-page">
          <div className="sk-container">
            <div className="sk-error-card" role="alert">
              <div className="sk-error-icon">
                <AlertCircle size={24} />
              </div>
              <h2>Unable to load progress</h2>
              <p>{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="sk-btn sk-btn-primary"
              >
                <RefreshCw size={15} />
                Try Again
              </button>
            </div>
          </div>
        </main>
        <SkStyles />
        <style dangerouslySetInnerHTML={{ __html: progressCss }} />
      </>
    );
  }

  const tileRows =
    preview.last === "completed"
      ? courseRows.filter((row) => row.progress.progressPercentage === 100)
      : courseRows;

  const tileMeta: Record<TileKey, { title: string; subtitle: string }> = {
    courses: {
      title: "Enrolled courses",
      subtitle: `${analytics.totalCourses} courses · ${analytics.completedCourses} completed`,
    },
    progress: {
      title: "Progress by course",
      subtitle: `${analytics.averageProgress}% average · ${analytics.completedLessons}/${analytics.totalLessons} lessons`,
    },
    completed: {
      title: "Completed courses",
      subtitle: `${analytics.completedCourses} of ${analytics.totalCourses} finished`,
    },
    certificates: {
      title: "Recent certificates",
      subtitle: `${analytics.courseCertificates} course · ${analytics.packageCertificates} package`,
    },
  };

  const tileProps = (key: TileKey) => ({
    active: preview.shown === key,
    pinned: preview.pinned === key,
    onEnter: () => preview.setHover(key),
    onToggle: () => preview.toggle(key),
  });

  return (
    <>
      <main className="sk-page">
        <div className="sk-container">
          {/* SKCE gradient hero */}
          <header className="pg-hero sk-reveal">
            <div className="pg-hero-content">
              <div className="pg-hero-icon">
                <BarChart3 size={27} />
              </div>

              <div className="pg-hero-copy">
                <div className="pg-hero-kicker">STUDENT WORKSPACE</div>
                <h1>My Progress</h1>
                <p>
                  Track your courses, lessons, assessments and achievements
                  in one place.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="pg-hero-refresh"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "sk-spin" : undefined}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          <div className="sk-zone" onMouseLeave={() => preview.setHover(null)}>
            <section className="sk-tiles">
              <SkTile
                index={1}
                icon={BookOpen}
                label="Enrolled Courses"
                value={analytics.totalCourses}
                helper={`${analytics.completedCourses} completed`}
                tone="blue"
                {...tileProps("courses")}
              />
              <SkTile
                index={2}
                icon={BarChart3}
                label="Overall Progress"
                value={analytics.averageProgress}
                suffix="%"
                helper={`${analytics.completedLessons}/${analytics.totalLessons} lessons`}
                tone="orange"
                {...tileProps("progress")}
              />
              <SkTile
                index={3}
                icon={CheckCircle2}
                label="Completed Courses"
                value={analytics.completedCourses}
                suffix={`/${analytics.totalCourses}`}
                helper={`${analytics.inProgressCourses} in progress`}
                tone="green"
                {...tileProps("completed")}
              />
              <SkTile
                index={4}
                icon={Award}
                label="Certificates"
                value={analytics.totalCertificates}
                helper={`${analytics.courseCertificates} course · ${analytics.packageCertificates} package`}
                tone="navy"
                {...tileProps("certificates")}
              />
            </section>

            <DetailPanel
              open={Boolean(preview.shown)}
              itemKey={preview.last}
              icon={preview.last === "certificates" ? Award : BookOpen}
              title={tileMeta[preview.last].title}
              subtitle={tileMeta[preview.last].subtitle}
              pinned={preview.pinned === preview.last}
              onUnpin={() => preview.setPinned(null)}
            >
              {preview.last === "certificates" ? (
                recentCertificates.length === 0 ? (
                  <p className="sk-detail-empty">
                    Complete a course to earn your first certificate.
                  </p>
                ) : (
                  <div className="sk-rows">
                    {recentCertificates.map((certificate) => {
                      const url = certificateDownloadUrl(certificate);

                      return (
                        <a
                          key={certificate.id}
                          className="sk-row"
                          href={url ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <div className="sk-icon sk-icon-sm sk-tone-orange">
                            <Award size={17} />
                          </div>
                          <div className="sk-min0 sk-grow">
                            <span className="sk-row-title">
                              {certificateTitle(certificate)}
                            </span>
                            <span className="sk-row-sub">
                              {certificate.certificateType === "PACKAGE"
                                ? "Package certificate"
                                : "Course certificate"}
                              {certificate.issuedAt
                                ? ` · ${new Date(certificate.issuedAt).toLocaleDateString("en-IN")}`
                                : ""}
                            </span>
                          </div>
                          {url ? (
                            <ArrowRight size={15} className="sk-arrow" />
                          ) : null}
                        </a>
                      );
                    })}
                  </div>
                )
              ) : tileRows.length === 0 ? (
                <p className="sk-detail-empty">No courses to show yet.</p>
              ) : (
                <div className="sk-rows">
                  {tileRows.slice(0, 6).map((row) => {
                    const percentage = Math.min(
                      100,
                      Math.max(0, row.progress.progressPercentage)
                    );

                    return (
                      <button
                        key={row.course.id}
                        type="button"
                        className="sk-row"
                        onClick={() => openCourse(row.course.id)}
                      >
                        <div className="sk-icon sk-icon-sm sk-tone-blue">
                          <BookOpen size={17} />
                        </div>
                        <div className="sk-min0 sk-grow">
                          <span className="sk-row-title">
                            {row.course.title}
                          </span>
                          <span className="sk-row-sub">
                            {row.progress.completedLessons}/
                            {row.progress.totalLessons} lessons ·{" "}
                            {row.packageName || "Direct enrollment"}
                          </span>
                          {preview.last === "progress" ? (
                            <div
                              className="sk-bar"
                              style={{ height: 5, marginTop: 6 }}
                            >
                              <span
                                className={
                                  percentage === 100 ? "is-done" : undefined
                                }
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                        <b className="pg-pct">{Math.round(percentage)}%</b>
                        <ChevronRight size={15} className="sk-arrow" />
                      </button>
                    );
                  })}
                </div>
              )}
            </DetailPanel>
          </div>

          <section className="sk-grid-2 sk-mb">
            <Panel index={5}>
              <PanelHeader
                icon={<BarChart3 size={19} />}
                title="Course Overview"
                subtitle="A quick breakdown of where your enrolled courses stand"
              />

              <div className="pg-donut-wrap">
                <DonutChart
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
                      color: "#FF6B00",
                    },
                    {
                      value: analytics.notStartedCourses,
                      label: "Not Started",
                      color: "#D7DCE5",
                    },
                  ]}
                />

                <div className="pg-legend">
                  <LegendRow
                    color="#16A34A"
                    label="Completed"
                    value={analytics.completedCourses}
                  />
                  <LegendRow
                    color="#FF6B00"
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

            <Panel index={6}>
              <PanelHeader
                icon={<GraduationCap size={19} />}
                title="Lesson Completion"
                subtitle="Your completed lessons across enrolled courses"
              />

              <div className="pg-donut-wrap">
                <DonutChart
                  centerLabel={`${analytics.completedLessons}`}
                  centerSubLabel="lessons"
                  segments={[
                    {
                      value: analytics.completedLessons,
                      label: "Completed",
                      color: "#1459B8",
                    },
                    {
                      value: analytics.remainingLessons,
                      label: "Remaining",
                      color: "#E5E7EB",
                    },
                  ]}
                />

                <div className="pg-legend">
                  <LegendRow
                    color="#1459B8"
                    label="Completed Lessons"
                    value={analytics.completedLessons}
                  />
                  <LegendRow
                    color="#E5E7EB"
                    label="Remaining Lessons"
                    value={analytics.remainingLessons}
                  />
                  <div className="pg-highlight">
                    <span>Total lessons</span>
                    <strong>{analytics.totalLessons}</strong>
                  </div>
                </div>
              </div>
            </Panel>
          </section>

          <Panel index={7} className="sk-mb">
            <PanelHeader
              icon={<BookOpen size={19} />}
              title="Course Progress"
              subtitle="Detailed progress for every enrolled course. Click a course to open it."
            />

            {courseRows.length === 0 ? (
              <div className="sk-empty" style={{ minHeight: 160 }}>
                <div className="sk-empty-icon">
                  <BookOpen size={22} />
                </div>
                <strong>No enrolled courses yet</strong>
                <span>Your enrolled courses will appear here.</span>
              </div>
            ) : (
              <div className="pg-courses">
                {courseRows.map((item, index) => {
                  const percentage = Math.min(
                    100,
                    Math.max(0, item.progress.progressPercentage)
                  );
                  const completed = percentage === 100;

                  return (
                    <button
                      type="button"
                      key={item.course.id}
                      className="pg-course"
                      style={{
                        animationDelay: `${Math.min(index, 10) * 50}ms`,
                      }}
                      onClick={() => openCourse(item.course.id)}
                    >
                      <div className="pg-course-top">
                        <div className="sk-icon sk-icon-sm sk-tone-blue">
                          <BookOpen size={17} />
                        </div>

                        <div className="sk-min0 sk-grow">
                          <span className="sk-row-title">
                            {item.course.title}
                          </span>
                          <span className="sk-row-sub">
                            {item.packageName
                              ? `From package: ${item.packageName}`
                              : "Direct enrollment"}
                          </span>
                        </div>

                        <b
                          className={`pg-pct${completed ? " is-done" : ""}`}
                        >
                          {percentage}%
                        </b>
                        <ChevronRight size={16} className="sk-arrow" />
                      </div>

                      <div className="sk-bar">
                        <span
                          className={completed ? "is-done" : undefined}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="pg-course-foot">
                        <span>
                          {item.progress.completedLessons}/
                          {item.progress.totalLessons} lessons completed
                        </span>
                        <span>{item.progress.remainingLessons} remaining</span>
                        {completed ? (
                          <span className="pg-done">Course completed</span>
                        ) : null}
                      </div>

                      <div className="sk-expand">
                        <div className="sk-expand-inner">
                          <div className="pg-course-more">
                            <span>
                              <PlayCircle size={13} />
                              {item.progress.startedLessons} lessons started
                            </span>
                            <span className="pg-open">
                              {completed ? "Review course" : "Continue learning"}
                              <ArrowRight size={13} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          <section className="sk-grid-2">
            <Panel index={8}>
              <PanelHeader
                icon={<FileCheck2 size={19} />}
                title="Assignments & Quizzes"
                subtitle="Your latest assessment activity"
              />

              <div className="pg-metrics">
                <MetricBox label="Total" value={analytics.totalAssessments} />
                <MetricBox
                  label="Attempted"
                  value={analytics.attemptedAssessments}
                />
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

              <div className="pg-pair">
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
                <div className="pg-activity">
                  {assessments.slice(0, 5).map((assessment) => {
                    const submission = assessment.latestSubmission;

                    return (
                      <div className="pg-activity-row" key={assessment.id}>
                        <div className="sk-min0">
                          <span className="sk-row-title">
                            {assessment.title}
                          </span>
                          <span className="sk-row-sub">
                            {assessment.type}
                            {assessment.courseTitle
                              ? ` · ${assessment.courseTitle}`
                              : ""}
                          </span>
                        </div>
                        <span
                          className={`sk-badge ${submission ? "tone-green" : ""}`}
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
                <EmptyMini
                  icon={<FileCheck2 size={26} />}
                  text="No assessment activity yet."
                />
              )}
            </Panel>

            <Panel index={9}>
              <PanelHeader
                icon={<Trophy size={19} />}
                title="Certificates & Achievements"
                subtitle="Your earned learning milestones"
              />

              <div className="pg-cert-top">
                <div className="pg-cert-total">
                  <div className="sk-icon sk-tone-orange">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <strong>
                      <CountUp value={analytics.totalCertificates} />
                    </strong>
                    <span>Certificates earned</span>
                  </div>
                </div>

                <div className="pg-pair" style={{ marginTop: 0 }}>
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
                <EmptyMini
                  icon={<Award size={26} />}
                  text="Complete a course to earn your first certificate."
                />
              ) : (
                <div className="pg-certs">
                  {recentCertificates.map((certificate) => {
                    const downloadUrl = certificateDownloadUrl(certificate);

                    return (
                      <div className="pg-cert" key={certificate.id}>
                        <div className="sk-icon sk-icon-sm sk-tone-navy">
                          <Award size={17} />
                        </div>
                        <div className="sk-min0 sk-grow">
                          <span className="sk-row-title">
                            {certificateTitle(certificate)}
                          </span>
                          <span className="sk-row-sub">
                            {certificate.certificateType === "PACKAGE"
                              ? "Package certificate"
                              : "Course certificate"}
                            {certificate.certificateNumber
                              ? ` · ${certificate.certificateNumber}`
                              : ""}
                            {certificate.issuedAt
                              ? ` · ${new Date(certificate.issuedAt).toLocaleDateString("en-IN")}`
                              : ""}
                          </span>
                        </div>
                        {downloadUrl ? (
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="sk-btn sk-btn-secondary sk-btn-sm"
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
        </div>
      </main>

      <SkStyles />
      <style dangerouslySetInnerHTML={{ __html: progressCss }} />
    </>
  );
}

function Panel({
  index,
  children,
  className = "",
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`sk-panel sk-reveal ${className}`}
      style={reveal(index)}
    >
      {children}
    </section>
  );
}

function PanelHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="sk-panel-head">
      <div className="sk-icon sk-tone-blue">{icon}</div>
      <div className="sk-min0">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function DonutChart({
  centerLabel,
  centerSubLabel,
  segments,
}: {
  centerLabel: string;
  centerSubLabel: string;
  segments: { value: number; label: string; color: string }[];
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let consumed = 0;

  return (
    <div className="pg-donut" aria-label={`${centerLabel} ${centerSubLabel}`}>
      <svg
        viewBox="0 0 140 140"
        width="124"
        height="124"
        aria-hidden="true"
      >
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#EDF1F7"
          strokeWidth="14"
        />

        {total > 0
          ? segments.map((segment) => {
              const length = (segment.value / total) * circumference;
              const offset = consumed;
              consumed += length;

              if (segment.value === 0) return null;

              return (
                <circle
                  key={segment.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="14"
                  strokeDasharray={`${ready ? length : 0} ${circumference}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 70 70)"
                  style={{
                    transition:
                      "stroke-dasharray 1.1s cubic-bezier(.2,.7,.2,1)",
                  }}
                />
              );
            })
          : null}
      </svg>

      <div className="pg-donut-center">
        <strong>
          <CountUp value={Number(centerLabel) || 0} />
        </strong>
        <span>{centerSubLabel}</span>
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
    <div className="pg-legend-row">
      <div>
        <i style={{ background: color }} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
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
    <div className="pg-metric">
      <span>{label}</span>
      <strong>{value}</strong>
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
    <div className="pg-small">
      <em>{icon}</em>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyMini({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="pg-empty">
      <div>{icon}</div>
      <span>{text}</span>
    </div>
  );
}

const progressCss = `
.pg-pct {
  flex: 0 0 auto;
  font-size: 14px;
  color: var(--blue);
}

.pg-pct.is-done {
  color: var(--green);
}

.pg-donut-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  flex-wrap: wrap;
}

.pg-donut {
  position: relative;
  width: 124px;
  height: 124px;
  flex: 0 0 124px;
  animation: sk-pop .6s var(--ease) both;
}

.pg-donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pg-donut-center strong {
  font-size: 24px;
  line-height: 1;
  color: var(--navy);
  font-variant-numeric: tabular-nums;
}

.pg-donut-center span {
  margin-top: 5px;
  font-size: 12px;
  color: var(--soft);
}

.pg-legend {
  min-width: 190px;
  flex: 1;
  max-width: 260px;
}

.pg-legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 8px;
  margin: 0 -8px;
  border-radius: 8px;
  transition: background .2s ease;
}

.pg-legend-row:hover {
  background: #F5F8FD;
}

.pg-legend-row div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.pg-legend-row i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.pg-legend-row span {
  font-size: 13.5px;
  color: var(--muted);
}

.pg-legend-row strong {
  font-size: 14px;
  color: var(--navy);
}

.pg-highlight {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  background: #F8FAFD;
  font-size: 13px;
  color: var(--muted);
}

.pg-highlight strong {
  color: var(--navy);
}

.pg-courses {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pg-course {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #FBFCFE;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  animation: sk-swap .4s var(--ease) both;
  transition:
    transform .25s var(--ease),
    box-shadow .25s ease,
    border-color .25s ease,
    background .25s ease;
}

.pg-course:hover,
.pg-course:focus-visible {
  outline: none;
  transform: translateY(-3px);
  border-color: #9DBBEA;
  background: #fff;
  box-shadow: 0 12px 24px rgba(15,47,95,.1);
}

.pg-course:hover .sk-expand,
.pg-course:focus-visible .sk-expand {
  grid-template-rows: 1fr;
}

.pg-course:hover .sk-arrow {
  transform: translateX(4px);
  color: var(--orange);
}

.pg-course-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pg-course-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--muted);
}

.pg-done {
  font-weight: 600;
  color: var(--green);
}

.pg-course-more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  font-size: 12.5px;
  color: var(--muted);
}

.pg-course-more span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pg-open {
  font-weight: 600;
  color: var(--orange-2);
}

.pg-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.pg-metric {
  padding: 9px 11px;
  border: 1px solid var(--line-2);
  border-radius: 12px;
  background: #F8FAFD;
  transition: transform .2s var(--ease), border-color .2s ease;
}

.pg-metric:hover {
  transform: translateY(-2px);
  border-color: #BFD3F2;
}

.pg-metric span {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--soft);
}

.pg-metric strong {
  font-size: 17px;
  color: var(--navy);
}

.pg-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.pg-small {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  background: #fff;
}

.pg-small em {
  display: flex;
  color: var(--orange);
}

.pg-small span {
  font-size: 13px;
  color: var(--muted);
}

.pg-small strong {
  margin-left: auto;
  font-size: 14px;
  color: var(--navy);
}

.pg-activity {
  margin-top: 14px;
}

.pg-activity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px;
  margin: 0 -8px;
  border-top: 1px solid var(--line-2);
  border-radius: 8px;
  transition: background .2s ease;
}

.pg-activity-row:hover {
  background: #F5F8FD;
}

.pg-cert-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.pg-cert-total {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border: 1px solid #FFD9BD;
  border-radius: 12px;
  background: var(--orange-tint);
}

.pg-cert-total strong {
  display: block;
  font-size: 24px;
  line-height: 1;
  color: var(--navy);
}

.pg-cert-total span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}

.pg-certs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pg-cert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #FBFCFE;
  transition:
    transform .2s var(--ease),
    border-color .2s ease,
    box-shadow .2s ease;
}

.pg-cert:hover {
  transform: translateX(4px);
  border-color: #9DBBEA;
  box-shadow: 0 8px 18px rgba(15,47,95,.08);
}

.pg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 26px 10px 8px;
  text-align: center;
  color: var(--soft);
}

.pg-empty div {
  color: var(--blue);
}

.pg-empty span {
  font-size: 13px;
}

/* =========================================================
   SKCE hero header
   ========================================================= */

.pg-hero {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-width: 0;
  min-height: 172px;
  margin-bottom: 24px;
  padding: 30px 34px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.1);
  border-bottom: 3px solid #FF6B00;
  border-radius: 24px;
  background:
    radial-gradient(
      circle at 91% 16%,
      rgba(71,130,207,.34) 0,
      rgba(71,130,207,.12) 25%,
      transparent 45%
    ),
    linear-gradient(
      112deg,
      #292633 0%,
      #142F57 37%,
      #163E70 72%,
      #245A98 100%
    );
  box-shadow: 0 16px 32px rgba(15,47,95,.12);
  animation: pg-hero-enter .55s cubic-bezier(.2,.7,.2,1) both;
}

.pg-hero::before,
.pg-hero::after {
  position: absolute;
  z-index: -1;
  content: "";
  pointer-events: none;
  border: 1px solid rgba(255,255,255,.055);
  border-radius: 50%;
}

.pg-hero::before {
  top: -160px;
  right: -60px;
  width: 360px;
  height: 360px;
  box-shadow:
    0 0 0 22px rgba(255,255,255,.025),
    0 0 0 44px rgba(255,255,255,.022);
}

.pg-hero::after {
  top: -110px;
  right: 15px;
  width: 260px;
  height: 260px;
}

.pg-hero-content {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

.pg-hero-icon {
  display: grid;
  place-items: center;
  flex: 0 0 62px;
  width: 62px;
  height: 62px;
  color: #fff;
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 19px;
  background: rgba(255,255,255,.13);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
  transition: transform .25s ease, background .25s ease;
}

.pg-hero:hover .pg-hero-icon {
  transform: translateY(-2px);
  background: rgba(255,255,255,.19);
}

.pg-hero-copy {
  min-width: 0;
}

.pg-hero-kicker {
  margin-bottom: 7px;
  color: #FF9B43;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
  line-height: 1.5;
}

.pg-hero-copy h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(27px, 3vw, 36px);
  font-weight: 800;
  letter-spacing: -1.1px;
  line-height: 1.2;
}

.pg-hero-copy p {
  max-width: 680px;
  margin: 9px 0 0;
  color: rgba(239,246,255,.86);
  font-size: 14.5px;
  line-height: 1.7;
}

.pg-hero-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  gap: 9px;
  min-height: 46px;
  padding: 0 20px;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  border: 1px solid rgba(255,255,255,.27);
  border-radius: 13px;
  background: rgba(255,255,255,.12);
  cursor: pointer;
  transition:
    transform .22s ease,
    background .22s ease,
    border-color .22s ease;
}

.pg-hero-refresh:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,.5);
  background: rgba(255,255,255,.2);
}

.pg-hero-refresh:focus-visible {
  outline: 3px solid #FFB66E;
  outline-offset: 3px;
}

.pg-hero-refresh:disabled {
  cursor: wait;
  opacity: .75;
}

/* Page spacing and responsive layout */

.sk-page > .sk-container {
  width: 100%;
  max-width: 1600px;
  margin-inline: auto;
  padding: 26px 30px 40px;
  box-sizing: border-box;
}

.pg-hero + .sk-zone {
  margin-bottom: 22px;
}

.pg-hero ~ .sk-grid-2 {
  gap: 16px;
}

.pg-hero ~ .sk-panel .sk-panel-head h2,
.pg-hero ~ .sk-grid-2 .sk-panel-head h2 {
  font-weight: 800;
}

@media (max-width: 760px) {
  .sk-page > .sk-container {
    padding: 18px 16px 30px;
  }

  .pg-hero {
    align-items: flex-start;
    min-height: auto;
    padding: 24px 22px;
    border-radius: 19px;
  }

  .pg-hero-content {
    align-items: flex-start;
    gap: 14px;
  }

  .pg-hero-icon {
    flex-basis: 48px;
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .pg-hero-copy h1 {
    font-size: 28px;
  }

  .pg-hero-copy p {
    font-size: 13px;
  }

  .pg-hero-refresh {
    min-height: 42px;
    padding: 0 13px;
  }

  .pg-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pg-cert-top {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 520px) {
  .pg-hero {
    flex-direction: column;
    gap: 18px;
    padding: 22px 18px;
  }

  .pg-hero-content {
    width: 100%;
  }

  .pg-hero-copy h1 {
    font-size: 25px;
    letter-spacing: -.6px;
  }

  .pg-hero-copy p {
    line-height: 1.6;
  }

  .pg-hero-refresh {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .pg-pair {
    grid-template-columns: minmax(0, 1fr);
  }

  .pg-donut-wrap {
    flex-direction: column;
  }

  .pg-course-top {
    gap: 8px;
  }

  .pg-course-foot {
    gap: 5px 10px;
  }

  .pg-activity-row {
    align-items: flex-start;
  }
}

@keyframes pg-hero-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pg-hero,
  .pg-course,
  .pg-donut {
    animation: none !important;
  }

  .pg-hero-icon,
  .pg-hero-refresh,
  .pg-cert,
  .pg-metric {
    transition: none !important;
  }
}
`;
