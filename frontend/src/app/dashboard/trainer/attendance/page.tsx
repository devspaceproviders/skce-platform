"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Users,
  X,
} from "lucide-react";

type AttendanceStatus = "Present" | "Absent" | "Late" | "Leave";

type Student = {
  id: string;
  name: string;
  roll: string;
};

type Batch = {
  id: string;
  name: string;
  students: Student[];
};

type AttendanceRecord = {
  studentId: string;
  status: AttendanceStatus;
  remarks: string;
};

const BATCHES: Batch[] = [
  {
    id: "BATCH-FS-08",
    name: "BATCH-FS-08",
    students: [
      { id: "1", name: "Ananya Reddy", roll: "FS08-01" },
      { id: "2", name: "Vikram Rao", roll: "FS08-02" },
      { id: "3", name: "Sneha Patil", roll: "FS08-03" },
      { id: "4", name: "Rahul Kumar", roll: "FS08-04" },
      { id: "5", name: "Priya Sharma", roll: "FS08-05" },
    ],
  },
  {
    id: "BATCH-JAVA-06",
    name: "BATCH-JAVA-06",
    students: [
      { id: "6", name: "Karthik Iyer", roll: "JAVA06-01" },
      { id: "7", name: "Meera Nair", roll: "JAVA06-02" },
      { id: "8", name: "Arjun Reddy", roll: "JAVA06-03" },
    ],
  },
];

const statusOptions: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Leave",
];

export default function AttendancePage() {
  const [batchId, setBatchId] = useState(BATCHES[0].id);
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [attendance, setAttendance] = useState<
    Record<string, AttendanceRecord>
  >({});

  const [saved, setSaved] = useState(false);

  const selectedBatch = useMemo(
    () => BATCHES.find((batch) => batch.id === batchId),
    [batchId]
  );

  useEffect(() => {
    if (!selectedBatch) return;

    const initial: Record<string, AttendanceRecord> = {};

    selectedBatch.students.forEach((student) => {
      initial[student.id] = {
        studentId: student.id,
        status: "Present",
        remarks: "",
      };
    });

    setAttendance(initial);
    setSaved(false);
  }, [selectedBatch]);

  const updateStatus = (
    studentId: string,
    status: AttendanceStatus
  ) => {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        status,
      },
    }));

    setSaved(false);
  };

  const updateRemarks = (
    studentId: string,
    remarks: string
  ) => {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        remarks,
      },
    }));

    setSaved(false);
  };

  const markAllPresent = () => {
    setAttendance((previous) => {
      const updated = { ...previous };

      Object.keys(updated).forEach((id) => {
        updated[id] = {
          ...updated[id],
          status: "Present",
        };
      });

      return updated;
    });

    setSaved(false);
  };

  const handleSave = () => {
    const key = `skce_attendance_${batchId}_${date}`;

    localStorage.setItem(
      key,
      JSON.stringify(attendance)
    );

    setSaved(true);
  };

  const resetAttendance = () => {
    if (!selectedBatch) return;

    const reset: Record<string, AttendanceRecord> = {};

    selectedBatch.students.forEach((student) => {
      reset[student.id] = {
        studentId: student.id,
        status: "Present",
        remarks: "",
      };
    });

    setAttendance(reset);
    setSaved(false);
  };

  const counts = {
    Present: 0,
    Absent: 0,
    Late: 0,
    Leave: 0,
  };

  Object.values(attendance).forEach((record) => {
    counts[record.status]++;
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 32px",
        background: "#F8FAFC",
      }}
    >
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
            Attendance Marking
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            Mark and manage student attendance for your batches.
          </p>
        </div>

        <button
          onClick={markAllPresent}
          style={secondaryButton}
        >
          <Check size={15} />
          Mark All Present
        </button>
      </div>

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #EEF0F4",
          borderRadius: 12,
          padding: 20,
          marginBottom: 18,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        <div>
          <label style={labelStyle}>Batch</label>

          <div style={{ position: "relative" }}>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              style={inputStyle}
            >
              {BATCHES.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>

            <ChevronDown
              size={15}
              style={{
                position: "absolute",
                right: 10,
                top: 11,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Attendance Date</label>

          <div style={{ position: "relative" }}>
            <CalendarDays
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: 11,
                color: "#6B7280",
              }}
            />

            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSaved(false);
              }}
              style={{
                ...inputStyle,
                paddingLeft: 34,
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <SummaryCard
          label="Present"
          value={counts.Present}
          icon={<Check size={17} />}
        />

        <SummaryCard
          label="Absent"
          value={counts.Absent}
          icon={<X size={17} />}
        />

        <SummaryCard
          label="Late"
          value={counts.Late}
          icon={<Clock3 size={17} />}
        />

        <SummaryCard
          label="Leave"
          value={counts.Leave}
          icon={<Users size={17} />}
        />
      </div>

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #EEF0F4",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1.5fr 1fr 1.2fr 2fr",
            gap: 12,
            padding: "13px 20px",
            background: "#FAFBFC",
            borderBottom: "1px solid #EEF0F4",
            color: "#6B7280",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span>Student</span>
          <span>Roll No.</span>
          <span>Status</span>
          <span>Remarks</span>
        </div>

        {selectedBatch?.students.map(
          (student, index) => {
            const record = attendance[student.id];

            return (
              <div
                key={student.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.5fr 1fr 1.2fr 2fr",
                  gap: 12,
                  alignItems: "center",
                  padding: "13px 20px",
                  borderBottom:
                    index !==
                    selectedBatch.students.length - 1
                      ? "1px solid #F1F2F5"
                      : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {student.name}
                </span>

                <span
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                  }}
                >
                  {student.roll}
                </span>

                <select
                  value={record?.status || "Present"}
                  onChange={(e) =>
                    updateStatus(
                      student.id,
                      e.target.value as AttendanceStatus
                    )
                  }
                  style={inputStyle}
                >
                  {statusOptions.map((status) => (
                    <option key={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <input
                  value={record?.remarks || ""}
                  onChange={(e) =>
                    updateRemarks(
                      student.id,
                      e.target.value
                    )
                  }
                  placeholder="Optional remarks"
                  style={inputStyle}
                />
              </div>
            );
          }
        )}
      </div>

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
          style={saveButton}
        >
          Save Attendance
        </button>

        <button
          onClick={resetAttendance}
          style={secondaryButton}
        >
          Reset
        </button>

        {saved && (
          <span
            style={{
              color: "#16A34A",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ✓ Attendance saved successfully
          </span>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #EEF0F4",
        borderRadius: 10,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: "#EEF3FF",
          color: "#3B6BF0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: "#6B7280",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
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

const secondaryButton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  border: "1px solid #DDE2EA",
  background: "#FFFFFF",
  color: "#374151",
  borderRadius: 8,
  padding: "9px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const saveButton: React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  background: "#16A34A",
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};