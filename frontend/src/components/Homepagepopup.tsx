"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Megaphone,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const API_BASE_URL = API_URL.replace(/\/api$/, "");

type MediaType = "IMAGE" | "VIDEO";

type HomepagePopupData = {
  id: number;
  title: string;
  message: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  mediaType: MediaType;
  buttonText: string | null;
  buttonLink: string | null;
  isActive: boolean;
};

export default function HomepagePopup() {
  const [popup, setPopup] =
    useState<HomepagePopupData | null>(null);

  const [visible, setVisible] =
    useState(false);

  const [celebrating, setCelebrating] =
    useState(false);

  const [videoMuted, setVideoMuted] =
    useState(true);

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPopup() {
      try {
        const response = await fetch(
          `${API_URL}/homepage-popup`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        if (
          cancelled ||
          !result?.success ||
          !result?.data?.isActive
        ) {
          return;
        }

        setPopup(result.data);
        setVideoMuted(true);
        setVisible(true);
        setCelebrating(true);
      } catch (error) {
        console.error(
          "Load homepage popup error:",
          error
        );
      }
    }

    loadPopup();

    return () => {
      cancelled = true;
    };
  }, []);

  function closePopup() {
    setVisible(false);
    setCelebrating(false);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.muted = true;
    }
  }

  function toggleVideoSound() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.muted) {
      video.muted = false;
      video.volume = 0.8;

      setVideoMuted(false);

      void video.play().catch(() => {
        video.muted = true;
        setVideoMuted(true);
      });

      return;
    }

    video.muted = true;
    setVideoMuted(true);
  }

  if (!popup || !visible) {
    return null;
  }

  const imageSource = popup.imageUrl
    ? popup.imageUrl.startsWith("http")
      ? popup.imageUrl
      : `${API_BASE_URL}${popup.imageUrl}`
    : null;

  const videoSource = popup.videoUrl
    ? popup.videoUrl.startsWith("http")
      ? popup.videoUrl
      : `${API_BASE_URL}${popup.videoUrl}`
    : null;

  const buttonLink = popup.buttonLink?.trim();

  const isExternalLink =
    Boolean(buttonLink) &&
    /^https?:\/\//i.test(
      buttonLink as string
    );

  return (
    <>
      {/* =========================================================
          PREMIUM OUTSIDE POPUP ANIMATION
          ========================================================= */}
      {celebrating && (
        <div
          className="pointer-events-none fixed inset-0 z-[105] overflow-hidden"
          aria-hidden="true"
        >
          {/* Large soft ambient lights */}
          <div className="homepage-popup-outside-glow homepage-popup-outside-glow-1 absolute" />

          <div className="homepage-popup-outside-glow homepage-popup-outside-glow-2 absolute" />

          <div className="homepage-popup-outside-glow homepage-popup-outside-glow-3 absolute" />

          {/* Floating rings */}
          <div className="homepage-popup-outside-ring homepage-popup-outside-ring-1 absolute" />

          <div className="homepage-popup-outside-ring homepage-popup-outside-ring-2 absolute" />

          {/* Floating particles */}
          <span className="homepage-popup-outside-particle homepage-popup-outside-particle-1 absolute" />

          <span className="homepage-popup-outside-particle homepage-popup-outside-particle-2 absolute" />

          <span className="homepage-popup-outside-particle homepage-popup-outside-particle-3 absolute" />

          <span className="homepage-popup-outside-particle homepage-popup-outside-particle-4 absolute" />

          <span className="homepage-popup-outside-particle homepage-popup-outside-particle-5 absolute" />

          <span className="homepage-popup-outside-particle homepage-popup-outside-particle-6 absolute" />

          <span className="homepage-popup-outside-particle homepage-popup-outside-particle-7 absolute" />

          <span className="homepage-popup-outside-particle homepage-popup-outside-particle-8 absolute" />

          {/* Small twinkling accents */}
          <span className="homepage-popup-outside-star homepage-popup-outside-star-1 absolute" />

          <span className="homepage-popup-outside-star homepage-popup-outside-star-2 absolute" />

          <span className="homepage-popup-outside-star homepage-popup-outside-star-3 absolute" />

          <span className="homepage-popup-outside-star homepage-popup-outside-star-4 absolute" />
        </div>
      )}

      {/* =========================================================
          BACKDROP
          ========================================================= */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-sm sm:px-6">
        {/* =======================================================
            POPUP CARD
            ======================================================= */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="homepage-popup-title"
          className="homepage-popup-card relative z-[110] w-full max-w-[980px] overflow-hidden rounded-[1.6rem] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.34)]"
        >
          {/* =====================================================
              CONTENT-SIDE SOFT DECORATION
              ===================================================== */}
          <div
            className="pointer-events-none absolute right-0 top-0 z-0 h-[250px] w-[430px] opacity-80"
            style={{
              background:
                "radial-gradient(circle at 75% 15%, rgba(251,146,60,0.20), transparent 34%), radial-gradient(circle at 100% 55%, rgba(59,130,246,0.10), transparent 40%), radial-gradient(circle at 45% 0%, rgba(251,191,36,0.12), transparent 36%)",
            }}
          />

          {/* Decorative rings inside popup */}
          <div className="homepage-popup-decoration absolute right-[-25px] top-[-35px] z-[1] h-[150px] w-[150px] rounded-full border border-orange-200/50" />

          <div className="homepage-popup-decoration homepage-popup-decoration-delay absolute right-[75px] top-[-60px] z-[1] h-[110px] w-[110px] rounded-full border border-blue-200/40" />

          {/* Close button */}
          <button
            type="button"
            onClick={closePopup}
            aria-label="Close announcement"
            className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-[#173B67]"
          >
            <X size={18} />
          </button>

          {/* =====================================================
              52% MEDIA / 48% CONTENT
              ===================================================== */}
          <div className="grid md:grid-cols-[52%_48%]">
            {/* ===================================================
                MEDIA SECTION
                =================================================== */}
            <div className="relative min-h-[300px] overflow-hidden bg-gradient-to-br from-[#173B67] via-blue-700 to-orange-500 md:min-h-[450px]">
              {/* Media background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.26),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(251,146,60,0.30),transparent_42%)]" />

              {/* =================================================
                  VIDEO
                  ================================================= */}
              {popup.mediaType === "VIDEO" &&
              videoSource ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoSource}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    loop
                    playsInline
                    preload="auto"
                    onLoadedMetadata={(event) => {
                      const video =
                        event.currentTarget;

                      /*
                       * Start muted so browser
                       * autoplay is allowed.
                       */
                      video.muted = true;
                      video.volume = 0.8;

                      setVideoMuted(true);

                      void video.play().catch(() => {
                        /*
                         * Browser may delay
                         * autoplay.
                         */
                      });
                    }}
                  />

                  {/* Video overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-white/10" />

                  {/* Sound button */}
                  <button
                    type="button"
                    onClick={toggleVideoSound}
                    aria-label={
                      videoMuted
                        ? "Enable video sound"
                        : "Mute video"
                    }
                    className="absolute bottom-4 left-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-black/35 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/50"
                  >
                    {videoMuted ? (
                      <VolumeX size={17} />
                    ) : (
                      <Volume2 size={17} />
                    )}
                  </button>

                  {/* Sound hint */}
                  {videoMuted && (
                    <div className="absolute bottom-4 left-14 z-20 rounded-full border border-white/30 bg-black/30 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                      Tap for sound
                    </div>
                  )}
                </>
              ) : imageSource ? (
                /* =================================================
                   IMAGE
                   ================================================= */
                <>
                  <Image
                    src={imageSource}
                    alt={popup.title}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-white/10" />
                </>
              ) : (
                /* =================================================
                   FALLBACK
                   ================================================= */
                <div className="relative flex h-full min-h-[300px] items-center justify-center p-8 text-center md:min-h-[450px]">
                  <div>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                      <Megaphone size={30} />
                    </div>

                    <p className="mt-4 text-xs font-semibold text-white/80">
                      SK Computer Education
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ===================================================
                CONTENT SECTION
                =================================================== */}
            <div className="relative z-10 flex min-h-[300px] flex-col justify-center p-6 sm:p-8 md:min-h-[450px] md:p-8 lg:p-9">
              {/* Decorative top accent */}
              <div className="mb-5 flex items-center gap-2">
                <span className="h-[2px] w-8 rounded-full bg-orange-400" />

                <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />

                <span className="h-[2px] w-12 rounded-full bg-blue-200" />
              </div>

              {/* Title */}
              <h2
                id="homepage-popup-title"
                className="max-w-md text-2xl font-extrabold leading-[1.15] tracking-tight text-[#173B67] sm:text-[1.75rem]"
              >
                {popup.title}
              </h2>

              {/* Message */}
              {popup.message && (
                <p className="mt-3 max-w-md whitespace-pre-line text-sm leading-6 text-slate-600">
                  {popup.message}
                </p>
              )}

              {/* Optional button */}
              {buttonLink && popup.buttonText && (
                <div className="mt-5">
                  {isExternalLink ? (
                    <a
                      href={buttonLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 hover:shadow-lg"
                    >
                      {popup.buttonText}

                      <ArrowRight size={15} />
                    </a>
                  ) : (
                    <Link
                      href={buttonLink}
                      onClick={closePopup}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 hover:shadow-lg"
                    >
                      {popup.buttonText}

                      <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              )}

              {/* Bottom decorative detail */}
              <div className="mt-6 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-orange-400" />

                <span className="h-px w-14 bg-slate-200" />

                <span className="h-1 w-1 rounded-full bg-blue-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          ANIMATIONS
          ========================================================= */}
      <style jsx global>{`
        /* =======================================================
           OUTSIDE POPUP — SOFT AMBIENT GLOW
           ======================================================= */

        @keyframes homepagePopupOutsideGlow {
          0% {
            transform: translate3d(0, 12px, 0) scale(0.94);
            opacity: 0.18;
          }

          50% {
            transform: translate3d(0, -18px, 0) scale(1.06);
            opacity: 0.34;
          }

          100% {
            transform: translate3d(0, 12px, 0) scale(0.94);
            opacity: 0.18;
          }
        }

        .homepage-popup-outside-glow {
          width: 260px;
          height: 260px;
          border-radius: 9999px;
          filter: blur(35px);
          animation:
            homepagePopupOutsideGlow
            9s
            ease-in-out
            infinite;
        }

        .homepage-popup-outside-glow-1 {
          left: -70px;
          top: 12%;
          background: radial-gradient(
            circle,
            rgba(251, 191, 36, 0.2),
            transparent 68%
          );
        }

        .homepage-popup-outside-glow-2 {
          right: -80px;
          top: 18%;
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, 0.18),
            transparent 68%
          );
          animation-delay: 2s;
        }

        .homepage-popup-outside-glow-3 {
          right: 8%;
          bottom: -100px;
          background: radial-gradient(
            circle,
            rgba(251, 146, 60, 0.16),
            transparent 68%
          );
          animation-delay: 4s;
        }

        /* =======================================================
           OUTSIDE POPUP — FLOATING RINGS
           ======================================================= */

        @keyframes homepagePopupOutsideRing {
          0% {
            transform: scale(0.92) rotate(0deg);
            opacity: 0.12;
          }

          50% {
            transform: scale(1.06) rotate(6deg);
            opacity: 0.25;
          }

          100% {
            transform: scale(0.92) rotate(0deg);
            opacity: 0.12;
          }
        }

        .homepage-popup-outside-ring {
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.32);
          animation:
            homepagePopupOutsideRing
            10s
            ease-in-out
            infinite;
        }

        .homepage-popup-outside-ring-1 {
          left: 4%;
          top: 8%;
          width: 150px;
          height: 150px;
        }

        .homepage-popup-outside-ring-2 {
          right: 4%;
          bottom: 8%;
          width: 190px;
          height: 190px;
          animation-delay: 2.5s;
        }

        /* =======================================================
           OUTSIDE POPUP — FLOATING PARTICLES
           ======================================================= */

        @keyframes homepagePopupOutsideParticle {
          0% {
            transform: translate3d(0, 25px, 0) scale(0.5);
            opacity: 0;
          }

          20% {
            opacity: 0.65;
          }

          55% {
            opacity: 0.35;
          }

          100% {
            transform: translate3d(12px, -90px, 0) scale(1);
            opacity: 0;
          }
        }

        .homepage-popup-outside-particle {
          width: 5px;
          height: 5px;
          border-radius: 9999px;
          background: rgba(251, 191, 36, 0.75);
          box-shadow:
            0 0 8px rgba(251, 191, 36, 0.8),
            0 0 18px rgba(251, 146, 60, 0.35);
          animation:
            homepagePopupOutsideParticle
            5s
            ease-in-out
            infinite;
        }

        .homepage-popup-outside-particle-1 {
          left: 8%;
          top: 38%;
        }

        .homepage-popup-outside-particle-2 {
          left: 15%;
          top: 72%;
          animation-delay: 1s;
        }

        .homepage-popup-outside-particle-3 {
          left: 27%;
          top: 12%;
          animation-delay: 2s;
        }

        .homepage-popup-outside-particle-4 {
          right: 10%;
          top: 34%;
          animation-delay: 0.8s;
        }

        .homepage-popup-outside-particle-5 {
          right: 17%;
          top: 72%;
          animation-delay: 1.8s;
        }

        .homepage-popup-outside-particle-6 {
          right: 28%;
          top: 10%;
          animation-delay: 2.8s;
        }

        .homepage-popup-outside-particle-7 {
          left: 5%;
          bottom: 18%;
          animation-delay: 3.5s;
        }

        .homepage-popup-outside-particle-8 {
          right: 6%;
          bottom: 22%;
          animation-delay: 4.2s;
        }

        /* =======================================================
           OUTSIDE POPUP — TWINKLING STARS
           ======================================================= */

        @keyframes homepagePopupOutsideStar {
          0% {
            transform: scale(0.5);
            opacity: 0.15;
          }

          50% {
            transform: scale(1.35);
            opacity: 0.7;
          }

          100% {
            transform: scale(0.5);
            opacity: 0.15;
          }
        }

        .homepage-popup-outside-star {
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.85);
          box-shadow:
            0 0 8px rgba(255, 255, 255, 0.8),
            0 0 18px rgba(251, 191, 36, 0.45);
          animation:
            homepagePopupOutsideStar
            3.5s
            ease-in-out
            infinite;
        }

        .homepage-popup-outside-star-1 {
          left: 12%;
          top: 22%;
        }

        .homepage-popup-outside-star-2 {
          right: 12%;
          top: 30%;
          animation-delay: 0.8s;
        }

        .homepage-popup-outside-star-3 {
          left: 20%;
          bottom: 20%;
          animation-delay: 1.6s;
        }

        .homepage-popup-outside-star-4 {
          right: 20%;
          bottom: 18%;
          animation-delay: 2.4s;
        }

        /* =======================================================
           INSIDE POPUP — SOFT DECORATION
           ======================================================= */

        @keyframes homepagePopupDecoration {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 0.35;
          }

          50% {
            transform: rotate(8deg) scale(1.04);
            opacity: 0.6;
          }

          100% {
            transform: rotate(0deg) scale(1);
            opacity: 0.35;
          }
        }

        .homepage-popup-decoration {
          animation:
            homepagePopupDecoration
            9s
            ease-in-out
            infinite;
        }

        .homepage-popup-decoration-delay {
          animation-delay: 1.8s;
        }

        /* =======================================================
           POPUP ENTRANCE
           ======================================================= */

        @keyframes homepagePopupCard {
          0% {
            transform: translateY(16px) scale(0.975);
            opacity: 0;
          }

          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .homepage-popup-card {
          animation:
            homepagePopupCard
            0.38s
            ease-out
            both;
        }

        /* =======================================================
           REDUCED MOTION
           ======================================================= */

        @media (prefers-reduced-motion: reduce) {
          .homepage-popup-outside-glow,
          .homepage-popup-outside-ring,
          .homepage-popup-outside-particle,
          .homepage-popup-outside-star,
          .homepage-popup-decoration,
          .homepage-popup-card {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}