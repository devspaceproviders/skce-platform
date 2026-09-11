"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Users,
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

  const batchId = decodeURIComponent(
    params.batchId as string
  );

  const storageKey =
    `skce_batch_students_${batchId}`;

  const [students, setStudents] =
    useState<Student[]>([]);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [draft, setDraft] =
    useState<Student | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  /* =========================
     LOAD STUDENTS
  ========================= */

  useEffect(() => {
    const stored =
      localStorage.getItem(storageKey);

    if (stored) {
      try {
        setStudents(JSON.parse(stored));
      } catch {
        setStudents(
          SEED_STUDENTS[batchId] || []
        );
      }
    } else {
      setStudents(
        SEED_STUDENTS[batchId] || []
      );
    }
  }, [batchId, storageKey]);

  /* =========================
     EDIT STUDENT
  ========================= */

  const startEdit = (student: Student) => {
    if (editingId) {
      alert(
        "Please finish editing the current student first."
      );
      return;
    }

    setEditingId(student.id);
    setDraft({ ...student });
    setSaved(false);
  };

  /* =========================
     ADD STUDENT
  ========================= */

  const addStudent = () => {
    if (editingId) {
      alert(
        "Please finish editing the current student first."
      );
      return;
    }

    const newStudent = createStudent();

    setStudents((previous) => [
      ...previous,
      newStudent,
    ]);

    setEditingId(newStudent.id);
    setDraft(newStudent);
    setSaved(false);
  };

  /* =========================
     CANCEL EDIT
  ========================= */

  const cancelEdit = () => {
    // If the student is newly created
    // and empty, remove that temporary row.
    if (
      draft &&
      !draft.name.trim() &&
      !draft.roll.trim() &&
      !draft.email.trim() &&
      !draft.phone.trim()
    ) {
      setStudents((previous) =>
        previous.filter(
          (student) =>
            student.id !== draft.id
        )
      );
    }

    setEditingId(null);
    setDraft(null);
  };

  /* =========================
     SAVE STUDENT
  ========================= */

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

  /* =========================
     REMOVE STUDENT
  ========================= */

  const removeStudent = (student: Student) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${student.name}" from this batch?`
    );

    // IMPORTANT:
    // If user clicks Cancel/No,
    // nothing happens.
    if (!confirmed) {
      return;
    }

    // Only after YES:
    setStudents((previous) =>
      previous.filter(
        (item) => item.id !== student.id
      )
    );

    setSaved(false);
  };

  /* =========================
     SAVE ALL CHANGES
  ========================= */

  const handleSave = async () => {
    if (editingId) {
      alert(
        "Please finish editing the student first."
      );
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      localStorage.setItem(
        storageKey,
        JSON.stringify(students)
      );

      setSaved(true);
    } catch (error) {
      console.error(error);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 32px",
        background: "#F8FAFC",
      }}
    >
      {/* =========================
          BACK
      ========================= */}

      <button
        onClick={() =>
          router.push(
            "/dashboard/trainer/my-batches"
          )
        }
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: "none",
          background: "transparent",
          padding: 0,
          marginBottom: 20,
          color: "#6B7280",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={15} />
        Back to My Batches
      </button>

      {/* =========================
          HEADER
      ========================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Users
              size={22}
              color="#3B6BF0"
            />

            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {batchId}
            </h1>
          </div>

          <p
            style={{
              margin: "7px 0 0 32px",
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            {students.length} student
            {students.length !== 1
              ? "s"
              : ""}{" "}
            enrolled
          </p>
        </div>

        <button
          onClick={addStudent}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            border: "none",
            background: "#2F6BFF",
            color: "#FFFFFF",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={16} />
          Add Student
        </button>
      </div>

      {/* =========================
          STUDENT TABLE
      ========================= */}

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          border: "1px solid #EEF0F4",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1.5fr 1fr 1.8fr 1.4fr 1fr",
            gap: 12,
            padding: "13px 20px",
            background: "#FAFBFC",
            borderBottom:
              "1px solid #EEF0F4",
            color: "#6B7280",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span>Name</span>
          <span>Roll No.</span>
          <span>Email</span>
          <span>Phone</span>
          <span style={{ textAlign: "right" }}>
            Actions
          </span>
        </div>

        {/* EMPTY */}

        {students.length === 0 && (
          <div
            style={{
              padding: 45,
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: 14,
            }}
          >
            No students in this batch.

            <br />

            <span
              style={{
                fontSize: 13,
              }}
            >
              Click "Add Student" to add one.
            </span>
          </div>
        )}

        {/* STUDENTS */}

        {students.map((student, index) => {
          const isEditing =
            editingId === student.id;

          const row =
            isEditing && draft
              ? draft
              : student;

          return (
            <div
              key={student.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1.5fr 1fr 1.8fr 1.4fr 1fr",
                gap: 12,
                alignItems: "center",
                padding: "12px 20px",
                borderBottom:
                  index !==
                  students.length - 1
                    ? "1px solid #F1F2F5"
                    : "none",
              }}
            >
              {/* NAME */}

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
                  style={inputStyle}
                />
              ) : (
                <span
                  style={{
                    color: "#111827",
                    fontWeight: 600,
                    fontSize: 13.5,
                  }}
                >
                  {student.name || "—"}
                </span>
              )}

              {/* ROLL */}

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
                  style={inputStyle}
                />
              ) : (
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: 13.5,
                  }}
                >
                  {student.roll || "—"}
                </span>
              )}

              {/* EMAIL */}

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
                  style={inputStyle}
                />
              ) : (
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: 13.5,
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {student.email || "—"}
                </span>
              )}

              {/* PHONE */}

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
                  style={inputStyle}
                />
              ) : (
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: 13.5,
                  }}
                >
                  {student.phone || "—"}
                </span>
              )}

              {/* ACTIONS */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: 7,
                }}
              >
                {isEditing ? (
                  <>
                    <button
                      onClick={confirmEdit}
                      title="Save student"
                      style={iconButton(
                        "#16A34A"
                      )}
                    >
                      <Check size={15} />
                    </button>

                    <button
                      onClick={cancelEdit}
                      title="Cancel"
                      style={iconButton(
                        "#6B7280"
                      )}
                    >
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        startEdit(student)
                      }
                      title="Edit student"
                      style={iconButton(
                        "#3B6BF0"
                      )}
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() =>
                        removeStudent(student)
                      }
                      title="Remove student"
                      style={iconButton(
                        "#DC2626"
                      )}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================
          SAVE
      ========================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginTop: 20,
        }}
      >
        <button
          onClick={handleSave}
          disabled={
            saving || !!editingId
          }
          style={{
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            background:
              saving || editingId
                ? "#A5B4FC"
                : "#16A34A",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 600,
            cursor:
              saving || editingId
                ? "not-allowed"
                : "pointer",
          }}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>

        {editingId && (
          <span
            style={{
              color: "#6B7280",
              fontSize: 13,
            }}
          >
            Finish editing before saving.
          </span>
        )}

        {saved && !editingId && (
          <span
            style={{
              color: "#16A34A",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ✓ Changes saved successfully
          </span>
        )}
      </div>
    </main>
  );
}

/* =========================
   INPUT
========================= */

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 9px",
  border: "1px solid #DDE2EA",
  borderRadius: 6,
  outline: "none",
  fontSize: 13,
  color: "#111827",
};

/* =========================
   ICON BUTTON
========================= */

const iconButton = (
  color: string
): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  padding: 0,
  borderRadius: 6,
  border: "1px solid #E2E5EC",
  background: "#FFFFFF",
  color,
  cursor: "pointer",
});