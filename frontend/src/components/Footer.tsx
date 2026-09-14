import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { COURSE_OPTIONS } from "@/lib/courseList";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Packages", href: "/packages" },
  { label: "Trainers", href: "/trainers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0B1220] text-slate-300">
      {/* Main Footer */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">

        {/* Brand */}
        <div>
          <Link href="/" className="inline-flex items-center">
            <div className="overflow-hidden rounded-lg bg-white px-3 py-2">
              <Image
                src="/images/skce-logo.png"
                alt="SK Computer Education"
                width={190}
                height={62}
                className="h-auto w-[170px]"
              />
            </div>
          </Link>

          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
            SK Computer Education provides practical computer and digital
            learning for school students, college students, jobseekers,
            professionals and lifelong learners.
          </p>

          <Link
            href="/about"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-400 transition hover:text-orange-300"
          >
            Learn More About SKCE
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
            Quick Links
          </h3>

          <ul className="space-y-3 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition hover:text-orange-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Popular Courses */}
        <div>
          <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
            Popular Courses
          </h3>

          <ul className="space-y-3 text-sm">
            {COURSE_OPTIONS.slice(0, 6).map((course) => (
              <li key={course.slug}>
                <Link
                  href={`/courses/${course.slug}`}
                  className="transition hover:text-orange-400"
                >
                  {course.title}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/courses"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-400 transition hover:text-orange-300"
          >
            View All Courses
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
            Contact Us
          </h3>

          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <Phone
                size={17}
                className="mt-0.5 shrink-0 text-orange-400"
              />
              <a
                href="tel:+919885422483"
                className="transition hover:text-orange-400"
              >
                +91 98854 22483
              </a>
            </li>

            <li className="flex items-start gap-3">
              <Mail
                size={17}
                className="mt-0.5 shrink-0 text-orange-400"
              />
              <a
                href="mailto:admissions@skce.in"
                className="transition hover:text-orange-400"
              >
                admissions@skce.in
              </a>
            </li>

            <li className="flex items-start gap-3 leading-6">
              <MapPin
                size={17}
                className="mt-1 shrink-0 text-orange-400"
              />
              <span>
                Door NO: 22-8-215/2a,
                <br />
                Old Grand world,
                <br />
                Marasa Sarovar Premium,
                <br />
                SLV Nagar, Tirupati,
                <br />
                Andhra Pradesh 517501
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-slate-400 sm:flex-row">

          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} SK Computer Education. All rights
            reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href="/privacy-policy"
              className="transition hover:text-orange-400"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-orange-400"
            >
              Terms of Use
            </Link>

            <Link
              href="/refund-policy"
              className="transition hover:text-orange-400"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}