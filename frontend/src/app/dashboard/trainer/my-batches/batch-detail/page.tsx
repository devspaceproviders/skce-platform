"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layers, Users, ChevronRight, Search, X } from "lucide-react";

import { AdminPageHeader } from "@/components/dashboard/admin/AdminPageHeader";

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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [mode, setMode] = useState("ALL");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return BATCHES.filter((batch) => {
      if (status !== "ALL" && batch.status !== status) return false;
      if (mode !== "ALL" && batch.mode !== mode) return false;
      if (!needle) return true;
      return `${batch.name} ${batch.course}`.toLowerCase().includes(needle);
    });
  }, [query, status, mode]);

  const filtersOn = query.trim() !== "" || status !== "ALL" || mode !== "ALL";

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto w-full max-w-[1680px] space-y-6">
        <AdminPageHeader
          label="Trainer Portal"
          icon={Layers}
          title="My Batches"
          subtitle="Batches you're currently training, and past ones."
          chips={[
            { label: "Batches", value: BATCHES.length },
            {
              label: "Active",
              value: BATCHES.filter((batch) => batch.status === "Active").length,
            },
          ]}
        />

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex h-11 min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 focus-within:border-[#173B67] focus-within:ring-2 focus-within:ring-orange-200">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search batch or course"
              aria-label="Search batches"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#173B67]"
          >
            <option value="ALL">All statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            aria-label="Filter by mode"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#173B67]"
          >
            <option value="ALL">All modes</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
          {filtersOn ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatus("ALL");
                setMode("ALL");
              }}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 text-xs font-bold text-orange-700 hover:bg-orange-100"
            >
              <X size={14} /> Clear filters
            </button>
          ) : null}
        </div>

        {/* BATCH LIST */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {visible.map((batch) => (
            <div
              key={batch.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FD] text-[#1459B8]">
                    <Layers size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-[#0F2F5F]">
                      {batch.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{batch.course}</p>
                  </div>
                </div>

                <span
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
                    batch.status === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {batch.status}
                </span>
              </div>

              <div className="my-5 h-px bg-slate-100" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users size={15} />
                  <span>{batch.students} students</span>
                  <span>·</span>
                  <span>{batch.mode}</span>
                </div>

                <Link
                  href={`/dashboard/trainer/my-batches/${encodeURIComponent(
                    batch.id
                  )}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#173B67] shadow-sm transition hover:-translate-y-0.5 hover:border-[#F97316] hover:text-[#C2410C]"
                >
                  View Batch
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500">
            No batches match the current filters.
          </div>
        ) : null}
      </div>
    </main>
  );
}
