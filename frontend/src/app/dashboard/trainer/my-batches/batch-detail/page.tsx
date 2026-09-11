"use client";

import Link from "next/link";
import { Layers, Users, ChevronRight } from "lucide-react";

type Batch = {
  id: string;
  name: string;
  course: string;
  students: number;
  mode: "Online" | "Offline";
  status: "Active" | "Completed";
};

const BATCHES: Batch[] = [
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

export default function MyBatchesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 32px",
        background: "#F8FAFC",
      }}
    >
      {/* PAGE HEADER */}

      <div style={{ marginBottom: 24 }}>
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
          Batches you're currently training, and past ones.
        </p>
      </div>

      {/* BATCH LIST */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 18,
        }}
      >
        {BATCHES.map((batch) => (
          <div
            key={batch.id}
            style={{
              background: "#FFFFFF",
              border: "1px solid #EEF0F4",
              borderRadius: 14,
              padding: 22,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {/* TOP */}

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 15,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                }}
              >
                {/* ICON */}

                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 11,
                    background: "#EAF0FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Layers size={20} color="#3B6BF0" />
                </div>

                {/* NAME */}

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
                      margin: "4px 0 0",
                      fontSize: 13,
                      color: "#6B7280",
                    }}
                  >
                    {batch.course}
                  </p>
                </div>
              </div>

              {/* STATUS */}

              <span
                style={{
                  padding: "5px 9px",
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 600,
                  background:
                    batch.status === "Active"
                      ? "#EAF9EF"
                      : "#F1F2F5",
                  color:
                    batch.status === "Active"
                      ? "#16A34A"
                      : "#6B7280",
                  whiteSpace: "nowrap",
                }}
              >
                {batch.status}
              </span>
            </div>

            {/* DIVIDER */}

            <div
              style={{
                height: 1,
                background: "#F1F2F5",
                margin: "18px 0",
              }}
            />

            {/* BOTTOM */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
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

                <span>{batch.mode}</span>
              </div>

              {/* VIEW BATCH */}

              <Link
                href={`/dashboard/trainer/my-batches/${encodeURIComponent(
                  batch.id
                )}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  textDecoration: "none",
                  border: "1px solid #DDE2EA",
                  background: "#FFFFFF",
                  color: "#374151",
                  borderRadius: 7,
                  padding: "8px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                View Batch

                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}