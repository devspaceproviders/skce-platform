import { Suspense } from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle, Navigation } from "lucide-react";
import BookDemoForm from "@/components/BookDemoForm";
import PageHero from "@/components/PageHero";
import QuickMessageForm from "@/components/QuickMessageForm";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Contact — SK Computer Education",
};

// Opens Google Maps directions. With no origin given, Google Maps starts
// from the visitor's current location.
const DESTINATION =
  "SK Computer Education, Door NO: 22-8-215/2a, Old Grand world, Marasa Sarovar Premium, SLV Nagar, Tirupati, Andhra Pradesh 517501";
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  DESTINATION
)}&travelmode=driving`;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  mapUrl?: string | null;
}

async function getContactSettings(): Promise<ContactSettings> {
  try {
    const response = await fetch(`${API_URL}/contact/settings`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to load contact settings");
    }

    const result = await response.json();

    return result.data;
  } catch (error) {
    console.error("Contact settings load error:", error);

    return {
      phone: "+91 98854 22483",
      email: "admissions@skce.in",
      address:
        "Door NO: 22-8-215/2a, Old Grand world, Marasa Sarovar Premium, SLV Nagar, Tirupati, Andhra Pradesh 517501",
      workingHours: "Contact us for current timings",
      mapUrl: null,
    };
  }
}

export default async function ContactPage() {
  const contact = await getContactSettings();

  const phoneHref = `tel:${contact.phone.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <PageHero
        eyebrow="Get in Touch"
        title="Contact Us"
        description="Have a question about our courses or want to experience a free demo class? We're here to help."
        align="left"
        contentWidth="max-w-2xl"
      />

      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#E6EEF9] via-[#F4F7FC] to-[#E6EEF9] px-6 py-10 sm:py-14">
        <div className="sk-hero-orb pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="sk-hero-orb-2 pointer-events-none absolute -right-24 bottom-10 -z-10 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Reveal>
                <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F2F5F] to-[#0B2A52] p-6 text-white shadow-xl shadow-blue-950/15 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-orange-500 before:via-blue-500 before:to-[#173B67] before:content-[''] sm:p-8">
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300 sm:text-sm">
                      Contact Information
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Get in Touch
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-blue-100/80">
                      Reach out to us for course information, admissions, or
                      any other assistance.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <ContactRow icon={<Phone size={19} />} label="Phone">
                      <a
                        href={phoneHref}
                        className="text-sm font-semibold text-white transition-colors hover:text-orange-300"
                      >
                        {contact.phone}
                      </a>
                    </ContactRow>

                    <ContactRow icon={<Mail size={19} />} label="Email">
                      <a
                        href={`mailto:${contact.email}`}
                        className="break-all text-sm font-semibold text-white transition-colors hover:text-orange-300"
                      >
                        {contact.email}
                      </a>
                    </ContactRow>

                    <ContactRow icon={<MapPin size={19} />} label="Address">
                      <p className="text-sm font-medium leading-6 text-white">
                        {contact.address}
                      </p>
                    </ContactRow>

                    <ContactRow
                      icon={<Clock size={19} />}
                      label="Working Hours"
                    >
                      <p className="text-sm font-semibold text-white">
                        {contact.workingHours}
                      </p>
                    </ContactRow>
                  </div>
                </div>
              </Reveal>

              {/* Map */}
              <Reveal delay={100}>
                <div className="overflow-hidden rounded-2xl border border-[#173B67]/20 bg-white shadow-lg shadow-blue-950/10 ring-1 ring-[#173B67]/10">
                  {contact.mapUrl ? (
                    <iframe
                      src={contact.mapUrl}
                      title="SK Computer Education location"
                      className="h-56 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <a
                      href={DIRECTIONS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Get directions to SK Computer Education on Google Maps"
                      className="group flex h-56 items-center justify-center bg-gradient-to-br from-[#0F2F5F] to-[#0B2A52] transition hover:brightness-110"
                    >
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 transition group-hover:scale-105">
                          <MapPin size={22} />
                        </div>

                        <p className="text-sm font-semibold text-white">
                          SK Computer Education — SLV Nagar, Tirupati
                        </p>

                        <p className="mt-1 text-xs text-blue-200/80">
                          Tirupati, Andhra Pradesh 517501
                        </p>

                        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition group-hover:bg-orange-600">
                          <Navigation size={14} />
                          Get Directions
                        </span>
                      </div>
                    </a>
                  )}
                  {contact.mapUrl && (
                    <a
                      href={DIRECTIONS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#0F2F5F] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#173B67]"
                    >
                      <Navigation size={16} className="text-orange-400" />
                      Get Directions from your location
                    </a>
                  )}
                </div>
              </Reveal>

              {/* Quick Message */}
              <Reveal delay={150}>
                <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F2F5F] to-[#0B2A52] p-6 text-white shadow-xl shadow-blue-950/15 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-orange-500 before:via-blue-500 before:to-[#173B67] before:content-[''] sm:p-8">
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-300 ring-1 ring-white/10">
                      <MessageCircle size={20} />
                    </div>

                    <p className="pt-1 text-sm text-blue-100/80">
                      Have a quick question? Send us a message and
                      we&apos;ll get back to you.
                    </p>
                  </div>

                  <QuickMessageForm />
                </div>
              </Reveal>
            </div>

            {/* Right Column — Free Demo */}
            <Reveal direction="right" delay={100}>
              <Suspense
                fallback={
                  <div className="h-[600px] animate-pulse rounded-2xl bg-white shadow-sm" />
                }
              >
                <BookDemoForm />
              </Suspense>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-300 ring-1 ring-white/10 transition duration-300 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white group-hover:ring-orange-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-200/70">
          {label}
        </p>

        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
