import { Suspense } from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import BookDemoForm from "@/components/BookDemoForm";
import QuickMessageForm from "@/components/QuickMessageForm";

export const metadata = {
  title: "Contact — SK Computer Education",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#173B67] px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-400">
              Get in Touch
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Contact Us
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-200 md:text-lg">
              Have a question about our courses or want to experience a free
              demo class? We&apos;re here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Contact Information */}
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-7">
                  <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
                    Contact Information
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold text-[#173B67]">
                    Get in Touch
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Reach out to us for course information, admissions, or
                    any other assistance.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <Phone size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Phone
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        +91 98854 22483
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <Mail size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Email
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        admissions@skce.in
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <MapPin size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Address
                      </p>

                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
                        Door NO: 22-8-215/2a, Old Grand world, Marasa
                        Sarovar Premium, SLV Nagar, Tirupati, Andhra Pradesh
                        517501
                      </p>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <Clock size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Working Hours
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-900">
                        Contact us for current timings
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex h-56 items-center justify-center bg-slate-100">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                      <MapPin size={22} />
                    </div>

                    <p className="text-sm font-bold text-[#173B67]">
                      SKCE — SLV Nagar, Tirupati
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Tirupati, Andhra Pradesh 517501
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Message */}
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <MessageCircle size={20} />
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-[#173B67]">
                      Send a Message
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Have a quick question? Send us a message and we&apos;ll
                      get back to you.
                    </p>
                  </div>
                </div>

                <QuickMessageForm />
              </div>
            </div>

            {/* Right Column — Free Demo */}
            <div>
              <Suspense
                fallback={
                  <div className="h-[600px] animate-pulse rounded-2xl bg-white shadow-sm" />
                }
              >
                <BookDemoForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}