"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { CourseTopic } from "@/types";

export default function TopicsAccordion({ topics }: { topics: CourseTopic[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {topics.map((topic, index) => {
        const isOpen = openIndex === index;
        const panelId = `topic-panel-${index}`;
        const buttonId = `topic-button-${index}`;

        return (
          <div
            key={topic.title}
            className={`overflow-hidden rounded-2xl border bg-white transition duration-300 ${
              isOpen
                ? "border-orange-200 shadow-md shadow-orange-500/5"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <button
              type="button"
              id={buttonId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300 ${
                isOpen ? "bg-orange-50/50" : "hover:bg-slate-50"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors duration-200 ${
                    isOpen
                      ? "bg-orange-500 text-white"
                      : "bg-[#173B67]/5 text-[#173B67]"
                  }`}
                >
                  {index + 1}
                </span>

                <span className="font-semibold text-[#173B67]">
                  {topic.title}
                </span>
              </span>

              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition duration-300 ${
                  isOpen
                    ? "rotate-180 bg-orange-500 text-white"
                    : "rotate-0 bg-slate-100 text-slate-500"
                }`}
              >
                {isOpen ? <Minus size={16} /> : <Plus size={16} />}
              </span>
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!isOpen}
              className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <ul className="min-h-0 space-y-2.5 px-5 pb-5 pt-1 text-sm text-slate-600">
                {topic.lessons.map((lesson) => (
                  <li key={lesson} className="flex items-start gap-2.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                    {lesson}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
