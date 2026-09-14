"use client";

import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  Video,
  File,
  X,
  CheckCircle2,
  Clock3,
  GraduationCap,
  FolderOpen,
} from "lucide-react";

type UploadType = "video" | "doc" | "pdf";

type RecentUpload = {
  title: string;
  type: UploadType;
  batch: string;
  date: string;
};

const RECENT_UPLOADS: RecentUpload[] = [
  {
    title: "Express.js Middleware — Part 2",
    type: "video",
    batch: "BATCH-FS-08",
    date: "Yesterday",
  },
  {
    title: "PostgreSQL Joins — Slides",
    type: "doc",
    batch: "BATCH-FS-08",
    date: "2 days ago",
  },
  {
    title: "Spring Boot Setup Guide",
    type: "pdf",
    batch: "BATCH-JAVA-06",
    date: "4 days ago",
  },
];

const ICONS: Record<UploadType, typeof Video> = {
  video: Video,
  doc: FileText,
  pdf: File,
};

const BATCHES = [
  "BATCH-FS-08",
  "BATCH-JAVA-06",
  "BATCH-FS-09",
  "BATCH-FS-05",
];

export default function UploadContentPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batch, setBatch] = useState(BATCHES[0]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;

    const maxSize = 500 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Please choose a file smaller than 500MB.");
      return;
    }

    setSelectedFile(file);
    setUploaded(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      inputRef.current?.click();
      return;
    }

    setUploading(true);

    try {
      // Frontend-only placeholder until the content storage/backend is connected.
      await new Promise((resolve) => setTimeout(resolve, 700));
      setUploaded(true);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploaded(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-7 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-200">
                <GraduationCap size={17} />
                Trainer Portal
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Upload Content
              </h1>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Share lecture recordings, slides and reading material with your batches.
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-orange-300">
              <FolderOpen size={21} />
            </div>
          </div>
        </div>

        {/* Development notice */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-700">
          <Clock3 size={18} className="mt-0.5 shrink-0 text-orange-500" />
          <div>
            <p className="font-semibold text-slate-900">Development Mode</p>
            <p className="mt-0.5 leading-6">
              File selection and upload feedback are currently handled on the
              frontend. Actual storage, file processing and batch delivery will
              be connected to the backend later.
            </p>
          </div>
        </div>

        {/* Upload card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Upload Learning Material
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a batch and upload a video, PDF or slide deck.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
            {/* Batch */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Batch
              </label>

              <select
                value={batch}
                onChange={(event) => setBatch(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                {BATCHES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFileSelect(event.dataTransfer.files?.[0]);
              }}
              className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition hover:border-orange-300 hover:bg-orange-50/30 sm:p-8"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <UploadCloud size={28} />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900">
                Drag and drop a file here
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                or click below to browse from your computer
              </p>

              <input
                ref={inputRef}
                type="file"
                accept="video/*,.pdf,.ppt,.pptx,.odp"
                hidden
                onChange={(event) =>
                  handleFileSelect(event.target.files?.[0])
                }
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                <UploadCloud size={17} />
                Choose File
              </button>

              <p className="mt-3 text-xs text-slate-400">
                Videos, PDFs and slide decks up to 500MB
              </p>
            </div>
          </div>

          {/* Selected file */}
          {selectedFile && (
            <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#173B67]">
                  <FileText size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {selectedFile.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatFileSize(selectedFile.size)} · {batch}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {uploaded && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                    <CheckCircle2 size={14} />
                    Uploaded
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearFile}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600"
                  title="Remove selected file"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={clearFile}
              disabled={!selectedFile}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || uploaded}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#173B67] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#123052] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadCloud size={17} />
              {uploading ? "Uploading..." : uploaded ? "Uploaded" : "Upload Content"}
            </button>
          </div>
        </section>

        {/* Recent uploads */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Uploads
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Recently shared content across your batches.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {RECENT_UPLOADS.map((upload) => {
              const Icon = ICONS[upload.type];

              return (
                <div
                  key={upload.title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#173B67]">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {upload.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {upload.batch} · {upload.date}
                      </p>
                    </div>

                    <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 sm:inline-flex">
                      {upload.type === "video"
                        ? "Video"
                        : upload.type === "pdf"
                          ? "PDF"
                          : "Slides"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
