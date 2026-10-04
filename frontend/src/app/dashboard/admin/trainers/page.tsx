"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { TrainerEngagementData } from "../../../../components/dashboard/TrainerEngagementPanel";

import {
  Search,
  UserPlus,
  MoreVertical,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  Users,
  X,
  Save,
  KeyRound,
  Activity,
  BarChart3,
  BookOpen,
  ClipboardList,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Award,
  CalendarDays,
  RefreshCw,
  Loader2,
  Camera,
  ShieldCheck,
} from "lucide-react";

type TrainerStatus = "Active" | "Inactive";

type Trainer = {
  profileId: number;
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  batches: number;
  joinedDate: string;
  status: TrainerStatus;
  profilePhotoUrl: string | null;
};

type TrainerAssessment = {
  id: number;
  courseId: number;
  title: string;
  type: "ASSIGNMENT" | "QUIZ" | string;
  approvalStatus?: string | null;
  dueAt?: string | null;
  totalMarks?: number | null;
  isActive?: boolean;
  course?: { title?: string | null } | null;
  createdByUserId?: number | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdByRole?: string | null;
  createdBy?: {
    name?: string | null;
    fullName?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  createdByUser?: {
    name?: string | null;
    fullName?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

type TrainerForm = {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  password: string;
  status: TrainerStatus;
};

const EMPTY_FORM: TrainerForm = {
  name: "",
  email: "",
  phone: "",
  specialization: "",
  experience: "",
  password: "",
  status: "Active",
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export default function TrainersPage() {
  const router = useRouter();

  const [trainers, setTrainers] =
    useState<Trainer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [uploadingPhotoId, setUploadingPhotoId] =
    useState<number | null>(null);

  const [photoError, setPhotoError] =
    useState("");

  const [photoTargetProfileId, setPhotoTargetProfileId] =
    useState<number | null>(null);

  const photoInputRef =
    useRef<HTMLInputElement | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | TrainerStatus>("All");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [engagementLoading, setEngagementLoading] =
    useState(false);

  const [engagementError, setEngagementError] =
    useState("");

  const [trainerAssessments, setTrainerAssessments] =
    useState<TrainerAssessment[]>([]);

  const [assignmentsLoading, setAssignmentsLoading] =
    useState(false);

  const [assignmentsError, setAssignmentsError] =
    useState("");

  const [engagementData, setEngagementData] =
    useState<TrainerEngagementData | null>(null);

  const [activeTrainerTab, setActiveTrainerTab] =
    useState<"overview" | "engagement" | "courses" | "assignments" | "batches" | "meetings">("overview");

  const [selectedTrainer, setSelectedTrainer] =
    useState<Trainer | null>(null);

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [menuPosition, setMenuPosition] =
    useState({
      top: 0,
      left: 0,
    });

  const [form, setForm] =
    useState<TrainerForm>(EMPTY_FORM);

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("token");
  };

  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ) {
    const token = getToken();

    if (!token) {
      router.push("/admin/login");
      throw new Error(
        "Authentication required"
      );
    }

    const response = await fetch(
      url,
      {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
          ...(options.body &&
          !(options.body instanceof FormData)
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),
        },
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

      router.push("/admin/login");

      throw new Error(
        "Authentication required"
      );
    }

    return response;
  }

  const toTrainer = (
    value: any
  ): Trainer => ({
    profileId: Number(
      value.profileId ??
        value.id
    ),

    id:
      value.displayId ||
      `TR${String(
        value.profileId ??
          value.id
      ).padStart(3, "0")}`,

    name: value.name || "",

    email:
      value.email || "",

    phone:
      value.phone || "",

    specialization:
      value.specialization || "",

    experience:
      value.experience === null ||
      value.experience ===
        undefined ||
      value.experience === ""
        ? ""
        : `${value.experience} Years`,

    batches: Number(
      value.batches || 0
    ),

    joinedDate:
      value.joinedDate
        ? new Date(
            value.joinedDate
          ).toLocaleDateString(
            "en-IN"
          )
        : "",

    status:
      value.status === "Active"
        ? "Active"
        : "Inactive",

    profilePhotoUrl:
      value.profilePhotoUrl ||
      null,
  });

  const loadTrainers = async () => {
    try {
      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/trainers`
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.message ||
            "Unable to load trainers."
        );
      }

      setTrainers(
        (json.data || []).map(
          toTrainer
        )
      );
    } catch (err) {
      console.error(
        "Load trainers error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load trainers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTrainers();
  }, []);

  const filteredTrainers =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return trainers.filter(
        (trainer) => {
          const matchesSearch =
            !searchText ||
            trainer.name
              .toLowerCase()
              .includes(searchText) ||
            trainer.email
              .toLowerCase()
              .includes(searchText) ||
            trainer.id
              .toLowerCase()
              .includes(searchText) ||
            trainer.phone.includes(
              search
            ) ||
            trainer.specialization
              .toLowerCase()
              .includes(searchText);

          const matchesStatus =
            statusFilter ===
              "All" ||
            trainer.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      trainers,
      search,
      statusFilter,
    ]);

  const activeTrainers =
    trainers.filter(
      (trainer) =>
        trainer.status ===
        "Active"
    ).length;

  const inactiveTrainers =
    trainers.filter(
      (trainer) =>
        trainer.status ===
        "Inactive"
    ).length;

  const totalBatches =
    trainers.reduce(
      (total, trainer) =>
        total + trainer.batches,
      0
    );

  const updateForm = (
    field: keyof TrainerForm,
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  };

  const createTrainer =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      if (!form.name.trim()) {
        alert(
          "Please enter trainer name."
        );
        return;
      }

      if (!form.email.trim()) {
        alert(
          "Please enter trainer email."
        );
        return;
      }

      if (!form.password.trim()) {
        alert(
          "Please create a password."
        );
        return;
      }

      setSaving(true);
      setError("");

      try {
        const response =
          await authenticatedFetch(
            `${API_URL}/admin/trainers`,
            {
              method: "POST",
              body: JSON.stringify(
                {
                  name:
                    form.name.trim(),

                  email:
                    form.email.trim(),

                  phone:
                    form.phone.trim() ||
                    null,

                  specialization:
                    form.specialization.trim() ||
                    null,

                  experience:
                    form.experience.trim()
                      ? Number.parseInt(
                          form.experience.replace(
                            /\D/g,
                            ""
                          ),
                          10
                        )
                      : null,

                  password:
                    form.password,

                  isActive:
                    form.status ===
                    "Active",
                }
              ),
            }
          );

        const json =
          await response.json();

        if (
          !response.ok ||
          !json?.success
        ) {
          throw new Error(
            json?.message ||
              "Unable to create trainer."
          );
        }

        setForm(EMPTY_FORM);

        setShowAddModal(
          false
        );

        await loadTrainers();
      } catch (err) {
        console.error(
          "Create trainer error:",
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : "Unable to create trainer.";

        setError(message);
        alert(message);
      } finally {
        setSaving(false);
      }
    };

  const openEditModal = (
    trainer: Trainer
  ) => {
    setOpenMenuId(null);

    setSelectedTrainer(
      trainer
    );

    setForm({
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      specialization:
        trainer.specialization,
      experience:
        trainer.experience,
      password: "",
      status: trainer.status,
    });

    setShowEditModal(true);
  };

  const updateTrainer =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      if (!selectedTrainer) {
        return;
      }

      if (!form.name.trim()) {
        alert(
          "Please enter trainer name."
        );
        return;
      }

      setSaving(true);
      setError("");

      try {
        const response =
          await authenticatedFetch(
            `${API_URL}/admin/trainers/${selectedTrainer.profileId}`,
            {
              method: "PATCH",
              body: JSON.stringify(
                {
                  name:
                    form.name.trim(),

                  email:
                    form.email.trim(),

                  phone:
                    form.phone.trim() ||
                    null,

                  specialization:
                    form.specialization.trim() ||
                    null,

                  experience:
                    form.experience.trim()
                      ? Number.parseInt(
                          form.experience.replace(
                            /\D/g,
                            ""
                          ),
                          10
                        )
                      : null,

                  password:
                    form.password.trim() ||
                    undefined,

                  isActive:
                    form.status ===
                    "Active",
                }
              ),
            }
          );

        const json =
          await response.json();

        if (
          !response.ok ||
          !json?.success
        ) {
          throw new Error(
            json?.message ||
              "Unable to update trainer."
          );
        }

        setShowEditModal(
          false
        );

        setSelectedTrainer(
          null
        );

        setForm(EMPTY_FORM);

        await loadTrainers();
      } catch (err) {
        console.error(
          "Update trainer error:",
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : "Unable to update trainer.";

        setError(message);
        alert(message);
      } finally {
        setSaving(false);
      }
    };

  const toggleStatus =
    async (
      trainer: Trainer
    ) => {
      setOpenMenuId(null);
      setSaving(true);
      setError("");

      try {
        const response =
          await authenticatedFetch(
            `${API_URL}/admin/trainers/${trainer.profileId}`,
            {
              method: "PATCH",
              body: JSON.stringify(
                {
                  isActive:
                    trainer.status !==
                    "Active",
                }
              ),
            }
          );

        const json =
          await response.json();

        if (
          !response.ok ||
          !json?.success
        ) {
          throw new Error(
            json?.message ||
              "Unable to update trainer status."
          );
        }

        await loadTrainers();
      } catch (err) {
        console.error(
          "Toggle trainer status error:",
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : "Unable to update trainer status.";

        setError(message);
        alert(message);
      } finally {
        setSaving(false);
      }
    };

  const openViewModal = (
    trainer: Trainer
  ) => {
    setOpenMenuId(null);

    setSelectedTrainer(
      trainer
    );

    setActiveTrainerTab("overview");
    setEngagementData(null);
    setEngagementError("");
    setEngagementLoading(false);
    setShowViewModal(true);
  };

  const openMoreMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    trainerId: string
  ) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    const menuWidth = 235;
    const menuHeight = 300;
    const gap = 8;
    const padding = 12;

    let left =
      rect.right - menuWidth;

    if (left < padding) {
      left = padding;
    }

    if (
      left + menuWidth >
      window.innerWidth -
        padding
    ) {
      left =
        window.innerWidth -
        menuWidth -
        padding;
    }

    let top =
      rect.bottom + gap;

    if (
      top + menuHeight >
      window.innerHeight -
        padding
    ) {
      top =
        rect.top -
        menuHeight -
        gap;
    }

    if (top < padding) {
      top = padding;
    }

    setMenuPosition({
      top,
      left,
    });

    setOpenMenuId(
      openMenuId === trainerId
        ? null
        : trainerId
    );
  };

  const loadTrainerEngagement = async (
    trainer: Trainer
  ) => {
    setEngagementData(null);
    setEngagementError("");
    setEngagementLoading(true);

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/admin/trainers/${trainer.profileId}/engagements`
        );

      const json =
        await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to load trainer engagements."
        );
      }

      const engagement =
        json.data as TrainerEngagementData;

      setEngagementData(engagement);

      void loadTrainerAssessments(
        engagement
      );
    } catch (err) {
      console.error(
        "Load trainer engagements error:",
        err
      );

      setEngagementError(
        err instanceof Error
          ? err.message
          : "Unable to load trainer engagements."
      );
    } finally {
      setEngagementLoading(false);
    }
  };

  const loadTrainerAssessments = async (
    engagement: TrainerEngagementData
  ) => {
    setAssignmentsLoading(true);
    setAssignmentsError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/admin/assessments`
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Unable to load trainer assessments."
        );
      }

      const manageableCourseIds = new Set(
        (Array.isArray(engagement.permissions)
          ? engagement.permissions
          : []
        )
          .filter((permission: any) =>
            Boolean(permission.canCreateAssessments)
          )
          .map((permission: any) =>
            Number(permission.courseId)
          )
          .filter((id: number) =>
            Number.isInteger(id) && id > 0
          )
      );

      const rows = Array.isArray(json.data)
        ? json.data
        : [];

      setTrainerAssessments(
        rows.filter(
          (assessment: any) =>
            manageableCourseIds.has(
              Number(assessment.courseId)
            )
        ) as TrainerAssessment[]
      );
    } catch (err) {
      console.error(
        "Load trainer assessments error:",
        err
      );

      setAssignmentsError(
        err instanceof Error
          ? err.message
          : "Unable to load trainer assessments."
      );
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleMoreAction =
    async (
      action:
        | "reset-password"
        | "activity"
        | "availability"
        | "permissions"
        | "engagements",
      trainer: Trainer
    ) => {
      setOpenMenuId(null);

      if (action === "engagements") {
        setSelectedTrainer(trainer);
        setActiveTrainerTab("engagement");
        setShowViewModal(true);
        void loadTrainerEngagement(trainer);
        return;
      }

      if (action === "availability") {
        router.push(
          `/dashboard/admin/trainer-availability?trainerId=${trainer.profileId}`
        );
        return;
      }

      if (action === "permissions") {
        router.push(
          `/dashboard/admin/trainer-permissions?trainerId=${trainer.profileId}`
        );
        return;
      }

      const newPassword =
        window.prompt(
          `Enter a new password for ${trainer.name}:`
        );

      if (
        newPassword === null
      ) {
        return;
      }

      if (
        newPassword.trim()
          .length < 8
      ) {
        alert(
          "Password must contain at least 8 characters."
        );
        return;
      }

      setSaving(true);
      setError("");

      try {
        const response =
          await authenticatedFetch(
            `${API_URL}/admin/trainers/${trainer.profileId}/reset-password`,
            {
              method: "POST",
              body: JSON.stringify(
                {
                  password:
                    newPassword,
                }
              ),
            }
          );

        const json =
          await response.json();

        if (
          !response.ok ||
          !json?.success
        ) {
          throw new Error(
            json?.message ||
              "Unable to reset password."
          );
        }

        alert(
          "Trainer password has been updated successfully."
        );
      } catch (err) {
        console.error(
          "Reset trainer password error:",
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : "Unable to reset password.";

        setError(message);
        alert(message);
      } finally {
        setSaving(false);
      }
    };

  const getPhotoUrl = (
    photoUrl?: string | null
  ): string | null => {
    if (!photoUrl) {
      return null;
    }

    if (
      photoUrl.startsWith(
        "http://"
      ) ||
      photoUrl.startsWith(
        "https://"
      )
    ) {
      return photoUrl;
    }

    const backendUrl =
      API_URL.replace(
        /\/api\/?$/,
        ""
      );

    return `${backendUrl}${
      photoUrl.startsWith("/")
        ? ""
        : "/"
    }${photoUrl}`;
  };

  const openPhotoPicker = (
    trainer: Trainer
  ) => {
    setPhotoError("");

    setPhotoTargetProfileId(
      trainer.profileId
    );

    photoInputRef.current?.click();
  };

  const uploadTrainerPhoto =
    async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      const profileId =
        photoTargetProfileId;

      if (!file || !profileId) {
        event.target.value = "";
        return;
      }

      setPhotoError("");

      const allowedTypes =
        new Set([
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ]);

      if (
        !allowedTypes.has(
          file.type
        )
      ) {
        setPhotoError(
          "Please select a JPG, PNG, WEBP, or GIF image."
        );

        event.target.value = "";

        return;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        setPhotoError(
          "Profile photo must be 5 MB or smaller."
        );

        event.target.value = "";

        return;
      }

      try {
        setUploadingPhotoId(
          profileId
        );

        const formData =
          new FormData();

        formData.append(
          "photo",
          file
        );

        const response =
          await authenticatedFetch(
            `${API_URL}/admin/trainers/${profileId}/photo`,
            {
              method: "POST",
              body: formData,
            }
          );

        const json =
          await response.json();

        if (
          !response.ok ||
          !json?.success
        ) {
          throw new Error(
            json?.message ||
              "Unable to update trainer profile photo."
          );
        }

        const profilePhotoUrl =
          json?.data
            ?.profilePhotoUrl ||
          null;

        setTrainers(
          (current) =>
            current.map(
              (trainer) =>
                trainer.profileId ===
                profileId
                  ? {
                      ...trainer,
                      profilePhotoUrl,
                    }
                  : trainer
            )
        );

        setSelectedTrainer(
          (current) =>
            current &&
            current.profileId ===
              profileId
              ? {
                  ...current,
                  profilePhotoUrl,
                }
              : current
        );
      } catch (err) {
        console.error(
          "Upload trainer profile photo error:",
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : "Unable to update trainer profile photo.";

        setPhotoError(
          message
        );

        alert(message);
      } finally {
        setUploadingPhotoId(
          null
        );

        setPhotoTargetProfileId(
          null
        );

        event.target.value = "";
      }
    };

  const closeAll = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setActiveTrainerTab("overview");
    setEngagementData(null);
    setEngagementError("");
    setEngagementLoading(false);
    setSelectedTrainer(null);
    setOpenMenuId(null);


    setForm(EMPTY_FORM);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={
          uploadTrainerPhoto
        }
      />

      <div className="mx-auto max-w-[1500px]">
        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-500">
              Trainer Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Trainers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage trainers, specializations, batches and account status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadTrainers()
              }
              disabled={
                loading ||
                saving
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setForm(
                  EMPTY_FORM
                );
                setShowAddModal(
                  true
                );
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
            >
              <UserPlus
                size={18}
              />

              Add Trainer
            </button>
          </div>
        </div>

        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={
              <Users size={21} />
            }
            value={
              trainers.length
            }
            title="Total Trainers"
            description="Trainers in the system"
          />

          <SummaryCard
            icon={
              <CheckCircle2
                size={21}
              />
            }
            value={
              activeTrainers
            }
            title="Active Trainers"
            description="Currently active"
          />

          <SummaryCard
            icon={
              <XCircle size={21} />
            }
            value={
              inactiveTrainers
            }
            title="Inactive Trainers"
            description="Currently inactive"
          />

          <SummaryCard
            icon={
              <CalendarDays
                size={21}
              />
            }
            value={
              totalBatches
            }
            title="Assigned Batches"
            description="Across all trainers"
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative w-full sm:max-w-xl">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by name, email, phone, ID or specialization..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "All"
                    | TrainerStatus
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Loading trainers...
              </div>
            </div>
          ) : filteredTrainers.length ===
            0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                <Users
                  size={28}
                  className="text-orange-500"
                />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-[#173B67]">
                No trainers found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {search ||
                statusFilter !==
                  "All"
                  ? "Try changing your search or status filter."
                  : 'Click "Add Trainer" to create the first trainer.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50">
                    <TableHeader>
                      Trainer
                    </TableHeader>

                    <TableHeader>
                      Trainer ID
                    </TableHeader>

                    <TableHeader>
                      Phone
                    </TableHeader>

                    <TableHeader>
                      Specialization
                    </TableHeader>

                    <TableHeader>
                      Experience
                    </TableHeader>

                    <TableHeader>
                      Batches
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader>
                      Actions
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {filteredTrainers.map(
                    (trainer) => (
                      <tr
                        key={trainer.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/60"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-orange-500">
                              {getPhotoUrl(
                                trainer.profilePhotoUrl
                              ) ? (
                                <img
                                  src={
                                    getPhotoUrl(
                                      trainer.profilePhotoUrl
                                    ) ||
                                    undefined
                                  }
                                  alt={`${trainer.name} profile`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold">
                                  {trainer.name
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">
                                {
                                  trainer.name
                                }
                              </p>

                              <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500">
                                {
                                  trainer.email
                                }
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-[#173B67]">
                            {
                              trainer.id
                            }
                          </span>
                        </TableCell>

                        <TableCell>
                          {trainer.phone ||
                            "Not provided"}
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex max-w-[190px] rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                            {trainer.specialization ||
                              "Not specified"}
                          </span>
                        </TableCell>

                        <TableCell>
                          {trainer.experience ||
                            "Not specified"}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                              <CalendarDays
                                size={15}
                              />
                            </span>

                            <span className="font-medium">
                              {
                                trainer.batches
                              }
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              trainer.status ===
                              "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {
                              trainer.status
                            }
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <ActionButton
                              title="View trainer"
                              onClick={() =>
                                openViewModal(
                                  trainer
                                )
                              }
                            >
                              <Eye size={16} />
                            </ActionButton>

                            <ActionButton
                              title="Edit trainer"
                              onClick={() =>
                                openEditModal(
                                  trainer
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </ActionButton>

                            <ActionButton
                              title={
                                trainer.status ===
                                "Active"
                                  ? "Deactivate trainer"
                                  : "Activate trainer"
                              }
                              onClick={() =>
                                toggleStatus(
                                  trainer
                                )
                              }
                            >
                              {trainer.status ===
                              "Active" ? (
                                <UserX
                                  size={16}
                                />
                              ) : (
                                <UserCheck
                                  size={16}
                                />
                              )}
                            </ActionButton>

                            <ActionButton
                              title="Change profile photo"
                              onClick={() =>
                                openPhotoPicker(
                                  trainer
                                )
                              }
                            >
                              {uploadingPhotoId ===
                              trainer.profileId ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Camera
                                  size={16}
                                />
                              )}
                            </ActionButton>

                            <ActionButton
                              title="More actions"
                              onClick={(e) =>
                                openMoreMenu(
                                  e,
                                  trainer.id
                                )
                              }
                            >
                              <MoreVertical
                                size={16}
                              />
                            </ActionButton>
                          </div>
                        </TableCell>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-semibold text-blue-800">
            Trainer Accounts
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700/80">
            Trainer accounts are stored in PostgreSQL and use the same
            authentication system as the rest of the application.
            Batch assignment is available separately.
          </p>
        </div>
      </div>

      {openMenuId && (
        <div
          className="fixed z-[99999] w-[235px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          {(() => {
            const trainer =
              trainers.find(
                (item) =>
                  item.id ===
                  openMenuId
              );

            if (!trainer) {
              return null;
            }

            return (
              <>
                <MoreMenuItem
                  icon={
                    <KeyRound
                      size={17}
                    />
                  }
                  label="Reset Password"
                  onClick={() =>
                    handleMoreAction(
                      "reset-password",
                      trainer
                    )
                  }
                />

                <MoreMenuItem
                  icon={
                    <Activity
                      size={17}
                    />
                  }
                  label="View Engagements"
                  onClick={() =>
                    handleMoreAction(
                      "engagements",
                      trainer
                    )
                  }
                />

                <MoreMenuItem
                  icon={
                    <CalendarDays
                      size={17}
                    />
                  }
                  label="Manage Availability"
                  onClick={() =>
                    handleMoreAction(
                      "availability",
                      trainer
                    )
                  }
                />

                <MoreMenuItem
                  icon={
                    <ShieldCheck
                      size={17}
                    />
                  }
                  label="Manage Permissions"
                  onClick={() =>
                    handleMoreAction(
                      "permissions",
                      trainer
                    )
                  }
                />

                <MoreMenuItem
                  icon={
                    trainer.status ===
                    "Active" ? (
                      <XCircle
                        size={17}
                      />
                    ) : (
                      <CheckCircle2
                        size={17}
                      />
                    )
                  }
                  label={
                    trainer.status ===
                    "Active"
                      ? "Deactivate Trainer"
                      : "Activate Trainer"
                  }
                  onClick={() =>
                    toggleStatus(
                      trainer
                    )
                  }
                />
              </>
            );
          })()}
        </div>
      )}

      {showAddModal && (
        <TrainerFormModal
          title="Add New Trainer"
          subtitle="Create a trainer account for SKCE."
          form={form}
          setForm={setForm}
          onClose={closeAll}
          onSubmit={createTrainer}
          submitLabel="Create Trainer"
          saving={saving}
        />
      )}

      {showEditModal && (
        <TrainerFormModal
          title="Edit Trainer"
          subtitle="Update trainer information and account status."
          form={form}
          setForm={setForm}
          onClose={closeAll}
          onSubmit={updateTrainer}
          submitLabel="Save Changes"
          isEdit
          saving={saving}
        />
      )}

      {showViewModal &&
        selectedTrainer && (
          <ModalOverlay
            onClose={closeAll}
          >
            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <ModalHeader
                title="Trainer Details"
                subtitle="Trainer profile, engagement, courses, batches and meetings."
                onClose={closeAll}
              />

              <div className="p-6">
                <div className="mb-6 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-orange-500">
                    {getPhotoUrl(
                      selectedTrainer.profilePhotoUrl
                    ) ? (
                      <img
                        src={
                          getPhotoUrl(
                            selectedTrainer.profilePhotoUrl
                          ) ||
                          undefined
                        }
                        alt={`${selectedTrainer.name} profile`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold">
                        {selectedTrainer.name
                          .charAt(
                            0
                          )
                          .toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#173B67]">
                      {
                        selectedTrainer.name
                      }
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        selectedTrainer.id
                      }
                    </p>
                  </div>

                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedTrainer.status ===
                        "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {
                        selectedTrainer.status
                      }
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        openPhotoPicker(
                          selectedTrainer
                        )
                      }
                      disabled={
                        uploadingPhotoId ===
                        selectedTrainer.profileId
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploadingPhotoId ===
                      selectedTrainer.profileId ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <Camera
                          size={14}
                        />
                      )}

                      Change Photo
                    </button>
                  </div>
                </div>

                <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-100 pb-2">
                  {(
                    [
                      ["overview", "Overview", Users],
                      ["engagement", "Engagement", BarChart3],
                      ["courses", "Courses", BookOpen],
                      ["assignments", "Assignments", ClipboardList],
                      ["batches", "Batches", GraduationCap],
                      ["meetings", "Meetings", CalendarDays],
                    ] as const
                  ).map(([tab, label, Icon]) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTrainerTab(tab);

                        if (
                          tab !== "overview" &&
                          !engagementData &&
                          !engagementLoading
                        ) {
                          void loadTrainerEngagement(
                            selectedTrainer
                          );
                        }
                      }}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                        activeTrainerTab === tab
                          ? "bg-[#173B67] text-white"
                          : "text-slate-500 hover:bg-slate-50 hover:text-[#173B67]"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>

                {activeTrainerTab === "overview" && (
                  <div>
                    <div className="grid gap-3 sm:grid-cols-2">
                  <DetailBox
                    label="Full Name"
                    value={
                      selectedTrainer.name
                    }
                  />

                  <DetailBox
                    label="Trainer ID"
                    value={
                      selectedTrainer.id
                    }
                  />

                  <DetailBox
                    label="Email"
                    value={
                      selectedTrainer.email
                    }
                  />

                  <DetailBox
                    label="Phone"
                    value={
                      selectedTrainer.phone ||
                      "Not provided"
                    }
                  />

                  <DetailBox
                    label="Specialization"
                    value={
                      selectedTrainer.specialization ||
                      "Not specified"
                    }
                  />

                  <DetailBox
                    label="Experience"
                    value={
                      selectedTrainer.experience ||
                      "Not specified"
                    }
                  />

                  <DetailBox
                    label="Assigned Batches"
                    value={String(
                      selectedTrainer.batches
                    )}
                  />

                  <DetailBox
                    label="Joined Date"
                    value={
                      selectedTrainer.joinedDate
                    }
                  />

                  <DetailBox
                    label="Profile Photo"
                    value={
                      selectedTrainer.profilePhotoUrl
                        ? "Uploaded"
                        : "Not uploaded"
                    }
                  />
                    </div>

                    <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <Award
                      size={18}
                      className="text-orange-500"
                    />

                    <p className="text-sm font-semibold text-[#173B67]">
                      Trainer Account
                    </p>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    This trainer has a real SKCE login account.
                    The password is stored only as a secure bcrypt hash.
                  </p>
                    </div>
                  </div>
                )}

                {activeTrainerTab === "engagement" && (
                  <TrainerEngagementTab
                    data={engagementData}
                    loading={engagementLoading}
                    error={engagementError}
                    trainer={selectedTrainer}
                    onRetry={() =>
                      void loadTrainerEngagement(selectedTrainer)
                    }
                  />
                )}

                {activeTrainerTab === "courses" && (
                  <TrainerCoursesTab data={engagementData} loading={engagementLoading} error={engagementError} />
                )}

                {activeTrainerTab === "assignments" && (
                  <TrainerAssignmentsTab
                    data={engagementData}
                    assessments={trainerAssessments}
                    loading={engagementLoading || assignmentsLoading}
                    error={engagementError || assignmentsError}
                  />
                )}

                {activeTrainerTab === "batches" && (
                  <TrainerBatchesTab data={engagementData} loading={engagementLoading} error={engagementError} />
                )}

                {activeTrainerTab === "meetings" && (
                  <TrainerMeetingsTab data={engagementData} loading={engagementLoading} error={engagementError} />
                )}
              </div>

              <ModalFooter
                onClose={closeAll}
              />
            </div>
          </ModalOverlay>
        )}

    </main>
  );
}

/* ============================================================
   TRAINER ENGAGEMENT TABS
============================================================ */

function TrainerEngagementTab({
  data,
  loading,
  error,
  trainer,
  onRetry,
}: {
  data: TrainerEngagementData | null;
  loading: boolean;
  error: string;
  trainer: Trainer;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-orange-500"
          />
          <p className="mt-4 text-sm font-semibold text-[#173B67]">
            Loading trainer engagement...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-semibold text-red-800">
          Unable to load trainer engagement
        </p>
        <p className="mt-1 text-xs leading-5 text-red-700">
          {error}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-[#173B67] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f2f55]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          icon={<BookOpen size={20} />}
          value={Number(data.summary?.responsibleCourses ?? data.courses?.filter((item: any) => item?.canTeach).length ?? 0)}
          title="Courses"
          description="Courses the trainer can teach"
        />
        <SummaryCard
          icon={<GraduationCap size={20} />}
          value={Number(data.summary?.assignedBatches ?? data.batches?.length ?? 0)}
          title="Batches"
          description="Responsible batches"
        />
        <SummaryCard
          icon={<Users size={20} />}
          value={Number(data.summary?.students ?? 0)}
          title="Students"
          description="Students across responsible batches"
        />
        <SummaryCard
          icon={<CalendarDays size={20} />}
          value={Number(data.summary?.upcomingMeetings ?? data.upcomingMeetings?.length ?? 0)}
          title="Upcoming"
          description="Scheduled upcoming meetings"
        />
        <SummaryCard
          icon={<Activity size={20} />}
          value={Number(data.summary?.totalMeetings ?? data.meetings?.length ?? 0)}
          title="Meetings"
          description="Total trainer meetings"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#173B67]">
              Permission Coverage
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Trainer permissions available from the engagement data.
            </p>
          </div>
          <ShieldCheck size={20} className="text-orange-500" />
        </div>

        <div className="mt-5 space-y-4">
          <PermissionBar
            label="Can Teach"
            enabled={data.permissions?.filter((item: any) => item?.canTeach).length ?? 0}
            total={data.permissions?.length ?? 0}
          />
          <PermissionBar
            label="Manage Content"
            enabled={data.permissions?.filter((item: any) => item?.canManageContent).length ?? 0}
            total={data.permissions?.length ?? 0}
          />
          <PermissionBar
            label="Create Assessments"
            enabled={data.permissions?.filter((item: any) => item?.canCreateAssessments).length ?? 0}
            total={data.permissions?.length ?? 0}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Activity size={19} className="text-orange-500" />
          <div>
            <h3 className="text-base font-bold text-[#173B67]">
              Engagement Overview
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Real engagement information for {trainer.name}.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoMetric
            label="Teaching responsibilities"
            value={String(data.courses?.filter((item: any) => item?.canTeach).length ?? 0)}
          />
          <InfoMetric
            label="Responsible batches"
            value={String(data.batches?.length ?? 0)}
          />
          <InfoMetric
            label="Students"
            value={String(data.summary?.students ?? 0)}
          />
          <InfoMetric
            label="Upcoming meetings"
            value={String(data.upcomingMeetings?.length ?? 0)}
          />
        </div>
      </div>
    </div>
  );
}

function TrainerCoursesTab({
  data,
  loading,
  error,
}: {
  data: TrainerEngagementData | null;
  loading: boolean;
  error: string;
}) {
  if (loading) return <TabLoading label="Loading courses..." />;
  if (error) return <TabError message={error} />;
  if (!data) return null;

  const rows = Array.isArray(data.permissions) ? data.permissions : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h3 className="text-base font-bold text-[#173B67]">Course Responsibilities</h3>
        <p className="mt-1 text-xs text-slate-500">Course permissions assigned to this trainer.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyTab label="No course permissions are assigned to this trainer." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50">
              <tr>
                <TableHeader>Course</TableHeader>
                <TableHeader>Can Teach</TableHeader>
                <TableHeader>Manage Content</TableHeader>
                <TableHeader>Create Assessments</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((course: any) => (
                <tr key={course.id ?? course.courseId}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-800">{course.courseTitle || "Untitled course"}</p>
                      {course.courseSlug && (
                        <p className="mt-1 text-xs text-slate-400">{course.courseSlug}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><PermissionBadge enabled={Boolean(course.canTeach)} /></TableCell>
                  <TableCell><PermissionBadge enabled={Boolean(course.canManageContent)} /></TableCell>
                  <TableCell><PermissionBadge enabled={Boolean(course.canCreateAssessments)} /></TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getAssessmentCourseTitle(
  assessment: TrainerAssessment,
  data: TrainerEngagementData
) {
  if (assessment.course?.title) {
    return assessment.course.title;
  }

  const course = (Array.isArray(data.courses) ? data.courses : []).find(
    (item: any) => Number(item.courseId) === Number(assessment.courseId)
  );

  return course?.courseTitle || "Not available";
}

function getPersonLabel(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const label = getPersonLabel(item);
      if (label) return label;
    }
    return "";
  }

  if (typeof value === "object") {
    const person = value as Record<string, unknown>;

    const name =
      person.name ??
      person.fullName ??
      person.displayName ??
      person.username;

    const email = person.email;
    const role = person.role;
    const id = person.id ?? person.userId;

    if (name !== null && name !== undefined && String(name).trim()) {
      const roleText =
        role !== null && role !== undefined && String(role).trim()
          ? ` (${String(role).toUpperCase()})`
          : "";

      return `${String(name)}${roleText}`;
    }

    if (email !== null && email !== undefined && String(email).trim()) {
      const roleText =
        role !== null && role !== undefined && String(role).trim()
          ? ` (${String(role).toUpperCase()})`
          : "";

      return `${String(email)}${roleText}`;
    }

    if (id !== null && id !== undefined) {
      return `User #${String(id)}`;
    }
  }

  return "";
}

function getAssessmentCreatorLabel(assessment: TrainerAssessment) {
  const candidates: unknown[] = [
    assessment.createdByName,
    assessment.createdBy,
    assessment.createdByUser,
  ];

  for (const candidate of candidates) {
    const label = getPersonLabel(candidate);
    if (label) return label;
  }

  if (assessment.createdByUserId) {
    return `User #${assessment.createdByUserId}`;
  }

  return "Not available";
}

function TrainerAssignmentsTab({
  data,
  assessments,
  loading,
  error,
}: {
  data: TrainerEngagementData | null;
  assessments: TrainerAssessment[];
  loading: boolean;
  error: string;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "ASSIGNMENT" | "QUIZ">("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [creatorFilter, setCreatorFilter] = useState("All");
  const [dueDateFilter, setDueDateFilter] = useState<"All" | "Due" | "No due date">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  const courseOptions = useMemo(() => {
    const values = new Set<string>();
    assessments.forEach((assessment) => {
      const title = getAssessmentCourseTitle(assessment, data as TrainerEngagementData);
      if (title && title !== "Not available") values.add(title);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [assessments, data]);

  const creatorOptions = useMemo(() => {
    const values = new Set<string>();
    assessments.forEach((assessment) => {
      values.add(getAssessmentCreatorLabel(assessment));
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [assessments]);

  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assessments.filter((assessment) => {
      const courseTitle = getAssessmentCourseTitle(
        assessment,
        data as TrainerEngagementData
      );
      const creator = getAssessmentCreatorLabel(assessment);
      const status = assessment.isActive === false ? "Inactive" : "Active";
      const assessmentType = assessment.type === "QUIZ" ? "QUIZ" : "ASSIGNMENT";

      const matchesSearch =
        !query ||
        [assessment.title, String(assessment.id), courseTitle, creator]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesType =
        typeFilter === "All" || assessmentType === typeFilter;

      const matchesCourse =
        courseFilter === "All" || courseTitle === courseFilter;

      const matchesCreator =
        creatorFilter === "All" || creator === creatorFilter;

      const matchesDueDate =
        dueDateFilter === "All" ||
        (dueDateFilter === "Due" && Boolean(assessment.dueAt)) ||
        (dueDateFilter === "No due date" && !assessment.dueAt);

      const matchesStatus =
        statusFilter === "All" || status === statusFilter;

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
    data,
    search,
    typeFilter,
    courseFilter,
    creatorFilter,
    dueDateFilter,
    statusFilter,
  ]);

  const assignments = filteredAssessments.filter(
    (item) => item.type === "ASSIGNMENT"
  );

  const quizzes = filteredAssessments.filter(
    (item) => item.type === "QUIZ"
  );

  const activeCount = filteredAssessments.filter(
    (item) => item.isActive !== false
  ).length;

  const publishedCount = filteredAssessments.filter(
    (item) => String(item.approvalStatus || "") === "PUBLISHED"
  ).length;

  function clearFilters() {
    setSearch("");
    setTypeFilter("All");
    setCourseFilter("All");
    setCreatorFilter("All");
    setDueDateFilter("All");
    setStatusFilter("All");
  }

  if (loading) {
    return <TabLoading label="Loading assignments and quizzes..." />;
  }

  if (error) {
    return <TabError message={error} />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoMetric
          label="Total Assessments"
          value={filteredAssessments.length}
          icon={<ClipboardList size={17} />}
        />
        <InfoMetric
          label="Assignments"
          value={assignments.length}
          icon={<ClipboardList size={17} />}
        />
        <InfoMetric
          label="Quizzes"
          value={quizzes.length}
          icon={<Award size={17} />}
        />
        <InfoMetric
          label="Published / Active"
          value={`${publishedCount} / ${activeCount}`}
          icon={<CheckCircle2 size={17} />}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-base font-bold text-[#173B67]">
                Assignments &amp; Quizzes
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Assessments belonging to courses where this trainer has assessment-creation permission.
              </p>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="w-fit rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Search
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Title / ID / Course / Creator"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value as "All" | "ASSIGNMENT" | "QUIZ"
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">All Types</option>
                <option value="ASSIGNMENT">Assignment</option>
                <option value="QUIZ">Quiz</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Course
              </label>
              <select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">All Courses</option>
                {courseOptions.map((course) => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Created By
              </label>
              <select
                value={creatorFilter}
                onChange={(event) => setCreatorFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">All Creators</option>
                {creatorOptions.map((creator) => (
                  <option key={creator} value={creator}>{creator}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Due Date
              </label>
              <select
                value={dueDateFilter}
                onChange={(event) =>
                  setDueDateFilter(
                    event.target.value as "All" | "Due" | "No due date"
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">All</option>
                <option value="Due">Has due date</option>
                <option value="No due date">No due date</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "All" | "Active" | "Inactive"
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredAssessments.length}</span> of {assessments.length} assessments.
          </div>
        </div>

        {filteredAssessments.length === 0 ? (
          <EmptyTab label="No assignments or quizzes match the selected filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Title</TableHeader>
                  <TableHeader>Course</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Created By</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Due Date</TableHeader>
                  <TableHeader>Total Marks</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <TableCell>
                      <span className="font-semibold text-slate-800">
                        {assessment.title || "Untitled assessment"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getAssessmentCourseTitle(assessment, data)}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {assessment.type === "QUIZ" ? "Quiz" : "Assignment"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getAssessmentCreatorLabel(assessment)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={
                          assessment.approvalStatus ||
                          (assessment.isActive === false ? "INACTIVE" : "ACTIVE")
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {assessment.dueAt
                        ? formatTrainerDateTime(assessment.dueAt)
                        : "No due date"}
                    </TableCell>
                    <TableCell>
                      {assessment.totalMarks ?? "—"}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TrainerBatchesTab({
  data,
  loading,
  error,
}: {
  data: TrainerEngagementData | null;
  loading: boolean;
  error: string;
}) {
  if (loading) return <TabLoading label="Loading batches..." />;
  if (error) return <TabError message={error} />;
  if (!data) return null;

  const rows = Array.isArray(data.batches) ? data.batches : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h3 className="text-base font-bold text-[#173B67]">Responsible Batches</h3>
        <p className="mt-1 text-xs text-slate-500">Batches associated with the trainer's teaching responsibilities.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyTab label="No responsible batches found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50">
              <tr>
                <TableHeader>Batch</TableHeader>
                <TableHeader>Course</TableHeader>
                <TableHeader>Students</TableHeader>
                <TableHeader>Dates</TableHeader>
                <TableHeader>Mode</TableHeader>
                <TableHeader>Status</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((batch: any) => (
                <tr key={batch.id}>
                  <TableCell><span className="font-semibold text-slate-800">{batch.name || "Unnamed batch"}</span></TableCell>
                  <TableCell>{batch.courseTitle || "Not available"}</TableCell>
                  <TableCell>{Number(batch.studentCount ?? 0)}</TableCell>
                  <TableCell>
                    <div className="text-xs leading-5">
                      <p>{formatTrainerDate(batch.startDate)}</p>
                      <p className="text-slate-400">to {formatTrainerDate(batch.endDate)}</p>
                    </div>
                  </TableCell>
                  <TableCell>{batch.mode || "Not specified"}</TableCell>
                  <TableCell><StatusBadge value={batch.status} /></TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TrainerMeetingsTab({
  data,
  loading,
  error,
}: {
  data: TrainerEngagementData | null;
  loading: boolean;
  error: string;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [organizerFilter, setOrganizerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<"All" | "Upcoming" | "Past">("All");

  const rows = Array.isArray(data?.meetings) ? data.meetings : [];

  const typeOptions = useMemo(
    () => Array.from(new Set(rows.map((meeting: any) => String(meeting.meetingType || "Not specified")))).sort(),
    [rows]
  );

  const courseOptions = useMemo(
    () => Array.from(new Set(rows.map((meeting: any) => String(meeting.courseTitle || "No course")))).sort(),
    [rows]
  );

  const batchOptions = useMemo(
    () => Array.from(new Set(rows.map((meeting: any) => String(meeting.batchName || "No batch")))).sort(),
    [rows]
  );

  const organizerOptions = useMemo(
    () => Array.from(new Set(rows.map((meeting: any) => getPersonLabel(meeting.organizer) || "Not available"))).sort(),
    [rows]
  );

  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((meeting: any) => String(meeting.status || "Not specified")))).sort(),
    [rows]
  );

  const filteredMeetings = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = Date.now();

    return rows.filter((meeting: any) => {
      const course = String(meeting.courseTitle || "No course");
      const batch = String(meeting.batchName || "No batch");
      const type = String(meeting.meetingType || "Not specified");
      const status = String(meeting.status || "Not specified");
      const organizer = getPersonLabel(meeting.organizer) || "Not available";
      const text = [meeting.title, meeting.description, course, batch, type, status, organizer]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const start = meeting.startAt ? new Date(meeting.startAt).getTime() : 0;

      const matchesSearch = !query || text.includes(query);
      const matchesType = typeFilter === "All" || type === typeFilter;
      const matchesCourse = courseFilter === "All" || course === courseFilter;
      const matchesBatch = batchFilter === "All" || batch === batchFilter;
      const matchesOrganizer = organizerFilter === "All" || organizer === organizerFilter;
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesDate =
        dateFilter === "All" ||
        (dateFilter === "Upcoming" && start >= now) ||
        (dateFilter === "Past" && start < now);

      return (
        matchesSearch &&
        matchesType &&
        matchesCourse &&
        matchesBatch &&
        matchesOrganizer &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [rows, search, typeFilter, courseFilter, batchFilter, organizerFilter, statusFilter, dateFilter]);

  function clearFilters() {
    setSearch("");
    setTypeFilter("All");
    setCourseFilter("All");
    setBatchFilter("All");
    setOrganizerFilter("All");
    setStatusFilter("All");
    setDateFilter("All");
  }

  if (loading) return <TabLoading label="Loading meetings..." />;
  if (error) return <TabError message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-base font-bold text-[#173B67]">Trainer Meetings</h3>
              <p className="mt-1 text-xs text-slate-500">
                Meetings returned by the trainer engagement service. Filters operate on the complete loaded set.
              </p>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="w-fit rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Search</label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Meeting / Course / Batch / Scheduled By"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Type</label>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400">
                <option value="All">All Types</option>
                {typeOptions.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400">
                <option value="All">All Statuses</option>
                {statusOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Course</label>
              <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400">
                <option value="All">All Courses</option>
                {courseOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Batch</label>
              <select value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400">
                <option value="All">All Batches</option>
                {batchOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Scheduled By</label>
              <select value={organizerFilter} onChange={(event) => setOrganizerFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400">
                <option value="All">All Organizers</option>
                {organizerOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Date</label>
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as "All" | "Upcoming" | "Past")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400">
                <option value="All">All Dates</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Past">Past</option>
              </select>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredMeetings.length}</span> of {rows.length} meetings.
          </div>
        </div>

        {filteredMeetings.length === 0 ? (
          <EmptyTab label="No meetings match the selected filters." />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMeetings.map((meeting: any) => (
              <div key={meeting.id} className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800">{meeting.title || "Untitled meeting"}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {meeting.courseTitle || "No course"}
                      {meeting.batchName ? ` · ${meeting.batchName}` : ""}
                    </p>
                    {meeting.description && (
                      <p className="mt-3 text-xs leading-5 text-slate-500">{meeting.description}</p>
                    )}
                  </div>
                  <StatusBadge value={meeting.status} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoMetric label="Start" value={formatTrainerDateTime(meeting.startAt)} />
                  <InfoMetric label="End" value={formatTrainerDateTime(meeting.endAt)} />
                  <InfoMetric label="Platform" value={meeting.meetingPlatform || "Not specified"} />
                  <InfoMetric label="Scheduled By" value={getPersonLabel(meeting.organizer) || "Not available"} />
                  <InfoMetric label="Participants" value={String(meeting.participantCount ?? 0)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PermissionBar({
  label,
  enabled,
  total,
}: {
  label: string;
  enabled: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((enabled / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-semibold text-slate-500">{enabled}/{total}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function PermissionBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      {enabled ? "Yes" : "No"}
    </span>
  );
}

function StatusBadge({ value }: { value?: string | null }) {
  const normalized = String(value || "Not specified").toUpperCase();
  const positive = ["ACTIVE", "SCHEDULED", "COMPLETED", "CONFIRMED"].includes(normalized);
  const negative = ["CANCELLED", "CANCELED", "INACTIVE"].includes(normalized);

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? "bg-emerald-50 text-emerald-700" : negative ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
      {String(value || "Not specified")}
    </span>
  );
}

function InfoMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-400">{label}</p>
        {icon ? <span className="text-slate-500">{icon}</span> : null}
      </div>
      <p className="mt-1 break-words text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function TabLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center">
      <div className="text-center">
        <Loader2 size={28} className="mx-auto animate-spin text-orange-500" />
        <p className="mt-3 text-sm font-semibold text-slate-600">{label}</p>
      </div>
    </div>
  );
}

function TabError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <p className="text-sm font-semibold text-red-800">Unable to load trainer data</p>
      <p className="mt-1 text-xs leading-5 text-red-700">{message}</p>
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
    </div>
  );
}

function formatTrainerDate(value: string | null | undefined) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN");
}

function formatTrainerDateTime(value: string | null | undefined) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* ============================================================
   TRAINER FORM MODAL
============================================================ */

function TrainerFormModal({
  title,
  subtitle,
  form,
  setForm,
  onClose,
  onSubmit,
  submitLabel,
  isEdit = false,
  saving,
}: {
  title: string;
  subtitle: string;
  form: TrainerForm;
  setForm: React.Dispatch<
    React.SetStateAction<TrainerForm>
  >;
  onClose: () => void;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>
  ) => void | Promise<void>;
  submitLabel: string;
  isEdit?: boolean;
  saving: boolean;
}) {
  const updateForm = (
    field: keyof TrainerForm,
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  };

  return (
    <ModalOverlay
      onClose={onClose}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <ModalHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
        />

        <form
          onSubmit={onSubmit}
        >
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <FormField
              label="Full Name"
              required
              value={
                form.name
              }
              onChange={(
                value
              ) =>
                updateForm(
                  "name",
                  value
                )
              }
              placeholder="Enter trainer name"
            />

            <FormField
              label="Email"
              type="email"
              required
              value={
                form.email
              }
              onChange={(
                value
              ) =>
                updateForm(
                  "email",
                  value
                )
              }
              placeholder="trainer@skce.in"
            />

            <FormField
              label="Phone"
              value={
                form.phone
              }
              onChange={(
                value
              ) =>
                updateForm(
                  "phone",
                  value
                )
              }
              placeholder="Enter phone number"
            />

            <FormField
              label="Experience"
              value={
                form.experience
              }
              onChange={(
                value
              ) =>
                updateForm(
                  "experience",
                  value
                )
              }
              placeholder="Example: 5 Years"
            />

            <div className="sm:col-span-2">
              <FormField
                label="Specialization"
                value={
                  form.specialization
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "specialization",
                    value
                  )
                }
                placeholder="Example: Java, Python, MS Office"
              />
            </div>

            <FormField
              label={
                isEdit
                  ? "New Password"
                  : "Password"
              }
              type="password"
              required={!isEdit}
              value={
                form.password
              }
              onChange={(
                value
              ) =>
                updateForm(
                  "password",
                  value
                )
              }
              placeholder={
                isEdit
                  ? "Leave blank to keep current password"
                  : "Create login password"
              }
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={
                  form.status
                }
                onChange={(e) =>
                  updateForm(
                    "status",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEdit ? (
                <Save size={17} />
              ) : (
                <UserPlus size={17} />
              )}

              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

/* ============================================================
   MODAL OVERLAY
============================================================ */

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (
          e.target ===
          e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   MODAL HEADER
============================================================ */

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
      <div>
        <h2 className="text-xl font-bold text-[#173B67]">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-orange-50 hover:text-orange-500"
      >
        <X size={18} />
      </button>
    </div>
  );
}

/* ============================================================
   MODAL FOOTER
============================================================ */

function ModalFooter({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="flex justify-end border-t border-slate-100 px-6 py-4">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        Close
      </button>
    </div>
  );
}

/* ============================================================
   DETAIL BOX
============================================================ */

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon,
  value,
  title,
  description,
}: {
  icon: React.ReactNode;
  value: number;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#173B67]">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TABLE HEADER
============================================================ */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </th>
  );
}

/* ============================================================
   TABLE CELL
============================================================ */

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-4 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}

/* ============================================================
   ACTION BUTTON
============================================================ */

function ActionButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
    >
      {children}
    </button>
  );
}

/* ============================================================
   MORE MENU ITEM
============================================================ */

function MoreMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-600"
    >
      {icon}
      <span>
        {label}
      </span>
    </button>
  );
}
