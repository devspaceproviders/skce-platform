import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { COURSE_OPTIONS } from "@/lib/courseList";

import Reveal from "@/components/Reveal";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Packages", href: "/packages" },
  { label: "Trainers", href: "/trainers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const LINK_CLASS =
  "inline-block rounded text-slate-300 transition duration-200 hover:translate-x-1 hover:text-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
        {children}
      </h3>
      <span className="mt-2 block h-0.5 w-8 rounded-full bg-orange-500" />
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative bg-[#0B1220] text-slate-300">
      {/* Brand accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-[#1459B8] to-[#173B67]" />

      {/* Main Footer */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <Reveal>
          <Link
            href="/"
            className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <div className="overflow-hidden rounded-xl bg-white px-3 py-2 transition duration-300 hover:shadow-lg hover:shadow-orange-500/10">
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
            className="group mt-5 inline-flex items-center gap-2 rounded text-sm font-semibold text-orange-400 transition duration-200 hover:text-orange-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
          >
            Learn More About SK Computer Education
            <ArrowRight
              size={15}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </Reveal>

        {/* Quick Links */}
        <Reveal delay={100}>
          <FooterHeading>Quick Links</FooterHeading>

          <ul className="space-y-3 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK_CLASS}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Popular Courses */}
        <Reveal delay={200}>
          <FooterHeading>Popular Courses</FooterHeading>

          <ul className="space-y-3 text-sm">
            {COURSE_OPTIONS.slice(0, 6).map((course) => (
              <li key={course.slug}>
                <Link
                  href={`/courses/${course.slug}`}
                  className={LINK_CLASS}
                >
                  {course.title}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/courses"
            className="group mt-5 inline-flex items-center gap-2 rounded text-sm font-semibold text-orange-400 transition duration-200 hover:text-orange-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
          >
            View All Courses
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </Reveal>

        {/* Contact */}
        <Reveal delay={300}>
          <FooterHeading>Contact Us</FooterHeading>

          <ul className="space-y-4 text-sm">
            <li className="group flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-orange-400 transition duration-200 group-hover:bg-orange-500 group-hover:text-white">
                <Phone size={15} />
              </span>
              <a
                href="tel:+919885422483"
                className="pt-1 transition-colors duration-200 hover:text-orange-400"
              >
                +91 98854 22483
              </a>
            </li>

            <li className="group flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-orange-400 transition duration-200 group-hover:bg-orange-500 group-hover:text-white">
                <Mail size={15} />
              </span>
              <a
                href="mailto:admissions@skce.in"
                className="break-all pt-1 transition-colors duration-200 hover:text-orange-400"
              >
                admissions@skce.in
              </a>
            </li>

            <li className="group flex items-start gap-3 leading-6">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-orange-400 transition duration-200 group-hover:bg-orange-500 group-hover:text-white">
                <MapPin size={15} />
              </span>
              <span className="pt-0.5">
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
        </Reveal>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-slate-400 sm:flex-row">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} SK Computer Education. All rights
            reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href="/privacy-policy"
              className="transition-colors duration-200 hover:text-orange-400"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="transition-colors duration-200 hover:text-orange-400"
            >
              Terms of Use
            </Link>

            <Link
              href="/refund-policy"
              className="transition-colors duration-200 hover:text-orange-400"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
