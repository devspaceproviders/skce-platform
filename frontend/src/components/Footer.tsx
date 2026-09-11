import Link from "next/link";
import { GraduationCap, Phone, Mail, MapPin } from "lucide-react";
import { COURSE_OPTIONS } from "@/lib/courseList";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Trainers", href: "/trainers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-slate-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
              <GraduationCap size={18} />
            </span>
            <span className="text-lg font-bold text-white">SKCE</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            India&apos;s premier tech institute offering career-focused training
            in programming, data science, ERP, and more.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-sm font-bold text-white">Quick Links</h3>
          <ul className="space-y-2.5 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Courses */}
        <div>
          <h3 className="mb-4 text-sm font-bold text-white">Courses</h3>
          <ul className="space-y-2.5 text-sm">
            {COURSE_OPTIONS.map((course) => (
              <li key={course.slug}>
                <Link href={`/courses/${course.slug}`} className="transition hover:text-white">
                  {course.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-sm font-bold text-white">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <Phone size={15} /> +91 98765 00000
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={15} /> admissions@skce.in
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              Plot 42, Hitech City, Hyderabad — 500081
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-slate-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} SKCE Institute. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Use</Link>
            <Link href="/refund-policy" className="hover:text-white">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
