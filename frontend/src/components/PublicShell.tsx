"use client";

import { usePathname } from "next/navigation";
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
    <div className="flex min-h-screen flex-col">
      {/* Keyboard users can jump straight past the navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[#173B67] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Navbar />

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

        @media (prefers-reduced-motion: reduce) {
          .sk-route-fade {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
