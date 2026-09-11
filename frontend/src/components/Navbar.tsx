import Link from "next/link";
import { GraduationCap } from "lucide-react";
import TopBar from "./TopBar";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Trainers", href: "/trainers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50">
      <TopBar />
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
              <GraduationCap size={18} />
            </span>
            <span className="text-lg font-bold tracking-tight">SKCE</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-slate-700 hover:text-brand sm:block"
            >
              Login
            </Link>
            <Link
              href="/contact"
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Free Demo
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
