"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/packages", label: "Packages" },
  { href: "/trainers", label: "Trainers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  // Compact the header and strengthen its shadow once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu after navigating.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close the mobile menu with Esc.
  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur transition-shadow duration-300 ${
        scrolled ? "shadow-lg shadow-slate-900/10" : "shadow-sm"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 transition-[height] duration-300 sm:px-6 ${
          scrolled ? "h-[68px]" : "h-[84px]"
        }`}
      >
        {/* Brand */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/images/skce-logo.png"
            alt="SK Computer Education"
            width={150}
            height={68}
            priority
            className={`w-auto object-contain transition-all duration-300 group-hover:scale-[1.03] ${scrolled ? "h-[52px]" : "h-[66px]"}`}
          />
          <span aria-hidden="true" className="hidden h-9 w-px bg-gradient-to-b from-transparent via-[#F97316] to-transparent lg:block" />
          <span className="hidden leading-tight lg:block">
            <span className="block text-[15px] font-extrabold tracking-tight text-[#0F2F5F]">SK Computer Education</span>
            <span className="mt-0.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#F97316]">Learn · Practice · Succeed</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 xl:flex"
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                  active
                    ? "bg-[#0F2F5F] text-white shadow-md shadow-blue-900/25"
                    : "text-[#0F2F5F]/80 hover:bg-white hover:text-orange-500 hover:shadow-sm"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 xl:flex">
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-full border-2 border-[#0F2F5F] px-6 text-sm font-bold text-[#0F2F5F] transition duration-200 hover:-translate-y-px hover:bg-[#0F2F5F] hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 active:translate-y-0"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#F97316] to-[#FB8A2E] px-6 text-sm font-bold text-white shadow-md shadow-orange-500/30 transition duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-orange-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0"
          >
            Register Now
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Tablet / Mobile Actions */}
        <div className="flex items-center gap-2 xl:hidden">
          <Link
            href="/login"
            className="hidden h-10 items-center rounded-xl border border-[#0F2F5F] px-4 text-sm font-semibold text-[#0F2F5F] transition duration-200 hover:bg-[#0F2F5F] hover:text-white sm:inline-flex"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="hidden h-10 items-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-orange-600 sm:inline-flex"
          >
            Register
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#0F2F5F] transition duration-200 hover:border-orange-500 hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            aria-label={
              mobileOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Menu */}
      {mobileOpen && (
        <div className="sk-menu-in w-full border-t border-slate-100 bg-white xl:hidden">
          <div className="mx-auto max-w-7xl px-5 py-4 sm:px-6">
            <nav aria-label="Mobile navigation" className="flex flex-col">
              {NAV_LINKS.map((link, index) => {
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className={`sk-menu-item flex items-center justify-between border-b border-slate-100 py-3.5 text-sm font-semibold transition-colors duration-200 hover:text-orange-500 ${
                      active ? "text-orange-500" : "text-[#0F2F5F]"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Login / Register */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:hidden">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 items-center justify-center rounded-xl border border-[#0F2F5F] px-4 text-sm font-semibold text-[#0F2F5F] transition duration-200 active:scale-[0.98]"
              >
                Login
              </Link>

              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition duration-200 active:scale-[0.98]"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes skMenuIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes skMenuItem {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .sk-menu-in {
          animation: skMenuIn 0.22s ease-out both;
        }

        .sk-menu-item {
          animation: skMenuItem 0.3s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .sk-menu-in,
          .sk-menu-item {
            animation: none;
          }
        }
      `}</style>
    </header>
  );
}
