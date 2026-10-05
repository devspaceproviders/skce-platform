"use client";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ComponentType,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Package,
  PlayCircle,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";
type Course = {
  id: number;
  title: string;
  slug?: string | null;
  description?: string | null;
  mode?: string | null;
  isActive?: boolean;
  imageUrl?: string | null;
};
type PackageCourse = {
  id: number;
  packageId: number;
  courseId: number;
  course: Course | null;
};
type PackageData = {
  id: number;
  slug?: string | null;
  title: string;
  description?: string | null;
  price?: number | null;
  isActive?: boolean;
  courses: PackageCourse[];
};
type Enrollment = {
  id: number;
  userId: number;
  studentId?: number | null;
  courseId?: number | null;
  packageId?: number | null;
  status: string;
  enrolledAt?: string | null;
  completedAt?: string | null;
  course: Course | null;
  package: PackageData | null;
};
type DashboardData = {
  id: number;
  name: string;
  email: string;
  studentId?: string | null;
  enrollments: Enrollment[];
};
type CourseProgress = {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  startedLessons: number;
  remainingLessons: number;
  progressPercentage: number;
  lessons: {
    lessonId: number;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  }[];
};
type StudentCourse = {
  course: Course;
  enrollmentStatus: string;
  packageName: string | null;
  enrolledAt: string | null;
};
type FilterKey = "ALL" | "ACTIVE" | "COMPLETED";
function getToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("token");
}
function getImageUrl(
  imageUrl?: string | null
) {
  if (!imageUrl) {
    return null;
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  return `${API_URL.replace("/api", "")}${imageUrl}`;
}
function safeText(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }
  return String(value);
}
function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
function formatStatus(value: string) {
  if (!value) {
    return "Unknown";
  }
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1).toLowerCase()
  );
}
export default function MyCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] =
    useState<StudentCourse[]>([]);
  const [progressMap, setProgressMap] = useState<
    Record<number, CourseProgress>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<FilterKey>("ALL");
  async function loadCourses(showRefresh = false) {
    const token = getToken();
    if (!token) {
      setError("Please login again.");
      setLoading(false);
      return;
    }
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const response = await fetch(
        `${API_URL}/students/me/dashboard`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );
      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("student");
        localStorage.removeItem("studentId");
        router.push("/login");
        return;
      }
      const json = await response.json();
      if (!response.ok) {
        throw new Error(
          json?.message ||
            "Failed to load your courses."
        );
      }
      const dashboard: DashboardData =
        json?.data ?? json;
      const courseMap = new Map<
        number,
        StudentCourse
      >();
      for (const enrollment of dashboard?.enrollments ?? []) {
        if (enrollment.course) {
          courseMap.set(enrollment.course.id, {
            course: enrollment.course,
            enrollmentStatus: enrollment.status,
            packageName: null,
            enrolledAt:
              enrollment.enrolledAt ?? null,
          });
        }
        if (enrollment.package) {
          for (const packageItem of
            enrollment.package.courses ?? []) {
            if (!packageItem.course) {
              continue;
            }
            const courseId =
              packageItem.course.id;
            if (!courseMap.has(courseId)) {
              courseMap.set(courseId, {
                course: packageItem.course,
                enrollmentStatus:
                  enrollment.status,
                packageName:
                  enrollment.package.title,
                enrolledAt:
                  enrollment.enrolledAt ?? null,
              });
            }
          }
        }
      }
      const studentCourses = Array.from(
        courseMap.values()
      );
      setCourses(studentCourses);
      const progressResults = await Promise.all(
        studentCourses.map(async (item) => {
          try {
            const progressResponse =
              await fetch(
                `${API_URL}/course-progress/courses/${item.course.id}/progress`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type":
                      "application/json",
                  },
                  cache: "no-store",
                }
              );
            if (!progressResponse.ok) {
              return null;
            }
            const progressJson =
              await progressResponse.json();
            if (!progressResponse.ok) {
              return null;
            }
            return (
              progressJson?.data ??
              progressJson
            ) as CourseProgress;
          } catch (progressError) {
            console.error(
              `Progress error for course ${item.course.id}:`,
              progressError
            );
            return null;
          }
        })
      );
      const nextProgressMap: Record<
        number,
        CourseProgress
      > = {};
      for (const progress of progressResults) {
        if (progress?.courseId) {
          nextProgressMap[
            progress.courseId
          ] = progress;
        }
      }
      setProgressMap(nextProgressMap);
    } catch (err) {
      console.error(
        "My Courses error:",
        err
      );
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your courses."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  useEffect(() => {
    void loadCourses();
  }, []);
  const getCourseProgress = (
    courseId: number
  ): CourseProgress => {
    return (
      progressMap[courseId] ?? {
        courseId,
        totalLessons: 0,
        completedLessons: 0,
        startedLessons: 0,
        remainingLessons: 0,
        progressPercentage: 0,
        lessons: [],
      }
    );
  };
  const counts = useMemo(() => {
    let completed = 0;
    let active = 0;
    for (const item of courses) {
      const progress = getCourseProgress(
        item.course.id
      );
      if (progress.progressPercentage === 100) {
        completed += 1;
      } else {
        active += 1;
      }
    }
    return {
      total: courses.length,
      active,
      completed,
    };
  }, [courses, progressMap]);
  const filteredCourses = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();
    return courses.filter((item) => {
      const progress = getCourseProgress(
        item.course.id
      );
      const matchesFilter =
        filter === "ALL" ||
        (filter === "COMPLETED" &&
          progress.progressPercentage === 100) ||
        (filter === "ACTIVE" &&
          progress.progressPercentage < 100);
      const matchesSearch =
        !normalizedSearch ||
        item.course.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        Boolean(
          item.packageName
            ?.toLowerCase()
            .includes(normalizedSearch)
        );
      return matchesFilter && matchesSearch;
    });
  }, [
    courses,
    progressMap,
    search,
    filter,
  ]);
  const nextCourse = useMemo(
    () =>
      courses.find(
        (item) =>
          getCourseProgress(item.course.id)
            .progressPercentage < 100
      ) ?? null,
    [courses, progressMap]
  );
  const totalLessons = useMemo(
    () =>
      courses.reduce(
        (sum, item) =>
          sum +
          getCourseProgress(item.course.id)
            .totalLessons,
        0
      ),
    [courses, progressMap]
  );
  const completedLessons = useMemo(
    () =>
      courses.reduce(
        (sum, item) =>
          sum +
          getCourseProgress(item.course.id)
            .completedLessons,
        0
      ),
    [courses, progressMap]
  );
  if (loading) {
    return (
      <>
        <main style={pageStyle}>
          <PageHeading
            onRefresh={() =>
              loadCourses(true)
            }
            refreshing
          />
          <LoadingState />
        </main>
        <GlobalStyles />
      </>
    );
  }
  if (error) {
    return (
      <>
        <main style={pageStyle}>
          <PageHeading
            onRefresh={() =>
              loadCourses(true)
            }
            refreshing={false}
          />
          <div style={errorCardStyle}>
            <div style={errorIconStyle}>
              !
            </div>
            <h2 style={errorTitleStyle}>
              Unable to load your courses
            </h2>
            <p style={errorTextStyle}>
              {error}
            </p>
            <button
              type="button"
              onClick={() =>
                loadCourses(true)
              }
              style={primaryButtonStyle}
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </main>
        <GlobalStyles />
      </>
    );
  }
  return (
    <>
      <main style={pageStyle}>
        <PageHeading
          onRefresh={() =>
            loadCourses(true)
          }
          refreshing={refreshing}
        />
        {/* Learning snapshot */}
        <section className="skce-course-summary">
          <SummaryCard
            icon={BookOpen}
            label="My Courses"
            value={counts.total}
            helper="Courses available to you"
            tone="blue"
          />
          <SummaryCard
            icon={PlayCircle}
            label="In Progress"
            value={counts.active}
            helper="Continue learning"
            tone="rose"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Completed"
            value={counts.completed}
            helper="Courses finished"
            tone="green"
          />
          <SummaryCard
            icon={Clock3}
            label="Lessons"
            value={`${completedLessons}/${totalLessons}`}
            helper="Completed lessons"
            tone="gold"
          />
        </section>
        {/* Continue learning hero */}
        {nextCourse ? (
          <section style={continueCardStyle}>
            <div style={continueDecorOneStyle} />
            <div style={continueContentStyle}>
              <div style={continueEyebrowStyle}>
                <Sparkles size={13} />
                CONTINUE LEARNING
              </div>
              <h2 style={continueTitleStyle}>
                {nextCourse.course.title}
              </h2>
              <p style={continueDescriptionStyle}>
                {nextCourse.course.description ||
                  "Pick up your learning journey where you left off."}
              </p>
              <div style={continueMetaStyle}>
                <span>
                  <BookOpen size={13} />
                  {getCourseProgress(
                    nextCourse.course.id
                  ).completedLessons}{" "}
                  /{" "}
                  {getCourseProgress(
                    nextCourse.course.id
                  ).totalLessons}{" "}
                  lessons
                </span>
                {nextCourse.packageName ? (
                  <span>
                    <Package size={13} />
                    {nextCourse.packageName}
                  </span>
                ) : (
                  <span>
                    Direct enrollment
                  </span>
                )}
              </div>
            </div>
            <div style={continueActionStyle}>
              <div style={continuePercentStyle}>
                {Math.round(
                  getCourseProgress(
                    nextCourse.course.id
                  ).progressPercentage
                )}
                %
              </div>
              <div style={continueProgressTrackStyle}>
                <span
                  style={{
                    ...continueProgressFillStyle,
                    width: `${Math.min(
                      Math.max(
                        getCourseProgress(
                          nextCourse.course.id
                        ).progressPercentage,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/student/my-courses/${nextCourse.course.id}`
                  )
                }
                style={continueButtonStyle}
              >
                Continue Learning
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
        ) : (
          <section style={completedBannerStyle}>
            <div style={completedBannerIconStyle}>
              <CheckCircle2 size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={completedBannerTitleStyle}>
                All enrolled courses are completed
              </h2>
              <p style={completedBannerTextStyle}>
                You have completed every course currently
                available in your account. Your certificates
                are ready to view.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/student/certificates"
                )
              }
              style={secondaryGoldButtonStyle}
            >
              View Certificates
              <ArrowRight size={14} />
            </button>
          </section>
        )}
        {/* Library controls */}
        <section style={libraryHeaderStyle}>
          <div>
            <h2 style={libraryTitleStyle}>
              Course Library
            </h2>
            <p style={librarySubtitleStyle}>
              Open a course to access its lessons and learning
              content.
            </p>
          </div>
          <div style={controlsStyle}>
            <div style={courseSearchStyle}>
              <Search
                size={15}
                color="#8b95a4"
              />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search courses..."
                style={courseSearchInputStyle}
              />
            </div>
            <div style={filterGroupStyle}>
              <FilterButton
                label="All"
                count={counts.total}
                active={filter === "ALL"}
                onClick={() =>
                  setFilter("ALL")
                }
              />
              <FilterButton
                label="In Progress"
                count={counts.active}
                active={filter === "ACTIVE"}
                onClick={() =>
                  setFilter("ACTIVE")
                }
              />
              <FilterButton
                label="Completed"
                count={counts.completed}
                active={
                  filter === "COMPLETED"
                }
                onClick={() =>
                  setFilter("COMPLETED")
                }
              />
            </div>
          </div>
        </section>
        {/* Course cards */}
        {filteredCourses.length === 0 ? (
          <div style={emptyCardStyle}>
            <BookOpen
              size={25}
              color="#96a0ae"
            />
            <strong style={emptyTitleStyle}>
              No courses found
            </strong>
            <span style={emptyTextStyle}>
              {courses.length === 0
                ? "Your enrolled courses will appear here."
                : "Try a different search or filter."}
            </span>
          </div>
        ) : (
          <section className="skce-course-grid">
            {filteredCourses.map((item) => (
              <CourseCard
                key={item.course.id}
                course={item.course}
                progress={getCourseProgress(
                  item.course.id
                )}
                enrollmentStatus={
                  item.enrollmentStatus
                }
                packageName={
                  item.packageName
                }
                enrolledAt={
                  item.enrolledAt
                }
                onOpen={() =>
                  router.push(
                    `/dashboard/student/my-courses/${item.course.id}`
                  )
                }
              />
            ))}
          </section>
        )}
        {/* Bottom learning note */}
        <div style={bottomNoteStyle}>
          <BookOpen size={15} />
          <span>
            My Courses is your learning library. Detailed
            analytics and achievement breakdowns are available
            under My Progress.
          </span>
        </div>
      </main>
      <GlobalStyles />
    </>
  );
}
function PageHeading({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div style={headingStyle}>
      <div>
        <div style={eyebrowStyle}>
          STUDENT LEARNING
        </div>
        <h1 style={titleStyle}>
          My Courses
        </h1>
        <p style={subtitleStyle}>
          Your enrolled courses, learning content and
          continuation points in one place.
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        style={{
          ...refreshButtonStyle,
          opacity: refreshing ? 0.65 : 1,
        }}
      >
        <RefreshCw
          size={15}
          style={{
            animation: refreshing
              ? "studentCoursesSpin 0.8s linear infinite"
              : undefined,
          }}
        />
        {refreshing
          ? "Refreshing..."
          : "Refresh"}
      </button>
    </div>
  );
}
function SummaryCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ComponentType<{
    size?: number | string;
  }>;
  label: string;
  value: string | number;
  helper: string;
  tone: "blue" | "rose" | "green" | "gold";
}) {
  const tones = {
    blue: {
      bg: "#eaf0ff",
      fg: "#316cf2",
    },
    rose: {
      bg: "#f8e8ef",
      fg: "#a01441",
    },
    green: {
      bg: "#eaf8f0",
      fg: "#18945a",
    },
    gold: {
      bg: "#fff4dc",
      fg: "#b97911",
    },
  };
  const palette = tones[tone];
  return (
    <div style={summaryCardStyle}>
      <div
        style={{
          ...summaryIconStyle,
          background: palette.bg,
          color: palette.fg,
        }}
      >
        <Icon size={19} />
      </div>
      <div style={{ minWidth: 0 }}>
        <span style={summaryLabelStyle}>
          {label}
        </span>
        <strong style={summaryValueStyle}>
          {safeText(value)}
        </strong>
        <span style={summaryHelperStyle}>
          {helper}
        </span>
      </div>
    </div>
  );
}
function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...filterButtonStyle,
        ...(active
          ? filterButtonActiveStyle
          : {}),
      }}
    >
      {label}
      <span
        style={{
          ...filterCountStyle,
          ...(active
            ? filterCountActiveStyle
            : {}),
        }}
      >
        {count}
      </span>
    </button>
  );
}
function CourseCard({
  course,
  progress,
  enrollmentStatus,
  packageName,
  enrolledAt,
  onOpen,
}: {
  course: Course;
  progress: CourseProgress;
  enrollmentStatus: string;
  packageName: string | null;
  enrolledAt: string | null;
  onOpen: () => void;
}) {
  const completed =
    progress.progressPercentage === 100;
  const started =
    progress.startedLessons > 0;
  const statusText = completed
    ? "Completed"
    : started
    ? "In Progress"
    : "Not Started";
  return (
    <article className="skce-course-card" style={courseCardStyle}>
      <div style={courseCardTopStyle}>
        <div style={courseBadgeStyle}>
          {getImageUrl(course.imageUrl) ? (
            <img
              src={getImageUrl(course.imageUrl) ?? ""}
              alt={course.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 11,
                display: "block",
              }}
            />
          ) : (
            <BookOpen size={19} />
          )}
        </div>
        <span
          style={{
            ...courseStatusStyle,
            ...(completed
              ? courseCompletedStyle
              : started
              ? courseActiveStyle
              : courseNotStartedStyle),
          }}
        >
          {completed ? (
            <CheckCircle2 size={11} />
          ) : null}
          {statusText}
        </span>
      </div>
      <h3 style={courseTitleStyle}>
        {course.title}
      </h3>
      <div style={courseMetaStyle}>
        {course.mode ? (
          <span>{course.mode}</span>
        ) : null}
        {packageName ? (
          <span style={packageMetaStyle}>
            <Package size={11} />
            {packageName}
          </span>
        ) : (
          <span>Direct enrollment</span>
        )}
      </div>
      {course.description ? (
        <p style={courseDescriptionStyle}>
          {course.description}
        </p>
      ) : (
        <p style={courseDescriptionStyle}>
          Access your course lessons and continue learning
          from here.
        </p>
      )}
      <div style={progressSectionStyle}>
        <div style={progressHeaderStyle}>
          <span>Learning progress</span>
          <strong>
            {Math.round(
              progress.progressPercentage
            )}
            %
          </strong>
        </div>
        <div style={progressTrackStyle}>
          <span
            style={{
              ...progressFillStyle,
              width: `${Math.min(
                Math.max(
                  progress.progressPercentage,
                  0
                ),
                100
              )}%`,
              ...(completed
                ? {
                    background: "#16a05d",
                  }
                : {}),
            }}
          />
        </div>
        <div style={lessonStatsStyle}>
          <span>
            {progress.completedLessons}/
            {progress.totalLessons} lessons
          </span>
          <span>
            {progress.remainingLessons} remaining
          </span>
        </div>
      </div>
      <div style={courseFooterStyle}>
        <div style={courseEnrollmentStyle}>
          <span>
            Enrolled{" "}
            {formatDate(enrolledAt)}
          </span>
          {enrollmentStatus ? (
            <span>
              {formatStatus(
                enrollmentStatus
              )}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onOpen}
          style={courseActionStyle}
        >
          {completed
            ? "Review Course"
            : started
            ? "Continue"
            : "Start Learning"}
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}
function LoadingState() {
  return (
    <div style={loadingCardStyle}>
      <RefreshCw
        size={25}
        color="#2f6bff"
        style={{
          animation:
            "studentCoursesSpin 0.8s linear infinite",
        }}
      />
      <strong style={loadingTitleStyle}>
        Loading your courses
      </strong>
      <span style={loadingTextStyle}>
        Fetching your enrolled learning content.
      </span>
    </div>
  );
}
const pageStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  flex: 1,
  boxSizing: "border-box",
  padding: "28px 32px 36px",
  background: "#f5f7fb",
};
const headingStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 18,
};
const eyebrowStyle: CSSProperties = {
  marginBottom: 5,
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: "0.11em",
  color: "#a01441",
};
const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 27,
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "#111827",
};
const subtitleStyle: CSSProperties = {
  maxWidth: 700,
  margin: "6px 0 0",
  fontSize: 13,
  lineHeight: 1.6,
  color: "#818b9b",
};
const refreshButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  border: "1px solid #d9dfe8",
  borderRadius: 9,
  padding: "9px 12px",
  background: "#ffffff",
  color: "#374151",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
  flex: "0 0 auto",
};
const summaryCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 11,
  minWidth: 0,
  padding: 15,
  border: "1px solid #e4e8ef",
  borderRadius: 15,
  background: "#ffffff",
  boxShadow:
    "0 4px 12px rgba(15,23,42,0.035)",
};
const summaryIconStyle: CSSProperties = {
  width: 41,
  height: 41,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 41px",
  borderRadius: 11,
};
const summaryLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 10.5,
  color: "#8c95a5",
};
const summaryValueStyle: CSSProperties = {
  display: "block",
  marginTop: 2,
  fontSize: 19,
  lineHeight: 1.15,
  color: "#111827",
};
const summaryHelperStyle: CSSProperties = {
  display: "block",
  marginTop: 3,
  fontSize: 9.5,
  color: "#9aa2af",
};
const continueCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "space-between",
  gap: 24,
  minHeight: 180,
  margin: "18px 0",
  padding: "24px 25px",
  borderRadius: 19,
  background:
    "linear-gradient(135deg,#122846 0%,#1a4775 62%,#2f6bf0 100%)",
  color: "#ffffff",
  boxShadow:
    "0 12px 28px rgba(16,34,63,0.13)",
};
const continueDecorOneStyle: CSSProperties = {
  position: "absolute",
  width: 250,
  height: 250,
  right: -65,
  top: -150,
  borderRadius: "50%",
  background:
    "rgba(255,255,255,0.07)",
};
const continueContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minWidth: 0,
  flex: 1,
};
const continueEyebrowStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  marginBottom: 8,
  fontSize: 9.5,
  fontWeight: 850,
  letterSpacing: "0.1em",
  color: "#d8e7fc",
};
const continueTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  lineHeight: 1.25,
  fontWeight: 800,
};
const continueDescriptionStyle: CSSProperties = {
  maxWidth: 650,
  margin: "7px 0 0",
  fontSize: 11.5,
  lineHeight: 1.55,
  color: "#d6e4f7",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const continueMetaStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 13,
  marginTop: 13,
  fontSize: 10,
  color: "#d2e1f5",
};
const continueActionStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-end",
  gap: 8,
  minWidth: 210,
};
const continuePercentStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 850,
};
const continueProgressTrackStyle: CSSProperties = {
  width: "100%",
  maxWidth: 210,
  height: 6,
  overflow: "hidden",
  borderRadius: 999,
  background: "rgba(255,255,255,0.2)",
};
const continueProgressFillStyle: CSSProperties = {
  display: "block",
  height: "100%",
  borderRadius: 999,
  background: "#ffffff",
};
const continueButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: 0,
  borderRadius: 8,
  padding: "9px 11px",
  background: "#ffffff",
  color: "#173f71",
  fontSize: 10.5,
  fontWeight: 850,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const completedBannerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  margin: "18px 0",
  padding: 18,
  border: "1px solid #eadba7",
  borderRadius: 17,
  background:
    "linear-gradient(135deg,#fffdf7 0%,#fff8e6 100%)",
};
const completedBannerIconStyle: CSSProperties = {
  width: 46,
  height: 46,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 46px",
  borderRadius: 13,
  background: "#fff1c8",
  color: "#b97911",
};
const completedBannerTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14.5,
  fontWeight: 800,
  color: "#3c3324",
};
const completedBannerTextStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 10.5,
  lineHeight: 1.5,
  color: "#806f51",
};
const secondaryGoldButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  marginLeft: "auto",
  flex: "0 0 auto",
  border: "1px solid #dabf75",
  borderRadius: 8,
  padding: "8px 10px",
  background: "#fffaf0",
  color: "#a76d10",
  fontSize: 10,
  fontWeight: 800,
  cursor: "pointer",
};
const libraryHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 18,
  marginBottom: 12,
};
const libraryTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#172033",
};
const librarySubtitleStyle: CSSProperties = {
  margin: "3px 0 0",
  fontSize: 10.5,
  color: "#98a1af",
};
const controlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};
const courseSearchStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  width: 215,
  padding: "8px 10px",
  border: "1px solid #dfe5ed",
  borderRadius: 8,
  background: "#ffffff",
};
const courseSearchInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: 0,
  outline: "none",
  background: "transparent",
  color: "#374151",
  fontSize: 10.5,
};
const filterGroupStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  flexWrap: "wrap",
};
const filterButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #dfe4ec",
  borderRadius: 999,
  padding: "6px 8px",
  background: "#ffffff",
  color: "#657184",
  fontSize: 9.5,
  fontWeight: 750,
  cursor: "pointer",
};
const filterButtonActiveStyle: CSSProperties = {
  borderColor: "#2f6bff",
  background: "#2f6bff",
  color: "#ffffff",
};
const filterCountStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 18,
  height: 18,
  padding: "0 4px",
  borderRadius: 999,
  background: "#eef2f7",
  color: "#657184",
  fontSize: 8.5,
};
const filterCountActiveStyle: CSSProperties = {
  background: "rgba(255,255,255,0.2)",
  color: "#ffffff",
};
const courseCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 318,
  padding: 17,
  border: "1px solid #e4e8ef",
  borderRadius: 16,
  background: "#ffffff",
  boxShadow:
    "0 4px 12px rgba(15,23,42,0.03)",
};
const courseCardTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};
const courseBadgeStyle: CSSProperties = {
  width: 41,
  height: 41,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 41px",
  borderRadius: 11,
  background: "#f8e8ef",
  color: "#a01441",
};
const courseStatusStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  borderRadius: 999,
  padding: "5px 7px",
  fontSize: 8.5,
  fontWeight: 850,
  whiteSpace: "nowrap",
};
const courseCompletedStyle: CSSProperties = {
  background: "#eaf8f0",
  color: "#168452",
};
const courseActiveStyle: CSSProperties = {
  background: "#edf3ff",
  color: "#316cf2",
};
const courseNotStartedStyle: CSSProperties = {
  background: "#fff4df",
  color: "#aa7416",
};
const courseTitleStyle: CSSProperties = {
  margin: "13px 0 0",
  fontSize: 15,
  lineHeight: 1.35,
  fontWeight: 800,
  color: "#182133",
};
const courseMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 7,
  marginTop: 5,
  fontSize: 9.5,
  color: "#8a94a4",
};
const packageMetaStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};
const courseDescriptionStyle: CSSProperties = {
  minHeight: 42,
  margin: "10px 0 0",
  fontSize: 10.5,
  lineHeight: 1.55,
  color: "#778293",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const progressSectionStyle: CSSProperties = {
  marginTop: 13,
};
const progressHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  fontSize: 9.5,
  color: "#8a94a4",
};
const progressTrackStyle: CSSProperties = {
  height: 7,
  overflow: "hidden",
  marginTop: 6,
  borderRadius: 999,
  background: "#e9edf3",
};
const progressFillStyle: CSSProperties = {
  display: "block",
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg,#2f6bff,#5e8eff)",
  transition: "width 250ms ease",
};
const lessonStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginTop: 5,
  fontSize: 9,
  color: "#99a1ae",
};
const courseFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 10,
  marginTop: "auto",
  paddingTop: 14,
  borderTop: "1px solid #eef1f5",
};
const courseEnrollmentStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  minWidth: 0,
  fontSize: 8.5,
  color: "#9aa2af",
};
const courseActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  flex: "0 0 auto",
  border: 0,
  borderRadius: 8,
  padding: "8px 10px",
  background: "#a01441",
  color: "#ffffff",
  fontSize: 9.5,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const bottomNoteStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 15,
  padding: "10px 12px",
  border: "1px solid #e2e7ef",
  borderRadius: 10,
  background: "#fafbfd",
  color: "#8a94a4",
  fontSize: 9.5,
};
const emptyCardStyle: CSSProperties = {
  minHeight: 260,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 25,
  border: "1px dashed #dce2eb",
  borderRadius: 16,
  background: "#fbfcfd",
  textAlign: "center",
};
const emptyTitleStyle: CSSProperties = {
  marginTop: 9,
  fontSize: 13,
  fontWeight: 800,
  color: "#4b5565",
};
const emptyTextStyle: CSSProperties = {
  maxWidth: 340,
  marginTop: 4,
  fontSize: 10.5,
  lineHeight: 1.5,
  color: "#9aa2af",
};
const loadingCardStyle: CSSProperties = {
  minHeight: 340,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: 30,
  border: "1px solid #e4e8ef",
  borderRadius: 18,
  background: "#ffffff",
  textAlign: "center",
};
const loadingTitleStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 14,
  color: "#374151",
};
const loadingTextStyle: CSSProperties = {
  fontSize: 10.5,
  color: "#969fac",
};
const errorCardStyle: CSSProperties = {
  minHeight: 310,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: 30,
  border: "1px solid #f1d6d6",
  borderRadius: 18,
  background: "#ffffff",
  textAlign: "center",
};
const errorIconStyle: CSSProperties = {
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  background: "#fdebea",
  color: "#c8433e",
  fontSize: 20,
  fontWeight: 850,
};
const errorTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 17,
  color: "#374151",
};
const errorTextStyle: CSSProperties = {
  maxWidth: 460,
  margin: "2px 0 10px",
  fontSize: 11.5,
  lineHeight: 1.55,
  color: "#808b9a",
};
const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: 0,
  borderRadius: 8,
  padding: "9px 12px",
  background: "#2f6bff",
  color: "#ffffff",
  fontSize: 10.5,
  fontWeight: 800,
  cursor: "pointer",
};
function GlobalStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          .skce-course-summary {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 13px;
            margin-bottom: 1px;
          }
          .skce-course-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 13px;
          }
          .skce-course-card {
            transition:
              transform 160ms ease,
              box-shadow 160ms ease,
              border-color 160ms ease;
          }
          .skce-course-card:hover {
            transform: translateY(-2px);
            border-color: #dce2eb !important;
            box-shadow: 0 9px 20px rgba(15,23,42,0.06) !important;
          }
          @keyframes studentCoursesSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (max-width: 1200px) {
            .skce-course-summary {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .skce-course-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 850px) {
            .skce-course-grid {
              grid-template-columns: minmax(0, 1fr);
            }
          }
        `,
      }}
    />
  );
}
