import { Suspense } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import BookDemoForm from "@/components/BookDemoForm";
import QuickMessageForm from "@/components/QuickMessageForm";

export const metadata = { title: "Contact — SKCE" };

export default function ContactPage() {
  return (
    <>
      {/* Dark hero */}
      <section className="bg-brand-dark px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-extrabold">Contact Us</h1>
          <p className="mt-2 text-slate-300">
            Get in touch or book your free demo class today.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[1fr_1.15fr]">
          {/* Left column: Get in Touch + Map, then Send a Message below */}
          <div className="space-y-10">
            <div>
              <h2 className="mb-5 text-xl font-extrabold text-slate-900">Get in Touch</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
                    <Phone size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-sm font-semibold text-slate-900">+91 98765 00000</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
                    <Mail size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm font-semibold text-slate-900">admissions@skce.in</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Address</p>
                    <p className="text-sm font-semibold text-slate-900">
                      Plot 42, 3rd Floor, HITEC City, Hyderabad — 500081, Telangana
                    </p>
                  </div>
                </div>
              </div>

              {/* Map placeholder — swap for a real embedded map (Google Maps iframe) when ready */}
              <div className="mt-6 flex h-52 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} /> Map — HITEC City, Hyderabad
                </span>
              </div>
            </div>

            <QuickMessageForm />
          </div>

          {/* Right column: Book a Free Demo Class */}
          <Suspense fallback={<div className="h-[600px] rounded-2xl bg-slate-100" />}>
            <BookDemoForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
