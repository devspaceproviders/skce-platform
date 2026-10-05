"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Trainer = {
  id: number;
  profileId?: number;
  name: string;
  email: string;
  specialization?: string | null;
  status?: string;
};

type Course = {
  id: number;
  title: string;
  mode?: string | null;
  duration?: string | null;
  isActive?: boolean;
};

type Permission = {
  id: number;
  trainerId: number;
  courseId: number;
  canTeach: boolean;
  canManageContent: boolean;
  canCreateAssessments: boolean;
};

type PermissionsForm = {
  canTeach: boolean;
  canManageContent: boolean;
  canCreateAssessments: boolean;
};

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type Availability = {
  id: number;
  trainerId: number;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  timezone: string;
  isActive: boolean;
};

type AvailabilityForm = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone: string;
  isActive: boolean;
};

const DEFAULT_PERMISSIONS: PermissionsForm = {
  canTeach: true,
  canManageContent: false,
  canCreateAssessments: false,
};

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: "MONDAY", label: "Monday", short: "Mon" },
  { key: "TUESDAY", label: "Tuesday", short: "Tue" },
  { key: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { key: "THURSDAY", label: "Thursday", short: "Thu" },
  { key: "FRIDAY", label: "Friday", short: "Fri" },
  { key: "SATURDAY", label: "Saturday", short: "Sat" },
  { key: "SUNDAY", label: "Sunday", short: "Sun" },
];

const DEFAULT_AVAILABILITY: AvailabilityForm = {
  dayOfWeek: "MONDAY",
  startTime: "09:00",
  endTime: "17:00",
  timezone: "Asia/Kolkata",
  isActive: true,
};

function getTrainerId(trainer: Trainer): number {
  return trainer.profileId ?? trainer.id;
}

function minuteToTime(value: number): string {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function timeToMinute(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(value: number): string {
  const totalMinutes = value % (24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

function TrainerPermissionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [trainerId, setTrainerId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [activeTab, setActiveTab] = useState<"permissions" | "availability">(
    "permissions"
  );

  const [permissions, setPermissions] =
    useState<PermissionsForm>(DEFAULT_PERMISSIONS);
  const [existingPermission, setExistingPermission] =
    useState<Permission | null>(null);
  const [assignedPermissions, setAssignedPermissions] = useState<Permission[]>([]);

  const [availability, setAvailability] = useState<Availability[]>([]);
  const [availabilityForm, setAvailabilityForm] =
    useState<AvailabilityForm>(DEFAULT_AVAILABILITY);
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<number | null>(
    null
  );
  const [availabilitySearch, setAvailabilitySearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingPermission, setLoadingPermission] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [deletingAvailabilityId, setDeletingAvailabilityId] = useState<number | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const queryTrainerId = searchParams.get("trainerId");
    if (queryTrainerId) setTrainerId(queryTrainerId);
  }, [searchParams]);

  const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      throw new Error("Authentication required");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      router.push("/admin/login");
      throw new Error("Unauthorized");
    }

    return response;
  };

  const handleError = (err: unknown) => {
    if (
      err instanceof Error &&
      err.message !== "Unauthorized" &&
      err.message !== "Authentication required"
    ) {
      setError(err.message);
    }
  };

  const loadBaseData = async () => {
    try {
      setLoading(true);
      setError("");

      const [trainerResponse, courseResponse] = await Promise.all([
        authenticatedFetch(`${API_URL}/admin/trainers`),
        authenticatedFetch(`${API_URL}/admin/courses`),
      ]);

      const trainerJson = await trainerResponse.json();
      const courseJson = await courseResponse.json();

      if (!trainerResponse.ok) {
        throw new Error(trainerJson.message || "Unable to load trainers");
      }
      if (!courseResponse.ok) {
        throw new Error(courseJson.message || "Unable to load courses");
      }

      setTrainers(Array.isArray(trainerJson.data) ? trainerJson.data : []);
      setCourses(Array.isArray(courseJson.data) ? courseJson.data : []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTrainer = useMemo(
    () =>
      trainers.find((trainer) => String(getTrainerId(trainer)) === trainerId),
    [trainers, trainerId]
  );

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === courseId),
    [courses, courseId]
  );

  const selectedTrainerIdNumber = selectedTrainer
    ? getTrainerId(selectedTrainer)
    : trainerId
      ? Number(trainerId)
      : null;

  useEffect(() => {
    const loadAssignedPermissions = async () => {
      if (!trainerId) {
        setAssignedPermissions([]);
        return;
      }

      try {
        const response = await authenticatedFetch(
          `${API_URL}/admin/trainer-course-permissions`
        );
        const json = await response.json();

        if (!response.ok) {
          throw new Error(
            json.message || "Unable to load assigned course permissions"
          );
        }

        const allPermissions = Array.isArray(json.data)
          ? (json.data as Permission[])
          : [];

        setAssignedPermissions(
          allPermissions.filter(
            (permission) => permission.trainerId === Number(trainerId)
          )
        );
      } catch (err) {
        handleError(err);
      }
    };

    loadAssignedPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerId]);

  useEffect(() => {
    const loadExistingPermission = async () => {
      if (!trainerId || !courseId) {
        setExistingPermission(null);
        setPermissions(DEFAULT_PERMISSIONS);
        return;
      }

      try {
        setLoadingPermission(true);
        setError("");
        setSuccess("");

        const response = await authenticatedFetch(
          `${API_URL}/admin/trainer-course-permissions/${trainerId}/${courseId}`
        );

        if (response.status === 404) {
          setExistingPermission(null);
          setPermissions(DEFAULT_PERMISSIONS);
          return;
        }

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.message || "Unable to load existing permissions");
        }

        const permission = json.data as Permission;
        setExistingPermission(permission);
        setPermissions({
          canTeach: Boolean(permission.canTeach),
          canManageContent: Boolean(permission.canManageContent),
          canCreateAssessments: Boolean(permission.canCreateAssessments),
        });
      } catch (err) {
        handleError(err);
      } finally {
        setLoadingPermission(false);
      }
    };

    loadExistingPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerId, courseId]);

  const loadAvailability = async (id = selectedTrainerIdNumber) => {
    if (!id) {
      setAvailability([]);
      return;
    }

    try {
      setLoadingAvailability(true);
      const response = await authenticatedFetch(
        `${API_URL}/admin/trainer-availability/${id}`
      );
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Unable to load trainer availability");
      }

      setAvailability(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    if (selectedTrainerIdNumber) {
      loadAvailability(selectedTrainerIdNumber);
    } else {
      setAvailability([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrainerIdNumber]);

  const updatePermissionField = (field: keyof PermissionsForm) => {
    setPermissions((current) => ({
      ...current,
      [field]: !current[field],
    }));
    setSuccess("");
  };

  const handleSavePermissions = async () => {
    if (!trainerId || !courseId) {
      setError("Please select both a trainer and a course.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const url = existingPermission
        ? `${API_URL}/admin/trainer-course-permissions/${trainerId}/${courseId}`
        : `${API_URL}/admin/trainer-course-permissions`;
      const method = existingPermission ? "PATCH" : "POST";
      const body = existingPermission
        ? permissions
        : { trainerId: Number(trainerId), courseId: Number(courseId), ...permissions };

      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(body),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Unable to save permissions");
      }

      const savedPermission =
        (json.data as Permission | undefined) ?? {
          id: existingPermission?.id ?? 0,
          trainerId: Number(trainerId),
          courseId: Number(courseId),
          ...permissions,
        };

      setExistingPermission(savedPermission);
      setAssignedPermissions((current) => {
        const exists = current.some(
          (permission) =>
            permission.trainerId === savedPermission.trainerId &&
            permission.courseId === savedPermission.courseId
        );

        return exists
          ? current.map((permission) =>
              permission.trainerId === savedPermission.trainerId &&
              permission.courseId === savedPermission.courseId
                ? savedPermission
                : permission
            )
          : [...current, savedPermission];
      });

      setSuccess(
        existingPermission
          ? "Trainer permissions updated successfully."
          : "Trainer permissions assigned successfully."
      );
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const resetAvailabilityForm = () => {
    setAvailabilityForm(DEFAULT_AVAILABILITY);
    setEditingAvailabilityId(null);
  };

  const startEditAvailability = (slot: Availability) => {
    setEditingAvailabilityId(slot.id);
    setAvailabilityForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: minuteToTime(slot.startMinute),
      endTime: minuteToTime(slot.endMinute),
      timezone: slot.timezone || "Asia/Kolkata",
      isActive: slot.isActive,
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleSaveAvailability = async () => {
    if (!selectedTrainerIdNumber) {
      setError("Please select a trainer before configuring availability.");
      return;
    }

    if (!availabilityForm.dayOfWeek || !availabilityForm.startTime || !availabilityForm.endTime) {
      setError("Day, start time and end time are required.");
      return;
    }

    const startMinute = timeToMinute(availabilityForm.startTime);
    const endMinute = timeToMinute(availabilityForm.endTime);

    if (endMinute <= startMinute) {
      setError("End time must be later than start time.");
      return;
    }

    if (startMinute < 0 || endMinute > 1439) {
      setError("Please enter a valid time between 00:00 and 23:59.");
      return;
    }

    try {
      setSavingAvailability(true);
      setError("");
      setSuccess("");

      const payload = {
        dayOfWeek: availabilityForm.dayOfWeek,
        startMinute,
        endMinute,
        timezone: availabilityForm.timezone.trim() || "Asia/Kolkata",
        isActive: availabilityForm.isActive,
      };

      const url = editingAvailabilityId
        ? `${API_URL}/admin/trainer-availability/slot/${editingAvailabilityId}`
        : `${API_URL}/admin/trainer-availability/${selectedTrainerIdNumber}`;

      const response = await authenticatedFetch(url, {
        method: editingAvailabilityId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Unable to save trainer availability");
      }

      await loadAvailability(selectedTrainerIdNumber);
      setSuccess(
        editingAvailabilityId
          ? "Availability slot updated successfully."
          : "Availability slot added successfully."
      );
      resetAvailabilityForm();
    } catch (err) {
      handleError(err);
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleDeleteAvailability = async (slot: Availability) => {
    const confirmed = window.confirm(
      `Delete the ${DAYS.find((day) => day.key === slot.dayOfWeek)?.label ?? slot.dayOfWeek} ${formatTime(slot.startMinute)} - ${formatTime(slot.endMinute)} availability slot?`
    );

    if (!confirmed) return;

    try {
      setDeletingAvailabilityId(slot.id);
      setError("");
      setSuccess("");

      const response = await authenticatedFetch(
        `${API_URL}/admin/trainer-availability/slot/${slot.id}`,
        { method: "DELETE" }
      );
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Unable to delete availability slot");
      }

      setAvailability((current) => current.filter((item) => item.id !== slot.id));
      if (editingAvailabilityId === slot.id) resetAvailabilityForm();
      setSuccess("Availability slot deleted successfully.");
    } catch (err) {
      handleError(err);
    } finally {
      setDeletingAvailabilityId(null);
    }
  };

  const permissionOptions: {
    key: keyof PermissionsForm;
    title: string;
    description: string;
  }[] = [
    {
      key: "canTeach",
      title: "Can Teach",
      description: "Allows the trainer to teach the assigned course.",
    },
    {
      key: "canManageContent",
      title: "Can Manage Content",
      description:
        "Allows the trainer to create, edit, delete and reorder course modules and lessons.",
    },
    {
      key: "canCreateAssessments",
      title: "Can Create Assessments",
      description:
        "Allows the trainer to create and manage assessments for this course.",
    },
  ];

  const filteredAvailability = useMemo(() => {
    const query = availabilitySearch.trim().toLowerCase();
    if (!query) return availability;

    return availability.filter((slot) => {
      const day = DAYS.find((item) => item.key === slot.dayOfWeek);
      return (
        day?.label.toLowerCase().includes(query) ||
        slot.timezone.toLowerCase().includes(query)
      );
    });
  }, [availability, availabilitySearch]);

  const groupedAvailability = useMemo(() => {
    return DAYS.map((day) => ({
      ...day,
      slots: filteredAvailability
        .filter((slot) => slot.dayOfWeek === day.key)
        .sort((a, b) => a.startMinute - b.startMinute),
    }));
  }, [filteredAvailability]);

  const activeAvailabilityCount = availability.filter((slot) => slot.isActive).length;
  const assignedCourseCount = assignedPermissions.length;

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard/admin/trainers")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trainers
        </button>

        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#173B67] via-[#214d7f] to-[#173B67] px-6 py-7 text-white sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/70">
                    Trainer Administration
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Trainer Permissions & Availability
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
                    Control course-level access and define when each trainer is available for meetings and scheduled sessions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadBaseData()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 sm:px-8">
            <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("permissions")}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === "permissions"
                      ? "bg-white text-[#173B67] shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Course Permissions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("availability");
                    setCourseId("");
                    setExistingPermission(null);
                    setPermissions(DEFAULT_PERMISSIONS);
                    setError("");
                    setSuccess("");
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === "availability"
                      ? "bg-white text-[#173B67] shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <CalendarClock className="h-4 w-4" />
                  Availability
                </button>
              </div>

              {selectedTrainer && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173B67] text-sm font-bold text-white">
                    {selectedTrainer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {selectedTrainer.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {selectedTrainer.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {(error || success) && (
          <div className="mt-5 space-y-3">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <X className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>
        )}

        <main className="mt-6 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#173B67]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Required Selection</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTab === "permissions"
                    ? "Select a trainer and course to manage course-specific permissions."
                    : "Select a trainer to manage their weekly scheduling availability."}
                </p>
              </div>
            </div>

            <div
              className={`grid gap-5 ${
                activeTab === "permissions" ? "lg:grid-cols-2" : "lg:grid-cols-1"
              }`}
            >
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>Trainer <span className="text-red-500">*</span></span>
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={trainerId}
                    onChange={(event) => {
                      setTrainerId(event.target.value);
                      setCourseId("");
                      setError("");
                      setSuccess("");
                      resetAvailabilityForm();
                    }}
                    disabled={loading}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#173B67] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                  >
                    <option value="">Select trainer</option>
                    {trainers.map((trainer) => (
                      <option key={trainer.id} value={getTrainerId(trainer)}>
                        {trainer.name} — {trainer.email}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Required for both permissions and availability.</p>
              </div>

{activeTab === "permissions" && (
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>Course <span className="text-red-500">*</span></span>
                  {!trainerId && <span className="text-xs font-medium text-slate-400">Select trainer first</span>}
                </label>
                <div className="relative">
                  <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={courseId}
                    onChange={(event) => {
                      setCourseId(event.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    disabled={!trainerId || loading}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#173B67] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">Select course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}{course.isActive === false ? " — Inactive" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Required only for the Course Permissions tab.</p>
              </div>
              )}
            </div>
          </section>

          {activeTab === "permissions" ? (
            <>
              <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">Permissions</h2>
                        {existingPermission && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            Already assigned
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        These permissions apply only to the selected course.
                      </p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-slate-300" />
                  </div>

                  {!trainerId || !courseId ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                      <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">Select trainer and course</p>
                      <p className="mt-1 text-sm text-slate-500">Both fields are required before permissions can be configured.</p>
                    </div>
                  ) : loadingPermission ? (
                    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-sm text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading existing permissions...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {permissionOptions.map((option) => {
                        const enabled = permissions[option.key];
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => updatePermissionField(option.key)}
                            className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                              enabled
                                ? "border-[#173B67]/25 bg-blue-50/60"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                enabled
                                  ? "border-[#173B67] bg-[#173B67] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {enabled && <Check className="h-3.5 w-3.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-slate-900">{option.title}</span>
                                <span className={`text-[11px] font-bold uppercase tracking-wide ${enabled ? "text-[#173B67]" : "text-slate-400"}`}>
                                  {enabled ? "Enabled" : "Disabled"}
                                </span>
                              </span>
                              <span className="mt-1 block text-sm leading-5 text-slate-500">{option.description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={handleSavePermissions}
                      disabled={!trainerId || !courseId || loadingPermission || saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173B67] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123154] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {existingPermission ? "Update Permissions" : "Assign Permissions"}
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Selected Assignment</h2>
                      <p className="mt-1 text-sm text-slate-500">Review the trainer and course before saving.</p>
                    </div>
                    <BookOpen className="h-5 w-5 text-slate-300" />
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Trainer</p>
                      <p className="mt-2 font-semibold text-slate-900">{selectedTrainer?.name || "Not selected"}</p>
                      {selectedTrainer && <p className="mt-1 text-sm text-slate-500">{selectedTrainer.email}</p>}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Course</p>
                      <p className="mt-2 font-semibold text-slate-900">{selectedCourse?.title || "Not selected"}</p>
                      {selectedCourse && (
                        <p className="mt-1 text-sm text-slate-500">
                          {[selectedCourse.mode, selectedCourse.duration].filter(Boolean).join(" • ") || "Course details"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Assigned courses</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{assignedCourseCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Active permissions</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {existingPermission
                          ? [existingPermission.canTeach, existingPermission.canManageContent, existingPermission.canCreateAssessments].filter(Boolean).length
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {trainerId && (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Assigned Courses</h2>
                      <p className="mt-1 text-sm text-slate-500">Saved course permissions for the selected trainer.</p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {assignedPermissions.length} {assignedPermissions.length === 1 ? "course" : "courses"} assigned
                    </span>
                  </div>

                  {assignedPermissions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                      <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">No courses assigned yet</p>
                      <p className="mt-1 text-sm text-slate-500">Use the form above to assign the first course.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {assignedPermissions.map((permission) => {
                        const course = courses.find((item) => item.id === permission.courseId);
                        return (
                          <button
                            key={permission.id}
                            type="button"
                            onClick={() => setCourseId(String(permission.courseId))}
                            className={`rounded-2xl border p-4 text-left transition ${
                              String(permission.courseId) === courseId
                                ? "border-[#173B67]/30 bg-blue-50/60"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                  {course?.title || `Course #${permission.courseId}`}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">Click to edit permissions</p>
                              </div>
                              {String(permission.courseId) === courseId && <Check className="h-4 w-4 shrink-0 text-[#173B67]" />}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {permission.canTeach && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Teach</span>}
                              {permission.canManageContent && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Content</span>}
                              {permission.canCreateAssessments && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">Assessments</span>}
                              {!permission.canTeach && !permission.canManageContent && !permission.canCreateAssessments && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">No capabilities enabled</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </>
          ) : (
            <>
              <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">Weekly Availability</h2>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          {activeAvailabilityCount} active
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        Define the time windows when this trainer can be scheduled.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadAvailability()}
                      disabled={!selectedTrainerIdNumber || loadingAvailability}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingAvailability ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                  </div>

                  {!selectedTrainerIdNumber ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                      <CalendarClock className="mx-auto h-9 w-9 text-slate-300" />
                      <p className="mt-3 font-semibold text-slate-700">Select a trainer first</p>
                      <p className="mt-1 text-sm text-slate-500">Availability belongs to an individual trainer.</p>
                    </div>
                  ) : loadingAvailability ? (
                    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-sm text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading availability...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          value={availabilitySearch}
                          onChange={(event) => setAvailabilitySearch(event.target.value)}
                          placeholder="Filter by day or timezone..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#173B67] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-2">
                        {groupedAvailability.map((day) => (
                          <div key={day.key} className="overflow-hidden rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#173B67] shadow-sm ring-1 ring-slate-200">
                                  {day.short}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{day.label}</p>
                                  <p className="text-xs text-slate-500">{day.slots.length} {day.slots.length === 1 ? "slot" : "slots"}</p>
                                </div>
                              </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                              {day.slots.length === 0 ? (
                                <div className="px-4 py-4 text-sm text-slate-400">No availability configured.</div>
                              ) : (
                                day.slots.map((slot) => (
                                  <div key={slot.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#173B67]">
                                        <Clock3 className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-slate-900">
                                          {formatTime(slot.startMinute)} – {formatTime(slot.endMinute)}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">{slot.timezone}</p>
                                      </div>
                                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${slot.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                        {slot.isActive ? "Active" : "Inactive"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => startEditAvailability(slot)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAvailability(slot)}
                                        disabled={deletingAvailabilityId === slot.id}
                                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                      >
                                        {deletingAvailabilityId === slot.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#173B67]">
                        {editingAvailabilityId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-900">{editingAvailabilityId ? "Edit Availability" : "Add Availability"}</h2>
                        <p className="text-xs text-slate-500">All fields marked * are required.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">Day <span className="text-red-500">*</span></label>
                      <select
                        value={availabilityForm.dayOfWeek}
                        onChange={(event) => setAvailabilityForm((current) => ({ ...current, dayOfWeek: event.target.value as DayOfWeek }))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#173B67] focus:ring-4 focus:ring-blue-100"
                      >
                        {DAYS.map((day) => <option key={day.key} value={day.key}>{day.label}</option>)}
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800">Start time <span className="text-red-500">*</span></label>
                        <input
                          type="time"
                          value={availabilityForm.startTime}
                          onChange={(event) => setAvailabilityForm((current) => ({ ...current, startTime: event.target.value }))}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#173B67] focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800">End time <span className="text-red-500">*</span></label>
                        <input
                          type="time"
                          value={availabilityForm.endTime}
                          onChange={(event) => setAvailabilityForm((current) => ({ ...current, endTime: event.target.value }))}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#173B67] focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">Timezone <span className="text-red-500">*</span></label>
                      <input
                        value={availabilityForm.timezone}
                        onChange={(event) => setAvailabilityForm((current) => ({ ...current, timezone: event.target.value }))}
                        placeholder="Asia/Kolkata"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#173B67] focus:ring-4 focus:ring-blue-100"
                      />
                      <p className="mt-1.5 text-xs text-slate-400">Default: Asia/Kolkata</p>
                    </div>

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">Active slot</span>
                        <span className="mt-0.5 block text-xs text-slate-500">Only active slots should be considered for scheduling.</span>
                      </span>
                      <span className="relative">
                        <input
                          type="checkbox"
                          checked={availabilityForm.isActive}
                          onChange={(event) => setAvailabilityForm((current) => ({ ...current, isActive: event.target.checked }))}
                          className="peer sr-only"
                        />
                        <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[#173B67]" />
                        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                      </span>
                    </label>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-blue-800">
                      <strong>Validation:</strong> end time must be later than start time. Multiple availability slots can be created for the same day.
                    </div>

                    <div className="flex gap-2 pt-1">
                      {editingAvailabilityId && (
                        <button
                          type="button"
                          onClick={resetAvailabilityForm}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveAvailability}
                        disabled={!selectedTrainerIdNumber || savingAvailability}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#173B67] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123154] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingAvailability ? <Loader2 className="h-4 w-4 animate-spin" /> : editingAvailabilityId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {editingAvailabilityId ? "Update Slot" : "Add Slot"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
 
export default function TrainerPermissionsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-sm text-slate-500">
              Loading trainer permissions...
            </div>
          </div>
        </main>
      }
    >
      <TrainerPermissionsContent />
    </Suspense>
  );
}
