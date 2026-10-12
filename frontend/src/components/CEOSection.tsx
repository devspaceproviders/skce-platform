"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import Reveal from "./Reveal";
import { Check } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type CeoProfile = {
  name: string;
  designation: string;
  profilePhotoUrl: string | null;
  bioParagraph1: string | null;
  bioParagraph2: string | null;
  highlight1: string | null;
  highlight2: string | null;
};

const DEFAULT_CEO = {
  name: "C. Neelima",
  designation: "Founder & CEO",
  bioParagraph1:
    "C. Neelima has been actively involved in education, training, and professional development since 2006, bringing over 20 years of experience to the field. With a strong passion for empowering learners through practical and industry-oriented education, she has been instrumental in shaping SK Computer Education and its vision for accessible, career-focused learning.",
  bioParagraph2:
    "Her leadership focuses on providing students with quality training, practical skills, and the confidence they need to build successful careers in a rapidly evolving digital world.",
  highlight1:
    "Empowering learners through practical, career-focused education",
  highlight2:
    "Building confidence through hands-on learning",
};

function getPhotoUrl(
  photoUrl: string | null
): string {
  if (!photoUrl) {
    return "/images/ceo.png";
  }

  if (
    photoUrl.startsWith("http://") ||
    photoUrl.startsWith("https://")
  ) {
    return photoUrl;
  }

  const backendUrl =
    API_URL.replace(/\/api\/?$/, "");

  return `${backendUrl}${
    photoUrl.startsWith("/")
      ? ""
      : "/"
  }${photoUrl}`;
}

export default function CEOSection() {
  const [ceo, setCeo] =
    useState<CeoProfile | null>(null);

  useEffect(() => {
    async function loadCeo() {
      try {
        const response = await fetch(
          `${API_URL}/ceo`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load CEO profile"
          );
        }

        const json = await response.json();

        if (json.success && json.data) {
          setCeo(json.data);
        }
      } catch (error) {
        console.error(
          "Failed to load CEO profile:",
          error
        );
      }
    }

    loadCeo();
  }, []);

  const ceoName =
    ceo?.name || DEFAULT_CEO.name;

  const ceoDesignation =
    ceo?.designation ||
    DEFAULT_CEO.designation;

  const ceoPhoto =
    getPhotoUrl(
      ceo?.profilePhotoUrl ?? null
    );

  const bioParagraph1 =
    ceo?.bioParagraph1 ||
    DEFAULT_CEO.bioParagraph1;

  const bioParagraph2 =
    ceo?.bioParagraph2 ||
    DEFAULT_CEO.bioParagraph2;

  const highlight1 =
    ceo?.highlight1 ||
    DEFAULT_CEO.highlight1;

  const highlight2 =
    ceo?.highlight2 ||
    DEFAULT_CEO.highlight2;

  return (
    <section className="w-full bg-[#F7F9FC] px-6 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#071C3A] via-[#0F2F5F] to-[#173B67] p-6 shadow-2xl shadow-blue-950/20 sm:p-10 lg:p-14">
            <div className="sk-dots pointer-events-none absolute inset-0 -z-10" />
            <div className="sk-hero-orb pointer-events-none absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-orange-500/25 blur-3xl" />
            <div className="sk-hero-orb-2 pointer-events-none absolute -bottom-24 -left-16 -z-10 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-orange-500 via-blue-500 to-[#0B2A52]" />

            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-16">
              {/* CEO Image */}
              <Reveal direction="left" className="flex w-full justify-center">
                <div className="relative aspect-square w-full max-w-[360px]">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-blue-400 shadow-2xl shadow-black/30" />
                  <div className="absolute inset-[8px] rounded-full bg-[#0F2F5F]" />
                  <div className="absolute inset-[16px] overflow-hidden rounded-full ring-4 ring-white/90">
                    <Image
                      src={ceoPhoto}
                      alt={`${ceoName} - ${ceoDesignation} of SK Computer Education`}
                      width={400}
                      height={500}
                      sizes="(min-width: 1024px) 360px, 80vw"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="absolute right-1 top-[16%] h-8 w-8 rounded-full bg-orange-500 shadow-lg ring-4 ring-[#0F2F5F]" />
                  <div className="absolute bottom-[8%] left-[8%] h-6 w-6 rounded-full bg-blue-400 ring-4 ring-[#0F2F5F]" />
                </div>
              </Reveal>

              {/* CEO Content */}
              <Reveal direction="right" delay={120} className="w-full min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300 sm:text-sm">
                  Our Leadership
                </p>

                <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                  Meet Our Founder &amp; CEO
                </h2>

                <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
                  <div className="h-1 w-16 rounded-full bg-orange-500" />
                  <div className="h-1 w-5 rounded-full bg-white/60" />
                </div>

                <h3 className="mt-6 text-2xl font-bold text-white">
                  {ceoName}
                </h3>

                <p className="mt-1 text-base font-semibold text-orange-300">
                  {ceoDesignation}
                </p>

                <div className="mt-5 space-y-4 text-base leading-8 text-blue-100/90">
                  <p className="whitespace-pre-line">{bioParagraph1}</p>

                  <p className="whitespace-pre-line">{bioParagraph2}</p>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[highlight1, highlight2].map((text, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-orange-300/40 hover:bg-white/10"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                        <Check size={14} strokeWidth={3} />
                      </span>

                      <p className="text-sm font-semibold leading-6 text-white">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
  );
}
