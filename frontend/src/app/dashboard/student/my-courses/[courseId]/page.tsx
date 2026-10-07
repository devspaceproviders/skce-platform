"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type SyntheticEvent,
  type KeyboardEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  Lock,
  Play,
  PlayCircle,
  RefreshCw,
  X,
  Video,
  Image as ImageIcon,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API_URL.replace(/\/api$/, "");

function getMediaUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_ORIGIN}${url}`;
  }

  return `${API_ORIGIN}/${url}`;
}

type Lesson = {
  id: number;
  title: string;
  description?: string | null;
  content?: string | null;
  videoUrl?: string | null;
  documentUrl?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
};

type CourseModule = {
  id: number;
  title: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  lessons: Lesson[];
};

type CourseContent = {
  course: {
    id: number;
    code?: string | null;
    name: string;
    description?: string | null;
    mode?: string | null;
    imageUrl?: string | null;
    isActive?: boolean;
  };
  enrollment?: {
    id: number;
    status: string;
  } | null;
  package?: {
    id: number;
    name: string;
  } | null;
  modules: CourseModule[];
};

type LessonProgress = {
  lessonId: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
};

type CourseProgress = {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  startedLessons: number;
  remainingLessons: number;
  progressPercentage: number;
  lessons: LessonProgress[];
};

type StatKey = "total" | "completed" | "started" | "remaining";

function getStudentStorageId(token: string | null) {
  if (!token) {
    return "student";
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return "student";
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);

    return String(parsed.id ?? parsed.userId ?? parsed.sub ?? "student");
  } catch {
    return "student";
  }
}

function reveal(index: number): CSSProperties {
  return { ["--i" as string]: index } as CSSProperties;
}

export default function StudentCoursePage() {
  const params = useParams();
  const router = useRouter();

  const courseId = Number(params.courseId);

  const [courseContent, setCourseContent] = useState<CourseContent | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [startingLesson, setStartingLesson] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [videoWatchedOnce, setVideoWatchedOnce] = useState(false);
  const [watchPercent, setWatchPercent] = useState(0);
  const [courseCertificateUrl, setCourseCertificateUrl] = useState<string | null>(
    null
  );
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [shakeId, setShakeId] = useState<number | null>(null);
  const [hoverLesson, setHoverLesson] = useState<number | null>(null);
  const [hoverStat, setHoverStat] = useState<StatKey | null>(null);
  const [pinnedStat, setPinnedStat] = useState<StatKey | null>(null);
  const [lastStat, setLastStat] = useState<StatKey>("total");
  const mainRef = useRef<HTMLElement | null>(null);
  const shownStat = hoverStat ?? pinnedStat;

  useEffect(() => {
    if (shownStat) {
      setLastStat(shownStat);
    }
  }, [shownStat]);

  const videoMaxWatchedTimeRef = useRef(0);
  const videoLastSavedTimeRef = useRef(0);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const getVideoWatchStorageKey = (lessonId: number) => {
    const studentId = getStudentStorageId(token);

    return `skce-video-watch-${studentId}-${courseId}-${lessonId}`;
  };

  /* ---------------------------------------------------------
   * LOAD COURSE CONTENT
   * --------------------------------------------------------- */
  const loadCourseContent = async () => {
    if (!courseId || Number.isNaN(courseId)) {
      setError("Invalid course ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/course-content/${courseId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load course content.");
      }

      const content = data?.data ?? data;

      setCourseContent(content);

      /* Automatically select the first active lesson. */
      const firstLesson = content?.modules
        ?.slice()
        .sort((a: CourseModule, b: CourseModule) => a.sortOrder - b.sortOrder)
        ?.flatMap((module: CourseModule) =>
          module.lessons
            .slice()
            .sort((a: Lesson, b: Lesson) => a.sortOrder - b.sortOrder)
        )
        ?.find((lesson: Lesson) => lesson.isActive !== false);

      if (firstLesson) {
        setSelectedLesson(firstLesson);
      }
    } catch (err: any) {
      console.error("Course content error:", err);
      setError(err?.message || "Unable to load course content.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
   * LOAD COURSE PROGRESS
   * --------------------------------------------------------- */
  const loadProgress = async () => {
    if (!courseId || Number.isNaN(courseId) || !token) {
      return;
    }

    try {
      setProgressLoading(true);

      const response = await fetch(
        `${API_URL}/course-progress/courses/${courseId}/progress`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load course progress.");
      }

      setProgress(data?.data ?? data);
    } catch (err) {
      console.error("Course progress error:", err);
    } finally {
      setProgressLoading(false);
    }
  };

  /* ---------------------------------------------------------
   * LOAD CURRENT COURSE CERTIFICATE
   * --------------------------------------------------------- */
  const loadCourseCertificate = async () => {
    if (!token || !courseId || Number.isNaN(courseId)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/certificates`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      const certificates = data?.data ?? data;

      const certificateList = Array.isArray(certificates)
        ? certificates
        : Array.isArray(certificates?.certificates)
        ? certificates.certificates
        : [];

      const courseCertificate = certificateList.find(
        (certificate: any) =>
          Number(certificate?.courseId) === courseId &&
          String(certificate?.certificateType || "COURSE").toUpperCase() ===
            "COURSE" &&
          certificate?.certificateUrl
      );

      setCourseCertificateUrl(courseCertificate?.certificateUrl ?? null);
    } catch (err) {
      console.error("Course certificate error:", err);
    }
  };

  /* ---------------------------------------------------------
   * INITIAL LOAD
   * --------------------------------------------------------- */
  useEffect(() => {
    loadCourseContent();
    loadProgress();
    loadCourseCertificate();
  }, [courseId]);

  /* ---------------------------------------------------------
   * TOAST AUTO-DISMISS (display only)
   * --------------------------------------------------------- */
  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = setTimeout(() => setNotice(""), 4500);

    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!error || !courseContent) {
      return;
    }

    const timer = setTimeout(() => setError(""), 6000);

    return () => clearTimeout(timer);
  }, [error, courseContent]);

  /* ---------------------------------------------------------
   * VIDEO WATCH STATE (restored per lesson)
   * --------------------------------------------------------- */
  useEffect(() => {
    if (!selectedLesson?.videoUrl) {
      setVideoWatchedOnce(false);
      setWatchPercent(0);
      videoMaxWatchedTimeRef.current = 0;
      videoLastSavedTimeRef.current = 0;
      return;
    }

    const studentId = getStudentStorageId(token);
    const storageKey = `skce-video-watch-${studentId}-${courseId}-${selectedLesson.id}`;
    const completedKey = `${storageKey}-completed`;
    const savedMaxTime = Number(localStorage.getItem(storageKey) || 0);
    const locallyCompleted = localStorage.getItem(completedKey) === "true";

    // Video completion is intentionally tracked separately from
    // the lesson's backend COMPLETED status. A lesson may already
    // be marked completed by the existing LMS flow, but that must
    // not allow a student to skip a video that has not been fully
    // watched under this video-watch rule.
    setVideoWatchedOnce(locallyCompleted);
    setWatchPercent(locallyCompleted ? 100 : 0);
    videoMaxWatchedTimeRef.current = Number.isFinite(savedMaxTime)
      ? Math.max(0, savedMaxTime)
      : 0;
    videoLastSavedTimeRef.current = videoMaxWatchedTimeRef.current;
  }, [selectedLesson?.id, selectedLesson?.videoUrl, courseId, progress, token]);

  /* ---------------------------------------------------------
   * SAVE FURTHEST VIDEO POSITION WHEN THE STUDENT LEAVES
   * (switching lesson, closing/hiding the tab, leaving the page)
   * --------------------------------------------------------- */
  useEffect(() => {
    const lessonId = selectedLesson?.id;

    if (!lessonId || !selectedLesson?.videoUrl) {
      return;
    }

    const flush = () => {
      try {
        const key = getVideoWatchStorageKey(lessonId);

        if (localStorage.getItem(`${key}-completed`) === "true") {
          return;
        }

        if (videoMaxWatchedTimeRef.current > 0) {
          localStorage.setItem(key, String(videoMaxWatchedTimeRef.current));
        }
      } catch {
        /* storage unavailable - nothing to save */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [selectedLesson?.id, selectedLesson?.videoUrl, courseId, token]);

  /* ---------------------------------------------------------
   * GET LESSON PROGRESS
   * --------------------------------------------------------- */
  const getLessonProgress = (lessonId: number) => {
    return progress?.lessons?.find((item) => item.lessonId === lessonId);
  };

  /* ---------------------------------------------------------
   * ALL LESSONS - one ordered list across all modules.
   * --------------------------------------------------------- */
  const allLessons = useMemo(() => {
    if (!courseContent?.modules) {
      return [];
    }

    return courseContent.modules
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((module) =>
        module.lessons
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .filter((lesson) => lesson.isActive !== false)
      );
  }, [courseContent]);

  /* ---------------------------------------------------------
   * LESSON LOCKING
   * The first lesson is available immediately. Every following
   * lesson unlocks only after the previous lesson is completed.
   * --------------------------------------------------------- */
  const isLessonUnlocked = (lessonId: number) => {
    const lessonIndex = allLessons.findIndex((lesson) => lesson.id === lessonId);

    if (lessonIndex <= 0) {
      return true;
    }

    const previous = allLessons[lessonIndex - 1];

    return getLessonProgress(previous.id)?.status === "COMPLETED";
  };

  const currentLessonIndex = selectedLesson
    ? allLessons.findIndex((lesson) => lesson.id === selectedLesson.id)
    : -1;

  const previousLesson =
    currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;

  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  /* ---------------------------------------------------------
   * START LESSON
   * --------------------------------------------------------- */
  const startLesson = async (lesson: Lesson) => {
    if (!token) {
      setError("Please login again.");
      return;
    }

    if (!isLessonUnlocked(lesson.id)) {
      setError("This lesson is locked. Complete the previous lesson first.");
      return;
    }

    try {
      setStartingLesson(true);
      setError("");

      const response = await fetch(
        `${API_URL}/course-progress/lessons/${lesson.id}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to start lesson.");
      }

      await loadProgress();
    } catch (err: any) {
      console.error("Start lesson error:", err);
      setError(err?.message || "Unable to start the lesson.");
    } finally {
      setStartingLesson(false);
    }
  };

  /* ---------------------------------------------------------
   * SELECT LESSON
   * --------------------------------------------------------- */
  const handleSelectLesson = async (lesson: Lesson) => {
    if (!isLessonUnlocked(lesson.id)) {
      setError("This lesson is locked. Complete the previous lesson first.");
      setShakeId(lesson.id);
      setTimeout(() => setShakeId(null), 500);
      return;
    }

    setError("");
    setSelectedLesson(lesson);

    const lessonStatus = getLessonProgress(lesson.id);

    /* Don't move a completed lesson backwards to IN_PROGRESS. */
    if (lessonStatus?.status === "COMPLETED") {
      return;
    }

    await startLesson(lesson);
  };

  const handlePreviousLesson = async () => {
    if (!previousLesson) {
      return;
    }

    await handleSelectLesson(previousLesson);
  };

  const handleNextLesson = async () => {
    if (!nextLesson) {
      return;
    }

    await handleSelectLesson(nextLesson);
  };

  /* ---------------------------------------------------------
   * VIDEO WATCH RULES (forward seeking blocked until finished)
   * --------------------------------------------------------- */
  const saveVideoWatchProgress = (currentTime: number) => {
    if (!selectedLesson?.videoUrl || videoWatchedOnce) {
      return;
    }

    const safeTime = Math.max(0, currentTime);
    const furthestTime = Math.max(videoMaxWatchedTimeRef.current, safeTime);

    videoMaxWatchedTimeRef.current = furthestTime;

    const storageKey = getVideoWatchStorageKey(selectedLesson.id);

    localStorage.setItem(storageKey, String(furthestTime));
    videoLastSavedTimeRef.current = furthestTime;
  };

  const handleVideoTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    if (videoWatchedOnce) {
      return;
    }

    const video = event.currentTarget;
    const currentTime = video.currentTime;
    const maxAllowedTime = videoMaxWatchedTimeRef.current;

    // Never allow a timeupdate caused by a forward seek to become
    // the new furthest-watched position.
    if (currentTime > maxAllowedTime + 0.5) {
      video.currentTime = maxAllowedTime;
      return;
    }

    if (currentTime > videoMaxWatchedTimeRef.current) {
      videoMaxWatchedTimeRef.current = currentTime;

      if (currentTime - videoLastSavedTimeRef.current >= 2) {
        saveVideoWatchProgress(currentTime);
      }
    }

    if (video.duration > 0 && Number.isFinite(video.duration)) {
      setWatchPercent(
        Math.min(
          100,
          Math.floor((videoMaxWatchedTimeRef.current / video.duration) * 100)
        )
      );
    }
  };

  const handleVideoSeeking = (event: SyntheticEvent<HTMLVideoElement>) => {
    if (videoWatchedOnce) {
      return;
    }

    const video = event.currentTarget;
    const maxAllowedTime = videoMaxWatchedTimeRef.current;

    // Backward seeking is allowed. Only forward seeking beyond the
    // furthest point already watched is blocked.
    if (video.currentTime > maxAllowedTime + 0.5) {
      video.currentTime = maxAllowedTime;
    }
  };

  const handleVideoLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    if (videoWatchedOnce) {
      return;
    }

    const savedTime = videoMaxWatchedTimeRef.current;
    const duration = event.currentTarget.duration;

    if (savedTime > 0 && savedTime < duration) {
      event.currentTarget.currentTime = savedTime;
      setWatchPercent(Math.min(100, Math.floor((savedTime / duration) * 100)));
    }
  };

  const handleVideoEnded = () => {
    if (!selectedLesson?.videoUrl) {
      return;
    }

    const storageKey = getVideoWatchStorageKey(selectedLesson.id);

    localStorage.setItem(`${storageKey}-completed`, "true");
    localStorage.setItem(storageKey, String(videoMaxWatchedTimeRef.current));

    if (!videoWatchedOnce) {
      setNotice("Video finished. You can now mark this lesson as complete.");
    }

    setVideoWatchedOnce(true);
    setWatchPercent(100);
  };

  const handleVideoKeyDown = (event: KeyboardEvent<HTMLVideoElement>) => {
    if (videoWatchedOnce) {
      return;
    }

    if (["ArrowRight", "End", "PageDown", "MediaTrackNext"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  /* ---------------------------------------------------------
   * COMPLETE LESSON
   * --------------------------------------------------------- */
  const completeLesson = async () => {
    if (!selectedLesson || !token) {
      return;
    }

    try {
      setCompletingLesson(true);
      setError("");

      const response = await fetch(
        `${API_URL}/course-progress/lessons/${selectedLesson.id}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to complete lesson.");
      }

      await loadProgress();
      await loadCourseCertificate();

      setNotice(
        nextLesson
          ? "Lesson completed. The next lesson is now unlocked."
          : "Course completed. Congratulations!"
      );

      /*
       * Do not automatically start the next lesson.
       * Completing this lesson unlocks the next lesson.
       * The student must explicitly open it.
       */
    } catch (err: any) {
      console.error("Complete lesson error:", err);
      setError(err?.message || "Unable to complete the lesson.");
    } finally {
      setCompletingLesson(false);
    }
  };

  const totalModules = courseContent?.modules?.length || 0;

  const totalLessonsFromContent = useMemo(() => {
    if (!courseContent?.modules) {
      return 0;
    }

    return courseContent.modules.reduce(
      (total, module) => total + module.lessons.length,
      0
    );
  }, [courseContent]);

  /* ---------------------------------------------------------
   * LOADING
   * --------------------------------------------------------- */
  if (loading) {
    return (
      <>
        <main className="lp-page" aria-busy="true" aria-live="polite">
          <div className="lp-container">
            <div className="lp-skel lp-skel-hero" />
            <div className="lp-layout">
              <div className="lp-skel lp-skel-side" />
              <div className="lp-skel lp-skel-main" />
            </div>
            <span className="lp-sr">Loading course content</span>
          </div>
        </main>
        <LessonStyles />
      </>
    );
  }

  /* ---------------------------------------------------------
   * ERROR
   * --------------------------------------------------------- */
  if (error && !courseContent) {
    return (
      <>
        <main className="lp-page">
          <div className="lp-container">
            <div className="lp-error" role="alert">
              <div className="lp-error-icon">
                <AlertCircle size={24} />
              </div>
              <h2>Unable to load course</h2>
              <p>{error}</p>
              <div className="lp-error-actions">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/student/my-courses")}
                  className="lp-btn lp-btn-secondary"
                >
                  <ArrowLeft size={15} />
                  My Courses
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadCourseContent();
                    loadProgress();
                  }}
                  className="lp-btn lp-btn-primary"
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
        <LessonStyles />
      </>
    );
  }

  if (!courseContent) {
    return null;
  }

  const currentLessonProgress = selectedLesson
    ? getLessonProgress(selectedLesson.id)
    : null;

  const progressPercentage = progress?.progressPercentage ?? 0;
  const lessonCount = progress?.totalLessons ?? totalLessonsFromContent;
  const courseImage = getMediaUrl(courseContent.course.imageUrl);
  const lessonCompleted = currentLessonProgress?.status === "COMPLETED";
  const videoLocked = Boolean(selectedLesson?.videoUrl) && !videoWatchedOnce;

  const statMeta: Record<StatKey, { title: string; subtitle: string }> = {
    total: { title: "All lessons", subtitle: `${progress?.totalLessons ?? allLessons.length} lessons in this course` },
    completed: { title: "Completed lessons", subtitle: `${progress?.completedLessons ?? 0} finished` },
    started: { title: "Started lessons", subtitle: `${progress?.startedLessons ?? 0} opened so far` },
    remaining: { title: "Remaining lessons", subtitle: `${progress?.remainingLessons ?? 0} still to go` },
  };

  const statLessons = allLessons.filter((lesson) => {
    const lp = getLessonProgress(lesson.id);
    const done = lp?.status === "COMPLETED";

    if (lastStat === "completed") return done;
    if (lastStat === "started") return Boolean(lp?.startedAt) || lp?.status === "IN_PROGRESS" || done;
    if (lastStat === "remaining") return !done;

    return true;
  });

  const togglePinStat = (key: StatKey) =>
    setPinnedStat((prev) => (prev === key ? null : key));

  const goToLesson = async (lesson: Lesson) => {
    const unlocked = isLessonUnlocked(lesson.id);

    await handleSelectLesson(lesson);

    if (unlocked) {
      mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <main className="lp-page">
        {/* Toasts */}
        <div className="lp-toasts" aria-live="polite">
          {error ? (
            <div className="lp-toast lp-toast-error" role="alert" key={`e-${error}`}>
              <AlertCircle size={18} />
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss">
                <X size={15} />
              </button>
              <i className="lp-toast-timer" />
            </div>
          ) : null}
          {notice ? (
            <div className="lp-toast lp-toast-ok" role="status" key={`n-${notice}`}>
              <CheckCircle2 size={18} />
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
                <X size={15} />
              </button>
              <i className="lp-toast-timer" />
            </div>
          ) : null}
        </div>

        <div className="lp-container">
          <button
            type="button"
            onClick={() => router.push("/dashboard/student/my-courses")}
            className="lp-back lp-reveal"
            style={reveal(0)}
          >
            <ArrowLeft size={15} />
            My Courses
          </button>

          {/* COURSE HEADER */}
          <section className="lp-hero lp-reveal" style={reveal(1)}>
            <div className="lp-hero-img">
              {courseImage ? (
                <img src={courseImage} alt={courseContent.course.name} />
              ) : (
                <div className="lp-hero-fallback">SKCE</div>
              )}
            </div>

            <div className="lp-hero-main">
              <div className="lp-badges">
                {courseContent.course.mode ? (
                  <span className="lp-badge">{courseContent.course.mode}</span>
                ) : null}
                {courseContent.course.isActive !== false ? (
                  <span className="lp-badge lp-badge-live">
                    <i /> Active
                  </span>
                ) : null}
              </div>

              <h1>{courseContent.course.name}</h1>

              {courseContent.course.description ? (
                <p>{courseContent.course.description}</p>
              ) : null}

              <div className="lp-meta">
                <span>
                  {totalModules} {totalModules === 1 ? "Module" : "Modules"}
                </span>
                <span className="lp-dot" />
                <span>
                  {lessonCount} {lessonCount === 1 ? "Lesson" : "Lessons"}
                </span>
                {courseContent.package ? (
                  <>
                    <span className="lp-dot" />
                    <span>
                      Package: <strong>{courseContent.package.name}</strong>
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="lp-hero-progress">
              <div className="lp-hero-progress-head">
                <span>Course Progress</span>
                <strong>
                  <CountUp value={progressPercentage} suffix="%" />
                </strong>
              </div>
              <div
                className="lp-hero-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progressPercentage)}
              >
                <span style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` }} />
              </div>
              <div className="lp-hero-progress-foot">
                <span>{progress?.completedLessons ?? 0} completed</span>
                <span>{progress?.remainingLessons ?? 0} remaining</span>
              </div>
            </div>
          </section>

          {/* MAIN LMS AREA */}
          <div className="lp-layout">
            {/* LEFT - MODULES / LESSONS */}
            <aside className="lp-side lp-reveal" style={reveal(2)}>
              <div className="lp-side-head">
                <div>
                  <h2>Course Content</h2>
                  <p>Select a lesson to continue learning</p>
                </div>
                {progressLoading ? (
                  <span className="lp-updating">
                    <RefreshCw size={13} className="lp-spin" />
                    Updating
                  </span>
                ) : null}
              </div>

              <div className="lp-side-scroll">
                {courseContent.modules.length === 0 ? (
                  <div className="lp-side-empty">
                    <BookOpen size={22} />
                    <p>No course content available yet.</p>
                  </div>
                ) : (
                  courseContent.modules
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((mod, moduleIndex) => {
                      const open = !collapsed[mod.id];
                      const moduleLessons = mod.lessons
                        .slice()
                        .sort((a, b) => a.sortOrder - b.sortOrder);
                      const doneCount = moduleLessons.filter(
                        (l) => getLessonProgress(l.id)?.status === "COMPLETED"
                      ).length;

                      return (
                        <div key={mod.id} className="lp-module">
                          <button
                            type="button"
                            className="lp-module-head"
                            aria-expanded={open}
                            onClick={() =>
                              setCollapsed((prev) => ({ ...prev, [mod.id]: open }))
                            }
                          >
                            <span className="lp-module-num">{moduleIndex + 1}</span>
                            <span className="lp-min0 lp-grow">
                              <span className="lp-module-title">{mod.title}</span>
                              <span className="lp-module-sub">
                                {doneCount}/{moduleLessons.length} lessons
                              </span>
                            </span>
                            <ChevronDown
                              size={18}
                              className={`lp-chevron${open ? " is-open" : ""}`}
                            />
                          </button>

                          <div className={`lp-collapse${open ? " is-open" : ""}`}>
                            <div className="lp-collapse-inner">
                              {mod.description ? (
                                <p className="lp-module-desc">{mod.description}</p>
                              ) : null}

                              {moduleLessons.length === 0 ? (
                                <p className="lp-no-lessons">No lessons available.</p>
                              ) : (
                                moduleLessons.map((lesson, lessonIndex) => {
                                  const lessonProgress = getLessonProgress(lesson.id);
                                  const isCompleted =
                                    lessonProgress?.status === "COMPLETED";
                                  const isUnlocked = isLessonUnlocked(lesson.id);
                                  const isLocked = !isUnlocked && !isCompleted;
                                  const isSelected = selectedLesson?.id === lesson.id;
                                  const globalIndex = allLessons.findIndex(
                                    (l) => l.id === lesson.id
                                  );
                                  const number =
                                    globalIndex >= 0 ? globalIndex + 1 : lessonIndex + 1;
                                  const expanded = hoverLesson === lesson.id || isSelected;

                                  return (
                                    <button
                                      key={lesson.id}
                                      type="button"
                                      onClick={() => handleSelectLesson(lesson)}
                                      onMouseEnter={() => setHoverLesson(lesson.id)}
                                      onMouseLeave={() => setHoverLesson(null)}
                                      onFocus={() => setHoverLesson(lesson.id)}
                                      onBlur={() => setHoverLesson(null)}
                                      aria-disabled={isLocked}
                                      aria-current={isSelected ? "true" : undefined}
                                      title={
                                        isLocked
                                          ? "Complete the previous lesson to unlock"
                                          : undefined
                                      }
                                      className={`lp-lesson${isSelected ? " is-selected" : ""}${
                                        isCompleted ? " is-done" : ""
                                      }${isLocked ? " is-locked" : ""}${
                                        shakeId === lesson.id ? " is-shake" : ""
                                      }`}
                                    >
                                      <span className="lp-lesson-icon">
                                        {isCompleted ? (
                                          <CheckCircle2 size={17} />
                                        ) : isLocked ? (
                                          <Lock size={14} />
                                        ) : isSelected ? (
                                          <Play size={13} />
                                        ) : (
                                          <span>{number}</span>
                                        )}
                                      </span>

                                      <span className="lp-min0 lp-grow">
                                        <span className="lp-lesson-title">
                                          {lesson.title}
                                        </span>
                                        <span className={`lp-lesson-more${expanded ? " is-open" : ""}`}>
                                          <span className="lp-lesson-more-inner">
                                            {lesson.description ? (
                                              <span className="lp-lesson-desc">
                                                {lesson.description}
                                              </span>
                                            ) : null}
                                            <span className="lp-lesson-tags">
                                              {lesson.videoUrl ? (
                                                <span><Video size={12} /> Video</span>
                                              ) : null}
                                              {lesson.content ? (
                                                <span><BookOpen size={12} /> Reading</span>
                                              ) : null}
                                              {lesson.documentUrl ? (
                                                <span><FileText size={12} /> Document</span>
                                              ) : null}
                                              {lesson.imageUrl ? (
                                                <span><ImageIcon size={12} /> Image</span>
                                              ) : null}
                                              {isLocked ? (
                                                <span className="is-lock">
                                                  <Lock size={12} /> Complete the previous lesson to unlock
                                                </span>
                                              ) : null}
                                            </span>
                                          </span>
                                        </span>
                                        <span
                                          className={`lp-lesson-state ${
                                            isCompleted
                                              ? "is-done"
                                              : isLocked
                                              ? "is-locked"
                                              : lessonProgress?.status === "IN_PROGRESS"
                                              ? "is-active"
                                              : "is-new"
                                          }`}
                                        >
                                          {isCompleted
                                            ? "Completed"
                                            : isLocked
                                            ? "Locked"
                                            : lessonProgress?.status === "IN_PROGRESS"
                                            ? "In Progress"
                                            : "Available"}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </aside>

            {/* RIGHT - LESSON VIEWER */}
            <section className="lp-main lp-reveal" style={reveal(3)} ref={mainRef}>
              {!selectedLesson ? (
                <div className="lp-select">
                  <div className="lp-select-icon">
                    <PlayCircle size={34} />
                  </div>
                  <h2>Select a Lesson</h2>
                  <p>Select a lesson from the course content to start learning.</p>
                </div>
              ) : (
                <div className="lp-lesson-view" key={selectedLesson.id}>
                  {/* LESSON HEADER */}
                  <div className="lp-view-head">
                    <div className="lp-min0">
                      <p className="lp-eyebrow">
                        Lesson {currentLessonIndex >= 0 ? currentLessonIndex + 1 : ""}
                        {allLessons.length > 0 ? ` of ${allLessons.length}` : ""}
                      </p>
                      <h2>{selectedLesson.title}</h2>
                      {selectedLesson.description ? (
                        <p className="lp-view-desc">{selectedLesson.description}</p>
                      ) : null}
                    </div>

                    <div className="lp-view-status">
                      {lessonCompleted ? (
                        <span className="lp-pill lp-pill-done">
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      ) : currentLessonProgress?.status === "IN_PROGRESS" ? (
                        <span className="lp-pill lp-pill-active">
                          <i /> In Progress
                        </span>
                      ) : (
                        <span className="lp-pill">Not Started</span>
                      )}
                    </div>
                  </div>

                  {/* LESSON CONTENT */}
                  <div className="lp-view-body">
                    {selectedLesson.imageUrl ? (
                      <div className="lp-image">
                        <img
                          src={getMediaUrl(selectedLesson.imageUrl)}
                          alt={selectedLesson.title}
                        />
                      </div>
                    ) : null}

                    {startingLesson ? (
                      <div className="lp-starting">
                        <RefreshCw size={15} className="lp-spin" />
                        Starting lesson...
                      </div>
                    ) : null}

                    {/* VIDEO */}
                    {selectedLesson.videoUrl ? (
                      <div className="lp-video-wrap">
                        <div className="lp-video">
                          <video
                            src={getMediaUrl(selectedLesson.videoUrl)}
                            title={selectedLesson.title}
                            controls
                            controlsList="nodownload"
                            playsInline
                            preload="metadata"
                            onLoadedMetadata={handleVideoLoadedMetadata}
                            onTimeUpdate={handleVideoTimeUpdate}
                            onSeeking={handleVideoSeeking}
                            onEnded={handleVideoEnded}
                            onKeyDown={handleVideoKeyDown}
                            onPause={(event) =>
                              saveVideoWatchProgress(event.currentTarget.currentTime)
                            }
                          >
                            Your browser does not support video playback.
                          </video>
                        </div>

                        <div className={`lp-video-bar${videoWatchedOnce ? " is-done" : ""}`}>
                          {videoWatchedOnce ? (
                            <>
                              <CheckCircle2 size={16} />
                              <span>Video completed. You can skip around freely.</span>
                            </>
                          ) : (
                            <>
                              <Lock size={15} />
                              <span>
                                Watch the full video to unlock completion. Skipping ahead is
                                disabled.
                              </span>
                              <b>{watchPercent}%</b>
                            </>
                          )}
                          <i className="lp-video-track">
                            <u style={{ width: `${videoWatchedOnce ? 100 : watchPercent}%` }} />
                          </i>
                        </div>
                      </div>
                    ) : null}

                    {/* TEXT CONTENT */}
                    {selectedLesson.content ? (
                      <div className="lp-content">
                        <h3>Lesson Content</h3>
                        <div className="lp-content-text">{selectedLesson.content}</div>
                      </div>
                    ) : !selectedLesson.videoUrl ? (
                      <div className="lp-content lp-content-empty">
                        <FileText size={22} />
                        <p>No lesson content has been added yet.</p>
                      </div>
                    ) : null}

                    {/* DOCUMENT */}
                    {selectedLesson.documentUrl ? (
                      <div className="lp-doc">
                        <div className="lp-doc-icon">
                          <FileText size={20} />
                        </div>
                        <div className="lp-min0 lp-grow">
                          <h3>Lesson Document</h3>
                          <p>Open the supporting document for this lesson.</p>
                        </div>
                        <a
                          href={getMediaUrl(selectedLesson.documentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lp-btn lp-btn-secondary"
                        >
                          Open Document
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    ) : null}

                    {/* LESSON NAVIGATION */}
                    <div className="lp-nav">
                      <button
                        type="button"
                        onClick={handlePreviousLesson}
                        disabled={!previousLesson || startingLesson}
                        className="lp-btn lp-btn-secondary"
                      >
                        <ArrowLeft size={15} />
                        Previous
                      </button>

                      {nextLesson ? (
                        <button
                          type="button"
                          onClick={handleNextLesson}
                          disabled={startingLesson || currentLessonProgress?.status !== "COMPLETED"}
                          className="lp-btn lp-btn-secondary"
                        >
                          Next
                          <ArrowRight size={15} />
                        </button>
                      ) : null}
                    </div>

                    {/* COMPLETION AREA */}
                    {lessonCompleted ? (
                      <div className="lp-done">
                        <div className="lp-done-head">
                          <div>
                            <p className="lp-done-title">Lesson completed</p>
                            <p className="lp-done-sub">
                              You have successfully completed this lesson. The next lesson is
                              now unlocked.
                            </p>
                          </div>
                          <div className="lp-done-check">
                            <CheckCircle2 size={22} />
                          </div>
                        </div>

                        {nextLesson ? (
                          <div className="lp-done-next">
                            <div className="lp-min0">
                              <p className="lp-done-label">Next Lesson — Unlocked</p>
                              <p className="lp-done-name">{nextLesson.title}</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleNextLesson}
                              disabled={startingLesson}
                              className="lp-btn lp-btn-primary"
                            >
                              {startingLesson ? "Opening..." : "Continue"}
                              <ArrowRight size={15} />
                            </button>
                          </div>
                        ) : (
                          <div className="lp-done-next lp-done-course">
                            <div className="lp-min0">
                              <p className="lp-done-name">
                                <Award size={16} /> Course Completed
                              </p>
                              <p className="lp-done-sub">
                                You have completed all available lessons in this course.
                              </p>
                            </div>
                            {courseCertificateUrl ? (
                              <a
                                href={getMediaUrl(courseCertificateUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="lp-btn lp-btn-primary"
                              >
                                View Certificate
                                <ExternalLink size={14} />
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={loadCourseCertificate}
                                className="lp-btn lp-btn-primary"
                              >
                                View Certificate
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="lp-finish">
                        <div className="lp-min0">
                          <p className="lp-finish-title">Finished this lesson?</p>
                          <p className="lp-finish-sub">
                            Mark it as complete to update your course progress.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={completeLesson}
                          disabled={completingLesson || videoLocked}
                          className="lp-btn lp-btn-primary"
                        >
                          {completingLesson ? (
                            <>
                              <RefreshCw size={15} className="lp-spin" />
                              Completing...
                            </>
                          ) : videoLocked ? (
                            <>
                              <Lock size={15} />
                              Watch video till the end
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} />
                              Mark as Complete
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* PROGRESS SUMMARY (hover to preview, click to pin) */}
          {progress ? (
            <div
              className="lp-stat-zone"
              onMouseLeave={() => setHoverStat(null)}
            >
              <div className="lp-stats">
                <StatTile index={4} label="Total Lessons" value={progress.totalLessons} tone="navy"
                  active={shownStat === "total"} pinned={pinnedStat === "total"}
                  onEnter={() => setHoverStat("total")} onToggle={() => togglePinStat("total")} />
                <StatTile index={5} label="Completed" value={progress.completedLessons} tone="green"
                  active={shownStat === "completed"} pinned={pinnedStat === "completed"}
                  onEnter={() => setHoverStat("completed")} onToggle={() => togglePinStat("completed")} />
                <StatTile index={6} label="Started" value={progress.startedLessons} tone="blue"
                  active={shownStat === "started"} pinned={pinnedStat === "started"}
                  onEnter={() => setHoverStat("started")} onToggle={() => togglePinStat("started")} />
                <StatTile index={7} label="Remaining" value={progress.remainingLessons} tone="orange"
                  active={shownStat === "remaining"} pinned={pinnedStat === "remaining"}
                  onEnter={() => setHoverStat("remaining")} onToggle={() => togglePinStat("remaining")} />
              </div>

              <div className={`lp-detail${shownStat ? " is-open" : ""}`}>
                <div className="lp-detail-inner">
                  <div className="lp-detail-card" key={lastStat}>
                    <div className="lp-detail-head">
                      <div className="lp-min0">
                        <h3>{statMeta[lastStat].title}</h3>
                        <p>{statMeta[lastStat].subtitle}</p>
                      </div>
                      {pinnedStat === lastStat ? (
                        <button
                          type="button"
                          className="lp-pinchip"
                          onClick={() => setPinnedStat(null)}
                          aria-label="Close details"
                        >
                          Pinned <X size={13} />
                        </button>
                      ) : (
                        <span className="lp-detail-hint">Click the card to keep this open</span>
                      )}
                    </div>

                    {statLessons.length === 0 ? (
                      <p className="lp-detail-empty">No lessons in this group yet.</p>
                    ) : (
                      <div className="lp-srows">
                        {statLessons.map((lesson) => {
                          const lp = getLessonProgress(lesson.id);
                          const done = lp?.status === "COMPLETED";
                          const locked = !isLessonUnlocked(lesson.id) && !done;
                          const number = allLessons.findIndex((l) => l.id === lesson.id) + 1;

                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              className={`lp-srow${locked ? " is-locked" : ""}`}
                              onClick={() => goToLesson(lesson)}
                            >
                              <span className={`lp-srow-num${done ? " is-done" : ""}`}>
                                {done ? <CheckCircle2 size={15} /> : locked ? <Lock size={13} /> : number}
                              </span>
                              <span className="lp-min0 lp-grow">
                                <span className="lp-srow-title">{lesson.title}</span>
                                <span
                                  className={`lp-lesson-state ${
                                    done ? "is-done" : locked ? "is-locked" : lp?.status === "IN_PROGRESS" ? "is-active" : "is-new"
                                  }`}
                                >
                                  {done ? "Completed" : locked ? "Locked" : lp?.status === "IN_PROGRESS" ? "In Progress" : "Available"}
                                </span>
                              </span>
                              <ArrowRight size={15} className="lp-srow-arrow" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <LessonStyles />
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
      const p = Math.min((now - start) / 800, 1);
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

function StatTile({
  index,
  label,
  value,
  tone,
  active,
  pinned,
  onEnter,
  onToggle,
}: {
  index: number;
  label: string;
  value: number;
  tone: "navy" | "green" | "blue" | "orange";
  active: boolean;
  pinned: boolean;
  onEnter: () => void;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`lp-stat lp-stat-${tone} lp-reveal${active ? " is-active" : ""}${pinned ? " is-pinned" : ""}`}
      style={reveal(index)}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onClick={onToggle}
      aria-pressed={pinned}
    >
      <span className="lp-stat-text">
        <span className="lp-stat-label">{label}</span>
        <strong>
          <CountUp value={value} />
        </strong>
      </span>
      <ChevronDown size={17} className="lp-stat-caret" />
    </button>
  );
}

function LessonStyles() {
  return <style dangerouslySetInnerHTML={{ __html: lessonCss }} />;
}

const lessonCss = `
.lp-page{
  --navy:#0F2F5F; --navy-2:#123B6D; --blue:#1459B8; --blue-2:#2563EB;
  --orange:#FF6B00; --orange-2:#E85F00; --orange-tint:#FFF3EA;
  --bg:#F7F9FC; --card:#fff; --line:#E2E8F1; --line-2:#EDF1F7;
  --muted:#64748B; --soft:#8A97AB;
  --green:#15803D; --green-tint:#E8F6EE; --blue-tint:#EAF1FD;
  --ease:cubic-bezier(.2,.7,.2,1);
  flex:1;min-width:0;width:100%;box-sizing:border-box;
  padding:20px 28px 40px;background:var(--bg);color:var(--navy);
}
.lp-page *{box-sizing:border-box}
.lp-container{width:100%;max-width:1360px;margin:0 auto}
.lp-min0{min-width:0}
.lp-grow{flex:1}
.lp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

@keyframes lp-rise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@keyframes lp-lesson-in{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes lp-grow-x{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes lp-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes lp-spin{to{transform:rotate(360deg)}}
@keyframes lp-flow{0%{background-position:0% 50%}100%{background-position:100% 50%}}
@keyframes lp-sheen{from{transform:translateX(-120%) skewX(-18deg)}to{transform:translateX(260%) skewX(-18deg)}}
@keyframes lp-toast-in{from{opacity:0;transform:translateX(24px) scale(.97)}to{opacity:1;transform:none}}
@keyframes lp-timer{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes lp-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes lp-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes lp-pulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.6)}70%{box-shadow:0 0 0 7px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
.lp-spin{animation:lp-spin .8s linear infinite}
.lp-reveal{animation:lp-rise 520ms var(--ease) both;animation-delay:calc(var(--i,0) * 70ms)}

/* Buttons */
.lp-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 18px;border-radius:10px;border:1px solid transparent;font:inherit;font-size:14px;font-weight:600;line-height:1;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .2s ease,border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease),color .2s ease,opacity .2s ease}
.lp-btn:focus-visible,.lp-lesson:focus-visible,.lp-module-head:focus-visible,.lp-back:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.lp-btn:active:not(:disabled){transform:scale(.98)}
.lp-btn:disabled{opacity:.5;cursor:not-allowed}
.lp-btn-primary{background:linear-gradient(180deg,#FF8A12 0%,#FF6B00 55%,#F25A00 100%);color:#fff}
.lp-btn-primary::after{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);transform:translateX(-120%) skewX(-18deg);pointer-events:none}
.lp-btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 22px rgba(255,107,0,.35)}
.lp-btn-primary:hover:not(:disabled)::after{animation:lp-sheen 700ms ease}
.lp-btn-primary:disabled{background:#CBD5E4;color:#fff;box-shadow:none}
.lp-btn-secondary{background:#fff;color:var(--blue);border-color:var(--line)}
.lp-btn-secondary:hover:not(:disabled){background:var(--blue-tint);border-color:#BFD3F2;transform:translateY(-2px);box-shadow:0 6px 14px rgba(20,89,184,.12)}

.lp-back{display:inline-flex;align-items:center;gap:8px;margin-bottom:14px;padding:8px 14px 8px 10px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--blue);font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;transition:transform .2s var(--ease),background .2s ease,border-color .2s ease}
.lp-back:hover{background:var(--blue-tint);border-color:#BFD3F2;transform:translateX(-3px)}

/* Toasts */
.lp-toasts{position:fixed;top:18px;right:18px;z-index:80;display:flex;flex-direction:column;gap:10px;width:min(380px,calc(100vw - 36px));pointer-events:none}
.lp-toast{position:relative;overflow:hidden;pointer-events:auto;display:flex;align-items:flex-start;gap:10px;padding:14px 12px 14px 14px;border-radius:12px;border:1px solid;background:#fff;box-shadow:0 12px 30px rgba(15,47,95,.18);font-size:14px;line-height:1.45;animation:lp-toast-in 320ms var(--ease) both}
.lp-toast span{flex:1;min-width:0}
.lp-toast svg{flex:0 0 auto;margin-top:1px}
.lp-toast button{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:0;border-radius:8px;background:transparent;color:inherit;opacity:.7;cursor:pointer;transition:background .2s ease,opacity .2s ease}
.lp-toast button:hover{opacity:1;background:rgba(15,47,95,.08)}
.lp-toast-error{border-color:#F3C9C9;color:#9B1C1C;background:#FFF8F8}
.lp-toast-ok{border-color:#BFE6CD;color:#166534;background:#F5FCF8}
.lp-toast-timer{position:absolute;left:0;bottom:0;width:100%;height:3px;background:currentColor;opacity:.35;transform-origin:left;animation:lp-timer 6s linear forwards}
.lp-toast-ok .lp-toast-timer{animation-duration:4.5s}

/* Hero */
.lp-hero{position:relative;overflow:hidden;display:grid;grid-template-columns:auto minmax(0,1fr) 300px;align-items:center;gap:24px;margin-bottom:20px;padding:22px 26px;border-radius:16px;color:#fff;background:linear-gradient(120deg,#0F2F5F 0%,#123B6D 35%,#1459B8 70%,#0F2F5F 100%);background-size:220% 220%;animation:lp-rise 520ms var(--ease) both,lp-flow 14s ease-in-out infinite alternate;animation-delay:70ms,0s;box-shadow:0 12px 30px rgba(15,47,95,.18)}
.lp-hero::after{content:"";position:absolute;left:0;bottom:0;width:100%;height:3px;background:linear-gradient(90deg,var(--orange) 0%,var(--orange) 16%,transparent 16%)}
.lp-hero>*{position:relative;z-index:1}
.lp-hero-img{width:208px;height:124px;overflow:hidden;border-radius:14px;border:2px solid rgba(255,255,255,.3);background:rgba(255,255,255,.12);box-shadow:0 8px 20px rgba(0,0,0,.22)}
.lp-hero-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s var(--ease)}
.lp-hero:hover .lp-hero-img img{transform:scale(1.06)}
.lp-hero-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:700;letter-spacing:.1em;color:rgba(255,255,255,.7)}
.lp-badges{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.lp-badge{display:inline-flex;align-items:center;gap:6px;padding:3px 11px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);font-size:12px;font-weight:600;color:#fff}
.lp-badge i{width:7px;height:7px;border-radius:50%;background:#4ADE80;animation:lp-pulse 2s infinite}
.lp-hero h1{margin:0;font-size:clamp(23px,2.4vw,30px);line-height:1.2;font-weight:700;letter-spacing:-.02em;color:#fff}
.lp-hero p{max-width:620px;margin:8px 0 0;font-size:14px;line-height:1.6;color:#D3E1F5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lp-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin-top:12px;font-size:13px;color:#D3E1F5}
.lp-meta strong{color:#fff;font-weight:600}
.lp-dot{width:4px;height:4px;border-radius:50%;background:#8FB0DE}
.lp-hero-progress{padding:16px;border-radius:14px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}
.lp-hero-progress-head{display:flex;align-items:baseline;justify-content:space-between;font-size:13px;color:#C9DBF5}
.lp-hero-progress-head strong{font-size:28px;line-height:1;font-weight:700;color:#fff;font-variant-numeric:tabular-nums}
.lp-hero-track{height:8px;overflow:hidden;margin-top:12px;border-radius:999px;background:rgba(255,255,255,.2)}
.lp-hero-track span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#fff,#CFE0FA);transform-origin:left;animation:lp-grow-x 1000ms var(--ease) 300ms both}
.lp-hero-progress-foot{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#B7C9E4}

/* Layout */
.lp-layout{display:grid;grid-template-columns:380px minmax(0,1fr);gap:20px;align-items:start}

/* Sidebar */
.lp-side{min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:0 1px 2px rgba(15,47,95,.04),0 4px 14px rgba(15,47,95,.03)}
.lp-side-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:18px 20px;border-bottom:1px solid var(--line-2)}
.lp-side-head h2{margin:0;font-size:17px;font-weight:700;color:var(--navy)}
.lp-side-head p{margin:3px 0 0;font-size:12.5px;color:var(--muted)}
.lp-updating{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--blue)}
.lp-side-scroll{max-height:700px;overflow-y:auto;padding:10px}
.lp-side-scroll::-webkit-scrollbar{width:8px}
.lp-side-scroll::-webkit-scrollbar-thumb{background:#D5DEEC;border-radius:8px}
.lp-side-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px 16px;color:var(--blue);text-align:center}
.lp-side-empty p{margin:0;font-size:14px;color:var(--muted)}
.lp-module{margin-bottom:8px;border:1px solid var(--line-2);border-radius:12px;background:#fff;overflow:hidden}
.lp-module:last-child{margin-bottom:0}
.lp-module-head{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border:0;background:#F8FAFD;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:background .2s ease}
.lp-module-head:hover{background:var(--blue-tint)}
.lp-module-num{width:30px;height:30px;flex:0 0 30px;display:flex;align-items:center;justify-content:center;border-radius:9px;background:var(--navy);color:#fff;font-size:13px;font-weight:700}
.lp-module-title{display:block;font-size:14.5px;font-weight:600;color:var(--navy)}
.lp-module-sub{display:block;margin-top:2px;font-size:12px;color:var(--muted)}
.lp-chevron{flex:0 0 auto;color:var(--muted);transition:transform .3s var(--ease)}
.lp-chevron.is-open{transform:rotate(180deg)}
.lp-collapse{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s var(--ease)}
.lp-collapse.is-open{grid-template-rows:1fr}
.lp-collapse-inner{min-height:0;overflow:hidden}
.lp-collapse.is-open .lp-collapse-inner{padding:8px}
.lp-module-desc{margin:0 4px 8px;font-size:12.5px;line-height:1.5;color:var(--muted)}
.lp-no-lessons{margin:0;padding:8px;font-size:12.5px;color:var(--soft)}

.lp-lesson{position:relative;display:flex;align-items:flex-start;gap:12px;width:100%;margin-bottom:6px;padding:12px;border:1px solid transparent;border-radius:11px;background:transparent;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:background .2s ease,border-color .2s ease,transform .2s var(--ease),box-shadow .2s ease}
.lp-lesson:last-child{margin-bottom:0}
.lp-lesson::before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:3px;background:var(--orange);transform:scaleY(0);transition:transform .25s var(--ease)}
.lp-lesson:hover:not(.is-locked){background:#F5F8FD;border-color:var(--line);transform:translateX(3px)}
.lp-lesson.is-selected{background:var(--blue-tint);border-color:#BFD3F2}
.lp-lesson.is-selected::before{transform:scaleY(1)}
.lp-lesson.is-locked{cursor:not-allowed;opacity:.65}
.lp-lesson.is-shake{animation:lp-shake .45s ease}
.lp-lesson-icon{width:30px;height:30px;flex:0 0 30px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#EDF1F7;color:var(--muted);font-size:12.5px;font-weight:700;transition:transform .25s var(--ease),background .2s ease}
.lp-lesson:hover:not(.is-locked) .lp-lesson-icon{transform:scale(1.1)}
.lp-lesson.is-done .lp-lesson-icon{background:var(--green-tint);color:var(--green)}
.lp-lesson.is-selected .lp-lesson-icon{background:var(--blue);color:#fff}
.lp-lesson-title{display:block;font-size:14px;font-weight:600;line-height:1.35;color:var(--navy)}
.lp-lesson.is-selected .lp-lesson-title{color:var(--blue)}

.lp-lesson-state{display:inline-block;margin-top:6px;font-size:12px;font-weight:600}
.lp-lesson-state.is-done{color:var(--green)}
.lp-lesson-state.is-locked{color:var(--soft)}
.lp-lesson-state.is-active{color:var(--blue)}
.lp-lesson-state.is-new{color:var(--orange-2)}

/* Main viewer */
.lp-main{min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:0 1px 2px rgba(15,47,95,.04),0 4px 14px rgba(15,47,95,.03)}
.lp-select{min-height:520px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center}
.lp-select-icon{width:72px;height:72px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;border-radius:50%;background:var(--blue-tint);color:var(--blue);animation:lp-pop 500ms var(--ease) both}
.lp-select h2{margin:0;font-size:20px;font-weight:700;color:var(--navy)}
.lp-select p{max-width:380px;margin:8px 0 0;font-size:14px;line-height:1.6;color:var(--muted)}
.lp-lesson-view{animation:lp-lesson-in 420ms var(--ease) both}
.lp-view-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 26px;border-bottom:1px solid var(--line-2)}
.lp-eyebrow{margin:0;font-size:13px;font-weight:600;color:var(--orange)}
.lp-view-head h2{margin:4px 0 0;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-.01em;color:var(--navy)}
.lp-view-desc{margin:8px 0 0;font-size:14px;line-height:1.6;color:var(--muted)}
.lp-view-status{flex:0 0 auto}
.lp-pill{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;background:#EDF1F7;color:var(--muted);font-size:12.5px;font-weight:600;white-space:nowrap}
.lp-pill-done{background:var(--green-tint);color:var(--green);animation:lp-pop 400ms var(--ease) both}
.lp-pill-active{background:var(--blue-tint);color:var(--blue)}
.lp-pill-active i{width:7px;height:7px;border-radius:50%;background:var(--blue);animation:lp-pulse 2s infinite}
.lp-view-body{padding:24px 26px 26px}
.lp-image{margin-bottom:20px;overflow:hidden;border:1px solid var(--line);border-radius:14px;background:#F8FAFD}
.lp-image img{display:block;width:100%;max-height:420px;object-fit:contain}
.lp-starting{display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:12px 14px;border-radius:10px;background:var(--blue-tint);color:var(--blue);font-size:14px;animation:lp-rise 300ms var(--ease) both}

.lp-video-wrap{margin-bottom:20px;overflow:hidden;border-radius:14px;background:#0A1B36;box-shadow:0 12px 28px rgba(15,47,95,.2)}
.lp-video{aspect-ratio:16/9;background:#000}
.lp-video video{display:block;width:100%;height:100%}
.lp-video-bar{position:relative;display:flex;align-items:center;gap:10px;padding:12px 16px 14px;background:#0F2F5F;color:#D3E1F5;font-size:13px}
.lp-video-bar span{flex:1;min-width:0}
.lp-video-bar b{color:#fff;font-variant-numeric:tabular-nums}
.lp-video-bar svg{flex:0 0 auto;color:#FFA24D}
.lp-video-bar.is-done svg{color:#4ADE80}
.lp-video-track{position:absolute;left:0;bottom:0;width:100%;height:4px;background:rgba(255,255,255,.14)}
.lp-video-track u{display:block;height:100%;background:linear-gradient(90deg,var(--orange),#FFA24D);transition:width .5s ease;text-decoration:none}
.lp-video-bar.is-done .lp-video-track u{background:#4ADE80}

.lp-content{padding:20px;border:1px solid var(--line);border-radius:14px;background:#F8FAFD}
.lp-content h3{margin:0 0 10px;font-size:15px;font-weight:700;color:var(--navy)}
.lp-content-text{white-space:pre-wrap;font-size:15px;line-height:1.8;color:#334155}
.lp-content-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:30px;color:var(--blue);text-align:center}
.lp-content-empty p{margin:0;font-size:14px;color:var(--muted)}
.lp-doc{display:flex;align-items:center;gap:14px;margin-top:16px;padding:16px;border:1px solid var(--line);border-radius:14px;transition:border-color .2s ease,box-shadow .2s ease}
.lp-doc:hover{border-color:#9DBBEA;box-shadow:0 8px 20px rgba(15,47,95,.08)}
.lp-doc-icon{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:var(--blue-tint);color:var(--blue)}
.lp-doc h3{margin:0;font-size:14.5px;font-weight:600;color:var(--navy)}
.lp-doc p{margin:3px 0 0;font-size:13px;color:var(--muted)}

.lp-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:24px;padding-top:20px;border-top:1px solid var(--line-2)}
.lp-nav .lp-btn:only-child{margin-left:0}

.lp-finish{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:18px;padding:18px;border:1px solid var(--line);border-radius:14px;background:#FBFCFE}
.lp-finish-title{margin:0;font-size:15px;font-weight:600;color:var(--navy)}
.lp-finish-sub{margin:4px 0 0;font-size:13px;color:var(--muted)}
.lp-done{margin-top:18px;padding:18px;border:1px solid #BFE6CD;border-radius:14px;background:linear-gradient(135deg,#F5FCF8,#EAF8F0);animation:lp-rise 420ms var(--ease) both}
.lp-done-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.lp-done-title{margin:0;font-size:16px;font-weight:700;color:#166534}
.lp-done-sub{margin:4px 0 0;font-size:13px;line-height:1.5;color:#2F7A4B}
.lp-done-check{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#D5F0E0;color:var(--green);animation:lp-pop 500ms var(--ease) 150ms both}
.lp-done-next{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-top:16px;padding-top:16px;border-top:1px solid #BFE6CD}
.lp-done-label{margin:0;font-size:12.5px;font-weight:600;color:var(--green)}
.lp-done-name{display:flex;align-items:center;gap:8px;margin:3px 0 0;font-size:15px;font-weight:600;color:var(--navy)}

/* Lesson hover expand */
.lp-lesson-more{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s var(--ease)}
.lp-lesson-more.is-open{grid-template-rows:1fr}
.lp-lesson-more-inner{display:block;min-height:0;overflow:hidden}
.lp-lesson-desc{display:block;margin-top:4px;font-size:12.5px;line-height:1.5;color:var(--muted)}
.lp-lesson-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.lp-lesson-tags span{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:11.5px;font-weight:600;color:var(--blue)}
.lp-lesson-tags .is-lock{color:var(--orange-2);background:var(--orange-tint);border-color:#FFD9BD}

/* Stats: hover to preview, click to pin */
@keyframes lp-swap{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.lp-stat-zone{margin-top:20px}
.lp-stat-zone .lp-stats{margin-top:0}
button.lp-stat{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;text-align:left;font:inherit;color:inherit;cursor:pointer}
button.lp-stat:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.3)}
.lp-stat-text{display:block}
.lp-stat-label{display:block;font-size:13px;color:var(--muted)}
.lp-stat.is-active{transform:translateY(-4px);border-color:var(--blue-2);box-shadow:0 0 0 3px rgba(37,99,235,.14),0 14px 28px rgba(15,47,95,.1)}
.lp-stat-caret{flex:0 0 auto;color:var(--soft);transition:transform .3s var(--ease),color .2s ease}
.lp-stat.is-active .lp-stat-caret{transform:rotate(180deg);color:var(--orange)}
.lp-detail{display:grid;grid-template-rows:0fr;margin-top:0;transition:grid-template-rows .4s var(--ease),margin-top .4s var(--ease)}
.lp-detail.is-open{grid-template-rows:1fr;margin-top:14px}
.lp-detail-inner{min-height:0;overflow:hidden;padding:0 2px}
.lp-detail-card{padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:0 10px 26px rgba(15,47,95,.08);animation:lp-swap .35s var(--ease) both}
.lp-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.lp-detail-head h3{margin:0;font-size:17px;font-weight:700;color:var(--navy)}
.lp-detail-head p{margin:2px 0 0;font-size:13px;color:var(--muted)}
.lp-detail-hint{flex:0 0 auto;padding:5px 10px;border-radius:999px;background:var(--blue-tint);color:var(--blue);font-size:12px;font-weight:600}
.lp-pinchip{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px 0 12px;border:0;border-radius:999px;background:var(--orange-tint);color:var(--orange-2);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:background .2s ease,transform .2s var(--ease)}
.lp-pinchip:hover{background:#FFE3CD;transform:translateY(-1px)}
.lp-detail-empty{margin:0;font-size:13px;color:var(--muted)}
.lp-srows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.lp-srow{display:flex;align-items:center;gap:12px;width:100%;min-width:0;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:#fff;text-align:left;font:inherit;color:inherit;cursor:pointer;animation:lp-swap .35s var(--ease) both;transition:border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease)}
.lp-srow:nth-child(2){animation-delay:40ms}.lp-srow:nth-child(3){animation-delay:80ms}.lp-srow:nth-child(4){animation-delay:120ms}.lp-srow:nth-child(5){animation-delay:160ms}.lp-srow:nth-child(6){animation-delay:200ms}
.lp-srow:hover:not(.is-locked){border-color:#9DBBEA;box-shadow:0 8px 18px rgba(15,47,95,.1);transform:translateX(4px)}
.lp-srow.is-locked{opacity:.65}
.lp-srow-num{width:30px;height:30px;flex:0 0 30px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#EDF1F7;color:var(--muted);font-size:12.5px;font-weight:700}
.lp-srow-num.is-done{background:var(--green-tint);color:var(--green)}
.lp-srow-title{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;color:var(--navy)}
.lp-srow-arrow{flex:0 0 auto;color:#A3B0C4;transition:transform .25s var(--ease),color .2s ease}
.lp-srow:hover:not(.is-locked) .lp-srow-arrow{transform:translateX(4px);color:var(--orange)}
@media (max-width:820px){.lp-srows{grid-template-columns:minmax(0,1fr)}.lp-detail-hint{display:none}}
@media (prefers-reduced-motion:reduce){.lp-detail,.lp-lesson-more{transition:none}.lp-detail-card,.lp-srow{animation:none!important}}

/* Stats */
.lp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:20px}
.lp-stat{padding:18px 20px;border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:0 1px 2px rgba(15,47,95,.04);transition:transform .25s var(--ease),box-shadow .25s ease,border-color .25s ease}
.lp-stat:hover{transform:translateY(-4px);box-shadow:0 14px 28px rgba(15,47,95,.12);border-color:#C9D8EE}
.lp-stat p{margin:0;font-size:13px;color:var(--muted)}
.lp-stat strong{display:block;margin-top:6px;font-size:28px;line-height:1.1;font-weight:700;font-variant-numeric:tabular-nums}
.lp-stat-navy strong{color:var(--navy)}
.lp-stat-green strong{color:var(--green)}
.lp-stat-blue strong{color:var(--blue)}
.lp-stat-orange strong{color:var(--orange)}

/* Error / skeleton */
.lp-error{min-height:380px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;border:1px solid #F3D1D1;border-radius:16px;background:#fff;text-align:center;animation:lp-rise 420ms var(--ease) both}
.lp-error-icon{width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:#FDECEC;color:#C62828}
.lp-error h2{margin:16px 0 0;font-size:18px;font-weight:700;color:var(--navy)}
.lp-error p{max-width:480px;margin:8px 0 20px;font-size:14px;line-height:1.6;color:var(--muted)}
.lp-error-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
.lp-skel{border-radius:16px;background:linear-gradient(90deg,#E9EEF6 25%,#F6F8FC 37%,#E9EEF6 63%);background-size:1200px 100%;animation:lp-shimmer 1.4s linear infinite}
.lp-skel-hero{height:170px;margin-bottom:20px}
.lp-skel-side{height:520px}
.lp-skel-main{height:520px}

/* Responsive */
@media (max-width:1180px){
  .lp-hero{grid-template-columns:auto minmax(0,1fr)}
  .lp-hero-progress{grid-column:1 / -1}
  .lp-layout{grid-template-columns:320px minmax(0,1fr)}
}
@media (max-width:980px){
  .lp-layout{grid-template-columns:minmax(0,1fr)}
  .lp-side-scroll{max-height:420px}
  .lp-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:760px){
  .lp-page{padding:16px 14px 28px}
  .lp-hero{grid-template-columns:minmax(0,1fr);padding:18px}
  .lp-hero-img{width:100%;height:150px}
  .lp-view-head{flex-direction:column;padding:18px}
  .lp-view-body{padding:18px}
  .lp-view-head h2{font-size:21px}
  .lp-finish,.lp-done-next,.lp-doc{flex-direction:column;align-items:stretch}
  .lp-finish .lp-btn,.lp-done-next .lp-btn,.lp-doc .lp-btn{width:100%}
  .lp-btn{height:44px}
  .lp-nav .lp-btn{flex:1}
  .lp-toasts{top:10px;right:10px}
}
@media (max-width:480px){
  .lp-stats{grid-template-columns:minmax(0,1fr)}
}
@media (prefers-reduced-motion:reduce){
  .lp-reveal,.lp-hero,.lp-lesson-view,.lp-hero-track span,.lp-skel,.lp-select-icon,.lp-done,.lp-done-check,.lp-pill-done,.lp-toast,.lp-toast-timer,.lp-badge i,.lp-pill-active i{animation:none!important}
  .lp-btn,.lp-lesson,.lp-stat,.lp-collapse,.lp-chevron,.lp-hero-img img{transition:none!important}
}
`;
