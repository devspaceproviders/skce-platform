
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MessageSquareQuote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import TestimonialCard from "./TestimonialCard";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import type { Testimonial } from "@/types";

const PAGE_SIZE = 3;

type TestimonialsPreviewProps = {
  testimonials: Testimonial[];
};

type PageItem = number | "left-ellipsis" | "right-ellipsis";

export default function TestimonialsPreview({
  testimonials,
}: TestimonialsPreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(testimonials.length / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage((page) =>
      Math.max(0, Math.min(page, Math.max(0, totalPages - 1))),
    );
  }, [totalPages]);

  const visibleTestimonials = useMemo(() => {
    const startIndex = currentPage * PAGE_SIZE;
    return testimonials.slice(startIndex, startIndex + PAGE_SIZE);
  }, [testimonials, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  };

  const pageItems = useMemo<PageItem[]>(() => {
    const items: PageItem[] = [];

    for (let page = 0; page < totalPages; page++) {
      if (
        page === 0 ||
        page === totalPages - 1 ||
        Math.abs(page - currentPage) <= 1
      ) {
        items.push(page);
      } else if (page === currentPage - 2) {
        items.push("left-ellipsis");
      } else if (page === currentPage + 2) {
        items.push("right-ellipsis");
      }
    }

    return items.filter((item, index) => {
      if (typeof item !== "string") return true;

      return (
        index > 0 &&
        index < items.length - 1 &&
        typeof items[index - 1] === "number" &&
        typeof items[index + 1] === "number"
      );
    });
  }, [totalPages, currentPage]);

  const arrowClass =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full " +
    "border border-[#173B67]/20 bg-white text-[#173B67] shadow-md " +
    "transition-all duration-200 hover:border-[#173B67] " +
    "hover:bg-[#173B67] hover:text-white hover:shadow-lg " +
    "focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-orange-400 focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-30 sm:h-12 sm:w-12";

  const paginationArrowClass =
    "flex h-10 w-10 items-center justify-center rounded-xl " +
    "border border-[#173B67]/20 bg-white text-[#173B67] " +
    "transition hover:bg-[#173B67] hover:text-white " +
    "disabled:cursor-not-allowed disabled:opacity-40";

  const startItem =
    testimonials.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;

  const endItem = Math.min(
    (currentPage + 1) * PAGE_SIZE,
    testimonials.length,
  );

  return (
    <section className="bg-[#F7F9FC] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Student Feedback"
          title="What Our Students Say"
          description="Hear from learners about their experience with SK Computer Education."
        />

        {visibleTestimonials.length > 0 ? (
          <>
            {/* Cards with side arrows */}
            <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 sm:grid-cols-[48px_minmax(0,1fr)_48px] sm:gap-5 lg:gap-6">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                aria-label="Previous student reviews"
                className={arrowClass}
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
              </button>

              <div
                className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                aria-live="polite"
                aria-atomic="true"
              >
                {visibleTestimonials.map((testimonial, index) => (
                  <Reveal
                    key={testimonial.id}
                    delay={index * 80}
                    className="h-full min-w-0 [&>*]:h-full [&>*]:w-full"
                  >
                    <TestimonialCard testimonial={testimonial} />
                  </Reveal>
                ))}
              </div>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                aria-label="Next student reviews"
                className={arrowClass}
              >
                <ChevronRight size={22} strokeWidth={2.5} />
              </button>
            </div>

            {/* Numbered pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Student feedback pagination"
                className="mt-7 flex flex-wrap items-center justify-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  aria-label="Previous page"
                  className={paginationArrowClass}
                >
                  <ChevronLeft size={18} />
                </button>

                {pageItems.map((item) => {
                  if (typeof item === "string") {
                    return (
                      <span
                        key={item}
                        aria-hidden="true"
                        className="flex h-10 min-w-8 items-center justify-center text-slate-400"
                      >
                        …
                      </span>
                    );
                  }

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goToPage(item)}
                      aria-label={`Page ${item + 1}`}
                      aria-current={
                        currentPage === item ? "page" : undefined
                      }
                      className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                        currentPage === item
                          ? "bg-[#173B67] text-white shadow-md shadow-blue-950/15"
                          : "border border-[#173B67]/15 bg-white text-[#173B67] hover:border-[#173B67] hover:bg-[#173B67] hover:text-white"
                      }`}
                    >
                      {item + 1}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  aria-label="Next page"
                  className={paginationArrowClass}
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            )}

            {/* Review count */}
            <p className="mt-4 text-center text-xs text-slate-500">
              Showing {startItem}–{endItem} of {testimonials.length} student
              {testimonials.length === 1 ? " review" : " reviews"}
            </p>
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0F2F5F] to-[#0B2A52] px-6 py-14 text-center text-white shadow-lg shadow-blue-950/15">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white">
              <MessageSquareQuote size={26} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              Student feedback is on the way
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-100/80">
              Reviews from our learners will appear here soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
