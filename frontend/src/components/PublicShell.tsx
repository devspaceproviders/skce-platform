"use client";

import { usePathname } from "next/navigation";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDashboard =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="sk-public flex min-h-screen flex-col">
      {/* Keyboard users can jump straight past the navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[#173B67] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Navbar />
      <TopBar />

      <main id="main-content" className="min-w-0 flex-1">
        <div key={pathname} className="sk-route-fade">
          {children}
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        /* Opacity only: a transform here would trap position:fixed
           children (popups, modals) inside this wrapper. */
        @keyframes skRouteFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .sk-route-fade {
          animation: skRouteFade 0.25s ease-out;
        }

        /* ---- Banner-style white touches on navy surfaces (public pages) ----
           Dot grid + thin rings only. Drawn on ::after behind the content,
           so each component keeps its own gradient, accents and hover. */
        .sk-public [class*="from-[#0F2F5F]"][class*="to-[#0B2A52]"][class*="rounded-2xl"],
        .sk-public footer,
        .sk-public section[class*="bg-[#173B67]"] {
          isolation: isolate;
        }
        .sk-public [class*="from-[#0F2F5F]"][class*="to-[#0B2A52]"][class*="rounded-2xl"]::after,
        .sk-public footer::after,
        .sk-public section[class*="bg-[#173B67]"]::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background-image:
            radial-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px),
            radial-gradient(circle at 100% 0, transparent 0 70px, rgba(255, 255, 255, 0.15) 70px 71px, rgba(255, 255, 255, 0.05) 71px 88px, rgba(255, 255, 255, 0.03) 88px 108px, transparent 108px);
          background-size: 22px 22px, auto;
          background-repeat: repeat, no-repeat;
          -webkit-mask-image: linear-gradient(160deg, #000 0%, rgba(0, 0, 0, 0.35) 70%, transparent 100%);
          mask-image: linear-gradient(160deg, #000 0%, rgba(0, 0, 0, 0.35) 70%, transparent 100%);
        }
        /* Page headings + CEO card: full banner rings on both corners */
        .sk-public [class*="from-[#071C3A]"][class*="via-[#0F2F5F]"]::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background-image:
            radial-gradient(circle at 94% -8%, transparent 0 150px, rgba(255, 255, 255, 0.16) 150px 151px, rgba(255, 255, 255, 0.055) 151px 176px, rgba(255, 255, 255, 0.035) 176px 204px, transparent 204px),
            radial-gradient(circle at 3% 112%, transparent 0 100px, rgba(255, 255, 255, 0.13) 100px 101px, rgba(255, 255, 255, 0.045) 101px 120px, rgba(255, 255, 255, 0.03) 120px 142px, transparent 142px),
            radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: auto, auto, 22px 22px;
          background-repeat: no-repeat, no-repeat, repeat;
        }
        /* Login / auth pages + registration banner: same ring touches */
        .sk-public .sk-auth-bg {
          position: relative;
          isolation: isolate;
        }
        .sk-public .sk-auth-bg::after,
        .sk-public .sk-reg-band::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background-image:
            radial-gradient(circle at 96% -6%, transparent 0 190px, rgba(255, 255, 255, 0.16) 190px 191px, rgba(255, 255, 255, 0.055) 191px 220px, rgba(255, 255, 255, 0.035) 220px 252px, transparent 252px),
            radial-gradient(circle at 2% 108%, transparent 0 130px, rgba(255, 255, 255, 0.13) 130px 131px, rgba(255, 255, 255, 0.045) 131px 154px, rgba(255, 255, 255, 0.03) 154px 180px, transparent 180px);
          background-repeat: no-repeat;
        }
        .sk-public .sk-reg-band::after {
          background-image:
            radial-gradient(circle at 95% -14%, transparent 0 130px, rgba(255, 255, 255, 0.16) 130px 131px, rgba(255, 255, 255, 0.055) 131px 154px, rgba(255, 255, 255, 0.035) 154px 180px, transparent 180px),
            radial-gradient(circle at 3% 112%, transparent 0 90px, rgba(255, 255, 255, 0.13) 90px 91px, rgba(255, 255, 255, 0.045) 91px 108px, rgba(255, 255, 255, 0.03) 108px 128px, transparent 128px);
        }
        /* Replace muddy orange-on-navy glows with clean blue light.
           Orange stays only on lines, buttons and small accents. */
        .sk-public .sk-auth-bg,
        .sk-public .sk-reg-band {
          background:
            radial-gradient(900px 420px at 85% -15%, rgba(59, 130, 246, 0.3), transparent 60%),
            radial-gradient(800px 380px at -5% 110%, rgba(37, 99, 235, 0.38), transparent 60%),
            linear-gradient(135deg, #071c3a 0%, #0f2f5f 50%, #173b67 100%);
        }
        .sk-public [class*="bg-orange-"][class*="blur-"],
        .sk-public [class*="sk-hero-orb"][class*="bg-orange"] {
          background-color: rgba(96, 165, 250, 0.2) !important;
        }
        .sk-public .sk-reg-orb, .sk-public .sk-orb { background-image: none !important; }
        .sk-public .sk-orb-b,
        .sk-public .sk-reg-orb-b {
          background: #3b82f6;
          opacity: 0.3;
        }
        .sk-public .sk-orb-sm,
        .sk-public .sk-reg-orb-sm,
        .sk-public .sk-hero-orb {
          background-color: rgba(96, 165, 250, 0.28);
        }
        /* Orange glows blended over navy turn muddy brown, so on navy
           surfaces the glows are a clean sky blue instead. Orange stays
           for buttons, lines and accents. */
        .sk-public [class*="from-[#071C3A]"] [class*="bg-orange-"][class*="blur-"],
        .sk-public [class*="from-[#0F2F5F]"] [class*="bg-orange-"][class*="blur-"],
        .sk-public .sk-auth-bg [class*="bg-orange-"][class*="blur-"],
        .sk-public section[class*="bg-[#173B67]"] [class*="bg-orange-"][class*="blur-"],
        .sk-public footer [class*="bg-orange-"][class*="blur-"] {
          background-color: rgba(96, 165, 250, 0.22) !important;
        }
        .sk-public .sk-orb-b,
        .sk-public .sk-reg-orb-b {
          background: #3b82f6 !important;
          opacity: 0.3 !important;
        }
        .sk-public .sk-auth-bg {
          background:
            radial-gradient(1100px 520px at 85% -10%, rgba(59, 130, 246, 0.3), transparent 60%),
            radial-gradient(900px 500px at -10% 110%, rgba(37, 99, 235, 0.35), transparent 60%),
            linear-gradient(135deg, #071c3a 0%, #0f2f5f 48%, #173b67 100%) !important;
        }
        .sk-public .sk-reg-band {
          background:
            radial-gradient(900px 380px at 85% -20%, rgba(59, 130, 246, 0.3), transparent 60%),
            radial-gradient(800px 360px at -5% 110%, rgba(37, 99, 235, 0.4), transparent 60%),
            linear-gradient(135deg, #071c3a 0%, #0f2f5f 50%, #173b67 100%) !important;
        }
        .sk-public footer { overflow: hidden; }
        .sk-public footer::after,
        .sk-public section[class*="bg-[#173B67]"]::after {
          background-image:
            radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            radial-gradient(circle at 94% 0, transparent 0 140px, rgba(255, 255, 255, 0.15) 140px 141px, rgba(255, 255, 255, 0.05) 141px 166px, rgba(255, 255, 255, 0.03) 166px 194px, transparent 194px);
        }
      `}</style>
    </div>
  );
}
