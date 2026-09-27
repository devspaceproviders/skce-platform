"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  CheckCircle2,
  XCircle,
  Award,
  CalendarDays,
  RefreshCw,
  Loader2,
  Camera,
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [uploadingPhotoId, setUploadingPhotoId] =
    useState<number | null>(null);

  const [photoError, setPhotoError] = useState("");

  const [photoTargetProfileId, setPhotoTargetProfileId] =
    useState<number | null>(null);

  const photoInputRef =
    useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | TrainerStatus>("All");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedTrainer, setSelectedTrainer] =
    useState<Trainer | null>(null);

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [menuPosition, setMenuPosition] = useState({
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
      throw new Error("Authentication required");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("student");
      localStorage.removeItem("studentId");
      router.push("/admin/login");
      throw new Error("Authentication required");
    }

    return response;
  }

  const toTrainer = (value: any): Trainer => ({
    profileId: Number(value.profileId ?? value.id),
    id: value.displayId || `TR${String(value.profileId ?? value.id).padStart(3, "0")}`,
    name: value.name || "",
    email: value.email || "",
    phone: value.phone || "",
    specialization: value.specialization || "",
    experience:
      value.experience === null || value.experience === undefined || value.experience === ""
        ? ""
        : `${value.experience} Years`,
    batches: Number(value.batches || 0),
    joinedDate: value.joinedDate
      ? new Date(value.joinedDate).toLocaleDateString("en-IN")
      : "",
    status: value.status === "Active" ? "Active" : "Inactive",
    profilePhotoUrl: value.profilePhotoUrl || null,
  });

  const loadTrainers = async () => {
    try {
      setError("");
      const response = await authenticatedFetch(`${API_URL}/admin/trainers`);
      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Unable to load trainers.");
      }

      setTrainers((json.data || []).map(toTrainer));
    } catch (err) {
      console.error("Load trainers error:", err);
      setError(err instanceof Error ? err.message : "Unable to load trainers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTrainers();
  }, []);


  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredTrainers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return trainers.filter((trainer) => {
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
        trainer.phone.includes(search) ||
        trainer.specialization
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        trainer.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [trainers, search, statusFilter]);

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const activeTrainers = trainers.filter(
    (trainer) =>
      trainer.status === "Active"
  ).length;

  const inactiveTrainers = trainers.filter(
    (trainer) =>
      trainer.status === "Inactive"
  ).length;

  const totalBatches = trainers.reduce(
    (total, trainer) =>
      total + trainer.batches,
    0
  );

  /* ==========================================================
     FORM
  ========================================================== */

  const updateForm = (
    field: keyof TrainerForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* ==========================================================
     CREATE TRAINER
  ========================================================== */

  const createTrainer = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter trainer name.");
      return;
    }

    if (!form.email.trim()) {
      alert("Please enter trainer email.");
      return;
    }

    if (!form.password.trim()) {
      alert("Please create a password.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/admin/trainers`,
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            specialization: form.specialization.trim() || null,
            experience: form.experience.trim()
              ? Number.parseInt(form.experience.replace(/\D/g, ""), 10)
              : null,
            password: form.password,
            isActive: form.status === "Active",
          }),
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Unable to create trainer.");
      }

      setForm(EMPTY_FORM);
      setShowAddModal(false);
      await loadTrainers();
    } catch (err) {
      console.error("Create trainer error:", err);
      const message =
        err instanceof Error ? err.message : "Unable to create trainer.";
      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     EDIT TRAINER
  ========================================================== */

  const openEditModal = (
    trainer: Trainer
  ) => {
    setOpenMenuId(null);
    setSelectedTrainer(trainer);

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

  const updateTrainer = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedTrainer) {
      return;
    }

    if (!form.name.trim()) {
      alert("Please enter trainer name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/admin/trainers/${selectedTrainer.profileId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            specialization: form.specialization.trim() || null,
            experience: form.experience.trim()
              ? Number.parseInt(form.experience.replace(/\D/g, ""), 10)
              : null,
            password: form.password.trim() || undefined,
            isActive: form.status === "Active",
          }),
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Unable to update trainer.");
      }

      setShowEditModal(false);
      setSelectedTrainer(null);
      setForm(EMPTY_FORM);
      await loadTrainers();
    } catch (err) {
      console.error("Update trainer error:", err);
      const message =
        err instanceof Error ? err.message : "Unable to update trainer.";
      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     STATUS
  ========================================================== */

  const toggleStatus = async (
    trainer: Trainer
  ) => {
    setOpenMenuId(null);
    setSaving(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/admin/trainers/${trainer.profileId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: trainer.status !== "Active",
          }),
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Unable to update trainer status.");
      }

      await loadTrainers();
    } catch (err) {
      console.error("Toggle trainer status error:", err);
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

  /* ==========================================================
     VIEW
  ========================================================== */

  const openViewModal = (
    trainer: Trainer
  ) => {
    setOpenMenuId(null);
    setSelectedTrainer(trainer);
    setShowViewModal(true);
  };

  /* ==========================================================
     MORE MENU
  ========================================================== */

  const openMoreMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    trainerId: string
  ) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    const menuWidth = 235;
    const menuHeight = 170;
    const gap = 8;
    const padding = 12;

    let left =
      rect.right - menuWidth;

    if (left < padding) {
      left = padding;
    }

    if (
      left + menuWidth >
      window.innerWidth - padding
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
      window.innerHeight - padding
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

  /* ==========================================================
     MORE ACTIONS
  ========================================================== */

  const handleMoreAction = async (
    action:
      | "reset-password"
      | "activity",
    trainer: Trainer
  ) => {
    setOpenMenuId(null);

    if (action === "activity") {
      alert(
        `Trainer activity for ${trainer.name} is not available in the current data model.`
      );
      return;
    }

    const newPassword = window.prompt(
      `Enter a new password for ${trainer.name}:`
    );

    if (newPassword === null) {
      return;
    }

    if (newPassword.trim().length < 8) {
      alert("Password must contain at least 8 characters.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/admin/trainers/${trainer.profileId}/reset-password`,
        {
          method: "POST",
          body: JSON.stringify({
            password: newPassword,
          }),
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Unable to reset password.");
      }

      alert("Trainer password has been updated successfully.");
    } catch (err) {
      console.error("Reset trainer password error:", err);
      const message =
        err instanceof Error ? err.message : "Unable to reset password.";
      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     PROFILE PHOTO
  ========================================================== */

  const getPhotoUrl = (
    photoUrl?: string | null
  ): string | null => {
    if (!photoUrl) {
      return null;
    }

    if (
      photoUrl.startsWith("http://") ||
      photoUrl.startsWith("https://")
    ) {
      return photoUrl;
    }

    const backendUrl =
      API_URL.replace(/\/api\/?$/, "");

    return `${backendUrl}${
      photoUrl.startsWith("/") ? "" : "/"
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

  const uploadTrainerPhoto = async (
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

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);

    if (!allowedTypes.has(file.type)) {
      setPhotoError(
        "Please select a JPG, PNG, WEBP, or GIF image."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(
        "Profile photo must be 5 MB or smaller."
      );
      event.target.value = "";
      return;
    }

    try {
      setUploadingPhotoId(profileId);

      const formData = new FormData();
      formData.append("photo", file);

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
        json?.data?.profilePhotoUrl ||
        null;

      setTrainers((current) =>
        current.map((trainer) =>
          trainer.profileId === profileId
            ? {
                ...trainer,
                profilePhotoUrl,
              }
            : trainer
        )
      );

      setSelectedTrainer((current) =>
        current &&
        current.profileId === profileId
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

      setPhotoError(message);
      alert(message);
    } finally {
      setUploadingPhotoId(null);
      setPhotoTargetProfileId(null);
      event.target.value = "";
    }
  };

  /* ==========================================================
     CLOSE
  ========================================================== */

  const closeAll = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
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
        onChange={uploadTrainerPhoto}
      />

      <div className="mx-auto max-w-[1500px]">

        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ====================================================
            HEADER
        ==================================================== */}

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
              onClick={() => void loadTrainers()}
              disabled={loading || saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setShowAddModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
            >
              <UserPlus size={18} />
              Add Trainer
            </button>
          </div>
        </div>

        {/* ====================================================
            SUMMARY CARDS
        ==================================================== */}

        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<Users size={21} />}
            value={trainers.length}
            title="Total Trainers"
            description="Trainers in the system"
          />

          <SummaryCard
            icon={
              <CheckCircle2 size={21} />
            }
            value={activeTrainers}
            title="Active Trainers"
            description="Currently active"
          />

          <SummaryCard
            icon={<XCircle size={21} />}
            value={inactiveTrainers}
            title="Inactive Trainers"
            description="Currently inactive"
          />

          <SummaryCard
            icon={
              <CalendarDays size={21} />
            }
            value={totalBatches}
            title="Assigned Batches"
            description="Across all trainers"
          />
        </div>

        {/* ====================================================
            TRAINER TABLE
        ==================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* SEARCH / FILTER */}

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
              value={statusFilter}
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

          {/* TABLE */}

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Loading trainers...
              </div>
            </div>
          ) : filteredTrainers.length === 0 ? (
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
                statusFilter !== "All"
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
                        {/* TRAINER */}

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
                                    ) || undefined
                                  }
                                  alt={`${trainer.name} profile`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold">
                                  {trainer.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">
                                {trainer.name}
                              </p>

                              <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500">
                                {trainer.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* ID */}

                        <TableCell>
                          <span className="font-semibold text-[#173B67]">
                            {trainer.id}
                          </span>
                        </TableCell>

                        {/* PHONE */}

                        <TableCell>
                          {trainer.phone ||
                            "Not provided"}
                        </TableCell>

                        {/* SPECIALIZATION */}

                        <TableCell>
                          <span className="inline-flex max-w-[190px] rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                            {trainer.specialization ||
                              "Not specified"}
                          </span>
                        </TableCell>

                        {/* EXPERIENCE */}

                        <TableCell>
                          {trainer.experience ||
                            "Not specified"}
                        </TableCell>

                        {/* BATCHES */}

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                              <CalendarDays
                                size={15}
                              />
                            </span>

                            <span className="font-medium">
                              {trainer.batches}
                            </span>
                          </div>
                        </TableCell>

                        {/* STATUS */}

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              trainer.status ===
                              "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {trainer.status}
                          </span>
                        </TableCell>

                        {/* ACTIONS */}

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
                              <Pencil size={16} />
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
                                <Camera size={16} />
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

        {/* ====================================================
            DEVELOPMENT NOTICE
        ==================================================== */}

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-semibold text-blue-800">
            Trainer Accounts
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700/80">
            Trainer accounts are stored in PostgreSQL and use the same
            authentication system as the rest of the application.
            Batch assignment and activity history will be connected separately.
          </p>
        </div>
      </div>

      {/* ======================================================
          FLOATING MORE MENU
      ====================================================== */}

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
                  item.id === openMenuId
              );

            if (!trainer) {
              return null;
            }

            return (
              <>
                <MoreMenuItem
                  icon={
                    <KeyRound size={17} />
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
                    <Activity size={17} />
                  }
                  label="View Trainer Activity"
                  onClick={() =>
                    handleMoreAction(
                      "activity",
                      trainer
                    )
                  }
                />

                <MoreMenuItem
                  icon={
                    trainer.status ===
                    "Active" ? (
                      <XCircle size={17} />
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

      {/* ======================================================
          ADD TRAINER
      ====================================================== */}

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

      {/* ======================================================
          EDIT TRAINER
      ====================================================== */}

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

      {/* ======================================================
          VIEW TRAINER
      ====================================================== */}

      {showViewModal &&
        selectedTrainer && (
          <ModalOverlay onClose={closeAll}>
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <ModalHeader
                title="Trainer Details"
                subtitle="Complete trainer information."
                onClose={closeAll}
              />

              <div className="p-6">

                {/* PROFILE HEADER */}

                <div className="mb-6 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-orange-500">
                    {getPhotoUrl(
                      selectedTrainer.profilePhotoUrl
                    ) ? (
                      <img
                        src={
                          getPhotoUrl(
                            selectedTrainer.profilePhotoUrl
                          ) || undefined
                        }
                        alt={`${selectedTrainer.name} profile`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold">
                        {selectedTrainer.name
                          .charAt(0)
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
                        <Camera size={14} />
                      )}
                      Change Photo
                    </button>
                  </div>
                </div>

                {/* DETAILS */}

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

                {/* ACCOUNT INFO */}

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
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <ModalHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
        />

        <form onSubmit={onSubmit}>
          <div className="grid gap-5 p-6 sm:grid-cols-2">

            <FormField
              label="Full Name"
              required
              value={form.name}
              onChange={(value) =>
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
              value={form.email}
              onChange={(value) =>
                updateForm(
                  "email",
                  value
                )
              }
              placeholder="trainer@skce.in"
            />

            <FormField
              label="Phone"
              value={form.phone}
              onChange={(value) =>
                updateForm(
                  "phone",
                  value
                )
              }
              placeholder="Enter phone number"
            />

            <FormField
              label="Experience"
              value={form.experience}
              onChange={(value) =>
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
                onChange={(value) =>
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
              value={form.password}
              onChange={(value) =>
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

            {/* STATUS */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={form.status}
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

          {/* FOOTER */}

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
        placeholder={placeholder}
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
      <span>{label}</span>
    </button>
  );
}