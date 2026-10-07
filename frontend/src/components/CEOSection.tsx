"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

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
    <section className="w-full bg-white px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl">
        {/* Heading */}
        <SectionHeading
          eyebrow="Our Leadership"
          title="Meet Our Founder & CEO"
        />

        {/* CEO Content */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* CEO IMAGE */}
          <Reveal direction="left" className="flex w-full justify-center">
            <div className="relative w-full max-w-[400px]">
              {/* Keeps the container perfectly square */}
              <div className="relative aspect-square w-full">
                {/* Orange outer ring */}
                <div className="absolute inset-0 rounded-full border-[8px] border-orange-500" />

                {/* Blue ring */}
                <div className="absolute inset-[10px] rounded-full bg-[#173B67]" />

                {/* White ring */}
                <div className="absolute inset-[18px] rounded-full bg-white" />

                {/* IMAGE */}
                <div className="absolute inset-[24px] overflow-hidden rounded-full">
                  <Image
                    src={ceoPhoto}
                    alt={`${ceoName} - ${ceoDesignation} of SK Computer Education`}
                    width={400}
                    height={500}
                    sizes="(min-width: 1024px) 400px, 80vw"
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                {/* Orange decoration */}
                <div className="absolute right-0 top-[18%] h-8 w-8 rounded-full bg-orange-500 shadow-md sm:h-9 sm:w-9" />

                {/* Blue decoration */}
                <div className="absolute bottom-[6%] left-[10%] h-6 w-6 rounded-full bg-[#173B67]" />
              </div>
            </div>
          </Reveal>

          {/* CEO TEXT */}
          <Reveal
            direction="right"
            delay={150}
            className="w-full min-w-0 text-center lg:text-left"
          >
            <h3 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              {ceoName}
            </h3>

            <p className="mt-1 font-semibold text-orange-500">
              {ceoDesignation}
            </p>

            {/* Dynamic Biography */}
            <div className="mt-6 space-y-5 text-left text-base leading-8 text-slate-600">
              <p className="whitespace-pre-line">{bioParagraph1}</p>

              <p className="whitespace-pre-line">{bioParagraph2}</p>
            </div>

            {/* Dynamic Highlights */}
            <div className="mt-7 space-y-3 text-left">
              <div className="flex items-start gap-3 rounded-xl bg-orange-50/60 p-3.5">
                <div className="mt-0.5 h-9 w-1 shrink-0 rounded-full bg-orange-500" />

                <p className="text-sm font-semibold leading-6 text-[#173B67]">
                  {highlight1}
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-blue-50/70 p-3.5">
                <div className="mt-0.5 h-9 w-1 shrink-0 rounded-full bg-[#173B67]" />

                <p className="text-sm font-semibold leading-6 text-[#173B67]">
                  {highlight2}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
