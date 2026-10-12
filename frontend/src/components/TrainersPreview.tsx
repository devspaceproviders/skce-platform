
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

import TrainerCard from "./TrainerCard";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { getTrainers } from "@/lib/api";

const PAGE_SIZE = 3;

type TrainerList = Awaited<ReturnType<typeof getTrainers>>;

export default function TrainersPreview() {
  const [trainers, setTrainers] = useState<TrainerList>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getTrainers()
      .then((data) => {
        if (active) {
          setTrainers(data);
        }
      })
      .catch(() => {
        if (active) {
          setTrainers([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const totalPages = Math.ceil(trainers.length / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage((page) =>
      Math.max(0, Math.min(page, Math.max(0, totalPages - 1))),
    );
  }, [totalPages]);

  const visibleTrainers = useMemo(() => {
    const startIndex = currentPage * PAGE_SIZE;
    return trainers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [trainers, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  };

  const pageItems = useMemo(() => {
    const items: Array<number | "left-ellipsis" | "right-ellipsis"> = [];

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

    return items;
  }, [totalPages, currentPage]);

  const arrowClass =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
    "border border-[#173B67]/20 bg-white text-[#173B67] shadow-sm " +
    "transition-all duration-200 hover:border-[#173B67] " +
    "hover:bg-[#173B67] hover:text-white hover:shadow-md " +
    "focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-orange-400 focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:border-slate-200 " +
    "disabled:bg-slate-50 disabled:text-slate-400 " +
    "disabled:opacity-70 sm:h-10 sm:w-10";

  const paginationArrowClass =
    "flex h-10 w-10 items-center justify-center rounded-xl " +
    "border border-[#173B67]/20 bg-white text-[#173B67] " +
    "transition-all duration-200 hover:border-[#173B67] " +
    "hover:bg-[#173B67] hover:text-white " +
    "focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-orange-400 focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:border-slate-200 " +
    "disabled:bg-slate-50 disabled:text-slate-400 " +
    "disabled:opacity-70";

  return (
    <section className="bg-white px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Our Faculty"
          title="Meet Our Trainers"
          description="Learn with dedicated trainers who guide you through practical concepts and help you build confidence in your skills."
        />

        {loading ? (
          <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 sm:grid-cols-[48px_minmax(0,1fr)_48px] sm:gap-5 lg:gap-6">
            <div />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[280px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
            <div />
          </div>
        ) : trainers.length > 0 ? (
          <>
            {/* Trainer cards and side navigation */}
            <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 sm:grid-cols-[48px_minmax(0,1fr)_48px] sm:gap-5 lg:gap-6">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                aria-label="Previous trainers page"
                className={arrowClass}
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>

              <div
                key={currentPage}
                className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                aria-live="polite"
                aria-atomic="true"
              >
                {visibleTrainers.map((trainer, index) => (
                  <Reveal
                    key={trainer.id}
                    delay={index * 80}
                    className="h-full min-w-0 [&>*]:h-full [&>*]:w-full"
                  >
                    <TrainerCard trainer={trainer} />
                  </Reveal>
                ))}
              </div>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                aria-label="Next trainers page"
                className={arrowClass}
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Page numbers and pagination arrows */}
            {totalPages > 1 && (
              <nav
                aria-label="Trainer pagination"
                className="mt-8 flex flex-wrap items-center justify-center gap-2"
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
                        className="flex h-10 min-w-8 items-center justify-center text-slate-400"
                        aria-hidden="true"
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

            <p className="mt-4 text-center text-xs text-slate-500">
              Showing {currentPage * PAGE_SIZE + 1}–
              {Math.min(
                (currentPage + 1) * PAGE_SIZE,
                trainers.length,
              )}{" "}
              of {trainers.length} trainers
            </p>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
              <Users size={26} className="text-orange-500" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-[#173B67]">
              Our trainers will appear here
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Trainer profiles are being updated. Please check back soon.
            </p>
          </div>
        )}

        {/* View All Trainers */}
        <div className="mt-8 text-center">
          <Link
            href="/trainers"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-[#173B67] shadow-sm transition duration-200 hover:-translate-y-px hover:border-orange-300 hover:text-orange-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0"
          >
            View All Trainers
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
