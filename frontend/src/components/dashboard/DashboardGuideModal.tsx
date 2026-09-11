"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SEEN_KEY = "skce_seen_dashboard_guide";

export default function DashboardGuideModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show once per browser — swap for a per-user "hasSeenGuide" flag from
    // your backend if you want it to persist across devices.
    const alreadySeen = localStorage.getItem(SEEN_KEY);
    if (!alreadySeen) setOpen(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem(SEEN_KEY, "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Dashboard Guide</h2>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="text-slate-400 transition hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-black">
          {/* Swap the src below for your real walkthrough video (Mux/Vimeo/S3 URL) */}
          <video
            controls
            className="aspect-video w-full"
            poster="/dashboard/guide-poster.svg"
          >
            <source src="/dashboard/guide-video.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
}
