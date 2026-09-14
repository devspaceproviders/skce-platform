"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white shadow-sm">
      <div className="mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between px-5 sm:px-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex h-[70px] w-[175px] shrink-0 items-center sm:w-[195px]"
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
        <nav className="hidden items-center gap-6 xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-semibold text-[#173B67] transition-colors hover:text-orange-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 xl:flex">

          <Link
            href="/login"
            className="rounded-lg border border-[#173B67] px-5 py-2.5 text-sm font-semibold text-[#173B67] transition hover:bg-[#173B67] hover:text-white"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            Register Now
          </Link>

        </div>

        {/* Tablet / Mobile Actions */}
        <div className="flex items-center gap-2 xl:hidden">

          <Link
            href="/login"
            className="hidden rounded-lg border border-[#173B67] px-4 py-2 text-sm font-semibold text-[#173B67] sm:inline-flex"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="hidden rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white sm:inline-flex"
          >
            Register
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-[#173B67] transition hover:border-orange-500 hover:text-orange-500"
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
        <div className="w-full border-t border-slate-100 bg-white xl:hidden">
          <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6">

            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="border-b border-slate-100 py-3.5 text-sm font-semibold text-[#173B67] transition hover:text-orange-500"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Login / Register */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:hidden">

              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center rounded-lg border border-[#173B67] px-4 py-3 text-sm font-semibold text-[#173B67]"
              >
                Login
              </Link>

              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Register
              </Link>

            </div>
          </div>
        </div>
      )}
    </header>
  );
}