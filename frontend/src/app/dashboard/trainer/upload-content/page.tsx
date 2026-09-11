"use client";

import { UploadCloud, FileText, Video, File } from "lucide-react";

const RECENT_UPLOADS = [
  { title: "Express.js Middleware — Part 2", type: "video", batch: "BATCH-FS-08", date: "Yesterday" },
  { title: "PostgreSQL Joins — Slides", type: "doc", batch: "BATCH-FS-08", date: "2 days ago" },
  { title: "Spring Boot Setup Guide", type: "pdf", batch: "BATCH-JAVA-06", date: "4 days ago" },
];

const ICONS: Record<string, typeof Video> = { video: Video, doc: FileText, pdf: File };

export default function UploadContentPage() {
  return (
    <main style={{ padding: "28px 32px", flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        Upload Content
      </h1>
      <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 24px" }}>
        Share lecture recordings, slides, and reading material with your batches.
      </p>

      <div
        style={{
          background: "#fff",
          border: "2px dashed #D8DCE6",
          borderRadius: 12,
          padding: "40px 20px",
          textAlign: "center",
          marginBottom: 28,
        }}
      >
        <UploadCloud size={30} color="#9CA3AF" style={{ margin: "0 auto 10px" }} />
        <div style={{ fontSize: 14.5, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
          Drag and drop a file, or click to browse
        </div>
        <div style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 16 }}>
          Videos, PDFs, and slide decks up to 500MB
        </div>
        <button
          style={{
            border: "none",
            background: "#2F6BFF",
            color: "#fff",
            borderRadius: 8,
            padding: "9px 18px",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Choose File
        </button>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
        Recent Uploads
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {RECENT_UPLOADS.map((u) => {
          const Icon = ICONS[u.type];
          return (
            <div
              key={u.title}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "#EAF0FE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color="#3B6BF0" />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{u.title}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  {u.batch} · {u.date}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
