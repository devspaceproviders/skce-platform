"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Users,
  Layers,
  Mail,
  Phone,
  Hash,
  Save,
  GraduationCap,
  Clock3,
} from "lucide-react";

type Student = {
  id: string;
  name: string;
  roll: string;
  email: string;
  phone: string;
};

const SEED_STUDENTS: Record<string, Student[]> = {
  "BATCH-FS-08": [
    {
      id: "1",
      name: "Ananya Reddy",
      roll: "FS08-01",
      email: "ananya@example.com",
      phone: "+91 98765 10001",
    },
    {
      id: "2",
      name: "Vikram Rao",
      roll: "FS08-02",
      email: "vikram@example.com",
      phone: "+91 98765 10002",
    },
    {
      id: "3",
      name: "Sneha Patil",
      roll: "FS08-03",
      email: "sneha@example.com",
      phone: "+91 98765 10003",
    },
  ],
  "BATCH-JAVA-06": [
    {
      id: "4",
      name: "Karthik Iyer",
      roll: "JAVA06-01",
      email: "karthik@example.com",
      phone: "+91 98765 10004",
    },
    {
      id: "5",
      name: "Meera Nair",
      roll: "JAVA06-02",
      email: "meera@example.com",
      phone: "+91 98765 10005",
    },
  ],
  "BATCH-FS-09": [
    {
      id: "6",
      name: "Rahul Kumar",
      roll: "FS09-01",
      email: "rahul@example.com",
      phone: "+91 98765 10006",
    },
    {
      id: "7",
      name: "Priya Sharma",
      roll: "FS09-02",
      email: "priya@example.com",
      phone: "+91 98765 10007",
    },
  ],
  "BATCH-FS-05": [
    {
      id: "8",
      name: "Arjun Reddy",
      roll: "FS05-01",
      email: "arjun@example.com",
      phone: "+91 98765 10008",
    },
  ],
};

function createStudent(): Student {
  return {
    id: crypto.randomUUID(),
    name: "",
    roll: "",
    email: "",
    phone: "",
  };
}

export default function BatchDetailPage() {
  const router = useRouter();
  const params = useParams();

  const batchId = decodeURIComponent(params.batchId as string);
  const storageKey = `skce_batch_students_${batchId}`;

  const [students, setStudents] = useState<Student[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        setStudents(JSON.parse(stored));
      } catch {
        setStudents(SEED_STUDENTS[batchId] || []);
      }
    } else {
      setStudents(SEED_STUDENTS[batchId] || []);
    }
  }, [batchId, storageKey]);

  const startEdit = (student: Student) => {
    if (editingId) {
      alert("Please finish editing the current student first.");
      return;
    }

    setEditingId(student.id);
    setDraft({ ...student });
    setSaved(false);
  };

  const addStudent = () => {
    if (editingId) {
      alert("Please finish editing the current student first.");
      return;
    }

    const newStudent = createStudent();

    setStudents((previous) => [...previous, newStudent]);
    setEditingId(newStudent.id);
    setDraft(newStudent);
    setSaved(false);
  };

  const cancelEdit = () => {
    if (
      draft &&
      !draft.name.trim() &&
      !draft.roll.trim() &&
      !draft.email.trim() &&
      !draft.phone.trim()
    ) {
      setStudents((previous) =>
        previous.filter((student) => student.id !== draft.id)
      );
    }

    setEditingId(null);
    setDraft(null);
  };

  const confirmEdit = () => {
    if (!draft) return;

    if (!draft.name.trim()) {
      alert("Please enter student name.");
      return;
    }

    if (!draft.roll.trim()) {
      alert("Please enter roll number.");
      return;
    }

    setStudents((previous) =>
      previous.map((student) =>
        student.id === draft.id
          ? {
              ...draft,
              name: draft.name.trim(),
              roll: draft.roll.trim(),
              email: draft.email.trim(),
              phone: draft.phone.trim(),
            }
          : student
      )
    );

    setEditingId(null);
    setDraft(null);
    setSaved(false);
  };

  const removeStudent = (student: Student) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${student.name}" from this batch?`
    );

    if (!confirmed) return;

    setStudents((previous) =>
      previous.filter((item) => item.id !== student.id)
    );

    if (editingId === student.id) {
      setEditingId(null);
      setDraft(null);
    }

    setSaved(false);
  };

  const handleSave = async () => {
    if (editingId) {
      alert("Please finish editing the student first.");
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      localStorage.setItem(storageKey, JSON.stringify(students));
      setSaved(true);
    } catch (error) {
      console.error(error);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Back */}
        <button
          onClick={() => router.push("/dashboard/trainer/my-batches")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#173B67]"
        >
          <ArrowLeft size={16} />
          Back to My Batches
        </button>

        {/* Header */}
        <div className="mb-7 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
                <GraduationCap size={17} />
                Trainer Portal
              </div>

              <div className="flex items-center gap-2">
                <Layers size={21} className="text-orange-300" />
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {batchId}
                </h1>
              </div>

              <p className="mt-2 text-sm text-blue-100">
                {students.length}{" "}
                {students.length === 1 ? "student" : "students"} enrolled in
                this batch.
              </p>
            </div>

            <button
              onClick={addStudent}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              <Plus size={17} />
              Add Student
            </button>
          </div>
        </div>

        {/* Development note */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-700">
          <Clock3 className="mt-0.5 shrink-0 text-orange-500" size={18} />
          <div>
            <p className="font-semibold text-slate-900">Development Mode</p>
            <p className="mt-0.5 leading-6">
              Student assignments are currently stored in browser local
              storage. They will be linked to the real student and batch
              records after backend integration.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Users size={20} />}
            value={students.length}
            label="Enrolled Students"
          />
          <SummaryCard
            icon={<Layers size={20} />}
            value={editingId ? 1 : 0}
            label="Currently Editing"
          />
          <SummaryCard
            icon={<Save size={20} />}
            value={saved ? 1 : 0}
            label="Saved Changes"
          />
        </div>

        {/* Students */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Batch Students
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Add, edit or remove students from this batch.
              </p>
            </div>

            {editingId && (
              <span className="inline-flex w-fit items-center rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">
                Finish the current edit before making another change
              </span>
            )}
          </div>

          {/* Desktop header */}
          <div className="hidden grid-cols-[1.4fr_0.8fr_1.5fr_1.2fr_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 lg:grid lg:px-6">
            <span>Name</span>
            <span>Roll No.</span>
            <span>Email</span>
            <span>Phone</span>
            <span className="text-right">Actions</span>
          </div>

          {students.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <Users size={29} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-800">
                No students in this batch
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Click “Add Student” to add the first student.
              </p>

              <button
                onClick={addStudent}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
              >
                <Plus size={16} />
                Add Student
              </button>
            </div>
          ) : (
            <div>
              {students.map((student, index) => {
                const isEditing = editingId === student.id;
                const row = isEditing && draft ? draft : student;

                return (
                  <div
                    key={student.id}
                    className={`border-b border-slate-100 px-4 py-4 last:border-b-0 sm:px-5 lg:grid lg:grid-cols-[1.4fr_0.8fr_1.5fr_1.2fr_1fr] lg:items-center lg:gap-4 lg:px-6 ${
                      isEditing ? "bg-orange-50/50" : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Name */}
                    <div className="mb-4 lg:mb-0">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                        Name
                      </label>

                      {isEditing ? (
                        <input
                          value={row.name}
                          onChange={(e) =>
                            setDraft({
                              ...row,
                              name: e.target.value,
                            })
                          }
                          placeholder="Full name"
                          className={inputClass}
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-xs font-bold text-white">
                            {student.name
                              ? student.name.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                          <span className="truncate text-sm font-semibold text-slate-800">
                            {student.name || "—"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Roll */}
                    <div className="mb-4 lg:mb-0">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                        Roll No.
                      </label>

                      {isEditing ? (
                        <input
                          value={row.roll}
                          onChange={(e) =>
                            setDraft({
                              ...row,
                              roll: e.target.value,
                            })
                          }
                          placeholder="Roll number"
                          className={inputClass}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          <Hash size={14} className="text-orange-500" />
                          {student.roll || "—"}
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="mb-4 min-w-0 lg:mb-0">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                        Email
                      </label>

                      {isEditing ? (
                        <input
                          value={row.email}
                          onChange={(e) =>
                            setDraft({
                              ...row,
                              email: e.target.value,
                            })
                          }
                          placeholder="Email"
                          type="email"
                          className={inputClass}
                        />
                      ) : (
                        <span className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-slate-600">
                          <Mail size={14} className="shrink-0 text-slate-400" />
                          <span className="truncate">
                            {student.email || "—"}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="mb-4 lg:mb-0">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                        Phone
                      </label>

                      {isEditing ? (
                        <input
                          value={row.phone}
                          onChange={(e) =>
                            setDraft({
                              ...row,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Phone"
                          className={inputClass}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {student.phone || "—"}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-start gap-2 lg:justify-end">
                      {isEditing ? (
                        <>
                          <ActionButton
                            title="Save student"
                            onClick={confirmEdit}
                            variant="success"
                          >
                            <Check size={15} />
                          </ActionButton>

                          <ActionButton
                            title="Cancel"
                            onClick={cancelEdit}
                            variant="neutral"
                          >
                            <X size={15} />
                          </ActionButton>
                        </>
                      ) : (
                        <>
                          <ActionButton
                            title="Edit student"
                            onClick={() => startEdit(student)}
                            variant="edit"
                          >
                            <Pencil size={15} />
                          </ActionButton>

                          <ActionButton
                            title="Remove student"
                            onClick={() => removeStudent(student)}
                            variant="danger"
                          >
                            <Trash2 size={15} />
                          </ActionButton>
                        </>
                      )}
                    </div>

                    {index === students.length - 1 && <div />}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Save */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={handleSave}
            disabled={saving || !!editingId}
            className={`inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition ${
              saving || editingId
                ? "cursor-not-allowed bg-slate-300"
                : "bg-[#173B67] hover:bg-[#123052]"
            }`}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {editingId && (
            <span className="text-sm text-slate-500">
              Finish editing before saving all changes.
            </span>
          )}

          {saved && !editingId && (
            <span className="text-sm font-semibold text-green-600">
              ✓ Changes saved successfully
            </span>
          )}
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

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

function ActionButton({
  children,
  title,
  onClick,
  variant,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  variant: "success" | "neutral" | "edit" | "danger";
}) {
  const variants = {
    success:
      "border-green-200 bg-green-50 text-green-600 hover:bg-green-100",
    neutral:
      "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
    edit:
      "border-slate-200 bg-white text-[#173B67] hover:border-blue-200 hover:bg-blue-50",
    danger:
      "border-red-100 bg-white text-red-600 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${variants[variant]}`}
    >
      {children}
    </button>
  );
}
