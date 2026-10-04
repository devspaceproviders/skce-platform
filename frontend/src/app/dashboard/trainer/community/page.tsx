"use client";

import { MessageCircle } from "lucide-react";

export default function TrainerCommunityPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <MessageCircle size={22} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[#173B67]">
            Community
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Community features will be added here later.
            This page is intentionally kept free of fake
            posts, messages or activity.
          </p>
        </div>
      </div>
    </main>
  );
}
