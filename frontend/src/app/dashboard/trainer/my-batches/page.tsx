"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Users,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
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

  /* =========================
     LOAD BATCHES
  ========================= */

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

  /* =========================
     START EDIT
  ========================= */

  const startEdit = (batch: Batch) => {
    if (editingId) {
      alert("Please finish editing the current batch first.");
      return;
    }

    setEditingId(batch.id);
    setDraft({ ...batch });
    setSaved(false);
  };

  /* =========================
     ADD BATCH
  ========================= */

  const addBatch = () => {
    if (editingId) {
      alert("Please finish editing the current batch first.");
      return;
    }

    const newBatch = createBatch();

    setBatches((previous) => [
      ...previous,
      newBatch,
    ]);

    setEditingId(newBatch.id);
    setDraft(newBatch);
    setSaved(false);
  };

  /* =========================
     CANCEL
  ========================= */

  const cancelEdit = () => {
    // If this was a newly created batch,
    // remove it when cancelling.
    if (draft && draft.students === 0) {
      const exists = batches.some(
        (batch) => batch.id === draft.id
      );

      if (exists && draft.course === "") {
        setBatches((previous) =>
          previous.filter(
            (batch) => batch.id !== draft.id
          )
        );
      }
    }

    setEditingId(null);
    setDraft(null);
  };

  /* =========================
     SAVE BATCH
  ========================= */

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

  /* =========================
     REMOVE BATCH
  ========================= */

  const removeBatch = (id: string) => {
    const batch = batches.find(
      (item) => item.id === id
    );

    if (!batch) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove "${batch.name}"?`
    );

    if (!confirmed) return;

    setBatches((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    // Also remove students belonging
    // to this batch.
    localStorage.removeItem(
      `skce_batch_students_${id}`
    );

    setSaved(false);
  };

  /* =========================
     SAVE ALL
  ========================= */

  const handleSave = () => {
    if (editingId) {
      alert(
        "Please finish editing the current batch first."
      );
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(batches)
    );

    setSaved(true);
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
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            My Batches
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            Manage your current and previous batches.
          </p>
        </div>

        <button
          onClick={addBatch}
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
          Add Batch
        </button>
      </div>

      {/* =========================
          BATCH LIST
      ========================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 18,
        }}
      >
        {batches.map((batch) => {
          const isEditing =
            editingId === batch.id;

          const currentBatch =
            isEditing && draft
              ? draft
              : batch;

          return (
            <div
              key={batch.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #EEF0F4",
                borderRadius: 14,
                padding: 22,
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              {isEditing ? (
                /* =========================
                   EDIT BATCH
                ========================= */

                <div>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <div>
                      <label style={labelStyle}>
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
                        style={inputStyle}
                        placeholder="Batch name"
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>
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
                        style={inputStyle}
                        placeholder="Course name"
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <div>
                        <label style={labelStyle}>
                          Mode
                        </label>

                        <select
                          value={currentBatch.mode}
                          onChange={(e) =>
                            setDraft({
                              ...currentBatch,
                              mode: e.target
                                .value as
                                | "Online"
                                | "Offline",
                            })
                          }
                          style={inputStyle}
                        >
                          <option value="Online">
                            Online
                          </option>
                          <option value="Offline">
                            Offline
                          </option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>
                          Status
                        </label>

                        <select
                          value={currentBatch.status}
                          onChange={(e) =>
                            setDraft({
                              ...currentBatch,
                              status: e.target
                                .value as
                                | "Active"
                                | "Completed",
                            })
                          }
                          style={inputStyle}
                        >
                          <option value="Active">
                            Active
                          </option>
                          <option value="Completed">
                            Completed
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      marginTop: 16,
                    }}
                  >
                    <button
                      onClick={saveBatch}
                      style={iconButton(
                        "#16A34A"
                      )}
                      title="Save batch"
                    >
                      <Check size={16} />
                    </button>

                    <button
                      onClick={cancelEdit}
                      style={iconButton(
                        "#6B7280"
                      )}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                /* =========================
                   NORMAL BATCH CARD
                ========================= */

                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: 15,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 13,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 11,
                          background: "#EAF0FE",
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "center",
                          flexShrink: 0,
                        }}
                      >
                        <Layers
                          size={20}
                          color="#3B6BF0"
                        />
                      </div>

                      <div>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 650,
                            color: "#111827",
                          }}
                        >
                          {batch.name}
                        </h2>

                        <p
                          style={{
                            margin:
                              "4px 0 0",
                            fontSize: 13,
                            color: "#6B7280",
                          }}
                        >
                          {batch.course}
                        </p>
                      </div>
                    </div>

                    <span
                      style={{
                        padding:
                          "5px 9px",
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background:
                          batch.status ===
                          "Active"
                            ? "#EAF9EF"
                            : "#F1F2F5",
                        color:
                          batch.status ===
                          "Active"
                            ? "#16A34A"
                            : "#6B7280",
                      }}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <div
                    style={{
                      height: 1,
                      background: "#F1F2F5",
                      margin: "18px 0",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 7,
                        fontSize: 13,
                        color: "#6B7280",
                      }}
                    >
                      <Users size={15} />

                      <span>
                        {batch.students} students
                      </span>

                      <span>·</span>

                      <span>
                        {batch.mode}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 7,
                        alignItems:
                          "center",
                      }}
                    >
                      {/* EDIT */}

                      <button
                        onClick={() =>
                          startEdit(batch)
                        }
                        title="Edit batch"
                        style={iconButton(
                          "#3B6BF0"
                        )}
                      >
                        <Pencil size={14} />
                      </button>

                      {/* REMOVE */}

                      <button
                        onClick={() =>
                          removeBatch(
                            batch.id
                          )
                        }
                        title="Remove batch"
                        style={iconButton(
                          "#DC2626"
                        )}
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* VIEW */}

                      <Link
                        href={`/dashboard/trainer/my-batches/batch-detail/${encodeURIComponent(
                          batch.id
                        )}`}
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 5,
                          textDecoration:
                            "none",
                          border:
                            "1px solid #DDE2EA",
                          background:
                            "#FFFFFF",
                          color:
                            "#374151",
                          borderRadius: 7,
                          padding:
                            "8px 12px",
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        View Batch
                        <ChevronRight
                          size={14}
                        />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* =========================
          SAVE BATCHES
      ========================= */}

      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <button
          onClick={handleSave}
          disabled={!!editingId}
          style={{
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            background: editingId
              ? "#A5B4FC"
              : "#16A34A",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 600,
            cursor: editingId
              ? "not-allowed"
              : "pointer",
          }}
        >
          Save Changes
        </button>

        {saved && (
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
   STYLES
========================= */

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 5,
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 10px",
  border: "1px solid #DDE2EA",
  borderRadius: 7,
  outline: "none",
  fontSize: 13,
  color: "#111827",
  background: "#FFFFFF",
};

const iconButton = (
  color: string
): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 31,
  height: 31,
  padding: 0,
  borderRadius: 6,
  border: "1px solid #E2E5EC",
  background: "#FFFFFF",
  color,
  cursor: "pointer",
});