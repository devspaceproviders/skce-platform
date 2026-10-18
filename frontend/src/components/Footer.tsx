import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Navigation,
  MessageCircle,
  ArrowRight,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/socialLinks";

const PORTAL_LINKS = [
  { label: "Student & Trainer Login", href: "/login" },
  { label: "Register Now", href: "/register" },
  { label: "Book a Free Demo", href: "/contact" },
];

const SOCIAL_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
};

const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=" +
  encodeURIComponent(
    "SK Computer Education, Door NO: 22-8-215/2a, Old Grand world, Marasa Sarovar Premium, SLV Nagar, Tirupati, Andhra Pradesh 517501"
  );

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="text-[13px] font-bold uppercase tracking-wider text-white">
        {children}
      </h3>
      <span className="mt-1.5 block h-0.5 w-7 rounded-full bg-orange-500" />
    </div>
  );
}

function ContactRow({
  icon: Icon,
  children,
}: {
  icon: typeof Phone;
  children: React.ReactNode;
}) {
  return (
    <li className="group flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-orange-400 transition duration-200 group-hover:bg-orange-500 group-hover:text-white">
        <Icon size={14} />
      </span>
      <div className="min-w-0 pt-0.5 leading-5">{children}</div>
    </li>
  );
}

export default function Footer() {
  return (
    <footer className="relative bg-[linear-gradient(180deg,#12365F_0%,#0F2F5F_55%,#0B2A55_100%)] text-slate-300">
      {/* Brand accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-[#1459B8] to-[#173B67]" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_1fr] lg:gap-10">
        {/* Brand */}
        <div>
          <Link
            href="/"
            className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <span className="overflow-hidden rounded-lg bg-white px-2.5 py-1.5">
              <Image
                src="/images/skce-logo.png"
                alt="SK Computer Education"
                width={190}
                height={62}
                className="h-auto w-[130px]"
              />
            </span>
          </Link>

          <p className="mt-3 max-w-xs text-[13px] leading-6 text-slate-400">
            Practical computer and digital learning for students, jobseekers
            and professionals in Tirupati.
          </p>

          <div className="mt-4 flex items-center gap-2">
            {SOCIAL_LINKS.map(({ key, label, href }) => {
              const Icon = SOCIAL_ICONS[key];
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition duration-200 hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-500"
                >
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Get in touch */}
        <div>
          <FooterHeading>Get in Touch</FooterHeading>
          <ul className="space-y-2.5 text-[13px]">
            <ContactRow icon={Phone}>
              <a
                href="tel:+919885422483"
                className="transition-colors duration-200 hover:text-orange-400"
              >
                +91 98854 22483
              </a>
            </ContactRow>
            <ContactRow icon={MessageCircle}>
              <a
                href="https://wa.me/919885422483"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 hover:text-orange-400"
              >
                Chat on WhatsApp
              </a>
            </ContactRow>
            <ContactRow icon={Mail}>
              <a
                href="mailto:skce.snpuram@gmail.com"
                className="break-all transition-colors duration-200 hover:text-orange-400"
              >
                skce.snpuram@gmail.com
              </a>
            </ContactRow>
          </ul>
        </div>

        {/* Visit us */}
        <div>
          <FooterHeading>Visit Us</FooterHeading>
          <div className="flex items-start gap-2.5 text-[13px] leading-5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-orange-400">
              <MapPin size={14} />
            </span>
            <address className="pt-0.5 not-italic">
              Door NO: 22-8-215/2a, Old Grand world, Marasa Sarovar Premium,
              SLV Nagar, Tirupati, Andhra Pradesh 517501
            </address>
          </div>
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600"
          >
            <Navigation size={13} />
            Get Directions
          </a>
        </div>

        {/* Student corner */}
        <nav aria-label="Student portal and admissions">
          <FooterHeading>Admissions &amp; Portal</FooterHeading>
          <ul className="space-y-2 text-[13px]">
            {PORTAL_LINKS.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="group inline-flex items-center gap-1.5 rounded text-slate-300 transition duration-200 hover:text-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
                >
                  <ArrowRight
                    size={13}
                    className="text-orange-400 transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-3.5 text-xs text-slate-400 sm:flex-row">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} SK Computer Education. All rights
            reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
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
