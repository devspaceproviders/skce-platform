"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

type DayOfWeek = (typeof DAYS)[number];

type Trainer = {
  profileId?: number;
  id?: number;
  name: string;
  email: string;
  specialization?: string | null;
  status?: string;
};

type Availability = {
  id: number;
  trainerId: number;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  timezone: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AvailabilityForm = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone: string;
  isActive: boolean;
};

const EMPTY_FORM: AvailabilityForm = {
  dayOfWeek: "MONDAY",
  startTime: "09:00",
  endTime: "10:00",
  timezone: "Asia/Kolkata",
  isActive: true,
};

function getTrainerId(trainer: Trainer): number {
  return Number(trainer.profileId ?? trainer.id);
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function formatDay(day: DayOfWeek): string {
  return (
    day.charAt(0) +
    day.slice(1).toLowerCase()
  );
}

function formatTime(minutes: number): string {
  const value = minutesToTime(minutes);
  const [hours, mins] = value.split(":").map(Number);

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour =
    hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHour}:${String(mins).padStart(
    2,
    "0"
  )} ${suffix}`;
}

export default function TrainerAvailabilityPage() {
  const router = useRouter();

  const [trainers, setTrainers] =
    useState<Trainer[]>([]);

  const [trainerId, setTrainerId] =
    useState("");

  const [availability, setAvailability] =
    useState<Availability[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [availabilityLoading, setAvailabilityLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingSlot, setEditingSlot] =
    useState<Availability | null>(null);

  const [form, setForm] =
    useState<AvailabilityForm>(
      EMPTY_FORM
    );

  const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      throw new Error(
        "Authentication required"
      );
    }

    const headers = new Headers(
      options.headers
    );

    headers.set(
      "Authorization",
      `Bearer ${token}`
    );

    if (
      options.body &&
      !(options.body instanceof FormData)
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

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
  };

  const selectedTrainer = useMemo(
    () =>
      trainers.find(
        (trainer) =>
          String(getTrainerId(trainer)) ===
          trainerId
      ),
    [trainers, trainerId]
  );

  const loadTrainers = async () => {
    try {
      setLoading(true);
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
        Array.isArray(json.data)
          ? json.data
          : []
      );
    } catch (err) {
      console.error(
        "Load trainers error:",
        err
      );

      if (
        err instanceof Error &&
        err.message !==
          "Authentication required"
      ) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (
    selectedTrainerId: string
  ) => {
    if (!selectedTrainerId) {
      setAvailability([]);
      return;
    }

    try {
      setAvailabilityLoading(true);
      setError("");
      setSuccess("");

      const response =
        await authenticatedFetch(
          `${API_URL}/admin/trainer-availability/${selectedTrainerId}`
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.message ||
            "Unable to load trainer availability."
        );
      }

      setAvailability(
        Array.isArray(json.data)
          ? json.data
          : []
      );
    } catch (err) {
      console.error(
        "Load trainer availability error:",
        err
      );

      if (
        err instanceof Error &&
        err.message !==
          "Authentication required"
      ) {
        setError(err.message);
      }

      setAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    void loadTrainers();
  }, []);

  useEffect(() => {
    void loadAvailability(trainerId);
  }, [trainerId]);

  const groupedAvailability =
    useMemo(() => {
      const grouped =
        DAYS.reduce(
          (result, day) => {
            result[day] =
              availability
                .filter(
                  (slot) =>
                    slot.dayOfWeek === day
                )
                .sort(
                  (a, b) =>
                    a.startMinute -
                    b.startMinute
                );

            return result;
          },
          {} as Record<
            DayOfWeek,
            Availability[]
          >
        );

      return grouped;
    }, [availability]);

  const openCreateForm = () => {
    setEditingSlot(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (
    slot: Availability
  ) => {
    setEditingSlot(slot);

    setForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: minutesToTime(
        slot.startMinute
      ),
      endTime: minutesToTime(
        slot.endMinute
      ),
      timezone:
        slot.timezone ||
        "Asia/Kolkata",
      isActive: slot.isActive,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingSlot(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!trainerId) {
      setError(
        "Please select a trainer."
      );
      return;
    }

    const startMinute =
      timeToMinutes(form.startTime);

    const endMinute =
      timeToMinutes(form.endTime);

    if (
      !Number.isFinite(startMinute) ||
      !Number.isFinite(endMinute)
    ) {
      setError(
        "Please enter valid start and end times."
      );
      return;
    }

    if (endMinute <= startMinute) {
      setError(
        "End time must be later than start time."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const body = {
        dayOfWeek:
          form.dayOfWeek,
        startMinute,
        endMinute,
        timezone:
          form.timezone.trim() ||
          "Asia/Kolkata",
        isActive:
          form.isActive,
      };

      const url = editingSlot
        ? `${API_URL}/admin/trainer-availability/slot/${editingSlot.id}`
        : `${API_URL}/admin/trainer-availability/${trainerId}`;

      const method = editingSlot
        ? "PUT"
        : "POST";

      const response =
        await authenticatedFetch(
          url,
          {
            method,
            body: JSON.stringify(body),
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
            "Unable to save trainer availability."
        );
      }

      setSuccess(
        editingSlot
          ? "Trainer availability updated successfully."
          : "Trainer availability created successfully."
      );

      setShowForm(false);
      setEditingSlot(null);
      setForm(EMPTY_FORM);

      await loadAvailability(
        trainerId
      );
    } catch (err) {
      console.error(
        "Save trainer availability error:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Unable to save trainer availability.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAvailability =
    async (
      slot: Availability
    ) => {
      const confirmed =
        window.confirm(
          `Delete the ${formatDay(
            slot.dayOfWeek
          )} ${formatTime(
            slot.startMinute
          )} - ${formatTime(
            slot.endMinute
          )} availability slot?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await authenticatedFetch(
            `${API_URL}/admin/trainer-availability/slot/${slot.id}`,
            {
              method: "DELETE",
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
              "Unable to delete trainer availability."
          );
        }

        setSuccess(
          "Trainer availability deleted successfully."
        );

        await loadAvailability(
          trainerId
        );
      } catch (err) {
        console.error(
          "Delete trainer availability error:",
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : "Unable to delete trainer availability.";

        setError(message);
      } finally {
        setSaving(false);
      }
    };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/admin/trainers"
            )
          }
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trainers
        </button>

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white">
                <CalendarClock className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Trainer Availability
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage recurring weekly availability for trainers.
                </p>
              </div>
            </div>
          </div>

          {trainerId && (
            <button
              type="button"
              onClick={openCreateForm}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add Availability
            </button>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Check className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading trainers...
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Select Trainer
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Choose the trainer whose recurring availability you want to manage.
                </p>
              </div>

              <div>
                <label
                  htmlFor="trainer"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <UserRound className="h-4 w-4" />
                  Trainer
                </label>

                <select
                  id="trainer"
                  value={trainerId}
                  onChange={(event) => {
                    setTrainerId(
                      event.target.value
                    );
                    setAvailability([]);
                    setError("");
                    setSuccess("");
                    setShowForm(false);
                    setEditingSlot(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">
                    Select a trainer
                  </option>

                  {trainers.map(
                    (trainer) => {
                      const id =
                        getTrainerId(
                          trainer
                        );

                      return (
                        <option
                          key={id}
                          value={id}
                        >
                          {trainer.name} —{" "}
                          {trainer.email}
                        </option>
                      );
                    }
                  )}
                </select>
              </div>

              {selectedTrainer && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {selectedTrainer.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {selectedTrainer.email}
                      </p>

                      {selectedTrainer.specialization && (
                        <p className="mt-1 text-xs text-slate-400">
                          {selectedTrainer.specialization}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {trainerId ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Weekly Availability
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Recurring time slots used when planning trainer meetings.
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {availability.length}{" "}
                    {availability.length === 1
                      ? "slot"
                      : "slots"}
                  </span>
                </div>

                {availabilityLoading ? (
                  <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading availability...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {DAYS.map(
                      (day) => {
                        const slots =
                          groupedAvailability[
                            day
                          ];

                        return (
                          <div
                            key={day}
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                  <CalendarClock className="h-5 w-5" />
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {formatDay(
                                      day
                                    )}
                                  </p>

                                  <p className="text-xs text-slate-400">
                                    {slots.length ===
                                    0
                                      ? "No availability configured"
                                      : `${slots.length} ${
                                          slots.length ===
                                          1
                                            ? "slot"
                                            : "slots"
                                        }`}
                                  </p>
                                </div>
                              </div>

                              {slots.length >
                                0 && (
                                <div className="flex flex-col gap-2">
                                  {slots.map(
                                    (
                                      slot
                                    ) => (
                                      <div
                                        key={
                                          slot.id
                                        }
                                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:min-w-[420px] sm:flex-row sm:items-center sm:justify-between"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Clock3 className="h-4 w-4 text-orange-500" />

                                          <span className="text-sm font-semibold text-slate-800">
                                            {formatTime(
                                              slot.startMinute
                                            )}{" "}
                                            -{" "}
                                            {formatTime(
                                              slot.endMinute
                                            )}
                                          </span>

                                          <span
                                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                              slot.isActive
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-200 text-slate-500"
                                            }`}
                                          >
                                            {slot.isActive
                                              ? "Active"
                                              : "Inactive"}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openEditForm(
                                                slot
                                              )
                                            }
                                            disabled={
                                              saving
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              void deleteAvailability(
                                                slot
                                              )
                                            }
                                            disabled={
                                              saving
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            ) : (
              <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <CalendarClock className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Select a trainer
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Choose a trainer above to view and manage their weekly availability.
                </p>
              </section>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#173B67]">
                  {editingSlot
                    ? "Edit Availability"
                    : "Add Availability"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Configure a recurring weekly time slot.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-orange-50 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
            >
              <div className="space-y-5 p-6">
                <div>
                  <label
                    htmlFor="availability-day"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Day
                  </label>

                  <select
                    id="availability-day"
                    value={form.dayOfWeek}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          dayOfWeek:
                            event.target
                              .value as DayOfWeek,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    {DAYS.map(
                      (day) => (
                        <option
                          key={day}
                          value={day}
                        >
                          {formatDay(day)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="availability-start"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Start Time
                    </label>

                    <input
                      id="availability-start"
                      type="time"
                      required
                      value={
                        form.startTime
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            startTime:
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="availability-end"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      End Time
                    </label>

                    <input
                      id="availability-end"
                      type="time"
                      required
                      value={
                        form.endTime
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            endTime:
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="availability-timezone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Timezone
                  </label>

                  <input
                    id="availability-timezone"
                    type="text"
                    value={
                      form.timezone
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          timezone:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Asia/Kolkata"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          isActive:
                            event.target
                              .checked,
                        })
                      )
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Active availability
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Active slots can be considered when scheduling trainer meetings.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {editingSlot
                    ? "Update Availability"
                    : "Save Availability"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}