"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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

  const closePopup = useCallback(() => {
    setVisible(false);
    setCelebrating(false);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.muted = true;
    }
  }, []);

  // Close with Esc and lock page scroll while the popup is open.
  useEffect(() => {
    if (!visible) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopup();
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [visible, closePopup]);

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

  const buttonClasses =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition duration-200 hover:-translate-y-px hover:bg-orange-600 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0";

  return (
    <>
      {/* Soft ambient glow behind the popup (decorative only) */}
      {celebrating && (
        <div
          className="pointer-events-none fixed inset-0 z-[105] overflow-hidden"
          aria-hidden="true"
        >
          <div className="homepage-popup-glow homepage-popup-glow-1 absolute" />
          <div className="homepage-popup-glow homepage-popup-glow-2 absolute" />
          <div className="homepage-popup-glow homepage-popup-glow-3 absolute" />
        </div>
      )}

      {/* Backdrop */}
      <div
        className="homepage-popup-overlay fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#0B1B33]/60 px-4 py-6 backdrop-blur-sm sm:px-6"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closePopup();
          }
        }}
      >
        {/* Popup card */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="homepage-popup-title"
          className="homepage-popup-card relative z-[110] w-full max-w-[960px] overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_90px_rgba(11,27,51,0.35)]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closePopup}
            aria-label="Close announcement"
            className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition duration-200 hover:bg-white hover:text-[#173B67] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            <X size={18} />
          </button>

          <div className="grid md:grid-cols-[52%_48%]">
            {/* ================= MEDIA ================= */}
            <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-br from-[#173B67] to-blue-700 md:min-h-[440px]">
              {popup.mediaType === "VIDEO" && videoSource ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoSource}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    loop
                    playsInline
                    preload="auto"
                    aria-label={popup.title}
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

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-white/5" />

                  {/* Sound button */}
                  <button
                    type="button"
                    onClick={toggleVideoSound}
                    aria-label={
                      videoMuted
                        ? "Enable video sound"
                        : "Mute video"
                    }
                    className="absolute bottom-4 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/40 text-white shadow-lg backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {videoMuted ? (
                      <VolumeX size={17} />
                    ) : (
                      <Volume2 size={17} />
                    )}
                  </button>

                  {/* Sound hint */}
                  {videoMuted && (
                    <div className="absolute bottom-[1.15rem] left-16 z-20 rounded-full border border-white/30 bg-black/35 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                      Tap for sound
                    </div>
                  )}
                </>
              ) : imageSource ? (
                <>
                  <Image
                    src={imageSource}
                    alt={popup.title}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-white/5" />
                </>
              ) : (
                /* Fallback when no media is provided */
                <div className="relative flex h-full min-h-[260px] items-center justify-center p-8 text-center md:min-h-[440px]">
                  <div>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                      <Megaphone size={30} />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-white/85">
                      SK Computer Education
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ================= CONTENT ================= */}
            <div className="relative z-10 flex min-h-[260px] flex-col justify-center p-6 sm:p-8 md:min-h-[440px] lg:p-10">
              {/* Accent */}
              <div className="mb-5 flex items-center gap-2" aria-hidden="true">
                <span className="h-[3px] w-10 rounded-full bg-orange-500" />
                <span className="h-[3px] w-4 rounded-full bg-[#173B67]" />
              </div>

              {/* Title */}
              <h2
                id="homepage-popup-title"
                className="max-w-md pr-8 text-2xl font-bold leading-[1.2] tracking-tight text-[#173B67] sm:text-[1.75rem]"
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
                <div className="mt-6">
                  {isExternalLink ? (
                    <a
                      href={buttonLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClasses}
                    >
                      {popup.buttonText}

                      <ArrowRight size={15} />
                    </a>
                  ) : (
                    <Link
                      href={buttonLink}
                      onClick={closePopup}
                      className={buttonClasses}
                    >
                      {popup.buttonText}

                      <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes homepagePopupGlow {
          0% {
            transform: translate3d(0, 10px, 0) scale(0.96);
            opacity: 0.16;
          }

          50% {
            transform: translate3d(0, -14px, 0) scale(1.05);
            opacity: 0.3;
          }

          100% {
            transform: translate3d(0, 10px, 0) scale(0.96);
            opacity: 0.16;
          }
        }

        .homepage-popup-glow {
          width: 260px;
          height: 260px;
          border-radius: 9999px;
          filter: blur(35px);
          animation: homepagePopupGlow 9s ease-in-out infinite;
        }

        .homepage-popup-glow-1 {
          left: -70px;
          top: 12%;
          background: radial-gradient(
            circle,
            rgba(251, 146, 60, 0.22),
            transparent 68%
          );
        }

        .homepage-popup-glow-2 {
          right: -80px;
          top: 18%;
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, 0.2),
            transparent 68%
          );
          animation-delay: 2s;
        }

        .homepage-popup-glow-3 {
          right: 8%;
          bottom: -100px;
          background: radial-gradient(
            circle,
            rgba(251, 146, 60, 0.16),
            transparent 68%
          );
          animation-delay: 4s;
        }

        @keyframes homepagePopupOverlay {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes homepagePopupCard {
          from {
            transform: translateY(14px) scale(0.98);
            opacity: 0;
          }

          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .homepage-popup-overlay {
          animation: homepagePopupOverlay 0.2s ease-out both;
        }

        .homepage-popup-card {
          animation: homepagePopupCard 0.3s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .homepage-popup-glow,
          .homepage-popup-overlay,
          .homepage-popup-card {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
