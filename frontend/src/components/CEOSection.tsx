"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
    <section className="w-full bg-white px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto w-full max-w-6xl">

        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
            Our Leadership
          </p>

          <h2 className="text-3xl font-extrabold text-[#173B67] sm:text-4xl">
            Meet Our Founder & CEO
          </h2>

          <div className="mx-auto mt-4 flex justify-center gap-2">
            <div className="h-1 w-16 rounded-full bg-orange-500" />
            <div className="h-1 w-6 rounded-full bg-[#173B67]" />
          </div>
        </div>

        {/* CEO Content */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* CEO IMAGE */}
          <div className="flex w-full justify-center">
            <div className="relative w-full max-w-[420px]">

              {/* Keeps the container perfectly square */}
              <div className="aspect-square w-full">

                {/* Orange outer ring */}
                <div className="absolute inset-0 rounded-full border-[10px] border-orange-500" />

                {/* Blue ring */}
                <div className="absolute inset-[12px] rounded-full bg-[#173B67]" />

                {/* White ring */}
                <div className="absolute inset-[20px] rounded-full bg-white" />

                {/* IMAGE */}
                <div className="absolute inset-[27px] overflow-hidden rounded-full">
                  <Image
                    src={ceoPhoto}
                    alt={`${ceoName} - ${ceoDesignation} of SK Computer Education`}
                    width={400}
                    height={500}
                    priority
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                {/* Orange decoration */}
                <div className="absolute right-0 top-20 h-9 w-9 rounded-full bg-orange-500 shadow-md sm:h-10 sm:w-10" />

                {/* Blue decoration */}
                <div className="absolute bottom-4 left-10 h-7 w-7 rounded-full bg-[#173B67]" />

              </div>
            </div>
          </div>

          {/* CEO TEXT */}
          <div className="w-full min-w-0">

            <h3 className="text-2xl font-bold text-[#173B67] sm:text-3xl">
              {ceoName}
            </h3>

            <p className="mt-1 font-semibold text-orange-500">
              {ceoDesignation}
            </p>

            {/* Dynamic Biography */}
            <div className="mt-6 space-y-5 text-base leading-8 text-slate-600 sm:text-[17px]">

              <p className="whitespace-pre-line">
                {bioParagraph1}
              </p>

              <p className="whitespace-pre-line">
                {bioParagraph2}
              </p>

            </div>

            {/* Dynamic Highlights */}
            <div className="mt-7 space-y-4">

              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-1 shrink-0 rounded-full bg-orange-500" />

                <p className="text-sm font-semibold leading-6 text-[#173B67]">
                  {highlight1}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-1 shrink-0 rounded-full bg-[#173B67]" />

                <p className="text-sm font-semibold leading-6 text-[#173B67]">
                  {highlight2}
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}