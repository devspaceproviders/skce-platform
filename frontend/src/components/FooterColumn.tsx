"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * On phones the column collapses under its heading and opens on tap.
 * From the `sm` breakpoint up it is always open and the heading is static.
 */
export default function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const slug = title.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="border-b border-white/10 pb-4 sm:border-0 sm:pb-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`footer-col-${slug}`}
          onClick={() => setOpen((value) => !value)}
          className="group flex w-full items-center justify-between rounded text-left text-sm font-semibold uppercase tracking-wider text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 sm:pointer-events-none sm:cursor-default"
        >
          {title}

          <ChevronDown
            size={18}
            className={`text-orange-400 transition-transform duration-300 sm:hidden ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>

      <span className="mt-2 block h-0.5 w-8 rounded-full bg-orange-500" />

      <div
        id={`footer-col-${slug}`}
        className={`grid transition-all duration-300 ease-in-out sm:grid-rows-[1fr] sm:opacity-100 ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden sm:overflow-visible">
          <div className="pt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
