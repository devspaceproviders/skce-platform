"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Layers,
  Users,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Clock3,
  GraduationCap,
  Save,
} from "lucide-react";

type Batch = {
  id: string;
  name: string;
  course: string;
  students: number;
  mode: "Online" | "Offline";
  status: "Active" | "Completed";
};

const INITIAL_BATCHES: Batch[] = [
  {
    id: "BATCH-FS-08",
    name: "BATCH-FS-08",
    course: "Full Stack Web Development",
    students: 18,
    mode: "Online",
    status: "Active",
  },
  {
    id: "BATCH-JAVA-06",
    name: "BATCH-JAVA-06",
    course: "Spring Boot REST APIs",
    students: 14,
    mode: "Offline",
    status: "Active",
  },
  {
    id: "BATCH-FS-09",
    name: "BATCH-FS-09",
    course: "Full Stack Web Development",
    students: 12,
    mode: "Online",
    status: "Active",
  },
  {
    id: "BATCH-FS-05",
    name: "BATCH-FS-05",
    course: "Full Stack Web Development",
    students: 20,
    mode: "Online",
    status: "Completed",
  },
];

const STORAGE_KEY = "skce_trainer_batches";

function createBatch(): Batch {
  const id = `BATCH-${Date.now()}`;

  return {
    id,
    name: id,
    course: "",
    students: 0,
    mode: "Online",
    status: "Active",
  };
}

export default function MyBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Batch | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        setBatches(JSON.parse(stored));
      } catch {
        setBatches(INITIAL_BATCHES);
      }
    } else {
      setBatches(INITIAL_BATCHES);
    }
  }, []);

  const startEdit = (batch: Batch) => {
    if (editingId) {
      alert("Please finish editing the current batch first.");
      return;
    }

    setEditingId(batch.id);
    setDraft({ ...batch });
    setSaved(false);
  };

  const addBatch = () => {
    if (editingId) {
      alert("Please finish editing the current batch first.");
      return;
    }

    const newBatch = createBatch();

    setBatches((previous) => [...previous, newBatch]);
    setEditingId(newBatch.id);
    setDraft(newBatch);
    setSaved(false);
  };

  const cancelEdit = () => {
    if (draft && draft.students === 0) {
      const exists = batches.some((batch) => batch.id === draft.id);

      if (exists && draft.course === "") {
        setBatches((previous) =>
          previous.filter((batch) => batch.id !== draft.id)
        );
      }
    }

    setEditingId(null);
    setDraft(null);
  };

  const saveBatch = () => {
    if (!draft) return;

    if (!draft.name.trim()) {
      alert("Please enter batch name.");
      return;
    }

    if (!draft.course.trim()) {
      alert("Please enter course name.");
      return;
    }

    setBatches((previous) =>
      previous.map((batch) =>
        batch.id === draft.id
          ? {
              ...draft,
              name: draft.name.trim(),
              course: draft.course.trim(),
            }
          : batch
      )
    );

    setEditingId(null);
    setDraft(null);
    setSaved(false);
  };

  const removeBatch = (id: string) => {
    const batch = batches.find((item) => item.id === id);

    if (!batch) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove "${batch.name}"?`
    );

    if (!confirmed) return;

    setBatches((previous) => previous.filter((item) => item.id !== id));
    localStorage.removeItem(`skce_batch_students_${id}`);
    setSaved(false);
  };

  const handleSave = () => {
    if (editingId) {
      alert("Please finish editing the current batch first.");
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
    setSaved(true);
  };

  const activeCount = batches.filter((batch) => batch.status === "Active").length;
  const completedCount = batches.filter(
    (batch) => batch.status === "Completed"
  ).length;
  const totalStudents = batches.reduce(
    (total, batch) => total + batch.students,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-7 rounded-2xl bg-[#173B67] p-6 text-white shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
                <GraduationCap size={17} />
                Trainer Portal
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                My Batches
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Manage your current and previous training batches.
              </p>
            </div>

            <button
              onClick={addBatch}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              <Plus size={17} />
              Add Batch
            </button>
          </div>
        </div>

        {/* Development notice */}
        <div className="mb-7 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-700">
          <Clock3 className="mt-0.5 shrink-0 text-orange-500" size={18} />
          <div>
            <p className="font-semibold text-slate-900">Development Mode</p>
            <p className="mt-0.5 leading-6">
              Batch data is currently stored in browser local storage. Once
              the backend is connected, batch assignments and student counts
              will be managed from the server.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<Layers size={20} />}
            value={batches.length}
            label="Total Batches"
          />
          <SummaryCard
            icon={<GraduationCap size={20} />}
            value={activeCount}
            label="Active Batches"
          />
          <SummaryCard
            icon={<Clock3 size={20} />}
            value={completedCount}
            label="Completed Batches"
          />
          <SummaryCard
            icon={<Users size={20} />}
            value={totalStudents}
            label="Total Students"
          />
        </div>

        {/* Batch list */}
        {batches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <Layers size={25} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No batches available
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Add a batch to begin managing your trainer schedule and students.
            </p>
            <button
              onClick={addBatch}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
            >
              <Plus size={16} />
              Add Batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {batches.map((batch) => {
              const isEditing = editingId === batch.id;
              const currentBatch =
                isEditing && draft ? draft : batch;

              return (
                <div
                  key={batch.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition sm:p-6 ${
                    isEditing
                      ? "border-orange-300 ring-2 ring-orange-100"
                      : "border-slate-200 hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  {isEditing ? (
                    <div>
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                          <Pencil size={19} />
                        </div>
                        <div>
                          <h2 className="font-bold text-[#173B67]">
                            Edit Batch
                          </h2>
                          <p className="text-xs text-slate-500">
                            Update the batch information below.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-slate-700">
                            Batch Name
                          </label>
                          <input
                            value={currentBatch.name}
                            onChange={(e) =>
                              setDraft({
                                ...currentBatch,
                                name: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            placeholder="Batch name"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-slate-700">
                            Course
                          </label>
                          <input
                            value={currentBatch.course}
                            onChange={(e) =>
                              setDraft({
                                ...currentBatch,
                                course: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            placeholder="Course name"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-700">
                              Mode
                            </label>
                            <select
                              value={currentBatch.mode}
                              onChange={(e) =>
                                setDraft({
                                  ...currentBatch,
                                  mode: e.target.value as
                                    | "Online"
                                    | "Offline",
                                })
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            >
                              <option value="Online">Online</option>
                              <option value="Offline">Offline</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-700">
                              Status
                            </label>
                            <select
                              value={currentBatch.status}
                              onChange={(e) =>
                                setDraft({
                                  ...currentBatch,
                                  status: e.target.value as
                                    | "Active"
                                    | "Completed",
                                })
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            >
                              <option value="Active">Active</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-2">
                        <button
                          onClick={saveBatch}
                          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                        >
                          <Check size={16} />
                          Save Batch
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                            <Layers size={21} />
                          </div>

                          <div className="min-w-0">
                            <h2 className="truncate text-base font-bold text-[#173B67]">
                              {batch.name}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                              {batch.course}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            batch.status === "Active"
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {batch.status}
                        </span>
                      </div>

                      <div className="my-5 h-px bg-slate-100" />

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Users size={16} />
                            {batch.students} students
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{batch.mode}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => startEdit(batch)}
                            title="Edit batch"
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-[#173B67] hover:text-[#173B67]"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            onClick={() => removeBatch(batch.id)}
                            title="Remove batch"
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>

                          <Link
                            href={`/dashboard/trainer/my-batches/batch-detail/${encodeURIComponent(
                              batch.id
                            )}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-500 px-3 text-xs font-bold text-white transition hover:bg-orange-600"
                          >
                            View Batch
                            <ChevronRight size={15} />
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Save changes */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={handleSave}
            disabled={!!editingId}
            className={`inline-flex w-fit items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition ${
              editingId
                ? "cursor-not-allowed bg-slate-300"
                : "bg-[#173B67] hover:bg-[#123052]"
            }`}
          >
            <Save size={16} />
            Save Changes
          </button>

          {saved && (
            <span className="text-sm font-semibold text-green-600">
              ✓ Changes saved successfully
            </span>
          )}
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-[#173B67]">{value}</p>
          <p className="mt-0.5 text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
