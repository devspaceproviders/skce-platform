"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { CourseTopic } from "@/types";

export default function TopicsAccordion({ topics }: { topics: CourseTopic[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {topics.map((topic, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={topic.title}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-bold text-slate-900">{topic.title}</span>
              {isOpen ? (
                <Minus size={18} className="shrink-0 text-slate-500" />
              ) : (
                <Plus size={18} className="shrink-0 text-slate-500" />
              )}
            </button>

            <div
              className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <ul className="min-h-0 space-y-2 px-5 pb-4 text-sm text-slate-600">
                {topic.lessons.map((lesson) => (
                  <li key={lesson} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
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
