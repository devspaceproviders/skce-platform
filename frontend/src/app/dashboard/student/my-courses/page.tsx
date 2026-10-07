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
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Package,
  PlayCircle,
  RefreshCw,
  Search,
  Sparkles,
  X,
  AlertCircle,
  MousePointerClick,
  Pin,
  ChevronDown,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
type TileKey = "total" | "active" | "completed" | "lessons";

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return `${API_URL.replace("/api", "")}${imageUrl}`;
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

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function reveal(index: number): CSSProperties {
  return { ["--i" as string]: index } as CSSProperties;
}

export default function MyCoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, CourseProgress>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [pinnedId, setPinnedId] = useState<number | null>(null);
  const [hoverTile, setHoverTile] = useState<TileKey | null>(null);
  const [pinnedTile, setPinnedTile] = useState<TileKey | null>(null);
  const [lastTile, setLastTile] = useState<TileKey>("total");
  const shownTile = hoverTile ?? pinnedTile;

  useEffect(() => {
    if (shownTile) {
      setLastTile(shownTile);
    }
  }, [shownTile]);

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

      const response = await fetch(`${API_URL}/students/me/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
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
        throw new Error(json?.message || "Failed to load your courses.");
      }

      const dashboard: DashboardData = json?.data ?? json;

      const courseMap = new Map<number, StudentCourse>();

      for (const enrollment of dashboard?.enrollments ?? []) {
        if (enrollment.course) {
          courseMap.set(enrollment.course.id, {
            course: enrollment.course,
            enrollmentStatus: enrollment.status,
            packageName: null,
            enrolledAt: enrollment.enrolledAt ?? null,
          });
        }

        if (enrollment.package) {
          for (const packageItem of enrollment.package.courses ?? []) {
            if (!packageItem.course) {
              continue;
            }

            const courseId = packageItem.course.id;

            if (!courseMap.has(courseId)) {
              courseMap.set(courseId, {
                course: packageItem.course,
                enrollmentStatus: enrollment.status,
                packageName: enrollment.package.title,
                enrolledAt: enrollment.enrolledAt ?? null,
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
            const progressResponse = await fetch(
              `${API_URL}/course-progress/courses/${item.course.id}/progress`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                cache: "no-store",
              }
            );

            if (!progressResponse.ok) {
              return null;
            }

            const progressJson = await progressResponse.json();

            return (progressJson?.data ?? progressJson) as CourseProgress;
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
        if (progress?.courseId) {
          nextProgressMap[progress.courseId] = progress;
        }
      }

      setProgressMap(nextProgressMap);
    } catch (err) {
      console.error("My Courses error:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load your courses."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCourses();
  }, []);

  const getCourseProgress = (courseId: number): CourseProgress => {
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
      const progress = getCourseProgress(item.course.id);

      if (progress.progressPercentage === 100) {
        completed += 1;
      } else {
        active += 1;
      }
    }

    return { total: courses.length, active, completed };
  }, [courses, progressMap]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return courses.filter((item) => {
      const progress = getCourseProgress(item.course.id);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "COMPLETED" && progress.progressPercentage === 100) ||
        (filter === "ACTIVE" && progress.progressPercentage < 100);

      const matchesSearch =
        !normalizedSearch ||
        item.course.title.toLowerCase().includes(normalizedSearch) ||
        Boolean(item.packageName?.toLowerCase().includes(normalizedSearch));

      return matchesFilter && matchesSearch;
    });
  }, [courses, progressMap, search, filter]);

  /*
   * Default spotlight course: the one the student is actually working on
   * (started, not finished) -> else first unfinished course that has lessons
   * -> else first unfinished -> else first course.
   */
  const defaultFeatured = useMemo(() => {
    const pct = (item: StudentCourse) =>
      getCourseProgress(item.course.id).progressPercentage;

    return (
      courses.find(
        (item) =>
          getCourseProgress(item.course.id).startedLessons > 0 && pct(item) < 100
      ) ??
      courses.find(
        (item) =>
          getCourseProgress(item.course.id).totalLessons > 0 && pct(item) < 100
      ) ??
      courses.find((item) => pct(item) < 100) ??
      courses[0] ??
      null
    );
  }, [courses, progressMap]);

  /* Hover = preview, click = pin. Falls back to the smart default. */
  const featured = useMemo(
    () =>
      courses.find((item) => item.course.id === hoverId) ??
      courses.find((item) => item.course.id === pinnedId) ??
      defaultFeatured,
    [courses, hoverId, pinnedId, defaultFeatured]
  );

  const totalLessons = useMemo(
    () =>
      courses.reduce(
        (sum, item) => sum + getCourseProgress(item.course.id).totalLessons,
        0
      ),
    [courses, progressMap]
  );

  const completedLessons = useMemo(
    () =>
      courses.reduce(
        (sum, item) => sum + getCourseProgress(item.course.id).completedLessons,
        0
      ),
    [courses, progressMap]
  );

  function clearFilters() {
    setSearch("");
    setFilter("ALL");
  }

  function toggleTile(key: TileKey) {
    if (pinnedTile === key) {
      setPinnedTile(null);
      setFilter("ALL");
      return;
    }

    setPinnedTile(key);
    setFilter(key === "active" ? "ACTIVE" : key === "completed" ? "COMPLETED" : "ALL");
  }

  const tileProps = (key: TileKey) => ({
    active: shownTile === key,
    pinned: pinnedTile === key,
    onEnter: () => setHoverTile(key),
    onToggle: () => toggleTile(key),
  });

  if (loading) {
    return (
      <>
        <main className="mc-page" aria-busy="true" aria-live="polite">
          <div className="mc-container">
            <PageHeading onRefresh={() => loadCourses(true)} refreshing />
            <div className="mc-summary">
              {[0, 1, 2, 3].map((n) => (
                <div key={n} className="mc-skel mc-skel-tile" />
              ))}
            </div>
            <div className="mc-skel mc-skel-hero" />
            <div className="mc-grid">
              {[0, 1, 2].map((n) => (
                <div key={n} className="mc-skel mc-skel-card" />
              ))}
            </div>
            <span className="mc-sr">Loading your courses</span>
          </div>
        </main>
        <MyCoursesStyles />
      </>
    );
  }

  if (error) {
    return (
      <>
        <main className="mc-page">
          <div className="mc-container">
            <PageHeading onRefresh={() => loadCourses(true)} refreshing={false} />
            <div className="mc-error" role="alert">
              <div className="mc-error-icon">
                <AlertCircle size={24} />
              </div>
              <h2>Unable to load your courses</h2>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => loadCourses(true)}
                className="mc-btn mc-btn-primary"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        </main>
        <MyCoursesStyles />
      </>
    );
  }

  const featuredProgress = featured
    ? getCourseProgress(featured.course.id)
    : null;
  const tileMeta: Record<TileKey, { icon: ComponentType<{ size?: number | string }>; title: string; subtitle: string }> = {
    total: { icon: BookOpen, title: "All courses", subtitle: `${counts.total} available to you` },
    active: { icon: PlayCircle, title: "Courses in progress", subtitle: `${counts.active} to continue` },
    completed: { icon: CheckCircle2, title: "Completed courses", subtitle: `${counts.completed} finished` },
    lessons: { icon: Clock3, title: "Lessons by course", subtitle: `${completedLessons} of ${totalLessons} lessons completed` },
  };

  const tileList = courses.filter((item) => {
    const p = getCourseProgress(item.course.id);

    if (lastTile === "active") return p.progressPercentage < 100;
    if (lastTile === "completed") return p.progressPercentage === 100;
    if (lastTile === "lessons") return p.totalLessons > 0;

    return true;
  });

  const TileIcon = tileMeta[lastTile].icon;

  const heroMode: "preview" | "pinned" | "auto" =
    hoverId !== null && featured?.course.id === hoverId
      ? "preview"
      : pinnedId !== null && featured?.course.id === pinnedId
      ? "pinned"
      : "auto";

  const featuredCompleted = featuredProgress?.progressPercentage === 100;
  const featuredStarted = (featuredProgress?.startedLessons ?? 0) > 0;
  const featuredImage = featured ? getImageUrl(featured.course.imageUrl) : null;
  const featuredLabel = featuredCompleted
    ? "Course completed"
    : featuredStarted
    ? "Continue learning"
    : "Start learning";
  const featuredButton = featuredCompleted
    ? "Review Course"
    : featuredStarted
    ? "Continue Learning"
    : "Start Learning";

  return (
    <>
      <main className="mc-page">
        <div className="mc-container">
          <PageHeading
            onRefresh={() => loadCourses(true)}
            refreshing={refreshing}
          />

          {/* Summary + detail (hover to preview, click to pin) */}
          <div
            className="mc-tile-zone"
            onMouseLeave={() => {
              setHoverTile(null);
              setHoverId(null);
            }}
          >
            <section className="mc-summary">
              <SummaryCard
                index={1}
                icon={BookOpen}
                label="My Courses"
                value={counts.total}
                helper="Courses available to you"
                tone="blue"
                {...tileProps("total")}
              />
              <SummaryCard
                index={2}
                icon={PlayCircle}
                label="In Progress"
                value={counts.active}
                helper="Continue learning"
                tone="orange"
                {...tileProps("active")}
              />
              <SummaryCard
                index={3}
                icon={CheckCircle2}
                label="Completed"
                value={counts.completed}
                helper="Courses finished"
                tone="green"
                {...tileProps("completed")}
              />
              <SummaryCard
                index={4}
                icon={Clock3}
                label="Lessons"
                value={completedLessons}
                suffix={`/${totalLessons}`}
                helper="Completed lessons"
                tone="navy"
                {...tileProps("lessons")}
              />
            </section>

            <div className={`mc-detail${shownTile ? " is-open" : ""}`}>
              <div className="mc-detail-inner">
                <div className="mc-detail-card" key={lastTile}>
                  <div className="mc-detail-head">
                    <div className="mc-detail-title">
                      <div className="mc-icon mc-tone-blue">
                        <TileIcon size={19} />
                      </div>
                      <div className="mc-min0">
                        <h3>{tileMeta[lastTile].title}</h3>
                        <p>{tileMeta[lastTile].subtitle}</p>
                      </div>
                    </div>
                    {pinnedTile === lastTile ? (
                      <button
                        type="button"
                        className="mc-pin-chip mc-pin-chip-dark"
                        onClick={() => {
                          setPinnedTile(null);
                          setFilter("ALL");
                        }}
                        aria-label="Close details"
                      >
                        <Pin size={11} /> Pinned <X size={12} />
                      </button>
                    ) : (
                      <span className="mc-detail-hint">Click the card to keep this open</span>
                    )}
                  </div>

                  {tileList.length === 0 ? (
                    <p className="mc-detail-empty">Nothing here yet.</p>
                  ) : (
                    <div className="mc-trows">
                      {tileList.slice(0, 8).map((item) => {
                        const p = getCourseProgress(item.course.id);
                        const img = getImageUrl(item.course.imageUrl);

                        return (
                          <button
                            key={item.course.id}
                            type="button"
                            className="mc-trow"
                            onMouseEnter={() => setHoverId(item.course.id)}
                            onFocus={() => setHoverId(item.course.id)}
                            onClick={() =>
                              router.push(`/dashboard/student/my-courses/${item.course.id}`)
                            }
                          >
                            <span className="mc-trow-thumb">
                              {img ? (
                                <img src={img} alt={item.course.title} />
                              ) : (
                                <BookOpen size={16} />
                              )}
                            </span>
                            <span className="mc-min0 mc-grow">
                              <span className="mc-trow-title">{item.course.title}</span>
                              <span className="mc-trow-sub">
                                {p.completedLessons}/{p.totalLessons} lessons
                              </span>
                            </span>
                            <b>{Math.round(p.progressPercentage)}%</b>
                            <ArrowRight size={15} className="mc-trow-arrow" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {tileList.length > 8 ? (
                    <p className="mc-detail-more">
                      +{tileList.length - 8} more. Use the filters below to see them all.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Spotlight: follows the hovered / clicked course */}
          {featured && featuredProgress ? (
            <section
              className="mc-hero mc-reveal"
              style={reveal(5)}
              aria-live="polite"
            >
              <div className="mc-hero-glow" aria-hidden="true" />
              <div className="mc-hero-inner" key={featured.course.id}>
                <div className="mc-hero-main mc-swap">
                  <div className="mc-hero-thumb">
                    {featuredImage ? (
                      <img src={featuredImage} alt={featured.course.title} />
                    ) : (
                      <BookOpen size={30} />
                    )}
                  </div>
                  <div className="mc-min0">
                    <div className="mc-eyebrow">
                      {featuredCompleted ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      {featuredLabel}
                      {heroMode === "pinned" ? (
                        <button
                          type="button"
                          className="mc-pin-chip"
                          onClick={() => setPinnedId(null)}
                          aria-label="Unpin course"
                        >
                          <Pin size={11} /> Pinned <X size={12} />
                        </button>
                      ) : heroMode === "preview" ? (
                        <span className="mc-pin-chip is-soft">Previewing</span>
                      ) : null}
                    </div>
                    <h2>{featured.course.title}</h2>
                    <p>
                      {featured.course.description ||
                        "Pick up your learning journey where you left off."}
                    </p>
                    <div className="mc-hero-meta">
                      <span>
                        <BookOpen size={14} />
                        {featuredProgress.totalLessons > 0
                          ? `${featuredProgress.completedLessons} / ${featuredProgress.totalLessons} lessons`
                          : "Lessons coming soon"}
                      </span>
                      <span>
                        <Package size={14} />
                        {featured.packageName || "Direct enrollment"}
                      </span>
                      {featured.course.mode ? (
                        <span>{featured.course.mode}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mc-hero-action mc-swap">
                  <div className="mc-hero-pct">
                    {Math.round(featuredProgress.progressPercentage)}%
                  </div>
                  <div className="mc-hero-track">
                    <span
                      style={{
                        width: `${clampPercent(
                          featuredProgress.progressPercentage
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="mc-hero-buttons">
                    {featuredCompleted ? (
                      <button
                        type="button"
                        onClick={() =>
                          router.push("/dashboard/student/certificates")
                        }
                        className="mc-btn mc-btn-ghost-light"
                      >
                        <Award size={15} />
                        Certificates
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/student/my-courses/${featured.course.id}`
                        )
                      }
                      className="mc-btn mc-btn-primary"
                    >
                      {featuredButton}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mc-hero-hint">
                <MousePointerClick size={13} />
                Hover a course to preview it here. Click a course to pin it.
              </div>
            </section>
          ) : null}

          {/* Library controls */}
          <section className="mc-library-head mc-reveal" style={reveal(6)}>
            <div>
              <h2>Course Library</h2>
              <p>Open a course to access its lessons and learning content.</p>
            </div>

            <div className="mc-controls">
              <label className="mc-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search courses..."
                  aria-label="Search courses"
                />
                {search ? (
                  <button
                    type="button"
                    className="mc-search-clear"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </label>

              <div className="mc-filters" role="tablist" aria-label="Filter courses">
                <FilterButton
                  label="All"
                  count={counts.total}
                  active={filter === "ALL"}
                  onClick={() => setFilter("ALL")}
                />
                <FilterButton
                  label="In Progress"
                  count={counts.active}
                  active={filter === "ACTIVE"}
                  onClick={() => setFilter("ACTIVE")}
                />
                <FilterButton
                  label="Completed"
                  count={counts.completed}
                  active={filter === "COMPLETED"}
                  onClick={() => setFilter("COMPLETED")}
                />
              </div>
            </div>
          </section>

          {/* Course cards */}
          {filteredCourses.length === 0 ? (
            <div className="mc-empty">
              <div className="mc-empty-icon">
                <BookOpen size={22} />
              </div>
              <strong>No courses found</strong>
              <span>
                {courses.length === 0
                  ? "Your enrolled courses will appear here."
                  : "No courses match your current search or filter."}
              </span>
              {courses.length > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mc-btn mc-btn-secondary"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          ) : (
            <section
              className="mc-grid"
              key={`${filter}-${search}`}
              onMouseLeave={() => setHoverId(null)}
            >
              {filteredCourses.map((item, index) => (
                <CourseCard
                  key={item.course.id}
                  index={index}
                  course={item.course}
                  progress={getCourseProgress(item.course.id)}
                  enrollmentStatus={item.enrollmentStatus}
                  packageName={item.packageName}
                  enrolledAt={item.enrolledAt}
                  previewing={hoverId === item.course.id}
                  pinned={pinnedId === item.course.id}
                  onPreview={() => setHoverId(item.course.id)}
                  onTogglePin={() =>
                    setPinnedId((prev) =>
                      prev === item.course.id ? null : item.course.id
                    )
                  }
                  onOpen={() =>
                    router.push(`/dashboard/student/my-courses/${item.course.id}`)
                  }
                />
              ))}
            </section>
          )}

          <div className="mc-note">
            <BookOpen size={15} />
            <span>
              My Courses is your learning library. Detailed analytics and
              achievement breakdowns are available under My Progress.
            </span>
          </div>
        </div>
      </main>
      <MyCoursesStyles />
    </>
  );
}

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min((now - start) / 900, 1);
      setDisplay(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <>
      {Math.round(display)}
      {suffix}
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
    <div className="mc-heading mc-reveal" style={reveal(0)}>
      <div>
        <div className="mc-kicker">Student learning</div>
        <h1>My Courses</h1>
        <p>
          Your enrolled courses, learning content and continuation points in
          one place.
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="mc-btn mc-btn-secondary mc-refresh"
      >
        <RefreshCw size={15} className={refreshing ? "mc-spin" : "mc-refresh-icon"} />
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}

function SummaryCard({
  index,
  icon: Icon,
  label,
  value,
  suffix,
  helper,
  tone,
  active,
  pinned,
  onEnter,
  onToggle,
}: {
  index: number;
  icon: ComponentType<{ size?: number | string }>;
  label: string;
  value: number;
  suffix?: string;
  helper: string;
  tone: "blue" | "orange" | "green" | "navy";
  active: boolean;
  pinned: boolean;
  onEnter: () => void;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`mc-tile mc-reveal${active ? " is-active" : ""}${pinned ? " is-pinned" : ""}`}
      style={reveal(index)}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onClick={onToggle}
      aria-pressed={pinned}
    >
      <div className={`mc-icon mc-tone-${tone}`}>
        <Icon size={20} />
      </div>
      <div className="mc-min0 mc-grow">
        <span className="mc-tile-label">{label}</span>
        <strong className="mc-tile-value">
          <CountUp value={value} suffix={suffix} />
        </strong>
        <span className="mc-tile-helper">{helper}</span>
      </div>
      <ChevronDown size={17} className="mc-tile-caret" />
    </button>
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`mc-filter${active ? " is-active" : ""}`}
    >
      {label}
      <span className="mc-filter-count">{count}</span>
    </button>
  );
}

function CourseCard({
  index,
  course,
  progress,
  enrollmentStatus,
  packageName,
  enrolledAt,
  previewing,
  pinned,
  onPreview,
  onTogglePin,
  onOpen,
}: {
  index: number;
  course: Course;
  progress: CourseProgress;
  enrollmentStatus: string;
  packageName: string | null;
  enrolledAt: string | null;
  previewing: boolean;
  pinned: boolean;
  onPreview: () => void;
  onTogglePin: () => void;
  onOpen: () => void;
}) {
  const completed = progress.progressPercentage === 100;
  const started = progress.startedLessons > 0;
  const statusText = completed ? "Completed" : started ? "In Progress" : "Not Started";
  const statusClass = completed ? "is-done" : started ? "is-active" : "is-new";
  const image = getImageUrl(course.imageUrl);
  const percent = clampPercent(progress.progressPercentage);

  return (
    <article
      className={`mc-card mc-reveal${previewing ? " is-previewing" : ""}${pinned ? " is-pinned" : ""}`}
      style={reveal(Math.min(index, 8) + 7)}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      onClick={onTogglePin}
    >
      <div className="mc-cover">
        {image ? (
          <img src={image} alt={course.title} />
        ) : (
          <div className="mc-cover-fallback">
            <BookOpen size={30} />
          </div>
        )}
        <button
          type="button"
          className={`mc-pin-btn${pinned ? " is-on" : ""}`}
          aria-pressed={pinned}
          aria-label={pinned ? "Unpin course" : "Pin course to the top"}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin();
          }}
        >
          <Pin size={14} />
        </button>
        <span className={`mc-status ${statusClass}`}>
          {completed ? <CheckCircle2 size={12} /> : null}
          {statusText}
        </span>
      </div>

      <div className="mc-card-body">
        <h3>{course.title}</h3>

        <div className="mc-card-meta">
          {course.mode ? <span>{course.mode}</span> : null}
          {packageName ? (
            <span className="mc-pkg">
              <Package size={12} />
              {packageName}
            </span>
          ) : (
            <span>Direct enrollment</span>
          )}
        </div>

        <p className="mc-card-desc">
          {course.description ||
            "Access your course lessons and continue learning from here."}
        </p>

        <div className="mc-progress">
          <div className="mc-progress-head">
            <span>Learning progress</span>
            <strong>{Math.round(progress.progressPercentage)}%</strong>
          </div>
          <div
            className="mc-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
          >
            <span
              className={completed ? "is-done" : undefined}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mc-progress-foot">
            <span>
              {progress.completedLessons}/{progress.totalLessons} lessons
            </span>
            <span>{progress.remainingLessons} remaining</span>
          </div>
        </div>

        <div className="mc-card-foot">
          <div className="mc-enrolled">
            <span>Enrolled {formatDate(enrolledAt)}</span>
            {enrollmentStatus ? <span>{formatStatus(enrollmentStatus)}</span> : null}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            className="mc-btn mc-btn-primary mc-btn-sm"
          >
            {completed ? "Review Course" : started ? "Continue" : "Start Learning"}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function MyCoursesStyles() {
  return <style dangerouslySetInnerHTML={{ __html: myCoursesCss }} />;
}

const myCoursesCss = `
.mc-page{
  --navy:#0F2F5F; --navy-2:#123B6D; --blue:#1459B8; --blue-2:#2563EB;
  --orange:#FF6B00; --orange-2:#E85F00; --orange-tint:#FFF3EA;
  --bg:#F7F9FC; --card:#fff; --line:#E2E8F1; --line-2:#EDF1F7;
  --muted:#64748B; --soft:#8A97AB;
  --green:#15803D; --green-tint:#E8F6EE; --blue-tint:#EAF1FD;
  --ease:cubic-bezier(.2,.7,.2,1);
  flex:1;min-width:0;width:100%;box-sizing:border-box;
  padding:24px 28px 40px;background:var(--bg);color:var(--navy);
}
.mc-page *{box-sizing:border-box}
.mc-container{width:100%;max-width:1360px;margin:0 auto}
.mc-min0{min-width:0}
.mc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

@keyframes mc-rise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@keyframes mc-swap{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes mc-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes mc-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes mc-spin{to{transform:rotate(360deg)}}
@keyframes mc-flow{0%{background-position:0% 50%}100%{background-position:100% 50%}}
@keyframes mc-sheen{from{transform:translateX(-120%) skewX(-18deg)}to{transform:translateX(260%) skewX(-18deg)}}
.mc-spin{animation:mc-spin .8s linear infinite}
.mc-reveal{animation:mc-rise 520ms var(--ease) both;animation-delay:calc(var(--i,0) * 60ms)}
.mc-swap{animation:mc-swap 420ms var(--ease) both}

/* Buttons */
.mc-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 18px;border-radius:10px;border:1px solid transparent;font:inherit;font-size:14px;font-weight:600;line-height:1;cursor:pointer;white-space:nowrap;transition:background .2s ease,border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease),color .2s ease}
.mc-btn:focus-visible,.mc-filter:focus-visible,.mc-search input:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.mc-btn:active{transform:scale(.98)}
.mc-btn:disabled{opacity:.65;cursor:not-allowed}
.mc-btn-sm{height:36px;padding:0 14px;font-size:13px}
.mc-btn-primary{background:linear-gradient(180deg,#FF8A12 0%,#FF6B00 55%,#F25A00 100%);color:#fff}
.mc-btn-primary::after{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);transform:translateX(-120%) skewX(-18deg);pointer-events:none}
.mc-btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(255,107,0,.35)}
.mc-btn-primary:hover::after{animation:mc-sheen 700ms ease}
.mc-btn-primary svg{transition:transform .2s var(--ease)}
.mc-btn-primary:hover svg{transform:translateX(3px)}
.mc-btn-secondary{background:#fff;color:var(--blue);border-color:var(--line)}
.mc-btn-secondary:hover{background:var(--blue-tint);border-color:#BFD3F2;transform:translateY(-2px);box-shadow:0 6px 14px rgba(20,89,184,.12)}
.mc-btn-ghost-light{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.3)}
.mc-btn-ghost-light:hover{background:rgba(255,255,255,.22);transform:translateY(-2px)}
.mc-refresh-icon{transition:transform .5s var(--ease)}
.mc-refresh:hover .mc-refresh-icon{transform:rotate(180deg)}

/* Heading */
.mc-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px}
.mc-kicker{margin-bottom:4px;font-size:13px;font-weight:600;color:var(--orange)}
.mc-heading h1{margin:0;font-size:30px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:var(--navy)}
.mc-heading p{max-width:640px;margin:6px 0 0;font-size:15px;line-height:1.6;color:var(--muted)}

/* Summary */
.mc-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:20px}
.mc-tile{display:flex;align-items:center;gap:14px;min-width:0;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:0 1px 2px rgba(15,47,95,.04);transition:box-shadow .25s ease,transform .25s var(--ease),border-color .25s ease}
.mc-tile:hover{transform:translateY(-4px);box-shadow:0 14px 28px rgba(15,47,95,.12);border-color:#C9D8EE}
.mc-tile:hover .mc-icon{transform:scale(1.12) rotate(-6deg)}
.mc-icon{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;border-radius:11px;transition:transform .3s var(--ease)}
.mc-tone-blue{background:var(--blue-tint);color:var(--blue)}
.mc-tone-orange{background:var(--orange-tint);color:var(--orange)}
.mc-tone-green{background:var(--green-tint);color:var(--green)}
.mc-tone-navy{background:#E6ECF5;color:var(--navy)}
.mc-tile-label{display:block;font-size:13px;color:var(--muted)}
.mc-tile-value{display:block;margin-top:3px;font-size:26px;line-height:1.15;font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums}
.mc-tile-helper{display:block;margin-top:4px;font-size:12px;color:var(--soft)}

/* Spotlight hero */
.mc-hero{position:relative;overflow:hidden;margin-bottom:24px;padding:26px 28px 14px;border-radius:16px;color:#fff;background:linear-gradient(120deg,#0F2F5F 0%,#123B6D 35%,#1459B8 70%,#0F2F5F 100%);background-size:220% 220%;animation:mc-rise 520ms var(--ease) both,mc-flow 14s ease-in-out infinite alternate;animation-delay:calc(var(--i,0) * 60ms),0s;box-shadow:0 12px 30px rgba(15,47,95,.18)}
.mc-hero::after{content:"";position:absolute;left:0;bottom:0;width:100%;height:3px;background:linear-gradient(90deg,var(--orange) 0%,var(--orange) 16%,transparent 16%)}
.mc-hero-glow{position:absolute;width:320px;height:320px;top:-190px;right:6%;border-radius:50%;background:rgba(255,255,255,.06);pointer-events:none}
.mc-hero-inner{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:28px}
.mc-hero-main{display:flex;align-items:center;gap:20px;min-width:0;flex:1}
.mc-hero-thumb{width:104px;height:104px;flex:0 0 104px;overflow:hidden;display:flex;align-items:center;justify-content:center;border-radius:16px;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.28);box-shadow:0 8px 20px rgba(0,0,0,.2)}
.mc-hero-thumb img{width:100%;height:100%;object-fit:cover}
.mc-eyebrow{display:flex;align-items:center;gap:7px;margin-bottom:6px;font-size:13px;font-weight:600;color:#C9DBF5}
.mc-hero h2{margin:0;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-.01em;color:#fff}
.mc-hero p{max-width:620px;margin:8px 0 0;font-size:14px;line-height:1.6;color:#D3E1F5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mc-hero-meta{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:12px;font-size:13px;color:#D3E1F5}
.mc-hero-meta span{display:inline-flex;align-items:center;gap:6px}
.mc-hero-action{display:flex;flex-direction:column;align-items:flex-end;gap:10px;min-width:240px}
.mc-hero-pct{font-size:34px;line-height:1;font-weight:700;color:#fff;font-variant-numeric:tabular-nums}
.mc-hero-track{width:100%;height:8px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.2)}
.mc-hero-track span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#fff,#CFE0FA);transform-origin:left;animation:mc-grow 900ms var(--ease) 150ms both}
.mc-hero-buttons{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px}
.mc-hero-hint{position:relative;z-index:1;display:flex;align-items:center;gap:7px;margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,.14);font-size:12px;color:#B7C9E4}

/* Library head & controls */
.mc-library-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:16px}
.mc-library-head h2{margin:0;font-size:20px;font-weight:700;color:var(--navy)}
.mc-library-head p{margin:3px 0 0;font-size:13px;color:var(--muted)}
.mc-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.mc-search{display:flex;align-items:center;gap:8px;width:250px;height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--soft);transition:border-color .2s ease,box-shadow .2s ease}
.mc-search:focus-within{border-color:var(--blue-2);box-shadow:0 0 0 3px rgba(37,99,235,.15);color:var(--blue)}
.mc-search input{flex:1;min-width:0;border:0;outline:none;background:transparent;font:inherit;font-size:14px;color:var(--navy)}
.mc-search input:focus-visible{box-shadow:none}
.mc-search-clear{display:flex;align-items:center;justify-content:center;width:22px;height:22px;border:0;border-radius:50%;background:var(--line-2);color:var(--muted);cursor:pointer;transition:background .2s ease}
.mc-search-clear:hover{background:#D9E3F2}
.mc-filters{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.mc-filter{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 12px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--muted);font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s ease,border-color .2s ease,color .2s ease,transform .2s var(--ease),box-shadow .2s ease}
.mc-filter:hover{border-color:#BFD3F2;color:var(--blue);transform:translateY(-1px)}
.mc-filter.is-active{background:var(--blue);border-color:var(--blue);color:#fff;box-shadow:0 6px 14px rgba(20,89,184,.25)}
.mc-filter-count{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:20px;padding:0 6px;border-radius:999px;background:var(--line-2);color:var(--muted);font-size:11.5px}
.mc-filter.is-active .mc-filter-count{background:rgba(255,255,255,.22);color:#fff}

/* Course grid & cards */
.mc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.mc-card{display:flex;flex-direction:column;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:0 1px 2px rgba(15,47,95,.04),0 4px 14px rgba(15,47,95,.03);cursor:pointer;transition:transform .3s var(--ease),box-shadow .3s ease,border-color .3s ease}
.mc-card:hover{transform:translateY(-5px);box-shadow:0 16px 32px rgba(15,47,95,.13);border-color:#9DBBEA}
.mc-card.is-previewing{border-color:var(--blue-2);box-shadow:0 0 0 3px rgba(37,99,235,.16),0 12px 26px rgba(15,47,95,.1)}
.mc-card.is-pinned{border-color:var(--orange);box-shadow:0 0 0 3px rgba(255,107,0,.2),0 12px 26px rgba(15,47,95,.1)}
.mc-cover{position:relative;height:150px;overflow:hidden;background:linear-gradient(135deg,var(--blue-tint),#F4F8FF)}
.mc-cover img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s var(--ease)}
.mc-card:hover .mc-cover img{transform:scale(1.08)}
.mc-cover-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--blue)}
.mc-status{position:absolute;top:12px;right:12px;display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;backdrop-filter:blur(6px);box-shadow:0 2px 8px rgba(15,47,95,.12)}
.mc-status.is-done{background:rgba(232,246,238,.95);color:var(--green)}
.mc-status.is-active{background:rgba(234,241,253,.95);color:var(--blue)}
.mc-status.is-new{background:rgba(255,243,234,.95);color:var(--orange-2)}
.mc-card-body{display:flex;flex-direction:column;flex:1;padding:18px}
.mc-card-body h3{margin:0;font-size:17px;line-height:1.35;font-weight:700;color:var(--navy)}
.mc-card-meta{display:flex;align-items:center;flex-wrap:wrap;gap:6px 12px;margin-top:6px;font-size:12.5px;color:var(--muted)}
.mc-pkg{display:inline-flex;align-items:center;gap:5px}
.mc-card-desc{min-height:42px;margin:10px 0 0;font-size:13px;line-height:1.6;color:var(--muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mc-progress{margin-top:14px}
.mc-progress-head{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:var(--muted)}
.mc-progress-head strong{color:var(--blue);font-size:13px}
.mc-bar{height:8px;overflow:hidden;margin-top:8px;border-radius:999px;background:#E6ECF5}
.mc-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--blue-2));transform-origin:left;animation:mc-grow 1000ms var(--ease) 250ms both}
.mc-bar span.is-done{background:linear-gradient(90deg,#16A05D,#22C176)}
.mc-progress-foot{display:flex;justify-content:space-between;gap:8px;margin-top:6px;font-size:12px;color:var(--soft)}
.mc-card-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:auto;padding-top:16px;border-top:1px solid var(--line-2)}
.mc-card-body .mc-progress{margin-bottom:16px}
.mc-enrolled{display:flex;flex-direction:column;gap:3px;min-width:0;font-size:12px;color:var(--soft)}

/* Hover preview / click to pin */
@keyframes mc-swap2{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
button.mc-tile{width:100%;text-align:left;font:inherit;color:inherit;cursor:pointer;position:relative}
button.mc-tile:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.mc-grow{flex:1}
.mc-tile.is-active{transform:translateY(-4px);border-color:var(--blue-2);box-shadow:0 0 0 3px rgba(37,99,235,.14),0 14px 28px rgba(15,47,95,.1)}
.mc-tile-caret{flex:0 0 auto;align-self:center;color:var(--soft);transition:transform .3s var(--ease),color .2s ease}
.mc-tile.is-active .mc-tile-caret{transform:rotate(180deg);color:var(--orange)}
.mc-tile-zone{margin-bottom:20px}
.mc-tile-zone .mc-summary{margin-bottom:0}
.mc-detail{display:grid;grid-template-rows:0fr;margin-top:0;transition:grid-template-rows .4s var(--ease),margin-top .4s var(--ease)}
.mc-detail.is-open{grid-template-rows:1fr;margin-top:14px}
.mc-detail-inner{min-height:0;overflow:hidden;padding:0 2px}
.mc-detail-card{padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:0 10px 26px rgba(15,47,95,.08);animation:mc-swap2 .35s var(--ease) both}
.mc-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.mc-detail-title{display:flex;align-items:center;gap:12px;min-width:0}
.mc-detail-title h3{margin:0;font-size:17px;font-weight:700;color:var(--navy)}
.mc-detail-title p{margin:2px 0 0;font-size:13px;color:var(--muted)}
.mc-detail-hint{flex:0 0 auto;padding:5px 10px;border-radius:999px;background:var(--blue-tint);color:var(--blue);font-size:12px;font-weight:600}
.mc-detail-empty,.mc-detail-more{margin:0;font-size:13px;color:var(--muted)}
.mc-detail-more{margin-top:12px}
.mc-trows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mc-trow{display:flex;align-items:center;gap:12px;width:100%;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:#fff;text-align:left;font:inherit;color:inherit;cursor:pointer;animation:mc-swap2 .35s var(--ease) both;transition:border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease)}
.mc-trow:nth-child(2){animation-delay:40ms}.mc-trow:nth-child(3){animation-delay:80ms}.mc-trow:nth-child(4){animation-delay:120ms}.mc-trow:nth-child(5){animation-delay:160ms}.mc-trow:nth-child(6){animation-delay:200ms}
.mc-trow:hover{border-color:#9DBBEA;box-shadow:0 8px 18px rgba(15,47,95,.1);transform:translateX(4px)}
.mc-trow-thumb{width:38px;height:38px;flex:0 0 38px;overflow:hidden;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--blue-tint);color:var(--blue)}
.mc-trow-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .5s var(--ease)}
.mc-trow:hover .mc-trow-thumb img{transform:scale(1.12)}
.mc-trow-title{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;color:var(--navy)}
.mc-trow-sub{display:block;margin-top:2px;font-size:12px;color:var(--muted)}
.mc-trow b{font-size:13px;color:var(--blue)}
.mc-trow-arrow{flex:0 0 auto;color:#A3B0C4;transition:transform .25s var(--ease),color .2s ease}
.mc-trow:hover .mc-trow-arrow{transform:translateX(4px);color:var(--orange)}
.mc-pin-chip{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:2px 9px;border:0;border-radius:999px;background:var(--orange);color:#fff;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer;animation:mc-swap2 .3s var(--ease) both;transition:background .2s ease}
.mc-pin-chip:hover{background:var(--orange-2)}
.mc-pin-chip.is-soft{background:rgba(255,255,255,.18);cursor:default}
.mc-pin-chip-dark{margin-left:0;flex:0 0 auto;height:30px;padding:0 10px;background:var(--orange-tint);color:var(--orange-2)}
.mc-pin-chip-dark:hover{background:#FFE3CD}
.mc-pin-btn{position:absolute;top:12px;left:12px;z-index:2;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;background:rgba(255,255,255,.92);color:var(--navy);box-shadow:0 2px 8px rgba(15,47,95,.18);cursor:pointer;opacity:0;transform:scale(.85);transition:opacity .2s ease,transform .25s var(--ease),background .2s ease,color .2s ease}
.mc-card:hover .mc-pin-btn,.mc-pin-btn:focus-visible,.mc-pin-btn.is-on{opacity:1;transform:scale(1)}
.mc-pin-btn.is-on{background:var(--orange);color:#fff}
.mc-pin-btn:hover{background:var(--blue-tint)}
.mc-pin-btn.is-on:hover{background:var(--orange-2)}
@media (hover:none){.mc-pin-btn{opacity:1;transform:none}}
@media (max-width:820px){.mc-trows{grid-template-columns:minmax(0,1fr)}.mc-detail-hint{display:none}}
@media (prefers-reduced-motion:reduce){.mc-detail{transition:none}.mc-detail-card,.mc-trow,.mc-pin-chip{animation:none!important}.mc-pin-btn{transition:none}}

/* Empty / error / note */
.mc-empty{min-height:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:28px;border:1px dashed #CBD6E6;border-radius:16px;background:#FAFBFE;text-align:center;animation:mc-rise 420ms var(--ease) both}
.mc-empty-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;border-radius:14px;background:var(--blue-tint);color:var(--blue)}
.mc-empty strong{font-size:16px;color:var(--navy)}
.mc-empty span{max-width:360px;margin-bottom:10px;font-size:13.5px;line-height:1.5;color:var(--muted)}
.mc-error{min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;border:1px solid #F3D1D1;border-radius:16px;background:#fff;text-align:center;animation:mc-rise 420ms var(--ease) both}
.mc-error-icon{width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:#FDECEC;color:#C62828}
.mc-error h2{margin:16px 0 0;font-size:18px;font-weight:700;color:var(--navy)}
.mc-error p{max-width:480px;margin:8px 0 20px;font-size:14px;line-height:1.6;color:var(--muted)}
.mc-note{display:flex;align-items:center;gap:10px;margin-top:20px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:#fff;color:var(--muted);font-size:13px}
.mc-note svg{color:var(--blue);flex:0 0 auto}

/* Skeleton */
.mc-skel{border-radius:16px;background:linear-gradient(90deg,#E9EEF6 25%,#F6F8FC 37%,#E9EEF6 63%);background-size:1200px 100%;animation:mc-shimmer 1.4s linear infinite}
.mc-skel-tile{height:96px}
.mc-skel-hero{height:200px;margin-bottom:24px}
.mc-skel-card{height:380px}
.mc-summary,.mc-grid{margin-bottom:20px}
.mc-grid{margin-bottom:0}

/* Responsive */
@media (max-width:1200px){
  .mc-summary{grid-template-columns:repeat(2,minmax(0,1fr))}
  .mc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:900px){
  .mc-hero-inner{flex-direction:column;align-items:stretch}
  .mc-hero-action{align-items:stretch;min-width:0}
  .mc-hero-buttons{justify-content:stretch}
  .mc-hero-buttons .mc-btn{flex:1}
}
@media (max-width:760px){
  .mc-page{padding:18px 14px 28px}
  .mc-heading{flex-direction:column}
  .mc-refresh{width:100%}
  .mc-controls{width:100%;justify-content:flex-start}
  .mc-search{width:100%}
  .mc-grid{grid-template-columns:minmax(0,1fr)}
  .mc-hero{padding:22px 18px 12px}
  .mc-hero-main{align-items:flex-start}
  .mc-hero-thumb{width:76px;height:76px;flex-basis:76px}
  .mc-hero h2{font-size:21px}
}
@media (max-width:520px){
  .mc-summary{grid-template-columns:minmax(0,1fr)}
  .mc-hero-main{flex-direction:column}
  .mc-btn{height:44px}
}
@media (hover:none){.mc-hero-hint{display:none}}
@media (prefers-reduced-motion:reduce){
  .mc-reveal,.mc-swap,.mc-hero,.mc-bar span,.mc-hero-track span,.mc-skel,.mc-empty,.mc-error{animation:none!important}
  .mc-card,.mc-tile,.mc-btn,.mc-icon,.mc-cover img,.mc-filter{transition:none!important}
}
`;
