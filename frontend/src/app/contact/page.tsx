import { Suspense } from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import BookDemoForm from "@/components/BookDemoForm";
import PageHero from "@/components/PageHero";
import QuickMessageForm from "@/components/QuickMessageForm";
import Reveal from "@/components/Reveal";

export const metadata = { title: "Contact — SK Computer Education" };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  mapUrl?: string | null;
}

async function getContactSettings(): Promise<ContactSettings> {
  try {
    const response = await fetch(`${API_URL}/contact/settings`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load contact settings");
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Contact settings load error:", error);
    return {
      phone: "+91 98854 22483",
      email: "admissions@skce.in",
      address: "Door NO: 22-8-215/2a, Old Grand world, Marasa Sarovar Premium, SLV Nagar, Tirupati, Andhra Pradesh 517501",
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
      <PageHero eyebrow="Get in Touch" title="Contact Us" description="Have a question about our courses or want to experience a free demo class? We're here to help." align="left" contentWidth="max-w-2xl" />
      <section className="bg-[#F7F9FC] px-6 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <Reveal>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0F2F5F] to-[#0B2A52] p-6 text-white shadow-lg shadow-blue-950/15 sm:p-8">
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300 sm:text-sm">Contact Information</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">Get in Touch</h2>
                    <p className="mt-2 text-sm leading-6 text-blue-100/80">Reach out to us for course information, admissions, or any other assistance.</p>
                  </div>
                  <div className="space-y-5">
                    <ContactRow icon={<Phone size={19} />} label="Phone"><a href={phoneHref} className="text-sm font-semibold text-white transition-colors hover:text-orange-300">{contact.phone}</a></ContactRow>
                    <ContactRow icon={<Mail size={19} />} label="Email"><a href={`mailto:${contact.email}`} className="break-all text-sm font-semibold text-white transition-colors hover:text-orange-300">{contact.email}</a></ContactRow>
                    <ContactRow icon={<MapPin size={19} />} label="Address"><p className="text-sm font-medium leading-6 text-blue-100/90">{contact.address}</p></ContactRow>
                    <ContactRow icon={<Clock size={19} />} label="Working Hours"><p className="text-sm font-semibold text-blue-100/90">{contact.workingHours}</p></ContactRow>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0F2F5F] to-[#0B2A52] shadow-lg shadow-blue-950/15">
                  {contact.mapUrl ? (
                    <iframe src={contact.mapUrl} title="SK Computer Education location" className="h-56 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  ) : (
                    <div className="flex h-56 items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white"><MapPin size={22} /></div>
                        <p className="text-sm font-semibold text-white">SK Computer Education — SLV Nagar, Tirupati</p>
                        <p className="mt-1 text-xs text-blue-100/80">Tirupati, Andhra Pradesh 517501</p>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
              <Reveal delay={150}>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0F2F5F] to-[#0B2A52] p-6 text-white shadow-lg shadow-blue-950/15 sm:p-8">
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white"><MessageCircle size={20} /></div>
                    <p className="pt-1 text-sm text-blue-100/80">Have a quick question? Send us a message and we&apos;ll get back to you.</p>
                  </div>
                  <QuickMessageForm />
                </div>
              </Reveal>
            </div>
            <Reveal direction="right" delay={100}>
              <Suspense fallback={<div className="h-[600px] animate-pulse rounded-2xl bg-gradient-to-b from-[#0F2F5F] to-[#0B2A52] shadow-sm" />}>
                <BookDemoForm />
              </Suspense>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="group flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition duration-300 group-hover:scale-105 group-hover:bg-orange-600">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-300">{label}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
