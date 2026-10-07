"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

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
      className={`sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur transition-shadow duration-300 ${
        scrolled
          ? "border-slate-200 shadow-md shadow-slate-900/5"
          : "border-slate-100 shadow-sm"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-7xl items-center justify-between px-5 transition-[height] duration-300 sm:px-6 ${
          scrolled ? "h-[66px]" : "h-[76px]"
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          className={`flex shrink-0 items-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
            scrolled
              ? "h-[58px] w-[160px] sm:w-[178px]"
              : "h-[70px] w-[175px] sm:w-[195px]"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/images/skce-logo.png"
            alt="SK Computer Education"
            width={155}
            height={70}
            priority
            className="h-full w-full object-contain object-left"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 xl:flex"
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-1 text-[15px] font-semibold transition-colors duration-200 after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-orange-500 after:transition-transform after:duration-300 after:content-[''] focus:outline-none focus-visible:text-orange-500 ${
                  active
                    ? "text-[#173B67] after:scale-x-100"
                    : "text-[#173B67] after:scale-x-0 hover:text-orange-500 hover:after:scale-x-100"
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
            className="inline-flex h-10 items-center rounded-xl border border-[#173B67] px-5 text-sm font-semibold text-[#173B67] transition duration-200 hover:-translate-y-px hover:bg-[#173B67] hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 active:translate-y-0"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition duration-200 hover:-translate-y-px hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0"
          >
            Register Now
          </Link>
        </div>

        {/* Tablet / Mobile Actions */}
        <div className="flex items-center gap-2 xl:hidden">
          <Link
            href="/login"
            className="hidden h-10 items-center rounded-xl border border-[#173B67] px-4 text-sm font-semibold text-[#173B67] transition duration-200 hover:bg-[#173B67] hover:text-white sm:inline-flex"
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#173B67] transition duration-200 hover:border-orange-500 hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
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
                      active ? "text-orange-500" : "text-[#173B67]"
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
                className="flex h-11 items-center justify-center rounded-xl border border-[#173B67] px-4 text-sm font-semibold text-[#173B67] transition duration-200 active:scale-[0.98]"
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
